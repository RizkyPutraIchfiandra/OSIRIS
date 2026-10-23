/**
 * Structured data for the NusaWatch dashboard at `/`.
 *
 * This used to sit in the root layout, which meant every route — including
 * `/watch` — shipped a JSON-LD block advertising browser port scanning and
 * CCTV search. Structured data describes the page that carries it, so it now
 * lives with the page it describes.
 */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nusawatch.vercel.app').replace(/\/+$/, '');

export default function OsirisStructuredData() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'NusaWatch — Gempa & Intelijen Indonesia',
    alternateName: ['NusaWatch', 'NusaWatch Indonesia', 'OSIRIS'],
    url: SITE_URL,
    description:
      'Portal intelijen terbuka dengan fokus Indonesia dan data global. Pantau gempa BMKG & USGS, penerbangan, satelit, CCTV, kebakaran, cuaca, dan ancaman siber di globe 3D — plus alat OSINT dari browser. Dibangun dari OSIRIS (MIT).',
    applicationCategory: 'SecurityApplication',
    operatingSystem: 'Web',
    browserRequirements: 'Requires a modern web browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    featureList: [
      'Pantauan gempa Indonesia (BMKG) dan global (USGS)',
      'Peta & globe 3D interaktif dengan siklus siang/malam',
      'Pelacakan penerbangan real-time via ADS-B',
      'Pelacakan satelit (termasuk ISS)',
      'Pemantauan kamera CCTV seluruh dunia',
      'Deteksi kebakaran hutan (data satelit NASA FIRMS)',
      'Peringatan cuaca ekstrem',
      'Intelijen ancaman siber & CVE',
      'Cuaca antariksa & badai matahari',
      'Deteksi GPS jamming',
      'Pemantauan pasar pertahanan & komoditas',
      'Agregasi berita SIGINT',
      'Laporan dossier intelijen kawasan',
      'Alat OSINT: DNS, WHOIS, sertifikat SSL, BGP/ASN, reputasi IP',
    ],
    screenshot: `${SITE_URL}/og-image.png`,
    author: {
      '@type': 'Organization',
      name: 'NusaWatch',
      url: SITE_URL,
      description: 'Dibangun dari proyek OSIRIS (MIT) — https://github.com/simplifaisoul/osiris',
    },
    isBasedOn: 'https://github.com/simplifaisoul/osiris',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
