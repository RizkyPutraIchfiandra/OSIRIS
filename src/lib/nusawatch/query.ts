import { isIsoTimestamp } from './normalize';
import {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  type BoundingBox,
  type EventQuery,
} from './filters';
import type { EventCategory, RegionId } from './types';

/**
 * Query-string parsing.
 *
 * Unknown keys are ignored without comment — cache-busters and analytics
 * parameters are not the reader's problem. Parameters we *do* recognise but
 * cannot use are reported in `ignored` so the UI can say so instead of quietly
 * serving a different dataset than the one that was asked for.
 */

const CATEGORIES: readonly EventCategory[] = [
  'earthquake',
  'flood',
  'cyclone',
  'volcano',
  'fire',
  'other',
];

const REGIONS: readonly RegionId[] = [
  'sumatra',
  'java',
  'kalimantan',
  'sulawesi',
  'papua',
  'bali-nusa-tenggara',
  'maluku',
  'unknown',
];

function parseEnumList<T extends string>(raw: string, allowed: readonly T[]): T[] | undefined {
  const tokens = raw
    .split(',')
    .map(token => token.trim().toLowerCase())
    .filter(Boolean);

  if (tokens.length === 0) return undefined;
  if (tokens.some(token => !allowed.includes(token as T))) return undefined;
  return [...new Set(tokens as T[])];
}

/** Epoch milliseconds, epoch seconds, full ISO-8601, or `YYYY-MM-DD` (UTC). */
export function parseQueryTime(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  if (/^\d{13}$/.test(trimmed)) return Number(trimmed);
  if (/^\d{10}$/.test(trimmed)) return Number(trimmed) * 1000;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const time = Date.parse(`${trimmed}T00:00:00Z`);
    return Number.isFinite(time) ? time : undefined;
  }
  if (isIsoTimestamp(trimmed)) {
    const time = Date.parse(trimmed);
    return Number.isFinite(time) ? time : undefined;
  }
  return undefined;
}

export function parseBbox(raw: string): BoundingBox | undefined {
  const parts = raw.split(',');
  if (parts.length !== 4) return undefined;

  const [west, south, east, north] = parts.map(part => Number.parseFloat(part.trim()));
  if (![west, south, east, north].every(Number.isFinite)) return undefined;
  if (west < -180 || east > 180 || south < -90 || north > 90) return undefined;
  if (west > east || south > north) return undefined;

  return { west, south, east, north };
}

export interface ParsedQuery {
  query: EventQuery;
  ignored: string[];
}

export function parseEventQuery(searchParams: URLSearchParams): ParsedQuery {
  const ignored: string[] = [];

  let categories: EventCategory[] = [];
  const rawCategory = searchParams.get('category');
  if (rawCategory) {
    const parsed = parseEnumList(rawCategory, CATEGORIES);
    if (parsed) categories = parsed;
    else ignored.push('category');
  }

  let regions: RegionId[] = [];
  const rawRegion = searchParams.get('region');
  if (rawRegion) {
    const parsed = parseEnumList(rawRegion, REGIONS);
    if (parsed) regions = parsed;
    else ignored.push('region');
  }

  let since: number | undefined;
  const rawSince = searchParams.get('since');
  if (rawSince) {
    since = parseQueryTime(rawSince);
    if (since === undefined) ignored.push('since');
  }

  let until: number | undefined;
  const rawUntil = searchParams.get('until');
  if (rawUntil) {
    until = parseQueryTime(rawUntil);
    if (until === undefined) ignored.push('until');
  }

  if (since !== undefined && until !== undefined && since > until) {
    // A reversed window would silently return nothing; drop the half that is
    // clearly wrong (the start) and say the parameter was ignored.
    since = undefined;
    ignored.push('since');
  }

  let bbox: BoundingBox | undefined;
  const rawBbox = searchParams.get('bbox');
  if (rawBbox) {
    bbox = parseBbox(rawBbox);
    if (!bbox) ignored.push('bbox');
  }

  const rawQ = searchParams.get('q');
  const q = rawQ ? rawQ.trim().slice(0, 120) || undefined : undefined;

  let limit = DEFAULT_LIMIT;
  const rawLimit = searchParams.get('limit');
  if (rawLimit) {
    const parsed = /^\d+$/.test(rawLimit.trim()) ? Number(rawLimit.trim()) : Number.NaN;
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_LIMIT) limit = parsed;
    else ignored.push('limit');
  }

  return {
    query: { categories, regions, since, until, bbox, q, limit },
    ignored,
  };
}
