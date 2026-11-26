import firebaseConfig from '../firebase-applet-config.json';
import {performOTruckingLookup} from './shared/otrucking.ts';

interface R2ObjectBodyLike {
  body: ReadableStream<Uint8Array>;
  httpMetadata?: {
    contentType?: string;
  };
}

interface R2BucketLike {
  get(key: string): Promise<R2ObjectBodyLike | null>;
  put(
    key: string,
    value: ArrayBuffer | Uint8Array,
    options?: {httpMetadata?: {contentType?: string}; customMetadata?: Record<string, string>}
  ): Promise<unknown>;
  delete(key: string): Promise<void>;
}

interface AssetsFetcher {
  fetch(request: Request): Promise<Response>;
}

interface ExecutionCtxLike {
  waitUntil(promise: Promise<unknown>): void;
}

export interface WorkerEnv {
  ASSETS: AssetsFetcher;
  TRD_BUCKET?: R2BucketLike;
  ADMIN_EMAIL?: string;
  FIREBASE_PROJECT_ID?: string;
}

interface GoogleJwk extends JsonWebKey {
  kid: string;
  alg?: string;
  use?: string;
}

interface VerifiedFirebaseUser {
  uid: string;
  email?: string;
  email_verified?: boolean;
}

const DEFAULT_ADMIN_EMAIL = 'info@trdispatch.us';
const FIREBASE_JWK_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

const SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://trdispatch.us/</loc>
    <lastmod>2026-11-25</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://trdispatch.us/services</loc>
    <lastmod>2026-11-25</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://trdispatch.us/pricing</loc>
    <lastmod>2026-11-25</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://trdispatch.us/register</loc>
    <lastmod>2026-11-25</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://trdispatch.us/testimonials</loc>
    <lastmod>2026-11-25</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://trdispatch.us/contact</loc>
    <lastmod>2026-11-25</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
`;

const ROBOTS_TXT = `User-agent: Googlebot
Allow: /
Disallow: /admin
Disallow: /login
Disallow: /api/
Disallow: /carrier-docs/
Disallow: /data/

User-agent: *
Allow: /
Disallow: /admin
Disallow: /login
Disallow: /api/
Disallow: /carrier-docs/
Disallow: /data/

Sitemap: https://trdispatch.us/sitemap.xml
`;

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

const EXT_TO_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  pdf: 'application/pdf',
};

let jwkCache: {expiresAt: number; keys: GoogleJwk[]} = {expiresAt: 0, keys: []};

function jsonResponse(data: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

function decodeBase64UrlBytes(input: string): Uint8Array<ArrayBuffer> {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((input.length + 3) % 4);
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function decodeBase64UrlJson<T>(input: string): T {
  const bytes = decodeBase64UrlBytes(input);
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

async function fetchFirebaseJwks(forceRefresh = false): Promise<GoogleJwk[]> {
  if (!forceRefresh && jwkCache.expiresAt > Date.now() && jwkCache.keys.length > 0) {
    return jwkCache.keys;
  }

  const res = await fetch(FIREBASE_JWK_URL, {
    headers: {Accept: 'application/json'},
  });
  if (!res.ok) {
    throw new Error('Unable to fetch Firebase verification keys.');
  }

  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = /max-age=(\d+)/i.exec(cacheControl);
  const maxAgeSec = maxAgeMatch ? Math.min(21600, Math.max(300, Number(maxAgeMatch[1]))) : 3600;
  const payload = (await res.json()) as {keys?: GoogleJwk[]};
  const keys = Array.isArray(payload.keys) ? payload.keys : [];
  jwkCache = {
    expiresAt: Date.now() + maxAgeSec * 1000,
    keys,
  };
  return keys;
}

async function verifyFirebaseIdToken(
  token: string,
  projectId: string
): Promise<VerifiedFirebaseUser> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed Firebase ID token.');
  }

  const [headerSeg, payloadSeg, sigSeg] = parts;
  const header = decodeBase64UrlJson<{alg?: string; kid?: string}>(headerSeg);
  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
    throw new Error('Unsupported JWT algorithm or missing key ID.');
  }

  const payload = decodeBase64UrlJson<{
    aud?: string;
    iss?: string;
    sub?: string;
    exp?: number;
    iat?: number;
    auth_time?: number;
    email?: string;
    email_verified?: boolean;
  }>(payloadSeg);

  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= nowSec - 5) {
    throw new Error('Firebase session expired.');
  }
  if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) {
    throw new Error('Invalid token issued-at timestamp.');
  }
  if (typeof payload.auth_time !== 'number' || payload.auth_time > nowSec + 300) {
    throw new Error('Invalid authentication time.');
  }
  if (payload.aud !== projectId) {
    throw new Error('Invalid token audience.');
  }
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error('Invalid token issuer.');
  }
  if (typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 128) {
    throw new Error('Invalid token subject.');
  }

  let keys = await fetchFirebaseJwks(false);
  let jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) {
    keys = await fetchFirebaseJwks(true);
    jwk = keys.find((k) => k.kid === header.kid);
  }
  if (!jwk) {
    throw new Error('Matching Firebase public key not found.');
  }

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'},
    false,
    ['verify']
  );

  const encoded = new TextEncoder().encode(`${headerSeg}.${payloadSeg}`);
  const signedContent = new Uint8Array(new ArrayBuffer(encoded.byteLength));
  signedContent.set(encoded);
  const signatureBytes = decodeBase64UrlBytes(sigSeg);
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    signatureBytes.buffer,
    signedContent.buffer
  );

  if (!valid) {
    throw new Error('Invalid Firebase ID token signature.');
  }

  return {
    uid: payload.sub,
    email: payload.email,
    email_verified: Boolean(payload.email_verified),
  };
}

async function requireAdminAuth(
  request: Request,
  env: WorkerEnv
): Promise<{ok: true; user: VerifiedFirebaseUser} | {ok: false; response: Response}> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      ok: false,
      response: jsonResponse({error: 'Unauthorized: Missing admin credentials'}, 401),
    };
  }

  const token = authHeader.slice('Bearer '.length).trim();
  const projectId = (env.FIREBASE_PROJECT_ID || firebaseConfig.projectId).trim();
  const adminEmail = (env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();

  try {
    const decoded = await verifyFirebaseIdToken(token, projectId);
    if (!decoded.email_verified || decoded.email?.toLowerCase() !== adminEmail) {
      return {
        ok: false,
        response: jsonResponse({error: 'Forbidden: Authorized administrator access required'}, 403),
      };
    }
    return {ok: true, user: decoded};
  } catch {
    return {
      ok: false,
      response: jsonResponse({error: 'Unauthorized: Invalid or expired session'}, 401),
    };
  }
}

function parseDataUrl(dataUrl: string): {mime: string; bytes: Uint8Array} | null {
  const match = /^data:([^;,]*)(?:;[^;,]*)*;base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl.trim());
  if (!match) return null;
  const mime = (match[1] || 'application/octet-stream').toLowerCase();
  const binary = atob(match[2].replace(/\s+/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return {mime, bytes};
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionCtxLike): Promise<Response> {
    const url = new URL(request.url);
    const {pathname} = url;
    const method = request.method.toUpperCase();

    // 1. Sitemap and robots.txt (always served with exact XML / plain text MIME types)
    if (pathname === '/sitemap.xml' && (method === 'GET' || method === 'HEAD')) {
      return new Response(method === 'HEAD' ? null : SITEMAP_XML, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    if (pathname === '/robots.txt' && (method === 'GET' || method === 'HEAD')) {
      return new Response(method === 'HEAD' ? null : ROBOTS_TXT, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // 2. Health endpoint
    if (pathname === '/api/health' && method === 'GET') {
      return jsonResponse({
        status: 'ok',
        service: 'titan-route-dispatch',
        runtime: 'cloudflare-worker',
      });
    }

    // 3. Admin session verification endpoint
    if (pathname === '/api/auth/admin-status' && method === 'GET') {
      const authResult = await requireAdminAuth(request, env);
      if (!authResult.ok) return authResult.response;
      return jsonResponse({authorized: true});
    }

    // 4. O Trucking public carrier lookup endpoint (MC docket or USDOT)
    if (pathname === '/api/otrucking/lookup' && method === 'GET') {
      const rawType = String(url.searchParams.get('type') || 'docket').trim().toLowerCase();
      const rawValue = String(url.searchParams.get('value') || '').trim();

      const cfCache = (globalThis as unknown as {caches?: {default?: Cache}}).caches?.default;
      const cacheReq = new Request(url.toString(), {method: 'GET'});

      if (cfCache) {
        const edgeHit = await cfCache.match(cacheReq);
        if (edgeHit) {
          const hitData = (await edgeHit.json().catch(() => null)) as Record<string, unknown> | null;
          if (hitData && hitData.found) {
            return jsonResponse({...hitData, cached: true}, 200, {
              'Cache-Control': 'public, max-age=300',
            });
          }
        }
      }

      const result = await performOTruckingLookup(rawType, rawValue);
      const response = jsonResponse(
        result.body,
        result.status,
        result.status === 200 ? {'Cache-Control': 'public, max-age=300'} : undefined
      );

      if (cfCache && result.status === 200 && result.body.found) {
        ctx.waitUntil(cfCache.put(cacheReq, response.clone()));
      }

      return response;
    }

    // 5. Admin media upload (Cloudflare R2 when TRD_BUCKET is bound)
    if (pathname === '/api/media/upload' && method === 'POST') {
      const authResult = await requireAdminAuth(request, env);
      if (!authResult.ok) return authResult.response;

      if (!env.TRD_BUCKET) {
        return jsonResponse(
          {
            error:
              'Persistent media storage (TRD_BUCKET R2 binding) is not configured in Cloudflare Workers yet.',
          },
          503
        );
      }

      const body = (await request.json().catch(() => ({}))) as {
        fileName?: string;
        dataUrl?: string;
      };
      if (!body.dataUrl || typeof body.dataUrl !== 'string') {
        return jsonResponse({error: 'Missing file payload'}, 400);
      }

      const parsed = parseDataUrl(body.dataUrl);
      if (!parsed) {
        return jsonResponse({error: 'Invalid base64 image format'}, 400);
      }

      const ext = MIME_TO_EXT[parsed.mime];
      if (!ext || ext === 'pdf') {
        return jsonResponse(
          {error: 'Unsupported image type. Use PNG, SVG, JPG, WebP, or ICO.'},
          400
        );
      }
      if (parsed.bytes.length > 4 * 1024 * 1024) {
        return jsonResponse({error: 'Image exceeds 4 MB limit'}, 400);
      }

      const cleanBase = String(body.fileName || 'asset')
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 48);
      const savedName = `${cleanBase || 'trd_media'}_${Date.now()}.${ext}`;

      await env.TRD_BUCKET.put(`public_media/${savedName}`, parsed.bytes, {
        httpMetadata: {contentType: parsed.mime},
      });

      return jsonResponse(
        {
          fileName: savedName,
          mimeType: parsed.mime,
          url: `/uploads/${savedName}`,
          sizeLabel: formatSize(parsed.bytes.length),
        },
        201
      );
    }

    // 6. Admin media delete
    if (pathname.startsWith('/api/media/') && method === 'DELETE') {
      const authResult = await requireAdminAuth(request, env);
      if (!authResult.ok) return authResult.response;

      if (!env.TRD_BUCKET) {
        return jsonResponse({deleted: false, error: 'TRD_BUCKET R2 binding is not configured.'}, 503);
      }

      const rawName = decodeURIComponent(pathname.slice('/api/media/'.length));
      if (!/^[a-zA-Z0-9_.-]+$/.test(rawName)) {
        return jsonResponse({error: 'Invalid file name'}, 400);
      }

      await env.TRD_BUCKET.delete(`public_media/${rawName}`);
      return jsonResponse({deleted: true});
    }

    // 7. Serve uploaded media from R2 (falling back to static assets for bundled files)
    if (pathname.startsWith('/uploads/') && (method === 'GET' || method === 'HEAD')) {
      const rawName = decodeURIComponent(pathname.slice('/uploads/'.length));
      if (env.TRD_BUCKET && /^[a-zA-Z0-9_.-]+$/.test(rawName)) {
        const obj = await env.TRD_BUCKET.get(`public_media/${rawName}`);
        if (obj) {
          const ext = rawName.split('.').pop()?.toLowerCase() || '';
          const contentType =
            obj.httpMetadata?.contentType || EXT_TO_MIME[ext] || 'application/octet-stream';
          return new Response(method === 'HEAD' ? null : obj.body, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          });
        }
      }
      return env.ASSETS.fetch(request);
    }

    // 8. Private Carrier Compliance Documents Upload (R2 fallback when Firebase Storage bucket is unavailable)
    if (pathname === '/api/carrier-docs' && method === 'POST') {
      if (!env.TRD_BUCKET) {
        return jsonResponse(
          {
            error:
              'Document upload storage requires Firebase Storage or a configured Cloudflare R2 bucket (TRD_BUCKET).',
          },
          503
        );
      }

      const body = (await request.json().catch(() => ({}))) as {
        fileName?: string;
        dataUrl?: string;
      };
      if (!body.dataUrl || typeof body.dataUrl !== 'string') {
        return jsonResponse({error: 'Missing compliance document payload'}, 400);
      }

      const parsed = parseDataUrl(body.dataUrl);
      if (!parsed || parsed.bytes.length === 0) {
        return jsonResponse({error: 'Invalid or empty document encoding'}, 400);
      }

      let ext = MIME_TO_EXT[parsed.mime];
      const rawFileName = String(body.fileName || '');
      if (!ext && (parsed.mime === 'application/octet-stream' || parsed.mime === '')) {
        const nameExt = rawFileName.split('.').pop()?.toLowerCase() || '';
        if (nameExt === 'pdf' || nameExt === 'png' || nameExt === 'jpg' || nameExt === 'jpeg') {
          ext = nameExt === 'jpeg' ? 'jpg' : nameExt;
        }
      }

      if (!ext || ext === 'svg' || ext === 'ico') {
        return jsonResponse({error: 'Compliance documents must be PDF, PNG, or JPG.'}, 400);
      }

      if (parsed.bytes.length > 3 * 1024 * 1024) {
        return jsonResponse({error: 'Compliance document must be 3 MB or smaller.'}, 400);
      }

      const docId = `cdoc_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}.${ext}`;
      await env.TRD_BUCKET.put(`private_carrier_docs/${docId}`, parsed.bytes, {
        httpMetadata: {contentType: EXT_TO_MIME[ext] || parsed.mime},
      });

      const baseName = rawFileName.split(/[/\\]/).pop() || docId;
      return jsonResponse(
        {
          docId,
          fileName: baseName.slice(0, 120),
          sizeLabel: formatSize(parsed.bytes.length),
        },
        201
      );
    }

    // 9. Admin-Only Compliance Document Download
    if (pathname.startsWith('/api/carrier-docs/') && method === 'GET') {
      const authResult = await requireAdminAuth(request, env);
      if (!authResult.ok) return authResult.response;

      if (!env.TRD_BUCKET) {
        return jsonResponse({error: 'Private compliance vault is not configured.'}, 503);
      }

      const safeId = decodeURIComponent(pathname.slice('/api/carrier-docs/'.length));
      if (!/^[a-zA-Z0-9_.-]+$/.test(safeId)) {
        return jsonResponse({error: 'Invalid document identifier'}, 400);
      }

      const obj = await env.TRD_BUCKET.get(`private_carrier_docs/${safeId}`);
      if (!obj) {
        return jsonResponse({error: 'Document not found'}, 404);
      }

      const ext = safeId.split('.').pop()?.toLowerCase() || '';
      const contentType =
        obj.httpMetadata?.contentType || EXT_TO_MIME[ext] || 'application/octet-stream';

      return new Response(obj.body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${safeId}"`,
          'Cache-Control': 'private, no-store',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      });
    }

    // Never allow unknown /api/* routes to fall through to index.html
    if (pathname.startsWith('/api/')) {
      return jsonResponse({error: 'API endpoint not found'}, 404);
    }

    // 10. All static assets and SPA frontend routes
    return env.ASSETS.fetch(request);
  },
};
