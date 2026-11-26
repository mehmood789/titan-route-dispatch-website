export const OTRUCKING_API_BASE = 'https://chat.otrucking.com';
export const OTRUCKING_CACHE_TTL_MS = 10 * 60 * 1000;
export const OTRUCKING_MAX_CACHE_ENTRIES = 250;

export interface OTruckingSource {
  id?: string;
  title?: string;
  url?: string;
}

export interface OTruckingDatasetBlock {
  dataset?: string;
  records?: Array<Record<string, unknown>>;
  source_updated_at?: string | null;
  origin?: string;
  sources?: OTruckingSource[];
}

export interface OTruckingCarrierResponse {
  records?: Array<Record<string, unknown>>;
  origin?: string;
  sources?: OTruckingSource[];
  error?: string;
}

export interface OTruckingProfileResponse {
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

export interface OTruckingLookupResult {
  status: number;
  body: Record<string, unknown>;
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
      headers: {
        Accept: 'application/json',
        'User-Agent': 'TitanRouteDispatch/1.0 (+https://trdispatch.us)',
      },
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

export async function performOTruckingLookup(
  rawTypeInput: string,
  rawValueInput: string
): Promise<OTruckingLookupResult> {
  const rawType = rawTypeInput.trim().toLowerCase();
  const rawValue = rawValueInput.trim();

  if (rawType !== 'docket' && rawType !== 'dot') {
    return {
      status: 400,
      body: {
        found: false,
        invalidInput: true,
        error: 'Lookup type must be "docket" (MC) or "dot" (USDOT).',
      },
    };
  }

  let apiValue = '';
  let normalizedMc = '';
  let normalizedDot = '';

  if (rawType === 'docket') {
    const compact = rawValue.toUpperCase().replace(/[\s\-#:]/g, '');
    const match = /^(MC|MX|FF)?(\d{3,8})$/.exec(compact);
    if (!match) {
      return {
        status: 400,
        body: {
          found: false,
          invalidInput: true,
          error: 'Please enter a valid 3 to 8 digit MC number (e.g. MC-721535 or 721535).',
        },
      };
    }
    const prefix = match[1] || 'MC';
    const digits = match[2];
    apiValue = `${prefix}${digits}`;
    normalizedMc = `${prefix}-${digits}`;
  } else {
    const compact = rawValue
      .toUpperCase()
      .replace(/^(USDOT|DOT)[\s\-#:]*/i, '')
      .replace(/[\s\-]/g, '');
    if (!/^\d{1,8}$/.test(compact)) {
      return {
        status: 400,
        body: {
          found: false,
          invalidInput: true,
          error: 'Please enter a valid 1 to 8 digit USDOT number (e.g. DOT-2247289 or 2247289).',
        },
      };
    }
    apiValue = compact;
    normalizedDot = `DOT-${compact}`;
  }

  const cacheKey = `${rawType}:${apiValue}`;
  const cachedEntry = otruckingLookupCache.get(cacheKey);
  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return {
      status: 200,
      body: {...cachedEntry.payload, cached: true},
    };
  }

  if (otruckingRateLimitUntil > Date.now()) {
    const waitSec = Math.max(1, Math.ceil((otruckingRateLimitUntil - Date.now()) / 1000));
    return {
      status: 429,
      body: {
        found: false,
        rateLimited: true,
        retryAfterSeconds: waitSec,
        error: `O Trucking rate limit active. Please wait ${waitSec}s before retrying or use manual entry below.`,
      },
    };
  }

  // 1. Primary fast carrier lookup endpoint
  const carrierUrl = `${OTRUCKING_API_BASE}/api/carrier?type=${encodeURIComponent(
    rawType
  )}&value=${encodeURIComponent(apiValue)}`;
  const carrierRes = await fetchOTruckingJson<OTruckingCarrierResponse>(carrierUrl, 10_000);

  if (carrierRes.status === 429) {
    const retrySec = carrierRes.retryAfterSeconds || 60;
    otruckingRateLimitUntil = Date.now() + retrySec * 1000;
    return {
      status: 429,
      body: {
        found: false,
        rateLimited: true,
        retryAfterSeconds: retrySec,
        error: `O Trucking rate limit reached (HTTP 429). Please retry in ${retrySec} seconds or continue with manual entry below.`,
      },
    };
  }

  if (carrierRes.status === 400) {
    return {
      status: 400,
      body: {
        found: false,
        invalidInput: true,
        error: carrierRes.data?.error || 'Invalid carrier identifier format.',
      },
    };
  }

  if (!carrierRes.ok || !carrierRes.data) {
    return {
      status: 503,
      body: {
        found: false,
        unavailable: true,
        error:
          'O Trucking carrier lookup service is temporarily unavailable. Please retry or use manual entry below.',
      },
    };
  }

  const carrierRecords = Array.isArray(carrierRes.data.records) ? carrierRes.data.records : [];
  if (carrierRecords.length === 0) {
    return {
      status: 404,
      body: {
        found: false,
        notFound: true,
        error: `No carrier record found in O Trucking for ${
          rawType === 'docket' ? normalizedMc : normalizedDot
        }. Verify the number or continue with manual entry below.`,
      },
    };
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

  const authorityParts: string[] = [];
  if (motusCarrier) {
    const authType = String(motusCarrier.op_auth_type || 'Operating Authority').trim();
    const authStatus = String(motusCarrier.op_auth_status || '').trim();
    authorityParts.push(authStatus ? `${authType}: ${authStatus}` : authType);
  } else if (motusAuthHist) {
    const authType = String(motusAuthHist.op_auth_type || 'Authority History').trim();
    const authStatus = String(motusAuthHist.op_auth_status || '').trim();
    const reason = String(motusAuthHist.reason || '').trim();
    authorityParts.push(`${authType}: ${authStatus}${reason ? ` (${reason})` : ''}`);
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
    const insType = String(
      legacyInsurance.mod_col_1 || legacyInsurance.ins_form_code || 'Insurance'
    ).trim();
    const cov = formatCoverageThousands(legacyInsurance.max_cov_amount);
    const company = String(legacyInsurance.name_company || '').trim();
    insuranceParts.push(
      `Legacy Archive: ${insType}${cov ? ` (${cov})` : ''}${company ? ` — ${company}` : ''}`
    );
  }
  const insuranceInfo = insuranceParts.join(' | ').slice(0, 500);

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

  const responsePayload: Record<string, unknown> = {
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

  return {
    status: 200,
    body: responsePayload,
  };
}
