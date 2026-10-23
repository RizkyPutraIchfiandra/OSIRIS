import { describe, expect, it } from 'vitest';
import fixture from '../__fixtures__/usgs-indonesia.json';
import { buildUsgsUrl, parseUsgsPayload, toCanonicalEvent } from './usgs';
import { USGS_ENDPOINT } from '../registry';

const FETCHED_AT = '2026-10-23T12:30:00.000Z';

const features = parseUsgsPayload(fixture);

describe('buildUsgsUrl', () => {
  it('asks USGS for the Indonesian box over the documented window', () => {
    const url = buildUsgsUrl(new Date('2026-10-23T12:00:00.000Z'));
    const params = new URL(url).searchParams;

    expect(url.startsWith(USGS_ENDPOINT)).toBe(true);
    expect(params.get('format')).toBe('geojson');
    expect(params.get('starttime')).toBe('2026-10-21T12:00:00.000Z');
    expect(params.get('minmagnitude')).toBe('2.5');
    expect(params.get('minlatitude')).toBe('-11.5');
    expect(params.get('maxlatitude')).toBe('6.5');
    expect(params.get('minlongitude')).toBe('94');
    expect(params.get('maxlongitude')).toBe('142');
    expect(params.get('limit')).toBe('100');
  });
});

describe('parseUsgsPayload', () => {
  it('reads the real captured FeatureCollection', () => {
    expect(features).toHaveLength(4);
  });

  it('returns nothing for a payload that is not a FeatureCollection', () => {
    expect(parseUsgsPayload(null)).toEqual([]);
    expect(parseUsgsPayload({ features: 'nope' })).toEqual([]);
  });
});

describe('toCanonicalEvent', () => {
  it('maps a real USGS feature without inventing fields', () => {
    const event = toCanonicalEvent(features[0], FETCHED_AT);
    expect(event).toBeDefined();

    expect(event!.sourceId).toBe('usgs');
    expect(event!.sourceName).toBe('USGS');
    expect(event!.category).toBe('earthquake');
    expect(event!.title).toBe('Gempa M4.5 — 207 km NE of Lospalos, Timor Leste');
    expect(event!.eventTime).toBe('2026-10-23T12:24:24.746Z');
    expect(event!.fetchedAt).toBe(FETCHED_AT);
    expect(event!.depthKm).toBeCloseTo(128.107, 3);
    expect(event!.location?.latitude).toBeCloseTo(-7.3421, 4);
    expect(event!.location?.longitude).toBeCloseTo(128.4666, 4);
    expect(event!.location?.region).toBeDefined();
    expect(event!.severity).toEqual({
      value: 4.5,
      unit: 'magnitudo',
      label: 'M4.5',
      scheme: 'usgs-magnitude',
    });
    expect(event!.sourceUrl).toMatch(/^https:\/\/earthquake\.usgs\.gov\//);
    expect(event!.sourceRecordId).toBe('us6000u4bw');
    expect(event!.rawType).toBe('usgs.fdsn');
    expect(event!.confidence).toBe('not-assessed');
    expect(event!.limitations.length).toBeGreaterThan(0);
  });

  it('derives a stable id from the USGS record, not the clock', () => {
    const first = toCanonicalEvent(features[0], FETCHED_AT);
    const second = toCanonicalEvent(features[0], '2026-10-23T13:30:00.000Z');
    expect(first!.id).toBe(second!.id);
    expect(first!.id.startsWith('usgs-')).toBe(true);
  });

  it('rejects a feature whose geometry is not a point', () => {
    const feature = {
      ...features[0],
      geometry: { type: 'LineString', coordinates: [[100, -3], [101, -4]] },
    };
    expect(toCanonicalEvent(feature, FETCHED_AT)).toBeUndefined();
  });

  it('rejects non-earthquake records such as quarry blasts', () => {
    const properties = features[0].properties as Record<string, unknown>;
    const feature = {
      ...features[0],
      properties: { ...properties, type: 'quarry blast' },
    };
    expect(toCanonicalEvent(feature, FETCHED_AT)).toBeUndefined();
  });

  it('keeps a feature with no magnitude as an event without a severity', () => {
    const properties = features[0].properties as Record<string, unknown>;
    const feature = {
      ...features[0],
      properties: { ...properties, mag: null },
    };
    const event = toCanonicalEvent(feature, FETCHED_AT);
    expect(event).toBeDefined();
    expect(event!.severity).toBeUndefined();
    expect(event!.title).toContain('Lospalos');
  });
});
