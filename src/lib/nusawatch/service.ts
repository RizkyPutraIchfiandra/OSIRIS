import { cachedFetch, peekCache } from './cache';
import { mergeSources } from './dedupe';
import { assessFreshness } from './freshness';
import { BMKG_SOURCE_ID, SOURCES, USGS_SOURCE_ID } from './registry';
import { fetchBmkgEvents } from './sources/bmkg';
import { fetchUsgsEvents } from './sources/usgs';
import type { IntelligenceEvent, SourceReport } from './types';

/**
 * Source orchestration: cache → adapter → canonical events + a status report.
 *
 * The route does not talk to adapters directly. Everything a reader needs to
 * judge the data — health, last fetch, why it is degraded — is produced here,
 * once, so the API response and the UI cannot disagree about it.
 *
 * Sources are loaded independently and in parallel; a failing source degrades
 * the answer instead of taking it down. Only the route decides that *every*
 * source failing is a 503.
 */

export interface SourceLoad {
  events: IntelligenceEvent[];
  report: SourceReport;
}

export interface AllSourcesLoad {
  events: IntelligenceEvent[];
  reports: SourceReport[];
  partial: boolean;
  /** Ingestion time of the newest successful source, for the response header. */
  generatedAt: string;
  /** Cross-source identity outcome, for tests and diagnostics. */
  crossChecked: number;
  addedFromSecondary: number;
}

/** The minimum every adapter result shares, regardless of source-specific fields. */
interface SourceResult {
  events: IntelligenceEvent[];
  fetchedAt: string;
  /** True when the adapter answered with a subset of its endpoints. */
  partial?: boolean;
  error?: string;
}

function descriptorReport(sourceId: string): Pick<
  SourceReport,
  'id' | 'name' | 'attribution' | 'homepage' | 'limitations'
> {
  const descriptor = SOURCES[sourceId];
  return {
    id: descriptor.id,
    name: descriptor.name,
    attribution: descriptor.attribution,
    homepage: descriptor.homepage,
    limitations: descriptor.limitations,
  };
}

async function loadSource(
  sourceId: string,
  fetcher: () => Promise<SourceResult>,
): Promise<SourceLoad> {
  const descriptor = SOURCES[sourceId];

  try {
    const read = await cachedFetch<SourceResult>(sourceId, fetcher, {
      ttlMs: descriptor.ttlMs,
    });

    const freshness = assessFreshness(read.value.fetchedAt, descriptor.freshForMs);
    const health: SourceReport['health'] =
      read.servedStale || read.value.partial || freshness === 'stale' ? 'degraded' : 'ok';

    return {
      events: read.value.events,
      report: {
        ...descriptorReport(sourceId),
        health,
        eventCount: read.value.events.length,
        lastFetchedAt: read.value.fetchedAt,
        servedStale: read.servedStale,
        error: read.value.error,
      },
    };
  } catch (error) {
    const last = peekCache<SourceResult>(sourceId);

    return {
      events: [],
      report: {
        ...descriptorReport(sourceId),
        health: 'failed',
        eventCount: 0,
        lastFetchedAt: last?.value.fetchedAt,
        servedStale: false,
        error: error instanceof Error ? error.message : 'Sumber tidak dapat dihubungi.',
      },
    };
  }
}

export function loadBmkgEvents(): Promise<SourceLoad> {
  return loadSource(BMKG_SOURCE_ID, () => fetchBmkgEvents());
}

export function loadUsgsEvents(): Promise<SourceLoad> {
  return loadSource(USGS_SOURCE_ID, () => fetchUsgsEvents());
}

export async function loadAllEvents(): Promise<AllSourcesLoad> {
  const [bmkg, usgs] = await Promise.all([loadBmkgEvents(), loadUsgsEvents()]);
  const reports = [bmkg.report, usgs.report];

  const merged = mergeSources(bmkg.events, usgs.events);

  const generatedAt =
    reports
      .map(report => report.lastFetchedAt)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? new Date().toISOString();

  return {
    events: merged.events,
    reports,
    partial: reports.some(report => report.health !== 'ok'),
    generatedAt,
    crossChecked: merged.crossChecked,
    addedFromSecondary: merged.addedFromSecondary,
  };
}

/** Registry + cached state, without triggering a fetch. */
export function describeSources(): Array<{
  id: string;
  name: string;
  homepage: string;
  feed: string;
  categories: string[];
  requiresAuth: boolean;
  attribution: string;
  limitations: string[];
  lastFetchedAt?: string;
  cachedEventCount?: number;
  cacheExpired?: boolean;
}> {
  return Object.values(SOURCES).map(descriptor => {
    const cached = peekCache<SourceResult>(descriptor.id);
    return {
      id: descriptor.id,
      name: descriptor.name,
      homepage: descriptor.homepage,
      feed: descriptor.feed,
      categories: descriptor.categories,
      requiresAuth: descriptor.requiresAuth,
      attribution: descriptor.attribution,
      limitations: descriptor.limitations,
      lastFetchedAt: cached?.value.fetchedAt,
      cachedEventCount: cached?.value.events.length,
      cacheExpired: cached?.stale,
    };
  });
}
