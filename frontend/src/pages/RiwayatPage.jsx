import { useState, useEffect, useCallback, Fragment } from "react";
import toast from "react-hot-toast";
import { riwayatService } from "../services/api";
import { formatNumber } from "../utils/format";
import {
  ArrowsClockwiseIcon,
  ChartBarIcon,
  LockKeyIcon,
  NotePencilIcon,
  PlusCircleIcon,
  MagnifyingGlassIcon,
  ClipboardTextIcon,
  CaretUpIcon,
  CaretDownIcon,
  FunnelSimpleIcon,
  ClockIcon,
  UserIcon,
  DatabaseIcon,
  EyeIcon,
  TrashIcon,
  SignInIcon,
  SignOutIcon,
  ArrowSquareOutIcon,
  XIcon,
  InfoIcon,
  ClockCounterClockwiseIcon,
  FileTextIcon,
} from "@phosphor-icons/react";
import Pagination from "../components/asset/Pagination";
import SortableTableHeader from "../components/shared/SortableTableHeader";
import useColumnResize from "../hooks/useColumnResize";
import useTableSort from "../hooks/useTableSort";

const HISTORY_COLUMN_WIDTHS = {
  no: 72,
  created_at: 180,
  user: 180,
  aksi: 130,
  tabel: 150,
  keterangan: 320,
  detail: 100,
};

const getHistorySortValue = (item, key) => {
  if (key === "created_at") return new Date(item.created_at).getTime();
  if (key === "user") return item.user?.username || item.user_id;
  return item?.[key];
};

export default function RiwayatPage() {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalData: 0,
  });

  const [filters, setFilters] = useState({
    tanggalMulai: "",
    tanggalAkhir: "",
    jenis: "",
  });

  const [expandedRow, setExpandedRow] = useState(null);
  const {
    columnWidths,
    onResizeStart,
    resizeColumn,
    resetColumnWidth,
  } = useColumnResize(HISTORY_COLUMN_WIDTHS);
  const {
    sortedRows: sortedActivities,
    sortKey,
    sortDirection,
    requestSort,
  } = useTableSort(activities, {
    initialKey: "created_at",
    initialDirection: "desc",
    getValue: getHistorySortValue,
  });

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.jenis) params.aksi = filters.jenis;
      if (filters.tanggalMulai) params.startDate = filters.tanggalMulai;
      if (filters.tanggalAkhir) params.endDate = filters.tanggalAkhir;

      const response = await riwayatService.getAll(params);
      const { data, pagination: paginationData } = response.data;

      setActivities(data || []);
      if (paginationData) {
        setPagination((prev) => ({
          ...prev,
          page:
            paginationData.currentPage ??
            paginationData.page ??
            prev.page,
          limit:
            paginationData.itemsPerPage ??
            paginationData.limit ??
            prev.limit,
          totalPages: paginationData.totalPages || 1,
          totalData:
            paginationData.totalItems ??
            paginationData.total ??
            paginationData.totalData ??
            0,
        }));
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error("Gagal memuat riwayat aktivitas");
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    filters.jenis,
    filters.tanggalMulai,
    filters.tanggalAkhir,
  ]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await riwayatService.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
    fetchStats();
  }, [fetchActivities, fetchStats]);

  // Activity types with icons
  const jenisAktivitas = [
    { value: "", label: "Semua Jenis", icon: FunnelSimpleIcon },
    { value: "CREATE", label: "Create", icon: PlusCircleIcon },
    { value: "VIEW", label: "View", icon: EyeIcon },
    { value: "UPDATE", label: "Update", icon: NotePencilIcon },
    { value: "DELETE", label: "Delete", icon: TrashIcon },
    { value: "LOGIN", label: "Login", icon: SignInIcon },
    { value: "LOGOUT", label: "Logout", icon: SignOutIcon },
  ];

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setFilters({
      tanggalMulai: "",
      tanggalAkhir: "",
      jenis: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleApplyFilter = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchActivities();
  };

  const handleRefresh = () => {
    fetchActivities();
    fetchStats();
    toast.success("Data diperbarui");
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const toggleRowExpand = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  // Format date
  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Format relative time
  const formatTimeAgo = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return "Kemarin";
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString("id-ID");
  };

  // Count active filters
  const activeFilterCount = [
    filters.jenis,
    filters.tanggalMulai,
    filters.tanggalAkhir,
  ].filter(Boolean).length;

  // Get action icon and style
  const getAksiConfig = (aksi) => {
    switch (aksi?.toUpperCase()) {
      case "CREATE":
        return {
          icon: PlusCircleIcon,
          style:
            "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
        };
      case "VIEW":
        return {
          icon: EyeIcon,
          style:
            "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
        };
      case "UPDATE":
        return {
          icon: NotePencilIcon,
          style:
            "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
        };
      case "DELETE":
        return {
          icon: TrashIcon,
          style: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
        };
      case "LOGIN":
        return {
          icon: SignInIcon,
          style:
            "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
        };
      case "LOGOUT":
        return {
          icon: SignOutIcon,
          style:
            "bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300",
        };
      case "BACKUP":
        return {
          icon: DatabaseIcon,
          style:
            "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
        };
      case "RESTORE":
        return {
          icon: ArrowsClockwiseIcon,
          style:
            "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400",
        };
      default:
        return {
          icon: InfoIcon,
          style: "bg-surface-tertiary text-text-secondary",
        };
    }
  };

  // Calculate stats from data
  const displayStats = {
    totalAktivitas: stats?.totalActivities || pagination.totalData || 0,
    loginHariIni: stats?.byAksi?.LOGIN || 0,
    perubahanData:
      (stats?.byAksi?.CREATE || 0) +
      (stats?.byAksi?.UPDATE || 0) +
      (stats?.byAksi?.DELETE || 0),
    createCount: stats?.byAksi?.CREATE || 0,
  };

  // Stat cards config
  const statCards = [
    {
      label: "Total Aktivitas",
      value: displayStats.totalAktivitas,
      icon: ChartBarIcon,
      bgGradient:
        "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
      iconBg: "bg-blue-500/10 dark:bg-blue-400/10",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Total Login",
      value: displayStats.loginHariIni,
      icon: LockKeyIcon,
      bgGradient:
        "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20",
      iconBg: "bg-purple-500/10 dark:bg-purple-400/10",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Perubahan Data",
      value: displayStats.perubahanData,
      icon: NotePencilIcon,
      bgGradient:
        "from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20",
      iconBg: "bg-amber-500/10 dark:bg-amber-400/10",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Data Baru",
      value: displayStats.createCount,
      icon: PlusCircleIcon,
      bgGradient:
        "from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20",
      iconBg: "bg-emerald-500/10 dark:bg-emerald-400/10",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Page Header */}
      <div className="admin-page-header">
        <div className="admin-page-header__identity">
          <div className="admin-page-header__icon bg-linear-to-br from-accent to-accent/80">
            <ClockCounterClockwiseIcon
              size={21}
              weight="duotone"
              className="text-surface"
            />
          </div>
          <div>
            <h1 className="admin-page-header__title">
              Riwayat Aktivitas
            </h1>
            <p className="admin-page-header__description">
              Aktivitas pengguna dan sistem.
            </p>
          </div>
        </div>
        <div className="admin-page-header__actions">
          <button
            onClick={handleRefresh}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`bg-linear-to-br ${stat.bgGradient} rounded-xl border border-border/50 p-4 sm:p-5 hover:shadow-lg transition-all duration-300 group`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xl sm:text-2xl font-bold text-text-primary">
                  {formatNumber(stat.value)}
                </div>
                <div className="text-xs sm:text-sm text-text-tertiary mt-1">
                  {stat.label}
                </div>
              </div>
              <div
                className={`w-10 h-10 ${stat.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}
              >
                <stat.icon
                  size={20}
                  weight="duotone"
                  className={stat.iconColor}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compact Filter Toolbar */}
      <div className="rounded-xl border border-border bg-surface p-2">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-[1fr_1fr_1fr_auto_auto]">
          <input
            type="date"
            aria-label="Tanggal mulai"
            value={filters.tanggalMulai}
            onChange={(event) =>
              handleFilterChange("tanggalMulai", event.target.value)
            }
            className="h-9 min-w-0 rounded-lg border border-border bg-surface px-2.5 text-[11px] text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 scheme-light dark:scheme-dark"
          />
          <input
            type="date"
            aria-label="Tanggal akhir"
            value={filters.tanggalAkhir}
            onChange={(event) =>
              handleFilterChange("tanggalAkhir", event.target.value)
            }
            className="h-9 min-w-0 rounded-lg border border-border bg-surface px-2.5 text-[11px] text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 scheme-light dark:scheme-dark"
          />
          <select
            value={filters.jenis}
            onChange={(event) => handleFilterChange("jenis", event.target.value)}
            className="h-9 min-w-0 rounded-lg border border-border bg-surface px-2.5 text-[11px] text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
            aria-label="Filter jenis aktivitas"
          >
            {jenisAktivitas.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleApplyFilter}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-accent px-3 text-[11px] font-semibold text-white transition hover:bg-accent-hover"
          >
            <MagnifyingGlassIcon size={14} weight="bold" />
            Terapkan
          </button>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-[11px] font-semibold text-text-secondary transition hover:bg-surface-secondary"
            >
              <XIcon size={13} weight="bold" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="px-4 sm:px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
              <FileTextIcon size={16} weight="duotone" className="text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Log Aktivitas</h3>
              <span className="text-xs text-text-tertiary">
                {formatNumber(pagination.totalData || 0)} total aktivitas
              </span>
            </div>
          </div>

        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
                <span className="text-sm text-text-secondary">
                  Memuat data...
                </span>
              </div>
            </div>
          ) : activities.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-surface-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ClipboardTextIcon size={32} className="text-text-muted" />
              </div>
              <p className="text-text-secondary font-medium">
                Belum ada riwayat aktivitas
              </p>
              <p className="text-text-tertiary text-sm mt-1">
                Aktivitas pengguna akan muncul di sini
              </p>
            </div>
          ) : (
            <table className="admin-data-table min-w-[1130px] table-fixed">
              <thead className="bg-surface-secondary/50 border-b border-border">
                <tr>
                  <SortableTableHeader
                    columnKey="no"
                    sortable={false}
                    width={columnWidths.no}
                    onResizeStart={onResizeStart}
                    onResizeBy={resizeColumn}
                    onResetWidth={resetColumnWidth}
                  >
                    No
                  </SortableTableHeader>
                  <SortableTableHeader
                    columnKey="created_at"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={requestSort}
                    width={columnWidths.created_at}
                    onResizeStart={onResizeStart}
                    onResizeBy={resizeColumn}
                    onResetWidth={resetColumnWidth}
                  >
                    <ClockIcon size={12} className="inline mr-1" />
                    Waktu
                  </SortableTableHeader>
                  <SortableTableHeader
                    columnKey="user"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={requestSort}
                    width={columnWidths.user}
                    onResizeStart={onResizeStart}
                    onResizeBy={resizeColumn}
                    onResetWidth={resetColumnWidth}
                  >
                    <UserIcon size={12} className="inline mr-1" />
                    User
                  </SortableTableHeader>
                  <SortableTableHeader
                    columnKey="aksi"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={requestSort}
                    width={columnWidths.aksi}
                    onResizeStart={onResizeStart}
                    onResizeBy={resizeColumn}
                    onResetWidth={resetColumnWidth}
                  >
                    Aksi
                  </SortableTableHeader>
                  <SortableTableHeader
                    columnKey="tabel"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={requestSort}
                    width={columnWidths.tabel}
                    onResizeStart={onResizeStart}
                    onResizeBy={resizeColumn}
                    onResetWidth={resetColumnWidth}
                  >
                    <DatabaseIcon size={12} className="inline mr-1" />
                    Tabel
                  </SortableTableHeader>
                  <SortableTableHeader
                    columnKey="keterangan"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={requestSort}
                    width={columnWidths.keterangan}
                    onResizeStart={onResizeStart}
                    onResizeBy={resizeColumn}
                    onResetWidth={resetColumnWidth}
                  >
                    Keterangan
                  </SortableTableHeader>
                  <SortableTableHeader
                    columnKey="detail"
                    sortable={false}
                    className="text-center"
                    width={columnWidths.detail}
                    onResizeStart={onResizeStart}
                    onResizeBy={resizeColumn}
                    onResetWidth={resetColumnWidth}
                  >
                    Detail
                  </SortableTableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {sortedActivities.map((item, index) => {
                  const aksiConfig = getAksiConfig(item.aksi);
                  const AksiIcon = aksiConfig.icon;
                  return (
                    <Fragment key={item.id_riwayat}>
                      <tr className="hover:bg-surface-secondary/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-text-tertiary">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-text-primary">
                            {formatDateTime(item.created_at).split(",")[0]}
                          </div>
                          <div className="text-xs text-text-tertiary">
                            {formatDateTime(item.created_at).split(",")[1]}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-surface-secondary rounded-full flex items-center justify-center">
                              <UserIcon size={14} className="text-text-muted" />
                            </div>
                            <span className="text-sm font-medium text-text-primary">
                              {item.user?.username || item.user_id || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${aksiConfig.style}`}
                          >
                            <AksiIcon size={14} weight="bold" />
                            {item.aksi}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-text-secondary capitalize bg-surface-secondary px-2 py-1 rounded">
                            {item.tabel || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary max-w-xs truncate">
                          {item.keterangan || "-"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleRowExpand(item.id_riwayat)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              expandedRow === item.id_riwayat
                                ? "bg-accent text-surface"
                                : "bg-surface-secondary text-text-secondary hover:bg-accent/10 hover:text-accent"
                            }`}
                          >
                            {expandedRow === item.id_riwayat ? (
                              <>
                                <CaretUpIcon size={12} weight="bold" />
                                Tutup
                              </>
                            ) : (
                              <>
                                <ArrowSquareOutIcon size={12} weight="bold" />
                                Lihat
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedRow === item.id_riwayat && (
                        <tr className="bg-linear-to-br from-surface-secondary/50 to-surface">
                          <td colSpan={7} className="px-6 py-5">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-medium text-text-secondary w-24">
                                    ID Riwayat:
                                  </span>
                                  <code className="text-text-tertiary bg-surface px-2 py-0.5 rounded text-xs">
                                    {item.id_riwayat}
                                  </code>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-medium text-text-secondary w-24">
                                    Timestamp:
                                  </span>
                                  <code className="text-text-tertiary bg-surface px-2 py-0.5 rounded text-xs">
                                    {new Date(item.created_at).toISOString()}
                                  </code>
                                </div>
                                {item.referensi_id && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium text-text-secondary w-24">
                                      ID Referensi:
                                    </span>
                                    <code className="text-text-tertiary bg-surface px-2 py-0.5 rounded text-xs">
                                      {item.referensi_id}
                                    </code>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-3">
                                {item.data_lama && (
                                  <div>
                                    <span className="font-medium text-text-secondary text-sm flex items-center gap-1 mb-2">
                                      <CaretLeftIcon size={12} />
                                      Data Sebelum
                                    </span>
                                    <pre className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-text-tertiary overflow-x-auto max-h-32">
                                      {JSON.stringify(item.data_lama, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {item.data_baru && (
                                  <div>
                                    <span className="font-medium text-text-secondary text-sm flex items-center gap-1 mb-2">
                                      <CaretRightIcon size={12} />
                                      Data Sesudah
                                    </span>
                                    <pre className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-text-tertiary overflow-x-auto max-h-32">
                                      {JSON.stringify(item.data_baru, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
                <span className="text-sm text-text-secondary">Memuat...</span>
              </div>
            </div>
          ) : activities.length === 0 ? (
            <div className="p-8 text-center">
              <ClipboardTextIcon
                size={40}
                className="mx-auto mb-2 text-text-muted"
              />
              <p className="text-sm text-text-secondary">Belum ada aktivitas</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {activities.map((item, index) => {
                const aksiConfig = getAksiConfig(item.aksi);
                const AksiIcon = aksiConfig.icon;
                return (
                  <div key={item.id_riwayat} className="p-4">
                    {/* Timeline indicator */}
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${aksiConfig.style}`}
                        >
                          <AksiIcon size={18} weight="bold" />
                        </div>
                        {index < activities.length - 1 && (
                          <div className="w-0.5 flex-1 bg-border mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${aksiConfig.style}`}
                            >
                              {item.aksi}
                            </span>
                            <p className="text-sm font-medium text-text-primary mt-1.5">
                              {item.keterangan ||
                                `${item.aksi} pada ${item.tabel || "sistem"}`}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-text-tertiary">
                              <UserIcon size={12} />
                              {item.user?.username || item.user_id || "-"}
                              <span className="text-text-muted">•</span>
                              <ClockIcon size={12} />
                              {formatTimeAgo(item.created_at)}
                            </div>
                          </div>
                          <button
                            onClick={() => toggleRowExpand(item.id_riwayat)}
                            className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
                          >
                            {expandedRow === item.id_riwayat ? (
                              <CaretUpIcon size={16} className="text-text-muted" />
                            ) : (
                              <CaretDownIcon
                                size={16}
                                className="text-text-muted"
                              />
                            )}
                          </button>
                        </div>

                        {expandedRow === item.id_riwayat && (
                          <div className="mt-3 p-3 bg-surface-secondary rounded-lg space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-text-muted">ID:</span>
                              <code className="text-text-tertiary">
                                {item.id_riwayat}
                              </code>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-muted">Waktu:</span>
                              <span className="text-text-tertiary">
                                {formatDateTime(item.created_at)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-muted">Tabel:</span>
                              <span className="text-text-tertiary capitalize">
                                {item.tabel || "-"}
                              </span>
                            </div>
                            {item.referensi_id && (
                              <div className="flex justify-between">
                                <span className="text-text-muted">Ref ID:</span>
                                <code className="text-text-tertiary">
                                  {item.referensi_id}
                                </code>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && activities.length > 0 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages || 1}
            totalItems={pagination.totalData || 0}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
            onItemsPerPageChange={(value) =>
              setPagination((prev) => ({ ...prev, page: 1, limit: value }))
            }
            pageSizeOptions={[10, 20, 50, 100]}
            embedded
            itemLabel="aktivitas"
          />
        )}
      </div>
    </div>
  );
}
