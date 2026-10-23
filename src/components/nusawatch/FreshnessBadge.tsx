import type { Freshness } from '@/lib/nusawatch/types';

const LABELS: Record<Freshness, string> = {
  fresh: 'Data baru',
  stale: 'Data lama',
  unknown: 'Tanpa status',
};

const TITLES: Record<Freshness, string> = {
  fresh: 'Diambil dalam periode kesegaran sumber ini.',
  stale: 'Diambil sebelum periode kesegaran sumber ini; data mungkin sudah berubah.',
  unknown: 'Waktu pengambilan tidak tersedia, jadi kesegaran tidak dapat dinilai.',
};

export function FreshnessBadge({ freshness }: { freshness: Freshness }) {
  return (
    <span className={`nw-badge nw-badge--${freshness}`} title={TITLES[freshness]}>
      {LABELS[freshness]}
    </span>
  );
}
