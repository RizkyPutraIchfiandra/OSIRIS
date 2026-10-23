# Current Task Board

The coding agent must keep this file current. Use one active implementation task at a time.

## Current milestone
Phase 1 delivered: BMKG-backed event API and a fenced `/watch` surface. Awaiting review before Phase 2.

## Status definitions
- TODO: not started
- IN PROGRESS: currently being worked on
- BLOCKED: waiting for a decision, access, or external dependency
- DONE: acceptance criteria checked with evidence

## Tasks

| ID | Task | Status | Acceptance evidence |
|---|---|---|---|
| NW-001 | Inspect repository and record verified stack | DONE | `docs/ai/REPO_AUDIT_REPORT.md` sections 1 and 3; branch `master`, HEAD `b8f7ea2` |
| NW-002 | Run baseline app and available checks | DONE | Audit report section 2: dev, typecheck, 1,439 tests, build, production audit pass; lint OOM documented |
| NW-003 | Inventory existing UI, routes, data sources, tests | DONE | Audit report sections 3–6 and Appendix A: 87 routes, 48 groups, 70 components, 209 lib files, 126 test files |
| NW-004 | Confirm license, attribution, and environment rules | DONE | Audit report sections 1, 7.1, 9.7, Appendix B; MIT license preserved, variable names only, no secret values |
| NW-005 | Propose minimal rebrand implementation plan | DONE | Audit report sections 9–10: fenced vertical slice, file-level plan, BMKG endpoint verification, phase gates |
| NW-006 | Implement NusaWatch shell redesign | DONE | `src/app/watch/{layout,page}.tsx` + `nusawatch.css`; scoped `.nw-root` tokens, Indonesian copy, list/detail grid, mobile sheet, disclaimer. `/` dashboard left intact apart from metadata extraction (below) |
| NW-007 | Define canonical event type against real payloads | DONE | `src/lib/nusawatch/types.ts`; three real BMKG payloads captured 2026-10-23 into `__fixtures__/`; `bmkg.test.ts` asserts field-by-field mapping and merge behaviour |
| NW-008 | Deliver first real event vertical slice | DONE | `/api/nusawatch/events` → `/watch` list/detail with per-event provenance (source, fetch time, id, limitations). Live check: 27 real events, `partial=false` |
| NW-009 | Add filters and map/list synchronization | DONE | Server-side `category`, `region`, `since`, `until`, `bbox`, `q`, `limit` in `filters.ts`/`query.ts`, covered by `filters.test.ts` and `query.test.ts`; UI search/region/window/category chips; unusable parameters reported in `ignoredParams`. Map/list sync deliberately deferred to NW-012 |
| NW-010 | Add freshness/source status UI | DONE | `freshness.ts` (ingestion time, never event time), `FreshnessBadge`, `SourceStatus`, `PartialNotice`; API returns per-source health, `servedStale`, error text; route tests cover healthy, empty, partial and total-failure paths |
| NW-011 | Complete quality and portfolio documentation | TODO | Remaining: README/deployment notes, attribution file, CI wiring, screenshots |
| NW-012 | Map view with list/map selection sync | TODO | Not started. Plan: dedicated MapLibre component reusing `public/dark-matter-style.json`; do not extend `OsirisMap.tsx` |
| NW-013 | Second source adapter (GDACS and/or USGS) | TODO | Not started. Must define cross-source dedupe and precedence before coding |
| NW-014 | Fence the deployable surface | TODO | Not started. Remove/fence OSINT, scanner, stealth, analytics and the legacy dashboard from the artifact that is deployed as NusaWatch; verify no NusaWatch page calls them (`stealthFetch` is unused by new code) |
| NW-015 | Restore a usable lint baseline | TODO | Not started. `npm run lint` still OOMs on `src/lib/transit-routes.generated.ts` (1.3 MB single line); `src/app/page.tsx` has 94 pre-existing problems (77 errors, 17 warnings) identical to HEAD `b8f7ea2`, so they are not regressions |

## Verification recorded for Phase 1 (2026-10-23)

- `npx tsc --noEmit` — PASS.
- `npx vitest run` — PASS: 132 test files passed, 2 skipped (134 collected); 1,509 tests passed, 22 skipped. Baseline was 1,439 tests, so this session adds 8 files and 70 tests.
- `npx vitest run src/lib/nusawatch src/app/api/nusawatch` — PASS: 8 files, 70 tests.
- `npx eslint` on all new files plus `src/app/layout.tsx`, `src/components/OsirisStructuredData.tsx`, `src/app/watch`, `src/components/nusawatch`, `src/lib/nusawatch`, `src/app/api/nusawatch` — PASS, 0 problems.
- `npm run build` — PASS, 3 warnings, all pre-existing (`src/lib/cctv-snapshot.ts:47`, `src/lib/nominatim.ts:83`, `src/lib/vision/server.ts:28`).
- Live dev check on `http://localhost:3100`: `/api/nusawatch/events` 200 (27 events, `partial=false`, `X-NusaWatch-Partial: false`), `?region=java` 200 (matched 1), invalid `category`/`bbox` reported in `ignoredParams`, `/api/nusawatch/sources` 200, `/watch` 200, `/` 200.
- Metadata check: `/watch` has one canonical `https://osirisai.live/watch`, NusaWatch `<title>`/twitter title, zero OSIRIS JSON-LD; `/` still carries canonical `https://osirisai.live` and the OSIRIS JSON-LD (now rendered by the landing page, not the root layout).
- Region derivation after widening the boxes and adding a 1.0° nearest-box snap: all 27 live events map to a region group (0 `unknown`), while a Mindanao point 1.4° away still resolves to `unknown`.

## Current task instructions

Phase 1 is complete and reviewable. Do not start NW-012/NW-013/NW-014 without an explicit decision on what Phase 2 should prove first. NW-014 (safety fence) must precede any public deployment.

## Handoff note

- Current milestone: Phase 1 delivered; Phase 2 not started.
- Task statuses: NW-001–NW-010 DONE; NW-011–NW-015 TODO.
- Code is uncommitted on `master` (HEAD `b8f7ea2`). `docs/ai/` and `off` remain untracked.
- Commands and results: see the verification block above.
- Known blockers: none technical. Open decisions: Phase 2 scope, map strategy, second source, deployment target.
- Single recommended next task: review Phase 1 in the browser, then decide between NW-012 (map) and NW-014 (deployment fence).
