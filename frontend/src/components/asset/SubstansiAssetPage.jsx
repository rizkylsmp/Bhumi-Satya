import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AssetSearch from "./AssetSearch";
import Pagination from "./Pagination";
import { asetService } from "../../services/api";
import useColumnResize from "../../hooks/useColumnResize";
import {
  ArrowsClockwiseIcon,
  ArrowRightIcon,
  PackageIcon,
  CaretUpIcon,
  CaretDownIcon,
  CaretUpDownIcon,
  CheckCircleIcon,
  WarningIcon,
  LightningIcon,
  MinusCircleIcon,
  ShieldCheckIcon,
  GavelIcon,
  HourglassHighIcon,
  ProhibitIcon,
  MapPinIcon,
} from "@phosphor-icons/react";
import { formatCurrency, formatNumber } from "../../utils/format";

// ==================== STATUS CONFIGS ====================

const getStatusConfig = (status) => {
  const statusLower = status?.toLowerCase();
  const configs = {
    aktif: {
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-500/30",
      icon: CheckCircleIcon,
      dot: "bg-emerald-500",
    },
    bermasalah: {
      bg: "bg-red-50 dark:bg-red-500/10",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-200 dark:border-red-500/30",
      icon: WarningIcon,
      dot: "bg-red-500",
    },
    "indikasi bermasalah": {
      bg: "bg-amber-50 dark:bg-amber-500/10",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-500/30",
      icon: LightningIcon,
      dot: "bg-amber-500",
    },
    diblokir: {
      bg: "bg-red-50 dark:bg-red-500/10",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-200 dark:border-red-500/30",
      icon: MinusCircleIcon,
      dot: "bg-red-500",
    },
  };
  return (
    configs[statusLower] || {
      bg: "bg-gray-50 dark:bg-gray-500/10",
      text: "text-gray-600 dark:text-gray-400",
      border: "border-gray-200 dark:border-gray-500/30",
      icon: MinusCircleIcon,
      dot: "bg-gray-500",
    }
  );
};

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

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const resolveMinWidth = (value) => {
  if (!value) return undefined;
  return /^\d+(\.\d+)?$/.test(value) ? `${Number(value) * 4}px` : value;
};

// ==================== CELL RENDERER ====================

const renderCell = (value, column, asset) => {
  if (column.render) return column.render(value, asset);

  switch (column.type) {
    case "status": {
      if (!value)
        return <span className="text-text-muted text-xs italic">-</span>;
      const sc = getStatusConfig(value);
      const SIcon = sc.icon;
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${sc.bg} ${sc.text} ${sc.border}`}
        >
          <SIcon size={14} weight="fill" />
          {value}
        </span>
      );
    }
    case "status_hukum": {
      if (!value)
        return (
          <span className="text-text-muted text-xs italic">Tidak ada</span>
        );
      const shc = getStatusHukumConfig(value);
      const SHIcon = shc.icon;
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${shc.bg} ${shc.text} ${shc.border}`}
        >
          {SHIcon && <SHIcon size={14} weight="fill" />}
          {value}
        </span>
      );
    }
    case "currency":
      return (
        <span className="text-sm font-semibold text-text-primary">
          {formatCurrency(value)}
        </span>
      );
    case "area":
      return (
        <div className="flex items-center justify-end gap-1.5">
          <span className="text-sm font-semibold text-text-primary">
            {formatNumber(parseFloat(value || 0))}
          </span>
          <span className="text-xs text-text-muted">m²</span>
        </div>
      );
    case "date":
      return (
        <span className="text-sm text-text-secondary">{formatDate(value)}</span>
      );
    case "location":
      return (
        <div className="flex items-start gap-2">
          <MapPinIcon size={14} className="text-text-muted shrink-0 mt-0.5" />
          <span
            className="text-sm text-text-secondary line-clamp-2"
            title={value}
          >
            {value || "-"}
          </span>
        </div>
      );
    case "coordinate":
      return (
        <span className="text-sm font-mono text-text-secondary">
          {value || "-"}
        </span>
      );
    case "badge":
      if (!value) return <span className="text-text-muted text-xs">-</span>;
      return (
        <span className="inline-flex items-center px-2.5 py-1 bg-surface-secondary rounded-lg text-xs font-medium text-text-primary">
          {value}
        </span>
      );
    default:
      return (
        <span className="text-sm text-text-secondary">{value || "-"}</span>
      );
  }
};

// ==================== SORT ICON ====================

const SortIcon = ({ column, sortBy, sortOrder }) => {
  if (sortBy !== column)
    return (
      <CaretUpDownIcon
        size={14}
        className="text-text-muted ml-1 inline opacity-50"
      />
    );
  return sortOrder === "asc" ? (
    <CaretUpIcon size={14} weight="bold" className="text-accent ml-1 inline" />
  ) : (
    <CaretDownIcon
      size={14}
      weight="bold"
      className="text-accent ml-1 inline"
    />
  );
};

// ==================== MAIN COMPONENT ====================

export default function SubstansiAssetPage({
  title,
  subtitle,
  icon: Icon,
  iconColor = "from-blue-500 to-blue-600",
  columns = [],
  substansi = null,
  filterPreset = "pusatData",
  renderRowActions = null,
}) {
  const navigate = useNavigate();
  const actionColumnClass = renderRowActions
    ? "w-60 min-w-60"
    : "w-36 min-w-36";

  // Data state
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});

  // Sort state
  const [sortBy, setSortBy] = useState("kode_aset");
  const [sortOrder, setSortOrder] = useState("asc");
  const [hoveredRow, setHoveredRow] = useState(null);
  const { columnWidths, onResizeStart } = useColumnResize();

  // ==================== DATA FETCHING ====================

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...filters,
      };
      const response = await asetService.getAll(params);
      const { data, pagination } = response.data;
      setAssets(data || []);
      setTotalPages(pagination?.totalPages || 1);
      setTotalItems(
        pagination?.totalItems ??
          pagination?.total ??
          pagination?.totalData ??
          0,
      );
    } catch (error) {
      console.error("Error fetching assets:", error);
      toast.error("Gagal memuat data bangunan");
      setAssets((current) => (current.length ? current : []));
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filters, itemsPerPage]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    asetService
      .getFilterOptions()
      .then((response) => setFilterOptions(response.data?.data || {}))
      .catch(() => setFilterOptions({}));
  }, []);

  // ==================== HANDLERS ====================

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleManageAsset = (assetId) => {
    const query = substansi
      ? `?bagian=${encodeURIComponent(substansi)}`
      : "";
    navigate(`/aset/${assetId}/kelola${query}`);
  };

  // ==================== SORTED DATA ====================

  const sortedAssets = [...assets].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    const col = columns.find((c) => c.key === sortBy);
    if (col?.type === "area" || col?.type === "currency") {
      aVal = parseFloat(aVal) || 0;
      bVal = parseFloat(bVal) || 0;
    }
    if (sortOrder === "asc") return aVal > bVal ? 1 : -1;
    return aVal < bVal ? 1 : -1;
  });

  // ==================== TABLE HEADER ====================

  const TableHeader = ({
    children,
    sortable,
    column,
    className = "",
    colKey,
    minWidth,
  }) => {
    const key = colKey || column || children?.toString();
    return (
      <th
        className={`relative px-4 py-4 text-left text-[11px] font-semibold text-text-muted uppercase tracking-wider ${
          sortable
            ? "cursor-pointer select-none hover:text-text-secondary transition-colors"
            : ""
        } ${className}`}
        style={{
          minWidth: resolveMinWidth(minWidth),
          ...(columnWidths[key] ? { width: columnWidths[key] } : {}),
        }}
        onClick={sortable ? () => handleSort(column) : undefined}
      >
        <span className="flex items-center gap-1">
          {children}
          {sortable && (
            <SortIcon column={column} sortBy={sortBy} sortOrder={sortOrder} />
          )}
        </span>
        <div
          onMouseDown={onResizeStart(key)}
          className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-accent/20 transition-colors z-10"
        />
      </th>
    );
  };

  // ==================== LOADING SKELETON ====================

  const LoadingSkeleton = () => (
    <div className="overflow-hidden">
      <div className="bg-linear-to-r from-surface-secondary to-surface border-b border-border px-4 py-4">
        <div className="flex gap-4">
          {[40, 80, 120, 100, 80, 100, 80, 80].map((w, i) => (
            <div
              key={i}
              className="h-4 bg-surface-tertiary rounded animate-pulse"
              style={{ width: w }}
            />
          ))}
        </div>
      </div>
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
            {columns.map((_, ci) => (
              <div key={ci} className="w-20 h-4 bg-surface-tertiary rounded" />
            ))}
            <div className="w-24 h-8 bg-surface-tertiary rounded-lg ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );

  // ==================== EMPTY STATE ====================

  const EmptyState = () => (
    <div className="text-center py-16 px-4">
      <div className="w-20 h-20 bg-surface-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
        <PackageIcon size={40} weight="duotone" className="text-text-muted" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        Tidak ada data bangunan
      </h3>
      <p className="text-text-muted text-sm max-w-sm mx-auto">
        Belum ada aset yang terdaftar atau tidak ditemukan hasil yang sesuai
        dengan filter pencarian Anda.
      </p>
    </div>
  );

  // ==================== RENDER ====================

  return (
    <div className="p-4 lg:p-6 space-y-5 min-h-screen">
      {/* Page Header */}
      <div className="admin-page-header">
        <div className="admin-page-header__identity">
          <div
            className={`admin-page-header__icon bg-linear-to-br ${iconColor}`}
          >
            <Icon size={21} weight="fill" className="text-surface" />
          </div>
          <div className="min-w-0">
            <h1 className="admin-page-header__title">
              {title}
            </h1>
            <p className="admin-page-header__description">{subtitle}</p>
          </div>
        </div>

        <div className="admin-page-header__actions">
          <button
            onClick={fetchAssets}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs font-bold text-text-secondary transition hover:border-accent hover:text-accent disabled:opacity-50"
          >
            <ArrowsClockwiseIcon
              size={15}
              weight="bold"
              className={loading ? "animate-spin" : ""}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <AssetSearch
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          filterOptions={filterOptions}
          filterPreset={filterPreset}
          embedded
        />

        {/* Table Info Header */}
        <div className="px-4 lg:px-6 py-4 border-b border-border flex items-center justify-between bg-surface-secondary/50">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-text-primary">
              {title}
            </span>
            <span className="px-2.5 py-0.5 bg-accent/10 text-accent text-xs font-semibold rounded-full">
              {totalItems} data
            </span>
          </div>
          <div className="text-xs text-text-muted">
            Halaman {currentPage} dari {totalPages}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <LoadingSkeleton />
        ) : assets.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table
                className="admin-data-table"
                style={{ minWidth: `${480 + columns.length * 160}px` }}
              >
                <thead>
                  <tr className="bg-linear-to-r from-surface-secondary to-surface border-b border-border">
                    <TableHeader className="w-14">No</TableHeader>
                    <TableHeader
                      sortable
                      column="kode_aset"
                      className="min-w-48"
                    >
                      Kode Tanah
                    </TableHeader>
                    <TableHeader
                      sortable
                      column="nama_aset"
                      className="min-w-72"
                    >
                      Nama Tanah
                    </TableHeader>
                    {columns.map((col) => (
                      <TableHeader
                        key={col.key}
                        sortable={col.sortable}
                        column={col.key}
                        minWidth={col.minWidth}
                      >
                        {col.label}
                      </TableHeader>
                    ))}
                    <TableHeader
                      className={`sticky right-0 z-30 border-l border-border bg-surface-secondary text-center [&>span]:justify-center ${actionColumnClass}`}
                    >
                      Aksi
                    </TableHeader>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {sortedAssets.map((asset, idx) => {
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
                            {(currentPage - 1) * 10 + idx + 1}
                          </span>
                        </td>

                        {/* Kode Tanah */}
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-2 px-2.5 py-1 bg-surface-secondary rounded-lg text-sm font-mono font-semibold text-text-primary">
                            {asset.kode_aset}
                          </span>
                        </td>

                        {/* Nama Tanah */}
                        <td className="px-4 py-4">
                          <span className="text-sm font-medium text-text-primary wrap-break-word max-w-80">
                            {asset.nama_aset}
                          </span>
                        </td>

                        {/* Dynamic Columns */}
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className={`px-4 py-4 ${col.align === "right" ? "text-right" : ""} ${col.align === "center" ? "text-center" : ""}`}
                          >
                            {renderCell(asset[col.key], col, asset)}
                          </td>
                        ))}

                        {/* Actions */}
                        <td
                          className={`sticky right-0 z-20 border-l border-border px-3 py-4 transition-colors ${actionColumnClass} ${
                            isHovered
                              ? "bg-accent/5 dark:bg-accent/10"
                              : "bg-surface"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            {renderRowActions?.(asset)}
                            <button
                              type="button"
                              onClick={() => handleManageAsset(asset.id_aset)}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-[9px] font-black text-surface transition hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent"
                              aria-label={`Kelola ${title.toLowerCase()} ${asset.nama_aset}`}
                            >
                              <span>Kelola</span>
                              <ArrowRightIcon size={12} weight="bold" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-border">
              {sortedAssets.map((asset, idx) => {
                const rowNumber = (currentPage - 1) * 10 + idx + 1;
                return (
                  <div key={asset.id_aset} className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-surface">
                            {rowNumber}
                          </span>
                          <span className="text-xs font-mono font-semibold text-text-muted bg-surface-secondary px-2 py-0.5 rounded">
                            {asset.kode_aset}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-text-primary line-clamp-1">
                          {asset.nama_aset}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {renderRowActions?.(asset)}
                        <button
                          type="button"
                          onClick={() => handleManageAsset(asset.id_aset)}
                          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 text-[9px] font-black text-surface transition hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent"
                          aria-label={`Kelola ${title.toLowerCase()} ${asset.nama_aset}`}
                        >
                          <span>Kelola</span>
                          <ArrowRightIcon size={12} weight="bold" />
                        </button>
                      </div>
                    </div>

                    {/* Substansi Fields - show first 4 columns */}
                    <div className="grid grid-cols-2 gap-2">
                      {columns.slice(0, 4).map((col) => (
                        <div key={col.key} className="min-w-0">
                          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-0.5">
                            {col.label}
                          </p>
                          <div className="text-xs text-text-secondary truncate">
                            {renderCell(asset[col.key], col, asset)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
            pageSizeOptions={[10, 20, 50]}
            embedded
            itemLabel="aset"
          />
        )}
      </div>

    </div>
  );
}
