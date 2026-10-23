# Changelog

Record meaningful changes made to the NusaWatch fork. Newest entries first. Do not claim work that has not been verified.

## Unreleased
- Phase 1 NusaWatch slice is implemented and verified locally, but uncommitted and not deployed.

### 2026-10-23 — Phase 1: BMKG event API and fenced `/watch` surface
- Added: `src/lib/nusawatch/` — canonical event model and pipeline:
  - `types.ts` (canonical event, source health, provenance, limitations).
  - `sources/bmkg.ts` (BMKG adapter, three-feed merge, partial-failure handling, `toCanonicalEvent(…, now)` test seam).
  - `registry.ts`, `service.ts` (source orchestration → `SourceLoad`/`AllSourcesLoad`, `describeSources`).
  - `cache.ts` (typed TTL cache, in-flight dedup, persistent `staleFallback`, `peekCache`, `clearNusawatchCache`), `errors.ts`.
  - `regions.ts` (coordinate-derived region groups; box match first, then a 1.0° nearest-box snap), `labels.ts`, `normalize.ts`, `freshness.ts`, `format.ts`, `ids.ts` (stable ids via `node:crypto`), `filters.ts`, `query.ts`.
- Added: `src/lib/nusawatch/__fixtures__/bmkg-{autogempa,gempaterkini,gempadirasakan}.json` — real payloads captured 2026-10-23.
- Added: `src/app/api/nusawatch/events/route.ts` — `category`, `region`, `since`, `until`, `bbox`, `q`, `limit`; unusable parameters returned in `ignoredParams`; 200 with `partial=true` when some sources fail, 503 when all fail; `X-NusaWatch-Partial` header and cache headers. `src/app/api/nusawatch/sources/route.ts` exposes source/cache health.
- Added: `/watch` — `src/app/watch/{layout,page}.tsx`, `nusawatch.css`, and `src/components/nusawatch/{EventExplorer,EventList,EventDetail,FilterBar,SourceStatus,FreshnessBadge,States}.tsx`. Indonesian copy, scoped `.nw-root` design tokens, list/detail grid, mobile detail sheet, explicit "bukan sistem peringatan dini" disclaimer, no map.
- Added: `src/components/OsirisStructuredData.tsx` and 8 test files (`cache`, `filters`, `freshness`, `normalize`, `query`, `regions`, `sources/bmkg`, `api/nusawatch/events/route`) — 70 tests.
- Changed: `src/app/layout.tsx` — OSIRIS JSON-LD and the hardcoded canonical `<link>` moved out of the root layout so `/watch` inherits no OSIRIS marketing metadata. `src/app/page.tsx` now renders `OsirisStructuredData`; `/` keeps its canonical and JSON-LD.
- Changed: `src/app/watch/layout.tsx` sets the NusaWatch title template plus explicit description, OpenGraph, twitter and `apple-mobile-web-app-title` overrides, and `src/app/watch/page.tsx` uses `title.absolute` — so the tab and share card do not read "OSIRIS" or inherit its parent title suffix.
- Fixed: BMKG `Potensi` is no longer presented as a tsunami verdict; the canonical field is `potential` and the UI labels it "Potensi — teks BMKG". Display text (title, `potential`) comes from the highest-priority feed (`gempaterkini` → `autogempa` → `gempadirasakan`), with missing fields filled from the others.
- Fixed: offshore hypocentres previously fell outside every region box (6 of 27 live events reported `unknown`). Widened the Sumatra west edge to 94.0°, extended Sulawesi to the Sangihe–Talaud chain (5.8°N), and added a 1.0° nearest-box snap. Live feed now maps 27/27 events; a point 1.4° away in Mindanao still resolves to `unknown` (guarded by test).
- Tests/checks: `npx tsc --noEmit` PASS. `npx vitest run` PASS — 132 files passed, 2 skipped (134 collected); 1,509 tests passed, 22 skipped (baseline 1,439 tests; +8 files, +70 tests). Targeted `npx eslint` on all new files plus `src/app/layout.tsx` and `src/components/OsirisStructuredData.tsx` PASS (0 problems). `npm run build` PASS with only the 3 pre-existing Turbopack warnings.
- Tests/checks (live, `npx next dev -p 3100`): `/api/nusawatch/events` 200 with 27 real events and `partial=false`; `?region=java` matched 1; invalid parameters surfaced in `ignoredParams`; `/api/nusawatch/sources` 200; `/watch` 200; `/` 200. `/watch` has a single canonical `https://osirisai.live/watch`, NusaWatch title/twitter/Apple labels, and zero OSIRIS JSON-LD; `/` retains canonical `https://osirisai.live` and the OSIRIS JSON-LD.
- Tests/checks failing: none for the new code. Repo-wide `npm run lint` still exits 134 (heap OOM on `src/lib/transit-routes.generated.ts`); `src/app/page.tsx` still reports 94 problems (77 errors, 17 warnings) that are byte-identical at HEAD `b8f7ea2`, so they are pre-existing and tracked as NW-015.
- Tests/checks not run: no browser automation. jsdom/happy-dom/testing-library/Playwright/Puppeteer are not installed and Vitest only collects node-environment `src/**/*.test.ts`, so UI behaviour was verified through server HTML, the API contract and unit tests, not driven interactions.
- Known limitations: BMKG is the only source; no map and no map/list sync; `/watch` is a client-fetching shell whose server HTML is the loading skeleton; the root layout still supplies the OSIRIS manifest, favicons and `themeColor` to `/watch`; the OSINT/scanner/stealth/analytics surface is fenced by routing but not removed from the deployable artifact (NW-014); BMKG terms of use have not been reviewed; region labels remain approximations, not administrative boundaries.
- Related task: NW-006 to NW-010 (DONE). Follow-ups: NW-011 to NW-015.

### 2026-10-23 — Read-only repository audit and NusaWatch slice proposal
- Added: `docs/ai/REPO_AUDIT_REPORT.md`, following the `02_REPO_AUDIT.md` template.
- Added: proposed decision D-005 (fenced Indonesia-first vertical slice) in `12_DECISION_LOG.md`.
- Changed: `13_TASK_BOARD.md` — NW-001 to NW-005 marked DONE, NW-006 BLOCKED on user approval, NW-007 to NW-011 remain TODO; current milestone set to "Phase 0 complete; Phase 1 approval gate".
- Fixed: nothing. No application code was changed.
- Tests/checks: `npm ci` PASS (507 packages, 14 dev-only advisories); `npx tsc --noEmit` PASS; `npx vitest run` PASS (124 files, 1,439 tests, 11.44 s); `npm run build` PASS (58 static pages); `npm audit --omit=dev --audit-level=high` PASS (0 vulnerabilities); dev server PASS (`/` and `/api/health` both 200).
- Tests/checks failing: `npm run lint` exits 134 (JS heap OOM at 4 GB and 8 GB) against the 1.3 MB single-line `src/lib/transit-routes.generated.ts`; targeted `npx eslint src/app/api/earthquakes/route.ts` fails on `@typescript-eslint/no-explicit-any` (line 24).
- Tests/checks not run: `docker compose config` / `docker compose up` — Docker is not installed on the audit machine.
- Known limitations: audit was static plus local baseline only; no deployment target, no production traffic, and no Docker verification. BMKG/GDACS endpoints were checked live on 2026-10-23 and their availability is not guaranteed.
- Related task: NW-001 to NW-005.

## Entry template

### YYYY-MM-DD — Short title
- Added:
- Changed:
- Fixed:
- Tests/checks:
- Known limitations:
- Related task:
