import { describe, expect, it } from 'vitest';
import type { IntelligenceEvent } from './types';
import { INDONESIA_VIEWPORT, collectionBounds, toEventCollection } from './map';

function event(overrides: Partial<IntelligenceEvent> = {}): IntelligenceEvent {
  return {
    id: 'bmkg-test',
    sourceId: 'bmkg',
    sourceName: 'BMKG',
    category: 'earthquake',
    title: 'Gempa M5.0 — laut',
    fetchedAt: '2026-10-23T00:00:00.000Z',
    freshness: 'fresh',
    confidence: 'not-assessed',
    limitations: [],
    location: { latitude: -3.11, longitude: 102.14, region: 'sumatra' },
    severity: { value: 5, unit: 'magnitudo', scheme: 'bmkg-magnitude' },
    ...overrides,
  };
}

describe('toEventCollection', () => {
  it('maps coordinates in [lng, lat] order, which GeoJSON requires', () => {
    const collection = toEventCollection([event()]);
    expect(collection.features).toHaveLength(1);
    expect(collection.features[0].geometry.coordinates).toEqual([102.14, -3.11]);
    expect(collection.features[0].properties.id).toBe('bmkg-test');
    expect(collection.features[0].properties.magnitude).toBe(5);
  });

  it('drops events whose source published no coordinate instead of inventing one', () => {
    const collection = toEventCollection([
      event(),
      event({ id: 'no-location', location: undefined }),
      event({ id: 'half-location', location: { latitude: -3.11 } }),
    ]);
    expect(collection.features.map(feature => feature.properties.id)).toEqual(['bmkg-test']);
  });

  it('drops coordinates outside the possible range', () => {
    const collection = toEventCollection([
      event({ id: 'bad-lat', location: { latitude: 91, longitude: 100 } }),
      event({ id: 'bad-lng', location: { latitude: -3, longitude: 181 } }),
      event({ id: 'nan', location: { latitude: Number.NaN, longitude: 100 } }),
    ]);
    expect(collection.features).toHaveLength(0);
  });

  it('keeps a non-numeric severity as a point with a null magnitude', () => {
    const collection = toEventCollection([
      event({ severity: { value: 'dirasakan', scheme: 'bmkg-felt' } }),
      event({ id: 'no-severity', severity: undefined }),
    ]);
    expect(collection.features).toHaveLength(2);
    expect(collection.features.every(feature => feature.properties.magnitude === null)).toBe(true);
  });

  it('preserves freshness and region so the map can colour honestly', () => {
    const [feature] = toEventCollection([event({ freshness: 'stale' })]).features;
    expect(feature.properties.freshness).toBe('stale');
    expect(feature.properties.region).toBe('sumatra');
  });
});

describe('collectionBounds', () => {
  it('returns the bounding box of the plotted events', () => {
    const collection = toEventCollection([
      event({ location: { latitude: -8, longitude: 110 } }),
      event({ id: 'b', location: { latitude: 4, longitude: 128 } }),
    ]);
    expect(collectionBounds(collection)).toEqual([
      [110, -8],
      [128, 4],
    ]);
  });

  it('returns null when nothing can be plotted', () => {
    expect(collectionBounds({ type: 'FeatureCollection', features: [] })).toBeNull();
  });
});

describe('INDONESIA_VIEWPORT', () => {
  it('starts inside the archipelago rather than on the globe', () => {
    expect(INDONESIA_VIEWPORT.center[0]).toBeGreaterThan(94);
    expect(INDONESIA_VIEWPORT.center[0]).toBeLessThan(141);
    expect(INDONESIA_VIEWPORT.center[1]).toBeGreaterThan(-11);
    expect(INDONESIA_VIEWPORT.center[1]).toBeLessThan(6);
  });
});
