# Architecture Principles

## Important note

This is a target architecture, not a claim about the current repository. Verify the actual stack and conventions during the repository audit. Extend existing architecture where practical.

## Preferred logical layers

1. **Presentation** — pages, layouts, accessible controls, map and chart components.
2. **Application** — query/filter orchestration, event selection, view models.
3. **Data access** — adapters for upstream sources, caching, normalization, validation.
4. **Persistence** — optional storage for historical events, saved filters, and reports.
5. **External services** — public data APIs and optional AI provider.

Avoid creating separate services or databases until a demonstrated need exists.

## Suggested data flow

Public source -> server-side adapter -> validation -> normalization -> caching/error handling -> application API -> UI.

If the existing project uses a different pattern, document it and adapt rather than forcing this diagram.

## Module boundaries

- UI components should not contain API keys.
- UI components should not each implement their own fetch logic for the same source.
- Source-specific field mapping belongs in adapters/normalizers.
- Shared event types should be centralized.
- Date parsing, timezone conversion, and coordinate validation should use tested utilities.
- API error responses should be consistent and safe.
- Keep AI summarization separate from source ingestion and never treat generated text as raw source data.

## Database guidance

Do not add a database for the sake of architecture diagrams. First establish whether the MVP requires history across sessions.

If persistence is justified:
- Evaluate PostgreSQL/PostGIS against actual query needs.
- Define migrations and indexes.
- Document retention and deletion behavior.
- Do not store unnecessary personal or sensitive data.
- Provide a deterministic local development setup.

## Caching

- Respect upstream terms, rate limits, and cache guidance.
- Use server-side caching where suitable.
- Expose `fetchedAt` and source freshness to the UI.
- Avoid implying real-time delivery unless the source and update mechanism support it.
- Ensure cached stale data is visibly labelled.

## Resilience

- Use timeouts where supported.
- Validate external payloads at boundaries.
- Handle non-2xx responses, malformed JSON, empty results, and missing fields.
- Avoid a single source failure taking down unrelated layers.
- Do not retry aggressively or ignore rate limits.
