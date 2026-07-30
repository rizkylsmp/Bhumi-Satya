import SubstansiAssetPage from "../../components/asset/SubstansiAssetPage";
import {
  CurrencyDollarIcon,
  HashIcon,
  IdentificationCardIcon,
  MapPinIcon,
  RulerIcon,
} from "@phosphor-icons/react";
import {
  formatCompactCurrency as formatCurrency,
  formatNumberWithOptions,
} from "../../utils/format";

const formatArea = (value) =>
  `${formatNumberWithOptions(Number(value) || 0, {
    maximumFractionDigits: 2,
  })} m²`;

const columns = [
  {
    key: "nibar",
    label: "NIBAR",
    sortable: true,
    type: "badge",
    minWidth: "120px",
  },
  {
    key: "id_pemda",
    label: "ID Pemda",
    sortable: true,
    minWidth: "120px",
  },
  {
    key: "kode_barang",
    label: "Kode Barang",
    sortable: true,
    type: "badge",
    minWidth: "130px",
  },
  {
    key: "no_register",
    label: "No. Register",
    sortable: true,
    minWidth: "110px",
  },
  {
    key: "luas_kib",
    label: "Luas KIB",
    sortable: true,
    type: "area",
    align: "right",
    minWidth: "110px",
  },
  {
    key: "harga_perolehan",
    label: "Harga Perolehan",
    sortable: true,
    type: "currency",
    align: "right",
    minWidth: "150px",
  },
  {
    key: "penggunaan_kib",
    label: "Penggunaan KIB",
    sortable: true,
    minWidth: "170px",
  },
  {
    key: "plotting_status",
    label: "Status Plotting",
    sortable: true,
    type: "badge",
    minWidth: "130px",
  },
];

const statsCards = (assets, totalItems, assetStats) => [
  {
    label: "Tercatat di KIB",
    value:
      assetStats?.totalKib ??
      assets.filter((asset) => asset.nibar).length ??
      totalItems,
    icon: IdentificationCardIcon,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    label: "Total Luas KIB",
    value: formatArea(
      assetStats?.totalLuasKib ??
        assets.reduce(
          (total, asset) => total + (Number(asset.luas_kib) || 0),
          0,
        ),
    ),
    icon: RulerIcon,
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Harga Perolehan",
    value: formatCurrency(
      assetStats?.totalHargaPerolehanKib ??
        assets.reduce(
          (total, asset) => total + (Number(asset.harga_perolehan) || 0),
          0,
        ),
    ),
    icon: CurrencyDollarIcon,
    iconBg: "bg-violet-100 dark:bg-violet-900/30",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    label: "Sudah Terplotting",
    value:
      assetStats?.totalKibTerplotting ??
      assets.filter((asset) => asset.plotting_status).length,
    icon: MapPinIcon,
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
];

export default function DataKibPage() {
  return (
    <SubstansiAssetPage
      title="Data KIB"
      subtitle="Identitas KIB dan nilai perolehan."
      icon={HashIcon}
      iconColor="from-blue-500 to-cyan-500"
      columns={columns}
      statsCards={statsCards}
      substansi="kib"
    />
  );
}
