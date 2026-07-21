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
    <div className="h-screen bg-surface-secondary flex flex-col overflow-hidden">
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
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Desktop Sidebar - fixed height, no scroll */}
        <div
          className={`hidden lg:block transition-all duration-300 ease-in-out relative z-30 ${
            sidebarCollapsed ? "w-18" : "w-68"
          }`}
        >
          <Sidebar
            unreadNotifCount={unreadCount}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Mobile Sidebar with Overlay */}
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-accent/50 z-40 lg:hidden"
              onClick={closeSidebar}
              role="presentation"
              aria-hidden="true"
            />
            {/* Sidebar */}
            <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
              <Sidebar
                onNavigate={closeSidebar}
                unreadNotifCount={unreadCount}
              />
            </div>
          </>
        )}

        {/* Main Content */}
        <main
          className={`flex-1 ${
            isMapPage ? "overflow-hidden" : "overflow-y-auto"
          }`}
        >
          <Outlet context={{ refreshNotifications: fetchNotifications }} />
        </main>
      </div>
    </div>
  );
}
