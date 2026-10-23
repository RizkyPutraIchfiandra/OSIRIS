# Project Brief — NusaWatch

## One-sentence definition

NusaWatch is an Indonesia-first public-data situational-awareness web application that lets users explore selected public events on a map, filter them by time and region, inspect source provenance, and understand data freshness.

## Purpose

Turn the existing OSIRIS codebase into a strong Software Engineering portfolio project by making a focused, well-documented, tested product—not merely changing the theme of an existing dashboard.

## Target users

1. Students and researchers exploring public data.
2. People seeking a clearer overview of public events in Indonesia.
3. Operations or analysis teams needing a source-linked situational overview.
4. Portfolio reviewers assessing engineering decisions, quality, and product thinking.

## Core value

- One consistent interface for selected event types.
- Region and time filtering.
- Clear source links and timestamps.
- Explicit separation of facts, derived metrics, and AI-generated summaries.
- Honest communication of data limitations.

## Product principles

1. Source transparency over dramatic claims.
2. Useful and reliable before feature-rich.
3. Indonesia-first, not Indonesia-only.
4. Accessible, responsive, and usable on mobile.
5. Small vertical slices with tests.
6. Reuse existing OSIRIS capabilities when appropriate.
7. Add original value through workflow, data quality, and UX.

## MVP scope

- Rebranded and coherent application shell.
- One overview page.
- One event explorer/list.
- Map view using existing map capabilities where feasible.
- A small number of verified, stable public data sources.
- Canonical event normalization.
- Region/category/time filters.
- Event detail panel with source, timestamps, and uncertainty/limitations.
- Source health/freshness indicators.
- Loading, empty, error, and stale-data states.
- Basic automated tests and clear documentation.

## Later, not MVP

- AI-generated intelligence briefs.
- User accounts and saved workspaces.
- Alerts and notifications.
- Complex correlations between unrelated event types.
- Predictive risk scores.
- Real-time streaming infrastructure unless existing capabilities require it.
- Paid data integrations.

## Non-goals

- Military, law-enforcement, or covert surveillance.
- Identifying or tracking private individuals.
- Bypassing authentication, access controls, or rate limits.
- Presenting unverified social-media claims as facts.
- Claiming to predict disasters or establish causation without validated methods.
- Rebuilding every OSIRIS feature from scratch.

## Naming

NusaWatch is a working name. Do not spend time on logos, domains, or elaborate branding until the MVP is technically stable. Check name conflicts before public launch.

## Portfolio story

The project should demonstrate:
- Codebase reconnaissance and safe adaptation of an existing project.
- Modular integration of external APIs.
- Data normalization and validation.
- Geospatial UI and filtering.
- Reliability and failure-state design.
- Testing, CI, deployment, and technical documentation.
- Honest attribution of upstream code and assets.
