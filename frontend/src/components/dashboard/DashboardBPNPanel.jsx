import { useNavigate } from "react-router-dom";
import {
  ChartBarIcon,
  MapPinIcon,
  CertificateIcon,
  ScalesIcon,
  RulerIcon,
  ClipboardTextIcon,
  CaretRightIcon,
  ArrowRightIcon,
  EyeIcon,
  PlusIcon,
  PencilSimpleIcon,
  TrashIcon,
  SignInIcon,
  DownloadSimpleIcon,
  ShieldCheckIcon,
  MapTrifoldIcon,
  WarningIcon,
  UsersThreeIcon,
  NotePencilIcon,
} from "@phosphor-icons/react";
import { BarChartComponent, DonutChartComponent } from "../charts";

const formatNumber = (num) => {
  if (!num) return "0";
  return new Intl.NumberFormat("id-ID").format(num);
};

const formatArea = (num) => {
  if (!num) return "0 m²";
  if (num >= 10000) return `${(num / 10000).toFixed(1)} ha`;
  return `${formatNumber(Math.round(num))} m²`;
};

const getActivityBadge = (aksi) => {
  const map = {
    CREATE:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    UPDATE:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    DELETE: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    VIEW: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    LOGIN:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    LOGOUT: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400",
    BACKUP:
      "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
    RESTORE: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400",
  };
  return map[aksi?.toUpperCase()] || "bg-surface-tertiary text-text-secondary";
};

const getActivityIcon = (aksi) => {
  const map = {
    CREATE: PlusIcon,
    UPDATE: PencilSimpleIcon,
    DELETE: TrashIcon,
    VIEW: EyeIcon,
    LOGIN: SignInIcon,
    BACKUP: DownloadSimpleIcon,
  };
  return map[aksi?.toUpperCase()] || ClipboardTextIcon;
};

const getActivityColor = (aksi) => {
  const map = {
    CREATE: "from-emerald-500 to-emerald-600",
    UPDATE: "from-amber-500 to-amber-600",
    DELETE: "from-red-500 to-red-600",
    VIEW: "from-blue-500 to-blue-600",
    LOGIN: "from-purple-500 to-purple-600",
    BACKUP: "from-indigo-500 to-indigo-600",
  };
  return map[aksi?.toUpperCase()] || "from-gray-500 to-gray-600";
};

const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function DashboardBPNPanel({
  loading,
  asetStats,
  userStats,
  riwayatStats,
  recentActivities,
}) {
  const navigate = useNavigate();

  const totalAset = asetStats?.totalAset || 0;
  const totalSertifikat = asetStats?.totalSertifikat || 0;
  const pctSertifikat = totalAset
    ? Math.round((totalSertifikat / totalAset) * 100)
    : 0;

  // Legal problem count
  const masalahHukumCount = Object.entries(asetStats?.byStatusHukum || {})
    .filter(([k]) => k !== "Aman")
    .reduce((s, [, v]) => s + v, 0);
  const totalHukum = Object.values(asetStats?.byStatusHukum || {}).reduce(
    (s, v) => s + v,
    0,
  );

  // Jenis Hak donut chart
  const hakColors = {
    HM: "#3b82f6",
    HPL: "#10b981",
    HP: "#f59e0b",
    "Tanah Negara": "#8b5cf6",
    HGB: "#ec4899",
  };
  const jenisHakData = asetStats?.byJenisHak
    ? Object.entries(asetStats.byJenisHak).map(([name, value]) => ({
        name,
        value,
        color: hakColors[name] || "#6b7280",
      }))
    : [];
  const totalHak = jenisHakData.reduce((s, i) => s + i.value, 0);

  // Status Hukum bar chart
  const statusHukumColors = {
    Aman: "#10b981",
    Sengketa: "#ef4444",
    "Dalam Proses Sertipikasi": "#f59e0b",
    Diblokir: "#6b7280",
  };
  const statusHukumData = asetStats?.byStatusHukum
    ? Object.entries(asetStats.byStatusHukum)
        .map(([name, value]) => ({
          name: name.length > 18 ? name.slice(0, 18) + "…" : name,
          fullName: name,
          value,
          color: statusHukumColors[name] || "#8b5cf6",
        }))
        .sort((a, b) => b.value - a.value)
    : [];

  // Sebaran kecamatan
  const kecamatanData = asetStats?.byKecamatan
    ? Object.entries(asetStats.byKecamatan)
        .map(([name, value]) => ({
          name: name.length > 15 ? name.slice(0, 15) + "…" : name,
          fullName: name,
          value,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
    : [];

  const openKecamatanOnMap = (kecamatan) => {
    if (!kecamatan) return;
    navigate("/peta", {
      state: {
        filterKecamatan: kecamatan,
      },
    });
  };

  // Jenis masalah
  const jenisMasalahData = asetStats?.byJenisMasalah
    ? Object.entries(asetStats.byJenisMasalah).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const statsCards = [
    {
      label: "Total Bidang",
      value: formatNumber(totalAset),
      icon: MapPinIcon,
      gradient: "from-blue-500 to-blue-600",
      detail: `${formatArea(asetStats?.totalLuas)} total luas bidang`,
    },
    {
      label: "Tersertifikasi",
      value: formatNumber(totalSertifikat),
      icon: CertificateIcon,
      gradient: "from-emerald-500 to-emerald-600",
      detail: `${pctSertifikat}% dari total bidang`,
      progress: pctSertifikat,
      progressColor: "bg-emerald-500",
    },
    {
      label: "Masalah Hukum",
      value: formatNumber(masalahHukumCount),
      icon: ScalesIcon,
      gradient: "from-red-500 to-red-600",
      detail:
        jenisMasalahData
          .map((i) => `${i.value} ${i.name.toLowerCase()}`)
          .join(", ") || "Tidak ada masalah",
    },
    {
      label: "Total Luas",
      value: formatArea(asetStats?.totalLuas),
      icon: RulerIcon,
      gradient: "from-cyan-500 to-cyan-600",
      detail: `${Object.keys(asetStats?.byKecamatan || {}).length} kecamatan`,
    },
  ];

  return (
    <div className="space-y-4">
      {/* ===== STAT CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-surface rounded-xl border border-border p-3.5 relative overflow-hidden"
            >
              <div
                className={`absolute -right-4 -top-4 w-16 h-16 bg-linear-to-br ${stat.gradient} rounded-full opacity-5`}
              />
              {loading ? (
                <div className="animate-pulse space-y-2">
                  <div className="w-8 h-8 bg-surface-secondary rounded-lg" />
                  <div className="h-5 bg-surface-secondary rounded w-16" />
                  <div className="h-3 bg-surface-secondary rounded w-20" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-8 h-8 bg-linear-to-br ${stat.gradient} rounded-lg flex items-center justify-center shadow-md`}
                    >
                      <Icon size={16} weight="fill" className="text-surface" />
                    </div>
                    <span className="text-[10px] font-medium text-text-muted">
                      {stat.label}
                    </span>
                  </div>
                  <div className="text-xl font-bold text-text-primary">
                    {stat.value}
                  </div>
                  <span className="text-[10px] text-text-muted truncate block mt-1">
                    {stat.detail}
                  </span>
                  {stat.progress !== undefined && (
                    <div className="mt-2">
                      <div className="w-full h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full ${stat.progressColor} rounded-full transition-all duration-500`}
                          style={{
                            width: `${Math.min(stat.progress, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* ===== CHARTS ROW ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Jenis Hak - Donut */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-text-primary">
              Distribusi Jenis Hak
            </h3>
            <button
              onClick={() => navigate("/aset")}
              className="text-[10px] text-accent hover:underline font-medium flex items-center gap-1"
            >
              Detail <ArrowRightIcon size={10} />
            </button>
          </div>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-3 border-accent border-t-transparent rounded-full" />
            </div>
          ) : jenisHakData.length > 0 ? (
            <div>
              <DonutChartComponent
                data={jenisHakData}
                height={160}
                innerRadius={40}
                outerRadius={65}
                showLabel={true}
                centerText={{ value: totalHak, label: "Bidang" }}
              />
              <div className="mt-3 space-y-1.5">
                {jenisHakData.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-text-secondary">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-text-primary">
                        {item.value}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        (
                        {totalHak
                          ? ((item.value / totalHak) * 100).toFixed(0)
                          : 0}
                        %)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-text-muted">
              <div className="text-center">
                <ShieldCheckIcon
                  size={32}
                  className="mx-auto mb-2 opacity-50"
                />
                <span className="text-xs">Belum ada data jenis hak</span>
              </div>
            </div>
          )}
        </div>

        {/* Status Hukum - Bar */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-text-primary">
              Status Hukum
            </h3>
            <span className="text-[10px] text-text-muted bg-surface-secondary px-2 py-0.5 rounded-md">
              {statusHukumData.length} kategori
            </span>
          </div>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-3 border-accent border-t-transparent rounded-full" />
            </div>
          ) : statusHukumData.length > 0 ? (
            <div>
              <BarChartComponent
                data={statusHukumData}
                dataKey="value"
                xAxisKey="name"
                color="#ef4444"
                height={160}
                horizontal={true}
              />
              {/* Quick insight */}
              <div className="mt-3 p-2.5 bg-surface-secondary rounded-lg">
                <div className="flex items-center gap-2">
                  {masalahHukumCount > 0 ? (
                    <>
                      <WarningIcon
                        size={14}
                        weight="fill"
                        className="text-red-500 shrink-0"
                      />
                      <span className="text-[10px] text-text-secondary">
                        {masalahHukumCount} bidang memiliki masalah hukum dari{" "}
                        {totalHukum} tercatat.
                      </span>
                    </>
                  ) : (
                    <>
                      <ShieldCheckIcon
                        size={14}
                        weight="fill"
                        className="text-emerald-500 shrink-0"
                      />
                      <span className="text-[10px] text-text-secondary">
                        Semua bidang dalam status hukum aman.
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-text-muted">
              <div className="text-center">
                <ScalesIcon size={32} className="mx-auto mb-2 opacity-50" />
                <span className="text-xs">Belum ada data status hukum</span>
              </div>
            </div>
          )}
        </div>

        {/* Sebaran Kecamatan - Bar */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-text-primary">
              Sebaran per Kecamatan
            </h3>
            <span className="text-[10px] text-text-muted bg-surface-secondary px-2 py-0.5 rounded-md">
              {Object.keys(asetStats?.byKecamatan || {}).length} area
            </span>
          </div>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-3 border-accent border-t-transparent rounded-full" />
            </div>
          ) : kecamatanData.length > 0 ? (
            <div>
              <BarChartComponent
                data={kecamatanData}
                dataKey="value"
                xAxisKey="name"
                color="#8b5cf6"
                height={160}
                horizontal={true}
                onBarClick={(entry) => openKecamatanOnMap(entry?.fullName)}
              />
              <div className="mt-3 space-y-1.5">
                {kecamatanData.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    role="button"
                    tabIndex={0}
                    onClick={() => openKecamatanOnMap(item.fullName)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openKecamatanOnMap(item.fullName);
                      }
                    }}
                    className="flex items-center justify-between p-1.5 rounded-lg hover:bg-surface-secondary transition-colors cursor-pointer"
                    title={`Lihat aset di Kecamatan ${item.fullName}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-purple-500 rounded-full opacity-80" />
                      <span className="text-xs text-text-secondary">
                        {item.fullName}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-text-primary">
                      {item.value} bidang
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-text-muted">
              <div className="text-center">
                <MapTrifoldIcon size={32} className="mx-auto mb-2 opacity-50" />
                <span className="text-xs">Belum ada data kecamatan</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== SERTIFIKASI PROGRESS + ACTIVITIES ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sertifikasi Progress */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-text-primary">
              Progress Sertifikasi
            </h3>
            <span
              className={`text-xs font-bold ${pctSertifikat >= 80 ? "text-emerald-600 dark:text-emerald-400" : pctSertifikat >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}
            >
              {pctSertifikat}%
            </span>
          </div>
          {loading ? (
            <div className="animate-pulse h-16 bg-surface-secondary rounded-lg" />
          ) : (
            <>
              <div className="w-full h-3 bg-surface-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${pctSertifikat}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-text-muted">
                  {totalSertifikat} tersertifikasi
                </span>
                <span className="text-[10px] text-text-muted">
                  {totalAset - totalSertifikat} belum
                </span>
              </div>

              {/* Extra stats */}
              <div className="mt-3 space-y-2">
                {userStats && (
                  <div className="flex items-center justify-between p-2 bg-surface-secondary rounded-lg">
                    <div className="flex items-center gap-2">
                      <UsersThreeIcon size={14} className="text-indigo-500" />
                      <span className="text-[10px] text-text-secondary">
                        Pengguna
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-text-primary">
                      {formatNumber(userStats.totalUsers)}
                    </span>
                  </div>
                )}
                {riwayatStats && (
                  <div className="flex items-center justify-between p-2 bg-surface-secondary rounded-lg">
                    <div className="flex items-center gap-2">
                      <NotePencilIcon size={14} className="text-emerald-500" />
                      <span className="text-[10px] text-text-secondary">
                        Aktivitas
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-text-primary">
                      {formatNumber(riwayatStats?.totalActivities)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3 p-2.5 bg-surface-secondary rounded-lg">
                <div className="flex items-center gap-2">
                  <CertificateIcon
                    size={14}
                    weight="fill"
                    className="text-emerald-500 shrink-0"
                  />
                  <span className="text-[10px] text-text-secondary">
                    {totalSertifikat} dari {totalAset} bidang tanah sudah
                    memiliki sertifikat.
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Aktivitas Terbaru */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardTextIcon
                size={16}
                weight="fill"
                className="text-accent"
              />
              <h3 className="font-semibold text-sm text-text-primary">
                Aktivitas Terbaru
              </h3>
            </div>
            <button
              onClick={() => navigate("/riwayat")}
              className="text-[10px] text-accent hover:underline font-medium flex items-center gap-1"
            >
              Semua <CaretRightIcon size={10} />
            </button>
          </div>
          {loading ? (
            <div className="p-4 space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-surface-secondary rounded-lg" />
                  <div className="flex-1">
                    <div className="h-3 bg-surface-secondary rounded w-1/3 mb-1" />
                    <div className="h-2 bg-surface-secondary rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivities.length > 0 ? (
            <div className="divide-y divide-border">
              {recentActivities.slice(0, 5).map((activity, idx) => {
                const Icon = getActivityIcon(activity.aksi);
                return (
                  <div
                    key={activity.id_riwayat || idx}
                    className="px-4 py-3 hover:bg-surface-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 bg-linear-to-br ${getActivityColor(activity.aksi)} rounded-lg flex items-center justify-center shadow-sm`}
                      >
                        <Icon
                          size={14}
                          weight="bold"
                          className="text-surface"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-medium text-xs text-text-primary">
                            {activity.user?.username ||
                              activity.user_id ||
                              "User"}
                          </span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${getActivityBadge(activity.aksi)}`}
                          >
                            {activity.aksi}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-muted truncate">
                          {activity.keterangan ||
                            `${activity.aksi} pada tabel ${activity.tabel}`}
                        </p>
                      </div>
                      <p className="text-[10px] text-text-muted shrink-0">
                        {formatDateTime(activity.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-text-muted">
              <ClipboardTextIcon
                size={32}
                className="mx-auto mb-2 opacity-50"
              />
              <span className="text-xs">Belum ada aktivitas</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
