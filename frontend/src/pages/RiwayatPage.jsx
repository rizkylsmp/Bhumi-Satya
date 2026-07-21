import { useState, useRef, useEffect, useCallback, Fragment } from "react";
import toast from "react-hot-toast";
import { riwayatService } from "../services/api";
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
  CaretLeftIcon,
  CaretRightIcon,
  FunnelIcon,
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
  CalendarBlankIcon,
  InfoIcon,
  ClockCounterClockwiseIcon,
  FileTextIcon,
} from "@phosphor-icons/react";

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
    user: "",
    jenis: "",
    deskripsi: "",
  });

  const [expandedRow, setExpandedRow] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showFilterSection, setShowFilterSection] = useState(true);
  const filterDropdownRef = useRef(null);

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
          totalPages: paginationData.totalPages,
          totalData: paginationData.totalData,
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

  // User list for filter
  const userList = [
    "admin01",
    "bpka01",
    "bpn_user01",
  ];

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
      user: "",
      jenis: "",
      deskripsi: "",
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target)
      ) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Count active filters
  const activeFilterCount = [
    filters.user,
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-linear-to-br from-accent to-accent/80 rounded-xl flex items-center justify-center shadow-lg shadow-accent/25">
            <ClockCounterClockwiseIcon
              size={24}
              weight="duotone"
              className="text-surface"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
              Riwayat Aktivitas
            </h1>
            <p className="text-text-tertiary text-sm">
              Monitor semua aktivitas pengguna
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-surface border border-border text-text-secondary px-4 py-2.5 rounded-xl hover:bg-surface-secondary hover:border-accent/30 transition-all text-sm font-medium disabled:opacity-50 shadow-sm"
        >
          <ArrowsClockwiseIcon
            size={18}
            weight="bold"
            className={loading ? "animate-spin" : ""}
          />
          <span className="hidden sm:inline">Refresh</span>
        </button>
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
                  {stat.value.toLocaleString()}
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

      {/* Filter Section */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
        <button
          onClick={() => setShowFilterSection(!showFilterSection)}
          className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-surface-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
              <FunnelIcon size={16} weight="duotone" className="text-accent" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-text-primary text-sm sm:text-base">
                Filter & Pencarian
              </h3>
              {activeFilterCount > 0 && (
                <span className="text-xs text-accent">
                  {activeFilterCount} filter aktif
                </span>
              )}
            </div>
          </div>
          <CaretDownIcon
            size={18}
            weight="bold"
            className={`text-text-muted transition-transform duration-200 ${
              showFilterSection ? "rotate-180" : ""
            }`}
          />
        </button>
        {showFilterSection && (
          <div className="p-4 sm:p-6 border-t border-border bg-surface-secondary/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  <CalendarBlankIcon size={12} className="inline mr-1" />
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={filters.tanggalMulai}
                  onChange={(e) =>
                    handleFilterChange("tanggalMulai", e.target.value)
                  }
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-surface text-text-primary focus:ring-2 focus:ring-accent focus:border-accent transition-all scheme-light dark:scheme-dark"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  <CalendarBlankIcon size={12} className="inline mr-1" />
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  value={filters.tanggalAkhir}
                  onChange={(e) =>
                    handleFilterChange("tanggalAkhir", e.target.value)
                  }
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-surface text-text-primary focus:ring-2 focus:ring-accent focus:border-accent transition-all scheme-light dark:scheme-dark"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  <UserIcon size={12} className="inline mr-1" />
                  User
                </label>
                <select
                  value={filters.user}
                  onChange={(e) => handleFilterChange("user", e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-surface text-text-primary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                >
                  <option value="">Semua User</option>
                  {userList.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  <FunnelSimpleIcon size={12} className="inline mr-1" />
                  Jenis Aktivitas
                </label>
                <select
                  value={filters.jenis}
                  onChange={(e) => handleFilterChange("jenis", e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-surface text-text-primary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                >
                  {jenisAktivitas.map((j) => (
                    <option key={j.value} value={j.value}>
                      {j.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleApplyFilter}
                  className="flex-1 flex items-center justify-center gap-2 bg-accent text-surface px-4 py-2.5 rounded-lg hover:bg-accent-hover transition-all text-sm font-medium shadow-sm"
                >
                  <MagnifyingGlassIcon size={16} weight="bold" />
                  Cari
                </button>
                <button
                  onClick={handleReset}
                  className="px-3 py-2.5 border border-border rounded-lg hover:bg-surface-secondary text-text-secondary transition-all text-sm"
                  title="Reset Filter"
                >
                  <XIcon size={16} weight="bold" />
                </button>
              </div>
            </div>
          </div>
        )}
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
                {pagination.totalData?.toLocaleString() || 0} total aktivitas
              </span>
            </div>
          </div>

          {/* Quick Filter Dropdown */}
          <div className="relative" ref={filterDropdownRef}>
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                activeFilterCount > 0
                  ? "bg-accent text-surface border-accent"
                  : "bg-surface border-border text-text-secondary hover:bg-surface-secondary"
              }`}
            >
              <FunnelIcon
                size={16}
                weight={activeFilterCount > 0 ? "fill" : "regular"}
              />
              <span className="hidden sm:inline">Filter Cepat</span>
              {activeFilterCount > 0 && (
                <span className="bg-surface/20 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-surface rounded-xl border border-border shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="bg-surface-secondary px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="font-semibold text-sm text-text-primary flex items-center gap-2">
                    <FunnelIcon size={14} />
                    Filter Aktivitas
                  </span>
                  <button
                    onClick={() => {
                      handleReset();
                      setShowFilterDropdown(false);
                    }}
                    className="text-xs text-text-muted hover:text-text-secondary flex items-center gap-1"
                  >
                    <XIcon size={12} />
                    Reset
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  {/* User Filter */}
                  <div>
                    <label className="block text-xs font-medium text-text-tertiary mb-2">
                      <UserIcon size={12} className="inline mr-1" />
                      User
                    </label>
                    <select
                      value={filters.user}
                      onChange={(e) =>
                        handleFilterChange("user", e.target.value)
                      }
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface text-text-primary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    >
                      <option value="">Semua User</option>
                      {userList.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Jenis Filter */}
                  <div>
                    <label className="block text-xs font-medium text-text-tertiary mb-2">
                      <FunnelSimpleIcon size={12} className="inline mr-1" />
                      Jenis Aktivitas
                    </label>
                    <select
                      value={filters.jenis}
                      onChange={(e) =>
                        handleFilterChange("jenis", e.target.value)
                      }
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface text-text-primary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    >
                      {jenisAktivitas.map((j) => (
                        <option key={j.value} value={j.value}>
                          {j.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-text-tertiary mb-2">
                        Dari
                      </label>
                      <input
                        type="date"
                        value={filters.tanggalMulai}
                        onChange={(e) =>
                          handleFilterChange("tanggalMulai", e.target.value)
                        }
                        className="w-full border border-border rounded-lg px-2 py-2 text-sm bg-surface text-text-primary focus:ring-2 focus:ring-accent focus:border-accent transition-all scheme-light dark:scheme-dark"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-tertiary mb-2">
                        Sampai
                      </label>
                      <input
                        type="date"
                        value={filters.tanggalAkhir}
                        onChange={(e) =>
                          handleFilterChange("tanggalAkhir", e.target.value)
                        }
                        className="w-full border border-border rounded-lg px-2 py-2 text-sm bg-surface text-text-primary focus:ring-2 focus:ring-accent focus:border-accent transition-all scheme-light dark:scheme-dark"
                      />
                    </div>
                  </div>

                  {/* Apply Button */}
                  <button
                    onClick={() => {
                      handleApplyFilter();
                      setShowFilterDropdown(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-accent text-surface py-2.5 rounded-lg text-sm font-medium hover:bg-accent-hover transition-all"
                  >
                    <MagnifyingGlassIcon size={16} weight="bold" />
                    Terapkan Filter
                  </button>
                </div>
              </div>
            )}
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
            <table className="w-full">
              <thead className="bg-surface-secondary/50 border-b border-border">
                <tr>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    No
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    <ClockIcon size={12} className="inline mr-1" />
                    Waktu
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    <UserIcon size={12} className="inline mr-1" />
                    User
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Aksi
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    <DatabaseIcon size={12} className="inline mr-1" />
                    Tabel
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Keterangan
                  </th>
                  <th className="text-center px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {activities.map((item, index) => {
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
          <div className="px-4 sm:px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-secondary/30">
            <div className="text-sm text-text-tertiary">
              Menampilkan{" "}
              <span className="font-medium text-text-secondary">
                {activities.length > 0
                  ? (pagination.page - 1) * pagination.limit + 1
                  : 0}
              </span>
              -
              <span className="font-medium text-text-secondary">
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.totalData || 0,
                )}
              </span>{" "}
              dari{" "}
              <span className="font-medium text-text-secondary">
                {(pagination.totalData || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="flex items-center gap-1 px-3 py-2 border border-border rounded-lg text-sm text-text-secondary hover:bg-surface-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CaretLeftIcon size={16} weight="bold" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {(pagination.totalPages || 1) > 0 &&
                Array.from(
                  { length: Math.min(5, pagination.totalPages || 1) },
                  (_, i) => {
                    let pageNum;
                    const totalPages = pagination.totalPages || 1;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`min-w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                          pagination.page === pageNum
                            ? "bg-accent text-surface shadow-sm"
                            : "border border-border text-text-secondary hover:bg-surface-secondary"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  },
                )}

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= (pagination.totalPages || 1)}
                className="flex items-center gap-1 px-3 py-2 border border-border rounded-lg text-sm text-text-secondary hover:bg-surface-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="hidden sm:inline">Next</span>
                <CaretRightIcon size={16} weight="bold" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
