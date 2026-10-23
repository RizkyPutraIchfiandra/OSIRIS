import type { RegionId } from './types';

/**
 * Coarse regions derived from coordinates.
 *
 * These boxes exist so a reader can scan "Sumatra / Java / Papua" without
 * reading a place name. They are *not* administrative boundaries and they
 * overlap at the edges (Sunda Strait, Raja Ampat), so the order below decides
 * ties.
 *
 * BMKG places most hypocentres offshore, so a strict box test labelled a fifth
 * of a real feed `unknown` even when the event was 30 km off Aceh. A point
 * outside every box therefore snaps to the nearest box within
 * `MAX_SNAP_DEGREES`, which is the difference between "in Sumatra" and "in the
 * sea next to Sumatra". Beyond that distance the answer is still `unknown` —
 * a wrong island group is worse than no region.
 */

export interface RegionBox {
  id: Exclude<RegionId, 'unknown'>;
  label: string;
  /** [west, south, east, north] in degrees. */
  bounds: [number, number, number, number];
}

export const REGIONS: readonly RegionBox[] = [
  { id: 'java', label: 'Jawa', bounds: [105.0, -9.0, 114.8, -5.5] },
  { id: 'bali-nusa-tenggara', label: 'Bali & Nusa Tenggara', bounds: [114.4, -11.5, 127.5, -8.0] },
  { id: 'sumatra', label: 'Sumatra', bounds: [94.0, -6.5, 106.5, 6.5] },
  { id: 'kalimantan', label: 'Kalimantan', bounds: [108.5, -4.5, 119.5, 7.5] },
  // North bound reaches the Sangihe–Talaud chain, which is North Sulawesi.
  { id: 'sulawesi', label: 'Sulawesi', bounds: [118.5, -6.5, 125.5, 5.8] },
  { id: 'maluku', label: 'Maluku', bounds: [125.0, -9.0, 131.5, 3.0] },
  { id: 'papua', label: 'Papua', bounds: [130.0, -10.5, 141.5, 1.5] },
] as const;

/** How far outside a box a point may sit and still take that box's name. */
const MAX_SNAP_DEGREES = 1.0;

const LABELS: Record<RegionId, string> = {
  java: 'Jawa',
  'bali-nusa-tenggara': 'Bali & Nusa Tenggara',
  sumatra: 'Sumatra',
  kalimantan: 'Kalimantan',
  sulawesi: 'Sulawesi',
  maluku: 'Maluku',
  papua: 'Papua',
  unknown: 'Tidak diketahui',
};

export function regionLabel(region: RegionId | undefined): string {
  return region ? LABELS[region] : LABELS.unknown;
}

/**
 * First box that contains the point wins; points just outside every box take
 * the nearest one (see the note above about edges).
 */
export function regionFromCoordinates(latitude: number, longitude: number): RegionId {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return 'unknown';
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return 'unknown';

  for (const region of REGIONS) {
    const [west, south, east, north] = region.bounds;
    if (longitude >= west && longitude <= east && latitude >= south && latitude <= north) {
      return region.id;
    }
  }

  let nearest: RegionId = 'unknown';
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const region of REGIONS) {
    const [west, south, east, north] = region.bounds;
    const latitudeGap = latitude > north ? latitude - north : latitude < south ? south - latitude : 0;
    const longitudeGap = longitude > east ? longitude - east : longitude < west ? west - longitude : 0;
    const distance = Math.hypot(latitudeGap, longitudeGap);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = region.id;
    }
  }

  return nearestDistance <= MAX_SNAP_DEGREES ? nearest : 'unknown';
}
