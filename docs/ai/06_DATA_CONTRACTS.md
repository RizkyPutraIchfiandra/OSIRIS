# Data Contracts and Canonical Event Model

## Goal

Represent supported public events consistently without pretending all source types have identical semantics.

## Proposed canonical event

```ts
type EventCategory =
  | "earthquake"
  | "weather"
  | "fire"
  | "aviation"
  | "maritime"
  | "news"
  | "other";

interface IntelligenceEvent {
  id: string;                 // stable ID from source or deterministic derived ID
  sourceId: string;           // internal source registry key
  sourceName: string;
  category: EventCategory;
  title: string;
  summary?: string;
  eventTime?: string;         // ISO-8601 timestamp when source provides one
  fetchedAt: string;          // ISO-8601 timestamp set by our ingestion layer
  updatedAt?: string;         // source update time, if available
  location?: {
    label?: string;
    countryCode?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
  };
  severity?: {
    value: string | number;
    unit?: string;
    label?: string;
    scheme: string;           // describes source-specific scale
  };
  sourceUrl?: string;
  sourceRecordId?: string;
  freshness: "fresh" | "stale" | "unknown";
  confidence?: "low" | "medium" | "high" | "not-assessed";
  limitations?: string[];
  rawType?: string;           // optional source type, not full raw payload
}
```

This is a proposal. Adapt naming, required fields, and enums after inspecting current types and real source payloads. Do not force one universal severity scale onto unrelated categories.

## Contract rules

- Validate external data before rendering it.
- Validate latitude and longitude ranges.
- Preserve original source identity and URL where possible.
- Distinguish `eventTime`, `updatedAt`, and `fetchedAt`.
- Missing values remain missing; do not fabricate timestamps, coordinates, severity, or summaries.
- `confidence` describes an explicit assessment methodology. If no methodology exists, use `not-assessed`.
- `freshness` is derived from documented source-specific rules and the last successful fetch, not a guess.
- Stable IDs should be deterministic. Avoid random IDs that change on every refresh.
- Treat external text as untrusted input; render it safely.
- Keep source-specific raw payloads out of client responses unless necessary and safe.
- Record source-specific severity schemes and units.

## Source registry proposal

Each source should have:
- `id`
- display name
- category
- source homepage/API documentation
- adapter implementation path
- authentication requirement (boolean and variable name only, never secret value)
- update/caching policy
- attribution/license notes
- last successful fetch time
- current health state
- known limitations

## Deduplication

Do not deduplicate unrelated events solely because they are nearby or share similar text. Start with source ID + source record ID. Cross-source matching requires a documented rule and tests.

## Example event

Example values below are illustrative and must not be shown as live data:

```json
{
  "id": "demo-earthquake-001",
  "sourceId": "demo-source",
  "sourceName": "Demo source",
  "category": "earthquake",
  "title": "Illustrative earthquake event",
  "eventTime": "2026-01-01T01:00:00Z",
  "fetchedAt": "2026-01-01T01:02:00Z",
  "location": {
    "label": "Example location",
    "latitude": -6.2,
    "longitude": 106.8
  },
  "freshness": "unknown",
  "confidence": "not-assessed",
  "limitations": ["Illustrative example; not live data"]
}
```
