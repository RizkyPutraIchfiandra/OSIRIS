import { cachedFetch, peekCache } from './cache';
import { assessFreshness } from './freshness';
import { BMKG_SOURCE_ID, SOURCES } from './registry';
import { fetchBmkgEvents, type BmkgFetchResult } from './sources/bmkg';
import type { IntelligenceEvent, SourceReport } from './types';

/**
 * Source orchestration: cache → adapter → canonical events + a status report.
 *
 * The route does not talk to adapters directly. Everything a reader needs to
 * judge the data — health, last fetch, why it is degraded — is produced here,
 * once, so the API response and the UI cannot disagree about it.
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
}

function descriptorReport(): Pick<SourceReport, 'id' | 'name' | 'attribution' | 'homepage' | 'limitations'> {
  const descriptor = SOURCES[BMKG_SOURCE_ID];
  return {
    id: descriptor.id,
    name: descriptor.name,
    attribution: descriptor.attribution,
    homepage: descriptor.homepage,
    limitations: descriptor.limitations,
  };
}

export async function loadBmkgEvents(): Promise<SourceLoad> {
  const descriptor = SOURCES[BMKG_SOURCE_ID];

  try {
    const read = await cachedFetch<BmkgFetchResult>(
      BMKG_SOURCE_ID,
      () => fetchBmkgEvents(),
      { ttlMs: descriptor.ttlMs },
    );

    const freshness = assessFreshness(read.value.fetchedAt, descriptor.freshForMs);
    const health: SourceReport['health'] =
      read.servedStale || read.value.partial || freshness === 'stale' ? 'degraded' : 'ok';

    return {
      events: read.value.events,
      report: {
        ...descriptorReport(),
        health,
        eventCount: read.value.events.length,
        lastFetchedAt: read.value.fetchedAt,
        servedStale: read.servedStale,
        error: read.value.error,
      },
    };
  } catch (error) {
    const last = peekCache<BmkgFetchResult>(BMKG_SOURCE_ID);

    return {
      events: [],
      report: {
        ...descriptorReport(),
        health: 'failed',
        eventCount: 0,
        lastFetchedAt: last?.value.fetchedAt,
        servedStale: false,
        error: error instanceof Error ? error.message : 'Sumber tidak dapat dihubungi.',
      },
    };
  }
}

export async function loadAllEvents(): Promise<AllSourcesLoad> {
  const bmkg = await loadBmkgEvents();
  const reports = [bmkg.report];

  const generatedAt = reports
    .map(report => report.lastFetchedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? new Date().toISOString();

  return {
    events: bmkg.events,
    reports,
    partial: reports.some(report => report.health !== 'ok'),
    generatedAt,
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
    const cached = peekCache<BmkgFetchResult>(descriptor.id);
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
