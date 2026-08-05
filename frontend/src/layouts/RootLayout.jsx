import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import SessionExpiredDialog from "../components/ui/SessionExpiredDialog";
import { notifikasiService, authService } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { useSessionStore } from "../stores/sessionStore";
import { canAccessMenu } from "../utils/permissions";

// Main Root Layout
export default function RootLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRequestInFlight = useRef(false);
  const hasLoggedNotificationConnectionError = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();

  const logoutAuth = useAuthStore((s) => s.logout);
  const setToken = useAuthStore((s) => s.setToken);
  const user = useAuthStore((s) => s.user);
  const showExtendDialog = useSessionStore((s) => s.showExtendDialog);
  const resumeSession = useSessionStore((s) => s.resumeSession);
  const extendSession = useSessionStore((s) => s.extendSession);
  const clearSession = useSessionStore((s) => s.clearSession);
  const dismissExtendDialog = useSessionStore((s) => s.dismissExtendDialog);

  // Handle session logout
  const handleSessionLogout = useCallback(() => {
    dismissExtendDialog();
    clearSession();
    logoutAuth();
    navigate("/login");
  }, [dismissExtendDialog, clearSession, logoutAuth, navigate]);

  // Resume session countdown on mount
  useEffect(() => {
    const result = resumeSession();
    if (result === "expired") {
      // Grace period passed (e.g. browser was closed for too long)
      handleSessionLogout();
    }
  }, [handleSessionLogout, resumeSession]);

  // Handle extend session
  const handleExtendSession = useCallback(async () => {
    try {
      const response = await authService.refreshToken();
      const { token, sessionDuration } = response.data;
      setToken(token);
      extendSession(sessionDuration);
    } catch (error) {
      console.error("Error extending session:", error);
      handleSessionLogout();
    }
  }, [setToken, extendSession, handleSessionLogout]);

  // Halaman peta tidak perlu scroll wrapper
  const isMapPage = location.pathname === "/peta";

  // Fetch notifications (centralized)
  const fetchNotifications = useCallback(async () => {
    if (!user?.role || !canAccessMenu(user.role, "notifikasi")) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    if (notificationRequestInFlight.current) return;
    notificationRequestInFlight.current = true;
    try {
      const response = await notifikasiService.getRecent(5);
      const data = response.data.data || [];
      setNotifications(data);
      setUnreadCount(response.data.unreadCount || 0);
      hasLoggedNotificationConnectionError.current = false;
    } catch (error) {
      const isConnectionError =
        error.code === "ERR_NETWORK" ||
        !error.response ||
        [502, 503, 504].includes(error.response.status);
      if (isConnectionError) {
        if (!hasLoggedNotificationConnectionError.current) {
          console.warn(
            "Notifikasi belum bisa dimuat karena API tidak dapat dijangkau. Pastikan backend berjalan.",
          );
          hasLoggedNotificationConnectionError.current = true;
        }
        return;
      }
      console.error("Error fetching notifications:", error);
    } finally {
      notificationRequestInFlight.current = false;
    }
  }, [user?.role]);

  // Mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await notifikasiService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, dibaca: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, []);

  // Mark single notification as read
  const handleMarkAsRead = useCallback(async (notifId, isAlreadyRead) => {
    if (isAlreadyRead) return;
    try {
      await notifikasiService.markAsRead(notifId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id_notifikasi === notifId ? { ...n, dibaca: true } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  }, []);

  // Fetch on mount and periodically
  useEffect(() => {
    const timeout = setTimeout(fetchNotifications, 0);
    const interval = setInterval(fetchNotifications, 30000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-dvh w-full min-w-0 flex-col bg-surface-secondary">
      {/* Session Expired Dialog */}
      {showExtendDialog && (
        <SessionExpiredDialog
          onExtend={handleExtendSession}
          onLogout={handleSessionLogout}
        />
      )}

      <Header
        onMenuClick={toggleSidebar}
        sidebarOpen={sidebarOpen}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllAsRead={handleMarkAllAsRead}
        onMarkAsRead={handleMarkAsRead}
      />
      <div className="flex min-h-0 min-w-0 flex-1">
        {/* Desktop Sidebar - fixed height, no scroll */}
        <div
          className={`relative z-30 hidden shrink-0 transition-all duration-300 ease-in-out lg:block ${
            sidebarCollapsed ? "w-16" : "w-60"
          }`}
        >
          <Sidebar
            unreadNotifCount={unreadCount}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Mobile Sidebar with Overlay */}
        <div
          className={`fixed inset-0 z-[70] bg-slate-950/45 backdrop-blur-[1px] transition-opacity duration-200 ease-out motion-reduce:transition-none lg:hidden ${
            sidebarOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }`}
          onClick={closeSidebar}
          role="presentation"
          aria-hidden="true"
        />
        <div
          className={`fixed inset-y-0 left-0 z-[80] transform-gpu transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-none lg:hidden ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-hidden={!sidebarOpen}
          inert={!sidebarOpen}
        >
          <Sidebar
            key={sidebarOpen ? "mobile-sidebar-open" : "mobile-sidebar-closed"}
            onNavigate={closeSidebar}
            unreadNotifCount={unreadCount}
          />
        </div>

        {/* Main Content */}
        <main
          className={`app-main-content w-0 min-w-0 max-w-full flex-1 ${
            isMapPage ? "overflow-hidden" : "overflow-y-auto"
          }`}
        >
          <div
            key={location.pathname}
            className={`${isMapPage ? "" : "admin-page-shell"} route-content-enter ${
              isMapPage ? "h-full" : ""
            }`}
          >
            <Outlet context={{ refreshNotifications: fetchNotifications }} />
          </div>
        </main>
      </div>
    </div>
  );
}
