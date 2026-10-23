import { describe, it, expect } from 'vitest';
import { assessFreshness, FRESH_FOR_MS } from './freshness';

const NOW = Date.parse('2026-10-23T12:00:00.000Z');
const at = (minutesAgo: number) => new Date(NOW - minutesAgo * 60_000).toISOString();

describe('assessFreshness', () => {
  it('calls a fetch inside the source window fresh', () => {
    expect(assessFreshness(at(0), FRESH_FOR_MS, NOW)).toBe('fresh');
    expect(assessFreshness(at(9), FRESH_FOR_MS, NOW)).toBe('fresh');
  });

  it('calls a fetch past the window stale', () => {
    expect(assessFreshness(at(11), FRESH_FOR_MS, NOW)).toBe('stale');
  });

  it('says unknown when there is no usable timestamp', () => {
    expect(assessFreshness(undefined, FRESH_FOR_MS, NOW)).toBe('unknown');
    expect(assessFreshness('kemarin', FRESH_FOR_MS, NOW)).toBe('unknown');
  });

  it('treats a clock that is ahead as unknown, not as a scoop', () => {
    expect(assessFreshness(at(-5), FRESH_FOR_MS, NOW)).toBe('unknown');
    // A second of skew is normal and still fresh.
    expect(assessFreshness(at(-0.5), FRESH_FOR_MS, NOW)).toBe('fresh');
  });
});
