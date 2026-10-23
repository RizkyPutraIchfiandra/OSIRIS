/**
 * NusaWatch — canonical event model.
 *
 * Adapted from `docs/ai/06_DATA_CONTRACTS.md` after checking real BMKG
 * payloads. The rule that shapes everything here: a field is optional because
 * the *source* may not have it, never because we forgot to fetch it. Nothing
 * downstream is allowed to invent a timestamp, coordinate or severity to fill
 * a hole.
 */

export type EventCategory =
  | 'earthquake'
  | 'flood'
  | 'cyclone'
  | 'volcano'
  | 'fire'
  | 'other';

/**
 * Coarse, coordinate-derived regions. These are a *reading aid*, not official
 * administrative boundaries; `unknown` is a valid answer and is shown as such.
 */
export type RegionId =
  | 'sumatra'
  | 'java'
  | 'kalimantan'
  | 'sulawesi'
  | 'papua'
  | 'bali-nusa-tenggara'
  | 'maluku'
  | 'unknown';

/** Derived from ingestion time and a documented per-source window. Not a guess. */
export type Freshness = 'fresh' | 'stale' | 'unknown';

/** Explicit methodology required; `not-assessed` is the honest default. */
export type Confidence = 'low' | 'medium' | 'high' | 'not-assessed';

export interface EventLocation {
  label?: string;
  countryCode?: string;
  region?: RegionId;
  latitude?: number;
  longitude?: number;
}

/**
 * Source-specific scale and unit are preserved. There is deliberately no
 * universal 0–100 score: a magnitude and a GDACS alert level are not
 * comparable numbers.
 */
export interface EventSeverity {
  value: string | number;
  unit?: string;
  label?: string;
  scheme: string;
}

/**
 * A second source reporting the same event. Kept separate from the primary
 * record because the two catalogues disagree — different magnitude, different
 * hypocentre, different wording — and collapsing that into one number would
 * hide the disagreement rather than surface it.
 */
export interface CrossCheck {
  sourceId: string;
  sourceName: string;
  sourceRecordId?: string;
  sourceUrl?: string;
  severityLabel?: string;
  /** Difference between the two origin times. */
  timeDeltaSeconds: number;
  /** Great-circle distance between the two hypocentres. */
  distanceKm: number;
}

export interface IntelligenceEvent {
  /** Deterministic; stable across refreshes for the same source record. */
  id: string;
  sourceId: string;
  sourceName: string;
  category: EventCategory;
  title: string;
  summary?: string;
  /** When the event happened, per the source. */
  eventTime?: string;
  /** When our ingestion layer received it. */
  fetchedAt: string;
  eventTimeSource?: string;
  location?: EventLocation;
  severity?: EventSeverity;
  /** Human-facing page for this event, only when verified. */
  sourceUrl?: string;
  /** The source's own record id, when it has one. */
  sourceRecordId?: string;
  freshness: Freshness;
  confidence: Confidence;
  limitations: string[];
  /** Coarse source type, e.g. `bmkg.autogempa`. Never the raw payload. */
  rawType?: string;

  /*
   * BMKG-specific, populated only when that endpoint publishes the field.
   * Kept explicit rather than dumped into a free-form bag so the UI can label
   * them correctly and the contract stays readable.
   */
  depthKm?: number;
  /**
   * Verbatim BMKG `Potensi` text. This is *not* always a tsunami assessment —
   * `autogempa` uses it for impact wording — so it is labelled "Potensi" in the
   * UI, never "potensi tsunami", and never rendered as a prediction we made.
   */
  potential?: string;
  /** Verbatim `Dirasakan` text. */
  feltReports?: string;
  /**
   * Other catalogues that reported the same earthquake, within the documented
   * time/distance window in `dedupe.ts`. Empty when the event was reported by
   * one source only — which is the common case, not a defect.
   */
  crossChecks?: CrossCheck[];
}

export type SourceHealth = 'ok' | 'degraded' | 'failed' | 'unknown';

export interface SourceReport {
  id: string;
  name: string;
  health: SourceHealth;
  /** Events this source contributed to the current response. */
  eventCount: number;
  lastFetchedAt?: string;
  /** True when the cache answered with a previous successful fetch. */
  servedStale: boolean;
  error?: string;
  attribution: string;
  homepage: string;
  limitations: string[];
}

export interface EventsResponse {
  generatedAt: string;
  events: IntelligenceEvent[];
  /** Size of the filtered result set before `limit` was applied. */
  matched: number;
  /** Size of the unfiltered pool. */
  total: number;
  partial: boolean;
  /** Query parameters that were present but not understood. */
  ignoredParams: string[];
  sources: SourceReport[];
}
