'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  ExpressionSpecification,
  FilterSpecification,
  GeoJSONSource,
  Map as MapLibreMap,
  MapLayerMouseEvent,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { INDONESIA_VIEWPORT, toEventCollection } from '@/lib/nusawatch/map';
import type { IntelligenceEvent } from '@/lib/nusawatch/types';

const SOURCE_ID = 'nw-events';
const CLUSTER_LAYER = 'nw-clusters';
const CLUSTER_COUNT_LAYER = 'nw-cluster-count';
const POINT_LAYER = 'nw-points';
const SELECTED_LAYER = 'nw-selected';

const POINT_RADIUS: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['coalesce', ['get', 'magnitude'], 0],
  0, 5,
  4, 7,
  6, 11,
  8, 16,
];

const SELECTED_RADIUS: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['coalesce', ['get', 'magnitude'], 0],
  0, 10,
  4, 12,
  6, 16,
  8, 21,
];

/**
 * Secondary, spatial view of the same events the list shows.
 *
 * Deliberately not a re-skin of `OsirisMap`: that component carries globe,
 * terrain, satellites, CCTV and drawing tools. This one renders one source and
 * one interaction, so it can be read and tested on its own.
 *
 * The map is `aria-hidden` because a canvas is not accessible; the list is the
 * accessible surface and every marker has a list row. That is also why cluster
 * counts are text: a user who cannot see the map loses nothing.
 */
export function EventMap({
  events,
  selectedId,
  onSelect,
}: {
  events: IntelligenceEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onSelectRef = useRef(onSelect);
  const eventsRef = useRef(events);
  const previousSelection = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | undefined;

    async function create() {
      const maplibregl = await import('maplibre-gl');
      if (cancelled || !containerRef.current) return;

      maplibregl.setWorkerUrl(
        `/vendor/maplibre/${maplibregl.getVersion()}/maplibre-gl-worker.mjs`,
      );

      let instance: MapLibreMap;
      try {
        instance = new maplibregl.Map({
          container: containerRef.current,
          style: '/dark-matter-style.json',
          center: INDONESIA_VIEWPORT.center,
          zoom: INDONESIA_VIEWPORT.zoom,
          minZoom: INDONESIA_VIEWPORT.minZoom,
          maxZoom: INDONESIA_VIEWPORT.maxZoom,
          attributionControl: { compact: true },
        });
      } catch {
        if (!cancelled) {
          setFailed('Peta tidak dapat dimuat di peramban ini. Daftar di bawah tetap lengkap.');
        }
        return;
      }

      map = instance;
      mapRef.current = instance;

      instance.on('load', () => {
        if (cancelled) return;

        instance.addSource(SOURCE_ID, {
          type: 'geojson',
          data: toEventCollection(eventsRef.current),
          cluster: true,
          clusterRadius: 46,
          clusterMaxZoom: 7,
        });

        instance.addLayer({
          id: CLUSTER_LAYER,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#3ddcbf',
            'circle-opacity': 0.22,
            'circle-stroke-color': '#3ddcbf',
            'circle-stroke-width': 1.5,
            'circle-radius': ['step', ['get', 'point_count'], 18, 5, 24, 15, 30],
          },
        });

        instance.addLayer({
          id: CLUSTER_COUNT_LAYER,
          type: 'symbol',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': ['Open Sans Regular'],
            'text-size': 12,
          },
          paint: {
            'text-color': '#d8f7ef',
          },
        });

        instance.addLayer({
          id: POINT_LAYER,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-radius': POINT_RADIUS,
            'circle-color': [
              'match',
              ['get', 'freshness'],
              'fresh', '#3ddcbf',
              'stale', '#e8b04b',
              '#61757b',
            ],
            'circle-opacity': 0.9,
            'circle-stroke-color': '#070c0f',
            'circle-stroke-width': 1.5,
          },
        });

        instance.addLayer({
          id: SELECTED_LAYER,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['==', ['get', 'id'], ''],
          paint: {
            'circle-radius': SELECTED_RADIUS,
            'circle-color': 'rgba(0,0,0,0)',
            'circle-stroke-color': '#e4eef0',
            'circle-stroke-width': 2.5,
          },
        });

        setReady(true);
      });

      instance.on('error', () => {
        if (cancelled) return;
        if (!instance.loaded()) {
          setFailed('Gaya peta gagal dimuat. Daftar di bawah tetap lengkap.');
        }
      });

      instance.on('click', (event: MapLayerMouseEvent) => {
        const feature = instance.queryRenderedFeatures(event.point, {
          layers: [CLUSTER_LAYER, POINT_LAYER],
        })[0];
        if (!feature) return;

        const properties = feature.properties ?? {};

        if (properties.cluster) {
          const source = instance.getSource(SOURCE_ID) as GeoJSONSource | undefined;
          const clusterId = Number(properties.cluster_id);
          const { geometry } = feature;
          if (!source || !Number.isFinite(clusterId) || geometry.type !== 'Point') return;
          const coordinates: [number, number] = [geometry.coordinates[0], geometry.coordinates[1]];

          void source.getClusterExpansionZoom(clusterId).then(zoom => {
            instance.easeTo({ center: coordinates, zoom, duration: 500 });
          });
          return;
        }

        if (typeof properties.id === 'string') onSelectRef.current(properties.id);
      });

      instance.on('mousemove', (event: MapLayerMouseEvent) => {
        const hit = instance.queryRenderedFeatures(event.point, {
          layers: [CLUSTER_LAYER, POINT_LAYER],
        });
        instance.getCanvas().style.cursor = hit.length > 0 ? 'pointer' : '';
      });
    }

    void create();

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(toEventCollection(events));
  }, [events, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const filter: FilterSpecification = ['==', ['get', 'id'], selectedId ?? ''];
    map.setFilter(SELECTED_LAYER, filter);
  }, [selectedId, ready]);

  /* Fly only when the user moves the selection. The first selection is the
     newest event, which `EventExplorer` derives; flying there on load would
     throw away the national view before anyone asked for it. */
  useEffect(() => {
    if (!ready) return;
    const previous = previousSelection.current;
    previousSelection.current = selectedId;
    if (!selectedId || previous === null || previous === selectedId) return;

    const event = eventsRef.current.find(item => item.id === selectedId);
    const latitude = event?.location?.latitude;
    const longitude = event?.location?.longitude;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return;

    const map = mapRef.current;
    if (!map) return;
    map.flyTo({
      center: [longitude, latitude],
      zoom: Math.max(map.getZoom(), 6),
      duration: 900,
    });
  }, [selectedId, ready]);

  return (
    <section className="nw-panel nw-map-panel" aria-label="Peta peristiwa">
      <div className="nw-panel-head">
        <span>
          <strong>Peta</strong> sebaran peristiwa
        </span>
        <span className="nw-map-hint">Ukuran = magnitudo · warna = kesegaran</span>
      </div>

      <div className="nw-map-wrap">
        <div ref={containerRef} className="nw-map" aria-hidden="true" />
        {!ready && !failed && <p className="nw-map-overlay">Memuat peta…</p>}
        {failed && (
          <p className="nw-map-overlay nw-map-overlay--error" role="status">
            {failed}
          </p>
        )}
      </div>

      <p className="nw-sr-only">
        Peta bersifat tambahan. Semua peristiwa yang tampil di peta juga tersedia sebagai daftar
        yang dapat dibaca dan dipilih dengan papan ketik.
      </p>
    </section>
  );
}
