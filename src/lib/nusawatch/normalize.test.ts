import { describe, it, expect } from 'vitest';
import {
  cleanText,
  isIsoTimestamp,
  normalizeTimestamp,
  parseCoordinatePair,
  parseDepthKm,
  parseMagnitude,
} from './normalize';

describe('cleanText', () => {
  it('collapses the multi-line descriptions BMKG publishes', () => {
    expect(cleanText('  Pusat gempa\n berada di   darat  ')).toBe('Pusat gempa berada di darat');
  });

  it('turns control characters into spaces instead of gluing words together', () => {
    expect(cleanText('Barat\u0000Laut')).toBe('Barat Laut');
  });

  it('caps long text and marks the cut', () => {
    const capped = cleanText('a'.repeat(40), 10);
    expect(capped).toHaveLength(10);
    expect(capped?.endsWith('…')).toBe(true);
  });

  it('returns undefined rather than an empty string', () => {
    expect(cleanText('   ')).toBeUndefined();
    expect(cleanText(42)).toBeUndefined();
    expect(cleanText(null)).toBeUndefined();
  });
});

describe('parseCoordinatePair', () => {
  it('reads the "lat,lng" string BMKG uses', () => {
    expect(parseCoordinatePair('-3.11,102.14')).toEqual({ latitude: -3.11, longitude: 102.14 });
    expect(parseCoordinatePair(' 3.79 , 95.72 ')).toEqual({ latitude: 3.79, longitude: 95.72 });
  });

  it('rejects anything that would put an event somewhere impossible', () => {
    expect(parseCoordinatePair('-91,102')).toBeUndefined();
    expect(parseCoordinatePair('0,181')).toBeUndefined();
    expect(parseCoordinatePair('not,a,place')).toBeUndefined();
    expect(parseCoordinatePair('-3.11')).toBeUndefined();
    expect(parseCoordinatePair(undefined)).toBeUndefined();
  });
});

describe('parseMagnitude', () => {
  it('accepts a bare number, a string, and a string with a unit', () => {
    expect(parseMagnitude('5.2')).toBe(5.2);
    expect(parseMagnitude('5.2 SR')).toBe(5.2);
    expect(parseMagnitude(5.2)).toBe(5.2);
  });

  it('refuses values outside a magnitude scale instead of clamping them', () => {
    expect(parseMagnitude('-1.2')).toBeUndefined();
    expect(parseMagnitude('12.0')).toBeUndefined();
    expect(parseMagnitude('kecil')).toBeUndefined();
  });
});

describe('parseDepthKm', () => {
  it('strips the unit', () => {
    expect(parseDepthKm('120 km')).toBe(120);
    expect(parseDepthKm('3 km')).toBe(3);
    expect(parseDepthKm(74)).toBe(74);
  });

  it('rejects negatives and implausible depths', () => {
    expect(parseDepthKm('-10 km')).toBeUndefined();
    expect(parseDepthKm('9999 km')).toBeUndefined();
    expect(parseDepthKm('dalam')).toBeUndefined();
  });
});

describe('normalizeTimestamp', () => {
  it('normalises BMKG offset timestamps to UTC', () => {
    expect(normalizeTimestamp('2026-10-22T10:57:49+00:00')).toBe('2026-10-22T10:57:49.000Z');
    expect(normalizeTimestamp('2026-10-22T17:57:49+07:00')).toBe('2026-10-22T10:57:49.000Z');
  });

  it('does not accept prose, a bare date, or a missing offset', () => {
    expect(normalizeTimestamp('22 Okt 2026 17:57')).toBeUndefined();
    expect(normalizeTimestamp('2026-10-22')).toBeUndefined();
    expect(normalizeTimestamp('2026-10-22T10:57:49')).toBeUndefined();
    expect(normalizeTimestamp(undefined)).toBeUndefined();
  });

  it('is the same rule the query parser relies on', () => {
    expect(isIsoTimestamp('2026-10-22T10:57:49Z')).toBe(true);
    expect(isIsoTimestamp('2026-10-22')).toBe(false);
  });
});
