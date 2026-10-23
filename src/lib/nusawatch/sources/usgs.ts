import { assessFreshness } from '../freshness';
import { formatMagnitude } from '../format';
import { deterministicEventId } from '../ids';
import { cleanText } from '../normalize';
import { regionFromCoordinates } from '../regions';
import { SOURCES, USGS_ENDPOINT, USGS_SOURCE_ID } from '../registry';
import type { IntelligenceEvent } from '../types';
import { SourceUnavailableError } from '../errors';

/**
 * USGS adapter.
 *
 * Uses the FDSN event query rather than the global `4.5_day.geojson` summary:
 * the summary is global and, on a real day, contained one event inside the
 * Indonesian box. The FDSN query asks USGS for the box directly, at a lower
 * magnitude floor, so the second source actually adds coverage instead of
 * shipping a mostly-empty payload.
 *
 * USGS is a *cross-check and a gap-filler*, not a replacement: BMKG detects
 * many more small Indonesian events. The two catalogues disagree on magnitude
 * and hypocentre for the same quake, and that disagreement is preserved.
 */

const FETCH_TIMEOUT_MS = 8000;
const LOOKBACK_MS = 48 * 60 * 60 * 1000;
const MIN_MAGNITUDE = 2.5;
const MAX_FEATURES = 100;

/** Indonesia's box, wide enough to include events just offshore. */
const BBOX = {
  minLatitude: -11.5,
  maxLatitude: 6.5,
  minLongitude: 94,
  maxLongitude: 142,
} as const;

const USER_AGENT = 'NusaWatch/0.1 (+https://earthquake.usgs.gov/)';

export interface UsgsFetchResult {
  events: IntelligenceEvent[];
  fetchedAt: string;
}

export function buildUsgsUrl(now: Date): string {
  const params = new URLSearchParams({
    format: 'geojson',
    starttime: new Date(now.getTime() - LOOKBACK_MS).toISOString(),
    minmagnitude: String(MIN_MAGNITUDE),
    minlatitude: String(BBOX.minLatitude),
    maxlatitude: String(BBOX.maxLatitude),
    minlongitude: String(BBOX.minLongitude),
    maxlongitude: String(BBOX.maxLongitude),
    orderby: 'time',
    limit: String(MAX_FEATURES),
  });
  return `${USGS_ENDPOINT}?${params.toString()}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseUsgsPayload(payload: unknown): Array<Record<string, unknown>> {
  if (!isRecord(payload) || !Array.isArray(payload.features)) return [];
  return payload.features.filter(isRecord);
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function isoFromEpoch(value: unknown): string | undefined {
  const epoch = finiteNumber(value);
  if (epoch === undefined) return undefined;
  const date = new Date(epoch);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

function httpsUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value.startsWith('https://') ? value : undefined;
}

/**
 * Exported for tests: the same record must produce the same event id across
 * poll cycles, so it is derived from the USGS record id, never the clock.
 */
export function toCanonicalEvent(
  feature: Record<string, unknown>,
  fetchedAt: string,
): IntelligenceEvent | undefined {
  const properties = feature.properties;
  const geometry = feature.geometry;
  if (!isRecord(properties) || !isRecord(geometry)) return undefined;
  if (properties.type !== 'earthquake') return undefined;
  if (geometry.type !== 'Point' || !Array.isArray(geometry.coordinates)) return undefined;

  const longitude = finiteNumber(geometry.coordinates[0]);
  const latitude = finiteNumber(geometry.coordinates[1]);
  if (longitude === undefined || latitude === undefined) return undefined;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return undefined;

  const magnitude = finiteNumber(properties.mag);
  const place = cleanText(properties.place);
  const eventTime = isoFromEpoch(properties.time);
  const depth = finiteNumber(geometry.coordinates[2]);
  const label = magnitude === undefined ? undefined : `M${formatMagnitude(magnitude)}`;

  const title = label
    ? `Gempa ${label}${place ? ` — ${place}` : ''}`
    : `Gempa${place ? ` — ${place}` : ''}`;

  const recordId =
    typeof feature.id === 'string' && feature.id
      ? feature.id
      : typeof properties.code === 'string'
        ? properties.code
        : undefined;

  const descriptor = SOURCES[USGS_SOURCE_ID];

  return {
    id: deterministicEventId(USGS_SOURCE_ID, [recordId ?? eventTime, latitude, longitude]),
    sourceId: USGS_SOURCE_ID,
    sourceName: descriptor.name,
    category: 'earthquake',
    title,
    eventTime,
    fetchedAt,
    eventTimeSource: 'properties.time',
    location: {
      label: place,
      region: regionFromCoordinates(latitude, longitude),
      latitude,
      longitude,
    },
    severity:
      magnitude === undefined
        ? undefined
        : {
            value: magnitude,
            unit: 'magnitudo',
            label,
            scheme: 'usgs-magnitude',
          },
    sourceUrl: httpsUrl(properties.url),
    sourceRecordId: recordId,
    freshness: assessFreshness(fetchedAt, descriptor.freshForMs),
    confidence: 'not-assessed',
    limitations: [
      'Lokasi dan magnitudo berasal dari katalog USGS; dapat berbeda dari BMKG untuk gempa yang sama.',
      'Teks lokasi berasal dari USGS dan berbahasa Inggris.',
    ],
    rawType: 'usgs.fdsn',
    depthKm: depth,
  };
}

export async function fetchUsgsEvents(options: { now?: Date } = {}): Promise<UsgsFetchResult> {
  const now = options.now ?? new Date();
  const fetchedAt = now.toISOString();

  let response: Response;
  try {
    response = await fetch(buildUsgsUrl(now), {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        accept: 'application/geo+json, application/json',
        'user-agent': USER_AGENT,
      },
      cache: 'no-store',
    });
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : 'kesalahan jaringan';
    throw new SourceUnavailableError(USGS_SOURCE_ID, `USGS tidak dapat dihubungi (${reason})`);
  }

  if (!response.ok) {
    throw new SourceUnavailableError(
      USGS_SOURCE_ID,
      `USGS tidak dapat dihubungi (HTTP ${response.status})`,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new SourceUnavailableError(USGS_SOURCE_ID, 'USGS mengirim respons yang bukan JSON');
  }

  const events = parseUsgsPayload(payload)
    .map(feature => toCanonicalEvent(feature, fetchedAt))
    .filter((event): event is IntelligenceEvent => event !== undefined);

  return { events, fetchedAt };
}
