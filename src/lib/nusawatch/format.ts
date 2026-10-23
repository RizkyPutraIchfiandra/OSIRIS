/**
 * Display formatting.
 *
 * Pure string functions with no Node imports, so both the server route and the
 * client explorer can use them. Times are shown in WIB because that is the
 * clock BMKG publishes against; the underlying value stays UTC ISO-8601.
 */

const JAKARTA = 'Asia/Jakarta';

const EVENT_TIME = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: JAKARTA,
  timeZoneName: 'short',
});

const CLOCK_TIME = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: JAKARTA,
  timeZoneName: 'short',
});

export function formatEventTime(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return undefined;
  return EVENT_TIME.format(new Date(time));
}

export function formatClockTime(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return undefined;
  return CLOCK_TIME.format(new Date(time));
}

/** "baru saja" / "4 mnt lalu" / "2 jam lalu" / "3 hr lalu". */
export function formatAge(iso: string | undefined, now: number = Date.now()): string | undefined {
  if (!iso) return undefined;
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return undefined;

  const seconds = Math.max(0, Math.round((now - time) / 1000));
  if (seconds < 45) return 'baru saja';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hr lalu`;
}

export function formatMagnitude(value: number | undefined): string | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  return value.toFixed(1);
}

export function formatDepth(km: number | undefined): string | undefined {
  if (km === undefined || !Number.isFinite(km)) return undefined;
  return `${Math.round(km)} km`;
}

/** `-3.11, 102.14` → `3.11° LS, 102.14° BT`. */
export function formatCoordinates(latitude: number | undefined, longitude: number | undefined): string | undefined {
  if (latitude === undefined || longitude === undefined) return undefined;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  const lat = `${Math.abs(latitude).toFixed(2)}° ${latitude < 0 ? 'LS' : 'LU'}`;
  const lng = `${Math.abs(longitude).toFixed(2)}° ${longitude < 0 ? 'BB' : 'BT'}`;
  return `${lat}, ${lng}`;
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}
