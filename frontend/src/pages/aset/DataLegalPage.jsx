import SubstansiAssetPage from "../../components/asset/SubstansiAssetPage";
import {
  ScalesIcon,
  CertificateIcon,
  ShieldCheckIcon,
  GavelIcon,
} from "@phosphor-icons/react";

const columns = [
  {
    key: "nomor_sertifikat",
    label: "No. Sertifikat",
    sortable: true,
    type: "badge",
    minWidth: "44",
  },
  {
    key: "status_sertifikat",
    label: "Status Sertifikat",
    sortable: true,
  },
  {
    key: "jenis_hak",
    label: "Jenis Hak",
    sortable: true,
  },
  {
    key: "atas_nama",
    label: "Atas Nama",
    sortable: true,
    minWidth: "140px",
  },
  {
    key: "tanggal_sertifikat",
    label: "Tgl. Sertifikat",
    type: "date",
    sortable: true,
  },
  {
    key: "riwayat_perolehan",
    label: "Riwayat Perolehan",
    sortable: true,
  },
  {
    key: "status_hukum",
    label: "Status Hukum",
    type: "status_hukum",
    sortable: true,
  },
];

const hasCertificate = (asset) =>
  asset.nomor_sertifikat && String(asset.nomor_sertifikat).trim().length > 10;

const statsCards = (assets, totalItems, assetStats) => [
  {
    label: "Total Aset",
    value: assetStats?.totalAset ?? totalItems,
    icon: ScalesIcon,
    iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  {
    label: "Bersertifikat",
    value: assetStats?.totalSertifikat ?? assets.filter(hasCertificate).length,
    icon: CertificateIcon,
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Aman",
    value:
      assetStats?.byStatusHukum?.Aman ??
      assets.filter((a) => a.status_hukum === "Aman").length,
    icon: ShieldCheckIcon,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    label: "Sengketa",
    value:
      assetStats?.byStatusHukum?.Sengketa ??
      assets.filter((a) => a.status_hukum === "Sengketa").length,
    icon: GavelIcon,
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
  },
];

export default function DataLegalPage() {
  return (
    <SubstansiAssetPage
      title="Data Legal"
      subtitle="Informasi sertifikat, kepemilikan, dan status hukum aset"
      icon={ScalesIcon}
      iconColor="from-indigo-500 to-indigo-600"
      columns={columns}
      statsCards={statsCards}
      substansi="legal"
    />
  );
}
