import type { CrossCheck, IntelligenceEvent } from './types';

/**
 * Cross-source identity.
 *
 * Two catalogues never agree exactly: BMKG's Bengkulu event and USGS's are
 * 3 seconds and ~34 km apart, with magnitudes 5.2 and 4.9. That is the same
 * earthquake. The window below is deliberately tight — a false merge hides a
 * real second event, which is worse than showing the same quake twice — and
 * every match keeps the disagreement visible in `crossChecks` instead of
 * averaging it away.
 */

/** Maximum origin-time difference between two reports of the same event. */
export const MATCH_MAX_SECONDS = 120;

/** Maximum hypocentre separation. Regional networks place events a few tens of km apart. */
export const MATCH_MAX_KM = 200;

const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(deltaLongitude / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export interface EventMatch {
  timeDeltaSeconds: number;
  distanceKm: number;
}

/**
 * Returns the match facts when two records plausibly describe one earthquake,
 * or null. Missing time or coordinates means "cannot prove identity", which is
 * a null — not a guess.
 */
export function matchEvents(a: IntelligenceEvent, b: IntelligenceEvent): EventMatch | null {
  const latitudeA = a.location?.latitude;
  const longitudeA = a.location?.longitude;
  const latitudeB = b.location?.latitude;
  const longitudeB = b.location?.longitude;
  if (
    typeof latitudeA !== 'number' ||
    typeof longitudeA !== 'number' ||
    typeof latitudeB !== 'number' ||
    typeof longitudeB !== 'number'
  ) {
    return null;
  }

  const timeA = a.eventTime ? Date.parse(a.eventTime) : Number.NaN;
  const timeB = b.eventTime ? Date.parse(b.eventTime) : Number.NaN;
  if (!Number.isFinite(timeA) || !Number.isFinite(timeB)) return null;

  const timeDeltaSeconds = Math.abs(timeA - timeB) / 1000;
  if (timeDeltaSeconds > MATCH_MAX_SECONDS) return null;

  const distanceKm = haversineKm(latitudeA, longitudeA, latitudeB, longitudeB);
  if (distanceKm > MATCH_MAX_KM) return null;

  return { timeDeltaSeconds, distanceKm };
}

function toCrossCheck(candidate: IntelligenceEvent, match: EventMatch): CrossCheck {
  return {
    sourceId: candidate.sourceId,
    sourceName: candidate.sourceName,
    sourceRecordId: candidate.sourceRecordId,
    sourceUrl: candidate.sourceUrl,
    severityLabel: candidate.severity?.label,
    timeDeltaSeconds: Math.round(match.timeDeltaSeconds * 10) / 10,
    distanceKm: Math.round(match.distanceKm * 10) / 10,
  };
}

function byEventTimeDescending(a: IntelligenceEvent, b: IntelligenceEvent): number {
  if (!a.eventTime && !b.eventTime) return 0;
  if (!a.eventTime) return 1;
  if (!b.eventTime) return -1;
  return b.eventTime.localeCompare(a.eventTime);
}

export interface MergeOutcome {
  events: IntelligenceEvent[];
  /** Secondary records folded into a primary record. */
  crossChecked: number;
  /** Secondary records kept as events of their own. */
  addedFromSecondary: number;
}

/**
 * Folds `secondary` into `primary`. The primary catalogue keeps its own display
 * text, coordinates and magnitude; the secondary only adds a cross-check.
 * Events only the secondary knows about are appended, so a gap in one feed is
 * not a gap in the product.
 */
export function mergeSources(
  primary: readonly IntelligenceEvent[],
  secondary: readonly IntelligenceEvent[],
): MergeOutcome {
  const events: IntelligenceEvent[] = primary.map(event => ({ ...event }));
  const claimed = new Set<number>();
  let crossChecked = 0;
  let addedFromSecondary = 0;

  for (const candidate of secondary) {
    let bestIndex = -1;
    let bestMatch: EventMatch | null = null;

    for (let index = 0; index < events.length; index += 1) {
      if (claimed.has(index)) continue;
      const match = matchEvents(events[index], candidate);
      if (!match) continue;
      if (!bestMatch || match.distanceKm < bestMatch.distanceKm) {
        bestIndex = index;
        bestMatch = match;
      }
    }

    if (bestIndex >= 0 && bestMatch) {
      const target = events[bestIndex];
      events[bestIndex] = {
        ...target,
        crossChecks: [...(target.crossChecks ?? []), toCrossCheck(candidate, bestMatch)],
      };
      claimed.add(bestIndex);
      crossChecked += 1;
    } else {
      events.push(candidate);
      addedFromSecondary += 1;
    }
  }

  events.sort(byEventTimeDescending);
  return { events, crossChecked, addedFromSecondary };
}
