import type { EventCategory, RegionId } from './types';

/**
 * Filtering and ordering.
 *
 * All pure, all on the canonical model. The rules that matter for honesty:
 *   • A time window excludes events with no `eventTime` rather than assuming
 *     they happened inside it.
 *   • A bbox excludes events with no coordinates rather than snapping them.
 *   • Nothing is dropped for looking odd; a missing region is `unknown` and can
 *     be filtered for explicitly.
 */

export interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface EventQuery {
  categories: EventCategory[];
  regions: RegionId[];
  since?: number;
  until?: number;
  bbox?: BoundingBox;
  q?: string;
  limit: number;
}

export const DEFAULT_LIMIT = 100;
export const MAX_LIMIT = 500;

export const EMPTY_QUERY: EventQuery = {
  categories: [],
  regions: [],
  limit: DEFAULT_LIMIT,
};

function matchesText(event: { title: string; summary?: string; sourceName: string; location?: { label?: string } }, needle: string): boolean {
  const haystack = [event.title, event.summary, event.sourceName, event.location?.label]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}

function timeOf(event: { eventTime?: string }): number | undefined {
  if (!event.eventTime) return undefined;
  const parsed = Date.parse(event.eventTime);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function filterEvents<T extends {
  id: string;
  title: string;
  summary?: string;
  sourceName: string;
  category: EventCategory;
  eventTime?: string;
  location?: { label?: string; region?: RegionId; latitude?: number; longitude?: number };
}>(events: T[], query: EventQuery): { events: T[]; matched: number } {
  const needle = query.q?.trim().toLowerCase();

  const filtered = events.filter(event => {
    if (query.categories.length > 0 && !query.categories.includes(event.category)) return false;

    if (query.regions.length > 0) {
      const region = event.location?.region ?? 'unknown';
      if (!query.regions.includes(region)) return false;
    }

    if (query.since !== undefined || query.until !== undefined) {
      const time = timeOf(event);
      if (time === undefined) return false;
      if (query.since !== undefined && time < query.since) return false;
      if (query.until !== undefined && time > query.until) return false;
    }

    if (query.bbox) {
      const { latitude, longitude } = event.location ?? {};
      if (latitude === undefined || longitude === undefined) return false;
      if (latitude < query.bbox.south || latitude > query.bbox.north) return false;
      if (longitude < query.bbox.west || longitude > query.bbox.east) return false;
    }

    if (needle && !matchesText(event, needle)) return false;

    return true;
  });

  // Newest first. Events with no time go last — their position is unknown, not
  // "oldest". The id tie-break keeps paging stable across identical timestamps.
  const sorted = [...filtered].sort((a, b) => {
    const aTime = timeOf(a);
    const bTime = timeOf(b);
    if (aTime === undefined && bTime === undefined) return a.id.localeCompare(b.id);
    if (aTime === undefined) return 1;
    if (bTime === undefined) return -1;
    if (aTime !== bTime) return bTime - aTime;
    return a.id.localeCompare(b.id);
  });

  return { events: sorted.slice(0, query.limit), matched: sorted.length };
}
