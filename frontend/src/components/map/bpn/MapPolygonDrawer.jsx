import { useState, useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  PolygonIcon,
  TrashIcon,
  ArrowCounterClockwiseIcon,
  LightbulbIcon,
  PencilSimpleIcon,
  CheckCircleIcon,
  ArrowsOutIcon,
  XIcon,
  CheckIcon,
  DownloadSimpleIcon,
} from "@phosphor-icons/react";

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const PASURUAN_CITY_CENTER = [-7.6469, 112.9075]; // [lat, lng]
const DEFAULT_ZOOM = 14;

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const toLngLat = (point) => [point[1], point[0]];

const areSamePoint = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  return (
    Math.abs(Number(a[0]) - Number(b[0])) < 1e-9 &&
    Math.abs(Number(a[1]) - Number(b[1])) < 1e-9
  );
};

const removeClosingPoint = (activePoints) => {
  if (!Array.isArray(activePoints) || activePoints.length < 2) {
    return activePoints;
  }

  return areSamePoint(activePoints[0], activePoints[activePoints.length - 1])
    ? activePoints.slice(0, -1)
    : activePoints;
};

const getLineFeatureCollection = (points) => {
  if (!Array.isArray(points) || points.length < 2) {
    return { type: "FeatureCollection", features: [] };
  }

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: points.map(toLngLat),
        },
        properties: {},
      },
    ],
  };
};

const getPolygonFeatureCollection = (points) => {
  if (!Array.isArray(points) || points.length < 3) {
    return { type: "FeatureCollection", features: [] };
  }

  const ring = points.map(toLngLat);
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([...first]);
  }

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [ring],
        },
        properties: {},
      },
    ],
  };
};

const createVertexElement = (isDrawing) => {
  const marker = document.createElement("div");
  marker.style.width = "14px";
  marker.style.height = "14px";
  marker.style.borderRadius = "50%";
  marker.style.border = "2px solid white";
  marker.style.background = "#3b82f6";
  marker.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
  marker.style.cursor = isDrawing ? "not-allowed" : "grab";
  return marker;
};

function MapLibrePolygonCanvas({
  points,
  isDrawing,
  center,
  onAddPoint,
  onMovePoint,
  onRemovePoint,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const isDrawingRef = useRef(isDrawing);
  const onAddPointRef = useRef(onAddPoint);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
  }, []);

  const syncGeometry = useCallback((activePoints) => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;

    const polygonSource = mapRef.current.getSource("draw-polygon-source");
    if (polygonSource) {
      polygonSource.setData(getPolygonFeatureCollection(activePoints));
    }

    const lineSource = mapRef.current.getSource("draw-line-source");
    if (lineSource) {
      lineSource.setData(getLineFeatureCollection(activePoints));
    }
  }, []);

  const syncMarkers = useCallback(
    (activePoints, drawingMode) => {
      if (!mapRef.current) return;

      clearMarkers();

      activePoints.forEach((point, index) => {
        const marker = new maplibregl.Marker({
          element: createVertexElement(drawingMode),
          draggable: !drawingMode,
        })
          .setLngLat(toLngLat(point))
          .addTo(mapRef.current);

        if (!drawingMode) {
          marker.on("dragend", () => {
            const next = marker.getLngLat();
            onMovePoint(index, [next.lat, next.lng]);
          });

          marker.getElement().addEventListener("contextmenu", (e) => {
            e.preventDefault();
            if (activePoints.length > 3) {
              onRemovePoint(index);
            }
          });
        }

        markersRef.current.push(marker);
      });
    },
    [clearMarkers, onMovePoint, onRemovePoint],
  );

  useEffect(() => {
    isDrawingRef.current = isDrawing;
  }, [isDrawing]);

  useEffect(() => {
    onAddPointRef.current = onAddPoint;
  }, [onAddPoint]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter =
      Array.isArray(points) && points.length
        ? toLngLat(points[0])
        : [center[1], center[0]];

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: initialCenter,
      zoom: DEFAULT_ZOOM,
      attributionControl: true,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      map.addSource("draw-polygon-source", {
        type: "geojson",
        data: getPolygonFeatureCollection(points),
      });
      map.addSource("draw-line-source", {
        type: "geojson",
        data: getLineFeatureCollection(points),
      });

      map.addLayer({
        id: "draw-polygon-fill",
        type: "fill",
        source: "draw-polygon-source",
        paint: {
          "fill-color": "#3b82f6",
          "fill-opacity": 0.15,
        },
      });

      map.addLayer({
        id: "draw-polygon-outline",
        type: "line",
        source: "draw-polygon-source",
        paint: {
          "line-color": "#3b82f6",
          "line-width": 2,
        },
      });

      map.addLayer({
        id: "draw-line-preview",
        type: "line",
        source: "draw-line-source",
        paint: {
          "line-color": "#3b82f6",
          "line-width": 2,
          "line-dasharray": [2, 2],
        },
      });

      syncGeometry(points);
      syncMarkers(points, isDrawingRef.current);

      if (points.length >= 2) {
        const bounds = new maplibregl.LngLatBounds();
        points.forEach((point) => bounds.extend(toLngLat(point)));
        map.fitBounds(bounds, { padding: 40, maxZoom: 18, duration: 0 });
      }
    });

    map.on("click", (e) => {
      if (!isDrawingRef.current) return;
      onAddPointRef.current([e.lngLat.lat, e.lngLat.lng]);
    });

    mapRef.current = map;

    const resizeMap = () => map.resize();
    map.once("load", resizeMap);
    const resizeTimer = window.setTimeout(resizeMap, 150);

    return () => {
      window.clearTimeout(resizeTimer);
      clearMarkers();
      map.remove();
      mapRef.current = null;
    };
  }, [center, points, syncGeometry, syncMarkers, clearMarkers]);

  useEffect(() => {
    if (!mapRef.current) return;

    const apply = () => {
      syncGeometry(points);
      syncMarkers(points, isDrawing);
      mapRef.current.getCanvas().style.cursor = isDrawing
        ? "crosshair"
        : "grab";
    };

    if (mapRef.current.isStyleLoaded()) {
      apply();
    } else {
      mapRef.current.once("load", apply);
    }
  }, [points, isDrawing, syncGeometry, syncMarkers]);

  useEffect(() => {
    if (!mapRef.current || points.length > 0) return;
    mapRef.current.easeTo({ center: [center[1], center[0]], duration: 400 });
  }, [center, points.length]);

  return <div ref={containerRef} className="w-full h-full" />;
}

export default function MapPolygonDrawer({
  polygonData,
  onPolygonChange,
  label = "Gambar Polygon Bidang Tanah",
  centerLat,
  centerLng,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState([]);
  const [savedPoints, setSavedPoints] = useState([]); // backup for cancel

  const defaultCenter = PASURUAN_CITY_CENTER;
  const parsedLat = toNumber(centerLat);
  const parsedLng = toNumber(centerLng);
  const hasCenter = parsedLat !== null && parsedLng !== null;
  const mapCenter = hasCenter ? [parsedLat, parsedLng] : defaultCenter;

  const arePointsEqual = (a, b) => {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i][0] !== b[i][0] || a[i][1] !== b[i][1]) return false;
    }
    return true;
  };

  // Initialize from existing data
  useEffect(() => {
    if (polygonData && Array.isArray(polygonData) && polygonData.length >= 3) {
      const normalized = removeClosingPoint(
        polygonData.map((p) => (Array.isArray(p) ? p : [p.lat, p.lng])),
      );
      setPoints((prev) =>
        arePointsEqual(prev, normalized) ? prev : normalized,
      );
      return;
    }

    setPoints((prev) => (prev.length ? [] : prev));
  }, [polygonData]);

  // Sync changes to parent
  const syncToParent = useCallback(
    (newPoints) => {
      const visiblePoints = removeClosingPoint(newPoints);
      if (visiblePoints.length >= 3) {
        onPolygonChange(visiblePoints);
      } else {
        onPolygonChange(null);
      }
    },
    [onPolygonChange],
  );

  const handleAddPoint = (point) => {
    const newPoints = [...points, point];
    setPoints(newPoints);
    syncToParent(newPoints);
  };

  const handleRemoveLastPoint = () => {
    if (points.length > 0) {
      const newPoints = points.slice(0, -1);
      setPoints(newPoints);
      syncToParent(newPoints);
    }
  };

  const handleClearAll = () => {
    setPoints([]);
    setIsDrawing(false);
    onPolygonChange(null);
  };

  const handleStartDraw = () => {
    setIsDrawing(true);
  };

  const handleFinishDraw = () => {
    setIsDrawing(false);
  };

  const handleVertexDrag = (index, newPos) => {
    const newPoints = [...points];
    newPoints[index] = [newPos.lat, newPos.lng];
    setPoints(newPoints);
    syncToParent(newPoints);
  };

  const handleRemoveVertex = (index) => {
    const newPoints = points.filter((_, i) => i !== index);
    setPoints(newPoints);
    syncToParent(newPoints);
  };

  const handleOpenFullscreen = () => {
    setSavedPoints([...points]);
    setIsExpanded(false);
    setIsFullscreen(true);
  };

  const handleConfirmFullscreen = () => {
    syncToParent(points);
    setIsFullscreen(false);
    setIsDrawing(false);
  };

  const handleCancelFullscreen = () => {
    setPoints(savedPoints);
    syncToParent(savedPoints);
    setIsFullscreen(false);
    setIsDrawing(false);
  };

  const pointCount = removeClosingPoint(points).length;
  const hasPolygon = pointCount >= 3;

  // Calculate area (approximate in m²)
  const calculateArea = () => {
    if (points.length < 3) return 0;
    // Shoelace formula with lat/lng to meters approximation
    let area = 0;
    const n = points.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const lat1 = (points[i][0] * Math.PI) / 180;
      const lat2 = (points[j][0] * Math.PI) / 180;
      const dLng = ((points[j][1] - points[i][1]) * Math.PI) / 180;
      area += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    area = Math.abs((area * 6378137 * 6378137) / 2);
    return area;
  };

  const formatArea = (area) => {
    if (area === 0) return "-";
    if (area < 10000) return `${area.toFixed(1)} m²`;
    return `${(area / 10000).toFixed(2)} ha`;
  };

  const handleExportGeojson = () => {
    const visiblePoints = removeClosingPoint(points);
    if (visiblePoints.length < 3) return;

    const ring = visiblePoints.map(([lat, lng]) => [lng, lat]);
    ring.push([...ring[0]]);

    const geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            sumber: "BPN",
            keterangan: "Polygon bidang tanah untuk impor BPKA",
          },
          geometry: {
            type: "Polygon",
            coordinates: [ring],
          },
        },
      ],
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: "application/geo+json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `polygon-bidang-bpn-${new Date()
      .toISOString()
      .slice(0, 10)}.geojson`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-text-primary">
        {label}
      </label>

      {/* Polygon Status & Toggle */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-surface-secondary border border-border rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-2">
            {hasPolygon ? (
              <>
                <PolygonIcon
                  size={16}
                  weight="fill"
                  className="text-emerald-500"
                />
                <div>
                  <span className="text-sm font-medium text-text-primary">
                    {pointCount} titik
                  </span>
                  <span className="text-xs text-text-muted ml-2">
                    ~ {formatArea(calculateArea())}
                  </span>
                </div>
              </>
            ) : (
              <>
                <PolygonIcon
                  size={16}
                  weight="regular"
                  className="text-text-muted"
                />
                <span className="text-sm text-text-muted">
                  Belum ada polygon
                </span>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-2.5 bg-accent text-surface rounded-lg hover:opacity-90 transition text-sm font-medium flex items-center gap-1.5"
        >
          <PolygonIcon size={16} weight="bold" />
          {isExpanded ? "Tutup" : hasPolygon ? "Edit" : "Gambar"}
        </button>
        <button
          type="button"
          onClick={handleOpenFullscreen}
          className="px-3 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium flex items-center gap-1.5"
          title="Buka Peta Fullscreen"
        >
          <ArrowsOutIcon size={16} weight="bold" />
        </button>
        {hasPolygon && (
          <button
            type="button"
            onClick={handleExportGeojson}
            className="px-3 py-2.5 bg-surface border border-border text-text-secondary rounded-lg hover:bg-surface-secondary transition text-sm font-medium flex items-center gap-1.5"
            title="Ekspor GeoJSON untuk BPKA"
          >
            <DownloadSimpleIcon size={16} weight="bold" />
            Ekspor
          </button>
        )}
      </div>

      {/* Fullscreen Map Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-9999 bg-surface flex flex-col">
          {/* Fullscreen Header */}
          <div className="bg-surface border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <PolygonIcon size={20} weight="bold" className="text-blue-500" />
              <div>
                <h3 className="font-semibold text-text-primary text-sm">
                  Gambar Polygon Bidang
                </h3>
                <p className="text-xs text-text-muted">
                  {isDrawing
                    ? `Mode gambar aktif — ${pointCount} titik`
                    : hasPolygon
                      ? `${pointCount} titik — ~ ${formatArea(calculateArea())}`
                      : 'Klik "Mulai Gambar" untuk membuat polygon'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Drawing toolbar */}
              <div className="flex items-center gap-1.5 mr-2">
                {!isDrawing ? (
                  <button
                    type="button"
                    onClick={handleStartDraw}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-surface rounded-lg text-xs font-semibold hover:opacity-90 transition"
                  >
                    <PencilSimpleIcon size={14} weight="bold" />
                    Mulai Gambar
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleFinishDraw}
                      disabled={points.length < 3}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:opacity-90 transition disabled:opacity-50"
                    >
                      <CheckCircleIcon size={14} weight="bold" />
                      Selesai Gambar
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveLastPoint}
                      disabled={points.length === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-medium text-text-secondary hover:bg-surface-secondary transition disabled:opacity-40"
                    >
                      <ArrowCounterClockwiseIcon size={14} weight="bold" />
                      Undo
                    </button>
                  </>
                )}
                {hasPolygon && !isDrawing && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-lg text-xs font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition"
                  >
                    <TrashIcon size={14} weight="bold" />
                    Hapus
                  </button>
                )}
                {hasPolygon && !isDrawing && (
                  <button
                    type="button"
                    onClick={handleExportGeojson}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-medium text-text-secondary hover:bg-surface-secondary transition"
                  >
                    <DownloadSimpleIcon size={14} weight="bold" />
                    Ekspor GeoJSON
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleConfirmFullscreen}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition"
              >
                <CheckIcon size={16} weight="bold" /> Done
              </button>
              <button
                type="button"
                onClick={handleCancelFullscreen}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition"
              >
                <XIcon size={18} weight="bold" />
              </button>
            </div>
          </div>

          {/* Drawing instruction bar */}
          {isDrawing && (
            <div className="bg-accent/10 border-b border-accent/20 px-4 py-2 flex items-center gap-2 shrink-0">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-medium text-accent">
                Klik pada peta untuk menambahkan titik polygon (min. 3 titik)
              </span>
              <span className="text-xs text-text-muted ml-auto">
                {pointCount} titik
              </span>
            </div>
          )}

          {/* Fullscreen Map */}
          <div
            className={`flex-1 relative ${isDrawing ? "map-cursor-crosshair" : ""}`}
          >
            <MapLibrePolygonCanvas
              points={points}
              isDrawing={isDrawing}
              center={mapCenter}
              onAddPoint={handleAddPoint}
              onMovePoint={handleVertexDrag}
              onRemovePoint={handleRemoveVertex}
            />
          </div>

          {/* Fullscreen footer info */}
          {hasPolygon && !isDrawing && (
            <div className="bg-surface-secondary border-t border-border px-4 py-2 flex items-center gap-4 text-xs shrink-0">
              <span className="text-text-muted">
                <span className="font-semibold text-text-primary">
                  {pointCount}
                </span>{" "}
                titik
              </span>
              <span className="text-text-muted">
                Luas:{" "}
                <span className="font-semibold text-text-primary">
                  {formatArea(calculateArea())}
                </span>
              </span>
              <span className="text-text-tertiary ml-auto">
                Seret titik untuk ubah bentuk • Klik kanan titik untuk hapus
              </span>
            </div>
          )}
        </div>
      )}

      {/* Expandable Map Area */}
      {isExpanded && (
        <div className="border border-border rounded-xl overflow-hidden">
          {/* Toolbar */}
          <div className="bg-surface-secondary px-3 py-2 border-b border-border flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              {!isDrawing ? (
                <button
                  type="button"
                  onClick={handleStartDraw}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-accent text-surface rounded-lg text-xs font-semibold hover:opacity-90 transition shadow-sm"
                >
                  <PencilSimpleIcon size={14} weight="bold" />
                  Mulai Gambar
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleFinishDraw}
                    disabled={points.length < 3}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500 text-surface rounded-lg text-xs font-semibold hover:opacity-90 transition shadow-sm disabled:opacity-50"
                  >
                    <CheckCircleIcon size={14} weight="bold" />
                    Selesai
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveLastPoint}
                    disabled={points.length === 0}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface border border-border rounded-lg text-xs font-medium text-text-secondary hover:bg-surface-secondary transition disabled:opacity-40"
                  >
                    <ArrowCounterClockwiseIcon size={14} weight="bold" />
                    Undo
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {hasPolygon && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-lg text-xs font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition"
                >
                  <TrashIcon size={14} weight="bold" />
                  Hapus Semua
                </button>
              )}
            </div>
          </div>

          {/* Drawing instruction bar */}
          {isDrawing && (
            <div className="bg-accent/10 border-b border-accent/20 px-3 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-medium text-accent">
                Klik pada peta untuk menambahkan titik polygon (min. 3 titik)
              </span>
              <span className="text-xs text-text-muted ml-auto">
                {pointCount} titik
              </span>
            </div>
          )}

          {/* Map */}
          <div
            className={`h-96 relative ${isDrawing ? "map-cursor-crosshair" : ""}`}
          >
            <MapLibrePolygonCanvas
              points={points}
              isDrawing={isDrawing}
              center={mapCenter}
              onAddPoint={handleAddPoint}
              onMovePoint={handleVertexDrag}
              onRemovePoint={handleRemoveVertex}
            />
          </div>

          {/* Point List & Info */}
          <div className="bg-surface-secondary border-t border-border">
            {hasPolygon && (
              <div className="px-3 py-2 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-text-muted">
                      <span className="font-semibold text-text-primary">
                        {pointCount}
                      </span>{" "}
                      titik
                    </span>
                    <span className="text-text-muted">
                      Luas:{" "}
                      <span className="font-semibold text-text-primary">
                        {formatArea(calculateArea())}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Help text */}
            <div className="px-3 py-2">
              <p className="text-xs text-text-tertiary flex items-center gap-1.5">
                <LightbulbIcon size={14} weight="bold" className="shrink-0" />
                {isDrawing
                  ? 'Klik peta untuk tambah titik. Tekan "Selesai" jika sudah.'
                  : hasPolygon
                    ? "Seret titik untuk mengubah bentuk. Klik kanan titik untuk menghapus."
                    : 'Klik "Mulai Gambar" lalu klik peta untuk membuat polygon.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
