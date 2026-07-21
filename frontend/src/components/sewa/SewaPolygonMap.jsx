import { useEffect, useMemo, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapTrifoldIcon, PolygonIcon } from "@phosphor-icons/react";

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const DEFAULT_CENTER = [112.9063, -7.6453];
const DEFAULT_ZOOM = 13;
const SOURCE_ID = "sewa-polygon-source";
const FILL_LAYER_ID = "sewa-polygon-fill";
const OUTLINE_LAYER_ID = "sewa-polygon-outline";

function normalizePoint(point, source = "latlng") {
  if (!Array.isArray(point) || point.length < 2) return null;
  const first = Number(point[0]);
  const second = Number(point[1]);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
  return source === "geojson" ? [first, second] : [second, first];
}

function areSamePoint(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  return (
    Math.abs(Number(a[0]) - Number(b[0])) < 1e-9 &&
    Math.abs(Number(a[1]) - Number(b[1])) < 1e-9
  );
}

function getPolygonPointCount(ring) {
  if (!Array.isArray(ring)) return 0;
  if (ring.length < 2) return ring.length;
  return areSamePoint(ring[0], ring[ring.length - 1])
    ? ring.length - 1
    : ring.length;
}

function getLngLatRing(polygon) {
  if (!polygon) return null;

  if (polygon?.geometry?.coordinates?.[0]) {
    const ring = polygon.geometry.coordinates[0]
      .map((point) => normalizePoint(point, "geojson"))
      .filter(Boolean);
    return ring.length >= 3 ? ring : null;
  }

  if (polygon?.coordinates?.[0]) {
    const ring = polygon.coordinates[0]
      .map((point) => normalizePoint(point, "geojson"))
      .filter(Boolean);
    return ring.length >= 3 ? ring : null;
  }

  if (Array.isArray(polygon)) {
    const rawRing = Array.isArray(polygon[0]?.[0]) ? polygon[0] : polygon;
    const ring = rawRing
      .map((point) => {
        if (Array.isArray(point)) return normalizePoint(point, "latlng");
        return normalizePoint([point?.lat, point?.lng], "latlng");
      })
      .filter(Boolean);
    return ring.length >= 3 ? ring : null;
  }

  return null;
}

function toFeatureCollection(ring) {
  if (!ring || ring.length < 3) {
    return { type: "FeatureCollection", features: [] };
  }

  const closedRing = [...ring];
  const first = closedRing[0];
  const last = closedRing[closedRing.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    closedRing.push([...first]);
  }

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [closedRing],
        },
        properties: {},
      },
    ],
  };
}

function getCenter(ring) {
  if (!ring || ring.length < 3) return DEFAULT_CENTER;
  const lngs = ring.map((point) => point[0]);
  const lats = ring.map((point) => point[1]);
  return [
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
    (Math.min(...lats) + Math.max(...lats)) / 2,
  ];
}

export default function SewaPolygonMap({
  polygon,
  height = 360,
  showHeader = true,
  compact = false,
  interactive = true,
  className = "",
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const ring = useMemo(() => getLngLatRing(polygon), [polygon]);
  const featureCollection = useMemo(() => toFeatureCollection(ring), [ring]);
  const pointCount = useMemo(() => getPolygonPointCount(ring), [ring]);
  const fitPadding = compact ? 24 : 48;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: getCenter(ring),
      zoom: ring ? 16 : DEFAULT_ZOOM,
      pitch: 0,
      bearing: 0,
      antialias: true,
      interactive,
      dragPan: interactive,
      scrollZoom: interactive,
      boxZoom: interactive,
      doubleClickZoom: interactive,
      keyboard: interactive,
      touchZoomRotate: interactive,
    });

    if (interactive && !compact) {
      map.addControl(new maplibregl.NavigationControl(), "top-right");
      map.addControl(
        new maplibregl.ScaleControl({ maxWidth: 120, unit: "metric" }),
        "bottom-left",
      );
    }

    map.on("load", () => {
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: featureCollection,
      });

      map.addLayer({
        id: FILL_LAYER_ID,
        type: "fill",
        source: SOURCE_ID,
        paint: {
          "fill-color": "#22c55e",
          "fill-opacity": 0.32,
        },
      });

      map.addLayer({
        id: OUTLINE_LAYER_ID,
        type: "line",
        source: SOURCE_ID,
        paint: {
          "line-color": "#10b981",
          "line-width": 3,
        },
      });

      if (ring) {
        const bounds = new maplibregl.LngLatBounds();
        ring.forEach((point) => bounds.extend(point));
        map.fitBounds(bounds, { padding: fitPadding, maxZoom: 18, duration: 0 });
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [compact, featureCollection, fitPadding, interactive, ring]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource(SOURCE_ID);
    if (source) {
      source.setData(featureCollection);
    }

    if (ring) {
      const bounds = new maplibregl.LngLatBounds();
      ring.forEach((point) => bounds.extend(point));
      map.fitBounds(bounds, { padding: fitPadding, maxZoom: 18, duration: 350 });
    }
  }, [featureCollection, fitPadding, ring]);

  const containerClassName = [
    "w-full overflow-hidden bg-surface-secondary",
    compact ? "rounded-none border-0" : "rounded-xl border border-border",
    interactive ? "" : "pointer-events-none",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={showHeader ? "space-y-3" : "h-full"}>
      {showHeader ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapTrifoldIcon
              size={16}
              weight="fill"
              className="text-emerald-500"
            />
            <span className="text-sm font-medium text-text-secondary">
              Peta Lokasi Sewa
            </span>
          </div>
          {ring ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
              <PolygonIcon size={12} weight="duotone" />
              Polygon tersedia ({pointCount} titik)
            </span>
          ) : null}
        </div>
      ) : null}

      <div
        ref={containerRef}
        className={containerClassName}
        style={{ height }}
      />

      {!ring && showHeader ? (
        <p className="text-xs text-text-muted text-center">
          Belum ada data polygon untuk ditampilkan pada peta.
        </p>
      ) : null}
    </div>
  );
}
