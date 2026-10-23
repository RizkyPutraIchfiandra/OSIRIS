import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';

/**
 * NusaWatch surface = the only thing a NusaWatch deployment is allowed to serve.
 * Kept as a predicate so the fence, the analytics skip and the tests all agree.
 */
function isNusawatchSurface(pathname: string): boolean {
  return (
    pathname === '/watch' ||
    pathname.startsWith('/watch/') ||
    pathname === '/api/nusawatch' ||
    pathname.startsWith('/api/nusawatch/')
  );
}

/** Health checks are infrastructure, not product surface. */
function isHealthCheck(pathname: string): boolean {
  return pathname === '/api/health';
}

export function middleware(request: NextRequest, event: NextFetchEvent) {
  const pathname = request.nextUrl.pathname;

  /* Deployment fence.
   *
   * The repository is a fork: OSIRIS stays intact for upstream users, while a
   * NusaWatch deployment must not expose OSINT, scanner, CCTV or analytics
   * routes. `NUSAWATCH_FENCE=1` turns the network surface into exactly
   * `/watch`, `/api/nusawatch/*`, `/api/health` and static assets, and sends
   * the dashboard root to `/watch` instead of 404 (a visitor arriving at the
   * domain root should land on the product, not on an error).
   *
   * Off by default so local development and the upstream project behave
   * exactly as before. */
  if (process.env.NUSAWATCH_FENCE === '1') {
    if (pathname === '/') {
      const target = request.nextUrl.clone();
      target.pathname = '/watch';
      return NextResponse.redirect(target, 307);
    }

    /* The upstream `public/robots.txt` and `public/sitemap.xml` describe the
     * OSIRIS dashboard, its scanner and OSINT routes. A NusaWatch deployment
     * must not hand that to crawlers, so both are answered here instead. The
     * matcher lists them explicitly because the asset pattern excludes
     * `.txt` and `.xml`. */
    if (pathname === '/robots.txt') {
      return new NextResponse(
        [
          '# NusaWatch — pantauan gempa Indonesia',
          'User-agent: *',
          'Allow: /watch',
          'Disallow: /api/',
          '',
          `Sitemap: ${request.nextUrl.origin}/sitemap.xml`,
          '',
        ].join('\n'),
        { headers: { 'content-type': 'text/plain; charset=utf-8' } },
      );
    }

    if (pathname === '/sitemap.xml') {
      const lastmod = new Date().toISOString().slice(0, 10);
      return new NextResponse(
        [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          '  <url>',
          `    <loc>${request.nextUrl.origin}/watch</loc>`,
          `    <lastmod>${lastmod}</lastmod>`,
          '    <changefreq>hourly</changefreq>',
          '    <priority>1.0</priority>',
          '  </url>',
          '</urlset>',
          '',
        ].join('\n'),
        { headers: { 'content-type': 'application/xml; charset=utf-8' } },
      );
    }

    if (!isNusawatchSurface(pathname) && !isHealthCheck(pathname)) {
      return new NextResponse('Not Found', {
        status: 404,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }
  }

  /* Analytics belong to the OSIRIS dashboard. `/watch` is a public service for
   * people looking for earthquake information, and its visitors' IP addresses
   * have no business in someone else's self-hosted Umami instance. API routes
   * were already excluded by the matcher when it excluded `/api`; the matcher
   * now includes them so the fence can see them, so skip them explicitly. */
  const collectAnalytics = !isNusawatchSurface(pathname) && !pathname.startsWith('/api');

  if (collectAnalytics) {
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown OSIRIS Client';

    const basePayload = {
      hostname: request.nextUrl.hostname,
      language: "en-US",
      referrer: request.headers.get('referer') || "",
      screen: "1920x1080",
      title: "OSIRIS",
      url: pathname,
      website: process.env.UMAMI_WEBSITE_ID || "cd8f216c-fc3f-45f5-ba1a-e10309a61d18"
    };

    /* Bounded, because these are fire-and-forget analytics on the critical path.
       `umami-umami-1` only resolves inside the production compose network; on a
       developer's machine it is ENOTFOUND, and two unbounded requests per page
       view accumulated against the shared connection pool until the app's own
       API routes could not get a socket. The CCTV route would then time out
       region after region and the map came up half empty — the analytics were
       starving the thing they were measuring. */
    const pageView = fetch('http://umami-umami-1:3000/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': userAgent, 'x-forwarded-for': ip },
      body: JSON.stringify({ payload: basePayload, type: "event" }),
      signal: AbortSignal.timeout(2000),
    }).catch(() => {});

    const ipEvent = fetch('http://umami-umami-1:3000/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': userAgent, 'x-forwarded-for': ip },
      body: JSON.stringify({
        payload: { ...basePayload, name: "Network Log", data: { IP: ip } },
        type: "event"
      }),
      signal: AbortSignal.timeout(2000),
    }).catch(() => {});

    event.waitUntil(Promise.all([pageView, ipEvent]));
  }

  return NextResponse.next();
}

/* Assets are excluded, not just pages. MapLibre 6 loads its worker from
   /vendor/maplibre/<version>/ at runtime, and the basemap style from
   /dark-matter-style.json — neither is under _next/static, so both used to
   match here and pay two umami round trips before the map could start. That is
   the same starvation that 2f375dd fixed for the CCTV routes, moved onto the
   map's critical path. Analytics wants page views; asset fetches are not one.

   `/api` is now included so the deployment fence can 404 non-NusaWatch API
   routes. The handler skips analytics for it. */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|vendor|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mjs|js|css|json|pbf|mvt|woff|woff2|ico|txt)$).*)',
    /* Listed explicitly: the pattern above skips every `.txt` and `.xml`, and
       under the fence these two must not serve the upstream OSIRIS copy. */
    '/robots.txt',
    '/sitemap.xml',
  ],
};
