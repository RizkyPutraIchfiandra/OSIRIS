import { formatAge, formatCount } from '@/lib/nusawatch/format';
import { healthLabel } from '@/lib/nusawatch/labels';
import type { SourceReport } from '@/lib/nusawatch/types';

/**
 * One row per source, always visible — a reader should not have to open a
 * panel to learn that the feed behind the list is degraded.
 */
export function SourceStatus({ sources }: { sources: SourceReport[] }) {
  return (
    <section className="nw-sources" aria-label="Status sumber data">
      {sources.map(source => (
        <div key={source.id} className="nw-source">
          <strong>{source.name}</strong>
          <span className={`nw-badge nw-badge--${source.health}`}>{healthLabel(source.health)}</span>
          <span>{formatCount(source.eventCount)} peristiwa</span>
          <span aria-hidden="true">·</span>
          <span>diambil {formatAge(source.lastFetchedAt) ?? 'tidak diketahui'}</span>
          {source.servedStale && <span className="nw-badge nw-badge--stale">dari cache</span>}
          <span className="nw-grow" />
          {source.homepage && (
            <a className="nw-src-link" href={source.homepage} target="_blank" rel="noopener noreferrer">
              Buka situs sumber
              <span className="nw-sr-only"> (terbuka di tab baru)</span>
            </a>
          )}
          {source.error && <p className="nw-source-error">{source.error}</p>}
          <details>
            <summary>Atribusi &amp; keterbatasan</summary>
            <p>{source.attribution}</p>
            <ul>
              {source.limitations.map(limitation => (
                <li key={limitation}>{limitation}</li>
              ))}
            </ul>
          </details>
        </div>
      ))}
    </section>
  );
}
