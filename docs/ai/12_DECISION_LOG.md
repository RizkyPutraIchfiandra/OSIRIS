# Architecture and Product Decision Log

Record durable decisions here. Add new entries at the top. Do not silently rewrite history; mark superseded decisions.

## D-001 — Product focus
- Status: Accepted
- Decision: Focus NusaWatch on Indonesia-first exploration of selected public events.
- Reason: A clear scope makes the fork meaningfully different and feasible as a portfolio project.
- Consequence: Do not attempt to expose every upstream OSIRIS capability in the MVP.

## D-002 — Adapt existing architecture first
- Status: Accepted
- Decision: Audit OSIRIS and reuse existing working patterns before adding frameworks or services.
- Reason: Reduce regression risk and implementation time.
- Consequence: Final technical choices depend on repository inspection.

## D-003 — Source transparency is a core feature
- Status: Accepted
- Decision: Show source identity, source link where available, event time, fetch time, and freshness limitations.
- Reason: Public intelligence is only useful when users can inspect provenance.
- Consequence: Data contracts and UI must preserve metadata.

## D-004 — AI is not MVP-critical
- Status: Accepted
- Decision: Implement AI briefs only after data normalization, provenance, and failure handling are stable.
- Reason: AI summaries over unreliable or untraceable inputs undermine trust.
- Consequence: Do not block the MVP on an AI provider.

## D-005 — Fenced Indonesia-first vertical slice, not a full rebrand
- Date: 2026-10-23
- Status: Proposed
- Context: The audit found a large, working global OSINT dashboard (87 API route handlers, 48 API groups, 70 components, a 2,223-line `src/app/page.tsx`) with no database, no auth, and several high-risk routes. A full rebrand would touch most of the app and would inherit those risks wholesale.
- Decision: Add a new, additive slice instead of rewriting the dashboard. Scope: source adapters (BMKG first, then GDACS and USGS), one canonical event model, one aggregated route (`/api/nusawatch/events`), and a new `/watch` page with list, detail, filters, provenance, and freshness. Reuse existing MapLibre patterns for map sync. Leave upstream OSIRIS pages and routes in place, unmodified, behind their current URLs.
- Alternatives: (a) Full rebrand of `page.tsx` and all existing routes — rejected: high regression risk, slow, and drags in unrelated OSINT surfaces. (b) Standalone new app — rejected: discards working components, map stack, and test suite. (c) Keep OSIRIS as is and only add BMKG data to the existing global map — rejected: fails the Indonesia-first product goal and the provenance requirement.
- Reason: Smallest change that delivers a demonstrable NusaWatch value proposition while keeping upstream behaviour intact and reviewable.
- Consequences: Two product surfaces coexist temporarily; the new slice must not import the high-risk routes (`/api/osint/*`, people-search, scanner). Canonical event model becomes the contract for later phases. Upstream rebranding is deferred and may never be needed.
- Evidence/links: `docs/ai/REPO_AUDIT_REPORT.md` sections "Recommended extension points" and "File-level plan".

## New decision template

### D-XXX — Short title
- Date:
- Status: Proposed / Accepted / Superseded
- Context:
- Decision:
- Alternatives:
- Reason:
- Consequences:
- Evidence/links:
