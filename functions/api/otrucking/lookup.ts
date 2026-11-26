import {performOTruckingLookup} from '../../../src/shared/otrucking.ts';

export async function onRequestGet({request}: {request: Request}): Promise<Response> {
  const url = new URL(request.url);
  const rawTypeParam = String(url.searchParams.get('type') || 'docket').trim().toLowerCase();
  const normalizedType = rawTypeParam === 'mc' ? 'docket' : rawTypeParam;
  const rawValue = String(url.searchParams.get('value') || '').trim();

  const result = await performOTruckingLookup(normalizedType, rawValue);
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': result.status === 200 ? 'public, max-age=300' : 'no-store',
    },
  });
}
