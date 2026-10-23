import { describe, expect, it } from 'vitest';
import type { IntelligenceEvent } from './types';
import {
  MATCH_MAX_KM,
  MATCH_MAX_SECONDS,
  haversineKm,
  matchEvents,
  mergeSources,
} from './dedupe';

function event(overrides: Partial<IntelligenceEvent> = {}): IntelligenceEvent {
  return {
    id: 'bmkg-a',
    sourceId: 'bmkg',
    sourceName: 'BMKG',
    category: 'earthquake',
    title: 'Gempa M5.2 — Bengkulu',
    eventTime: '2026-10-22T10:57:49.000Z',
    fetchedAt: '2026-10-22T10:58:00.000Z',
    freshness: 'fresh',
    confidence: 'not-assessed',
    limitations: [],
    location: { latitude: -3.11, longitude: 102.14, region: 'sumatra' },
    severity: { value: 5.2, unit: 'magnitudo', label: 'M5.2', scheme: 'bmkg-magnitude' },
    ...overrides,
  };
}

function usgs(overrides: Partial<IntelligenceEvent> = {}): IntelligenceEvent {
  return event({
    id: 'usgs-1',
    sourceId: 'usgs',
    sourceName: 'USGS',
    title: 'Gempa M4.9 — 85 km NNW of Curup, Indonesia',
    eventTime: '2026-10-22T10:57:52.259Z',
    severity: { value: 4.9, unit: 'magnitudo', label: 'M4.9', scheme: 'usgs-magnitude' },
    location: { latitude: -2.8037, longitude: 102.1272, region: 'sumatra' },
    sourceUrl: 'https://earthquake.usgs.gov/eventpage/x',
    sourceRecordId: 'x',
    ...overrides,
  });
}

describe('haversineKm', () => {
  it('measures the real distance between two Indonesian points', () => {
    // Jakarta → Surabaya is roughly 660 km.
    expect(haversineKm(-6.2, 106.8, -7.25, 112.75)).toBeGreaterThan(620);
    expect(haversineKm(-6.2, 106.8, -7.25, 112.75)).toBeLessThan(700);
  });
});

describe('matchEvents', () => {
  it('matches the same quake reported by BMKG and USGS minutes and kilometres apart', () => {
    const match = matchEvents(event(), usgs());
    expect(match).not.toBeNull();
    expect(match!.timeDeltaSeconds).toBeCloseTo(3.3, 1);
    expect(match!.distanceKm).toBeGreaterThan(30);
    expect(match!.distanceKm).toBeLessThan(40);
  });

  it('refuses a candidate outside the time window', () => {
    expect(MATCH_MAX_SECONDS).toBe(120);
    const late = usgs({ eventTime: '2026-10-22T11:01:00.000Z' });
    expect(matchEvents(event(), late)).toBeNull();
  });

  it('refuses a candidate outside the distance window', () => {
    expect(MATCH_MAX_KM).toBe(200);
    const far = usgs({ location: { latitude: -7.5, longitude: 110 } });
    expect(matchEvents(event(), far)).toBeNull();
  });

  it('does not merge when a coordinate or time is missing', () => {
    expect(matchEvents(event({ location: undefined }), usgs())).toBeNull();
    expect(matchEvents(event(), usgs({ eventTime: undefined }))).toBeNull();
  });
});

describe('mergeSources', () => {
  it('keeps the primary record and records the disagreement', () => {
    const result = mergeSources([event()], [usgs()]);

    expect(result.events).toHaveLength(1);
    expect(result.crossChecked).toBe(1);
    expect(result.addedFromSecondary).toBe(0);

    const [merged] = result.events;
    expect(merged.sourceId).toBe('bmkg');
    expect(merged.severity?.value).toBe(5.2);
    expect(merged.crossChecks).toEqual([
      {
        sourceId: 'usgs',
        sourceName: 'USGS',
        sourceRecordId: 'x',
        sourceUrl: 'https://earthquake.usgs.gov/eventpage/x',
        severityLabel: 'M4.9',
        timeDeltaSeconds: 3.3,
        distanceKm: 34.1,
      },
    ]);
  });

  it('adds an event only the second source reported', () => {
    const result = mergeSources([event()], [usgs({ id: 'usgs-only', location: { latitude: -6.7, longitude: 129.7, region: 'maluku' } })]);
    expect(result.events).toHaveLength(2);
    expect(result.addedFromSecondary).toBe(1);
    expect(result.events.map(item => item.id).sort()).toEqual(['bmkg-a', 'usgs-only']);
  });

  it('never merges two second-source records into one primary record', () => {
    const result = mergeSources(
      [event()],
      [usgs({ id: 'usgs-1' }), usgs({ id: 'usgs-2', location: { latitude: -2.9, longitude: 102.2 } })],
    );
    expect(result.crossChecked).toBe(1);
    expect(result.events).toHaveLength(2);
    expect(result.events.find(item => item.id === 'usgs-2')).toBeDefined();
  });

  it('orders the merged set newest first and keeps undated events last', () => {
    const older = event({ id: 'older', eventTime: '2026-10-20T00:00:00.000Z' });
    const undated = event({ id: 'undated', eventTime: undefined });
    // The USGS record is the newest here, so it leads; the undated event sinks.
    const result = mergeSources([older, undated], [usgs()]);
    expect(result.events.map(item => item.id)).toEqual(['usgs-1', 'older', 'undated']);
  });

  it('is a no-op when the second source has nothing', () => {
    const result = mergeSources([event()], []);
    expect(result.events).toHaveLength(1);
    expect(result.crossChecked).toBe(0);
    expect(result.addedFromSecondary).toBe(0);
  });
});
