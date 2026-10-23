import type { EventCategory, RegionId, SourceHealth } from './types';

/** Indonesian labels shared by the API consumers and the UI. */
export const CATEGORY_LABELS: Record<EventCategory, string> = {
  earthquake: 'Gempa',
  flood: 'Banjir',
  cyclone: 'Siklon',
  volcano: 'Gunung api',
  fire: 'Kebakaran',
  other: 'Lainnya',
};

export const HEALTH_LABELS: Record<SourceHealth, string> = {
  ok: 'Normal',
  degraded: 'Terbatas',
  failed: 'Gagal',
  unknown: 'Tanpa status',
};

export const REGION_ALL_LABEL = 'Semua wilayah';

export function categoryLabel(category: EventCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function healthLabel(health: SourceHealth): string {
  return HEALTH_LABELS[health] ?? 'Tanpa status';
}

export type RegionFilter = RegionId | 'all';
