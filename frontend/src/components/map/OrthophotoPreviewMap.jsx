import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { DEFAULT_MAP_CENTER } from "./mapDefaults";

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export default function OrthophotoPreviewMap({ orthophoto }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: DEFAULT_MAP_CENTER,
      zoom: 12,
      attributionControl: true,
    });
    mapRef.current = map;
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !orthophoto) return undefined;
    const sourceId = "orthophoto-preview-source";
    const layerId = "orthophoto-preview-layer";
    const apply = () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      const bounds = orthophoto.bounds;
      if (!orthophoto.preview_public_url || !bounds) return;
      map.addSource(sourceId, {
        type: "image",
        url: orthophoto.preview_public_url,
        coordinates: [
          [bounds.west, bounds.north],
          [bounds.east, bounds.north],
          [bounds.east, bounds.south],
          [bounds.west, bounds.south],
        ],
      });
      map.addLayer({
        id: layerId,
        type: "raster",
        source: sourceId,
        paint: { "raster-opacity": orthophoto.opacity ?? 1 },
      });
      map.fitBounds(
        [[bounds.west, bounds.south], [bounds.east, bounds.north]],
        { padding: 36, duration: 450, maxZoom: 19 },
      );
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
    return () => {
      if (!map.isStyleLoaded()) return;
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [orthophoto]);

  return <div ref={containerRef} className="h-full w-full" />;
}
