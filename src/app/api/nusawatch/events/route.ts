import { NextResponse } from 'next/server';
import { filterEvents } from '@/lib/nusawatch/filters';
import { parseEventQuery } from '@/lib/nusawatch/query';
import { loadAllEvents } from '@/lib/nusawatch/service';
import type { EventsResponse } from '@/lib/nusawatch/types';

/**
 * GET /api/nusawatch/events
 *
 * Query: category, region, since, until, bbox, q, limit.
 *
 * Partial upstream failure is a 200 with `partial: true` and a per-source
 * report — the events that did arrive are still worth showing. 503 is reserved
 * for "every source failed", which is the only case where an empty list would
 * be misleading rather than informative.
 *
 * Cache headers match the source TTL: 60s at the edge, with stale-while-
 * revalidate so a slow BMKG response never holds up a reader.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { query, ignored } = parseEventQuery(url.searchParams);

  const load = await loadAllEvents();
  const { events, matched } = filterEvents(load.events, query);

  const allFailed = load.reports.length > 0 && load.reports.every(report => report.health === 'failed');

  const body: EventsResponse = {
    generatedAt: load.generatedAt,
    events,
    matched,
    total: load.events.length,
    partial: load.partial,
    ignoredParams: ignored,
    sources: load.reports,
  };

  return NextResponse.json(body, {
    status: allFailed ? 503 : 200,
    headers: {
      'Cache-Control': allFailed
        ? 'no-store'
        : 'public, s-maxage=60, stale-while-revalidate=120',
      'X-NusaWatch-Partial': load.partial ? 'true' : 'false',
    },
  });
}
