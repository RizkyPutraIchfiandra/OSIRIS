import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { clearNusawatchCache } from '@/lib/nusawatch/cache';
import { BMKG_ENDPOINTS, USGS_ENDPOINT } from '@/lib/nusawatch/registry';
import autogempa from '@/lib/nusawatch/__fixtures__/bmkg-autogempa.json';
import gempaterkini from '@/lib/nusawatch/__fixtures__/bmkg-gempaterkini.json';
import gempadirasakan from '@/lib/nusawatch/__fixtures__/bmkg-gempadirasakan.json';
import usgsIndonesia from '@/lib/nusawatch/__fixtures__/usgs-indonesia.json';
import { GET } from './route';
import type { EventsResponse } from '@/lib/nusawatch/types';

const BASE = 'https://nusawatch.test/api/nusawatch/events';

function stubFeeds(
  options: {
    status?: number;
    empty?: boolean;
    failBmkg?: boolean;
    failUsgs?: boolean;
  } = {},
) {
  const payloads: Record<keyof typeof BMKG_ENDPOINTS, unknown> = {
    autogempa,
    gempaterkini,
    gempadirasakan,
  };

  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.startsWith(USGS_ENDPOINT)) {
      if (options.status || options.failUsgs) {
        return new Response('', { status: options.status ?? 503 });
      }
      if (options.empty) {
        return new Response(JSON.stringify({ type: 'FeatureCollection', features: [] }), {
          status: 200,
        });
      }
      return new Response(JSON.stringify(usgsIndonesia), { status: 200 });
    }

    const key = (Object.keys(BMKG_ENDPOINTS) as Array<keyof typeof BMKG_ENDPOINTS>).find(candidate =>
      url.endsWith(`${candidate}.json`),
    );
    if (!key) throw new Error(`unexpected URL in test: ${url}`);
    if (options.status || options.failBmkg) {
      return new Response('', { status: options.status ?? 503 });
    }
    if (options.empty) return new Response(JSON.stringify({ Infogempa: { gempa: [] } }), { status: 200 });
    return new Response(JSON.stringify(payloads[key]), { status: 200 });
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const request = (query = '') => new Request(query ? `${BASE}?${query}` : BASE);

const sourceById = (body: EventsResponse, id: string) => body.sources.find(source => source.id === id);

beforeEach(() => clearNusawatchCache());
afterEach(() => vi.unstubAllGlobals());

describe('GET /api/nusawatch/events', () => {
  it('returns canonical events from both sources with per-source provenance', async () => {
    stubFeeds();

    const response = await GET(request());
    const body = (await response.json()) as EventsResponse;

    expect(response.status).toBe(200);
    expect(response.headers.get('X-NusaWatch-Partial')).toBe('false');
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=60');

    // 5 BMKG records + 4 USGS records; two of the USGS records describe
    // earthquakes BMKG already reported (Bengkulu and Maluku), so they are
    // folded in as cross-checks instead of duplicated.
    expect(body.total).toBe(7);
    expect(body.matched).toBe(7);
    expect(body.partial).toBe(false);
    expect(body.ignoredParams).toEqual([]);

    expect(body.sources).toHaveLength(2);
    expect(sourceById(body, 'bmkg')).toMatchObject({
      name: 'BMKG',
      health: 'ok',
      eventCount: 5,
      servedStale: false,
    });
    expect(sourceById(body, 'usgs')).toMatchObject({
      name: 'USGS',
      health: 'ok',
      eventCount: 4,
      servedStale: false,
    });
    expect(sourceById(body, 'bmkg')!.homepage).toBe(
      'https://www.bmkg.go.id/gempabumi/gempabumi-terkini.bmkg',
    );
    expect(sourceById(body, 'usgs')!.homepage).toBe('https://earthquake.usgs.gov/earthquakes/map/');
  });

  it('keeps the BMKG text and records the USGS report as a cross-check', async () => {
    stubFeeds();
    const body = (await (await GET(request())).json()) as EventsResponse;

    const bengkulu = body.events.find(event => event.eventTime === '2026-10-22T10:57:49.000Z');
    expect(bengkulu?.sourceId).toBe('bmkg');
    expect(bengkulu?.feltReports).toBe('III Kota Bengkulu, II - III Curup, III Arga Makmur');
    expect(bengkulu?.potential).toBe('Tidak berpotensi tsunami');
    expect(bengkulu?.severity?.value).toBe(5.2);

    expect(bengkulu?.crossChecks).toHaveLength(1);
    expect(bengkulu?.crossChecks?.[0]).toMatchObject({
      sourceId: 'usgs',
      sourceName: 'USGS',
      severityLabel: 'M4.9',
    });
    expect(bengkulu?.crossChecks?.[0].distanceKm).toBeGreaterThan(30);
    expect(bengkulu?.crossChecks?.[0].distanceKm).toBeLessThan(40);
    expect(bengkulu?.crossChecks?.[0].timeDeltaSeconds).toBeCloseTo(3.3, 1);
    expect(bengkulu?.crossChecks?.[0].sourceUrl).toMatch(/^https:\/\/earthquake\.usgs\.gov\//);
  });

  it('folds every second-source duplicate instead of listing it twice', async () => {
    stubFeeds();
    const body = (await (await GET(request())).json()) as EventsResponse;

    const crossChecked = body.events.filter(event => event.crossChecks?.length);
    expect(crossChecked).toHaveLength(2);
    expect(crossChecked.every(event => event.sourceId === 'bmkg')).toBe(true);
    // Four USGS records, two of them matched, two kept on their own.
    expect(body.events.filter(event => event.sourceId === 'usgs')).toHaveLength(2);
  });

  it('keeps an event that only the second source reported', async () => {
    stubFeeds();
    const body = (await (await GET(request())).json()) as EventsResponse;

    const lospalos = body.events.find(event => event.sourceRecordId === 'us6000u4bw');
    expect(lospalos).toBeDefined();
    expect(lospalos?.sourceId).toBe('usgs');
    expect(lospalos?.title).toContain('Lospalos');
    expect(lospalos?.crossChecks).toBeUndefined();
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
    expect(maluku.matched).toBeGreaterThanOrEqual(1);
    expect(maluku.events.every(event => event.location?.region === 'maluku')).toBe(true);
    // Filtering does not change the size of the underlying pool.
    expect(maluku.total).toBe(7);

    const noMatch = (await (await GET(request('category=flood'))).json()) as EventsResponse;
    expect(noMatch.matched).toBe(0);
    expect(noMatch.events).toEqual([]);
  });

  it('says which parameter it could not use', async () => {
    stubFeeds();
    const body = (await (await GET(request('category=meteor&since=kemarin'))).json()) as EventsResponse;
    expect(body.ignoredParams).toEqual(['category', 'since']);
    expect(body.matched).toBe(7);
  });

  it('answers from cache instead of asking either source again within the TTL', async () => {
    const fetchMock = stubFeeds();

    await GET(request());
    await GET(request());

    // Three BMKG endpoints plus one USGS query, once.
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('treats an empty but healthy feed as empty, not as a failure', async () => {
    stubFeeds({ empty: true });

    const response = await GET(request());
    const body = (await response.json()) as EventsResponse;

    expect(response.status).toBe(200);
    expect(body.total).toBe(0);
    expect(body.events).toEqual([]);
    expect(body.sources.map(source => source.health)).toEqual(['ok', 'ok']);
  });

  it('still answers when one source fails, and says which one', async () => {
    stubFeeds({ failBmkg: true });

    const response = await GET(request());
    const body = (await response.json()) as EventsResponse;

    expect(response.status).toBe(200);
    expect(response.headers.get('X-NusaWatch-Partial')).toBe('true');
    expect(body.partial).toBe(true);
    expect(sourceById(body, 'bmkg')?.health).toBe('failed');
    expect(sourceById(body, 'bmkg')?.error).toContain('BMKG tidak dapat dihubungi');
    expect(sourceById(body, 'usgs')?.health).toBe('ok');
    // The USGS records survive on their own.
    expect(body.events.every(event => event.sourceId === 'usgs')).toBe(true);
    expect(body.total).toBe(4);
  });

  it('still answers when the second source fails', async () => {
    stubFeeds({ failUsgs: true });

    const response = await GET(request());
    const body = (await response.json()) as EventsResponse;

    expect(response.status).toBe(200);
    expect(body.partial).toBe(true);
    expect(sourceById(body, 'usgs')?.health).toBe('failed');
    expect(sourceById(body, 'bmkg')?.health).toBe('ok');
    expect(body.total).toBe(5);
  });

  it('returns 503 only when every source failed, with both reasons attached', async () => {
    stubFeeds({ status: 503 });

    const response = await GET(request());
    const body = (await response.json()) as EventsResponse;

    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(body.partial).toBe(true);
    expect(body.events).toEqual([]);
    expect(sourceById(body, 'bmkg')?.health).toBe('failed');
    expect(sourceById(body, 'bmkg')?.error).toContain('BMKG tidak dapat dihubungi');
    expect(sourceById(body, 'usgs')?.health).toBe('failed');
    expect(sourceById(body, 'usgs')?.error).toContain('USGS tidak dapat dihubungi');
  });
});
