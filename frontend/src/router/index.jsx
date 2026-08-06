/* eslint-disable react-refresh/only-export-components -- Router modules intentionally define route wrapper components. */
import { createHashRouter, Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";

// Layouts
import PublicLayout from "../layouts/PublicLayout";
import RootLayout from "../layouts/RootLayout";
import { useAuthStore } from "../stores/authStore";
import { normalizeRole } from "../utils/permissions";
import { RENTAL_FEATURE_ENABLED } from "../config/featureFlags";

const CHUNK_RELOAD_KEY = "bhumi-satya-chunk-reload-at";
const CHUNK_RELOAD_COOLDOWN_MS = 60_000;

// Recover once from stale chunks after deployment, then surface the real error.
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    try {
      const component = await componentImport();
      window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      return component;
    } catch (error) {
      const lastReloadAt = Number(
        window.sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0,
      );
      const canReload = Date.now() - lastReloadAt > CHUNK_RELOAD_COOLDOWN_MS;

      if (canReload) {
        window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
        window.location.reload();

        // If an extension blocks reload, stop the permanent spinner and expose
        // the import error to React Router after a short grace period.
        return new Promise((_, reject) => {
          window.setTimeout(() => reject(error), 8_000);
        });
      }

      window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      throw error;
    }
  });

// Pages - Public (lazy loaded for better initial load)
const LandingPage = lazyWithRetry(() => import("../pages/LandingPage"));
const PublicMapPage = lazyWithRetry(() => import("../pages/PublicMapPage"));
const PublicSewaPage = lazyWithRetry(() => import("../pages/PublicSewaPage"));

// Lazy-loaded pages (code-split per route)
const DashboardPage = lazyWithRetry(() => import("../pages/DashboardPage"));
const MapPage = lazyWithRetry(() => import("../pages/MapPage"));
const Kelola3dPage = lazyWithRetry(() => import("../pages/Kelola3dPage"));
const Kelola3dDetailPage = lazyWithRetry(() => import("../pages/Kelola3dDetailPage"));
const RiwayatPage = lazyWithRetry(() => import("../pages/RiwayatPage"));
const NotifikasiPage = lazyWithRetry(() => import("../pages/NotifikasiPage"));
const BackupPage = lazyWithRetry(() => import("../pages/BackupPage"));
const ProfilPage = lazyWithRetry(() => import("../pages/ProfilPage"));
const PengaturanPage = lazyWithRetry(() => import("../pages/PengaturanPage"));
const DokumentasiPage = lazyWithRetry(() => import("../pages/DokumentasiPage"));
const UserManagementPage = lazyWithRetry(() => import("../pages/UserManagementPage"));
const AssetPage = lazyWithRetry(() => import("../pages/aset/AssetPage"));
const AssetFormPage = lazyWithRetry(() => import("../pages/aset/AssetFormPage"));
const DataLegalPage = lazyWithRetry(() => import("../pages/aset/DataLegalPage"));
const DataFisikPage = lazyWithRetry(() => import("../pages/aset/DataFisikPage"));
const DataKibPage = lazyWithRetry(() => import("../pages/aset/DataKibPage"));
const DataPajakPage = lazyWithRetry(() => import("../pages/aset/DataPajakPage"));
const DataAdministratifPage = lazyWithRetry(
  () => import("../pages/aset/DataAdministratifPage"),
);
const DataSpasialPage = lazyWithRetry(() => import("../pages/aset/DataSpasialPage"));
const OrthophotoPage = lazyWithRetry(() => import("../pages/OrthophotoPage"));
const PenyewaanPage = lazyWithRetry(() => import("../pages/sewa/PenyewaanPage"));
const SewaDetailPage = lazyWithRetry(() => import("../pages/sewa/SewaDetailPage"));
const PermintaanPage = lazyWithRetry(() => import("../pages/sewa/PermintaanPage"));
const AsetTersediaPage = lazyWithRetry(
  () => import("../pages/masyarakat/AsetTersediaPage"),
);
const SewaDiajukanPage = lazyWithRetry(
  () => import("../pages/masyarakat/SewaDiajukanPage"),
);
const SewaDisetujuiPage = lazyWithRetry(
  () => import("../pages/masyarakat/SewaDisetujuiPage"),
);

// Route Guards
import ProtectedRoute from "./ProtectedRoute";
import RoleGuard from "./RoleGuard";

// Suspense wrapper for lazy routes
function LazyPage({ children }) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

function LegacyMasyarakatLoginRedirect() {
  const location = useLocation();
  if (!RENTAL_FEATURE_ENABLED) {
    return <Navigate to="/beranda" replace />;
  }

  const mode =
    new URLSearchParams(location.search).get("mode") === "register"
      ? "register"
      : "login";

  return (
    <Navigate
      to={`/login?mode=${mode}`}
      replace
      state={{ openLoginPanel: true, authMode: mode }}
    />
  );
}

function HomeRedirect() {
  const user = useAuthStore((state) => state.user);
  const isMasyarakat = normalizeRole(user?.role) === "masyarakat";
  const path = isMasyarakat
    ? RENTAL_FEATURE_ENABLED
      ? "/sewa/aset-tersedia"
      : "/beranda"
    : "/dashboard";
  return <Navigate to={path} replace />;
}

function DashboardRoute() {
  const user = useAuthStore((state) => state.user);
  if (normalizeRole(user?.role) === "masyarakat") {
    return (
      <Navigate
        to={RENTAL_FEATURE_ENABLED ? "/sewa/aset-tersedia" : "/beranda"}
        replace
      />
    );
  }

  return (
    <LazyPage>
      <DashboardPage />
    </LazyPage>
  );
}

// Router configuration using createHashRouter
const router = createHashRouter([
  // Public routes
  {
    element: <PublicLayout />,
    children: [
      {
        path: "/beranda",
        element: (
          <LazyPage>
            <LandingPage />
          </LazyPage>
        ),
      },
      {
        path: "/sewa-tersedia",
        element: <Navigate to="/beranda" replace />,
      },
      {
        path: "/login",
        element: (
          <LazyPage>
            <LandingPage />
          </LazyPage>
        ),
      },
      {
        path: "/peta-publik",
        element: (
          <LazyPage>
            <PublicMapPage />
          </LazyPage>
        ),
      },
      {
        path: "/dokumentasi",
        element: (
          <LazyPage>
            <DokumentasiPage />
          </LazyPage>
        ),
      },
      {
        path: "/sewa-aset",
        element: RENTAL_FEATURE_ENABLED ? (
          <LazyPage>
            <PublicSewaPage />
          </LazyPage>
        ) : (
          <Navigate to="/beranda" replace />
        ),
      },
    ],
  },
  {
    path: "/masyarakat/login",
    element: <LegacyMasyarakatLoginRedirect />,
  },
  // Protected routes with Root Layout
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <RootLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <HomeRedirect />,
      },
      {
        path: "dashboard",
        element: <DashboardRoute />,
      },
      // Kelola Aset - Overview & Substansi
      {
        path: "aset",
        element: (
          <RoleGuard menuId="aset">
            <LazyPage>
              <AssetPage />
            </LazyPage>
          </RoleGuard>
        ),
      },
      {
        path: "aset/tambah",
        element: (
          <RoleGuard menuId="aset">
            <LazyPage>
              <AssetFormPage />
            </LazyPage>
          </RoleGuard>
        ),
      },
      {
        path: "aset/:id/edit",
        element: (
          <RoleGuard menuId="aset">
            <LazyPage>
              <AssetFormPage />
            </LazyPage>
          </RoleGuard>
        ),
      },
      {
        path: "aset/:id/kelola",
        element: (
          <RoleGuard menuId="aset">
            <LazyPage>
              <AssetFormPage />
            </LazyPage>
          </RoleGuard>
        ),
      },
      {
        path: "aset/legal",
        element: (
          <RoleGuard menuId="aset">
            <LazyPage>
              <DataLegalPage />
            </LazyPage>
          </RoleGuard>
        ),
      },
      {
        path: "aset/fisik",
        element: (
          <RoleGuard menuId="aset">
            <LazyPage>
              <DataFisikPage />
            </LazyPage>
          </RoleGuard>
        ),
      },
      {
        path: "aset/kib",
        element: (
          <RoleGuard menuId="aset">
            <LazyPage>
              <DataKibPage />
            </LazyPage>
          </RoleGuard>
        ),
      },
      {
        path: "aset/pajak",
        element: (
          <RoleGuard menuId="aset">
            <LazyPage>
              <DataPajakPage />
            </LazyPage>
          </RoleGuard>
        ),
      },
      {
        path: "aset/administratif",
        element: (
          <RoleGuard menuId="aset">
            <LazyPage>
              <DataAdministratifPage />
            </LazyPage>
          </RoleGuard>
        ),
      },
      {
        path: "aset/spasial",
        element: (
          <RoleGuard menuId="aset">
            <LazyPage>
              <DataSpasialPage />
            </LazyPage>
          </RoleGuard>
        ),
      },
      {
        path: "orthophoto",
        element: (
          <RoleGuard menuId="aset">
            <LazyPage>
              <OrthophotoPage />
            </LazyPage>
          </RoleGuard>
        ),
      },
      {
        path: "kelola-2d/:id/kelola",
        element: (
          <RoleGuard menuId="aset">
            <LazyPage>
              <AssetFormPage />
            </LazyPage>
          </RoleGuard>
        ),
      },
      {
        path: "kelola-3d",
        element: (
          <RoleGuard menuId="kelola3d">
            <LazyPage>
              <Kelola3dPage />
            </LazyPage>
          </RoleGuard>
        ),
      },
      {
        path: "kelola-3d/:kode3d",
        element: (
          <RoleGuard menuId="kelola3d">
            <LazyPage>
              <Kelola3dDetailPage />
            </LazyPage>
          </RoleGuard>
        ),
      },
      // Sewa Aset
      {
        path: "sewa/penyewaan",
        element: RENTAL_FEATURE_ENABLED ? (
          <RoleGuard menuId="sewa-aset">
            <LazyPage>
              <PenyewaanPage />
            </LazyPage>
          </RoleGuard>
        ) : (
          <Navigate to="/dashboard" replace />
        ),
      },
      {
        path: "sewa/penyewaan/:id",
        element: RENTAL_FEATURE_ENABLED ? (
          <RoleGuard menuId="sewa-aset">
            <LazyPage>
              <SewaDetailPage />
            </LazyPage>
          </RoleGuard>
        ) : (
          <Navigate to="/dashboard" replace />
        ),
      },
      {
        path: "sewa/permintaan",
        element: RENTAL_FEATURE_ENABLED ? (
          <RoleGuard menuId="sewa-aset">
            <LazyPage>
              <PermintaanPage />
            </LazyPage>
          </RoleGuard>
        ) : (
          <Navigate to="/dashboard" replace />
        ),
      },
      {
        path: "sewa/aset-tersedia",
        element: RENTAL_FEATURE_ENABLED ? (
          <RoleGuard menuId="sewa-masyarakat">
            <LazyPage>
              <AsetTersediaPage />
            </LazyPage>
          </RoleGuard>
        ) : (
          <Navigate to="/dashboard" replace />
        ),
      },
      {
        path: "sewa/diajukan",
        element: RENTAL_FEATURE_ENABLED ? (
          <RoleGuard menuId="sewa-masyarakat">
            <LazyPage>
              <SewaDiajukanPage />
            </LazyPage>
          </RoleGuard>
        ) : (
          <Navigate to="/dashboard" replace />
        ),
      },
      {
        path: "sewa/disetujui",
        element: RENTAL_FEATURE_ENABLED ? (
          <RoleGuard menuId="sewa-masyarakat">
            <LazyPage>
              <SewaDisetujuiPage />
            </LazyPage>
          </RoleGuard>
        ) : (
          <Navigate to="/dashboard" replace />
        ),
      },
      {
        path: "pusat-data",
        element: (
          <RoleGuard menuId="aset">
            <Navigate to="/aset" replace />
          </RoleGuard>
        ),
      },
      {
        path: "peta",
        element: (
          <RoleGuard menuId="peta">
            <LazyPage>
              <MapPage />
            </LazyPage>
          </RoleGuard>
        ),
      },
      {
        path: "riwayat",
        element: (
          <RoleGuard menuId="riwayat">
            <LazyPage>
              <RiwayatPage />
            </LazyPage>
          </RoleGuard>
        ),
      },
      {
        path: "notifikasi",
        element: (
          <RoleGuard menuId="notifikasi">
            <LazyPage>
              <NotifikasiPage />
            </LazyPage>
          </RoleGuard>
        ),
      },
      {
        path: "backup",
        element: (
          <RoleGuard menuId="backup">
            <LazyPage>
              <BackupPage />
            </LazyPage>
          </RoleGuard>
        ),
      },
      {
        path: "profil",
        element: (
          <LazyPage>
            <ProfilPage />
          </LazyPage>
        ),
      },
      {
        path: "pengaturan",
        element: (
          <RoleGuard menuId="pengaturan">
            <LazyPage>
              <PengaturanPage />
            </LazyPage>
          </RoleGuard>
        ),
      },
      {
        path: "users",
        element: (
          <RoleGuard menuId="user">
            <LazyPage>
              <UserManagementPage />
            </LazyPage>
          </RoleGuard>
        ),
      },
    ],
  },

  // Catch all - redirect to dashboard
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);

export default router;
