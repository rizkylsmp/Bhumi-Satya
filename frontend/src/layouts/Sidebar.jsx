import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useSessionStore } from "../stores/sessionStore";
import { canAccessMenu } from "../utils/permissions";
import {
  ChartBarIcon,
  FolderIcon,
  MapTrifoldIcon,
  ClockCounterClockwiseIcon,
  BellIcon,
  FloppyDiskIcon,
  GearIcon,
  UserIcon,
  SignOutIcon,
  CaretRightIcon,
  CaretDownIcon,
  CaretLeftIcon,
  SidebarSimpleIcon,
  HandshakeIcon,
  SignInIcon,
  EnvelopeOpenIcon,
  CheckCircleIcon,
  PaperPlaneTiltIcon,
  StorefrontIcon,
  GaugeIcon,
  DatabaseIcon,
  ScalesIcon,
  MapPinIcon,
  FileTextIcon,
  GlobeHemisphereWestIcon,
  CubeIcon,
} from "@phosphor-icons/react";

export default function Sidebar({
  onNavigate,
  unreadNotifCount = 0,
  collapsed = false,
  onToggleCollapse,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.toLowerCase() || "";

  // Auto-expand dropdown menus based on current route
  const [expandedMenus, setExpandedMenus] = useState(() => {
    const expanded = [];
    if (location.pathname.startsWith("/aset")) expanded.push("kelola-aset");
    if (location.pathname.startsWith("/sewa")) {
      expanded.push(userRole === "masyarakat" ? "sewa-masyarakat" : "sewa-aset");
    }
    if (
      ["/riwayat", "/notifikasi", "/backup"].includes(location.pathname)
    ) {
      expanded.push("aktivitas-sistem");
    }
    return expanded;
  });

  const activitySystemChildren = [
    canAccessMenu(userRole, "riwayat") && {
      icon: ClockCounterClockwiseIcon,
      label: "Riwayat",
      path: "/riwayat",
    },
    canAccessMenu(userRole, "notifikasi") && {
      icon: BellIcon,
      label: "Notifikasi",
      path: "/notifikasi",
      badge: unreadNotifCount,
    },
    canAccessMenu(userRole, "backup") && {
      icon: FloppyDiskIcon,
      label: "Backup",
      path: "/backup",
    },
  ].filter(Boolean);

  const menuItems = [
    canAccessMenu(userRole, "dashboard") && {
      icon: ChartBarIcon,
      label: "Dashboard",
      path: "/dashboard",
    },
    canAccessMenu(userRole, "aset") && {
      id: "kelola-aset",
      icon: FolderIcon,
      label: "Kelola Aset",
      children: [
        {
          icon: DatabaseIcon,
          label: "Pusat Data Aset",
          path: "/aset",
        },
        {
          icon: ScalesIcon,
          label: "Data Legal",
          path: "/aset/legal",
        },
        {
          icon: MapPinIcon,
          label: "Data Fisik",
          path: "/aset/fisik",
        },
        {
          icon: FileTextIcon,
          label: "Data Administratif",
          path: "/aset/administratif",
        },
        {
          icon: GlobeHemisphereWestIcon,
          label: "Data Spasial",
          path: "/aset/spasial",
        },
      ].filter(Boolean),
    },
    canAccessMenu(userRole, "kelola3d") && {
      icon: CubeIcon,
      label: "Kelola 3D",
      path: "/kelola-3d",
    },
    canAccessMenu(userRole, "sewa-aset") && {
      id: "sewa-aset",
      icon: HandshakeIcon,
      label: "Sewa Aset",
      children: [
        { icon: SignInIcon, label: "Penyewaan", path: "/sewa/penyewaan" },
        {
          icon: EnvelopeOpenIcon,
          label: "Permintaan",
          path: "/sewa/permintaan",
        },
      ],
    },
    canAccessMenu(userRole, "sewa-masyarakat") && {
      id: "sewa-masyarakat",
      icon: StorefrontIcon,
      label: "Sewa Masyarakat",
      children: [
        {
          icon: StorefrontIcon,
          label: "Aset Tersedia",
          path: "/sewa/aset-tersedia",
        },
        {
          icon: PaperPlaneTiltIcon,
          label: "Sewa Diajukan",
          path: "/sewa/diajukan",
        },
        {
          icon: CheckCircleIcon,
          label: "Sewa Disetujui",
          path: "/sewa/disetujui",
        },
      ],
    },
    canAccessMenu(userRole, "peta") && {
      icon: MapTrifoldIcon,
      label: "Peta",
      path: "/peta",
    },
    activitySystemChildren.length > 0 && {
      id: "aktivitas-sistem",
      icon: ClockCounterClockwiseIcon,
      label: "Aktivitas & Sistem",
      badge: unreadNotifCount,
      children: activitySystemChildren,
    },
    canAccessMenu(userRole, "ekasmat") && {
      icon: GaugeIcon,
      label: "EKASMAT",
      path: "/admin/ekasmat",
    },
    canAccessMenu(userRole, "pengaturan") && {
      icon: GearIcon,
      label: "Pengaturan",
      path: "/pengaturan",
    },
  ].filter(Boolean);

  const handleLogout = () => {
    useSessionStore.getState().clearSession();
    logout();
    navigate("/login");
    onNavigate?.();
  };

  const handleMenuClick = (path) => {
    navigate(path);
    onNavigate?.();
  };

  const toggleExpanded = (menuId) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId],
    );
  };

  const isActivePath = (path) => location.pathname === path;

  const isParentActive = (children) =>
    children?.some((child) => location.pathname === child.path);

  const isExpanded = (menuId) => expandedMenus.includes(menuId);

  return (
    <aside
      className={`bg-surface flex flex-col border-r border-border h-full transition-all duration-300 ease-in-out ${
        collapsed ? "w-[72px] overflow-visible" : "w-68 overflow-hidden"
      }`}
    >
      {/* Menu Title */}
      <div
        className={`py-3.5 border-b border-border flex items-center transition-all duration-300 ${collapsed ? "px-3 justify-center" : "px-5 justify-between"}`}
      >
        {!collapsed && (
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest whitespace-nowrap">
            Menu Utama
          </span>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-secondary hover:text-text-primary transition-all duration-200"
            title={collapsed ? "Perluas sidebar" : "Sembunyikan sidebar"}
          >
            <SidebarSimpleIcon
              size={16}
              weight="bold"
              className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      {/* Menu Items */}
      <nav
        aria-label="Menu utama"
        className={`flex-1 py-3 px-3 space-y-1 ${collapsed ? "overflow-visible" : "overflow-y-auto overflow-x-hidden"}`}
      >
        {menuItems.map((item, index) => {
          const hasChildren = item.children && item.children.length > 0;
          const parentActive = hasChildren && isParentActive(item.children);
          const expanded = hasChildren && isExpanded(item.id);
          const isActive = !hasChildren && isActivePath(item.path);

          return (
            <div key={item.label} className="relative group/menu">
              {/* Main menu button */}
              <button
                onClick={() => {
                  if (hasChildren) {
                    if (collapsed) return; // hover handles it in collapsed mode
                    toggleExpanded(item.id);
                  } else {
                    handleMenuClick(item.path);
                  }
                }}
                className={`group w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 rounded-xl transition-all duration-200 ${
                  isActive || parentActive
                    ? "bg-linear-to-r from-accent to-accent/90 text-surface shadow-lg shadow-accent/20"
                    : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                } ${collapsed ? "justify-center !px-2 !gap-0" : ""}`}
                style={{ animationDelay: `${index * 50}ms` }}
                title={collapsed && !hasChildren ? item.label : undefined}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                    isActive || parentActive
                      ? "bg-surface/20"
                      : "bg-surface-tertiary group-hover:bg-surface-secondary"
                  }`}
                >
                  <item.icon
                    size={18}
                    weight={isActive || parentActive ? "fill" : "bold"}
                  />
                  {collapsed && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                  )}
                </div>
                {!collapsed && (
                  <>
                    <span className="font-medium flex-1 whitespace-nowrap">
                      {item.label}
                    </span>
                    {item.badge > 0 && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? "bg-surface/20 text-surface"
                            : "bg-red-500 text-surface"
                        }`}
                      >
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                    {hasChildren ? (
                      <CaretDownIcon
                        size={14}
                        weight="bold"
                        className={`transition-transform duration-200 ${
                          expanded ? "rotate-180" : ""
                        } ${parentActive ? "" : "opacity-60"}`}
                      />
                    ) : (
                      isActive && (
                        <CaretRightIcon
                          size={14}
                          weight="bold"
                          className="opacity-60"
                        />
                      )
                    )}
                  </>
                )}
              </button>

              {/* Collapsed mode: hover flyout for parent with children */}
              {collapsed && hasChildren && (
                <div className="invisible opacity-0 group-hover/menu:visible group-hover/menu:opacity-100 transition-all duration-200 absolute left-full top-0 ml-2 z-50">
                  <div className="bg-surface rounded-xl shadow-xl border border-border py-2 px-1 min-w-48">
                    {/* Flyout header */}
                    <div className="px-3 pb-1.5 mb-1 border-b border-border">
                      <span className="text-xs font-bold text-text-primary">
                        {item.label}
                      </span>
                    </div>
                    {/* Flyout children */}
                    <div className="space-y-0.5">
                      {item.children.map((child) => {
                        const isChildActive = isActivePath(child.path);
                        return (
                          <button
                            key={child.path}
                            onClick={() => handleMenuClick(child.path)}
                            className={`w-full text-left px-3 py-2 flex items-center gap-2.5 rounded-lg text-sm transition-all duration-200 ${
                              isChildActive
                                ? "bg-linear-to-r from-accent to-accent/90 text-surface shadow-md shadow-accent/20 font-semibold"
                                : "text-text-muted hover:bg-surface-secondary hover:text-text-primary"
                            }`}
                          >
                            <child.icon
                              size={15}
                              weight={isChildActive ? "fill" : "regular"}
                            />
                            <span className="whitespace-nowrap">
                              {child.label}
                            </span>
                            {child.badge > 0 && (
                              <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-surface">
                                {child.badge > 9 ? "9+" : child.badge}
                              </span>
                            )}
                            {isChildActive && (
                              <div className="w-1.5 h-1.5 rounded-full bg-surface ml-auto" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Expanded mode: sub-menu items (dropdown) */}
              {hasChildren && !collapsed && (
                <div
                  className={`overflow-hidden transition-all duration-200 ease-in-out ${
                    expanded ? "max-h-80 opacity-100 mt-1" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="ml-4 pl-4 border-l-2 border-border space-y-0.5 py-0.5">
                    {item.children.map((child) => {
                      const isChildActive = isActivePath(child.path);
                      return (
                        <button
                          key={child.path}
                          onClick={() => handleMenuClick(child.path)}
                          className={`group w-full text-left px-3 py-2 flex items-center gap-2.5 rounded-lg transition-all duration-200 ${
                            isChildActive
                              ? "bg-linear-to-r from-accent to-accent/90 text-surface shadow-md shadow-accent/20 font-semibold"
                              : "text-text-muted hover:bg-surface-secondary hover:text-text-primary"
                          }`}
                        >
                          <child.icon
                            size={16}
                            weight={isChildActive ? "fill" : "regular"}
                          />
                          <span className="flex-1">{child.label}</span>
                          {child.badge > 0 && (
                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                              isChildActive
                                ? "bg-surface/20 text-surface"
                                : "bg-red-500 text-surface"
                            }`}>
                              {child.badge > 9 ? "9+" : child.badge}
                            </span>
                          )}
                          {isChildActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-surface" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-border p-3 space-y-1 bg-surface-secondary/50 mt-auto">
        <button
          onClick={() => handleMenuClick("/profil")}
          className={`group w-full text-left px-3 py-2.5 text-sm text-text-secondary hover:bg-surface hover:text-text-primary rounded-xl flex items-center gap-3 transition-all duration-200 ${collapsed ? "justify-center !px-2 !gap-0" : ""}`}
          title={collapsed ? "Profil Saya" : undefined}
        >
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
            <UserIcon size={16} weight="bold" className="text-surface" />
          </div>
          {!collapsed && (
            <span className="font-medium whitespace-nowrap">Profil Saya</span>
          )}
        </button>
        <button
          onClick={handleLogout}
          className={`group w-full text-left px-3 py-2.5 text-sm text-text-muted hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 rounded-xl flex items-center gap-3 transition-all duration-200 ${collapsed ? "justify-center !px-2 !gap-0" : ""}`}
          title={collapsed ? "Keluar" : undefined}
        >
          <div className="w-8 h-8 rounded-lg bg-surface-tertiary group-hover:bg-red-100 dark:group-hover:bg-red-900/30 flex items-center justify-center shrink-0 transition-colors">
            <SignOutIcon
              size={16}
              weight="bold"
              className="group-hover:text-red-600"
            />
          </div>
          {!collapsed && (
            <span className="font-medium whitespace-nowrap">Keluar</span>
          )}
        </button>
      </div>
    </aside>
  );
}
