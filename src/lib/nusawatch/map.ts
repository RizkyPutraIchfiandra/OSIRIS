import type { Freshness, IntelligenceEvent, RegionId } from './types';

/**
 * Map projection helpers.
 *
 * The map is a secondary surface: the list is authoritative and every event on
 * the map is also in the list. These helpers therefore do exactly one thing —
 * turn canonical events into GeoJSON — and deliberately drop anything the
 * source did not publish rather than guessing a coordinate.
 */

export interface EventPointProperties {
  id: string;
  title: string;
  /** Null when the source has no numeric magnitude; the map still shows it. */
  magnitude: number | null;
  freshness: Freshness;
  region: RegionId | null;
  eventTime: string | null;
}

export interface EventPointFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: EventPointProperties;
}

export interface EventCollection {
  type: 'FeatureCollection';
  features: EventPointFeature[];
}

/** Indonesia, not the globe: the feed is national. */
export const INDONESIA_VIEWPORT = {
  center: [118.6, -2.4] as [number, number],
  zoom: 4.05,
  minZoom: 3,
  maxZoom: 12,
};

const VALID_LATITUDE = (value: number) => Number.isFinite(value) && value >= -90 && value <= 90;
const VALID_LONGITUDE = (value: number) => Number.isFinite(value) && value >= -180 && value <= 180;

export function toEventCollection(events: readonly IntelligenceEvent[]): EventCollection {
  const features: EventPointFeature[] = [];

  for (const event of events) {
    const latitude = event.location?.latitude;
    const longitude = event.location?.longitude;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') continue;
    if (!VALID_LATITUDE(latitude) || !VALID_LONGITUDE(longitude)) continue;

    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [longitude, latitude] },
      properties: {
        id: event.id,
        title: event.title,
        magnitude:
          typeof event.severity?.value === 'number' && Number.isFinite(event.severity.value)
            ? event.severity.value
            : null,
        freshness: event.freshness,
        region: event.location?.region ?? null,
        eventTime: event.eventTime ?? null,
      },
    });
  }

  return { type: 'FeatureCollection', features };
}

/**
 * Bounds of the events that actually have coordinates. Returns null when the
 * collection is empty, so callers can keep their default view instead of
 * fitting to nothing.
 */
export function collectionBounds(
  collection: EventCollection,
): [[number, number], [number, number]] | null {
  if (collection.features.length === 0) return null;

  let west = Number.POSITIVE_INFINITY;
  let south = Number.POSITIVE_INFINITY;
  let east = Number.NEGATIVE_INFINITY;
  let north = Number.NEGATIVE_INFINITY;

  for (const feature of collection.features) {
    const [longitude, latitude] = feature.geometry.coordinates;
    west = Math.min(west, longitude);
    east = Math.max(east, longitude);
    south = Math.min(south, latitude);
    north = Math.max(north, latitude);
  }

  return [
    [west, south],
    [east, north],
  ];
}
