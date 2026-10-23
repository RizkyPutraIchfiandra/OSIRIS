import { REGIONS } from '@/lib/nusawatch/regions';
import { categoryLabel, REGION_ALL_LABEL, type RegionFilter } from '@/lib/nusawatch/labels';
import type { EventCategory } from '@/lib/nusawatch/types';

/**
 * Filters are explicit and reversible. Every control maps to one documented
 * API parameter, so what the list shows can always be reconstructed from the
 * URL — and nothing is filtered silently.
 */
export function FilterBar({
  q,
  onQChange,
  windowHours,
  onWindowChange,
  region,
  onRegionChange,
  categories,
  activeCategories,
  onToggleCategory,
  onReset,
  hasFilters,
  busy,
}: {
  q: string;
  onQChange: (value: string) => void;
  windowHours: number | null;
  onWindowChange: (value: number | null) => void;
  region: RegionFilter;
  onRegionChange: (value: RegionFilter) => void;
  categories: EventCategory[];
  activeCategories: EventCategory[];
  onToggleCategory: (category: EventCategory) => void;
  onReset: () => void;
  hasFilters: boolean;
  busy: boolean;
}) {
  return (
    <div className="nw-filters" role="search">
      <label className="nw-field">
        <span>Cari</span>
        <input
          className="nw-input"
          type="search"
          value={q}
          placeholder="Wilayah, kata kunci…"
          onChange={event => onQChange(event.target.value)}
          aria-label="Cari peristiwa"
        />
      </label>

      <label className="nw-field">
        <span>Wilayah</span>
        <select
          className="nw-select"
          value={region}
          onChange={event => onRegionChange(event.target.value as RegionFilter)}
        >
          <option value="all">{REGION_ALL_LABEL}</option>
          {REGIONS.map(item => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label className="nw-field">
        <span>Rentang waktu</span>
        <select
          className="nw-select"
          value={windowHours === null ? 'all' : String(windowHours)}
          onChange={event =>
            onWindowChange(event.target.value === 'all' ? null : Number(event.target.value))
          }
        >
          <option value="all">Semua waktu</option>
          <option value="24">24 jam terakhir</option>
          <option value="168">7 hari terakhir</option>
          <option value="720">30 hari terakhir</option>
        </select>
      </label>

      <div className="nw-field">
        <span>Jenis</span>
        <div className="nw-chips">
          {categories.length === 0 ? (
            <span className="nw-badge nw-badge--plain">Belum ada data</span>
          ) : (
            categories.map(category => {
              const active = activeCategories.includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  className="nw-chip"
                  aria-pressed={active}
                  onClick={() => onToggleCategory(category)}
                >
                  {categoryLabel(category)}
                </button>
              );
            })
          )}
          {hasFilters && (
            <button type="button" className="nw-chip" onClick={onReset} disabled={busy}>
              Atur ulang
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
