import {
  formatAge,
  formatCoordinates,
  formatDepth,
  formatEventTime,
} from '@/lib/nusawatch/format';
import { categoryLabel } from '@/lib/nusawatch/labels';
import { regionLabel } from '@/lib/nusawatch/regions';
import type { IntelligenceEvent, SourceReport } from '@/lib/nusawatch/types';

/**
 * Provenance is the point of this panel, not decoration.
 *
 * Missing values say "Tidak dilaporkan" instead of collapsing the row: a
 * reader can tell the difference between "BMKG did not publish a depth" and
 * "we did not look". Source text is quoted, never paraphrased into a claim.
 */
function describeDelta(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} detik`;
  return `${(seconds / 60).toFixed(1)} menit`;
}

function describeDistance(kilometres: number): string {
  if (kilometres < 1) return 'kurang dari 1 km';
  return `${Math.round(kilometres)} km`;
}
export function EventDetail({
  event,
  source,
  onClose,
}: {
  event: IntelligenceEvent;
  source?: SourceReport;
  onClose: () => void;
}) {
  const eventTime = formatEventTime(event.eventTime);
  const fetchedAt = formatEventTime(event.fetchedAt);
  const fetchedAge = formatAge(event.fetchedAt);
  const depth = formatDepth(event.depthKm);
  const coordinates = formatCoordinates(event.location?.latitude, event.location?.longitude);

  return (
    <div>
      <div className="nw-detail-head">
        <div>
          <h2>{event.title}</h2>
          <p className="nw-detail-sub">
            {source?.name ?? event.sourceName} · {categoryLabel(event.category)}
          </p>
        </div>
        <button type="button" className="nw-btn nw-close" onClick={onClose}>
          Tutup
        </button>
      </div>

      <dl className="nw-rows">
        <dt>Waktu</dt>
        <dd>
          {eventTime ?? 'Tidak dilaporkan'}
          {event.eventTimeSource && (
            <>
              <br />
              <span className="nw-dim">Sumber: {event.eventTimeSource}</span>
            </>
          )}
        </dd>

        <dt>Kedalaman</dt>
        <dd className={depth ? 'nw-mono' : 'nw-dim'}>{depth ?? 'Tidak dilaporkan'}</dd>

        <dt>Koordinat</dt>
        <dd className={coordinates ? 'nw-mono' : 'nw-dim'}>{coordinates ?? 'Tidak dilaporkan'}</dd>

        <dt>Wilayah</dt>
        <dd>
          {regionLabel(event.location?.region)}
          <br />
          <span className="nw-dim">Perkiraan dari koordinat terdekat, bukan batas resmi.</span>
        </dd>

        <dt>Diambil</dt>
        <dd>
          {fetchedAt ?? 'Tidak dilaporkan'}
          {fetchedAge && <span className="nw-dim"> · {fetchedAge}</span>}
        </dd>

        <dt>ID</dt>
        <dd className="nw-mono">{event.id}</dd>
      </dl>

      {event.potential && (
        <div className="nw-block">
          <h3>Potensi — teks BMKG</h3>
          <p className="nw-quote">{event.potential}</p>
        </div>
      )}

      {event.feltReports && (
        <div className="nw-block">
          <h3>Dirasakan — teks BMKG</h3>
          <p className="nw-quote">{event.feltReports}</p>
        </div>
      )}

      {event.crossChecks && event.crossChecks.length > 0 && (
        <div className="nw-block">
          <h3>Verifikasi silang</h3>
          <ul className="nw-list-plain">
            {event.crossChecks.map(check => (
              <li key={`${check.sourceId}-${check.sourceRecordId ?? check.sourceName}`}>
                <strong>{check.sourceName}</strong>
                {check.severityLabel && <> · {check.severityLabel}</>}
                {' · '}selisih waktu {describeDelta(check.timeDeltaSeconds)}
                {' · '}jarak episentrum {describeDistance(check.distanceKm)}
                {check.sourceUrl && (
                  <>
                    {' · '}
                    <a
                      className="nw-src-link"
                      href={check.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      catatan {check.sourceName}
                      <span className="nw-sr-only"> (terbuka di tab baru)</span>
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
          <p className="nw-dim nw-attribution">
            Dua katalog melaporkan gempa yang sama. Magnitudo dan lokasi masing-masing tetap
            ditampilkan apa adanya, tidak dirata-ratakan.
          </p>
        </div>
      )}

      <div className="nw-block">
        <h3>Keterbatasan</h3>
        <ul className="nw-list-plain">
          {event.limitations.map(limitation => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </div>

      <div className="nw-block">
        <h3>Sumber</h3>
        {source?.homepage ? (
          <a className="nw-src-link" href={source.homepage} target="_blank" rel="noopener noreferrer">
            {source.name} — halaman resmi
            <span className="nw-sr-only"> (terbuka di tab baru)</span>
          </a>
        ) : (
          <span className="nw-dim">{event.sourceName}</span>
        )}
        {source?.attribution && <p className="nw-dim nw-attribution">{source.attribution}</p>}
      </div>
    </div>
  );
}
