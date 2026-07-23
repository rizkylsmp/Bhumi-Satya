import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { asetService, riwayatService, userService } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { ChartBarIcon } from "@phosphor-icons/react";

const DashboardIntegratedPanel = lazy(() =>
  import("../components/dashboard/DashboardIntegratedPanel"),
);

const LoadingFallback = () => (
  <div className="flex min-h-72 items-center justify-center rounded-2xl border border-border bg-surface">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-accent border-t-transparent" />
      <span className="text-xs font-semibold text-text-muted">Memuat statistik…</span>
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

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const isAdmin = user?.role?.toLowerCase() === "admin";
      const [asetRes, userRes, riwayatRes, activitiesRes] = await Promise.all([
        asetService.getStats(),
        isAdmin ? userService.getStats() : Promise.resolve(null),
        isAdmin ? riwayatService.getStats() : Promise.resolve(null),
        isAdmin ? riwayatService.getAll({ limit: 5 }) : Promise.resolve(null),
      ]);

      setAsetStats(asetRes.data.data);
      setUserStats(userRes?.data?.data || null);
      setRiwayatStats(riwayatRes?.data?.data || null);
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
  }, [fetchDashboardData]);

  return (
    <div className="min-h-full bg-surface-secondary p-4 md:p-6">
      <div className="mx-auto max-w-[1800px] space-y-5">
        <header className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-accent to-sky-500 text-surface">
            <ChartBarIcon size={24} weight="fill" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-text-primary lg:text-2xl">
              Dashboard Bhumi Satya
            </h1>
            <p className="truncate text-sm text-text-secondary">
              Selamat datang, {user?.nama_lengkap || "Pengguna"}. Statistik aset diperbarui dari pusat data terintegrasi.
            </p>
          </div>
        </header>

        <Suspense fallback={<LoadingFallback />}>
          <DashboardIntegratedPanel
            loading={loading}
            asetStats={asetStats}
            userStats={userStats}
            riwayatStats={riwayatStats}
            recentActivities={recentActivities}
          />
        </Suspense>
      </div>
    </div>
  );
}
