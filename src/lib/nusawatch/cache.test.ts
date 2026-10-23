import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cachedFetch, clearNusawatchCache, peekCache } from './cache';

beforeEach(() => {
  clearNusawatchCache();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('cachedFetch', () => {
  it('calls the loader once inside the TTL', async () => {
    const loader = vi.fn(async () => 'value');

    const first = await cachedFetch('k', loader, { ttlMs: 1000 });
    const second = await cachedFetch('k', loader, { ttlMs: 1000 });

    expect(first).toEqual({ value: 'value', servedStale: false, cached: false });
    expect(second).toEqual({ value: 'value', servedStale: false, cached: true });
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('refreshes once the TTL has passed', async () => {
    const loader = vi.fn(async () => 'value');

    await cachedFetch('k', loader, { ttlMs: 1000 });
    vi.advanceTimersByTime(1001);
    await cachedFetch('k', loader, { ttlMs: 1000 });

    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('shares one in-flight request between concurrent callers', async () => {
    const loader = vi.fn(async () => 'value');

    const [a, b] = await Promise.all([
      cachedFetch('k', loader, { ttlMs: 1000 }),
      cachedFetch('k', loader, { ttlMs: 1000 }),
    ]);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(a.value).toBe('value');
    expect(b.value).toBe('value');
  });

  it('re-serves the last good value when a refresh fails, and keeps saying so', async () => {
    const loader = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('good')
      .mockRejectedValueOnce(new Error('upstream down'));

    await cachedFetch('k', loader, { ttlMs: 1000 });
    vi.advanceTimersByTime(2000);

    const stale = await cachedFetch('k', loader, { ttlMs: 1000 });
    expect(stale).toEqual({ value: 'good', servedStale: true, cached: true });

    // Still inside the retry window: the same old value, still labelled stale.
    const again = await cachedFetch('k', loader, { ttlMs: 1000 });
    expect(again.value).toBe('good');
    expect(again.servedStale).toBe(true);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('clears the stale flag once a later refresh succeeds', async () => {
    const loader = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('old')
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce('new');

    await cachedFetch('k', loader, { ttlMs: 1000 });
    vi.advanceTimersByTime(2000);
    await cachedFetch('k', loader, { ttlMs: 1000 });

    vi.advanceTimersByTime(31_000);
    const fresh = await cachedFetch('k', loader, { ttlMs: 1000 });

    expect(fresh).toEqual({ value: 'new', servedStale: false, cached: false });
  });

  it('propagates the failure when there is nothing cached to fall back on', async () => {
    const loader = vi.fn(async () => {
      throw new Error('first ever fetch failed');
    });

    await expect(cachedFetch('k', loader, { ttlMs: 1000 })).rejects.toThrow('first ever fetch failed');
  });

  it('does not report anything before the first fetch', () => {
    expect(peekCache('missing')).toBeUndefined();
  });

  it('reports expiry through peek', async () => {
    await cachedFetch('k', async () => 'value', { ttlMs: 1000 });
    expect(peekCache<string>('k')?.stale).toBe(false);

    vi.advanceTimersByTime(1001);
    expect(peekCache<string>('k')?.stale).toBe(true);
  });
});
