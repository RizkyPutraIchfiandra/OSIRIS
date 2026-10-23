import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { clearNusawatchCache } from '@/lib/nusawatch/cache';
import { BMKG_ENDPOINTS } from '@/lib/nusawatch/registry';
import autogempa from '@/lib/nusawatch/__fixtures__/bmkg-autogempa.json';
import gempaterkini from '@/lib/nusawatch/__fixtures__/bmkg-gempaterkini.json';
import gempadirasakan from '@/lib/nusawatch/__fixtures__/bmkg-gempadirasakan.json';
import { GET } from './route';
import type { EventsResponse } from '@/lib/nusawatch/types';

const BASE = 'https://nusawatch.test/api/nusawatch/events';

function stubFeeds(options: { status?: number; empty?: boolean } = {}) {
  const payloads: Record<keyof typeof BMKG_ENDPOINTS, unknown> = {
    autogempa,
    gempaterkini,
    gempadirasakan,
  };

  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const key = (Object.keys(BMKG_ENDPOINTS) as Array<keyof typeof BMKG_ENDPOINTS>).find(candidate =>
      url.endsWith(`${candidate}.json`),
    );
    if (!key) throw new Error(`unexpected URL in test: ${url}`);
    if (options.status) return new Response('', { status: options.status });
    if (options.empty) return new Response(JSON.stringify({ Infogempa: { gempa: [] } }), { status: 200 });
    return new Response(JSON.stringify(payloads[key]), { status: 200 });
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const request = (query = '') => new Request(query ? `${BASE}?${query}` : BASE);

beforeEach(() => clearNusawatchCache());
afterEach(() => vi.unstubAllGlobals());

describe('GET /api/nusawatch/events', () => {
  it('returns canonical, deduplicated events with per-source provenance', async () => {
    stubFeeds();

    const response = await GET(request());
    const body = (await response.json()) as EventsResponse;

    expect(response.status).toBe(200);
    expect(response.headers.get('X-NusaWatch-Partial')).toBe('false');
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=60');

    expect(body.total).toBe(5);
    expect(body.matched).toBe(5);
    expect(body.partial).toBe(false);
    expect(body.ignoredParams).toEqual([]);

    expect(body.sources).toHaveLength(1);
    expect(body.sources[0]).toMatchObject({
      id: 'bmkg',
      name: 'BMKG',
      health: 'ok',
      eventCount: 5,
      servedStale: false,
    });
    expect(body.sources[0].homepage).toBe('https://www.bmkg.go.id/gempabumi/gempabumi-terkini.bmkg');
    expect(body.sources[0].limitations.length).toBeGreaterThan(0);

    // Same earthquake from three endpoints, merged, with the source text kept.
    const bengkulu = body.events.find(event => event.eventTime === '2026-10-22T10:57:49.000Z');
    expect(bengkulu?.feltReports).toBe('III Kota Bengkulu, II - III Curup, III Arga Makmur');
    expect(bengkulu?.potential).toBe('Tidak berpotensi tsunami');
    expect(bengkulu?.limitations.length).toBeGreaterThan(0);
  });

  it('orders newest first', async () => {
    stubFeeds();
    const body = (await (await GET(request())).json()) as EventsResponse;
    const times = body.events.map(event => event.eventTime ?? '');
    expect(times).toEqual([...times].sort().reverse());
  });

  it('applies region and category filters server-side', async () => {
    stubFeeds();

    const maluku = (await (await GET(request('region=maluku'))).json()) as EventsResponse;
    expect(maluku.matched).toBe(1);
    expect(maluku.events[0].location?.region).toBe('maluku');
    // Filtering does not change the size of the underlying pool.
    expect(maluku.total).toBe(5);

    const noMatch = (await (await GET(request('category=flood'))).json()) as EventsResponse;
    expect(noMatch.matched).toBe(0);
    expect(noMatch.events).toEqual([]);
  });

  it('says which parameter it could not use', async () => {
    stubFeeds();
    const body = (await (await GET(request('category=meteor&since=kemarin'))).json()) as EventsResponse;
    expect(body.ignoredParams).toEqual(['category', 'since']);
    expect(body.matched).toBe(5);
  });

  it('answers from cache instead of asking BMKG again within the TTL', async () => {
    const fetchMock = stubFeeds();

    await GET(request());
    await GET(request());

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('treats an empty but healthy feed as empty, not as a failure', async () => {
    stubFeeds({ empty: true });

    const response = await GET(request());
    const body = (await response.json()) as EventsResponse;

    expect(response.status).toBe(200);
    expect(body.total).toBe(0);
    expect(body.events).toEqual([]);
    expect(body.sources[0].health).toBe('ok');
  });

  it('returns 503 only when every source failed, with the reason attached', async () => {
    stubFeeds({ status: 503 });

    const response = await GET(request());
    const body = (await response.json()) as EventsResponse;

    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(body.partial).toBe(true);
    expect(body.events).toEqual([]);
    expect(body.sources[0].health).toBe('failed');
    expect(body.sources[0].error).toContain('BMKG tidak dapat dihubungi');
  });
});
