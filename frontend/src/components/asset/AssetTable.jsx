import { useState } from "react";
import useColumnResize from "../../hooks/useColumnResize";
import ActionButtons from "./ActionButtons";
import {
  ShieldCheckIcon,
  GavelIcon,
  HourglassHighIcon,
  ProhibitIcon,
  CaretUpIcon,
  CaretDownIcon,
  CaretUpDownIcon,
  PackageIcon,
  MapPinIcon,
  CalendarIcon,
  BuildingsIcon,
} from "@phosphor-icons/react";

// Sort icon component - moved outside to prevent re-creation on every render
const SortIcon = ({ column, sortBy, sortOrder }) => {
  if (sortBy !== column)
    return (
      <CaretUpDownIcon
        size={14}
        className="text-text-muted ml-1 inline opacity-50"
      />
    );
  return sortOrder === "asc" ? (
    <CaretUpIcon
      size={14}
      weight="bold"
      className="text-accent ml-1 inline"
    />
  ) : (
    <CaretDownIcon
      size={14}
      weight="bold"
      className="text-accent ml-1 inline"
    />
  );
};

// Table header component - moved outside to prevent re-creation on every render
const TableHeader = ({
  children,
  sortable,
  column,
  className = "",
  colKey,
  columnWidths,
  onResizeStart,
  onSort,
  sortBy,
  sortOrder,
}) => {
  const key = colKey || column || children?.toString();
  return (
    <th
      className={`relative px-4 py-4 text-left text-[11px] font-semibold text-text-muted uppercase tracking-wider ${
        sortable
          ? "cursor-pointer select-none hover:text-text-secondary transition-colors"
          : ""
      } ${className}`}
      style={columnWidths[key] ? { width: columnWidths[key] } : undefined}
      onClick={sortable ? () => onSort(column) : undefined}
    >
      <span className="flex items-center gap-1">
        {children}
        {sortable && <SortIcon column={column} sortBy={sortBy} sortOrder={sortOrder} />}
      </span>
      <div
        onMouseDown={onResizeStart(key)}
        className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-accent/20 transition-colors z-10"
      />
    </th>
  );
};

// Status hukum config - moved outside to prevent re-creation on every render
const getStatusHukumConfig = (statusHukum) => {
  const configs = {
    Aman: {
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-500/30",
      icon: ShieldCheckIcon,
    },
    Sengketa: {
      bg: "bg-red-50 dark:bg-red-500/10",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-200 dark:border-red-500/30",
      icon: GavelIcon,
    },
    "Dalam Proses Sertipikasi": {
      bg: "bg-blue-50 dark:bg-blue-500/10",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-500/30",
      icon: HourglassHighIcon,
    },
    Diblokir: {
      bg: "bg-amber-50 dark:bg-amber-500/10",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-500/30",
      icon: ProhibitIcon,
    },
  };
  return (
    configs[statusHukum] || {
      bg: "bg-gray-50 dark:bg-gray-500/10",
      text: "text-gray-600 dark:text-gray-400",
      border: "border-gray-200 dark:border-gray-500/30",
      icon: null,
    }
  );
};

export default function AssetTable({
  assets = [],
  loading = false,
  onEditClick,
  onDeleteClick,
  onViewClick,
  currentPage = 1,
  itemsPerPage = 10,
  canUpdate = true,
  canDelete = true,
}) {
  const [sortBy, setSortBy] = useState("kode_aset");
  const [sortOrder, setSortOrder] = useState("asc");
  const [hoveredRow, setHoveredRow] = useState(null);
  const { columnWidths, onResizeStart } = useColumnResize();

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleEdit = (id) => {
    onEditClick?.(id);
  };

  const handleView = (assetId) => {
    onViewClick?.(assetId);
  };

  const handleDelete = (id) => {
    onDeleteClick?.(id);
  };

  const sortedAssets = [...assets].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    if (sortBy === "luas") {
      aVal = parseFloat(aVal) || 0;
      bVal = parseFloat(bVal) || 0;
    }
    if (sortOrder === "asc") {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  // Loading skeleton
  if (loading) {
    return (
      <div className="overflow-hidden">
        {/* Header skeleton */}
        <div className="bg-linear-to-r from-surface-secondary to-surface border-b border-border px-4 py-4">
          <div className="flex gap-4">
            {[40, 80, 120, 160, 80, 100, 80, 80, 100, 60, 80].map((w, i) => (
              <div
                key={i}
                className="h-4 bg-surface-tertiary rounded animate-pulse"
                style={{ width: w }}
              />
            ))}
          </div>
        </div>
        {/* Rows skeleton */}
        <div className="divide-y divide-border">
          {[...Array(5)].map((_, idx) => (
            <div
              key={idx}
              className="px-4 py-5 flex gap-4 items-center animate-pulse"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="w-8 h-4 bg-surface-tertiary rounded" />
              <div className="w-24 h-5 bg-surface-tertiary rounded" />
              <div className="w-32 h-4 bg-surface-tertiary rounded" />
              <div className="w-40 h-4 bg-surface-tertiary rounded" />
              <div className="w-20 h-6 bg-surface-tertiary rounded-full" />
              <div className="w-24 h-6 bg-surface-tertiary rounded-full" />
              <div className="w-20 h-4 bg-surface-tertiary rounded" />
              <div className="w-16 h-4 bg-surface-tertiary rounded" />
              <div className="w-28 h-4 bg-surface-tertiary rounded" />
              <div className="w-12 h-4 bg-surface-tertiary rounded" />
              <div className="w-24 h-8 bg-surface-tertiary rounded-lg ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (assets.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-20 h-20 bg-surface-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
          <PackageIcon size={40} weight="duotone" className="text-text-muted" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Tidak ada data aset
        </h3>
        <p className="text-text-muted text-sm max-w-sm mx-auto">
          Belum ada aset yang terdaftar atau tidak ditemukan hasil yang sesuai
          dengan filter pencarian Anda.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-300">
        <thead>
          <tr className="bg-linear-to-r from-surface-secondary to-surface border-b border-border">
            <TableHeader
              className="w-14"
              columnWidths={columnWidths}
              onResizeStart={onResizeStart}
            >
              No
            </TableHeader>
            <TableHeader
              sortable
              column="kode_aset"
              columnWidths={columnWidths}
              onResizeStart={onResizeStart}
              onSort={handleSort}
              sortBy={sortBy}
              sortOrder={sortOrder}
            >
              Kode Aset
            </TableHeader>
            <TableHeader
              sortable
              column="nama_aset"
              className="min-w-45"
              columnWidths={columnWidths}
              onResizeStart={onResizeStart}
              onSort={handleSort}
              sortBy={sortBy}
              sortOrder={sortOrder}
            >
              Nama Aset
            </TableHeader>
            <TableHeader
              className="min-w-50"
              columnWidths={columnWidths}
              onResizeStart={onResizeStart}
            >
              Lokasi
            </TableHeader>
            <TableHeader
              columnWidths={columnWidths}
              onResizeStart={onResizeStart}
            >
              Status Hukum
            </TableHeader>
            <TableHeader
              columnWidths={columnWidths}
              onResizeStart={onResizeStart}
            >
              Jenis Hak
            </TableHeader>
            <TableHeader
              sortable
              column="luas"
              className="text-right"
              columnWidths={columnWidths}
              onResizeStart={onResizeStart}
              onSort={handleSort}
              sortBy={sortBy}
              sortOrder={sortOrder}
            >
              Luas
            </TableHeader>
            <TableHeader
              className="min-w-35"
              columnWidths={columnWidths}
              onResizeStart={onResizeStart}
            >
              OPD Pengguna
            </TableHeader>
            <TableHeader
              sortable
              column="tahun_perolehan"
              className="text-center"
              columnWidths={columnWidths}
              onResizeStart={onResizeStart}
              onSort={handleSort}
              sortBy={sortBy}
              sortOrder={sortOrder}
            >
              Tahun
            </TableHeader>
            <TableHeader
              className="min-w-45 w-45 bg-surface-secondary text-center border-l border-border/50 shadow-[-6px_0_10px_-6px_rgba(0,0,0,0.12)]"
              columnWidths={columnWidths}
              onResizeStart={onResizeStart}
            >
              Aksi
            </TableHeader>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {sortedAssets.map((asset, idx) => {
            const statusHukumConfig = getStatusHukumConfig(asset.status_hukum);
            const StatusHukumIcon = statusHukumConfig.icon;
            const isHovered = hoveredRow === asset.id_aset;

            return (
              <tr
                key={asset.id_aset}
                className={`group transition-all duration-200 ${
                  isHovered
                    ? "bg-accent/5 dark:bg-accent/10"
                    : "hover:bg-surface-secondary/50"
                }`}
                onMouseEnter={() => setHoveredRow(asset.id_aset)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* No */}
                <td className="px-4 py-4">
                  <span className="text-sm text-text-muted font-medium">
                    {(currentPage - 1) * itemsPerPage + idx + 1}
                  </span>
                </td>

                {/* Kode Aset */}
                <td className="px-4 py-4">
                  <span className="inline-flex items-center gap-2 px-2.5 py-1 bg-surface-secondary rounded-lg text-sm font-mono font-semibold text-text-primary">
                    {asset.kode_aset}
                  </span>
                </td>

                {/* Nama Aset */}
                <td className="px-4 py-4">
                  <span className="text-sm font-medium text-text-primary wrap-break-word max-w-80">
                    {asset.nama_aset}
                  </span>
                </td>

                {/* Lokasi */}
                <td className="px-4 py-4">
                  <div className="flex items-start gap-2">
                    <MapPinIcon
                      size={14}
                      className="text-text-muted shrink-0 mt-0.5"
                    />
                    <span
                      className="text-sm text-text-secondary wrap-break-word max-w-64"
                      title={asset.lokasi}
                    >
                      {asset.lokasi || "-"}
                    </span>
                  </div>
                </td>

                {/* Status Hukum */}
                <td className="px-4 py-4">
                  {asset.status_hukum ? (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${statusHukumConfig.bg} ${statusHukumConfig.text} ${statusHukumConfig.border}`}
                    >
                      {StatusHukumIcon && (
                        <StatusHukumIcon size={14} weight="fill" />
                      )}
                      {asset.status_hukum}
                    </span>
                  ) : (
                    <span className="text-text-muted text-xs italic">
                      Tidak ada
                    </span>
                  )}
                </td>

                {/* Jenis Hak */}
                <td className="px-4 py-4">
                  <span className="text-sm text-text-secondary">
                    {asset.jenis_hak || "-"}
                  </span>
                </td>

                {/* Luas */}
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-sm font-semibold text-text-primary">
                      {parseFloat(asset.luas || 0).toLocaleString("id-ID")}
                    </span>
                    <span className="text-xs text-text-muted">m²</span>
                  </div>
                </td>

                {/* OPD Pengguna */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <BuildingsIcon
                      size={14}
                      className="text-text-muted shrink-0"
                    />
                    <span
                      className="text-sm text-text-secondary line-clamp-1"
                      title={asset.opd_pengguna}
                    >
                      {asset.opd_pengguna || "-"}
                    </span>
                  </div>
                </td>

                {/* Tahun */}
                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <CalendarIcon size={14} className="text-text-muted" />
                    <span className="text-sm text-text-secondary">
                      {asset.tahun_perolehan || "-"}
                    </span>
                  </div>
                </td>

                {/* Aksi */}
                <td
                  className={`min-w-[180px] w-[180px] border-l border-border/50 px-3 py-4 shadow-[-6px_0_10px_-6px_rgba(0,0,0,0.12)] transition-colors ${
                    isHovered
                      ? "bg-accent/5 dark:bg-accent/10"
                      : "bg-surface"
                  }`}
                >
                  <div
                    className={`transition-all duration-200 ${
                      isHovered ? "opacity-100" : "opacity-70"
                    }`}
                  >
                    <ActionButtons
                      assetId={asset.id_aset}
                      asset={asset}
                      onEdit={canUpdate ? handleEdit : null}
                      onView={() => handleView(asset.id_aset)}
                      onDelete={canDelete ? handleDelete : null}
                      showEdit={canUpdate}
                      showDelete={canDelete}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
