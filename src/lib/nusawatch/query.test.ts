import { describe, it, expect } from 'vitest';
import { parseBbox, parseEventQuery, parseQueryTime } from './query';
import { DEFAULT_LIMIT, MAX_LIMIT } from './filters';

const parse = (search: string) => parseEventQuery(new URLSearchParams(search));

describe('parseQueryTime', () => {
  it('reads ISO timestamps, epoch milliseconds, epoch seconds and plain dates', () => {
    expect(parseQueryTime('2026-10-23T00:00:00.000Z')).toBe(Date.parse('2026-10-23T00:00:00.000Z'));
    expect(parseQueryTime('1792713600000')).toBe(1792713600000);
    expect(parseQueryTime('1792713600')).toBe(1792713600000);
    expect(parseQueryTime('2026-10-23')).toBe(Date.parse('2026-10-23T00:00:00.000Z'));
  });

  it('returns undefined for anything else', () => {
    expect(parseQueryTime('kemarin')).toBeUndefined();
    expect(parseQueryTime('')).toBeUndefined();
  });
});

describe('parseBbox', () => {
  it('reads west,south,east,north', () => {
    expect(parseBbox('95,-11,141,6')).toEqual({ west: 95, south: -11, east: 141, north: 6 });
  });

  it('rejects reversed or out-of-range boxes', () => {
    expect(parseBbox('141,-11,95,6')).toBeUndefined();
    expect(parseBbox('95,6,141,-11')).toBeUndefined();
    expect(parseBbox('-200,-11,141,6')).toBeUndefined();
    expect(parseBbox('95,-11,141')).toBeUndefined();
  });
});

describe('parseEventQuery', () => {
  it('parses multi-value filters', () => {
    const { query, ignored } = parse('category=earthquake,flood&region=java,sumatra&limit=25');
    expect(query.categories).toEqual(['earthquake', 'flood']);
    expect(query.regions).toEqual(['java', 'sumatra']);
    expect(query.limit).toBe(25);
    expect(ignored).toEqual([]);
  });

  it('deduplicates repeated values', () => {
    expect(parse('region=java,java').query.regions).toEqual(['java']);
  });

  it('reports a value it cannot use instead of silently dropping the filter', () => {
    const { query, ignored } = parse('category=meteor&limit=abc');
    expect(query.categories).toEqual([]);
    expect(query.limit).toBe(DEFAULT_LIMIT);
    expect(ignored).toEqual(['category', 'limit']);
  });

  it('drops a reversed time window and says which half was ignored', () => {
    const { query, ignored } = parse('since=2026-10-23&until=2026-10-01');
    expect(query.since).toBeUndefined();
    expect(query.until).toBe(Date.parse('2026-10-01T00:00:00.000Z'));
    expect(ignored).toEqual(['since']);
  });

  it('clamps the page size to the documented range', () => {
    expect(parse('limit=0').query.limit).toBe(DEFAULT_LIMIT);
    expect(parse(`limit=${MAX_LIMIT + 1}`).query.limit).toBe(DEFAULT_LIMIT);
    expect(parse(`limit=${MAX_LIMIT}`).query.limit).toBe(MAX_LIMIT);
  });

  it('keeps search text trimmed and bounded, and ignores blank searches', () => {
    expect(parse('q=%20bengkulu%20').query.q).toBe('bengkulu');
    expect(parse('q=%20%20').query.q).toBeUndefined();
    expect(parse(`q=${'a'.repeat(200)}`).query.q).toHaveLength(120);
  });

  it('carries an unusable bbox through as a reported parameter', () => {
    expect(parse('bbox=1,2,3').ignored).toEqual(['bbox']);
    expect(parse('bbox=95,-11,141,6').query.bbox).toEqual({ west: 95, south: -11, east: 141, north: 6 });
  });
});
