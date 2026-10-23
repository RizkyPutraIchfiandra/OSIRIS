import { NextResponse } from 'next/server';
import { describeSources } from '@/lib/nusawatch/service';

/**
 * GET /api/nusawatch/sources
 *
 * Describes every registered source and what the in-process cache currently
 * holds. Reads only: it never triggers an upstream fetch, so a monitoring probe
 * cannot be turned into load on BMKG.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      sources: describeSources(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
