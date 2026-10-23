import type { SourceReport } from '@/lib/nusawatch/types';
import { healthLabel } from '@/lib/nusawatch/labels';

/** Skeleton rows. Announced as busy so a screen reader does not read an empty list. */
export function LoadingState() {
  return (
    <div className="nw-skel" role="status" aria-live="polite" aria-busy="true">
      <span /><span /><span /><span />
      <span className="nw-sr-only">Memuat peristiwa…</span>
    </div>
  );
}

export function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="nw-state">
      <strong>Tidak ada peristiwa yang cocok</strong>
      Filter yang dipakai sekarang tidak menyisakan peristiwa. Coba longgarkan
      rentang waktu atau hapus kata kunci.
      <div>
        <button type="button" className="nw-btn" onClick={onReset}>
          Atur ulang filter
        </button>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="nw-state" role="alert">
      <strong>Data tidak dapat dimuat</strong>
      {message}
      <div>
        <button type="button" className="nw-btn" onClick={onRetry}>
          Coba lagi
        </button>
      </div>
    </div>
  );
}

/**
 * Shown when at least one source is degraded or failed. The specific reason
 * lives in `SourceStatus`; this banner only says the picture may be incomplete.
 */
export function PartialNotice({ sources }: { sources: SourceReport[] }) {
  const affected = sources.filter(source => source.health !== 'ok');
  if (affected.length === 0) return null;

  const summary = affected
    .map(source => `${source.name}: ${healthLabel(source.health).toLowerCase()}`)
    .join(', ');

  return (
    <div className="nw-banner" role="status">
      <span>Data mungkin tidak lengkap — {summary}.</span>
    </div>
  );
}
