import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  aset3dCatalogService,
  asetService,
  riwayatService,
  sewaService,
} from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { ChartBarIcon, PulseIcon } from "@phosphor-icons/react";

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
  const [sewaStats, setSewaStats] = useState(null);
  const [totalDigitalTwin, setTotalDigitalTwin] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const isAdmin = user?.role?.toLowerCase() === "admin";
      const [
        asetRes,
        sewaRes,
        digitalTwinRes,
        activitiesRes,
      ] = await Promise.all([
        asetService.getStats(),
        sewaService.getStats(),
        aset3dCatalogService.list({ page: 1, limit: 1 }),
        isAdmin ? riwayatService.getAll({ limit: 5 }) : Promise.resolve(null),
      ]);

      setAsetStats(asetRes.data.data);
      setSewaStats(sewaRes.data.data);
      setTotalDigitalTwin(
        Number(digitalTwinRes?.data?.pagination?.totalItems) || 0,
      );
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
        <header className="admin-page-header">
          <div className="admin-page-header__identity">
            <span className="admin-page-header__icon bg-linear-to-br from-sky-500 to-indigo-600 text-white">
              <ChartBarIcon size={21} weight="fill" />
            </span>
            <div className="min-w-0">
              <h1 className="admin-page-header__title">
                Dashboard Bhumi Satya
              </h1>
              <p className="admin-page-header__description">
                Ringkasan Digital Twin dan penyewaan.
              </p>
            </div>
          </div>
          <div className="admin-page-header__actions">
            <span className="hidden h-9 shrink-0 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-text-secondary sm:flex">
              <PulseIcon size={15} className="text-emerald-500" weight="fill" />
              Data aktual
            </span>
          </div>
        </header>

        <Suspense fallback={<LoadingFallback />}>
          <DashboardIntegratedPanel
            loading={loading}
            asetStats={asetStats}
            sewaStats={sewaStats}
            totalDigitalTwin={totalDigitalTwin}
            recentActivities={recentActivities}
          />
        </Suspense>
      </div>
    </div>
  );
}
