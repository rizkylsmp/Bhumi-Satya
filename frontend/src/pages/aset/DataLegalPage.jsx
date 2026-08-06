import SubstansiAssetPage from "../../components/asset/SubstansiAssetPage";
import { ScalesIcon } from "@phosphor-icons/react";

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

export default function DataLegalPage() {
  return (
    <SubstansiAssetPage
      title="Data Legal"
      subtitle="Legalitas dan status hukum aset."
      icon={ScalesIcon}
      iconColor="from-indigo-500 to-indigo-600"
      columns={columns}
      substansi="legal"
      filterPreset="legal"
    />
  );
}
