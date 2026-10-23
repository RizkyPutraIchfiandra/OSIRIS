# Implementation Roadmap

Work in small vertical slices. Do not attempt the entire roadmap in one model response.

## Phase 0 — Repository audit

Deliverables:
- `REPO_AUDIT_REPORT.md`
- Verified stack and commands.
- Baseline check results.
- Existing data-source and UI component inventory.
- License and secret-handling notes.

Exit gate:
- The agent can point to actual files for app entry, routing, map, source adapters, and test scripts.
- No broad refactor has been made.

## Phase 1 — Safe baseline and visual identity

Deliverables:
- Application runs using documented steps.
- NusaWatch visual identity applied to core shell.
- Navigation and responsive behavior updated.
- Upstream attribution preserved.
- Existing key functionality still works.

Exit gate:
- Build and relevant checks pass, or known baseline failures are documented.
- Screenshot/manual verification completed where possible.

## Phase 2 — Unified event model

Deliverables:
- Canonical event type adapted to real code.
- One source adapter integrated and validated.
- Event list and detail view.
- Source URL and distinct event/fetch timestamps.
- Unit tests for normalization.

Exit gate:
- Real source data works, malformed/missing fields are handled, and demo data is never mislabelled as live.

## Phase 3 — Explorer filters and map synchronization

Deliverables:
- Category, time, and supported-region filters.
- Map markers based on normalized events.
- Selecting a list row selects its map marker and vice versa, where feasible.
- Empty/loading/error/stale states.

Exit gate:
- Automated tests cover filter behavior and manual checks cover the map/list flow.

## Phase 4 — Source transparency and timeline

Deliverables:
- Source registry/status page or panel.
- Freshness rules and labels.
- Timeline/statistics using known event times.
- Clear source-specific severity units/scales.

Exit gate:
- No fabricated data, timestamps, or freshness claims.

## Phase 5 — Reliability and portfolio polish

Deliverables:
- Responsive and accessible UI pass.
- Test suite and production build.
- CI if consistent with the repository.
- README, architecture diagram, setup, source credits, limitations, screenshots.
- Deployment.

Exit gate:
- Another developer can clone, configure, run, and understand the project.

## Phase 6 — Optional AI brief

Deliverables:
- User-triggered summary for a selected set of events.
- Source references in output.
- Provider configuration and safe failure states.
- Tests for source attribution and malformed model output.

Exit gate:
- Summary is clearly labelled as AI-generated, source-linked, and not official advice.

## Work sizing

Each task should fit a focused coding session. If a task touches many unrelated modules, split it. Do not combine a visual redesign, API rewrite, database migration, and AI integration in one task.
