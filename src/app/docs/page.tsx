import type { Metadata } from 'next';
import DocsClient from './DocsClient';
import { ENDPOINT_COUNT } from './apiCatalog';

export const metadata: Metadata = {
  title: 'Dokumentasi & Referensi API',
  description: `Dokumentasi mesin OSIRIS (MIT) yang menjalankan NusaWatch — panduan self-hosting, referensi antarmuka, dan referensi API lengkap untuk ${ENDPOINT_COUNT} endpoint yang mencakup penerbangan, maritim, seismik, konflik, siber, dan OSINT. Tanpa API key.`,
  alternates: { canonical: '/docs' },
  openGraph: {
    title: 'NusaWatch — Dokumentasi & Referensi API',
    description: `Panduan self-hosting, referensi antarmuka, dan referensi API lengkap untuk ${ENDPOINT_COUNT} endpoint OSIRIS yang menjalankan NusaWatch.`,
    url: '/docs',
    type: 'article',
  },
};

export default function DocsPage() {
  return <DocsClient />;
}
