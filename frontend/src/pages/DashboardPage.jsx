import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import toast from "react-hot-toast";
import {
  asetService,
  userService,
  riwayatService,
  petaService,
} from "../services/api";
import { useAuthStore } from "../stores/authStore";
import {
  ChartBarIcon,
  MapTrifoldIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";

// Lazy load heavy components (code splitting)
const AssetMapDisplay = lazy(() => import("../components/map/AssetMapDisplay"));
const DashboardIntegratedPanel = lazy(() =>
  import("../components/dashboard/DashboardIntegratedPanel"),
);

// Loading fallback component
const LoadingFallback = ({ height = "100%" }) => (
  <div
    className="flex items-center justify-center bg-surface-secondary/50 rounded-lg"
    style={{ height }}
  >
    <div className="flex flex-col items-center gap-2">
      <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-text-muted">Memuat...</span>
    </div>
  </div>
);

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [asetStats, setAsetStats] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [riwayatStats, setRiwayatStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);

  const [mapAssets, setMapAssets] = useState([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [showStatsPanel, setShowStatsPanel] = useState(false);

  const fetchMapMarkers = useCallback(async () => {
    setMapLoading(true);
    try {
      const response = await petaService.getMarkers();
      const markers = response.data.data || [];
      const transformed = markers.map((marker) => ({
        id: marker.id,
        kode_aset: marker.kode,
        nama_aset: marker.nama,
        lokasi: marker.lokasi,
        status: marker.status?.toLowerCase().replace(/\s+/g, "_") || "aktif",
        status_sertifikat: marker.status_sertifikat || null,
        jenis_masalah: marker.jenis_masalah || null,
        nomor_sertifikat: marker.nomor_sertifikat || null,
        luas: marker.luas?.toString() || "0",
        tahun: marker.tahun?.toString() || "-",
        jenis_aset: marker.jenis,
        jenis_hak: marker.jenis_hak || null,
        kecamatan: marker.kecamatan || null,
        desa_kelurahan: marker.desa_kelurahan || null,
        penggunaan_saat_ini: marker.penggunaan_saat_ini || null,
        luas_lapangan: marker.luas_lapangan || null,
        opd_pengguna: marker.opd_pengguna || null,
        atas_nama: marker.atas_nama || null,
        keterangan: marker.keterangan || null,
        nib: marker.nib || null,
        latitude: marker.lat,
        longitude: marker.lng,
        polygon: marker.polygon || null,
      }));
      setMapAssets(transformed);
    } catch (error) {
      console.error("Error fetching map markers:", error);
      // Retry once after 2 seconds on failure
      setTimeout(() => fetchMapMarkers(), 2000);
    } finally {
      setMapLoading(false);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const role = user?.role?.toLowerCase();
      const isAdmin = role === "admin";
      const canViewRiwayat = isAdmin;

      const promises = [asetService.getStats()];
      promises.push(isAdmin ? userService.getStats() : Promise.resolve(null));
      promises.push(
        canViewRiwayat ? riwayatService.getStats() : Promise.resolve(null),
      );
      promises.push(
        canViewRiwayat
          ? riwayatService.getAll({ limit: 5 })
          : Promise.resolve(null),
      );

      const [asetRes, userRes, riwayatRes, activitiesRes] =
        await Promise.all(promises);

      setAsetStats(asetRes.data.data);
      if (userRes) setUserStats(userRes.data.data);
      if (riwayatRes) setRiwayatStats(riwayatRes.data.data);
      setRecentActivities(activitiesRes?.data?.data || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchDashboardData();
    fetchMapMarkers();
  }, [fetchDashboardData, fetchMapMarkers]);

  const panelProps = {
    loading,
    asetStats,
    userStats,
    riwayatStats,
    recentActivities,
  };

  return (
    <div className="relative h-full overflow-hidden">
      {/* ==================== FULL-SCREEN MAP ==================== */}
      <div id="map-fullscreen-container" className="absolute inset-0">
        <Suspense fallback={<LoadingFallback />}>
          <AssetMapDisplay assets={mapAssets} mode="integrated" />
        </Suspense>
        {mapLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-secondary z-10">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-12 h-12">
                <div className="animate-spin w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full" />
                <MapTrifoldIcon
                  size={24}
                  weight="fill"
                  className="text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                />
              </div>
              <p className="text-sm text-text-muted">Memuat peta...</p>
            </div>
          </div>
        )}
      </div>

      {/* ==================== STATS PANEL TOGGLE ==================== */}
      {!showStatsPanel && (
        <button
          onClick={() => setShowStatsPanel(true)}
          className="absolute bottom-16 right-4 z-10 bg-surface/90 backdrop-blur-sm rounded-lg border border-border shadow-lg px-3 py-2 flex items-center gap-2 hover:bg-surface transition-all group"
        >
          <ChartBarIcon size={16} weight="fill" className="text-accent" />
          <span className="text-xs font-semibold text-text-primary hidden sm:inline">
            Statistik
          </span>
          <CaretLeftIcon
            size={14}
            weight="bold"
            className="text-text-muted group-hover:text-accent transition-colors"
          />
        </button>
      )}

      {/* ==================== STATS OVERLAY ==================== */}
      <div
        className={`absolute inset-0 z-30 bg-surface/98 backdrop-blur-md flex flex-col overflow-hidden transition-transform duration-300 ease-in-out ${
          showStatsPanel ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Panel Header */}
        <div className="px-4 lg:px-6 py-3 border-b border-border flex items-center justify-between bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-accent to-accent/70 rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
              <ChartBarIcon size={20} weight="fill" className="text-surface" />
            </div>
            <div>
              <h2 className="font-bold text-text-primary">
                Dashboard Bhumi Satya
              </h2>
              <p className="text-xs text-text-muted">
                Selamat datang, {user?.nama_lengkap || "User"} 👋
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowStatsPanel(false)}
            className="flex items-center gap-1.5 px-3 py-2 hover:bg-surface-tertiary rounded-lg transition-colors text-text-secondary group"
          >
            <span className="text-xs font-medium group-hover:text-text-primary">
              Tutup
            </span>
            <CaretRightIcon
              size={16}
              weight="bold"
              className="group-hover:text-accent transition-colors"
            />
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Suspense fallback={<LoadingFallback height="300px" />}>
            <DashboardIntegratedPanel {...panelProps} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
