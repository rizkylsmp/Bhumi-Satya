import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useSessionStore } from "../stores/sessionStore";
import { canAccessMenu } from "../utils/permissions";
import { RENTAL_FEATURE_ENABLED } from "../config/featureFlags";
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
  DatabaseIcon,
  ScalesIcon,
  MapPinIcon,
  ClipboardTextIcon,
  GlobeHemisphereWestIcon,
  CubeIcon,
  IdentificationCardIcon,
  ReceiptIcon,
  ImageIcon,
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
    const assetFormSection = new URLSearchParams(location.search).get("bagian")
      || new URLSearchParams(location.search).get("kembali");
    if (
      [
        "/aset/legal",
        "/aset/fisik",
        "/aset/kib",
        "/aset/pajak",
        "/aset/administratif",
      ].some((path) => location.pathname.startsWith(path))
      || (
        (
          location.pathname === "/aset/tambah"
          || /^\/aset\/[^/]+\/(?:edit|kelola)$/.test(location.pathname)
        )
        && ["legal", "fisik", "kib", "pajak", "administratif"].includes(assetFormSection)
      )
    ) {
      expanded.push("kelola-data");
    }
    if (
      location.pathname.startsWith("/aset/spasial") ||
      location.pathname.startsWith("/orthophoto") ||
      location.pathname.startsWith("/kelola-2d") ||
      location.pathname.startsWith("/kelola-3d")
    ) {
      expanded.push("kelola-data");
      expanded.push("data-spasial");
    }
    if (RENTAL_FEATURE_ENABLED && location.pathname.startsWith("/sewa")) {
      if (userRole === "masyarakat") {
        expanded.push("sewa-masyarakat");
      } else {
        expanded.push("kelola-data");
        expanded.push("sewa-aset");
      }
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
    canAccessMenu(userRole, "peta") && {
      icon: MapTrifoldIcon,
      label: "Digital Twin",
      path: "/peta",
    },
    canAccessMenu(userRole, "aset") && {
      icon: DatabaseIcon,
      label: "Pusat Data",
      path: "/aset",
    },
    (canAccessMenu(userRole, "aset") ||
      canAccessMenu(userRole, "kelola3d") ||
      (RENTAL_FEATURE_ENABLED && canAccessMenu(userRole, "sewa-aset"))) && {
      id: "kelola-data",
      icon: FolderIcon,
      label: "Kelola Data",
      children: [
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
          icon: IdentificationCardIcon,
          label: "Data KIB",
          path: "/aset/kib",
        },
        {
          icon: ClipboardTextIcon,
          label: "Data Administratif",
          path: "/aset/administratif",
        },
        {
          icon: ReceiptIcon,
          label: "Data Pajak",
          path: "/aset/pajak",
        },
        (canAccessMenu(userRole, "aset") ||
          canAccessMenu(userRole, "kelola3d")) && {
          id: "data-spasial",
          icon: GlobeHemisphereWestIcon,
          label: "Data Spasial",
          children: [
            canAccessMenu(userRole, "aset") && {
              icon: MapTrifoldIcon,
              label: "Kelola 2D",
              path: "/aset/spasial",
            },
            canAccessMenu(userRole, "kelola3d") && {
              icon: CubeIcon,
              label: "Kelola 3D",
              path: "/kelola-3d",
            },
            canAccessMenu(userRole, "aset") && {
              icon: ImageIcon,
              label: "Kelola Orthophoto",
              path: "/orthophoto",
              disabled: true,
              status: "Dev",
              description: "Dalam proses pengembangan",
            },
          ].filter(Boolean),
        },
        RENTAL_FEATURE_ENABLED && canAccessMenu(userRole, "sewa-aset") && {
          id: "sewa-aset",
          icon: HandshakeIcon,
          label: "Penyewaan",
          children: [
            {
              icon: SignInIcon,
              label: "Daftar Sewa",
              path: "/sewa/penyewaan",
            },
            {
              icon: EnvelopeOpenIcon,
              label: "Permintaan",
              path: "/sewa/permintaan",
            },
          ],
        },
      ].filter(Boolean),
    },
    RENTAL_FEATURE_ENABLED && canAccessMenu(userRole, "sewa-masyarakat") && {
      id: "sewa-masyarakat",
      icon: StorefrontIcon,
      label: "Sewa Masyarakat",
      children: [
        {
          icon: StorefrontIcon,
          label: "Objek Tersedia",
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
    activitySystemChildren.length > 0 && {
      id: "aktivitas-sistem",
      icon: ClockCounterClockwiseIcon,
      label: "Aktivitas & Sistem",
      badge: unreadNotifCount,
      children: activitySystemChildren,
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

  const isActivePath = (path) => {
    if (location.pathname === path) return true;
    if (
      path === "/aset/spasial" &&
      location.pathname.startsWith("/kelola-2d/")
    ) {
      return true;
    }
    if (
      path === "/kelola-3d" &&
      location.pathname.startsWith("/kelola-3d/")
    ) {
      return true;
    }
    const isAssetFormRoute = location.pathname === "/aset/tambah"
      || /^\/aset\/[^/]+\/edit$/.test(location.pathname);
    if (!isAssetFormRoute) return false;
    const params = new URLSearchParams(location.search);
    const formSection = params.get("bagian") || params.get("kembali");
    return formSection
      ? path === `/aset/${formSection}`
      : path === "/aset";
  };

  const isParentActive = (children) =>
    children?.some((child) =>
      child.children?.length
        ? isParentActive(child.children)
        : isActivePath(child.path),
    );

  const isExpanded = (menuId) => expandedMenus.includes(menuId);

  return (
    <aside
      className={`sidebar-shell bg-surface flex h-full flex-col border-r border-border transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        collapsed ? "w-16 overflow-visible" : "w-60 overflow-hidden"
      }`}
    >
      {/* Menu Title */}
      <div
        className={`border-b border-border flex items-center py-3 transition-all duration-300 ${collapsed ? "px-2.5 justify-center" : "px-4 justify-between"}`}
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
        className={`flex-1 space-y-0.5 px-2 py-2.5 ${collapsed ? "overflow-visible" : "overflow-y-auto overflow-x-hidden"}`}
      >
        {menuItems.map((item, index) => {
          const hasChildren = item.children && item.children.length > 0;
          const parentActive = hasChildren && isParentActive(item.children);
          const expanded = hasChildren && isExpanded(item.id);
          const isActive = !hasChildren && isActivePath(item.path);

          return (
            <div
              key={item.label}
              className="sidebar-menu-item relative group/menu"
              style={{ "--sidebar-item-index": index }}
            >
              {/* Main menu button */}
              <button
                aria-expanded={hasChildren ? expanded : undefined}
                onClick={() => {
                  if (hasChildren) {
                    if (collapsed) return; // hover handles it in collapsed mode
                    toggleExpanded(item.id);
                  } else {
                    handleMenuClick(item.path);
                  }
                }}
                className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-all duration-200 ${
                  isActive || parentActive
                    ? "bg-linear-to-r from-accent to-accent/90 text-white dark:from-white dark:to-slate-100 dark:text-slate-900"
                    : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                } ${collapsed ? "justify-center !px-2 !gap-0" : ""}`}
                title={collapsed && !hasChildren ? item.label : undefined}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all ${
                    isActive || parentActive
                      ? "bg-white/15 dark:bg-slate-900/10"
                      : "bg-surface-tertiary group-hover:bg-surface-secondary"
                  }`}
                >
                  <item.icon
                    size={16}
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
                            ? "bg-white/15 text-white dark:bg-slate-900/10 dark:text-slate-900"
                            : "bg-red-600 text-white"
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
                <div className="invisible absolute left-full top-0 z-50 ml-2 -translate-x-1 opacity-0 transition-[opacity,transform,visibility] duration-150 ease-out group-hover/menu:visible group-hover/menu:translate-x-0 group-hover/menu:opacity-100 motion-reduce:transition-none">
                  <div className="min-w-44 rounded-lg border border-border bg-surface px-1 py-1.5">
                    {/* Flyout header */}
                    <div className="mb-1 border-b border-border px-2.5 pb-1.5">
                      <span className="text-[10px] font-bold text-text-primary">
                        {item.label}
                      </span>
                    </div>
                    {/* Flyout children */}
                    <div className="space-y-0.5">
                      {item.children.map((child) => {
                        const childHasChildren =
                          child.children && child.children.length > 0;
                        const isChildActive = childHasChildren
                          ? isParentActive(child.children)
                          : isActivePath(child.path);
                        if (childHasChildren) {
                          return (
                            <div
                              key={child.id || child.label}
                              className="pt-1"
                            >
                              <div
                                className={`flex items-center gap-2 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${
                                  isChildActive
                                    ? "text-accent"
                                    : "text-text-muted"
                                }`}
                              >
                                <child.icon size={13} weight="bold" />
                                {child.label}
                              </div>
                              <div className="ml-2 border-l border-border pl-1.5">
                                {child.children.map((grandchild) => {
                                  const isGrandchildActive = isActivePath(
                                    grandchild.path,
                                  );
                                  return (
                                    <button
                                      key={grandchild.path}
                                      type="button"
                                      disabled={grandchild.disabled}
                                      title={grandchild.description}
                                      aria-label={grandchild.disabled
                                        ? `${grandchild.label} — ${grandchild.description}`
                                        : grandchild.label}
                                      onClick={() =>
                                        handleMenuClick(grandchild.path)
                                      }
                                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[10px] transition-colors ${
                                        grandchild.disabled
                                          ? "cursor-not-allowed text-text-muted opacity-50"
                                          : isGrandchildActive
                                          ? "bg-accent text-white font-semibold dark:bg-white dark:text-slate-900"
                                          : "text-text-muted hover:bg-surface-secondary hover:text-text-primary"
                                      }`}
                                    >
                                      <grandchild.icon
                                        size={13}
                                        weight={
                                          isGrandchildActive
                                            ? "fill"
                                            : "regular"
                                        }
                                      />
                                      <span className="whitespace-nowrap">
                                        {grandchild.label}
                                      </span>
                                      {grandchild.status && (
                                        <span className="ml-auto rounded bg-surface-tertiary px-1 py-0.5 text-[7px] font-black uppercase tracking-wide text-text-muted">
                                          {grandchild.status}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                        return (
                          <button
                            key={child.path || child.label}
                            onClick={() => handleMenuClick(child.path)}
                            className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[11px] transition-all duration-200 ${
                              isChildActive
                                ? "bg-linear-to-r from-accent to-accent/90 text-white font-semibold dark:from-white dark:to-slate-100 dark:text-slate-900"
                                : "text-text-muted hover:bg-surface-secondary hover:text-text-primary"
                            }`}
                          >
                            <child.icon
                              size={14}
                              weight={isChildActive ? "fill" : "regular"}
                            />
                            <span className="whitespace-nowrap">
                              {child.label}
                            </span>
                            {child.badge > 0 && (
                              <span className="ml-auto rounded-full bg-red-600 px-1.5 py-0.5 text-[8px] font-bold text-white">
                                {child.badge > 9 ? "9+" : child.badge}
                              </span>
                            )}
                            {isChildActive && (
                              <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white dark:bg-slate-900" />
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
                    expanded
                      ? "mt-0.5 max-h-[34rem] translate-y-0 opacity-100"
                      : "max-h-0 -translate-y-1 opacity-0"
                  }`}
                >
                  <div className="ml-3 space-y-0.5 border-l-2 border-border py-0.5 pl-3">
                    {item.children.map((child) => {
                      const childHasChildren =
                        child.children && child.children.length > 0;
                      const isChildActive = childHasChildren
                        ? isParentActive(child.children)
                        : isActivePath(child.path);
                      const childExpanded =
                        childHasChildren && isExpanded(child.id);
                      if (childHasChildren) {
                        return (
                          <div key={child.id || child.label}>
                            <button
                              type="button"
                              aria-expanded={childExpanded}
                              onClick={() => toggleExpanded(child.id)}
                              className={`group flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[11px] transition-colors ${
                                isChildActive
                                  ? "bg-accent/10 font-semibold text-accent"
                                  : "text-text-muted hover:bg-surface-secondary hover:text-text-primary"
                              }`}
                            >
                              <child.icon
                                size={14}
                                weight={isChildActive ? "fill" : "regular"}
                              />
                              <span className="flex-1">{child.label}</span>
                              <CaretDownIcon
                                size={12}
                                weight="bold"
                                className={`transition-transform ${
                                  childExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                            <div
                              className={`grid transition-[grid-template-rows,opacity] duration-200 ${
                                childExpanded
                                  ? "grid-rows-[1fr] opacity-100"
                                  : "grid-rows-[0fr] opacity-0"
                              }`}
                            >
                              <div className="overflow-hidden">
                                <div className="ml-4 space-y-0.5 border-l border-border py-1 pl-2">
                                  {child.children.map((grandchild) => {
                                    const isGrandchildActive = isActivePath(
                                      grandchild.path,
                                    );
                                    return (
                                      <button
                                        key={grandchild.path}
                                        type="button"
                                        disabled={grandchild.disabled}
                                        title={grandchild.description}
                                        aria-label={grandchild.disabled
                                          ? `${grandchild.label} — ${grandchild.description}`
                                          : grandchild.label}
                                        onClick={() =>
                                          handleMenuClick(grandchild.path)
                                        }
                                        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[10px] transition-colors ${
                                          grandchild.disabled
                                            ? "cursor-not-allowed text-text-muted opacity-50"
                                            : isGrandchildActive
                                            ? "bg-accent text-white font-semibold dark:bg-white dark:text-slate-900"
                                            : "text-text-muted hover:bg-surface-secondary hover:text-text-primary"
                                        }`}
                                      >
                                        <grandchild.icon
                                          size={13}
                                          weight={
                                            isGrandchildActive
                                              ? "fill"
                                              : "regular"
                                          }
                                        />
                                        <span className="flex-1">
                                          {grandchild.label}
                                        </span>
                                        {grandchild.status && (
                                          <span className="rounded bg-surface-tertiary px-1 py-0.5 text-[7px] font-black uppercase tracking-wide text-text-muted">
                                            {grandchild.status}
                                          </span>
                                        )}
                                        {grandchild.badge > 0 && (
                                          <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[8px] font-bold text-white">
                                            {grandchild.badge > 9
                                              ? "9+"
                                              : grandchild.badge}
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <button
                          key={child.path || child.label}
                          onClick={() => handleMenuClick(child.path)}
                          className={`group flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[11px] transition-all duration-200 ${
                            isChildActive
                              ? "bg-linear-to-r from-accent to-accent/90 text-white font-semibold dark:from-white dark:to-slate-100 dark:text-slate-900"
                              : "text-text-muted hover:bg-surface-secondary hover:text-text-primary"
                          }`}
                        >
                          <child.icon
                            size={14}
                            weight={isChildActive ? "fill" : "regular"}
                          />
                          <span className="flex-1">{child.label}</span>
                          {child.badge > 0 && (
                            <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${
                              isChildActive
                                ? "bg-white/15 text-white dark:bg-slate-900/10 dark:text-slate-900"
                                : "bg-red-600 text-white"
                            }`}>
                              {child.badge > 9 ? "9+" : child.badge}
                            </span>
                          )}
                          {isChildActive && (
                            <div className="h-1.5 w-1.5 rounded-full bg-white dark:bg-slate-900" />
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
      <div className="mt-auto space-y-0.5 border-t border-border bg-surface-secondary/50 p-2">
        <button
          onClick={() => handleMenuClick("/profil")}
          className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-text-secondary transition-all duration-200 hover:bg-surface hover:text-text-primary ${collapsed ? "justify-center !px-2 !gap-0" : ""}`}
          title={collapsed ? "Profil Saya" : undefined}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-blue-600">
            <UserIcon size={15} weight="bold" className="text-surface" />
          </div>
          {!collapsed && (
            <span className="font-medium whitespace-nowrap">Profil Saya</span>
          )}
        </button>
        <button
          onClick={handleLogout}
          className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-text-muted transition-all duration-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 ${collapsed ? "justify-center !px-2 !gap-0" : ""}`}
          title={collapsed ? "Keluar" : undefined}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-tertiary transition-colors group-hover:bg-red-100 dark:group-hover:bg-red-900/30">
            <SignOutIcon
              size={15}
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
