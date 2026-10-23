import type { Metadata, Viewport } from "next";
import ErrorBoundary from '@/components/ErrorBoundary';
import "./globals.css";

/* Canonical origin. A NusaWatch deployment usually lives on another domain,
 * and a canonical that points at a host you do not own is worse than none.
 * Defaults to the upstream origin, so an unconfigured build is unchanged. */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://osirisai.live").replace(/\/+$/, "");
const SITE_NAME = "NusaWatch";
const SITE_TITLE = "NusaWatch — Pantauan Gempa & Intelijen Indonesia | Globe 3D, Penerbangan, Satelit";
const SITE_DESCRIPTION = "Portal intelijen terbuka dengan fokus Indonesia dan data global. Pantau gempa BMKG & USGS, penerbangan, satelit, CCTV, kebakaran, cuaca, dan ancaman siber di globe 3D — plus alat OSINT dari browser. Dibangun dari OSIRIS (MIT).";

export const viewport: Viewport = {
  themeColor: "#D4AF37",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | NusaWatch",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    // Indonesia - Primary focus
    "NusaWatch", "gempa Indonesia", "gempa terkini", "gempa hari ini", "BMKG",
    "informasi gempa", "gempa bumi", "peringatan tsunami", "monitoring Indonesia",
    "peta gempa", "globe 3D", "intelijen Indonesia", "data terbuka Indonesia",

    // OSINT Tools
    "OSINT tools", "free OSINT tools", "online OSINT toolkit", "OSINT framework",
    "nmap online", "nmap scanner online", "free nmap scan", "port scanner online",
    "DNS lookup tool", "WHOIS lookup", "reverse DNS", "DNS records",
    "SSL certificate checker", "certificate transparency", "cert lookup",
    "BGP routing lookup", "ASN lookup", "IP geolocation",
    "threat intelligence", "threat intel lookup", "IP reputation check",
    "network reconnaissance", "recon tools", "penetration testing tools",
    "cybersecurity tools", "infosec tools", "security scanner",
    "linux OSINT tools", "kali linux tools online", "OSINT browser tools",
    
    // Intelligence Platform
    "OSINT", "open source intelligence", "intelligence platform", "global intelligence",
    "geospatial intelligence", "GEOINT", "SIGINT", "real-time tracking",
    "palantir alternative", "open source palantir", "intelligence dashboard",
    
    // Tracking & Data
    "flight tracker", "aircraft tracking", "ADS-B tracker", "live flight radar",
    "satellite tracking", "ISS tracker", "space station tracker",
    "CCTV cameras live", "security cameras worldwide", "live cameras",
    "earthquake monitor", "seismic activity", "USGS earthquake",
    "wildfire tracker", "NASA FIRMS", "active fires",
    "nuclear facilities map", "nuclear power plants",
    "severe weather alerts", "weather radar",
    "cyber threats dashboard", "CVE tracker",
    "space weather", "solar storm", "GPS jamming",
    "defense stocks", "commodities tracker",
    
    // Brand
    "nusawatch", "nusawatch.vercel.app", "OSIRIS", "osirisai.live",
  ],
  authors: [{ name: "NusaWatch", url: SITE_URL }],
  creator: "NusaWatch",
  publisher: "NusaWatch",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/android-chrome-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/android-chrome-512x512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
    shortcut: "/favicon.ico",
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/apple-touch-icon.png",
      },
    ],
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "NusaWatch — Gempa & Intelijen Indonesia di Globe 3D | Data Global",
    description: "Pantau gempa BMKG & USGS, penerbangan, satelit, CCTV, kebakaran, cuaca, dan ancaman siber — data global, fokus Indonesia. Dibangun dari OSIRIS (MIT).",
    type: "website",
    siteName: SITE_NAME,
    locale: "id_ID",
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "NusaWatch — pantauan gempa dan intelijen Indonesia di globe 3D",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NusaWatch — Gempa & Intelijen Indonesia di Globe 3D",
    description: "Gempa BMKG & USGS, penerbangan, satelit, CCTV, dan ancaman siber di globe 3D. Data global, fokus Indonesia.",
    images: [`${SITE_URL}/og-image.png`],
  },
  category: "technology",
  classification: "Intelligence & Security",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "NusaWatch",
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#06060C",
    "msapplication-config": "none",
    /* MIT attribution to the upstream project this deployment is built from. */
    "attribution": "Built on OSIRIS (MIT) — https://github.com/simplifaisoul/osiris",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
      </head>
      <body className="antialiased">
        <ErrorBoundary name="NusaWatch Core">
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
