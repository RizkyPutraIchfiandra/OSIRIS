import { describe, it, expect, vi, afterEach } from 'vitest';
import autogempa from '../__fixtures__/bmkg-autogempa.json';
import gempaterkini from '../__fixtures__/bmkg-gempaterkini.json';
import gempadirasakan from '../__fixtures__/bmkg-gempadirasakan.json';
import { BMKG_ENDPOINTS } from '../registry';
import { SourceUnavailableError } from '../errors';
import {
  fetchBmkgEvents,
  mergeBmkgEvents,
  parseBmkgPayload,
  toCanonicalEvent,
  toCanonicalEvents,
} from './bmkg';

/*
 * Fixtures are real responses captured from data.bmkg.go.id on 2026-10-23,
 * trimmed to three records each. They are the contract this adapter is tested
 * against — if BMKG changes shape, these tests should fail, not the page.
 */

const FETCHED_AT = '2026-10-23T00:00:00.000Z';

const autogempaRecords = parseBmkgPayload(autogempa);
const recentRecords = parseBmkgPayload(gempaterkini);
const feltRecords = parseBmkgPayload(gempadirasakan);

afterEach(() => vi.unstubAllGlobals());

describe('parseBmkgPayload', () => {
  it('accepts both shapes: one object for autogempa, an array for the rest', () => {
    expect(autogempaRecords).toHaveLength(1);
    expect(recentRecords).toHaveLength(3);
    expect(feltRecords).toHaveLength(3);
  });

  it('returns nothing for a payload that is not the documented shape', () => {
    expect(parseBmkgPayload(null)).toEqual([]);
    expect(parseBmkgPayload({})).toEqual([]);
    expect(parseBmkgPayload({ Infogempa: {} })).toEqual([]);
    expect(parseBmkgPayload({ Infogempa: { gempa: 'bukan gempa' } })).toEqual([]);
  });
});

describe('toCanonicalEvent', () => {
  const event = toCanonicalEvent(autogempaRecords[0], 'autogempa', FETCHED_AT, Date.parse(FETCHED_AT));

  it('maps the real autogempa fields without inventing any', () => {
    expect(event).toMatchObject({
      sourceId: 'bmkg',
      sourceName: 'BMKG',
      category: 'earthquake',
      eventTime: '2026-10-22T10:57:49.000Z',
      fetchedAt: FETCHED_AT,
      eventTimeSource: '17:57:49 WIB',
      depthKm: 120,
      confidence: 'not-assessed',
      freshness: 'fresh',
      rawType: 'bmkg.autogempa',
    });

    expect(event?.severity).toEqual({
      value: 5.2,
      unit: 'magnitudo',
      label: 'M5.2',
      scheme: 'bmkg-magnitude',
    });

    expect(event?.location).toEqual({
      label: 'Pusat gempa berada di darat 6 km BaratLaut Lebong',
      countryCode: 'ID',
      region: 'sumatra',
      latitude: -3.11,
      longitude: 102.14,
    });
  });

  it('keeps the source text verbatim instead of paraphrasing it', () => {
    expect(event?.potential).toBe('Gempa ini dirasakan untuk diteruskan pada masyarakat');
    expect(event?.feltReports).toBe('III Kota Bengkulu, II - III Curup, III Arga Makmur');
  });

  it('states its limitations rather than implying completeness', () => {
    expect(event?.limitations).toContain('Cakupan: peristiwa terbaru BMKG, bukan katalog lengkap.');
    expect(event?.limitations.join(' ')).toContain('bukan batas administratif');
  });

  it('still produces an event when only coordinates are published', () => {
    const sparse = toCanonicalEvent({ Coordinates: '-3.11,102.14' }, 'gempaterkini', FETCHED_AT);
    expect(sparse).toBeDefined();
    expect(sparse?.eventTime).toBeUndefined();
    expect(sparse?.severity).toBeUndefined();
    expect(sparse?.location?.region).toBe('sumatra');
    expect(sparse?.title).toBe('Gempa');
  });

  it('refuses a record with nothing to identify it by', () => {
    expect(toCanonicalEvent({ Wilayah: 'entah di mana' }, 'gempaterkini', FETCHED_AT)).toBeUndefined();
    expect(toCanonicalEvent({ Magnitude: 'kecil' }, 'gempaterkini', FETCHED_AT)).toBeUndefined();
  });

  it('rejects coordinates outside the world instead of plotting them', () => {
    const broken = toCanonicalEvent(
      { Coordinates: '999,999', DateTime: '2026-10-22T10:57:49+00:00', Magnitude: '5.0' },
      'gempaterkini',
      FETCHED_AT,
    );
    expect(broken?.location?.latitude).toBeUndefined();
    expect(broken?.location?.region).toBe('unknown');
  });
});

describe('mergeBmkgEvents', () => {
  it('treats the same earthquake reported by three endpoints as one event', () => {
    const payloads = { gempaterkini, autogempa, gempadirasakan } as const;
    const groups = (['gempaterkini', 'autogempa', 'gempadirasakan'] as const).map(endpoint =>
      toCanonicalEvents(parseBmkgPayload(payloads[endpoint]), endpoint, FETCHED_AT),
    );

    const merged = mergeBmkgEvents(groups);
    const bengkulu = merged.filter(event => event.eventTime === '2026-10-22T10:57:49.000Z');

    expect(bengkulu).toHaveLength(1);
    expect(bengkulu[0].title).toContain('LEBONG');
    // Display fields come from the highest-priority endpoint
    // (`gempaterkini`), which is also where its `Potensi` wording comes from;
    // `feltReports` only exists on `gempadirasakan`, so merging fills it in.
    expect(bengkulu[0].rawType).toBe('bmkg.gempaterkini');
    expect(bengkulu[0].potential).toBe('Tidak berpotensi tsunami');
    expect(bengkulu[0].feltReports).toBe('III Kota Bengkulu, II - III Curup, III Arga Makmur');
    expect(merged).toHaveLength(5);
  });

  it('derives the same id for the same record on every endpoint', () => {
    const fromRecent = toCanonicalEvent(recentRecords[0], 'gempaterkini', FETCHED_AT);
    const fromFelt = toCanonicalEvent(feltRecords[0], 'gempadirasakan', FETCHED_AT);
    expect(fromRecent?.id).toBe(fromFelt?.id);
    expect(fromRecent?.id).toMatch(/^bmkg-[0-9a-f]{16}$/);
  });
});

function stubFeeds(fail: Partial<Record<keyof typeof BMKG_ENDPOINTS, number>> = {}) {
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
    const status = fail[key];
    if (status) return new Response('', { status });
    return new Response(JSON.stringify(payloads[key]), { status: 200 });
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('fetchBmkgEvents', () => {
  it('reads all three feeds and reports no partial state', async () => {
    const fetchMock = stubFeeds();
    const result = await fetchBmkgEvents({ now: new Date(FETCHED_AT) });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.events).toHaveLength(5);
    expect(result.partial).toBe(false);
    expect(result.failedEndpoints).toEqual([]);
    expect(result.fetchedAt).toBe(FETCHED_AT);
  });

  it('keeps what arrived when one endpoint fails', async () => {
    stubFeeds({ autogempa: 503 });
    const result = await fetchBmkgEvents({ now: new Date(FETCHED_AT) });

    expect(result.events).toHaveLength(5);
    expect(result.partial).toBe(true);
    expect(result.failedEndpoints.join(' ')).toContain('autogempa: HTTP 503');
    expect(result.error).toContain('Sebagian endpoint BMKG gagal');

    const bengkulu = result.events.find(event => event.eventTime === '2026-10-22T10:57:49.000Z');
    // The surviving feeds still carry the record; only autogempa's copy is gone.
    expect(bengkulu?.potential).toBe('Tidak berpotensi tsunami');
    expect(bengkulu?.feltReports).toBeDefined();
  });

  it('throws when every endpoint fails, so the cache can serve the last good copy', async () => {
    stubFeeds({ autogempa: 503, gempaterkini: 500, gempadirasakan: 429 });

    await expect(fetchBmkgEvents({ now: new Date(FETCHED_AT) })).rejects.toBeInstanceOf(
      SourceUnavailableError,
    );
    await expect(fetchBmkgEvents({ now: new Date(FETCHED_AT) })).rejects.toThrow('BMKG tidak dapat dihubungi');
  });
});
