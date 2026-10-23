import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './nusawatch.css';

export const metadata: Metadata = {
  title: {
    default: 'NusaWatch — Pantauan Gempa Indonesia',
    template: '%s | NusaWatch',
  },
  description:
    'Pantauan gempa bumi Indonesia dari data publik BMKG dan USGS, lengkap dengan waktu kejadian, wilayah perkiraan, sumber, dan status kesegaran data.',
  alternates: { canonical: '/watch' },
  openGraph: {
    title: 'NusaWatch — Pantauan Gempa Indonesia',
    description:
      'Peristiwa gempa dari data publik BMKG dan USGS, dengan provenance dan status kesegaran yang bisa diperiksa.',
    type: 'website',
    locale: 'id_ID',
    url: '/watch',
  },
  twitter: {
    card: 'summary',
    title: 'NusaWatch — Pantauan Gempa Indonesia',
    description:
      'Peristiwa gempa dari data publik BMKG dan USGS, dengan provenance dan status kesegaran yang bisa diperiksa.',
  },
  other: {
    'apple-mobile-web-app-title': 'NusaWatch',
  },
};

/**
 * NusaWatch shell.
 *
 * Scoped deliberately: `globals.css` still styles the OSIRIS dashboard at `/`,
 * and this route brings its own tokens under `.nw-root`. The two surfaces can
 * evolve independently, which is the whole point of fencing the slice.
 *
 * `lang="id"` sits on this wrapper because the root `<html>` is English-only;
 * a nested `lang` is valid HTML and keeps screen readers in the right language
 * for this page's content.
 */
export default function WatchLayout({ children }: { children: ReactNode }) {
  return (
    <div className="nw-root" lang="id">
      <header className="nw-header">
        <div className="nw-shell nw-header-inner">
          <div className="nw-brand">
            <span className="nw-mark" aria-hidden="true" />
            <div>
              <div className="nw-wordmark">NusaWatch</div>
              <div className="nw-tagline">Pantauan bencana Indonesia dari sumber publik</div>
            </div>
          </div>
          <div className="nw-header-meta">
            <span>Data gempa</span>
            <strong>BMKG · USGS</strong>
          </div>
        </div>
      </header>

      {children}

      <footer className="nw-footer">
        <div className="nw-shell">
          <p>
            NusaWatch adalah fork dari proyek OSIRIS (lisensi MIT). Bukan produk resmi BMKG
            dan bukan sistem peringatan dini.
          </p>
          <p>
            Data gempa: Badan Meteorologi, Klimatologi, dan Geofisika (BMKG) dan U.S.
            Geological Survey (USGS). Ketentuan penggunaan data mengikuti penyedia
            masing-masing.
          </p>
        </div>
      </footer>
    </div>
  );
}
