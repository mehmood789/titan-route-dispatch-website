import express, {type NextFunction, type Request, type Response} from 'express';
import {getApps, initializeApp} from 'firebase-admin/app';
import {getAuth, type DecodedIdToken} from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import firebaseConfig from './firebase-applet-config.json' with {type: 'json'};

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

const OTRUCKING_API_BASE = 'https://chat.otrucking.com';
const OTRUCKING_CACHE_TTL_MS = 10 * 60 * 1000;
const OTRUCKING_MAX_CACHE_ENTRIES = 250;

interface OTruckingSource {
  id?: string;
  title?: string;
  url?: string;
}

interface OTruckingDatasetBlock {
  dataset?: string;
  records?: Array<Record<string, unknown>>;
  source_updated_at?: string | null;
  origin?: string;
  sources?: OTruckingSource[];
}

interface OTruckingCarrierResponse {
  records?: Array<Record<string, unknown>>;
  origin?: string;
  sources?: OTruckingSource[];
  error?: string;
}

interface OTruckingProfileResponse {
  records?: Array<Record<string, unknown>>;
  origin?: string;
  sources?: OTruckingSource[];
  profile?: {
    census?: Record<string, unknown>;
    censusLabels?: {
      registration_status?: string;
      operation_type?: string;
      entity_types?: string[];
      note?: string;
    };
    motus?: OTruckingDatasetBlock[];
    legacy?: OTruckingDatasetBlock[];
    safety?: {
      available?: boolean;
      inspections?: {records?: Array<Record<string, unknown>>; source_updated_at?: string};
      crashes?: {records?: Array<Record<string, unknown>>; source_updated_at?: string};
      outOfServiceOrders?: {records?: Array<Record<string, unknown>>; source_updated_at?: string};
    };
    note?: string;
  };
}

const otruckingLookupCache = new Map<
  string,
  {expiresAt: number; payload: Record<string, unknown>}
>();
let otruckingRateLimitUntil = 0;

function formatAddressParts(
  street?: unknown,
  city?: unknown,
  state?: unknown,
  zip?: unknown
): string {
  const s = String(street || '').trim();
  const c = String(city || '').trim();
  const st = String(state || '').trim();
  const z = String(zip || '').trim();
  const cityStateZip = [c, [st, z].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  if (s && s.toUpperCase() !== 'UNKNOWN') {
    return [s, cityStateZip].filter(Boolean).join(', ');
  }
  return cityStateZip;
}

function formatUsPhone(raw?: unknown): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return String(raw || '').trim();
}

function formatMoneyAmount(raw?: unknown): string {
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) return '';
  return `$${num.toLocaleString('en-US', {maximumFractionDigits: 0})}`;
}

function formatCoverageThousands(raw?: unknown): string {
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) return '';
  // Legacy FMCSA tables store coverage in thousands (e.g. 00750 -> $750,000); Motus stores full dollars
  const dollars = num <= 10000 ? num * 1000 : num;
  return `$${dollars.toLocaleString('en-US', {maximumFractionDigits: 0})}`;
}

async function fetchOTruckingJson<T>(
  url: string,
  timeoutMs = 10_000
): Promise<{
  ok: boolean;
  status: number;
  retryAfterSeconds?: number;
  data: T | null;
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {Accept: 'application/json'},
      signal: controller.signal,
    });
    const retryHeader = res.headers.get('retry-after');
    const parsedRetry = retryHeader ? Number.parseInt(retryHeader, 10) : NaN;
    const retryAfterSeconds =
      Number.isFinite(parsedRetry) && parsedRetry > 0 ? Math.min(3600, parsedRetry) : undefined;
    const data = (await res.json().catch(() => null)) as T | null;
    return {ok: res.ok, status: res.status, retryAfterSeconds, data};
  } catch {
    return {ok: false, status: 503, data: null};
  } finally {
    clearTimeout(timer);
  }
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

    if (rawType !== 'docket' && rawType !== 'dot') {
      res.status(400).json({
        found: false,
        invalidInput: true,
        error: 'Lookup type must be "docket" (MC) or "dot" (USDOT).',
      });
      return;
    }

    let apiValue = '';
    let normalizedMc = '';
    let normalizedDot = '';

    if (rawType === 'docket') {
      const compact = rawValue.toUpperCase().replace(/[\s\-#:]/g, '');
      const match = /^(MC|MX|FF)?(\d{3,8})$/.exec(compact);
      if (!match) {
        res.status(400).json({
          found: false,
          invalidInput: true,
          error: 'Please enter a valid 3 to 8 digit MC number (e.g. MC-721535 or 721535).',
        });
        return;
      }
      const prefix = match[1] || 'MC';
      const digits = match[2];
      apiValue = `${prefix}${digits}`;
      normalizedMc = `${prefix}-${digits}`;
    } else {
      const compact = rawValue.toUpperCase().replace(/^(USDOT|DOT)[\s\-#:]*/i, '').replace(/[\s\-]/g, '');
      if (!/^\d{1,8}$/.test(compact)) {
        res.status(400).json({
          found: false,
          invalidInput: true,
          error: 'Please enter a valid 1 to 8 digit USDOT number (e.g. DOT-2247289 or 2247289).',
        });
        return;
      }
      apiValue = compact;
      normalizedDot = `DOT-${compact}`;
    }

    const cacheKey = `${rawType}:${apiValue}`;
    const cachedEntry = otruckingLookupCache.get(cacheKey);
    if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
      res.json({...cachedEntry.payload, cached: true});
      return;
    }

    if (otruckingRateLimitUntil > Date.now()) {
      const waitSec = Math.max(1, Math.ceil((otruckingRateLimitUntil - Date.now()) / 1000));
      res.status(429).json({
        found: false,
        rateLimited: true,
        retryAfterSeconds: waitSec,
        error: `O Trucking rate limit active. Please wait ${waitSec}s before retrying or use manual entry below.`,
      });
      return;
    }

    // 1. Primary fast carrier lookup endpoint
    const carrierUrl = `${OTRUCKING_API_BASE}/api/carrier?type=${encodeURIComponent(
      rawType
    )}&value=${encodeURIComponent(apiValue)}`;
    const carrierRes = await fetchOTruckingJson<OTruckingCarrierResponse>(carrierUrl, 10_000);

    if (carrierRes.status === 429) {
      const retrySec = carrierRes.retryAfterSeconds || 60;
      otruckingRateLimitUntil = Date.now() + retrySec * 1000;
      res.status(429).json({
        found: false,
        rateLimited: true,
        retryAfterSeconds: retrySec,
        error: `O Trucking rate limit reached (HTTP 429). Please retry in ${retrySec} seconds or continue with manual entry below.`,
      });
      return;
    }

    if (carrierRes.status === 400) {
      res.status(400).json({
        found: false,
        invalidInput: true,
        error: carrierRes.data?.error || 'Invalid carrier identifier format.',
      });
      return;
    }

    if (!carrierRes.ok || !carrierRes.data) {
      res.status(503).json({
        found: false,
        unavailable: true,
        error:
          'O Trucking carrier lookup service is temporarily unavailable. Please retry or use manual entry below.',
      });
      return;
    }

    const carrierRecords = Array.isArray(carrierRes.data.records) ? carrierRes.data.records : [];
    if (carrierRecords.length === 0) {
      res.status(404).json({
        found: false,
        notFound: true,
        error: `No carrier record found in O Trucking for ${
          rawType === 'docket' ? normalizedMc : normalizedDot
        }. Verify the number or continue with manual entry below.`,
      });
      return;
    }

    // 2. Detailed profile endpoint for operating authority, insurance, safety & mailing details
    const profileUrl = `${OTRUCKING_API_BASE}/api/profile?type=${encodeURIComponent(
      rawType
    )}&value=${encodeURIComponent(apiValue)}`;
    const profileRes = await fetchOTruckingJson<OTruckingProfileResponse>(profileUrl, 10_000);

    if (profileRes.status === 429 && profileRes.retryAfterSeconds) {
      otruckingRateLimitUntil = Date.now() + profileRes.retryAfterSeconds * 1000;
    }

    const profileData = profileRes.ok && profileRes.data?.profile ? profileRes.data.profile : null;
    const census = (profileData?.census || carrierRecords[0] || {}) as Record<string, unknown>;
    const censusLabels = profileData?.censusLabels;
    const motusBlocks = Array.isArray(profileData?.motus) ? profileData.motus : [];
    const legacyBlocks = Array.isArray(profileData?.legacy) ? profileData.legacy : [];

    const findRecord = (blocks: OTruckingDatasetBlock[], datasetId: string) =>
      blocks.find((b) => b.dataset === datasetId)?.records?.[0] || null;
    const findBlock = (blocks: OTruckingDatasetBlock[], datasetId: string) =>
      blocks.find((b) => b.dataset === datasetId) || null;

    const motusCarrier = findRecord(motusBlocks, 'inys-ebih');
    const motusAuthHist = findRecord(motusBlocks, 'yu5v-wbh6');
    const motusInsurance = findRecord(motusBlocks, 'c5y8-a4uz');
    const legacyCarrier = findRecord(legacyBlocks, '6eyk-hxee');
    const legacyAuthHist = findBlock(legacyBlocks, '9mw4-x3tu')?.records || [];
    const legacyInsurance = findRecord(legacyBlocks, 'qh9u-swkp');

    const legalCompanyName = String(
      census.legal_name || motusCarrier?.legal_name || legacyCarrier?.legal_name || ''
    ).trim();
    const dbaName = String(census.dba_name || '').trim();

    const dotDigits = String(
      census.dot_number || motusCarrier?.usdot_number || legacyCarrier?.dot_number || ''
    ).replace(/\D/g, '');
    const usdotNumber = dotDigits ? `DOT-${Number(dotDigits)}` : normalizedDot;

    let mcNumber = normalizedMc;
    if (census.docket1) {
      const prefix = String(census.docket1prefix || 'MC').trim().toUpperCase();
      const digits = String(census.docket1).replace(/\D/g, '');
      if (digits) mcNumber = `${prefix}-${digits}`;
    } else if (motusCarrier?.docket_number) {
      const m = /^(MC|MX|FF)(\d+)$/i.exec(String(motusCarrier.docket_number).trim());
      if (m) mcNumber = `${m[1].toUpperCase()}-${m[2]}`;
    }

    const physicalAddress =
      formatAddressParts(census.phy_street, census.phy_city, census.phy_state, census.phy_zip) ||
      formatAddressParts(
        motusCarrier?.bus_street_po,
        motusCarrier?.bus_city,
        motusCarrier?.bus_state_code,
        motusCarrier?.bus_zip_code
      );

    const mailingAddress =
      formatAddressParts(
        census.carrier_mailing_street,
        census.carrier_mailing_city,
        census.carrier_mailing_state,
        census.carrier_mailing_zip
      ) ||
      formatAddressParts(
        motusCarrier?.mail_street_po,
        motusCarrier?.mail_city,
        motusCarrier?.mail_state_code,
        motusCarrier?.mail_zip_code
      );

    const statusParts: string[] = [];
    if (censusLabels?.registration_status) {
      statusParts.push(censusLabels.registration_status);
    } else if (census.status_code === 'A') {
      statusParts.push('Active registration');
    } else if (census.status_code === 'I') {
      statusParts.push('Inactive registration');
    }
    if (censusLabels?.operation_type) {
      statusParts.push(censusLabels.operation_type);
    }
    if (typeof census.classdef === 'string' && census.classdef.trim()) {
      statusParts.push(census.classdef.trim());
    }
    const operatingStatus = statusParts.join(' · ').slice(0, 160);

    // Operating Authority strictly from returned Motus or Legacy datasets (or Census entity labels)
    const authorityParts: string[] = [];
    if (motusCarrier) {
      const authType = String(motusCarrier.op_auth_type || 'Operating Authority').trim();
      const authStatus = String(motusCarrier.op_auth_status || '').trim();
      authorityParts.push(authStatus ? `${authType}: ${authStatus}` : authType);
    } else if (motusAuthHist) {
      const authType = String(motusAuthHist.op_auth_type || 'Authority History').trim();
      const authStatus = String(motusAuthHist.op_auth_status || '').trim();
      const reason = String(motusAuthHist.reason || '').trim();
      authorityParts.push(
        `${authType}: ${authStatus}${reason ? ` (${reason})` : ''}`
      );
    } else if (legacyCarrier || legacyAuthHist.length > 0) {
      const legacyBits: string[] = [];
      if (legacyCarrier?.common_stat && legacyCarrier.common_stat !== 'N') {
        legacyBits.push(`Common: ${legacyCarrier.common_stat}`);
      }
      if (legacyCarrier?.contract_stat && legacyCarrier.contract_stat !== 'N') {
        legacyBits.push(`Contract: ${legacyCarrier.contract_stat}`);
      }
      if (legacyCarrier?.broker_stat && legacyCarrier.broker_stat !== 'N') {
        legacyBits.push(`Broker: ${legacyCarrier.broker_stat}`);
      }
      if (legacyAuthHist.length > 0) {
        const latest = legacyAuthHist[legacyAuthHist.length - 1];
        const desc = String(latest.mod_col_1 || '').trim();
        const act = String(latest.disp_action_desc || latest.original_action_desc || '').trim();
        if (desc || act) legacyBits.push(`${desc}${act ? ` (${act})` : ''}`);
      }
      if (legacyBits.length > 0) {
        authorityParts.push(`Legacy Archive: ${legacyBits.join(', ')}`);
      }
    }
    if (authorityParts.length === 0 && censusLabels?.entity_types?.length) {
      authorityParts.push(`Census Entity: ${censusLabels.entity_types.join(', ')}`);
    }
    const authorityInfo = authorityParts.join(' | ').slice(0, 500);

    // Safety Rating & 24-month record counts strictly from returned Census & Safety profile
    const safetyParts: string[] = [];
    if (typeof census.safety_rating === 'string' && census.safety_rating.trim()) {
      safetyParts.push(`Safety Rating: ${census.safety_rating.trim()}`);
    }
    if (profileData?.safety?.available) {
      const inspCount = profileData.safety.inspections?.records?.[0]?.inspection_records;
      const crashCount = profileData.safety.crashes?.records?.[0]?.crash_vehicle_records;
      const oosCount = profileData.safety.outOfServiceOrders?.records?.length;
      if (inspCount !== undefined) safetyParts.push(`24-mo Inspections: ${inspCount}`);
      if (crashCount !== undefined) safetyParts.push(`24-mo Crashes: ${crashCount}`);
      if (typeof oosCount === 'number' && oosCount > 0) {
        safetyParts.push(`Out-of-Service Orders: ${oosCount}`);
      }
    }
    const safetyInfo = safetyParts.join(' · ').slice(0, 400);

    // Insurance info strictly from Motus (c5y8-a4uz / inys-ebih) or Legacy Archive (qh9u-swkp)
    const insuranceParts: string[] = [];
    if (motusInsurance) {
      const form = String(motusInsurance.ins_form_code || 'Filing').trim();
      const cov = formatMoneyAmount(motusInsurance.max_cov_amount);
      const company = String(motusInsurance.insurance_company_name || '').trim();
      const policy = String(motusInsurance.policy_no || '').trim();
      insuranceParts.push(
        `${form}${cov ? ` (${cov})` : ''}${company ? ` — ${company}` : ''}${
          policy ? ` [Policy ${policy}]` : ''
        }`
      );
    }
    if (motusCarrier) {
      const bipd = formatMoneyAmount(motusCarrier.bipd_file);
      if (bipd) insuranceParts.push(`BIPD Filed: ${bipd}`);
      if (motusCarrier.cargo_file === 'Y') insuranceParts.push('Cargo Filed');
      if (motusCarrier.bond_file === 'Y') insuranceParts.push('Bond Filed');
    } else if (insuranceParts.length === 0 && legacyInsurance) {
      const insType = String(legacyInsurance.mod_col_1 || legacyInsurance.ins_form_code || 'Insurance').trim();
      const cov = formatCoverageThousands(legacyInsurance.max_cov_amount);
      const company = String(legacyInsurance.name_company || '').trim();
      insuranceParts.push(
        `Legacy Archive: ${insType}${cov ? ` (${cov})` : ''}${company ? ` — ${company}` : ''}`
      );
    }
    const insuranceInfo = insuranceParts.join(' | ').slice(0, 500);

    // Power units & drivers strictly from Census
    const rawPowerUnits = census.power_units ?? census.truck_units;
    const powerUnitsNum = Number(rawPowerUnits);
    const rawDrivers = census.total_drivers;
    const rawCdl = census.total_cdl;
    const fleetBits: string[] = [];
    if (rawPowerUnits !== undefined && rawPowerUnits !== null && String(rawPowerUnits).trim() !== '') {
      fleetBits.push(`${String(rawPowerUnits).trim()} power units`);
    }
    if (rawDrivers !== undefined && rawDrivers !== null && String(rawDrivers).trim() !== '') {
      const cdlSuffix =
        rawCdl !== undefined && rawCdl !== null && String(rawCdl).trim() !== ''
          ? ` (${String(rawCdl).trim()} CDL)`
          : '';
      fleetBits.push(`${String(rawDrivers).trim()} drivers${cdlSuffix}`);
    }
    const fleetInfo = fleetBits.join(' · ').slice(0, 160);

    const phone = formatUsPhone(census.phone || motusCarrier?.bus_telno);

    // Underlying source attribution & source update date
    const sourceTitles = new Set<string>();
    for (const s of carrierRes.data.sources || []) {
      if (s.title) sourceTitles.add(s.title);
    }
    for (const block of motusBlocks) {
      if (block.records && block.records.length > 0) {
        for (const s of block.sources || []) {
          if (s.title) sourceTitles.add(s.title);
        }
      }
    }
    if (profileData?.safety?.available) {
      sourceTitles.add('FMCSA Crash & Inspection Archives');
    }

    const sourceUpdatedAt = String(
      census.source_updated_at ||
        findBlock(motusBlocks, 'inys-ebih')?.source_updated_at ||
        ''
    ).trim();

    const responsePayload = {
      found: true,
      lookupType: rawType,
      mcNumber,
      usdotNumber,
      legalCompanyName,
      dbaName,
      physicalAddress,
      mailingAddress,
      operatingStatus,
      authorityInfo,
      safetyInfo,
      insuranceInfo,
      fleetInfo,
      phone,
      powerUnits: Number.isFinite(powerUnitsNum) && powerUnitsNum > 0 ? powerUnitsNum : undefined,
      source: 'O Trucking Public Data API',
      underlyingSources: Array.from(sourceTitles),
      sourceUpdatedAt,
      disclaimer:
        'O Trucking is an independent public-data provider, not a U.S. government agency. Underlying data is attributed to FMCSA public datasets.',
      timestamp: new Date().toISOString(),
    };

    if (otruckingLookupCache.size >= OTRUCKING_MAX_CACHE_ENTRIES) {
      const firstKey = otruckingLookupCache.keys().next().value;
      if (firstKey) otruckingLookupCache.delete(firstKey);
    }
    otruckingLookupCache.set(cacheKey, {
      expiresAt: Date.now() + OTRUCKING_CACHE_TTL_MS,
      payload: responsePayload,
    });

    res.json(responsePayload);
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
