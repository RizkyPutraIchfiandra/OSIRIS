import { useEffect, useRef } from 'react';
import { formatDepth, formatEventTime, formatMagnitude } from '@/lib/nusawatch/format';
import { regionLabel } from '@/lib/nusawatch/regions';
import type { IntelligenceEvent } from '@/lib/nusawatch/types';
import { FreshnessBadge } from './FreshnessBadge';

/**
 * The list is the primary surface: it is readable without a map, without
 * colour, and without hover. Each row states what happened, where, when, and
 * how current our copy of the data is.
 */
export function EventList({
  events,
  selectedId,
  onSelect,
}: {
  events: IntelligenceEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const listRef = useRef<HTMLUListElement | null>(null);

  /* Keep the map and the list showing the same thing: selecting a marker must
     bring its row into view, not leave the highlight somewhere off-screen. */
  useEffect(() => {
    if (!selectedId) return;
    const row = listRef.current?.querySelector<HTMLElement>(
      `[data-event-id="${selectedId}"]`,
    );
    row?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [selectedId]);

  return (
    <ul className="nw-list" ref={listRef}>
      {events.map(event => {
        const magnitude =
          typeof event.severity?.value === 'number'
            ? formatMagnitude(event.severity.value)
            : event.severity?.label;
        const time = formatEventTime(event.eventTime);
        const depth = formatDepth(event.depthKm);

        return (
          <li key={event.id}>
            <button
              type="button"
              className="nw-item"
              data-event-id={event.id}
              aria-current={event.id === selectedId}
              onClick={() => onSelect(event.id)}
            >
              <span className="nw-item-top">
                <span className="nw-item-title">{event.title}</span>
                {magnitude && <span className="nw-mag">{magnitude}</span>}
              </span>
              <span className="nw-item-meta">
                <span>{time ?? 'Waktu tidak tersedia'}</span>
                <span className="nw-sep" aria-hidden="true">·</span>
                <span>{regionLabel(event.location?.region)}</span>
                {depth && (
                  <>
                    <span className="nw-sep" aria-hidden="true">·</span>
                    <span>kedalaman {depth}</span>
                  </>
                )}
                <FreshnessBadge freshness={event.freshness} />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
