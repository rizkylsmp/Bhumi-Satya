import SubstansiAssetPage from "../../components/asset/SubstansiAssetPage";
import { HashIcon } from "@phosphor-icons/react";

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

export default function DataKibPage() {
  return (
    <SubstansiAssetPage
      title="Data KIB"
      subtitle="Identitas KIB dan nilai perolehan."
      icon={HashIcon}
      iconColor="from-blue-500 to-cyan-500"
      columns={columns}
      substansi="kib"
      filterPreset="kib"
    />
  );
}
