import { assessFreshness } from '../freshness';
import { formatMagnitude } from '../format';
import { deterministicEventId } from '../ids';
import {
  cleanText,
  normalizeTimestamp,
  parseCoordinatePair,
  parseDepthKm,
  parseMagnitude,
} from '../normalize';
import { regionFromCoordinates } from '../regions';
import {
  BMKG_ENDPOINTS,
  BMKG_ENDPOINT_ORDER,
  BMKG_SOURCE_ID,
  SOURCES,
  type BmkgEndpoint,
} from '../registry';
import type { IntelligenceEvent } from '../types';
import { SourceUnavailableError } from '../errors';

/**
 * BMKG adapter.
 *
 * The feeds are small, unauthenticated JSON documents with no event ids and no
 * per-event URLs. Everything below is limited to what those payloads actually
 * contain: three endpoints are read, records are normalised, and records that
 * describe the same earthquake are merged. Nothing is invented — no shakemap
 * URLs, no tsunami predictions, no per-event deep links.
 */

const FETCH_TIMEOUT_MS = 8000;

/**
 * Honest identification, per the audit's rule against `stealthFetch`. BMKG
 * needs no key; if they ever want to block us, the string tells them who we are.
 */
const USER_AGENT = 'NusaWatch/0.1 (+https://data.bmkg.go.id/)';

export interface BmkgRecord {
  Tanggal?: unknown;
  Jam?: unknown;
  DateTime?: unknown;
  Coordinates?: unknown;
  Lintang?: unknown;
  Bujur?: unknown;
  Magnitude?: unknown;
  Kedalaman?: unknown;
  Wilayah?: unknown;
  Potensi?: unknown;
  Dirasakan?: unknown;
  Shakemap?: unknown;
}

export interface BmkgFetchResult {
  events: IntelligenceEvent[];
  /** Ingestion time; every event in this batch carries it. */
  fetchedAt: string;
  /** True when at least one endpoint answered and at least one did not. */
  partial: boolean;
  failedEndpoints: string[];
  error?: string;
}

function isRecord(value: unknown): value is BmkgRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * `Infogempa.gempa` is an object for `autogempa` and an array for the other
 * two feeds. Both shapes are accepted; anything else yields no records.
 */
export function parseBmkgPayload(payload: unknown): BmkgRecord[] {
  if (typeof payload !== 'object' || payload === null) return [];

  const infogempa = (payload as { Infogempa?: unknown }).Infogempa;
  if (typeof infogempa !== 'object' || infogempa === null) return [];

  const gempa = (infogempa as { gempa?: unknown }).gempa;
  const list = Array.isArray(gempa) ? gempa : isRecord(gempa) ? [gempa] : [];

  return list.filter(isRecord);
}

function buildLimitations(region: string): string[] {
  const limitations = ['Cakupan: peristiwa terbaru BMKG, bukan katalog lengkap.'];
  limitations.push(
    region === 'unknown'
      ? 'Wilayah tidak dapat diturunkan dari koordinat yang dipublikasikan.'
      : 'Wilayah adalah perkiraan dari koordinat terdekat (termasuk perairan), bukan batas administratif resmi.',
  );
  return limitations;
}

/**
 * One source record → one canonical event, or `undefined` when the record has
 * no time, no coordinates and no magnitude (i.e. nothing to identify it by).
 */
export function toCanonicalEvent(
  record: BmkgRecord,
  endpoint: BmkgEndpoint,
  fetchedAt: string,
  now: number = Date.now(),
): IntelligenceEvent | undefined {
  const coordinates = parseCoordinatePair(record.Coordinates);
  const magnitude = parseMagnitude(record.Magnitude);
  const depthKm = parseDepthKm(record.Kedalaman);
  const eventTime = normalizeTimestamp(record.DateTime);
  const place = cleanText(record.Wilayah, 160);

  if (!eventTime && !coordinates && magnitude === undefined) return undefined;

  const region = coordinates
    ? regionFromCoordinates(coordinates.latitude, coordinates.longitude)
    : 'unknown';

  const magnitudeLabel = formatMagnitude(magnitude);
  const title =
    magnitudeLabel && place
      ? `Gempa M${magnitudeLabel} — ${place}`
      : magnitudeLabel
        ? `Gempa M${magnitudeLabel}`
        : place
          ? `Gempa — ${place}`
          : 'Gempa';

  const id = deterministicEventId(
    BMKG_SOURCE_ID,
    eventTime
      ? // Identity is the earthquake itself: origin time, hypocentre, size.
        // `Wilayah` is deliberately excluded because `autogempa` and
        // `gempaterkini` word the same place differently.
        [eventTime, coordinates?.latitude, coordinates?.longitude, magnitude]
      : // No parsable time: fall back to whatever else the record has.
        [cleanText(record.DateTime), place, coordinates?.latitude, coordinates?.longitude, magnitude],
  );

  return {
    id,
    sourceId: BMKG_SOURCE_ID,
    sourceName: SOURCES[BMKG_SOURCE_ID].name,
    category: 'earthquake',
    title,
    eventTime,
    fetchedAt,
    eventTimeSource: cleanText(record.Jam, 40),
    location: {
      label: place,
      countryCode: 'ID',
      region,
      latitude: coordinates?.latitude,
      longitude: coordinates?.longitude,
    },
    severity:
      magnitude === undefined
        ? undefined
        : {
            value: magnitude,
            unit: 'magnitudo',
            label: `M${magnitudeLabel}`,
            scheme: 'bmkg-magnitude',
          },
    sourceRecordId: undefined,
    freshness: assessFreshness(fetchedAt, SOURCES[BMKG_SOURCE_ID].freshForMs, now),
    confidence: 'not-assessed',
    limitations: buildLimitations(region),
    rawType: `bmkg.${endpoint}`,
    depthKm,
    potential: cleanText(record.Potensi),
    feltReports: cleanText(record.Dirasakan, 400),
  };
}

export function toCanonicalEvents(
  records: BmkgRecord[],
  endpoint: BmkgEndpoint,
  fetchedAt: string,
  now: number = Date.now(),
): IntelligenceEvent[] {
  const events: IntelligenceEvent[] = [];
  for (const record of records) {
    const event = toCanonicalEvent(record, endpoint, fetchedAt, now);
    if (event) events.push(event);
  }
  return events;
}

/**
 * Collapse records that share an id across endpoints.
 *
 * Same source, same origin time, same hypocentre, same magnitude → the same
 * earthquake. Fields are filled from whichever endpoint has them; display text
 * comes from the higher-priority endpoint (see `BMKG_ENDPOINT_ORDER`).
 */
export function mergeBmkgEvents(groups: IntelligenceEvent[][]): IntelligenceEvent[] {
  const byId = new Map<string, IntelligenceEvent>();

  for (const group of groups) {
    for (const event of group) {
      const existing = byId.get(event.id);
      if (!existing) {
        byId.set(event.id, event);
        continue;
      }

      const location =
        existing.location || event.location
          ? {
              label: existing.location?.label ?? event.location?.label,
              countryCode: existing.location?.countryCode ?? event.location?.countryCode,
              region: existing.location?.region ?? event.location?.region,
              latitude: existing.location?.latitude ?? event.location?.latitude,
              longitude: existing.location?.longitude ?? event.location?.longitude,
            }
          : undefined;

      byId.set(event.id, {
        ...existing,
        location,
        severity: existing.severity ?? event.severity,
        depthKm: existing.depthKm ?? event.depthKm,
        potential: existing.potential ?? event.potential,
        feltReports: existing.feltReports ?? event.feltReports,
        eventTimeSource: existing.eventTimeSource ?? event.eventTimeSource,
        eventTime: existing.eventTime ?? event.eventTime,
        summary: existing.summary ?? event.summary,
        sourceUrl: existing.sourceUrl ?? event.sourceUrl,
        sourceRecordId: existing.sourceRecordId ?? event.sourceRecordId,
        limitations: [...new Set([...existing.limitations, ...event.limitations])],
      });
    }
  }

  return [...byId.values()];
}

function describeFailure(reason: unknown): string {
  if (reason instanceof Error) {
    if (reason.name === 'TimeoutError') return 'waktu permintaan habis';
    return reason.message;
  }
  return 'kesalahan tidak dikenal';
}

/**
 * Fetch all three BMKG feeds, tolerating partial failure.
 *
 * Throws `SourceUnavailableError` only when *every* endpoint failed — that is
 * the one case where the caller must fall back to the last good cache instead
 * of presenting an empty list as the truth.
 */
export async function fetchBmkgEvents(options: { now?: Date } = {}): Promise<BmkgFetchResult> {
  const now = options.now ?? new Date();
  const fetchedAt = now.toISOString();

  const outcomes = await Promise.allSettled(
    BMKG_ENDPOINT_ORDER.map(async endpoint => {
      const response = await fetch(BMKG_ENDPOINTS[endpoint], {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { accept: 'application/json', 'user-agent': USER_AGENT },
        cache: 'no-store',
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const payload: unknown = await response.json();
      return {
        endpoint,
        events: toCanonicalEvents(parseBmkgPayload(payload), endpoint, fetchedAt, now.getTime()),
      };
    }),
  );

  const groups: IntelligenceEvent[][] = [];
  const failed: string[] = [];

  outcomes.forEach((outcome, index) => {
    if (outcome.status === 'fulfilled') {
      groups.push(outcome.value.events);
    } else {
      failed.push(`${BMKG_ENDPOINT_ORDER[index]}: ${describeFailure(outcome.reason)}`);
    }
  });

  if (groups.length === 0) {
    throw new SourceUnavailableError(
      BMKG_SOURCE_ID,
      `BMKG tidak dapat dihubungi (${failed.join('; ')})`,
    );
  }

  return {
    events: mergeBmkgEvents(groups),
    fetchedAt,
    partial: failed.length > 0,
    failedEndpoints: failed,
    error: failed.length > 0 ? `Sebagian endpoint BMKG gagal: ${failed.join('; ')}` : undefined,
  };
}
