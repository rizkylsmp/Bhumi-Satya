import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatCompactCurrency,
  formatCurrency as formatFullCurrency,
  formatNumber,
} from "../../utils/format";
import {
  CaretRightIcon,
  BuildingsIcon,
  ClipboardTextIcon,
  CubeIcon,
  CurrencyDollarIcon,
  DatabaseIcon,
  DownloadSimpleIcon,
  EyeIcon,
  MapTrifoldIcon,
  PencilSimpleIcon,
  PlusIcon,
  HandshakeIcon,
  SignInIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { RENTAL_FEATURE_ENABLED } from "../../config/featureFlags";

const CHART_COLORS = {
  accent: "#0ea5e9",
  blue: "#3b82f6",
  cyan: "#06b6d4",
  emerald: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  violet: "#8b5cf6",
  slate: "#64748b",
};

const formatCurrency = (value, compact = false) =>
  compact
    ? formatCompactCurrency(Number(value) || 0)
    : formatFullCurrency(Number(value) || 0);

const getPercentage = (value, total) =>
  total ? Math.round((Number(value || 0) / total) * 100) : 0;

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

const activityStyles = {
  CREATE: {
    icon: PlusIcon,
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    iconClass: "bg-emerald-500",
  },
  UPDATE: {
    icon: PencilSimpleIcon,
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    iconClass: "bg-amber-500",
  },
  DELETE: {
    icon: TrashIcon,
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    iconClass: "bg-red-500",
  },
  VIEW: {
    icon: EyeIcon,
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    iconClass: "bg-blue-500",
  },
  LOGIN: {
    icon: SignInIcon,
    badge:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    iconClass: "bg-violet-500",
  },
  BACKUP: {
    icon: DownloadSimpleIcon,
    badge:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    iconClass: "bg-indigo-500",
  },
};

function ChartTooltip({
  active,
  payload,
  label,
  suffix = "bidang",
  valueFormatter,
}) {
  if (!active || !payload?.length) return null;

  const item = payload[0];
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs">
      <p className="font-semibold text-text-primary">
        {item.payload?.fullName || label || item.name}
      </p>
      <p className="mt-0.5 text-text-secondary">
        {valueFormatter ? valueFormatter(item.value) : formatNumber(item.value)}{" "}
        {suffix}
      </p>
    </div>
  );
}

function LoadingChart({ height = "h-64" }) {
  return (
    <div className={`${height} animate-pulse rounded-xl bg-surface-secondary`} />
  );
}

function EmptyChart({ icon: Icon, message }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center text-center text-text-muted">
      <Icon size={34} className="mb-2 opacity-50" />
      <p className="text-xs">{message}</p>
    </div>
  );
}

function PanelHeader({ title, description, action }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-text-primary">{title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-text-muted">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

export default function DashboardIntegratedPanel({
  loading,
  sewaStats,
  totalDigitalTwin,
  spatialStats,
  recentActivities,
}) {
  const navigate = useNavigate();
  const totalManaged2d = Number(spatialStats?.total) || 0;
  const coordinated = Number(spatialStats?.totalCoordinates) || 0;
  const polygonized = Number(spatialStats?.totalPolygon) || 0;
  const linkedParcels = Number(spatialStats?.totalWithBuildings) || 0;
  const unlinkedParcels = Number(spatialStats?.totalWithoutBuildings) || 0;
  const totalRentals = Number(sewaStats?.total) || 0;
  const availableRentals = Number(sewaStats?.tersedia) || 0;
  const activeRentals =
    (Number(sewaStats?.disewakan) || 0) +
    (Number(sewaStats?.akanBerakhir) || 0);

  const coverageData = [
    {
      name: "Terhubung ke 3D",
      value: linkedParcels,
      color: CHART_COLORS.emerald,
      path: "/kelola-3d",
    },
    {
      name: "Belum terhubung",
      value: unlinkedParcels,
      color: CHART_COLORS.amber,
      path: "/aset/spasial",
    },
  ];

  const rentalStatusData = [
    { name: "Tersedia", value: sewaStats?.tersedia, color: CHART_COLORS.emerald },
    { name: "Diproses", value: sewaStats?.diproses, color: CHART_COLORS.amber },
    { name: "Disewakan", value: sewaStats?.disewakan, color: CHART_COLORS.blue },
    {
      name: "Akan Berakhir",
      value: sewaStats?.akanBerakhir,
      color: CHART_COLORS.red,
    },
    { name: "Berakhir", value: sewaStats?.berakhir, color: CHART_COLORS.slate },
    {
      name: "Dikembalikan",
      value: sewaStats?.dikembalikan,
      color: CHART_COLORS.violet,
    },
  ]
    .map((item) => ({ ...item, value: Number(item.value) || 0 }))
    .filter((item) => item.value > 0);

  const rentalValueData = [
    {
      name: "Total aktif",
      value: Number(sewaStats?.totalNilaiSewa) || 0,
      color: CHART_COLORS.blue,
    },
    {
      name: "Triwulan",
      value: Number(sewaStats?.totalNilaiSewaTriwulan) || 0,
      color: CHART_COLORS.cyan,
    },
    {
      name: "Semester",
      value: Number(sewaStats?.totalNilaiSewaSemester) || 0,
      color: CHART_COLORS.violet,
    },
  ];

  const buildingData = (spatialStats?.buildingsPerParcel || [])
    .map((item) => ({
      name: item.kode_2d,
      fullName: item.kode_2d,
      value: Number(item.building_count) || 0,
    }))
    .filter((item) => item.value > 0);

  const statCards = [
    {
      label: "Data Digital Twin",
      value: formatNumber(totalDigitalTwin),
      detail: "Bangunan 3D yang dikelola dalam sistem",
      icon: CubeIcon,
      path: "/kelola-3d",
      iconClass:
        "from-sky-400 via-blue-500 to-blue-700 dark:from-sky-400 dark:via-blue-500 dark:to-indigo-600",
    },
    {
      label: "Cakupan Spasial",
      value: formatNumber(polygonized),
      detail: `${formatNumber(coordinated)} memiliki koordinat, ${getPercentage(polygonized, totalManaged2d)}% terpetakan`,
      icon: MapTrifoldIcon,
      path: "/aset/spasial",
      iconClass:
        "from-cyan-400 via-sky-500 to-blue-700 dark:from-cyan-400 dark:via-sky-500 dark:to-blue-600",
    },
    {
      label: "Total Bidang 2D",
      value: formatNumber(totalManaged2d),
      detail: "Bidang yang dikelola dalam Digital Twin",
      icon: DatabaseIcon,
      path: "/aset/spasial",
      iconClass:
        "from-blue-400 via-blue-600 to-indigo-700 dark:from-blue-400 dark:via-blue-500 dark:to-indigo-600",
    },
    ...(RENTAL_FEATURE_ENABLED
      ? [
          {
            label: "Tersedia Disewa",
            value: formatNumber(availableRentals),
            detail: `${formatNumber(totalRentals)} unit dalam portofolio sewa`,
            icon: BuildingsIcon,
            path: "/sewa/penyewaan",
            iconClass:
              "from-sky-400 via-blue-500 to-indigo-700 dark:from-sky-400 dark:via-blue-500 dark:to-indigo-600",
          },
          {
            label: "Sewa Aktif",
            value: formatNumber(activeRentals),
            detail: `${formatNumber(sewaStats?.akanBerakhir)} akan berakhir`,
            icon: HandshakeIcon,
            path: "/sewa/penyewaan",
            iconClass:
              "from-cyan-400 via-blue-600 to-indigo-700 dark:from-cyan-400 dark:via-blue-500 dark:to-indigo-600",
          },
        ]
      : []),
  ];

  const openChartPath = (item, fallback) => {
    const path = item?.path || item?.payload?.path || fallback;
    if (path) navigate(path);
  };

  const openBuildingCatalog = (item) => {
    const code = item?.fullName || item?.payload?.fullName;
    const query = code ? `?search=${encodeURIComponent(code)}` : "";
    navigate(`/kelola-3d${query}`);
  };

  return (
    <div className="min-w-0 space-y-4">
      <section
        className={`grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 ${
          RENTAL_FEATURE_ENABLED ? "xl:grid-cols-5" : "xl:grid-cols-3"
        }`}
        aria-label="Ringkasan data"
      >
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              type="button"
              key={stat.label}
              onClick={() => navigate(stat.path)}
              disabled={loading}
              className="min-w-0 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-accent/40 hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait"
              aria-label={`Buka ${stat.label}`}
            >
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-9 w-9 rounded-lg bg-surface-secondary" />
                  <div className="h-6 w-24 rounded bg-surface-secondary" />
                  <div className="h-3 w-32 rounded bg-surface-secondary" />
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br text-white shadow-md shadow-blue-500/20 ring-1 ring-inset ring-white/30 dark:shadow-blue-950/60 dark:ring-blue-200/25 ${stat.iconClass}`}
                    >
                      <Icon size={18} weight="fill" />
                    </span>
                    <span className="text-right text-[11px] font-semibold text-text-muted">
                      {stat.label}
                    </span>
                  </div>
                  <p className="mt-4 truncate text-2xl font-bold tracking-tight text-text-primary">
                    {stat.value}
                  </p>
                  <p className="mt-1 truncate text-xs text-text-muted">
                    {stat.detail}
                  </p>
                </>
              )}
            </button>
          );
        })}
      </section>

      <section
        className={`grid min-w-0 grid-cols-1 gap-4 ${
          RENTAL_FEATURE_ENABLED ? "xl:grid-cols-3" : "xl:grid-cols-1"
        }`}
      >
        <article
          className={`min-w-0 rounded-xl border border-border bg-surface p-4 ${
            RENTAL_FEATURE_ENABLED ? "xl:col-span-2" : ""
          }`}
        >
          <PanelHeader
            title="Cakupan Digital Twin 2D dan 3D"
            description="Perbandingan bidang yang sudah dan belum terhubung dengan bangunan 3D."
            action={
              <span className="shrink-0 rounded-md bg-surface-secondary px-2 py-1 text-[10px] font-semibold text-text-muted">
                {formatNumber(linkedParcels)} / {formatNumber(totalManaged2d)} bidang
              </span>
            }
          />
          {loading ? (
            <div className="mt-5">
              <LoadingChart />
            </div>
          ) : totalManaged2d > 0 ? (
            <>
              <div
                className="mt-4 h-64 min-w-0"
                role="img"
                aria-label="Diagram cakupan bidang 2D yang terhubung dengan bangunan 3D"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={coverageData}
                    margin={{ top: 12, right: 8, left: -18, bottom: 0 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="var(--color-border)"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "var(--color-text-muted)",
                        fontSize: 11,
                      }}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "var(--color-text-muted)",
                        fontSize: 11,
                      }}
                    />
                    <Tooltip
                      content={<ChartTooltip suffix="bidang" />}
                      cursor={{ opacity: 0.08 }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={56}
                      cursor="pointer"
                      onClick={(item) => openChartPath(item)}
                    >
                      {coverageData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {coverageData.map((item) => (
                  <button
                    type="button"
                    key={item.name}
                    onClick={() => navigate(item.path)}
                    className="rounded-lg bg-surface-secondary px-3 py-2 text-left transition-colors hover:bg-surface-tertiary focus-visible:ring-2 focus-visible:ring-accent"
                    aria-label={`Buka data ${item.name}`}
                  >
                    <p className="text-[10px] text-text-muted">{item.name}</p>
                    <p className="mt-0.5 text-sm font-bold text-text-primary">
                      {formatNumber(item.value)} bidang
                    </p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <EmptyChart
              icon={DatabaseIcon}
              message="Belum ada data untuk divisualisasikan"
            />
          )}
        </article>

        {RENTAL_FEATURE_ENABLED && (
        <article className="min-w-0 rounded-xl border border-border bg-surface p-4">
          <PanelHeader
            title="Portofolio Penyewaan"
            description="Komposisi status seluruh unit dalam pengelolaan penyewaan."
            action={
              <button
                type="button"
                onClick={() => navigate("/sewa/penyewaan")}
                className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
              >
                Kelola <CaretRightIcon size={11} />
              </button>
            }
          />
          {loading ? (
            <div className="mt-5">
              <LoadingChart />
            </div>
          ) : rentalStatusData.length ? (
            <>
              <div
                className="relative mt-2 h-52 min-w-0"
                role="img"
                aria-label="Diagram donat status penyewaan"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={rentalStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={82}
                      paddingAngle={3}
                      stroke="none"
                      cursor="pointer"
                      onClick={() => navigate("/sewa/penyewaan")}
                    >
                      {rentalStatusData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip suffix="unit" />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <strong className="text-2xl font-bold text-text-primary">
                    {formatNumber(activeRentals)}
                  </strong>
                  <span className="text-[10px] text-text-muted">sewa aktif</span>
                </div>
              </div>
              <div className="space-y-2">
                {rentalStatusData.slice(0, 4).map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-text-secondary">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <strong className="shrink-0 text-text-primary">
                      {formatNumber(item.value)}
                    </strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyChart
              icon={HandshakeIcon}
              message="Belum ada data penyewaan"
            />
          )}
        </article>
        )}
      </section>

      <section
        className={`grid min-w-0 grid-cols-1 gap-4 ${
          RENTAL_FEATURE_ENABLED ? "lg:grid-cols-2" : "lg:grid-cols-1"
        }`}
      >
        <article className="min-w-0 rounded-xl border border-border bg-surface p-4">
          <PanelHeader
            title="Keterhubungan Model 3D"
            description="Jumlah bangunan 3D yang terhubung pada setiap bidang 2D."
            action={
              <button
                type="button"
                onClick={() => navigate("/kelola-3d")}
                className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
              >
                Kelola 3D <CaretRightIcon size={11} />
              </button>
            }
          />
          {loading ? (
            <div className="mt-5">
              <LoadingChart />
            </div>
          ) : buildingData.length ? (
            <div
              className="mt-4 h-72 min-w-0"
              role="img"
              aria-label="Diagram keterhubungan bangunan 3D dengan bidang 2D"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={buildingData}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    horizontal={false}
                    stroke="var(--color-border)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "var(--color-text-muted)",
                      fontSize: 10,
                    }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={92}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "var(--color-text-muted)",
                      fontSize: 10,
                    }}
                  />
                  <Tooltip
                    content={<ChartTooltip suffix="bangunan 3D" />}
                    cursor={{ opacity: 0.08 }}
                  />
                  <Bar
                    dataKey="value"
                    fill={CHART_COLORS.blue}
                    radius={[0, 6, 6, 0]}
                    maxBarSize={22}
                    cursor="pointer"
                    onClick={openBuildingCatalog}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart
              icon={CubeIcon}
              message="Belum ada relasi kode 2D dan bangunan 3D"
            />
          )}
        </article>

        {RENTAL_FEATURE_ENABLED && (
        <article className="min-w-0 rounded-xl border border-border bg-surface p-4">
          <PanelHeader
            title="Nilai Penyewaan Aktif"
            description="Ringkasan nilai kontrak aktif berdasarkan periode pembayaran."
            action={
              <button
                type="button"
                onClick={() => navigate("/sewa/penyewaan")}
                className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
              >
                Kelola <CaretRightIcon size={11} />
              </button>
            }
          />
          {loading ? (
            <div className="mt-5">
              <LoadingChart />
            </div>
          ) : rentalValueData.some((item) => item.value > 0) ? (
            <div
              className="mt-4 h-72 min-w-0"
              role="img"
              aria-label="Diagram nilai penyewaan aktif"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={rentalValueData}
                  margin={{ top: 12, right: 8, left: -8, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--color-border)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "var(--color-text-muted)",
                      fontSize: 10,
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => formatCurrency(value, true)}
                    tick={{
                      fill: "var(--color-text-muted)",
                      fontSize: 10,
                    }}
                  />
                  <Tooltip
                    content={
                      <ChartTooltip
                        suffix=""
                        valueFormatter={(value) => formatCurrency(value)}
                      />
                    }
                    cursor={{ opacity: 0.08 }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={56}
                    cursor="pointer"
                    onClick={() => navigate("/sewa/penyewaan")}
                  >
                    {rentalValueData.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart
              icon={CurrencyDollarIcon}
              message="Belum ada nilai penyewaan aktif"
            />
          )}
        </article>
        )}
      </section>

      <section
        className={`grid min-w-0 grid-cols-1 gap-4 ${
          RENTAL_FEATURE_ENABLED ? "lg:grid-cols-3" : "lg:grid-cols-1"
        }`}
      >
        {RENTAL_FEATURE_ENABLED && (
        <article className="min-w-0 rounded-xl border border-border bg-surface p-4">
          <PanelHeader
            title="Ringkasan Penyewaan"
            description="Nilai ekonomi dan kontrak yang sedang berjalan."
            action={
              <button
                type="button"
                onClick={() => navigate("/sewa/penyewaan")}
                className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
              >
                Kelola <CaretRightIcon size={11} />
              </button>
            }
          />
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-surface-secondary p-3">
              <span className="flex min-w-0 items-center gap-2 text-xs text-text-secondary">
                <CurrencyDollarIcon size={16} className="shrink-0 text-blue-500" />
                <span className="truncate">Nilai sewa aktif</span>
              </span>
              <strong
                className="shrink-0 text-sm text-text-primary"
                title={formatCurrency(sewaStats?.totalNilaiSewa)}
              >
                {loading ? "…" : formatCurrency(sewaStats?.totalNilaiSewa, true)}
              </strong>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-surface-secondary p-3">
              <span className="flex min-w-0 items-center gap-2 text-xs text-text-secondary">
                <BuildingsIcon size={16} className="shrink-0 text-emerald-500" />
                <span className="truncate">Nilai data tersewa</span>
              </span>
              <strong
                className="shrink-0 text-sm text-text-primary"
                title={formatCurrency(sewaStats?.totalNilaiAsetTersewa)}
              >
                {loading
                  ? "…"
                  : formatCurrency(sewaStats?.totalNilaiAsetTersewa, true)}
              </strong>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-surface-secondary p-3">
              <span className="flex items-center gap-2 text-xs text-text-secondary">
                <HandshakeIcon size={16} className="text-amber-500" />
                Akan berakhir
              </span>
              <strong className="text-sm text-text-primary">
                {loading ? "…" : `${formatNumber(sewaStats?.akanBerakhir)} unit`}
              </strong>
            </div>
          </div>
        </article>
        )}

        <article
          className={`min-w-0 overflow-hidden rounded-xl border border-border bg-surface ${
            RENTAL_FEATURE_ENABLED ? "lg:col-span-2" : ""
          }`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <ClipboardTextIcon
                size={17}
                weight="fill"
                className="shrink-0 text-accent"
              />
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-text-primary">
                  Aktivitas Terbaru
                </h2>
                <p className="truncate text-[10px] text-text-muted">
                  Perubahan terkini pada data dan sistem
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/riwayat")}
              className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
            >
              Lihat semua <CaretRightIcon size={11} />
            </button>
          </div>
          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-11 animate-pulse rounded-lg bg-surface-secondary"
                />
              ))}
            </div>
          ) : recentActivities?.length ? (
            <div className="divide-y divide-border">
              {recentActivities.slice(0, 5).map((activity, index) => {
                const action = activity.aksi?.toUpperCase();
                const style = activityStyles[action] || {
                  icon: ClipboardTextIcon,
                  badge: "bg-surface-tertiary text-text-secondary",
                  iconClass: "bg-slate-500",
                };
                const ActivityIcon = style.icon;

                return (
                  <button
                    type="button"
                    key={activity.id_riwayat || index}
                    onClick={() => navigate("/riwayat")}
                    className="flex w-full min-w-0 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-secondary/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                    aria-label="Buka riwayat aktivitas"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${style.iconClass}`}
                    >
                      <ActivityIcon size={14} weight="bold" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs font-semibold text-text-primary">
                          {activity.user?.username ||
                            activity.user_id ||
                            "Pengguna"}
                        </span>
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${style.badge}`}
                        >
                          {activity.aksi}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-text-muted">
                        {activity.keterangan ||
                          `${activity.aksi} pada ${activity.tabel}`}
                      </p>
                    </div>
                    <time className="hidden shrink-0 text-[10px] text-text-muted sm:block">
                      {formatDateTime(activity.created_at)}
                    </time>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex h-44 flex-col items-center justify-center text-text-muted">
              <ClipboardTextIcon size={32} className="mb-2 opacity-50" />
              <p className="text-xs">Belum ada aktivitas</p>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
