import SubstansiAssetPage from "../../components/asset/SubstansiAssetPage";
import {
  BuildingsIcon,
  CheckCircleIcon,
  CurrencyCircleDollarIcon,
  ReceiptIcon,
} from "@phosphor-icons/react";

const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
    notation: "compact",
  }).format(Number(value) || 0);

const columns = [
  {
    key: "pajak_fid",
    label: "FID",
    sortable: true,
    minWidth: "90px",
    render: (value) => value ?? "-",
  },
  {
    key: "pajak_status",
    label: "Status Objek Pajak",
    sortable: true,
    minWidth: "180px",
    render: (value, asset) => (
      <span
        className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
          value || asset.nop
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
            : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
        }`}
      >
        {value || (asset.nop ? "Terverifikasi" : "Belum Terdata")}
      </span>
    ),
  },
  {
    key: "nop",
    label: "NOP",
    sortable: true,
    minWidth: "220px",
    render: (value) => value || "-",
  },
  {
    key: "nama_wajib_pajak",
    label: "Nama Wajib Pajak",
    sortable: true,
    minWidth: "190px",
    render: (value) => value || "-",
  },
  {
    key: "luas_bumi_bapenda",
    label: "Luas Bumi Bapenda",
    sortable: true,
    type: "area",
    align: "right",
    minWidth: "150px",
  },
  {
    key: "luas_bumi_pemetaan",
    label: "Luas Bumi Pemetaan",
    sortable: true,
    type: "area",
    align: "right",
    minWidth: "160px",
  },
  {
    key: "njop_bumi_pemetaan",
    label: "NJOP Bumi",
    sortable: true,
    type: "currency",
    align: "right",
    minWidth: "150px",
  },
  {
    key: "pbb_pemetaan",
    label: "PBB Pemetaan",
    sortable: true,
    type: "currency",
    align: "right",
    minWidth: "150px",
  },
];

const statsCards = (assets, totalItems, assetStats) => [
  {
    label: "Data Pajak",
    value: assetStats?.totalPajak ?? totalItems,
    icon: ReceiptIcon,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    label: "Terverifikasi",
    value:
      assetStats?.totalPajakTerverifikasi ??
      assets.filter((asset) => asset.pajak_status || asset.nop).length,
    icon: CheckCircleIcon,
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Total NJOP Pemetaan",
    value: formatCurrency(
      assetStats
        ? Number(assetStats.totalNjopBumiPajak || 0) +
            Number(assetStats.totalNjopBangunanPajak || 0)
        : assets.reduce(
            (total, asset) =>
              total +
              Number(asset.njop_bumi_pemetaan || 0) +
              Number(asset.njop_bangunan_pemetaan || 0),
            0,
          ),
    ),
    icon: BuildingsIcon,
    iconBg: "bg-violet-100 dark:bg-violet-900/30",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    label: "Total PBB Pemetaan",
    value: formatCurrency(
      assetStats?.totalPbbPemetaan ??
        assets.reduce(
          (total, asset) => total + Number(asset.pbb_pemetaan || 0),
          0,
        ),
    ),
    icon: CurrencyCircleDollarIcon,
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
];

export default function DataPajakPage() {
  return (
    <SubstansiAssetPage
      title="Data Pajak"
      subtitle="Pemetaan pajak, NJOP, dan PBB."
      icon={ReceiptIcon}
      iconColor="from-amber-500 to-orange-500"
      columns={columns}
      statsCards={statsCards}
      substansi="pajak"
    />
  );
}
