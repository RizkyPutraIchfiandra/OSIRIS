import type { EventCategory } from './types';

/**
 * Source registry.
 *
 * One entry per upstream feed, with the facts a reader needs to judge it:
 * where it comes from, how long a fetch stays meaningful, who gets credited,
 * and what the feed cannot tell you. Secrets never live here — only the
 * *names* of environment variables, and BMKG needs none.
 */

export interface SourceDescriptor {
  id: string;
  name: string;
  homepage: string;
  /** Where the machine-readable feed lives. */
  feed: string;
  categories: EventCategory[];
  requiresAuth: boolean;
  /** How long a cached fetch is reused before we ask again. */
  ttlMs: number;
  /** How long a fetch counts as fresh when shown to a reader. */
  freshForMs: number;
  attribution: string;
  limitations: string[];
}

export const BMKG_SOURCE_ID = 'bmkg';
export const USGS_SOURCE_ID = 'usgs';

export const USGS_ENDPOINT = 'https://earthquake.usgs.gov/fdsnws/event/1/query';

export const BMKG_ENDPOINTS = {
  autogempa: 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json',
  gempaterkini: 'https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json',
  gempadirasakan: 'https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json',
} as const;

export type BmkgEndpoint = keyof typeof BMKG_ENDPOINTS;

/**
 * Endpoints are read in this order, and the first record to claim an id sets
 * the display text. `gempaterkini` has the cleaner place labels, `autogempa`
 * carries `Potensi`, `gempadirasakan` carries `Dirasakan`; merging fills the
 * gaps rather than picking a winner.
 */
export const BMKG_ENDPOINT_ORDER: readonly BmkgEndpoint[] = [
  'gempaterkini',
  'autogempa',
  'gempadirasakan',
] as const;

export const SOURCES: Record<string, SourceDescriptor> = {
  [BMKG_SOURCE_ID]: {
    id: BMKG_SOURCE_ID,
    name: 'BMKG',
    homepage: 'https://www.bmkg.go.id/gempabumi/gempabumi-terkini.bmkg',
    feed: BMKG_ENDPOINTS.gempaterkini,
    categories: ['earthquake'],
    requiresAuth: false,
    ttlMs: 60 * 1000,
    freshForMs: 10 * 60 * 1000,
    attribution: 'Badan Meteorologi, Klimatologi, dan Geofisika (BMKG), data.bmkg.go.id',
    limitations: [
      'Memuat peristiwa terbaru yang dipublikasikan BMKG, bukan katalog lengkap.',
      'Magnitudo dan kedalaman ditampilkan sebagaimana dipublikasikan; NusaWatch tidak menghitung ulang.',
      'Wilayah adalah perkiraan dari koordinat terdekat (termasuk perairan), bukan batas administratif resmi.',
      'Ketentuan penggunaan data BMKG belum ditinjau penuh; verifikasi sebelum peluncuran publik.',
    ],
  },
  [USGS_SOURCE_ID]: {
    id: USGS_SOURCE_ID,
    name: 'USGS',
    homepage: 'https://earthquake.usgs.gov/earthquakes/map/',
    feed: 'https://earthquake.usgs.gov/fdsnws/event/1/',
    categories: ['earthquake'],
    requiresAuth: false,
    ttlMs: 3 * 60 * 1000,
    freshForMs: 30 * 60 * 1000,
    attribution: 'U.S. Geological Survey (USGS), earthquake.usgs.gov',
    limitations: [
      'Katalog global USGS; gempa kecil di Indonesia sering tidak tercatat sehingga BMKG tetap lebih lengkap.',
      'Magnitudo, kedalaman, dan lokasi dapat berbeda dari BMKG untuk gempa yang sama; perbedaan itu ditampilkan, bukan dirata-ratakan.',
      'Wilayah diambil dari kotak koordinat Indonesia, bukan batas negara; gempa di perairan sekitar dapat ikut tampil.',
      'Teks lokasi berasal dari USGS dan berbahasa Inggris.',
    ],
  },
};

export function getSource(id: string): SourceDescriptor | undefined {
  return SOURCES[id];
}
