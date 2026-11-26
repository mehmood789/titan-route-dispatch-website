import express, {type NextFunction, type Request, type Response} from 'express';
import {getApps, initializeApp} from 'firebase-admin/app';
import {getAuth, type DecodedIdToken} from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import firebaseConfig from './firebase-applet-config.json' with {type: 'json'};
import {performOTruckingLookup} from './src/shared/otrucking.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'info@trdispatch.us').toLowerCase();

if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}
const adminAuth = getAuth();

const PUBLIC_UPLOADS_DIR = path.resolve(__dirname, 'public', 'uploads');
const PRIVATE_CARRIER_DOCS_DIR = path.resolve(__dirname, 'data', 'carrier_docs');

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, {recursive: true});
  }
}

interface AuthedRequest extends Request {
  user?: DecodedIdToken;
}

async function requireAdminAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({error: 'Unauthorized: Missing admin credentials'});
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (!decoded.email_verified || decoded.email?.toLowerCase() !== ADMIN_EMAIL) {
      res.status(403).json({error: 'Forbidden: Authorized administrator access required'});
      return;
    }
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Admin token verification failed:', err);
    res.status(401).json({error: 'Unauthorized: Invalid or expired session'});
  }
}

const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
  'application/pdf': 'pdf',
};

function parseDataUrl(dataUrl: string): {mime: string; buffer: Buffer} | null {
  const match = /^data:([^;,]*)(?:;[^;,]*)*;base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl.trim());
  if (!match) return null;
  const mime = (match[1] || 'application/octet-stream').toLowerCase();
  const cleanBase64 = match[2].replace(/\s+/g, '');
  const buffer = Buffer.from(cleanBase64, 'base64');
  return {mime, buffer};
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}



async function startServer() {
  const app = express();
  app.use(express.json({limit: '10mb'}));

  ensureDir(PUBLIC_UPLOADS_DIR);
  ensureDir(PRIVATE_CARRIER_DOCS_DIR);

  app.get('/api/health', (_req, res) => {
    res.json({status: 'ok', service: 'titan-route-dispatch'});
  });

  app.get('/api/auth/admin-status', requireAdminAuth, (_req: AuthedRequest, res: Response) => {
    res.json({authorized: true});
  });

  // Public O Trucking Carrier Lookup Proxy (read-only, cached, rate-limit aware, no API key required)
  app.get('/api/otrucking/lookup', async (req: Request, res: Response) => {
    const rawType = String(req.query.type || 'docket').trim().toLowerCase();
    const rawValue = String(req.query.value || '').trim();
    const result = await performOTruckingLookup(rawType, rawValue);
    res.status(result.status).json(result.body);
  });

  // Admin Media Upload (Protected by Firebase ID token)
  app.post('/api/media/upload', requireAdminAuth, (req: AuthedRequest, res: Response) => {
    const {fileName, dataUrl} = req.body as {fileName?: string; dataUrl?: string};
    if (!dataUrl || typeof dataUrl !== 'string') {
      res.status(400).json({error: 'Missing file payload'});
      return;
    }

    const parsed = parseDataUrl(dataUrl);
    if (!parsed) {
      res.status(400).json({error: 'Invalid base64 image format'});
      return;
    }

    const ext = MIME_TO_EXT[parsed.mime];
    if (!ext || ext === 'pdf') {
      res.status(400).json({error: 'Unsupported image type. Use PNG, SVG, JPG, WebP, or ICO.'});
      return;
    }

    if (parsed.buffer.length > 4 * 1024 * 1024) {
      res.status(400).json({error: 'Image exceeds 4 MB limit'});
      return;
    }

    const cleanBase = String(fileName || 'asset')
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 48);
    const savedName = `${cleanBase || 'trd_media'}_${Date.now()}.${ext}`;
    const resolved = path.resolve(PUBLIC_UPLOADS_DIR, savedName);

    if (!resolved.startsWith(PUBLIC_UPLOADS_DIR + path.sep)) {
      res.status(400).json({error: 'Invalid file destination'});
      return;
    }

    fs.writeFileSync(resolved, parsed.buffer);
    res.status(201).json({
      fileName: savedName,
      mimeType: parsed.mime,
      url: `/uploads/${savedName}`,
      sizeLabel: formatSize(parsed.buffer.length),
    });
  });

  // Admin Media File Delete (Protected)
  app.delete('/api/media/:fileName', requireAdminAuth, (req: AuthedRequest, res: Response) => {
    const rawName = path.basename(String(req.params.fileName || ''));
    if (!/^[a-zA-Z0-9_.\-]+$/.test(rawName)) {
      res.status(400).json({error: 'Invalid file name'});
      return;
    }
    const resolved = path.resolve(PUBLIC_UPLOADS_DIR, rawName);
    if (!resolved.startsWith(PUBLIC_UPLOADS_DIR + path.sep)) {
      res.status(400).json({error: 'Invalid file path'});
      return;
    }
    if (fs.existsSync(resolved)) {
      fs.unlinkSync(resolved);
    }
    res.json({deleted: true});
  });

  // Public Carrier Compliance Document Upload (Stored outside public web root)
  app.post('/api/carrier-docs', (req: Request, res: Response) => {
    const {fileName, dataUrl} = req.body as {fileName?: string; dataUrl?: string};
    if (!dataUrl || typeof dataUrl !== 'string') {
      res.status(400).json({error: 'Missing compliance document payload'});
      return;
    }

    const parsed = parseDataUrl(dataUrl);
    if (!parsed || parsed.buffer.length === 0) {
      res.status(400).json({error: 'Invalid or empty document encoding'});
      return;
    }

    let ext = MIME_TO_EXT[parsed.mime];
    if (!ext && (parsed.mime === 'application/octet-stream' || parsed.mime === '')) {
      const nameExt = path.extname(String(fileName || '')).toLowerCase().replace('.', '');
      if (nameExt === 'pdf' || nameExt === 'png' || nameExt === 'jpg' || nameExt === 'jpeg') {
        ext = nameExt === 'jpeg' ? 'jpg' : nameExt;
      }
    }

    if (!ext || ext === 'svg' || ext === 'ico') {
      res.status(400).json({error: 'Compliance documents must be PDF, PNG, or JPG.'});
      return;
    }

    if (parsed.buffer.length > 3 * 1024 * 1024) {
      res.status(400).json({error: 'Compliance document must be 3 MB or smaller.'});
      return;
    }

    const docId = `cdoc_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}.${ext}`;
    const resolved = path.resolve(PRIVATE_CARRIER_DOCS_DIR, docId);
    if (!resolved.startsWith(PRIVATE_CARRIER_DOCS_DIR + path.sep)) {
      res.status(400).json({error: 'Invalid document path'});
      return;
    }

    fs.writeFileSync(resolved, parsed.buffer);
    res.status(201).json({
      docId,
      fileName: path.basename(String(fileName || docId)).slice(0, 120),
      sizeLabel: formatSize(parsed.buffer.length),
    });
  });

  // Admin-Only Compliance Document Download
  app.get('/api/carrier-docs/:docId', requireAdminAuth, (req: AuthedRequest, res: Response) => {
    const safeId = path.basename(String(req.params.docId || ''));
    if (!/^[a-zA-Z0-9_.\-]+$/.test(safeId)) {
      res.status(400).json({error: 'Invalid document identifier'});
      return;
    }

    const resolved = path.resolve(PRIVATE_CARRIER_DOCS_DIR, safeId);
    if (!resolved.startsWith(PRIVATE_CARRIER_DOCS_DIR + path.sep) || !fs.existsSync(resolved)) {
      res.status(404).json({error: 'Document not found'});
      return;
    }

    res.download(resolved, safeId);
  });

  app.get('/sitemap.xml', (_req: Request, res: Response) => {
    const prodPath = path.resolve(__dirname, 'dist', 'sitemap.xml');
    const pubPath = path.resolve(__dirname, 'public', 'sitemap.xml');
    const targetPath =
      process.env.NODE_ENV === 'production' && fs.existsSync(prodPath) ? prodPath : pubPath;
    if (!fs.existsSync(targetPath)) {
      res.status(404).type('text/plain; charset=utf-8').send('Sitemap not found');
      return;
    }
    res.status(200);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.sendFile(targetPath);
  });

  app.get('/robots.txt', (_req: Request, res: Response) => {
    const prodPath = path.resolve(__dirname, 'dist', 'robots.txt');
    const pubPath = path.resolve(__dirname, 'public', 'robots.txt');
    const targetPath =
      process.env.NODE_ENV === 'production' && fs.existsSync(prodPath) ? prodPath : pubPath;
    if (!fs.existsSync(targetPath)) {
      res.status(404).type('text/plain; charset=utf-8').send('robots.txt not found');
      return;
    }
    res.status(200);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.sendFile(targetPath);
  });

  app.use('/uploads', express.static(PUBLIC_UPLOADS_DIR));

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Titan Route Dispatch LLC running on http://0.0.0.0:${port}`);
  });
}

startServer();
