# Current Task Board

The coding agent must keep this file current. Use one active implementation task at a time.

## Current milestone

Phase 2 delivered: second source, map, deployment fence, operations documentation and a usable lint baseline. The NusaWatch surface is ready to deploy with `NUSAWATCH_FENCE=1`; no public deployment has been performed from this machine.

## Status definitions
- TODO: not started
- IN PROGRESS: currently being worked on
- BLOCKED: waiting for a decision, access, or external dependency
- DONE: acceptance criteria checked with evidence

## Tasks

| ID | Task | Status | Acceptance evidence |
|---|---|---|---|
| NW-001 | Inspect repository and record verified stack | DONE | `docs/ai/REPO_AUDIT_REPORT.md` sections 1 and 3; branch `master`, HEAD `b8f7ea2` at audit time |
| NW-002 | Run baseline app and available checks | DONE | Audit report section 2: dev, typecheck, 1,439 tests, build, production audit pass; lint OOM documented |
| NW-003 | Inventory existing UI, routes, data sources, tests | DONE | Audit report sections 3–6 and Appendix A: 87 routes, 48 groups, 70 components, 209 lib files, 126 test files |
| NW-004 | Confirm license, attribution, and environment rules | DONE | Audit report sections 1, 7.1, 9.7, Appendix B; MIT license preserved, variable names only, no secret values |
| NW-005 | Propose minimal rebrand implementation plan | DONE | Audit report sections 9–10: fenced vertical slice, file-level plan, BMKG endpoint verification, phase gates |
| NW-006 | Implement NusaWatch shell redesign | DONE | `src/app/watch/{layout,page}.tsx` + `nusawatch.css`; scoped `.nw-root` tokens, Indonesian copy, list/detail grid, mobile sheet, disclaimer. `/` dashboard left intact apart from metadata extraction |
| NW-007 | Define canonical event type against real payloads | DONE | `src/lib/nusawatch/types.ts`; real BMKG payloads captured 2026-10-23 into `__fixtures__/`; `bmkg.test.ts` asserts field-by-field mapping and merge behaviour |
| NW-008 | Deliver first real event vertical slice | DONE | `/api/nusawatch/events` → `/watch` list/detail with per-event provenance. Live check: 27 real events, `partial=false` |
| NW-009 | Add filters and map/list synchronization | DONE | Server-side `category`, `region`, `since`, `until`, `bbox`, `q`, `limit` in `filters.ts`/`query.ts`, covered by unit tests; UI search/region/window/category chips; unusable parameters reported in `ignoredParams` |
| NW-010 | Add freshness/source status UI | DONE | `freshness.ts` (ingestion time, never event time), `FreshnessBadge`, `SourceStatus`, `PartialNotice`; API returns per-source health, `servedStale`, error text; route tests cover healthy, empty, partial and total-failure paths |
| NW-011 | Complete quality and portfolio documentation | DONE | `docs/nusawatch/README.md` (architecture, API, env, commands, deployment checklist, attribution, limitations, verified evidence, screenshots); CI extends to lint the NusaWatch surface and build with the fence on; three real-browser screenshots committed |
| NW-012 | Map view with list/map selection sync | DONE | `src/lib/nusawatch/map.ts` + 8 tests, `src/components/nusawatch/EventMap.tsx` (MapLibre, clustering, magnitude/freshness encoding, selected ring, cluster expansion, fly-to), list auto-scroll; browser-verified: canvas 1398×380, CARTO/OSM attribution, no page errors, selecting a row flies the map and highlights it |
| NW-013 | Second source adapter (GDACS and/or USGS) | DONE | USGS FDSN adapter (`sources/usgs.ts`, 8 tests) over the Indonesian bbox, cross-source matcher (`dedupe.ts`, 10 tests, 120 s / 200 km), `crossChecks` in the canonical model and detail panel; live capture: 27 BMKG + 3 USGS → 29 events, one cross-check (Bengkulu, 3.3 s / 34.1 km), two USGS-only events kept |
| NW-014 | Fence the deployable surface | DONE | `src/middleware.ts` + 10 tests gated by `NUSAWATCH_FENCE=1`: `/` 307 → `/watch`, only `/watch/*`, `/api/nusawatch/*`, `/api/health` and static assets, everything else 404; NusaWatch pages/APIs never beacon to OSIRIS Umami; NusaWatch robots/sitemap replace the upstream copies. Verified on the standalone production artifact |
| NW-015 | Restore a usable lint baseline | DONE | `npm run lint` terminates in ~70 s: 1,636 pre-existing problems (464 errors, 1,172 warnings) in 133 upstream files; 0 in NusaWatch. Fix: ignore the 1.3 MB generated transit file, and scope the React Compiler rules off for `WorldRemote.tsx` (the single file that exhausts the heap). Upstream debt documented, not hidden |

## Verification recorded for Phase 2 (2026-10-23)

- `npx tsc --noEmit` — PASS.
- `npx vitest run` — PASS: 135 files passed, 2 skipped (137 collected); 1,546 tests passed, 22 skipped. Phase 1 baseline was 1,509 tests; Phase 2 adds 37 (map 8, dedupe 10, USGS 8, middleware fence +10 and one route test).
- Targeted `npx eslint` on `src/app/watch`, `src/app/api/nusawatch`, `src/components/nusawatch`, `src/lib/nusawatch`, `src/middleware.ts`, `src/middleware.test.ts`, `eslint.config.mjs` — PASS, 0 problems.
- `npm run lint` — completes (no OOM). 1,636 pre-existing problems across 133 upstream files; none in NusaWatch.
- `npm run build` — PASS, 3 pre-existing Turbopack tracing warnings.
- Standalone artifact (`.next/standalone/server.js`, static copied, `NUSAWATCH_FENCE=1`): `/` 307; `/watch` 200; `/api/nusawatch/events` 200 (29 events, 2 sources, `partial=false`); `/api/health` 200; CSS asset 200; `/robots.txt` and `/sitemap.xml` NusaWatch content; `/api/earthquakes`, `/bolags`, `/api/osint/people` 404.
- Real Chrome 155 via CDP, production build, 1440 px and 390 px: 29 rows; `document.documentElement.scrollWidth === clientWidth` (no horizontal overflow); map canvas 1398×380 with CARTO/OSM attribution; zero page errors; region filter 29 → 1 for Jawa; row click updates the detail and flies the map; reset restores 29; search with no matches shows the empty state.
- Cross-source check at capture time: BMKG M5.2 / USGS M4.9 Bengkulu, 3.3 s and 34.1 km apart, merged as one BMKG event with a USGS `crossCheck`; two USGS-only events added. `✓ USGS` badge and "Verifikasi silang" panel verified in the browser.
- Fence unit tests also cover analytics: `/watch` and every `/api/*` route make no Umami requests; `/bolags` still makes the two upstream requests.

## Current task instructions

Phase 2 is complete. A deployment must set `NUSAWATCH_FENCE=1`; without it the upstream OSIRIS surface is reachable. Follow `docs/nusawatch/README.md` for the checklist. Do not add OSINT, scanner or stealth features to the NusaWatch surface.

## Handoff note

- Current milestone: Phase 2 delivered and committed.
- Task statuses: NW-001–NW-015 DONE.
- Follow-ups before a public launch: review BMKG terms of use; decide the production domain (canonical currently resolves to `https://osirisai.live/watch`); replace the inherited OSIRIS manifest/favicons for `/watch`; add a shared cache if more than one replica is deployed.
- Known non-blockers: repo-wide lint debt in the upstream dashboard (1,636 problems); `next start` warns because the project uses `output: 'standalone'` — run `node server.js`.
