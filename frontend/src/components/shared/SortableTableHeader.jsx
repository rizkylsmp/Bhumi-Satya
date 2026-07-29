import { SortIcon } from "./SortIcon";

export default function SortableTableHeader({
  children,
  columnKey,
  sortKey,
  sortDirection,
  onSort,
  width,
  onResizeStart,
  onResizeBy,
  onResetWidth,
  sortable = true,
  resizable = true,
  className = "",
}) {
  const activeDirection = sortKey === columnKey ? sortDirection : null;
  const ariaSort = !sortable
    ? undefined
    : activeDirection === "asc"
      ? "ascending"
      : activeDirection === "desc"
        ? "descending"
        : "none";

  return (
    <th
      aria-sort={ariaSort}
      className={`relative px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted ${className}`}
      style={width ? { width, minWidth: width } : undefined}
    >
      {sortable ? (
        <button
          type="button"
          onClick={() => onSort(columnKey)}
          className="relative block w-full pr-5 text-left transition-colors hover:text-text-secondary active:scale-100 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="block min-w-0 truncate">{children}</span>
          <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2">
            <SortIcon direction={activeDirection} />
          </span>
        </button>
      ) : (
        children
      )}

      {resizable && (
        <span
          role="separator"
          aria-label={`Atur lebar kolom ${typeof children === "string" ? children : columnKey}`}
          aria-orientation="vertical"
          tabIndex={0}
          onMouseDown={onResizeStart(columnKey)}
          onDoubleClick={() => onResetWidth(columnKey)}
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
            event.preventDefault();
            onResizeBy(columnKey, event.key === "ArrowRight" ? 12 : -12, width);
          }}
          className="absolute right-0 top-0 z-10 h-full w-2 cursor-col-resize border-r border-transparent transition hover:border-accent hover:bg-accent/15 focus:border-accent focus:bg-accent/15 focus:outline-none"
          title="Tarik untuk mengubah lebar. Klik ganda untuk reset."
        />
      )}
    </th>
  );
}
