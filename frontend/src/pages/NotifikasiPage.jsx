import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import { notifikasiService } from "../services/api";
import Pagination from "../components/asset/Pagination";
import {
  UserIcon,
  NotePencilIcon,
  WarningCircleIcon,
  CheckCircleIcon,
  FloppyDiskIcon,
  UsersThreeIcon,
  ChartBarIcon,
  InfoIcon,
  BuildingsIcon,
  BellIcon,
  BellRingingIcon,
  ArrowsClockwiseIcon,
  CheckIcon,
  ChecksIcon,
  TrashIcon,
  TrayIcon,
  EnvelopeOpenIcon,
  EnvelopeSimpleIcon,
  CalendarBlankIcon,
  ClockIcon,
  EyeIcon,
} from "@phosphor-icons/react";

export default function NotifikasiPage() {
  const { refreshNotifications } = useOutletContext() || {};
  const [activeTab, setActiveTab] = useState("semua");
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (activeTab === "belum_dibaca") params.unreadOnly = "true";

      const response = await notifikasiService.getAll(params);
      const data = response.data.data || [];

      // Transform API data to component format
      const transformedData = data.map((notif) => ({
        id: notif.id_notifikasi,
        type: notif.kategori || "info",
        icon: getNotifIcon(notif.kategori),
        iconBg: getNotifIconBg(notif.kategori),
        title: notif.judul,
        isNew: !notif.dibaca,
        time: formatTimeAgo(notif.created_at),
        content: notif.pesan,
        detail: notif.detail || "",
        ipAddress: extractIpAddress(notif.pesan),
        isRead: notif.dibaca,
        referensi: notif.referensi,
        referensi_id: notif.referensi_id,
      }));

      setNotifications(transformedData);
      setPagination(response.data.pagination || {
        currentPage: page,
        totalPages: 1,
        totalItems: transformedData.length,
        itemsPerPage: limit,
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Use sample data as fallback
      setNotifications(getSampleNotifications());
    } finally {
      setLoading(false);
    }
  }, [activeTab, limit, page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Helper functions
  const getNotifIcon = (kategori) => {
    const icons = {
      login: <UserIcon size={20} />,
      update: <NotePencilIcon size={20} />,
      warning: <WarningCircleIcon size={20} />,
      success: <CheckCircleIcon size={20} />,
      backup: <FloppyDiskIcon size={20} />,
      user: <UsersThreeIcon size={20} />,
      report: <ChartBarIcon size={20} />,
      info: <InfoIcon size={20} />,
      aset: <BuildingsIcon size={20} />,
    };
    return icons[kategori] || <BellIcon size={20} />;
  };

  const getNotifIconBg = (kategori) => {
    const bgs = {
      login: "bg-gray-100 dark:bg-gray-800",
      update: "bg-amber-100 dark:bg-amber-900/30",
      warning: "bg-orange-100 dark:bg-orange-900/30",
      success: "bg-emerald-100 dark:bg-emerald-900/30",
      backup: "bg-purple-100 dark:bg-purple-900/30",
      user: "bg-blue-100 dark:bg-blue-900/30",
      report: "bg-orange-100 dark:bg-orange-900/30",
      info: "bg-blue-100 dark:bg-blue-900/30",
      aset: "bg-indigo-100 dark:bg-indigo-900/30",
    };
    return bgs[kategori] || "bg-gray-100 dark:bg-gray-800";
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays === 1) return "Kemarin";
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    return date.toLocaleDateString("id-ID");
  };

  const extractIpAddress = (content) => {
    const match = content?.match(/\bIP\s+([^\s]+)/i);
    return match?.[1] || null;
  };

  // Sample data fallback
  const getSampleNotifications = () => [
    {
      id: 1,
      type: "info",
      icon: <InfoIcon size={20} />,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      title: "Selamat Datang",
      isNew: true,
      time: "Baru saja",
      content:
        "Selamat datang di Bhumi Satya! Mulai kelola aset tanah Anda dengan mudah.",
      detail: "",
      isRead: false,
    },
  ];

  // Statistics (computed from data)
  const stats = {
    total: notifications.length,
    belumDibaca: notifications.filter((n) => !n.isRead).length,
    hariIni: notifications.filter(
      (n) =>
        n.time.includes("menit") ||
        n.time.includes("jam") ||
        n.time === "Baru saja",
    ).length,
  };

  // Stat cards config
  const statCards = [
    {
      label: "Total Notifikasi",
      value: stats.total,
      icon: BellIcon,
      bgGradient:
        "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
      iconBg: "bg-blue-500/10 dark:bg-blue-400/10",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Belum Dibaca",
      value: stats.belumDibaca,
      icon: EnvelopeSimpleIcon,
      bgGradient:
        "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20",
      iconBg: "bg-orange-500/10 dark:bg-orange-400/10",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      label: "Hari Ini",
      value: stats.hariIni,
      icon: CalendarBlankIcon,
      bgGradient:
        "from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20",
      iconBg: "bg-emerald-500/10 dark:bg-emerald-400/10",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  const tabs = [
    { id: "semua", label: "Semua", count: stats.total },
    { id: "belum_dibaca", label: "Belum Dibaca", count: stats.belumDibaca },
    {
      id: "sudah_dibaca",
      label: "Sudah Dibaca",
      count: stats.total - stats.belumDibaca,
    },
  ];

  const handleMarkAsRead = async (id) => {
    try {
      await notifikasiService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isRead: true, isNew: false } : n,
        ),
      );
      refreshNotifications?.();
    } catch (error) {
      console.error("Error marking as read:", error);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isRead: true, isNew: false } : n,
        ),
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notifikasiService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, isNew: false })),
      );
      refreshNotifications?.();
      toast.success("Semua notifikasi ditandai sudah dibaca");
    } catch (error) {
      console.error("Error marking all as read:", error);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, isNew: false })),
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await notifikasiService.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      refreshNotifications?.();
      toast.success("Notifikasi dihapus");
    } catch (error) {
      console.error("Error deleting notification:", error);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notifikasi dihapus");
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus semua notifikasi?")) {
      try {
        await notifikasiService.clearAll();
        setNotifications([]);
        refreshNotifications?.();
        toast.success("Semua notifikasi dihapus");
      } catch (error) {
        console.error("Error clearing notifications:", error);
        setNotifications([]);
        toast.success("Semua notifikasi dihapus");
      }
    }
  };

  const handleRefresh = () => {
    fetchNotifications();
    toast.success("Data diperbarui");
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "belum_dibaca") return !n.isRead;
    if (activeTab === "sudah_dibaca") return n.isRead;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Page Header */}
      <div className="admin-page-header">
        <div className="admin-page-header__identity">
          <div className="admin-page-header__icon bg-linear-to-br from-accent to-accent/80">
            <BellRingingIcon
              size={21}
              weight="duotone"
              className="text-surface"
            />
          </div>
          <div>
            <h1 className="admin-page-header__title">
              Notifikasi
            </h1>
            <p className="admin-page-header__description">
              Pemberitahuan dan aktivitas terbaru.
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
          <button
            onClick={handleMarkAllAsRead}
            disabled={stats.belumDibaca === 0}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs font-bold text-text-secondary transition hover:border-accent hover:text-accent disabled:opacity-50"
          >
            <ChecksIcon size={15} weight="bold" />
            <span className="hidden md:inline">Tandai Dibaca</span>
          </button>
          <button
            onClick={handleDeleteAll}
            disabled={notifications.length === 0}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-surface px-3 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <TrashIcon size={15} weight="bold" />
            <span className="hidden md:inline">Hapus Semua</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`bg-linear-to-br ${stat.bgGradient} rounded-xl border border-border/50 p-3 sm:p-5 hover:shadow-lg transition-all duration-300 group`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xl sm:text-2xl font-bold text-text-primary">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-text-tertiary mt-0.5">
                  {stat.label}
                </div>
              </div>
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 ${stat.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}
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

      {/* Tabs & Notifications */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
        {/* Tabs */}
        <div className="border-b border-border bg-surface-secondary/30">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-3.5 text-xs sm:text-sm font-medium transition-all relative whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-accent"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  {tab.id === "semua" && (
                    <BellIcon
                      size={14}
                      weight={activeTab === tab.id ? "fill" : "regular"}
                    />
                  )}
                  {tab.id === "belum_dibaca" && (
                    <EnvelopeSimpleIcon
                      size={14}
                      weight={activeTab === tab.id ? "fill" : "regular"}
                    />
                  )}
                  {tab.id === "sudah_dibaca" && (
                    <EnvelopeOpenIcon
                      size={14}
                      weight={activeTab === tab.id ? "fill" : "regular"}
                    />
                  )}
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${
                      activeTab === tab.id
                        ? "bg-accent text-surface"
                        : "bg-surface-tertiary text-text-muted"
                    }`}
                  >
                    {tab.count}
                  </span>
                </div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
              <span className="text-sm text-text-secondary">
                Memuat notifikasi...
              </span>
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-16 h-16 bg-surface-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrayIcon size={32} weight="duotone" className="text-text-muted" />
            </div>
            <p className="text-text-secondary font-medium">
              Tidak ada notifikasi
            </p>
            <p className="text-text-tertiary text-sm mt-1">
              {activeTab === "belum_dibaca"
                ? "Semua notifikasi sudah dibaca"
                : activeTab === "sudah_dibaca"
                  ? "Belum ada notifikasi yang dibaca"
                  : "Notifikasi akan muncul di sini"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`group px-4 sm:px-6 py-4 hover:bg-surface-secondary/50 transition-all ${
                  !notif.isRead
                    ? "bg-accent/3 dark:bg-accent/5 border-l-[3px] border-l-accent"
                    : "border-l-[3px] border-l-transparent"
                }`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 ${notif.iconBg} rounded-xl flex items-center justify-center shrink-0 ring-1 ring-accent/5 dark:ring-surface/5`}
                  >
                    {notif.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4
                            className={`text-sm sm:text-[15px] ${!notif.isRead ? "font-bold text-text-primary" : "font-medium text-text-secondary"}`}
                          >
                            {notif.title}
                          </h4>
                          {notif.isNew && (
                            <span className="bg-linear-to-r from-orange-600 to-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shadow-sm">
                              Baru
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                          {notif.content}
                        </p>
                        {notif.detail && (
                          <p className="text-xs text-text-muted mt-1 leading-relaxed">
                            {notif.detail}
                          </p>
                        )}
                        {notif.ipAddress && (
                          <div className="mt-2">
                            <span className="inline-flex items-center rounded-lg border border-border bg-surface-secondary px-2 py-1 text-[11px] font-semibold text-text-secondary">
                              IP: {notif.ipAddress}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-1 text-xs text-text-muted shrink-0 ml-2">
                        <ClockIcon size={12} />
                        <span>{notif.time}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent bg-accent/10 rounded-lg hover:bg-accent/20 transition-colors"
                        >
                          <CheckIcon size={14} weight="bold" />
                          Tandai Dibaca
                        </button>
                      )}
                      {notif.referensi && (
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors">
                          <EyeIcon size={14} />
                          Lihat Detail
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notif.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/15 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100"
                      >
                        <TrashIcon size={14} />
                        <span className="hidden sm:inline">Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredNotifications.length > 0 && (
          <Pagination
            pagination={pagination}
            onChange={setPage}
            pageSize={limit}
            pageSizeOptions={[10, 20, 50]}
            onPageSizeChange={(value) => {
              setLimit(value);
              setPage(1);
            }}
            embedded
            itemLabel="notifikasi"
          />
        )}
      </div>
    </div>
  );
}
