import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useEffect, useRef } from "react";
import {
  MapPinIcon,
  MapTrifoldIcon,
  PlusIcon,
  MinusIcon,
  ArrowsOutSimpleIcon,
  CrosshairIcon,
  HouseIcon,
  PolygonIcon,
} from "@phosphor-icons/react";
import { kecamatanData } from "./kecamatanData";

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom icon colors based on status - consistent across app
const getMarkerIcon = (status) => {
  const colors = {
    aktif: "#10b981", // emerald-500
    bermasalah: "#eab308", // yellow-500
    diblokir: "#ef4444", // red-500
    indikasi_bermasalah: "#3b82f6", // blue-500
    "indikasi bermasalah": "#3b82f6",
  };

  const color = colors[status?.toLowerCase()] || "#6b7280";

  return L.divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, ${color} 0%, ${color}cc 100%);
        border: 2px solid var(--color-surface);
        border-radius: 50%;
        width: 14px;
        height: 14px;
        box-shadow: 0 2px 6px ${color}50, 0 1px 2px rgba(0,0,0,0.2);
      "></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 14],
    className: "custom-marker",
  });
};

// Zoom Controls Component (must be inside MapContainer)
function ZoomControls({ defaultCenter, defaultZoom }) {
  const map = useMap();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  // Sync state when user exits fullscreen via Escape key
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const handleFullscreen = () => {
    // Target the parent wrapper so all overlays (legend, filters, panels) stay visible
    const container = document.getElementById("map-fullscreen-container");
    if (!document.fullscreenElement) {
      container?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.flyTo([latitude, longitude], 15, { duration: 1.5 });
        },
        () => {
          // If geolocation fails, go back to default center
          map.flyTo(defaultCenter, defaultZoom, { duration: 1 });
        },
      );
    } else {
      // Fallback to default center
      map.flyTo(defaultCenter, defaultZoom, { duration: 1 });
    }
  };

  const handleResetView = () => {
    map.flyTo(defaultCenter, defaultZoom, { duration: 1 });
  };

  return (
    <div className="absolute bottom-4 right-4 bg-surface/95 backdrop-blur-sm rounded-xl border border-border shadow-xl overflow-hidden z-1000">
      <button
        onClick={handleZoomIn}
        title="Perbesar"
        className="w-11 h-11 flex items-center justify-center hover:bg-surface-secondary text-text-secondary hover:text-accent transition-colors border-b border-border"
      >
        <PlusIcon size={20} weight="bold" />
      </button>
      <button
        onClick={handleZoomOut}
        title="Perkecil"
        className="w-11 h-11 flex items-center justify-center hover:bg-surface-secondary text-text-secondary hover:text-accent transition-colors border-b border-border"
      >
        <MinusIcon size={20} weight="bold" />
      </button>
      <button
        onClick={handleFullscreen}
        title={isFullscreen ? "Keluar Fullscreen" : "Fullscreen"}
        className="w-11 h-11 flex items-center justify-center hover:bg-surface-secondary text-text-secondary hover:text-accent transition-colors border-b border-border"
      >
        <ArrowsOutSimpleIcon size={18} weight="bold" />
      </button>
      <button
        onClick={handleLocate}
        title="Lokasi Saya"
        className="w-11 h-11 flex items-center justify-center hover:bg-surface-secondary text-text-secondary hover:text-accent transition-colors border-b border-border"
      >
        <CrosshairIcon size={18} weight="bold" />
      </button>
      <button
        onClick={handleResetView}
        title="Reset View"
        className="w-11 h-11 flex items-center justify-center hover:bg-surface-secondary text-text-secondary hover:text-accent transition-colors"
      >
        <HouseIcon size={18} weight="bold" />
      </button>
    </div>
  );
}

// Fly to a specific asset (used when navigating from Pusat Data)
function FlyToAsset({ assets, highlightAssetId }) {
  const map = useMap();
  const hasFlewRef = useRef(false);

  useEffect(() => {
    if (!highlightAssetId || hasFlewRef.current) return;
    const target = assets.find(
      (a) => String(a.id) === String(highlightAssetId),
    );
    if (target?.latitude && target?.longitude) {
      hasFlewRef.current = true;
      setTimeout(() => {
        map.flyTo([target.latitude, target.longitude], 17, { duration: 1.5 });
      }, 500);
    }
  }, [highlightAssetId, assets, map]);

  return null;
}

export default function MapContainer_({
  assets,
  onMarkerClick,
  showMarkers = true,
  showPolygons = true,
  highlightAssetId = null,
  showKecamatanLayer = false,
  showKelurahanLayer = false,
  showZoomControls = false,
  showMapTitle = true,
}) {
  const defaultCenter = [-7.6469, 112.9075]; // Kota Pasuruan, Jawa Timur
  const defaultZoom = 13;

  return (
    <div className="absolute inset-0">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: "100%", width: "100%" }}
        className="map-container"
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* Kecamatan Boundaries */}
        {showKecamatanLayer &&
          kecamatanData.map((kec) => (
            <Polygon
              key={`kec-${kec.id}`}
              positions={kec.boundary}
              pathOptions={{
                color: kec.color,
                fillColor: kec.color,
                fillOpacity: 0.08,
                weight: 3,
                dashArray: "8, 4",
              }}
            >
              <Tooltip sticky>
                <div className="text-xs">
                  <span className="font-bold">Kec. {kec.nama}</span>
                  <br />
                  <span className="text-text-muted">
                    {kec.kelurahan.length} kelurahan
                  </span>
                </div>
              </Tooltip>
            </Polygon>
          ))}

        {/* Kelurahan Boundaries */}
        {showKelurahanLayer &&
          kecamatanData.flatMap((kec) =>
            kec.kelurahan.map((kel) => (
              <Polygon
                key={`kel-${kel.id}`}
                positions={kel.boundary}
                pathOptions={{
                  color: kec.color,
                  fillColor: kec.color,
                  fillOpacity: 0.12,
                  weight: 1.5,
                  dashArray: "4, 3",
                }}
              >
                <Tooltip sticky>
                  <div className="text-xs">
                    <span className="font-semibold">Kel. {kel.nama}</span>
                    <br />
                    <span className="text-text-muted">Kec. {kec.nama}</span>
                  </div>
                </Tooltip>
              </Polygon>
            )),
          )}

        {/* Polygons */}
        {showPolygons &&
          assets
            .filter(
              (asset) =>
                asset.polygon &&
                Array.isArray(asset.polygon) &&
                asset.polygon.length >= 3,
            )
            .map((asset) => {
              const polygonColors = {
                aktif: { color: "#10b981", fillColor: "#10b981" },
                bermasalah: { color: "#eab308", fillColor: "#eab308" },
                diblokir: { color: "#ef4444", fillColor: "#ef4444" },
                indikasi_bermasalah: { color: "#3b82f6", fillColor: "#3b82f6" },
              };
              const statusKey = asset.status
                ?.toLowerCase()
                .replace(/\s+/g, "_");
              const colors = polygonColors[statusKey] || {
                color: "#6b7280",
                fillColor: "#6b7280",
              };
              // polygon_bidang stored as array of [lat, lng]
              const positions = asset.polygon.map((p) =>
                Array.isArray(p) ? p : [p.lat, p.lng],
              );
              return (
                <Polygon
                  key={`poly-${asset.id}`}
                  positions={positions}
                  pathOptions={{
                    color: colors.color,
                    fillColor: colors.fillColor,
                    fillOpacity: 0.25,
                    weight: 2,
                  }}
                  eventHandlers={{
                    click: () => onMarkerClick(asset),
                  }}
                >
                  <Tooltip sticky>
                    <span className="text-xs font-semibold">
                      {asset.nama_aset}
                    </span>
                  </Tooltip>
                </Polygon>
              );
            })}

        {/* Markers */}
        {showMarkers &&
          assets.map((asset) => (
            <Marker
              key={asset.id}
              position={[asset.latitude, asset.longitude]}
              icon={getMarkerIcon(asset.status)}
              eventHandlers={{
                click: () => onMarkerClick(asset),
              }}
            >
              <Tooltip>
                <span className="text-xs font-semibold">{asset.nama_aset}</span>
              </Tooltip>
            </Marker>
          ))}

        {/* Custom zoom controls intentionally disabled */}

        {/* Fly to highlighted asset */}
        {highlightAssetId && (
          <FlyToAsset assets={assets} highlightAssetId={highlightAssetId} />
        )}
      </MapContainer>

      {/* Map Title - Hidden on mobile */}
      {showMapTitle && (
        <div className="hidden sm:block absolute top-4 left-1/2 transform -translate-x-1/2 bg-surface/95 backdrop-blur-sm rounded-xl border border-border px-5 py-3 shadow-xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center">
              <MapTrifoldIcon size={20} weight="fill" className="text-accent" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-text-primary">
                Peta Interaktif Aset
              </h1>
              <p className="text-[10px] text-text-muted">
                Kota Pasuruan, Jawa Timur
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
