import { useCallback, useEffect, useRef, useState } from "react";
import AssetPopupCard from "./AssetPopupCard";
import { buildPopupConnectorGeometry } from "../../../utils/popupConnector";

export default function AssetDetailPanel({
  asset,
  onClose,
  onViewDetail,
  showModel3d = false,
  visibleSectionIds = null,
}) {
  const panelRef = useRef(null);
  const connectorRef = useRef(null);
  const connectorShadowRef = useRef(null);
  const connectorPathRef = useRef(null);
  const connectorDotRef = useRef(null);
  const connectorDotCoreRef = useRef(null);
  const anchorRef = useRef(null);
  const dragRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const anchor = asset?.popup_anchor;
  const showConnector = asset?.popup_context === "3d";
  const assetIdentity = String(asset?.id_aset || asset?.id || "");
  const updateConnector = useCallback(() => {
    const panel = panelRef.current;
    const svg = connectorRef.current;
    const shadow = connectorShadowRef.current;
    const path = connectorPathRef.current;
    const dot = connectorDotRef.current;
    const dotCore = connectorDotCoreRef.current;
    const boundary = panel?.offsetParent;
    if (!showConnector || !panel || !svg || !shadow || !path || !dot || !dotCore || !boundary) return;

    const geometry = buildPopupConnectorGeometry(
      panel.getBoundingClientRect(),
      boundary.getBoundingClientRect(),
      anchorRef.current,
    );
    if (!geometry) return;

    svg.setAttribute("viewBox", `0 0 ${geometry.width} ${geometry.height}`);
    shadow.setAttribute("d", geometry.path);
    path.setAttribute("d", geometry.path);
    dot.setAttribute("cx", geometry.anchorX);
    dot.setAttribute("cy", geometry.anchorY);
    dotCore.setAttribute("cx", geometry.anchorX);
    dotCore.setAttribute("cy", geometry.anchorY);
  }, [showConnector]);

  useEffect(() => {
    anchorRef.current = anchor;
    const frame = window.requestAnimationFrame(updateConnector);
    return () => window.cancelAnimationFrame(frame);
  }, [anchor, updateConnector]);

  useEffect(() => {
    if (!showConnector) return undefined;
    const frame = window.requestAnimationFrame(updateConnector);
    const observer = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(updateConnector);
    if (panelRef.current) observer?.observe(panelRef.current);
    window.addEventListener("resize", updateConnector);

    const handleAnchorUpdate = (event) => {
      if (String(event.detail?.assetId || "") !== assetIdentity) return;
      anchorRef.current = { x: event.detail.x, y: event.detail.y };
      updateConnector();
    };
    window.addEventListener("bhumi:popup-anchor-update", handleAnchorUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", updateConnector);
      window.removeEventListener("bhumi:popup-anchor-update", handleAnchorUpdate);
    };
  }, [assetIdentity, showConnector, updateConnector]);

  if (!asset) return null;

  const stopDragging = (event) => {
    if (!dragRef.current) return;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setIsDragging(false);
  };

  const handleDragStart = (event) => {
    if (
      event.button !== 0 ||
      event.target.closest("button, a, input, select, textarea")
    ) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offset: offsetRef.current,
    };
    setIsDragging(true);
  };

  const handleDragMove = (event) => {
    const drag = dragRef.current;
    const panel = panelRef.current;
    const boundary = panel?.offsetParent;
    if (!drag || drag.pointerId !== event.pointerId || !panel || !boundary) {
      return;
    }

    event.preventDefault();
    const current = offsetRef.current;
    const panelRect = panel.getBoundingClientRect();
    const boundaryRect = boundary.getBoundingClientRect();
    const baseLeft = panelRect.left - current.x;
    const baseTop = panelRect.top - current.y;
    const margin = 8;
    const requestedX = drag.offset.x + event.clientX - drag.startX;
    const requestedY = drag.offset.y + event.clientY - drag.startY;
    const nextOffset = {
      x: Math.min(
        boundaryRect.right - margin - baseLeft - panelRect.width,
        Math.max(boundaryRect.left + margin - baseLeft, requestedX),
      ),
      y: Math.min(
        boundaryRect.bottom - margin - baseTop - panelRect.height,
        Math.max(boundaryRect.top + margin - baseTop, requestedY),
      ),
    };

    offsetRef.current = nextOffset;
    setOffset(nextOffset);
    window.requestAnimationFrame(updateConnector);
  };

  return (
    <>
      {showConnector && (
        <svg
          ref={connectorRef}
          className="pointer-events-none absolute inset-0 z-[19] h-full w-full overflow-visible"
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="bhumi-popup-connector-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path ref={connectorShadowRef} fill="none" stroke="rgba(15,23,42,0.46)" strokeWidth="4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <path ref={connectorPathRef} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" filter="url(#bhumi-popup-connector-glow)" />
          <circle ref={connectorDotRef} r="5.5" fill="rgba(56,189,248,0.22)" stroke="#38bdf8" strokeWidth="1.5" vectorEffect="non-scaling-stroke" filter="url(#bhumi-popup-connector-glow)" />
          <circle ref={connectorDotCoreRef} r="2" fill="white" />
        </svg>
      )}
      <aside
        ref={panelRef}
        aria-label={`Detail ${asset.nama_aset || asset.nama || "aset"}`}
        className="absolute left-3 right-3 top-20 z-20 max-h-[calc(100vh-7rem)] overflow-hidden overflow-y-auto rounded-2xl border border-border bg-surface/97 shadow-2xl backdrop-blur-md sm:left-auto sm:right-5 sm:w-80"
        style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}
      >
        <AssetPopupCard
          asset={asset}
          onClose={onClose}
          onViewDetail={onViewDetail}
          showModel3d={showModel3d}
          visibleSectionIds={visibleSectionIds}
          isDragging={isDragging}
          headerProps={{
            title: "Tahan dan geser untuk memindahkan popup",
            onPointerDown: handleDragStart,
            onPointerMove: handleDragMove,
            onPointerUp: stopDragging,
            onPointerCancel: stopDragging,
            onLostPointerCapture: stopDragging,
            className: "sticky top-0 z-10 touch-none select-none",
          }}
        />
      </aside>
    </>
  );
}
