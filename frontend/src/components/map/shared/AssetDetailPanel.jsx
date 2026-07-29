import { useRef, useState } from "react";
import AssetPopupCard from "./AssetPopupCard";

export default function AssetDetailPanel({ asset, onClose, onViewDetail }) {
  const panelRef = useRef(null);
  const dragRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

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
  };

  return (
    <aside
      ref={panelRef}
      aria-label={`Detail ${asset.nama_aset || asset.nama || "aset"}`}
      className="absolute left-3 right-3 top-4 z-20 max-h-[calc(100vh-6rem)] overflow-hidden overflow-y-auto rounded-2xl border border-border bg-surface/97 shadow-2xl backdrop-blur-md sm:left-[calc(50%_-_6rem)] sm:right-auto sm:w-80"
      style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}
    >
      <AssetPopupCard
        asset={asset}
        onClose={onClose}
        onViewDetail={onViewDetail}
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
  );
}
