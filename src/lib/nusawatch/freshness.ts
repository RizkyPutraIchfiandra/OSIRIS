import type { Freshness } from './types';

/**
 * Freshness is a property of *our ingestion*, not of the event.
 *
 * A 2019 earthquake is not "stale data"; it is an old event that we fetched
 * just now. What can go stale is the feed we are reading, so the timestamp
 * compared here is always `fetchedAt`, never `eventTime`.
 */
export const FRESH_FOR_MS = 10 * 60 * 1000;

/** A timestamp more than a minute in the future means a skewed clock, not a scoop. */
const FUTURE_TOLERANCE_MS = 60 * 1000;

export function assessFreshness(
  fetchedAt: string | undefined,
  freshForMs: number = FRESH_FOR_MS,
  now: number = Date.now(),
): Freshness {
  if (!fetchedAt) return 'unknown';

  const time = Date.parse(fetchedAt);
  if (!Number.isFinite(time)) return 'unknown';

  const age = now - time;
  if (age < -FUTURE_TOLERANCE_MS) return 'unknown';
  return age <= freshForMs ? 'fresh' : 'stale';
}
