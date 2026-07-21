import {
  StackSimpleIcon,
  MapPinIcon,
  PolygonIcon,
  CaretUpIcon,
  CaretDownIcon,
  CheckSquareIcon,
  SquareIcon,
} from "@phosphor-icons/react";
import { useState } from "react";

export default function MapLegend({
  showMarkers = true,
  showPolygons = true,
  onToggleMarkers,
  onTogglePolygons,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const statuses = [
    { label: "Aktif", color: "#10b981" },
    { label: "Bermasalah", color: "#eab308" },
    { label: "Indikasi", color: "#3b82f6" },
    { label: "Diblokir", color: "#ef4444" },
  ];

  return (
    <div className="bg-surface/95 backdrop-blur-sm rounded-xl border border-border shadow-xl overflow-hidden transition-all w-44">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full border-b border-border bg-surface-secondary/80 px-3 py-2 flex items-center justify-between hover:bg-surface-secondary transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <StackSimpleIcon size={13} weight="fill" className="text-accent" />
          <span className="font-bold text-[11px] text-text-primary">Layer</span>
        </div>
        {isCollapsed ? (
          <CaretDownIcon size={12} className="text-text-muted" />
        ) : (
          <CaretUpIcon size={12} className="text-text-muted" />
        )}
      </button>

      {!isCollapsed && (
        <div className="p-2 space-y-1.5">
          {/* Toggle Buttons */}
          <div className="space-y-0.5">
            <button
              onClick={onToggleMarkers}
              className="w-full flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-surface-secondary transition-colors"
            >
              {showMarkers ? (
                <CheckSquareIcon
                  size={14}
                  weight="fill"
                  className="text-accent shrink-0"
                />
              ) : (
                <SquareIcon size={14} className="text-text-muted shrink-0" />
              )}
              <MapPinIcon
                size={12}
                weight="fill"
                className="text-accent shrink-0"
              />
              <span className="text-[11px] font-medium text-text-secondary">
                Marker
              </span>
            </button>
            <button
              onClick={onTogglePolygons}
              className="w-full flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-surface-secondary transition-colors"
            >
              {showPolygons ? (
                <CheckSquareIcon
                  size={14}
                  weight="fill"
                  className="text-accent shrink-0"
                />
              ) : (
                <SquareIcon size={14} className="text-text-muted shrink-0" />
              )}
              <PolygonIcon
                size={12}
                weight="fill"
                className="text-accent shrink-0"
              />
              <span className="text-[11px] font-medium text-text-secondary">
                Polygon
              </span>
            </button>
          </div>

          {/* Status Legend - Compact */}
          {(showMarkers || showPolygons) && (
            <div className="border-t border-border pt-1.5">
              <span className="text-[9px] font-semibold text-text-muted uppercase tracking-wider px-1.5">
                Status
              </span>
              <div className="mt-1 grid grid-cols-2 gap-x-1 gap-y-0.5">
                {statuses.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center gap-1.5 px-1.5 py-0.5"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-[10px] text-text-secondary truncate">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
