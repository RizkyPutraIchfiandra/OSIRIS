'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatAge, formatCount } from '@/lib/nusawatch/format';
import type { EventCategory, EventsResponse, RegionId } from '@/lib/nusawatch/types';
import { EventDetail } from './EventDetail';
import { EventList } from './EventList';
import { FilterBar } from './FilterBar';
import { SourceStatus } from './SourceStatus';
import { EmptyState, ErrorState, LoadingState, PartialNotice } from './States';

const POLL_MS = 60_000;
const PAGE_LIMIT = 200;

interface FilterState {
  q: string;
  windowHours: number | null;
  region: RegionId | 'all';
  categories: EventCategory[];
}

const INITIAL_FILTERS: FilterState = {
  q: '',
  windowHours: null,
  region: 'all',
  categories: [],
};

export function EventExplorer() {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [debouncedQ, setDebouncedQ] = useState('');
  const [data, setData] = useState<EventsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [tick, setTick] = useState(0);

  /* Typing should not fire a request per keystroke. */
  useEffect(() => {
    if (filters.q === debouncedQ) return;
    const timer = setTimeout(() => {
      setBusy(true);
      setDebouncedQ(filters.q);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.q, debouncedQ]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    /*
     * The URL is built here rather than during render: `since` depends on the
     * clock, and reading the clock during render is not idempotent.
     */
    const search = new URLSearchParams({ limit: String(PAGE_LIMIT) });
    if (debouncedQ) search.set('q', debouncedQ);
    if (filters.region !== 'all') search.set('region', filters.region);
    if (filters.categories.length > 0) search.set('category', filters.categories.join(','));
    if (filters.windowHours) {
      search.set('since', new Date(Date.now() - filters.windowHours * 3_600_000).toISOString());
    }

    fetch(`/api/nusawatch/events?${search}`, { signal: controller.signal })
      .then(async response => {
        const body: EventsResponse | null = await response.json().catch(() => null);
        if (!body) throw new Error(`Permintaan gagal (HTTP ${response.status}).`);
        return { body, ok: response.ok };
      })
      .then(({ body, ok }) => {
        if (cancelled) return;
        setData(body);
        setError(ok ? null : 'Sumber sedang tidak dapat dihubungi. Status di bawah menjelaskan kondisinya.');
      })
      .catch((cause: unknown) => {
        if (cancelled || controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : 'Tidak dapat memuat data.');
      })
      .finally(() => {
        if (cancelled) return;
        setBusy(false);
        setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [debouncedQ, filters.region, filters.categories, filters.windowHours, tick]);

  /* Refresh in the background, but not for a tab nobody is looking at. */
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.hidden) return;
      setBusy(true);
      setTick(value => value + 1);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  /* Escape closes the mobile detail sheet. */
  useEffect(() => {
    if (!detailOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDetailOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [detailOpen]);

  const reset = useCallback(() => {
    setBusy(true);
    setFilters(INITIAL_FILTERS);
    setDebouncedQ('');
    setTick(value => value + 1);
  }, []);

  const retry = useCallback(() => {
    setBusy(true);
    setTick(value => value + 1);
  }, []);

  const toggleCategory = useCallback((category: EventCategory) => {
    setBusy(true);
    setFilters(current => ({
      ...current,
      categories: current.categories.includes(category)
        ? current.categories.filter(item => item !== category)
        : [...current.categories, category],
    }));
  }, []);

  const categories = useMemo(() => {
    const present = new Set<EventCategory>();
    for (const event of data?.events ?? []) present.add(event.category);
    return [...present].sort();
  }, [data]);

  /*
   * Selection is derived, not synchronised: if the chosen event drops out of
   * the filtered set, the panel falls back to the newest one instead of an
   * effect writing state after render.
   */
  const selected = data?.events.find(event => event.id === selectedId) ?? data?.events[0];
  const selectedKey = selected?.id ?? null;
  const selectedSource = selected
    ? data?.sources.find(source => source.id === selected.sourceId)
    : undefined;
  const freshCount = data?.events.filter(event => event.freshness === 'fresh').length ?? 0;
  const hasFilters =
    filters.q !== '' ||
    filters.region !== 'all' ||
    filters.categories.length > 0 ||
    filters.windowHours !== null;

  return (
    <main className="nw-main">
      <div className="nw-shell">
        <div className="nw-intro">
          <div>
            <h1>Gempa bumi terkini di Indonesia</h1>
            <p>
              Peristiwa yang dipublikasikan BMKG, dengan waktu kejadian, wilayah perkiraan,
              sumber, dan waktu pengambilan data.
            </p>
          </div>
          <dl className="nw-stats">
            <div>
              <dt>Cocok</dt>
              <dd>{data ? formatCount(data.matched) : '—'}</dd>
            </div>
            <div>
              <dt>Data baru</dt>
              <dd>{data ? formatCount(freshCount) : '—'}</dd>
            </div>
            <div>
              <dt>Diperbarui</dt>
              <dd className="nw-stats-age">{formatAge(data?.generatedAt) ?? '—'}</dd>
            </div>
          </dl>
        </div>

        <p className="nw-notice">
          <span>
            <strong>Bukan sistem peringatan dini.</strong> NusaWatch menampilkan data publik
            untuk pemantauan. Selalu ikuti informasi resmi BMKG dan arahan BNPB setempat.
          </span>
        </p>

        <FilterBar
          q={filters.q}
          onQChange={value => setFilters(current => ({ ...current, q: value }))}
          windowHours={filters.windowHours}
          onWindowChange={value => {
            setBusy(true);
            setFilters(current => ({ ...current, windowHours: value }));
          }}
          region={filters.region}
          onRegionChange={value => {
            setBusy(true);
            setFilters(current => ({ ...current, region: value }));
          }}
          categories={categories}
          activeCategories={filters.categories}
          onToggleCategory={toggleCategory}
          onReset={reset}
          hasFilters={hasFilters}
          busy={busy}
        />

        {data && data.partial && <PartialNotice sources={data.sources} />}

        {data && data.ignoredParams.length > 0 && (
          <div className="nw-banner" role="status">
            Parameter tidak dikenali dan diabaikan: {data.ignoredParams.join(', ')}.
          </div>
        )}

        {error && data && (
          <div className="nw-banner" role="alert">
            {error}
          </div>
        )}

        <p className="nw-sr-only" aria-live="polite">
          {data
            ? `${formatCount(data.matched)} peristiwa cocok dengan filter saat ini.`
            : 'Memuat peristiwa.'}
        </p>

        {loading && !data ? (
          <div className="nw-panel">
            <LoadingState />
          </div>
        ) : error && !data ? (
          <div className="nw-panel">
            <ErrorState message={error} onRetry={retry} />
          </div>
        ) : (
          <div className="nw-grid">
            <section className="nw-panel" aria-label="Daftar peristiwa">
              <div className="nw-panel-head">
                <span>
                  <strong>{data ? formatCount(data.matched) : '0'}</strong> peristiwa
                  {data && data.events.length < data.matched
                    ? ` · menampilkan ${formatCount(data.events.length)} terbaru`
                    : ''}
                </span>
                <span className="nw-live" data-busy={busy}>
                  {busy ? 'Menyegarkan…' : 'Diperbarui otomatis tiap menit'}
                </span>
              </div>

              {data && data.events.length === 0 ? (
                <EmptyState onReset={reset} />
              ) : data ? (
                <EventList
                  events={data.events}
                  selectedId={selectedKey}
                  onSelect={id => {
                    setSelectedId(id);
                    setDetailOpen(true);
                  }}
                />
              ) : null}
            </section>

            <aside
              className={`nw-panel nw-detail${detailOpen ? ' is-open' : ''}`}
              aria-label="Detail peristiwa"
            >
              {selected ? (
                <EventDetail
                  event={selected}
                  source={selectedSource}
                  onClose={() => setDetailOpen(false)}
                />
              ) : (
                <div className="nw-state">
                  <strong>Belum ada peristiwa dipilih</strong>
                  Pilih satu baris untuk melihat rincian dan sumbernya.
                </div>
              )}
            </aside>
          </div>
        )}

        {data && <SourceStatus sources={data.sources} />}
      </div>
    </main>
  );
}
