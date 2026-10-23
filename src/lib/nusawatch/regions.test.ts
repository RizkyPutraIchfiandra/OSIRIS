import { describe, it, expect } from 'vitest';
import { regionFromCoordinates, regionLabel } from './regions';

describe('regionFromCoordinates', () => {
  it('places well-known points in the right island group', () => {
    expect(regionFromCoordinates(5.55, 95.32)).toBe('sumatra'); // Banda Aceh
    expect(regionFromCoordinates(-3.11, 102.14)).toBe('sumatra'); // Bengkulu
    expect(regionFromCoordinates(-5.4, 104.68)).toBe('sumatra'); // Tanggamus
    expect(regionFromCoordinates(-7.8, 110.36)).toBe('java'); // Yogyakarta
    expect(regionFromCoordinates(-1.27, 116.83)).toBe('kalimantan'); // Balikpapan
    expect(regionFromCoordinates(-0.9, 119.86)).toBe('sulawesi'); // Palu
    expect(regionFromCoordinates(-8.58, 116.12)).toBe('bali-nusa-tenggara'); // Mataram
    expect(regionFromCoordinates(-3.69, 128.18)).toBe('maluku'); // Ambon
    expect(regionFromCoordinates(-2.53, 140.7)).toBe('papua'); // Jayapura
  });

  it('says unknown rather than guessing for the open ocean', () => {
    expect(regionFromCoordinates(-30, 80)).toBe('unknown');
  });

  it('snaps an offshore hypocentre to the nearest group, which is what BMKG publishes', () => {
    // 68 km south-west of Calang, Aceh — just outside the old west edge.
    expect(regionFromCoordinates(4.56, 94.97)).toBe('sumatra');
    // Flores Sea, 60 km north of Labuan Bajo.
    expect(regionFromCoordinates(-7.99, 120.09)).toBe('bali-nusa-tenggara');
    // Selayar waters: nearer to Sulawesi than to Nusa Tenggara.
    expect(regionFromCoordinates(-7.07, 120.8)).toBe('sulawesi');
    // Sangihe–Talaud, administratively North Sulawesi.
    expect(regionFromCoordinates(5.66, 125.19)).toBe('sulawesi');
  });

  it('still refuses to label a neighbouring country as Indonesia', () => {
    // Davao Gulf, Mindanao: 1.4 degrees from the Sulawesi box, outside the snap.
    expect(regionFromCoordinates(7.2, 125.6)).toBe('unknown');
  });

  it('says unknown for coordinates that are not coordinates', () => {
    expect(regionFromCoordinates(Number.NaN, 102)).toBe('unknown');
    expect(regionFromCoordinates(95, 200)).toBe('unknown');
  });

  it('labels the unknown bucket in Indonesian', () => {
    expect(regionLabel('unknown')).toBe('Tidak diketahui');
    expect(regionLabel('bali-nusa-tenggara')).toBe('Bali & Nusa Tenggara');
  });
});
