import SubstansiAssetPage from "../../components/asset/SubstansiAssetPage";
import { ReceiptIcon } from "@phosphor-icons/react";

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

export default function DataPajakPage() {
  return (
    <SubstansiAssetPage
      title="Data Pajak"
      subtitle="Pemetaan pajak, NJOP, dan PBB."
      icon={ReceiptIcon}
      iconColor="from-amber-500 to-orange-500"
      columns={columns}
      substansi="pajak"
      filterPreset="pajak"
    />
  );
}
