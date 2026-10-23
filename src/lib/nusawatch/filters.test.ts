import { describe, it, expect } from 'vitest';
import { DEFAULT_LIMIT, EMPTY_QUERY, filterEvents, type EventQuery } from './filters';
import type { EventCategory, IntelligenceEvent, RegionId } from './types';

function event(
  id: string,
  extra: Partial<IntelligenceEvent> & { region?: RegionId; latitude?: number; longitude?: number; category?: EventCategory } = {},
): IntelligenceEvent {
  const { region, latitude, longitude, category, ...rest } = extra;
  return {
    id,
    sourceId: 'bmkg',
    sourceName: 'BMKG',
    category: category ?? 'earthquake',
    title: `Peristiwa ${id}`,
    fetchedAt: '2026-10-23T00:00:00.000Z',
    freshness: 'fresh',
    confidence: 'not-assessed',
    limitations: [],
    location: { region, latitude, longitude },
    ...rest,
  };
}

const events: IntelligenceEvent[] = [
  event('a', {
    title: 'Gempa Yogyakarta',
    eventTime: '2026-10-23T01:00:00.000Z',
    region: 'java',
    latitude: -7.8,
    longitude: 110.36,
  }),
  event('b', {
    title: 'Gempa Bengkulu',
    eventTime: '2026-10-22T01:00:00.000Z',
    region: 'sumatra',
    latitude: -3.11,
    longitude: 102.14,
  }),
  event('c', {
    title: 'Gempa tanpa waktu',
    region: 'unknown',
  }),
  event('d', {
    title: 'Gempa Maluku',
    eventTime: '2026-10-23T02:00:00.000Z',
    region: 'maluku',
    latitude: -7.75,
    longitude: 128.18,
  }),
];

const query = (partial: Partial<EventQuery>): EventQuery => ({ ...EMPTY_QUERY, ...partial });

const ids = (list: IntelligenceEvent[]) => list.map(item => item.id);

describe('filterEvents', () => {
  it('sorts newest first and puts undated events last', () => {
    const { events: result, matched } = filterEvents(events, EMPTY_QUERY);
    expect(ids(result)).toEqual(['d', 'a', 'b', 'c']);
    expect(matched).toBe(4);
  });

  it('uses a time window without assuming a time for undated events', () => {
    const since = Date.parse('2026-10-23T00:00:00.000Z');
    expect(ids(filterEvents(events, query({ since })).events)).toEqual(['d', 'a']);

    const until = Date.parse('2026-10-22T23:00:00.000Z');
    expect(ids(filterEvents(events, query({ until })).events)).toEqual(['b']);
  });

  it('filters by approximate region, including the unknown bucket', () => {
    expect(ids(filterEvents(events, query({ regions: ['java'] })).events)).toEqual(['a']);
    expect(ids(filterEvents(events, query({ regions: ['unknown'] })).events)).toEqual(['c']);
    expect(ids(filterEvents(events, query({ regions: ['sumatra', 'maluku'] })).events)).toEqual([
      'd',
      'b',
    ]);
  });

  it('applies a bbox only to events that actually have coordinates', () => {
    const bbox = { west: 105, south: -9, east: 115, north: -5 };
    expect(ids(filterEvents(events, query({ bbox })).events)).toEqual(['a']);
  });

  it('searches title, place, summary and source name, case-insensitively', () => {
    expect(ids(filterEvents(events, query({ q: 'bengkulu' })).events)).toEqual(['b']);
    expect(ids(filterEvents(events, query({ q: 'BMKG' })).events)).toHaveLength(4);
    expect(filterEvents(events, query({ q: 'tidak ada' })).events).toHaveLength(0);
  });

  it('truncates the list but reports the full match count', () => {
    const { events: result, matched } = filterEvents(events, query({ limit: 2 }));
    expect(result).toHaveLength(2);
    expect(matched).toBe(4);
  });

  it('filters by category without inventing categories', () => {
    const withFlood = [...events, event('e', { category: 'flood', eventTime: '2026-10-21T00:00:00.000Z' })];
    expect(ids(filterEvents(withFlood, query({ categories: ['flood'] })).events)).toEqual(['e']);
  });

  it('defaults to a bounded page size', () => {
    expect(DEFAULT_LIMIT).toBe(100);
  });
});
