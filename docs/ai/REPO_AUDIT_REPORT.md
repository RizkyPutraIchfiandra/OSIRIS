# OSIRIS Repository Audit Report

- Repository: `D:\My Project\OSIRIS`
- Audit date: 2026-10-23
- Branch / HEAD: `master` / `b8f7ea2` (`Wind: no swirls or doubled lines when zoomed in, and a Particles memory fix (#454)`)
- Working tree at audit time: only untracked `docs/ai/` (this documentation pack) and untracked `off` (a 2,115-byte CCTV catalogue JSON of unknown provenance). No tracked file was modified.
- Audit mode: read-only reconnaissance. No application code, tests, configuration, or assets were changed.
- Upstream: OSIRIS by `simplifaisoul`, MIT licensed. NusaWatch is a derivative/fork, not an upstream product.

## Executive summary (Bahasa Indonesia)

- Stack nyata: Next.js 16.4.2 App Router + Turbopack, React 19.2.4, TypeScript 5.9.3, Tailwind CSS v4, MapLibre GL 6.7.0, Vitest 2.1.9. Tidak ada database, ORM, atau sistem akun.
- Ukuran permukaan aplikasi besar: 87 route handler API di 48 grup, 3 halaman, 70 file komponen, 209 file di `src/lib`, dan 126 file test.
- Baseline: `npm ci`, dev server, typecheck, test, build, dan audit produksi lulus. Lint global gagal karena kehabisan heap (OOM), bukan karena kode aplikasi secara keseluruhan; penyebab utamanya file generated 1,3 MB dalam satu baris.
- Kemampuan yang sudah ada sangat luas dan berorientasi intelijen global: penerbangan, satelit, maritim, CCTV, berita, gempa, kebakaran, cuaca, konflik, cyber, pasar, OI/AI, OSINT/RECON, SDK, dan MCP.
- Risiko utama untuk NusaWatch: route OSINT/people-search dan scanner tanpa autentikasi, `stealthFetch` yang memalsukan IP/User-Agent, analytics Umami yang mengirim IP pengunjung meskipun halaman privasi mengklaim "no tracking", CSP yang sangat longgar, dan rate limit yang hanya in-memory per instance.
- Rekomendasi: jangan rebrand seluruh dashboard OSIRIS. Buat iris vertikal NusaWatch yang kecil dan terisolasi, pagari/hapus permukaan OSINT/scanner, hapus analytics dan stealth, lalu mulai dari adapter BMKG + GDACS + USGS dengan model event kanonik dan provenance.
- Status: Phase 0 selesai. Tidak ada perubahan kode aplikasi. Menunggu persetujuan eksplisit sebelum Phase 1.

## 1. Verified stack

### 1.1 Runtime, framework, and tooling

| Item | Verified value | Evidence |
|---|---|---|
| Runtime (local audit) | Node `v24.21.0` | `node -v` |
| Package manager | npm `12.0.2`, lockfile v3 (`package-lock.json`) | `cmd /c "npm --version"` |
| Runtime (container/CI) | Node 22 (`node:22-alpine`, `actions/setup-node` node-version 22) | `Dockerfile`, `.github/workflows/ci.yml` |
| Framework | Next.js `16.4.2`, App Router, Turbopack | `package.json`, `next.config.ts` |
| UI runtime | React `19.2.4`, React DOM `19.2.4` | `package.json` |
| Language | TypeScript `5.9.3`; `strict: true` | `npx tsc -v`, `tsconfig.json` |
| Styling | Tailwind CSS v4 via `@tailwindcss/postcss`; 87,916 bytes / 2,363 lines of custom CSS in `src/app/globals.css` | `package.json`, `postcss.config.mjs` |
| Map | MapLibre GL `6.7.0`; `react-map-gl` `8.1.1` | `package.json`, `src/components/OsirisMap.tsx` |
| Animation / icons | `framer-motion` `12.38.0`; `lucide-react` `1.14.0` | `package.json` |
| Charts / graphs | `lightweight-charts` `5.2.0`; `react-force-graph-2d` `1.29.1` | `package.json` |
| Media / data | `hls.js` `1.6.16`; `satellite.js` `7.0.0`; `rss-parser` `3.13.0`; `sharp` `0.35.5`; `ws` `8.21.0` | `package.json` |
| AI / vision | `onnxruntime-web` `1.30.0`; `@google/generative-ai` `0.24.1`; `google-libphonenumber` `3.2.44` | `package.json` |
| Tests | Vitest `2.1.9`, node environment, no React Testing Library/jsdom in `package.json` | `vitest.config.ts` |
| Lint | ESLint `9.39.4` flat config with `eslint-config-next` `16.4.2` | `eslint.config.mjs`, lockfile |
| Build output | `output: 'standalone'` unless `VERCEL` is set | `next.config.ts` |
| Persistence | No database, ORM, or auth. In-memory caches, `.cache/*.json`, and `runs/ledger.jsonl` only | code search; no DB dependency in `package.json` |
| License | MIT, copyright 2026 `simplifaisoul` | `LICENSE` |

### 1.2 Repository shape

| Metric | Value |
|---|---|
| API route handlers (`src/app/api/**/route.ts`) | 87 |
| Top-level API groups | 48 |
| Page files (`page.tsx`) | 3 (`/`, `/docs`, `/privacy`) |
| Component files | 70 |
| `src/lib` files | 209 |
| Test files discovered by Vitest | 126 (124 passed, 2 skipped) |

The main dashboard is a large client component: `src/app/page.tsx` is 2,223 lines / 139 KB. The map component `src/components/OsirisMap.tsx` is 3,202 lines / 194 KB. These are extension points only with caution; they are not good places to bolt a new product shell onto.

### 1.3 Deployment and infrastructure

- Docker: multi-stage `Dockerfile`, `node:22-alpine`, standalone Next output, non-root `nextjs` user, port 3000.
- Docker Compose: `osiris`, `osiris-cache` (nginx), `osiris-intel`; the app joins an external `umami_default` network.
- Vercel: conditional standalone output exists for Docker; no `vercel.json` in the checkout.
- CI: `.github/workflows/ci.yml` runs `npm ci`, `npx tsc --noEmit`, `npx vitest run`, and `npm audit --omit=dev --audit-level=high`. It does **not** run `npm run lint`.
- `deploy.sh` is a personal deployment script with a hard-coded remote host and `git add -A`; it is not a general setup path and should not be reused as-is.

## 2. Commands and baseline

All commands below were run in `D:\My Project\OSIRIS` on 2026-10-23 unless marked not run.

| Check | Command | Result | Notes |
|---|---|---|---|
| Install | `npm ci` | PASS | 507 packages; npm reported 14 dev-only advisories; no production vulnerabilities. |
| Dev server | `npm run dev -- --port 3100` | PASS | Ready in 607 ms; `/` returned 200 after an 11.8 s first compile; `/api/health` returned 200. |
| Lint (global) | `npm run lint` / `npx eslint .` | FAIL | JavaScript heap OOM with 4 GB and 8 GB limits (exit 134). The trigger is the 1.3 MB single-line generated file `src/lib/transit-routes.generated.ts`. |
| Lint (targeted) | `npx eslint src/app/api/earthquakes/route.ts` | FAIL | 1 error: `@typescript-eslint/no-explicit-any` at line 24. |
| Typecheck | `npx tsc --noEmit` | PASS | Exit 0. |
| Tests | `npx vitest run` | PASS | 124 test files passed, 2 skipped (126); 1,439 tests passed, 22 skipped (1,461); 11.44 s. |
| Build | `npm run build` | PASS | Exit 0; 58 static pages; 3 Turbopack warnings. Cold run compiled in 22.0 s; warm-cache run in 3.2 s. |
| Production dependency audit | `npm audit --omit=dev --audit-level=high` | PASS | `found 0 vulnerabilities`. |
| Docker Compose | `docker compose config` / `up` | NOT RUN | Docker CLI is not installed in the audit environment. A fresh `up` would also need the external `umami_default` network. |
| Live integration tests | `npm run test:live` | NOT RUN | Would make real requests to third-party services. |

### 2.1 Build warnings

`npm run build` reported three `Turbopack` warnings about dynamic filesystem access causing tracing of the whole project:

- `src/lib/cctv-snapshot.ts:47`
- `src/lib/nominatim.ts:81`
- `node_modules/onnxruntime-web/...` (third-party)

The dev server also emitted:

- `The "middleware" file convention is deprecated. Please use "proxy" instead.`

Next.js 16 generated an ignored `AGENTS.md` during the dev run. It is not tracked and was not edited.

### 2.2 Verified setup defects

1. `README.md`, `DOCKER.md`, and `docker-compose.yml` tell users to copy `.env.template`. The checkout contains `.env.example`, not `.env.template`.
2. `docker-compose.yml` declares `umami_default` as `external: true`. On a fresh machine without that network, `docker compose up` fails before the app starts. The README does not document creating the network or removing the dependency.
3. `.env.example` says the current code only consumes `SCANNER_URL` and `SCANNER_KEY`; the code actually reads several other variables, including `CLOUDFLARE_API_TOKEN`, `SHODAN_API_KEY`, `OPENSKY_CLIENT_ID/SECRET`, `AIS_API_KEY`, `SDK_INGEST_KEY`, and dynamic `GEMINI_API_KEY_1..8`.
4. There is no `vercel.json`; deployment assumptions live in comments and `next.config.ts`.
5. `npm run lint` is effectively unusable at the default heap, and CI does not catch it.

## 3. Directory map

Only meaningful paths from the checkout are listed.

| Path | Purpose / contents |
|---|---|
| `src/app/page.tsx` | Main OSIRIS dashboard client; layer orchestration, polling, panels, map data, OI, drawing, filters. |
| `src/app/layout.tsx` | Root metadata and global branding. Currently OSIRIS-specific (`osirisai.live`, OSIRIS keywords). |
| `src/app/globals.css` | Global design tokens and 87 KB of custom CSS. |
| `src/app/privacy/page.tsx` | Privacy statements; currently claims "No analytics, no tracking". |
| `src/app/docs/` | Public API/OI documentation page. |
| `src/app/api/` | 87 route handlers in 48 top-level groups. This is the application's server/data layer. |
| `src/components/` | 70 components: map, layers, panels, CCTV viewer, OI, OSINT, markets, drawing, alerts, share, style studio. |
| `src/components/OsirisMap.tsx` | 3,202-line MapLibre wrapper; heavy, coupled, not a clean extension point. |
| `src/components/LayerPanel.tsx` | 10 layer groups and the visible layer registry. |
| `src/components/GlobalStatusBar.tsx` | Global crypto/earthquake status strip. |
| `src/lib/` | 209 files: domain logic, source adapters, caches, SSRF guard, AI, vision, SDK, OI. |
| `src/lib/ssrf-guard.ts` | Host validation, private-range blocking, per-process rate limiting, visitor IP extraction. |
| `src/lib/sourceCache.ts` | TTL cache with in-flight de-duplication and stale-on-error fallback. |
| `src/lib/stealthFetch.ts` | Randomized User-Agent and spoofed `X-Forwarded-For`/`X-Real-IP` headers. |
| `src/lib/cctv-snapshot.ts` | CCTV catalogue snapshot on disk, configurable via `OSIRIS_CCTV_SNAPSHOT`. |
| `src/lib/oi/` | OI forecast/assist engine, providers, MCP, prompts, runs. |
| `src/lib/vision/` | Camera frame analysis, YOLOX/ONNX inference, colour/scan logic. |
| `src/lib/sdk/` | Polybolos/Lattice client and adapters. |
| `src/middleware.ts` | Umami pageview + visitor-IP analytics on every matched request. Deprecated convention in Next 16. |
| `intel/` | Separate Express service (`server.js`, port 4000) for entity expansion; has its own `node_modules`. |
| `tools/` | `prepare-map-worker.mjs`, transit feed generator, map worker loader, preview smoke script. |
| `engine/` | Only committed Python `__pycache__/*.pyc` files; no `.py` sources. |
| `runs/ledger.jsonl` | Committed demo forecast ledger. |
| `scratch/` | Committed scrape/helper scripts and `injection_tutorial.html`. |
| `public/` | Map style, icons, favicons, OG image, manifest. |
| `nginx/` | Cache/proxy configuration for the Docker Compose stack. |
| `docs/ai/` | This NusaWatch documentation pack and audit report. Untracked at audit time. |
| `docs/screenshots/` | Upstream README screenshots. |
| `.env.example` | Environment template; no secrets. |
| `.github/workflows/ci.yml` | Typecheck, unit tests, production dependency audit. |
| `Dockerfile`, `docker-compose.yml`, `DOCKER.md` | Container deployment. |
| `README.md`, `LICENSE`, `SECURITY.md` | Upstream docs, MIT license, responsible-use policy. |

## 4. Existing capabilities

### 4.1 Dashboard and UI

- Main map/dashboard orchestration: `src/app/page.tsx`.
- Map rendering and interactions: `src/components/OsirisMap.tsx`, MapLibre GL, custom style at `public/dark-matter-style.json`.
- Layer registry and groups: `src/components/LayerPanel.tsx`. Groups include Weather, Aviation, Maritime, Transit, Space, Surveillance, Hazard, Threat, Network, Net/Event Intel, Display.
- Panels and workflows: CCTV viewer, live news, markets, SCM suppliers, directions/navigation, flight watch, drawing/AOI, saved areas, share/presets, style studio, keyboard shortcuts, alerts, global status bar.
- Loading/status handling is partial and distributed; there is no single canonical event model or shared source-status contract.

### 4.2 Data and intelligence features

- Aviation: commercial/private/jets/military, airport lookup, flight watch, route history.
- Maritime: static ports/chokepoints plus optional live AIS.
- Satellites: TLE propagation, categories, orbit views.
- CCTV: large multi-source catalogue (README claims 17,000+ cameras), previews, viewer, frame proxy, on-device vision.
- Hazards: earthquakes, fires/volcanoes, severe weather, GDACS incidents.
- News/conflict: Telegram previews, RSS wire feeds, curated conflict zones.
- Cyber/network: CVE, KEV, malware/C2, Cloudflare Radar, DNS/WHOIS/BGP/certs, Shodan.
- OSINT/RECON: username enumeration, email breach lookup, phone lookup, GitHub, Hudson Rock, sanctions, crypto tracing, port scan, scanner proxy.
- Markets/SCM: Yahoo Finance, CoinGecko, maritime-linked alerts, supplier data.
- OI/AI: server Gemini endpoints, BYOK multi-provider OI, forecasts, MCP server, vision identification.
- SDK: Polybolos/Anduril-style entity ingest and stream, fail-closed API key.
- Stats/health: `/api/stats` aggregates counts by calling the app's own APIs; `/api/health` honestly reports process liveness only.

### 4.3 Persistence and state

- No database. No user accounts, sessions, or auth.
- In-memory source caches (`src/lib/sourceCache.ts`, route-local snapshots).
- Filesystem caches: `.cache/cctv-catalog.json` (configurable via `OSIRIS_CCTV_SNAPSHOT`), `.cache/nominatim.json` (configurable via `OSIRIS_NOMINATIM_CACHE`).
- Committed demo data: `runs/ledger.jsonl`.
- SDK entities live in a `globalThis` map, not durable storage.

## 5. Data-source inventory

Fields are the representative normalized fields returned by each route, not an exhaustive schema. "Failure" describes observed code behavior, not a live test of every upstream.

| Domain / source | Implementation path | Representative fields | Update / cache | Key requirement | Failure behavior |
|---|---|---|---|---|---|
| Earthquakes: USGS M2.5+ 24 h | `src/app/api/earthquakes/route.ts` | `id`, `lat`, `lng`, `depth`, `magnitude`, `place`, `time`, `url`, `tsunami`, `type`, `felt`, `alert` | `s-maxage=60`, `stale-while-revalidate=120` | None | Returns empty `earthquakes` plus error/message on non-OK or exception. |
| Fires: NASA FIRMS VIIRS/MODIS + EONET volcanoes | `src/app/api/fires/route.ts` | `lat`, `lng`, `brightness`, `confidence`, `date`, `time`, `frp`, `title`, `type` | `s-maxage=600`, `stale-while-revalidate=1200`; tries VIIRS then MODIS | None (`FIRMS_API_KEY` reserved in template, not required by this route) | Skips a failed source; may return partial fires or an empty list with error. |
| Severe weather: NASA EONET + NOAA/NWS + GDACS | `src/app/api/weather/route.ts` | `id`, `title`, `category`, `type`, `icon`, `severity`, `lat`, `lng`, `date`, `expires`, `area`, `source`, `provider` | In-memory `cachedSource` 3 min; `s-maxage=120`, `stale-while-revalidate=600` | None | Partial results; failed providers are skipped. |
| Conflict zones: curated list + BBC/Al Jazeera/NYT RSS | `src/app/api/conflicts/route.ts` | `id`, `label`, `severity`, `lat`, `lng`, `description`, `sourceUrl`, `region`, `headlines[]`, `headlineCount` | Dynamic per request; no source-key requirement | None | Failed feeds are skipped; curated zones remain. |
| Global incidents: GDACS RSS (route is named `/api/gdelt`) | `src/app/api/gdelt/route.ts` | `id`, `type`, `lat`, `lng`, `date`, `source` | `s-maxage=300`, `stale-while-revalidate=600` | None | Empty events plus `GDACS unavailable` on failure. Naming is misleading; actual GDELT is elsewhere. |
| GDELT events | `src/app/api/gdelt-events/route.ts` | Geo-coded events and counts | Route-specific cache | None | Partial/empty; inspect route before reuse. |
| Aviation: OpenSky + adsb.fi | `src/app/api/flights/route.ts` | Buckets `commercial_flights`, `private_flights`, `private_jets`, `military_flights`; callsign, position, altitude, heading, speed, provider counts, OpenSky age | OpenSky 90 s with creds / 900 s anonymous; adsb.fi ~1 request/s; `s-maxage=30/60` | Optional `OPENSKY_CLIENT_ID/SECRET`; keyless adsb.fi | Stale OpenSky snapshot retained; 429 triggers 15-min cooldown; regional adsb.fi fallback. |
| Satellites: Celestrak + SatNOGS | `src/app/api/satellites/route.ts` | NORAD id/name, TLE, category, orbit fields | `s-maxage=120`, `stale-while-revalidate=300` | None | Partial/empty if a source fails. |
| Maritime: static ports/chokepoints + optional aisstream.io | `src/app/api/maritime/route.ts` | Ships, ports, chokepoints, live nearby counts | Route-specific `max-age`/`s-maxage`; stale window | Optional `AIS_API_KEY` | Static ports continue; live ships empty without key/feed. |
| CCTV: dozens of agency/public feeds, OpenCCTV, Skyline, public webcams | `src/app/api/cctv/route.ts`; `src/app/api/cctv/*` | `id`, `lat`, `lng`, `name`, `city`, `country`, `feed_url`, `external_url`, `source` | In-memory 30 min; disk snapshot; stale-on-error | None | Per-source empty on failure; cached catalogue retained; snapshot can serve last good data. |
| CCTV image proxy / frame | `src/app/api/cctv/proxy/route.ts`, `src/app/api/cctv/frame/route.ts` | Image bytes, content type, fetch time | Frame cache 4 s; proxy cache headers | None | 400/403/404/429/502; allowlisted hosts; frame route only serves catalogue IDs. |
| Air quality: OpenAQ v2 | `src/app/api/air-quality/route.ts` | Station, PM2.5, coordinates, timestamp | Route cache; inspect before reuse | None | Partial/empty. |
| Markets: Yahoo Finance + CoinGecko + internal maritime | `src/app/api/markets/route.ts` | Symbol, price, change, alerts | `no-store` for alerts; 8 s upstream timeout | None | Partial results; alerts may be absent. |
| Cyber threats: CISA KEV + Shadowserver | `src/app/api/cyber-threats/route.ts` | CVE, vendor/product, ransomware flag, stats | Route cache | None | Partial/empty. |
| Botnet/C2: abuse.ch Feodo Tracker | `src/app/api/cyber-attacks/route.ts` | IP, port, malware, status, geo | `s-maxage=300`, `stale-while-revalidate=600` | None | Empty on failure. |
| Cloudflare Radar | `src/app/api/cloudflare-radar/route.ts` | Outages, attack origins | Capability check | `CLOUDFLARE_API_TOKEN` | 503 / hidden layers when absent. |
| Space weather: NOAA SWPC | `src/app/api/space-weather/route.ts` | Kp, alerts, X-ray flares | Route cache | None | Partial/empty. |
| Rain/radar: RainViewer | `src/app/api/rain/route.ts`, `src/app/api/radar/route.ts` | Tile timestamps, frames | Route cache | None | Empty/error. |
| Infrastructure: curated nuclear facilities + USGS M4.5 enrichment | `src/app/api/infrastructure/route.ts` | `id`, `name`, `city`, `country`, `lat`, `lng`, `status`, `reactors`, `capacityMW`, `owner`, `sourceUrl` | Static list; live enrichment | None | Static list remains if USGS enrichment fails. |
| Transit: operator GPS feeds + generated routes | `src/app/api/transit/route.ts` | Vehicles, routes, stops, status | `s-maxage=60`, `stale-while-revalidate=300` | None | Partial/empty. |
| Directions/geocoding: Valhalla, OSRM, Nominatim/Photon | `src/app/api/directions/route.ts`, `src/app/api/geosearch/route.ts` | Route geometry, steps, distance; place coordinates | Nominatim 1 req/s cache | None | Provider fallback; 429 handled. |
| OSINT/RECON: Sherlock, XposedOrNot, Hudson Rock, GitHub, Shodan/InternetDB, crt.sh, MITRE/CIRCL, OpenSanctions, blockstream/Blockscout | `src/app/api/osint/*`, `src/app/api/scanner/route.ts` | Usernames, breach names, phone metadata, host/ports/CVEs, sanctions, wallet activity | Route-specific; 5-30 requests/min per process | Optional `SHODAN_API_KEY`, chain keys, scanner backend | 400/429/500; some routes fail soft; several are people-search or network-scanning surfaces. |
| AI: Gemini server keys + BYOK OI providers | `src/app/api/ai/*`, `src/app/api/oi/*`, `src/app/api/mcp/route.ts` | Summaries, briefings, forecasts, run events | 5 req/min per IP for AI; MCP 120 req/min | `GEMINI_API_KEY_1..8` optional; BYOK headers for OI | 503/400/429; overview falls back to heuristic when no Gemini key. |
| SDK ingest/stream: Polybolos/Lattice-style entities | `src/app/api/sdk/ingest/route.ts`, `src/app/api/sdk/stream/route.ts` | Entity `id`, `position.lat/lng`, type, threat, properties | In-memory `globalThis` map; 20,000 entity cap; 2 MB body cap | `SDK_INGEST_KEY` (fail-closed) | 503 unset, 401 mismatch, 400 malformed, 413 oversized. |

### 5.1 Source notes and gaps

- No official Indonesian source is currently integrated. The README and route code contain no BMKG, BNPB, or other Indonesian government feed.
- Indonesian representation is incidental: airports `CGK`, `DPS`, `SUB` exist in `src/lib/airports.ts`; OpenCCTV SEA includes Indonesian cameras; there are a few Skyline/public webcams. There is no Indonesia-first event adapter, no province/region model, and no Indonesian-language UI.
- `src/lib/landing-cities.ts` has 20 landing cities; none are in Indonesia.
- The map and layer names are English/global-threat oriented. The privacy page is OSIRIS-specific.
- `README.md` claims "17,000+ cameras"; the actual number is dynamic and depends on upstream availability. Treat it as a catalogue-size claim, not a guarantee.
- External APIs were not individually smoke-tested in this audit except BMKG/GDACS checks noted below. Unit tests mock or fixture most of them; `RUN_LIVE_TESTS=1` is opt-in.

## 6. Quality baseline

The baseline is healthy for typecheck, tests, build, and production dependency audit. It is not healthy for lint.

| Area | Status | Notes |
|---|---|---|
| Type safety | PASS | `tsc --noEmit` exit 0 with `strict: true`. |
| Unit tests | PASS | 1,439 passed; 22 skipped; 124 files passed; 2 skipped. |
| Production build | PASS | 58 static pages; 3 non-fatal Turbopack warnings. |
| Dev server | PASS | `/` and `/api/health` returned 200. |
| Lint | FAIL | Global lint OOM; targeted lint has a real `no-explicit-any` error. |
| Production dependencies | PASS | 0 production vulnerabilities. Dev toolchain has 14 advisories from `npm ci`; not enumerated in this audit. |
| CI | PARTIAL | CI runs typecheck, tests, and production audit, but not lint. |
| E2E/browser | NOT PRESENT | No Playwright/Cypress; no React Testing Library/jsdom. |
| Live network tests | OPT-IN | `RUN_LIVE_TESTS=1`; not run. |
| Accessibility | NOT VERIFIED | No automated a11y test; manual browser review not performed beyond HTTP 200. |
| Performance | NOT VERIFIED | No Lighthouse/WebPageTest run; map renders thousands of entities by design. |

Root cause of the lint failure: `src/lib/transit-routes.generated.ts` is 1,324,759 bytes on one line. ESLint's parser/traversal exhausts the heap even with `--max-old-space-size=8192`. The generated file should be ignored in `eslint.config.mjs` (and/or split), then the remaining real lint errors fixed.

## 7. Risk list

| Severity | Risk | Evidence | Implication for NusaWatch |
|---|---|---|---|
| Critical | Unauthenticated OSINT/people-search and scanner surfaces | `src/app/api/osint/username/route.ts`, `leaks`, `phone`, `portscan`, `src/app/api/scanner/route.ts`, `src/components/OsintPanel.tsx` | Directly conflicts with the brief's non-goals (no surveillance, no probing third-party systems). Remove or fence before public deployment. |
| Critical | No authentication or accounts on nearly all API routes | 87 route handlers; no auth dependency or middleware auth | Abuse, cost, and legal exposure. Add edge rate limits and remove write/scan surfaces. |
| High | Analytics contradicts privacy page | `src/middleware.ts:7-38` sends pageview + visitor IP to Umami; `src/app/privacy/page.tsx:100` says "No analytics, no tracking"; `.env.example` says analytics are absent when unset, but middleware has a hardcoded fallback | Privacy misrepresentation. Delete Umami middleware for NusaWatch or make it explicit, opt-in, and documented. |
| High | `stealthFetch` spoofs residential IPs and rotates User-Agents | `src/lib/stealthFetch.ts:1-80` | Evades upstream rate limits and accountability; may violate provider terms. Do not use in NusaWatch adapters; remove from public paths. |
| High | Per-process, in-memory rate limits | `src/lib/ssrf-guard.ts`, route-local maps | Bypassed by restarts/multiple instances; not sufficient for public deployment. Use platform/edge limits. |
| High | Broad CSP and permissive headers | `next.config.ts` sets `default-src 'self' 'unsafe-inline' 'unsafe-eval' https: wss: data: blob:` | Weak XSS defence. Tighten after inventorying required domains; do not copy as-is. |
| Medium | Constrained but unauthenticated proxies | `src/app/api/proxy-tiles/route.ts` (cartocdn only), `src/app/api/cctv/proxy/route.ts` (allowlist), `src/app/api/cctv/frame/route.ts` (catalogue IDs), `src/app/api/mcp/route.ts` (origin check) | Still consumes server bandwidth and can be abused within allowlists. Disable non-MVP proxies or require auth. |
| Medium | Brittle external integrations and dead polling | `src/app/page.tsx:1084,1089,1174,1177` calls missing `/api/balloons` and `/api/radiation`; `:993` fetches USGS directly instead of `/api/earthquakes`; `/api/gdelt` is actually GDACS; `/api/stats` calls the app's own APIs | 404s, duplicated fetch logic, misnamed contracts, and cascading load. Fix or remove in NusaWatch. |
| Medium | Lint gate is broken and CI skips it | 1.3 MB generated file; `npm run lint` OOM; `.github/workflows/ci.yml` has no lint step | Quality regressions can merge. Ignore generated file, fix real errors, add lint to CI. |
| Medium | Setup/docs drift | `.env.template` references; external `umami_default`; `.env.example` understates read variables; no `vercel.json` | Fresh-machine setup fails or misleads. Fix docs and compose before portfolio publication. |
| Medium | Privacy/IP geolocation data flow | `src/app/api/geo/route.ts` sends visitor IP to ipapi.co, freeipapi.com, ip-api.com; privacy page discloses it | Unnecessary for NusaWatch MVP. Remove or make opt-in with a clear notice. |
| Medium | Unverified data-source licenses/terms | README acknowledges sources but not every feed's terms; CCTV/YouTube embeds and map tiles are separate | Do not assume MIT covers data, tiles, or embeds. Review before launch and attribute. |
| Low | Unused dependency | `@vercel/analytics` in `package.json`; no import found in `src` | Remove to reduce surface/confusion. |
| Low | Committed generated/demo artifacts | `engine/__pycache__/*.pyc` only; `runs/ledger.jsonl`; `scratch/*.js`, `scratch/injection_tutorial.html` | Confusing repository, possible security-review flags. Do not ship in portfolio build without explanation. |
| Low | Next 16 middleware deprecation | dev/build warning | Plan migration to `proxy.ts`; not urgent, but do it before Next 17. |
| Low | Hard-coded deployment host | `deploy.sh` | Not a secret, but personal infrastructure detail. Replace with env/config or remove from public docs. |

### 7.1 Secret handling

- No `.env` or `.env.local` exists in the checkout; none was read.
- Only variable names from `.env.example` and code were recorded. No secret values are in this report.
- Server-only variables include `SCANNER_URL`, `SCANNER_KEY`, `SHODAN_API_KEY`, `CLOUDFLARE_API_TOKEN`, `ETHERSCAN_API_KEY`, `HELIUS_API_KEY`, `OPENSKY_CLIENT_ID`, `OPENSKY_CLIENT_SECRET`, `AIS_API_KEY`, `SDK_INGEST_KEY`, `GITHUB_WEBHOOK_SECRET`, `GITHUB_WEBHOOK_FORWARD_URL`, `INTEL_URL`, `UMAMI_WEBSITE_ID`, `OI_*`, and `GEMINI_API_KEY_1..8`.
- `OSIRIS_PORT` is a Compose/host port setting, not consumed by application code.
- `GEMINI_API_KEY_*` is read dynamically and is not documented in the active part of `.env.example`; ensure it remains server-only and is never exposed to the client.
- The OI feature intentionally accepts user-supplied model keys in request headers. That is a product decision with privacy/cost implications; do not log those headers.

## 8. Recommended extension points

### 8.1 Reuse

| Need | Existing asset | Recommendation |
|---|---|---|
| Upstream safety | `src/lib/ssrf-guard.ts` | Reuse for any user-controlled URL. BMKG/GDACS/USGS fixed URLs do not need it. |
| Caching pattern | `src/lib/sourceCache.ts` | Reuse the TTL + in-flight + stale-on-error pattern, but create a typed NusaWatch cache rather than overloading camera semantics. |
| Map stack | `react-map-gl` + `maplibre-gl`, `public/dark-matter-style.json`, `tools/prepare-map-worker.mjs` | Build a small dedicated map component. Do not extend the 3,202-line `OsirisMap.tsx` for MVP. |
| Test runner | `vitest.config.ts` | Add node-environment unit/route tests. Do not add a browser test stack until a UI behavior needs it. |
| Design tokens | `src/app/globals.css` | Read tokens for consistency, but scope NusaWatch styles in a new stylesheet/route to avoid rewriting 87 KB of legacy CSS. |
| Build/deploy | `next.config.ts`, `Dockerfile` | Preserve standalone output; remove Umami network dependency for the NusaWatch deployment. |

### 8.2 Do not extend

- `src/app/page.tsx` and `src/components/OsirisMap.tsx` as monoliths.
- `src/components/OsintPanel.tsx`, `FingerprintSearch.tsx`, `src/app/api/osint/*`, `src/app/api/scanner/*` for the NusaWatch public surface.
- `src/middleware.ts` analytics behavior.
- `src/lib/stealthFetch.ts` for new source adapters.

## 9. NusaWatch implementation recommendations

### 9.1 Product/scope fence

NusaWatch should be a fenced vertical slice, not a reskin of the entire dashboard. The public product should expose only:

- One overview page.
- One event explorer (list + map + detail).
- A small set of public, permitted sources.
- Category/region/time filters.
- Source provenance and freshness.
- Loading, empty, error, stale, and partial states.

Keep the OSIRIS dashboard available only as a local/legacy reference during development. Do not deploy it publicly alongside NusaWatch unless the OSINT, scanner, SDK, MCP, CCTV proxy, and analytics surfaces are removed or authenticated.

### 9.2 First vertical slice (recommended order)

1. **Canonical event model** in `src/lib/nusawatch/types.ts`, adapted from `docs/ai/06_DATA_CONTRACTS.md` to real payloads.
2. **BMKG adapter** in `src/lib/nusawatch/sources/bmkg.ts` for `autogempa.json`, `gempaterkini.json`, and `gempadirasakan.json`.
3. **GDACS adapter** in `src/lib/nusawatch/sources/gdacs.ts` for regional floods/cyclones/droughts; filter to an Indonesia bounding box.
4. **USGS adapter** in `src/lib/nusawatch/sources/usgs.ts` as a global fallback and cross-check.
5. **Normalizer + registry + freshness** in `normalize.ts`, `registry.ts`, `freshness.ts`.
6. **API route** `src/app/api/nusawatch/events/route.ts` with query params `category`, `region`, `since`, `until`, `bbox`, `q`, `limit`.
7. **Source status route** `src/app/api/nusawatch/sources/route.ts`.
8. **UI route** `src/app/watch/page.tsx` + `layout.tsx` (keep the current `/` dashboard untouched until the NusaWatch slice is stable).
9. **Components** under `src/components/nusawatch/`: `EventExplorer`, `EventList`, `EventDetail`, `FilterBar`, `SourceStatus`, `FreshnessBadge`, `EventMap`, `States`.
10. **Tests** for normalization, date/coordinate parsing, deterministic IDs, region/time/category filters, freshness, partial failure, and route contract.

### 9.3 Verified Indonesian source candidate

BMKG open-data endpoints were checked live during this audit:

| Endpoint | Audit result | Observed shape |
|---|---|---|
| `https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json` | HTTP 200, 445 bytes | `Infogempa.gempa` object: `Tanggal`, `Jam`, `DateTime`, `Coordinates`, `Lintang`, `Bujur`, `Magnitude`, `Kedalaman`, `Wilayah`, `Potensi`, `Dirasakan`, `Shakemap` |
| `https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json` | HTTP 200, 4,156 bytes | `Infogempa.gempa[]`, recent events with the same fields |
| `https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json` | HTTP 200, 4,787 bytes | `Infogempa.gempa[]`, felt events with `Dirasakan` |
| `https://data.bmkg.go.id/DataMKG/TEWS/autogempa.xml` | HTTP 200, 572 bytes | XML variant (not needed for MVP) |
| `https://www.gdacs.org/xml/rss.xml` | HTTP 200, 939,838 bytes | GDACS RSS; already parsed by `/api/gdelt` |

Notes:

- BMKG `DateTime` is ISO-8601 with `+00:00`; `Jam` is local WIB. Parse `DateTime` as the canonical instant; keep `Jam` only as display/source text.
- `Coordinates` is `"lat,lng"`; `Lintang`/`Bujur` are human-readable (`LS`/`BT`). Validate ranges and reject malformed values.
- `Magnitude` and `Kedalaman` are strings with units. Parse numerically, preserve the original text.
- `Shakemap` is a filename, not a full URL; construct or link through the official BMKG page, and do not invent a URL pattern without verifying it.
- BMKG terms/attribution were not fully reviewed in this audit. Treat that as an open task before public launch.

### 9.4 Canonical mapping

Use the proposed `IntelligenceEvent` shape from `docs/ai/06_DATA_CONTRACTS.md` with minimal adaptations:

- `id`: deterministic. BMKG has no stable event ID; derive from source + `DateTime` + coordinates + magnitude, e.g. a SHA-256 prefix. GDACS uses its event id. USGS uses its feature id.
- `sourceId` / `sourceName`: registry key, display name.
- `category`: `earthquake`, `flood`, `cyclone`, `volcano`, `fire`, `other`.
- `eventTime`: source time (BMKG `DateTime`; GDACS date; USGS `time`).
- `fetchedAt`: server ingestion time.
- `location`: label from `Wilayah`, coordinates, optional region/island. Do not geocode every event in the MVP.
- `severity`: preserve source-specific scheme and units; do not collapse magnitude and GDACS alert levels into one universal score.
- `sourceUrl`: official event/report URL where available.
- `freshness`: derived from source-specific TTL and last successful fetch.
- `limitations`: e.g. "BMKG autogempa is the latest event, not a complete catalogue", "GDACS may lag", "USGS global feed may omit small local events".

Region filter for MVP: a documented coarse region (`Sumatra`, `Java`, `Kalimantan`, `Sulawesi`, `Papua`, `Bali/Nusa Tenggara`, `Maluku`) derived from coordinates, or a bounding-box filter. Label it as an approximation; do not pretend it is an official administrative boundary.

### 9.5 UI direction

- Product name and copy in Indonesian; neutral, non-sensational language.
- Dark navy/charcoal surfaces, teal/cyan accent, thin borders, restrained shadows. Avoid copying OSIRIS's exact gold/cyan dashboard identity.
- Desktop: header, filter bar, list/map split, detail panel.
- Mobile: list-first with a map toggle; filters in a drawer; detail as a sheet; no tiny tap targets.
- Every data component must have loading, loaded, empty, error, stale, and partial states.
- Map markers must derive from normalized events; invalid coordinates excluded; map must have a non-map list alternative.
- Show `eventTime`, `fetchedAt`, source name, source link, and limitations in the detail view.

### 9.6 Security/privacy changes required before deployment

1. Remove or fence `/api/osint/*`, `/api/scanner`, `/api/sdk/*`, `/api/mcp`, and CCTV proxies from the public NusaWatch deployment.
2. Delete Umami middleware or replace it with a no-op; update the privacy page to match reality.
3. Remove IP geolocation (`/api/geo`) from the MVP, or make it opt-in with a clear notice and no logging.
4. Do not use `stealthFetch` in NusaWatch adapters; use honest `fetch` with a descriptive User-Agent.
5. Add platform-level rate limiting to `/api/nusawatch/*`; do not rely only on in-memory maps.
6. Tighten CSP after listing required domains; start from a deny-by-default policy.
7. Add attribution and a fork notice; preserve `LICENSE` and upstream copyright.

### 9.7 Licensing and attribution

- Keep the MIT `LICENSE` and copyright notice.
- Add a `NOTICE` or `docs/ATTRIBUTION.md` identifying OSIRIS, the upstream URL, and the MIT license.
- State clearly in `README.md` that NusaWatch is a derivative fork and is not endorsed by upstream maintainers.
- Keep upstream attribution in an About/Credits view, not only in the README.
- Review data-source terms separately: BMKG, GDACS, USGS, NASA FIRMS, OpenStreetMap/Nominatim, MapLibre styles/tiles, YouTube/CCTV embeds. The MIT license does not cover those.
- Do not use the OSIRIS name/logo as the NusaWatch brand.

## 10. Minimal next-task plan (NW-005 proposal)

This is a file-level proposal, not implemented code. It is intentionally small and reversible.

### Phase 1A — Truth and fence

- Add `src/proxy.ts` (Next 16 convention) or remove `src/middleware.ts`; no analytics. If a proxy is needed for legacy blocking, implement an allowlist for NusaWatch paths and return 404 for OSINT/scanner/SDK/MCP.
- Update `src/app/privacy/page.tsx` to describe actual data flows; no "no tracking" claim unless true.
- Update `README.md`, `DOCKER.md`, `.env.example`, and `docker-compose.yml` to fix `.env.template`, document keys, and make Umami optional.
- Remove `@vercel/analytics` if unused.
- Ignore `src/lib/transit-routes.generated.ts` in `eslint.config.mjs`; fix the `no-explicit-any` error in `src/app/api/earthquakes/route.ts`; add lint to CI.
- Keep the existing dashboard at `/` during this phase.

### Phase 1B — NusaWatch shell

- `src/app/watch/layout.tsx`: NusaWatch metadata, header, footer, attribution.
- `src/app/watch/page.tsx`: overview/explorer shell.
- `src/components/nusawatch/*`: `EventExplorer`, `EventList`, `EventDetail`, `FilterBar`, `SourceStatus`, `FreshnessBadge`, `EventMap`, `EmptyState`, `ErrorState`, `LoadingState`.
- New scoped stylesheet (e.g. `src/app/nusawatch.css`) rather than rewriting `globals.css`.

### Phase 2 — Data slice

- `src/lib/nusawatch/types.ts`
- `src/lib/nusawatch/sources/bmkg.ts`
- `src/lib/nusawatch/sources/gdacs.ts`
- `src/lib/nusawatch/sources/usgs.ts`
- `src/lib/nusawatch/normalize.ts`
- `src/lib/nusawatch/registry.ts`
- `src/lib/nusawatch/freshness.ts`
- `src/lib/nusawatch/filters.ts`
- `src/lib/nusawatch/fixtures/*.json`
- `src/app/api/nusawatch/events/route.ts`
- `src/app/api/nusawatch/sources/route.ts`
- Tests alongside each module and the route.

### Phase 3 — Map and polish

- Map/list synchronization, responsive/mobile behavior, keyboard/focus, reduced motion, empty/error/stale states.
- Switch `/` to NusaWatch only after the slice is stable; move or retire the legacy OSIRIS dashboard at that point.

## 11. Phased roadmap

| Phase | Deliverable | Exit gate |
|---|---|---|
| 0 — Audit | This report, verified commands, inventory, risks | Agent can point to real entry points, routes, adapters, tests, deployment, and license. No broad refactor. |
| 1 — Safe baseline and identity | Fence OSINT/scanner, remove analytics/stealth/IP geolocation, fix setup docs, lint baseline, NusaWatch shell at `/watch` | Existing app still builds; public surface is NusaWatch-only; privacy claims match code. |
| 2 — Canonical model + first source | BMKG adapter, normalizer, fixture tests, `/api/nusawatch/events` | Real BMKG data normalized; malformed fields handled; event/fetch times separate. |
| 3 — Explorer | List/detail, category/region/time filters, provenance, freshness, states | Filters and detail work; empty/error/stale states verified; tests pass. |
| 4 — Map | Map markers from normalized events, list/map selection sync, mobile, accessibility | Invalid coordinates excluded; map failure communicated; list alternative exists. |
| 5 — Reliability/portfolio | Lint/CI, docs, attribution, screenshots, deployment | Fresh clone/run works; build/tests/lint pass; README explains fork, sources, limitations. |
| 6 — Optional AI brief | User-triggered cited summary | Clearly labelled AI-generated; source-linked; safe failure. |

## 12. Unknowns

- The app was not manually reviewed at desktop/mobile widths beyond a successful HTTP load. Visual, keyboard, and responsive behavior remain unverified.
- Docker Compose was not executed because Docker is absent; the external `umami_default` failure is inferred from `external: true`, not reproduced.
- Individual external APIs were not all live-tested. BMKG and GDACS were checked; most others are covered by mocks/fixtures or were not exercised.
- BMKG, BNPB, GDACS, and other data-source terms/attribution requirements were not fully reviewed.
- No full secret/history scan was performed. No `.env` exists in the checkout, and no secret values were read.
- The provenance of the untracked `off` file is unknown. It is a CCTV catalogue JSON, not modified by this audit.
- `engine/` contains only compiled Python bytecode; the original sources are not in the checkout, so that subsystem cannot be reviewed or run.
- The exact number of live CCTV cameras is dynamic and was not independently counted.
- The 14 dev-only dependency advisories were not enumerated; only the production audit result (0) is verified.
- No Lighthouse/performance or accessibility audit was run.

## Appendix A — API route inventory

Top-level groups under `src/app/api` (87 route handlers total):

`ai`, `air-quality`, `aircraft`, `arcgis`, `cctv`, `chain`, `cloudflare-radar`, `conflicts`, `country-risk`, `crypto`, `cyber-attacks`, `cyber-threats`, `directions`, `earthquakes`, `entity`, `fires`, `flight-route`, `flights`, `frontlines`, `gdelt`, `gdelt-events`, `geo`, `geosearch`, `github-webhook`, `health`, `infrastructure`, `live-news`, `malware`, `maritime`, `markets`, `mcp`, `news`, `oi`, `osint`, `proxy-tiles`, `radar`, `rain`, `region-dossier`, `satellites`, `scanner`, `scm-suppliers`, `sdk`, `sentinel`, `space-weather`, `stats`, `transit`, `weather`, `wind`.

Notable sub-routes under `osint`: `bgp`, `certs`, `crypto`, `cve`, `dns`, `fingerprint`, `github`, `hudsonrock`, `ip`, `leaks`, `mac`, `phone`, `portscan`, `sanctions`, `shodan`, `sweep`, `threats`, `username`, `whois`.

## Appendix B — Environment variable names

Names only; no values.

- Application/data: `SCANNER_URL`, `SCANNER_KEY`, `SHODAN_API_KEY`, `CLOUDFLARE_API_TOKEN`, `ETHERSCAN_API_KEY`, `HELIUS_API_KEY`, `FIRMS_API_KEY`, `OPENSKY_CLIENT_ID`, `OPENSKY_CLIENT_SECRET`, `N2YO_API_KEY`, `AIS_API_KEY`.
- AI/OI: `GEMINI_API_KEY_1` through `GEMINI_API_KEY_8`, `OI_DISABLED`, `OI_MAX_ACTIVE`, `OI_MCP_ORIGINS`, `OI_PUBLIC_ORIGIN`.
- Ingest/webhooks: `SDK_INGEST_KEY`, `GITHUB_WEBHOOK_SECRET`, `GITHUB_WEBHOOK_FORWARD_URL`, `INTEL_URL`, `INTEL_PORT` (intel service).
- Analytics: `UMAMI_WEBSITE_ID` (middleware also has a hardcoded default).
- Runtime/tests: `NODE_ENV`, `RUN_LIVE_TESTS`, `OSIRIS_CCTV_SNAPSHOT`, `OSIRIS_NOMINATIM_CACHE`, `OSIRIS_NOMINATIM_GAP_MS`.
- Docker/host: `OSIRIS_PORT`, `PORT`, `HOSTNAME`, `UV_THREADPOOL_SIZE`.

No `NEXT_PUBLIC_*` variables were found in `src`.

## Appendix C — Truth labels used

- **Verified**: inspected in this checkout and/or executed during the audit.
- **Proposed**: a NusaWatch design recommendation, not implemented.
- **Unknown**: not verified; listed in section 12.

The repository remains the source of truth. If this report conflicts with a later checkout, re-inspect before acting.
