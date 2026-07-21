import { useEffect, useRef, useCallback } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

/**
 * Canvas-based marker number renderer for performance
 * Renders numbers directly on map overlay pane instead of DOM elements
 * Syncs with map pan/zoom events
 * @param {Object} props
 * @param {Array} props.markers - Array of markers with position and number
 * @param {boolean} props.visible - Whether to show numbers
 */
export function MarkerNumberCanvas({ markers = [], visible = true }) {
  const map = useMap();
  const canvasRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const size = map.getSize();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = size.x * ratio;
    canvas.height = size.y * ratio;
    canvas.style.width = `${size.x}px`;
    canvas.style.height = `${size.y}px`;

    const topLeft = map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(canvas, topLeft);

    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, size.x, size.y);

    if (!visible) return;

    const zoom = map.getZoom();
    const fontSize = zoom >= 17 ? 9 : 8;
    ctx.font = `800 ${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "rgba(15, 23, 42, 0.62)";
    ctx.lineWidth = 2.4;

    markers.forEach(({ position, number }) => {
      const point = map.latLngToLayerPoint(position).subtract(topLeft);
      if (
        point.x < -16 ||
        point.y < -16 ||
        point.x > size.x + 16 ||
        point.y > size.y + 16
      ) {
        return;
      }

      const label = String(number);
      ctx.strokeText(label, point.x, point.y + 0.2);
      ctx.fillText(label, point.x, point.y + 0.2);
    });
  }, [map, markers, visible]);

  useEffect(() => {
    const canvas = L.DomUtil.create(
      "canvas",
      "bhumi-satya-marker-number-canvas",
    );
    canvas.style.position = "absolute";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "420";
    canvasRef.current = canvas;
    map.getPanes().overlayPane.appendChild(canvas);

    draw();
    map.on("move zoom resize zoomend moveend", draw);

    return () => {
      map.off("move zoom resize zoomend moveend", draw);
      canvas.remove();
      canvasRef.current = null;
    };
  }, [draw, map]);

  useEffect(() => {
    draw();
  }, [draw]);

  return null;
}
