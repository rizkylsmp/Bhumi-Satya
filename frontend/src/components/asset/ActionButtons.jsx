import {
  EyeIcon,
  PencilSimpleIcon,
  TrashIcon,
  MapPinIcon,
  DownloadSimpleIcon,
} from "@phosphor-icons/react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export default function ActionButtons({
  onEdit,
  onView,
  onDelete,
  onShowOnMap,
  onDownloadPdf,
  onDownloadGeojson,
  assetId,
  asset,
  showEdit = true,
  showDelete = true,
  highlightEdit = false,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isInContainer = containerRef.current?.contains(event.target);
      const isInMenu = menuRef.current?.contains(event.target);
      if (!isInContainer && !isInMenu) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDownloadMenu = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPosition({
        top: rect.bottom + 6,
        left: Math.max(8, rect.right - 160),
      });
    }
    setShowMenu((value) => !value);
  };

  return (
    <div className="flex flex-nowrap gap-1 justify-center items-center">
      {/* View Button - Always visible */}
      <button
        onClick={() => onView?.()}
        className="group relative p-2 text-text-muted hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
        title="Lihat detail"
      >
        <EyeIcon size={18} weight="bold" />
      </button>

      {/* Show on Map Button */}
      {onShowOnMap && (
        <button
          onClick={onShowOnMap}
          className="group relative p-2 text-text-muted hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-all"
          title="Lihat di Peta"
        >
          <MapPinIcon size={18} weight="bold" />
        </button>
      )}

      {/* Download Button */}
      {(onDownloadPdf || onDownloadGeojson) && (
        <div className="relative" ref={containerRef}>
          <button
            ref={buttonRef}
            onClick={toggleDownloadMenu}
            className="group relative p-2 text-text-muted hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
            title="Unduh dokumen"
          >
            <DownloadSimpleIcon size={18} weight="bold" />
          </button>
          {showMenu &&
            createPortal(
              <div
                className="fixed z-[9999] w-40 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-2xl"
                style={{ top: menuPosition.top, left: menuPosition.left }}
                ref={menuRef}
              >
              {onDownloadPdf && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDownloadPdf(asset);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                >
                  <DownloadSimpleIcon size={14} weight="bold" />
                  Unduh PDF
                </button>
              )}
              {onDownloadGeojson && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDownloadGeojson(asset);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                >
                  <DownloadSimpleIcon size={14} weight="bold" />
                  Unduh GeoJSON
                </button>
              )}
              </div>,
              document.body,
            )}
        </div>
      )}

      {/* Edit Button */}
      {showEdit && onEdit && highlightEdit ? (
        <button
          onClick={() => onEdit(assetId)}
          className="group relative flex items-center gap-1.5 px-3 py-1.5 bg-accent text-surface rounded-lg text-xs font-semibold hover:opacity-90 shadow-sm shadow-accent/20 transition-all"
          title="Ubah Data"
        >
          <PencilSimpleIcon size={14} weight="bold" />
          <span>Ubah</span>
        </button>
      ) : showEdit && onEdit ? (
        <button
          onClick={() => onEdit(assetId)}
          className="group relative p-2 text-text-muted hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all"
          title="Edit"
        >
          <PencilSimpleIcon size={18} weight="bold" />
        </button>
      ) : null}

      {/* Delete Button */}
      {showDelete && onDelete && (
        <button
          onClick={() => onDelete(assetId)}
          className="group relative p-2 text-text-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
          title="Hapus"
        >
          <TrashIcon size={18} weight="bold" />
        </button>
      )}
    </div>
  );
}
