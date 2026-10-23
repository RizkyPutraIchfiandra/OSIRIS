/**
 * Structured data for the OSIRIS dashboard at `/`.
 *
 * This used to sit in the root layout, which meant every route — including
 * `/watch` — shipped a JSON-LD block advertising browser port scanning and
 * CCTV search. Structured data describes the page that carries it, so it now
 * lives with the page it describes.
 */
export default function OsirisStructuredData() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'OSIRIS — OSINT Toolkit & Intelligence Platform',
    alternateName: ['OSIRIS', 'OsirisAI', 'Osiris OSINT'],
    url: 'https://osirisai.live',
    description:
      'The open-source Palantir alternative. Track live aircraft, satellites, and worldwide CCTV cameras on a 3D globe. Run Nmap scans, DNS lookups, WHOIS queries, SSL cert analysis & threat intelligence — all from your browser. 20+ data sources including live earthquake, wildfire, cyber threat and conflict feeds, plus mapped reference data such as nuclear facilities. Free & open source.',
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
      'Nmap port scanning from the browser — no install required',
      'DNS record lookup (A, AAAA, MX, NS, TXT, CNAME)',
      'WHOIS domain registration lookup',
      'SSL/TLS certificate transparency search',
      'BGP routing & ASN lookup',
      'IP geolocation & threat intelligence',
      'Real-time flight tracking via ADS-B',
      'Satellite tracking (including ISS)',
      'Worldwide CCTV camera monitoring',
      'Earthquake monitoring (USGS live feed)',
      'Wildfire detection (NASA FIRMS satellite data)',
      'Nuclear facility mapping (curated reference list, not a live feed)',
      'Severe weather alerts & tracking',
      'Cyber threat & CVE intelligence',
      'Space weather & solar storm monitoring',
      'GPS jamming detection',
      'Defense & commodity market tracking',
      'SIGINT news aggregation feed',
      'Interactive 3D globe with day/night cycle',
      'Region intelligence dossier reports',
    ],
    screenshot: 'https://osirisai.live/og-image.png',
    author: {
      '@type': 'Organization',
      name: 'Osiris Project',
      url: 'https://osirisai.live',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
