import { useState, useCallback, useRef } from "react";

/**
 * Hook for resizable table columns.
 * Returns columnWidths state and a handler to attach to header cells.
 *
 * Usage:
 *   const { columnWidths, onResizeStart } = useColumnResize();
 *   <th style={{ width: columnWidths[colKey] }}>
 *     ...
 *     <div onMouseDown={onResizeStart(colKey)} className="resize-handle" />
 *   </th>
 */
export default function useColumnResize() {
  const [columnWidths, setColumnWidths] = useState({});
  const resizing = useRef(null);

  const onResizeStart = useCallback(
    (colKey) => (e) => {
      e.preventDefault();
      e.stopPropagation();

      const th = e.target.closest("th");
      if (!th) return;

      const startX = e.clientX;
      const startWidth = th.offsetWidth;

      resizing.current = { colKey, startX, startWidth };

      const onMouseMove = (ev) => {
        if (!resizing.current) return;
        const diff = ev.clientX - resizing.current.startX;
        const newWidth = Math.max(60, resizing.current.startWidth + diff);
        setColumnWidths((prev) => ({ ...prev, [colKey]: newWidth }));
      };

      const onMouseUp = () => {
        resizing.current = null;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [],
  );

  return { columnWidths, onResizeStart };
}
