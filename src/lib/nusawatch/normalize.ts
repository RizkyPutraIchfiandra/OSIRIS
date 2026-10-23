/**
 * Parsing helpers for external payloads.
 *
 * Every helper returns `undefined` instead of a made-up value. `/api/*` code
 * downstream treats `undefined` as "the source did not say", which is a state
 * the UI is required to render.
 */

export interface CoordinatePair {
  latitude: number;
  longitude: number;
}

const MAX_TEXT = 280;

/** Trim, collapse whitespace, drop control characters, cap length. */
export function cleanText(value: unknown, maxLength = MAX_TEXT): string | undefined {
  if (typeof value !== 'string') return undefined;

  // Control characters become spaces before the whitespace collapse, so a
  // multi-line BMKG description reads as one sentence instead of one word.
  const withoutControls = Array.from(value, char => {
    const code = char.codePointAt(0) ?? 0;
    return code < 0x20 || code === 0x7f ? ' ' : char;
  }).join('');

  const cleaned = withoutControls.replace(/\s+/g, ' ').trim();
  if (!cleaned) return undefined;
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength - 1)}…` : cleaned;
}

/**
 * BMKG `Coordinates` is `"lat,lng"`. Ranges are validated here so an
 * out-of-range pair never reaches the map or the bbox filter.
 */
export function parseCoordinatePair(raw: unknown): CoordinatePair | undefined {
  if (typeof raw !== 'string') return undefined;
  const parts = raw.split(',');
  if (parts.length !== 2) return undefined;

  const latitude = Number.parseFloat(parts[0].trim());
  const longitude = Number.parseFloat(parts[1].trim());
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  if (latitude < -90 || latitude > 90) return undefined;
  if (longitude < -180 || longitude > 180) return undefined;

  return { latitude, longitude };
}

/**
 * BMKG `Magnitude` is a bare string, but the same field is formatted with
 * units on some pages ("5.2 SR"). Accept both, reject anything else.
 */
export function parseMagnitude(raw: unknown): number | undefined {
  if (typeof raw === 'number') return Number.isFinite(raw) && raw >= 0 && raw <= 10 ? raw : undefined;
  if (typeof raw !== 'string') return undefined;

  const match = raw.trim().match(/^(-?\d+(?:\.\d+)?)/);
  if (!match) return undefined;

  const value = Number.parseFloat(match[1]);
  if (!Number.isFinite(value) || value < 0 || value > 10) return undefined;
  return value;
}

/** `"120 km"` → 120. Shallow and deep events both stay in range. */
export function parseDepthKm(raw: unknown): number | undefined {
  if (typeof raw === 'number') return Number.isFinite(raw) && raw >= 0 && raw <= 1000 ? raw : undefined;
  if (typeof raw !== 'string') return undefined;

  const match = raw.trim().match(/^(-?\d+(?:\.\d+)?)/);
  if (!match) return undefined;

  const value = Number.parseFloat(match[1]);
  if (!Number.isFinite(value) || value < 0 || value > 1000) return undefined;
  return value;
}

/**
 * Normalises any timestamp to UTC ISO-8601. BMKG's `DateTime` is already ISO
 * with `+00:00`; the regex guard keeps `Date` from accepting prose.
 */
export function normalizeTimestamp(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(trimmed)) {
    return undefined;
  }

  const time = Date.parse(trimmed);
  if (!Number.isFinite(time)) return undefined;
  return new Date(time).toISOString();
}

/** True when a value is a usable ISO timestamp; used by query parsing too. */
export function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && normalizeTimestamp(value) !== undefined;
}
