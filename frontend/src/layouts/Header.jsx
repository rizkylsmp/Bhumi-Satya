import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useSessionStore } from "../stores/sessionStore";
import { useThemeStore } from "../stores/themeStore";
import { notifikasiService } from "../services/api";
import BrandMark from "../components/shared/BrandMark";
import {
  UserIcon,
  NotePencilIcon,
  WarningIcon,
  GearIcon,
  SignOutIcon,
  ListIcon,
  XIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  CaretDownIcon,
  BuildingsIcon,
  InfoIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  TimerIcon,
} from "@phosphor-icons/react";

export default function Header({
  onMenuClick,
  sidebarOpen,
  notifications: propNotifications,
  unreadCount: propUnreadCount,
  onMarkAllAsRead,
  onMarkAsRead,
}) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { darkMode, toggleDarkMode } = useThemeStore();
  const remainingSeconds = useSessionStore((s) => s.remainingSeconds);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Format remaining seconds to HH:MM:SS or MM:SS
  const formatCountdown = (seconds) => {
    if (seconds == null || seconds < 0) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const isUrgent = remainingSeconds != null && remainingSeconds <= 300; // 5 min
  const isWarning = remainingSeconds != null && remainingSeconds <= 600; // 10 min

  // Use props if provided (from RootLayout), otherwise manage own state
  const [localNotifications, setLocalNotifications] = useState([]);
  const [localUnreadCount, setLocalUnreadCount] = useState(0);

  const notifications =
    propNotifications !== undefined ? propNotifications : localNotifications;
  const unreadCount =
    propUnreadCount !== undefined ? propUnreadCount : localUnreadCount;

  const notifDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // Fetch notifications from backend (only if not receiving from props)
  const fetchNotifications = useCallback(async () => {
    if (propNotifications !== undefined) return; // Skip if using props
    try {
      const response = await notifikasiService.getRecent(5);
      const data = response.data.data || [];
      setLocalNotifications(data);
      setLocalUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [propNotifications]);

  // Fetch on mount and periodically (only if not receiving from props)
  useEffect(() => {
    if (propNotifications === undefined) {
      const timeout = setTimeout(fetchNotifications, 0);
      const interval = setInterval(fetchNotifications, 30000);
      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    }
  }, [fetchNotifications, propNotifications]);

  // Get icon based on notification category
  const getNotifIcon = (kategori, tipe) => {
    if (kategori === "aset") return BuildingsIcon;
    if (kategori === "user" || kategori === "sistem") return UserIcon;
    if (tipe === "warning") return WarningCircleIcon;
    if (tipe === "success") return CheckCircleIcon;
    return InfoIcon;
  };

  // Format time ago
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

  const extractIpAddress = (content) => {
    const match = content?.match(/\bIP\s+([^\s]+)/i);
    return match?.[1] || null;
  };

  // Mark all as read
  const handleMarkAllAsReadLocal = async () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    } else {
      try {
        await notifikasiService.markAllAsRead();
        setLocalNotifications((prev) =>
          prev.map((n) => ({ ...n, dibaca: true })),
        );
        setLocalUnreadCount(0);
      } catch (error) {
        console.error("Error marking all as read:", error);
      }
    }
  };

  // Mark single notification as read
  const handleMarkAsReadLocal = async (notifId, isAlreadyRead) => {
    if (isAlreadyRead) return;
    if (onMarkAsRead) {
      onMarkAsRead(notifId);
    } else {
      try {
        await notifikasiService.markAsRead(notifId);
        setLocalNotifications((prev) =>
          prev.map((n) =>
            n.id_notifikasi === notifId ? { ...n, dibaca: true } : n,
          ),
        );
        setLocalUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notifDropdownRef.current &&
        !notifDropdownRef.current.contains(event.target)
      ) {
        setShowNotifDropdown(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    useSessionStore.getState().clearSession();
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-surface border-b border-border sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 gap-3 md:gap-6">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-text-secondary hover:bg-surface-tertiary hover:text-text-primary transition-all duration-200 mr-2"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? (
            <XIcon size={22} weight="bold" />
          ) : (
            <ListIcon size={22} weight="bold" />
          )}
        </button>

        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate("/dashboard")}
        >
          <BrandMark className="h-10 w-10 text-xs shadow-lg shadow-accent/20 transition-all group-hover:shadow-accent/30" />
          <div>
            <h1 className="font-bold text-text-primary text-lg leading-tight group-hover:text-accent transition-colors">
              Bhumi Satya
            </h1>
            <p className="text-[10px] text-text-muted -mt-0.5 md:block hidden">
              Sistem Manajemen Aset
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center md:gap-2 gap-0">
          {/* Session Countdown Timer */}
          {remainingSeconds != null && (
            <div
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all duration-300 ${
                isUrgent
                  ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 animate-pulse"
                  : isWarning
                    ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                    : "bg-surface-secondary text-text-secondary"
              }`}
              title="Sisa waktu sesi"
            >
              <TimerIcon
                size={14}
                weight="bold"
                className={
                  isUrgent
                    ? "text-red-500"
                    : isWarning
                      ? "text-amber-500"
                      : "text-text-muted"
                }
              />
              <span>{formatCountdown(remainingSeconds)}</span>
            </div>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-text-secondary hover:bg-surface-tertiary hover:text-text-primary transition-all duration-200"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <SunIcon size={20} weight="bold" className="text-yellow-500" />
            ) : (
              <MoonIcon size={20} weight="bold" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifDropdownRef}>
            <button
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                setShowProfileDropdown(false);
              }}
              aria-label="Notifikasi"
              className="relative w-10 h-10 rounded-xl flex items-center justify-center text-text-secondary hover:bg-surface-tertiary hover:text-text-primary transition-all duration-200"
            >
              <BellIcon
                size={20}
                weight={showNotifDropdown ? "fill" : "bold"}
              />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute -right-18 sm:right-0 mt-2 w-72 sm:w-80 bg-surface rounded-xl border border-border shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="bg-linear-to-r from-accent to-accent/90 text-surface px-4 py-3 flex items-center justify-between">
                  <span className="font-semibold text-sm">Notifikasi</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsReadLocal}
                      className="bg-surface/20 hover:bg-surface/30 text-[10px] px-2 py-0.5 rounded-full font-semibold transition-colors"
                    >
                      Tandai dibaca
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-text-muted text-sm">
                      Tidak ada notifikasi
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const NotifIcon = getNotifIcon(
                        notif.kategori,
                        notif.tipe,
                      );
                      const ipAddress = extractIpAddress(notif.pesan);
                      return (
                        <div
                          key={notif.id_notifikasi}
                          onClick={() => {
                            handleMarkAsReadLocal(
                              notif.id_notifikasi,
                              notif.dibaca,
                            );
                            setShowNotifDropdown(false);
                            navigate("/notifikasi");
                          }}
                          className={`px-4 py-3 border-b border-border/50 hover:bg-surface-secondary cursor-pointer transition-colors ${
                            !notif.dibaca ? "bg-accent/5" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                !notif.dibaca
                                  ? "bg-linear-to-br from-accent to-accent/80 text-surface"
                                  : "bg-surface-tertiary text-text-muted"
                              }`}
                            >
                              <NotifIcon size={16} weight="bold" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-text-primary line-clamp-1">
                                  {notif.judul}
                                </span>
                                {!notif.dibaca && (
                                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-text-secondary line-clamp-1">
                                {notif.pesan}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                {ipAddress && (
                                  <span className="rounded-md bg-surface-tertiary px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary">
                                    IP: {ipAddress}
                                  </span>
                                )}
                                <span className="text-xs text-text-muted">
                                  {formatTimeAgo(notif.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowNotifDropdown(false);
                    navigate("/notifikasi");
                  }}
                  className="w-full px-4 py-3 text-center text-sm font-medium text-accent hover:bg-surface-secondary border-t border-border transition-colors"
                >
                  Lihat Semua Notifikasi →
                </button>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => {
                setShowProfileDropdown(!showProfileDropdown);
                setShowNotifDropdown(false);
              }}
              className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl hover:bg-surface-tertiary transition-all duration-200 group"
            >
              <div className="w-9 h-9 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 ring-2 ring-white dark:ring-gray-800">
                <span className="text-surface font-bold text-sm">
                  {user?.nama_lengkap?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-text-primary leading-tight">
                  {user?.nama_lengkap || "User"}
                </p>
                <p className="text-[10px] text-text-muted capitalize">
                  {user?.role || "Role"}
                </p>
              </div>
              <CaretDownIcon
                size={14}
                weight="bold"
                className={`text-text-muted transition-transform duration-200 ${showProfileDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-surface rounded-xl border border-border shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-4 bg-linear-to-br from-surface-secondary to-surface border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <span className="text-surface font-bold text-lg">
                        {user?.nama_lengkap?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary truncate">
                        {user?.nama_lengkap || "User"}
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        {user?.email || "email@domain.com"}
                      </p>
                      <span className="inline-block mt-1 bg-accent text-surface text-[10px] font-bold px-2 py-0.5 rounded-md capitalize">
                        {user?.role || "User"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      navigate("/profil");
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-text-secondary hover:bg-surface-secondary hover:text-text-primary flex items-center gap-3 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface-tertiary flex items-center justify-center">
                      <UserIcon size={16} weight="bold" />
                    </div>
                    Profil Saya
                  </button>
                  {user?.role === "admin" && (
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        navigate("/pengaturan");
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-text-secondary hover:bg-surface-secondary hover:text-text-primary flex items-center gap-3 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-surface-tertiary flex items-center justify-center">
                        <GearIcon size={16} weight="bold" />
                      </div>
                      Pengaturan
                    </button>
                  )}
                </div>
                <div className="border-t border-border p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 font-medium rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                      <SignOutIcon size={16} weight="bold" />
                    </div>
                    Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
