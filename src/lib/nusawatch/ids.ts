import { createHash } from 'node:crypto';

/**
 * Deterministic ids.
 *
 * BMKG publishes no event id, so identity has to be derived from the fields
 * that actually identify the event: its origin time, hypocentre and magnitude.
 * Two endpoints carrying the same earthquake therefore collapse to one id,
 * while a later revision by BMKG (new magnitude or fix) becomes a new event —
 * which is the honest outcome, since we cannot prove it is the same record.
 */
export function deterministicEventId(sourceId: string, parts: Array<string | number | undefined>): string {
  const material = [sourceId, ...parts.map(part => (part === undefined ? '' : String(part)))].join('|');
  return `${sourceId}-${createHash('sha256').update(material).digest('hex').slice(0, 16)}`;
}
