/**
 * Typed TTL cache for NusaWatch sources.
 *
 * Same three behaviours as `src/lib/sourceCache.ts` — TTL, in-flight dedup,
 * stale-on-error — but a different contract: this cache stores one *result*
 * object, not an array of cameras, and it never invents an empty value to
 * stand in for a failure. On a failed refresh it re-serves the last good
 * result and says so (`servedStale`), which is what makes the UI able to show
 * "data ini dari pengambilan sebelumnya" instead of a silent empty map.
 *
 * Deliberately in-memory and per-process. Platform-level rate limiting is an
 * open task; see the audit's security notes.
 */

interface Entry<T> {
  value: T;
  expiresAt: number;
  lastSuccessAt: number;
  /**
   * Set when a failed refresh re-served this value. The flag outlives the
   * failure, because every later read inside the retry window is still
   * looking at the same old data and must say so.
   */
  staleFallback: boolean;
}

export interface CacheRead<T> {
  value: T;
  /** Answered from a previous successful fetch after a failed refresh. */
  servedStale: boolean;
  /** Answered without calling the loader at all. */
  cached: boolean;
}

export interface CachePeek<T> {
  value: T;
  lastSuccessAt: number;
  stale: boolean;
}

const DEFAULT_RETRY_MS = 30 * 1000;

const store = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<CacheRead<unknown>>>();

export async function cachedFetch<T>(
  key: string,
  loader: () => Promise<T>,
  options: { ttlMs: number; retryMs?: number },
): Promise<CacheRead<T>> {
  const entry = store.get(key) as Entry<T> | undefined;
  const pending = inflight.get(key) as Promise<CacheRead<T>> | undefined;

  if (entry && Date.now() < entry.expiresAt) {
    return { value: entry.value, servedStale: entry.staleFallback, cached: true };
  }
  if (pending) return pending;

  const promise = (async (): Promise<CacheRead<T>> => {
    try {
      const value = await loader();
      const now = Date.now();
      store.set(key, { value, expiresAt: now + options.ttlMs, lastSuccessAt: now, staleFallback: false });
      return { value, servedStale: false, cached: false };
    } catch (error) {
      const previous = store.get(key) as Entry<T> | undefined;
      if (!previous) throw error;

      // Retry sooner than a full TTL so a recovering upstream is picked up
      // quickly, but not so soon that a dead one is hammered.
      store.set(key, {
        ...previous,
        expiresAt: Date.now() + (options.retryMs ?? DEFAULT_RETRY_MS),
        staleFallback: true,
      });
      return { value: previous.value, servedStale: true, cached: true };
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise as Promise<CacheRead<unknown>>);
  return promise;
}

/** Read without fetching; used by the source-status route. */
export function peekCache<T>(key: string): CachePeek<T> | undefined {
  const entry = store.get(key) as Entry<T> | undefined;
  if (!entry) return undefined;
  return {
    value: entry.value,
    lastSuccessAt: entry.lastSuccessAt,
    stale: Date.now() >= entry.expiresAt,
  };
}

/** Test seam. */
export function clearNusawatchCache(): void {
  store.clear();
  inflight.clear();
}
