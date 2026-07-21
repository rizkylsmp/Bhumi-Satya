import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  MapTrifoldIcon,
  MapPinIcon,
  LightbulbIcon,
  XIcon,
  CheckIcon,
  ArrowsOutIcon,
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

const createSelectedMarkerElement = () => {
  const marker = document.createElement("div");
  marker.style.width = "24px";
  marker.style.height = "24px";
  marker.style.borderRadius = "50%";
  marker.style.background = "#3b82f6";
  marker.style.border = "3px solid white";
  marker.style.boxShadow = "0 3px 8px rgba(0,0,0,0.3)";
  return marker;
};

function MapLibreCoordinateCanvas({ centerLatLng, selectedCoords, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter = selectedCoords
      ? [selectedCoords.lng, selectedCoords.lat]
      : [centerLatLng[1], centerLatLng[0]];

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: initialCenter,
      zoom: DEFAULT_ZOOM,
      attributionControl: true,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("click", (e) => {
      onSelectRef.current(e.lngLat.lat, e.lngLat.lng);
    });

    mapRef.current = map;

    const resizeMap = () => map.resize();
    map.once("load", resizeMap);
    const resizeTimer = window.setTimeout(resizeMap, 150);

    return () => {
      window.clearTimeout(resizeTimer);
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
  }, [centerLatLng, selectedCoords]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!selectedCoords) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    const lngLat = [selectedCoords.lng, selectedCoords.lat];

    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({
        element: createSelectedMarkerElement(),
      })
        .setLngLat(lngLat)
        .addTo(mapRef.current);
    } else {
      markerRef.current.setLngLat(lngLat);
    }

    mapRef.current.easeTo({ center: lngLat, duration: 500 });
  }, [selectedCoords]);

  return <div ref={containerRef} className="w-full h-full" />;
}

export default function MapCoordinatePicker({
  latitude,
  longitude,
  onCoordinateChange,
  label = "Pilih Lokasi di Peta",
}) {
  const parsedLat = toNumber(latitude);
  const parsedLng = toNumber(longitude);
  const hasValidCoords = parsedLat !== null && parsedLng !== null;
  const [isExpanded, setIsExpanded] = useState(!hasValidCoords);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tempCoords, setTempCoords] = useState(null);
  const defaultCenter = PASURUAN_CITY_CENTER;

  // Determine map center and marker position
  const position = hasValidCoords ? [parsedLat, parsedLng] : null;
  const mapCenter = position || defaultCenter;

  const inlineCoords = useMemo(() => {
    if (!hasValidCoords) return null;
    return { lat: parsedLat, lng: parsedLng };
  }, [hasValidCoords, parsedLat, parsedLng]);

  const fullscreenCoords = useMemo(() => {
    if (!tempCoords) return null;
    const lat = toNumber(tempCoords.lat);
    const lng = toNumber(tempCoords.lng);
    if (lat === null || lng === null) return null;
    return { lat, lng };
  }, [tempCoords]);

  const handleLocationSelect = (lat, lng) => {
    if (isFullscreen) {
      setTempCoords({ lat: lat.toFixed(6), lng: lng.toFixed(6) });
    } else {
      onCoordinateChange(lat.toFixed(6), lng.toFixed(6));
    }
  };

  const handleOpenFullscreen = () => {
    setTempCoords(hasValidCoords ? { lat: latitude, lng: longitude } : null);
    setIsExpanded(false);
    setIsFullscreen(true);
  };

  const handleConfirmFullscreen = () => {
    if (tempCoords) {
      onCoordinateChange(tempCoords.lat, tempCoords.lng);
    }
    setIsFullscreen(false);
  };

  const handleCancelFullscreen = () => {
    setTempCoords(null);
    setIsFullscreen(false);
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          if (isFullscreen) {
            setTempCoords({ lat: lat.toFixed(6), lng: lng.toFixed(6) });
          } else {
            onCoordinateChange(lat.toFixed(6), lng.toFixed(6));
          }
        },
        () => {
          alert(
            "Tidak dapat mengakses lokasi. Pastikan izin lokasi diaktifkan.",
          );
        },
      );
    } else {
      alert("Browser tidak mendukung Geolocation");
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-text-primary">
        {label}
      </label>

      {/* Coordinate Display & Toggle */}
      <div className="flex items-center gap-2">
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div className="bg-surface border-2 border-border rounded-lg px-3 py-1.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all">
            <label className="text-xs text-text-secondary block mb-0.5">
              Latitude
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={latitude || ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || val === "-" || /^-?\d*\.?\d*$/.test(val)) {
                  onCoordinateChange(val, longitude || "");
                }
              }}
              placeholder="-7.6469"
              className="w-full text-sm font-medium text-text-primary bg-transparent outline-none placeholder:text-text-muted"
            />
          </div>
          <div className="bg-surface border-2 border-border rounded-lg px-3 py-1.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all">
            <label className="text-xs text-text-secondary block mb-0.5">
              Longitude
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={longitude || ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || val === "-" || /^-?\d*\.?\d*$/.test(val)) {
                  onCoordinateChange(latitude || "", val);
                }
              }}
              placeholder="112.9075"
              className="w-full text-sm font-medium text-text-primary bg-transparent outline-none placeholder:text-text-muted"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-2 bg-accent text-surface rounded-lg hover:opacity-90 transition text-sm font-medium h-full flex items-center gap-1.5"
          title={isExpanded ? "Tutup Peta" : "Buka Peta"}
        >
          <MapTrifoldIcon size={16} weight="bold" />{" "}
          {isExpanded ? "Tutup" : "Pilih"}
        </button>
        <button
          type="button"
          onClick={handleOpenFullscreen}
          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium h-full flex items-center gap-1.5"
          title="Buka Peta Fullscreen"
        >
          <ArrowsOutIcon size={16} weight="bold" />
        </button>
      </div>

      {/* Fullscreen Map Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-9999 bg-surface flex flex-col">
          {/* Fullscreen Header */}
          <div className="bg-surface border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <MapPinIcon size={20} weight="bold" className="text-blue-500" />
              <div>
                <h3 className="font-semibold text-text-primary text-sm">
                  Pilih Koordinat Lokasi
                </h3>
                <p className="text-xs text-text-muted">
                  Klik pada peta untuk menentukan titik lokasi
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {tempCoords && (
                <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg font-mono">
                  {tempCoords.lat}, {tempCoords.lng}
                </span>
              )}
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="text-xs bg-surface-secondary border border-border text-text-secondary px-3 py-1.5 rounded-lg hover:bg-surface-tertiary transition font-medium flex items-center gap-1.5"
              >
                <MapPinIcon size={14} weight="bold" /> Lokasi Saya
              </button>
              <button
                type="button"
                onClick={handleConfirmFullscreen}
                disabled={!tempCoords}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition disabled:opacity-40"
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

          {/* Fullscreen Map */}
          <div className="flex-1 relative map-cursor-crosshair">
            <MapLibreCoordinateCanvas
              centerLatLng={mapCenter}
              selectedCoords={fullscreenCoords}
              onSelect={handleLocationSelect}
            />
          </div>
        </div>
      )}

      {/* Expandable Map */}
      {isExpanded && (
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Map Toolbar */}
          <div className="bg-surface-secondary px-3 py-2 border-b border-border flex items-center justify-between">
            <span className="text-xs text-text-secondary flex items-center gap-1.5">
              <MapPinIcon size={14} weight="bold" /> Klik pada peta untuk
              memilih lokasi
            </span>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="text-xs bg-accent/10 text-accent px-2 py-1 rounded hover:bg-accent/20 transition font-medium flex items-center gap-1"
            >
              <MapPinIcon size={12} weight="bold" /> Lokasi Saya
            </button>
          </div>

          {/* Map Container */}
          <div className="h-96 relative map-cursor-crosshair">
            <MapLibreCoordinateCanvas
              centerLatLng={mapCenter}
              selectedCoords={inlineCoords}
              onSelect={handleLocationSelect}
            />
          </div>

          {/* Instructions */}
          <div className="bg-surface-secondary px-3 py-2 border-t border-border">
            <p className="text-xs text-text-tertiary text-center flex items-center justify-center gap-1.5">
              <LightbulbIcon size={14} weight="bold" /> Geser peta dan klik
              untuk menentukan titik koordinat yang tepat
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
