import type { Metadata } from 'next';
import { EventExplorer } from '@/components/nusawatch/EventExplorer';

export const metadata: Metadata = {
  title: {
    absolute: 'NusaWatch — Gempa terkini Indonesia',
  },
  description:
    'Daftar gempa terbaru yang dipublikasikan BMKG dan USGS, dengan filter wilayah, rentang waktu, dan pencarian.',
  alternates: { canonical: '/watch' },
};

export default function WatchPage() {
  return <EventExplorer />;
}
