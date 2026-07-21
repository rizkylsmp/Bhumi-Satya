import { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, TileLayer, Polygon, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import {
  PencilSimpleIcon,
  TrashIcon,
  PolygonIcon,
  MapTrifoldIcon,
} from "@phosphor-icons/react";

const DEFAULT_CENTER = [-6.32, 106.45];
const DEFAULT_ZOOM = 13;

// ── helpers ──────────────────────────────────────────────
function normalizePoint(point, source = "latlng") {
  if (!Array.isArray(point) || point.length < 2) return null;
  const first = Number(point[0]);
  const second = Number(point[1]);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
  return source === "geojson" ? [second, first] : [first, second];
}

function areSamePoint(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  return (
    Math.abs(Number(a[0]) - Number(b[0])) < 1e-9 &&
    Math.abs(Number(a[1]) - Number(b[1])) < 1e-9
  );
}

function removeClosingPoint(points) {
  if (!Array.isArray(points) || points.length < 2) return points;
  return areSamePoint(points[0], points[points.length - 1])
    ? points.slice(0, -1)
    : points;
}

function getPositions(poly) {
  if (!poly) return null;

  if (poly?.geometry?.coordinates?.[0]) {
    const positions = poly.geometry.coordinates[0]
      .map((point) => normalizePoint(point, "geojson"))
      .filter(Boolean);
    const visiblePositions = removeClosingPoint(positions);
    return visiblePositions.length >= 3 ? visiblePositions : null;
  }

  if (poly?.coordinates?.[0]) {
    const positions = poly.coordinates[0]
      .map((point) => normalizePoint(point, "geojson"))
      .filter(Boolean);
    const visiblePositions = removeClosingPoint(positions);
    return visiblePositions.length >= 3 ? visiblePositions : null;
  }

  if (Array.isArray(poly)) {
    const ring = Array.isArray(poly[0]?.[0]) ? poly[0] : poly;
    const positions = ring
      .map((point) => {
        if (Array.isArray(point)) return normalizePoint(point, "latlng");
        return normalizePoint([point?.lat, point?.lng], "latlng");
      })
      .filter(Boolean);
    const visiblePositions = removeClosingPoint(positions);
    return visiblePositions.length >= 3 ? visiblePositions : null;
  }

  return null;
}

function toGeoJSON(latLngs) {
  const coords = latLngs.map((ll) => [ll.lng, ll.lat]);
  if (
    coords.length > 0 &&
    (coords[0][0] !== coords[coords.length - 1][0] ||
      coords[0][1] !== coords[coords.length - 1][1])
  ) {
    coords.push([...coords[0]]);
  }
  let area = null;
  try {
    area = L.GeometryUtil.geodesicArea(latLngs);
  } catch {
    /* no-op */
  }
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coords] },
    properties: { luas: area ? Math.round(area) : null },
  };
}

// ── sub-component: fit bounds when polygon changes ───────
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length >= 3) {
      map.fitBounds(positions, { padding: [40, 40], maxZoom: 18 });
    }
  }, [positions, map]);
  return null;
}

// ── sub-component: Leaflet-draw polygon handler ──────────
function DrawHandler({ active, onCreated, onCancel }) {
  const map = useMap();
  const handlerRef = useRef(null);
  const onCreatedRef = useRef(onCreated);
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onCreatedRef.current = onCreated;
    onCancelRef.current = onCancel;
  }, [onCreated, onCancel]);

  useEffect(() => {
    if (!active) {
      if (handlerRef.current) {
        try {
          handlerRef.current.disable();
        } catch {
          /* already disabled */
        }
        handlerRef.current = null;
      }
      return;
    }

    const handler = new L.Draw.Polygon(map, {
      allowIntersection: false,
      shapeOptions: {
        color: "#22c55e",
        weight: 2,
        fillColor: "#22c55e",
        fillOpacity: 0.25,
      },
    });

    handler.enable();
    handlerRef.current = handler;

    const onDraw = (e) => {
      const latLngs = e.layer.getLatLngs()[0];
      const geoJSON = toGeoJSON(latLngs);
      // Remove the raw drawn layer – we render via react-leaflet <Polygon>
      map.removeLayer(e.layer);
      onCreatedRef.current?.(geoJSON);
    };

    map.on(L.Draw.Event.CREATED, onDraw);

    return () => {
      try {
        handler.disable();
      } catch {
        /* ok */
      }
      handlerRef.current = null;
      map.off(L.Draw.Event.CREATED, onDraw);
    };
  }, [active, map]);

  return null;
}

// ── main component ───────────────────────────────────────
export default function PolygonDrawMap({
  polygon,
  onChange,
  readOnly = false,
  height = "300px",
}) {
  const [drawing, setDrawing] = useState(false);

  const positions = useMemo(() => getPositions(polygon), [polygon]);

  const center = useMemo(() => {
    if (!positions || positions.length < 3) return DEFAULT_CENTER;
    const lats = positions.map((p) => p[0]);
    const lngs = positions.map((p) => p[1]);
    return [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
    ];
  }, [positions]);

  const area = polygon?.properties?.luas;

  const handleCreated = (geoJSON) => {
    setDrawing(false);
    onChange?.(geoJSON);
  };

  const handleCancel = () => setDrawing(false);

  return (
    <div className="space-y-2">
      {/* Header & actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <MapTrifoldIcon
            size={16}
            weight="fill"
            className="text-emerald-500"
          />
          <span className="text-sm font-medium text-text-secondary">
            Polygon Sewa
          </span>
          {positions && area && (
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {Number(area).toLocaleString("id-ID")} m²
            </span>
          )}
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1.5">
            {!drawing ? (
              <button
                type="button"
                onClick={() => setDrawing(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
              >
                <PencilSimpleIcon size={14} weight="bold" />
                {positions ? "Gambar Ulang" : "Gambar Polygon"}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg animate-pulse">
                <PolygonIcon size={14} weight="fill" />
                Klik titik pada peta...
              </span>
            )}
            {positions && !drawing && (
              <button
                type="button"
                onClick={() => {
                  setDrawing(false);
                  onChange?.(null);
                }}
                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <TrashIcon size={14} weight="bold" />
                Hapus
              </button>
            )}
            {drawing && (
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-secondary rounded-lg transition-colors"
              >
                Batal
              </button>
            )}
          </div>
        )}
      </div>

      {/* Map – react-leaflet handles DOM lifecycle */}
      <MapContainer
        center={center}
        zoom={positions ? 17 : DEFAULT_ZOOM}
        scrollWheelZoom={true}
        style={{ height, width: "100%", borderRadius: "0.75rem", zIndex: 0 }}
        className="border border-border"
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={20}
        />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          maxZoom={20}
          opacity={0.7}
        />

        {/* Show existing polygon */}
        {positions && !drawing && (
          <Polygon
            positions={positions}
            pathOptions={{
              color: "#22c55e",
              weight: 2,
              fillColor: "#22c55e",
              fillOpacity: 0.25,
            }}
          />
        )}

        {/* Fit map to polygon bounds */}
        {positions && <FitBounds positions={positions} />}

        {/* Draw handler – only active when user clicks "Gambar" */}
        <DrawHandler
          active={drawing}
          onCreated={handleCreated}
          onCancel={handleCancel}
        />
      </MapContainer>

      {/* Status */}
      {positions && !drawing && (
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
          <PolygonIcon size={12} weight="duotone" />
          <span>
            Polygon tersedia ({positions.length} titik)
            {area && ` · ${Number(area).toLocaleString("id-ID")} m²`}
          </span>
        </div>
      )}
      {!positions && !drawing && !readOnly && (
        <p className="text-[11px] text-text-muted">
          Klik &quot;Gambar Polygon&quot; lalu klik titik-titik pada peta. Klik
          titik pertama untuk menutup polygon.
        </p>
      )}
    </div>
  );
}
