import SubstansiAssetPage from "../../components/asset/SubstansiAssetPage";
import { RulerIcon } from "@phosphor-icons/react";

const columns = [
  {
    key: "lokasi",
    label: "Lokasi",
    type: "location",
    minWidth: "64",
  },
  {
    key: "desa_kelurahan",
    label: "Desa/Kelurahan",
    sortable: true,
  },
  {
    key: "luas",
    label: "Luas Sertifikat",
    type: "area",
    sortable: true,
    align: "right",
  },
  {
    key: "luas_lapangan",
    label: "Luas Lapangan",
    type: "area",
    sortable: true,
    align: "right",
  },
  {
    key: "penggunaan_saat_ini",
    label: "Penggunaan",
    sortable: true,
    type: "badge",
  },
  {
    key: "batas_utara",
    label: "Batas U/S/T/B",
    render: (_, asset) => {
      const batas = [
        asset.batas_utara,
        asset.batas_selatan,
        asset.batas_timur,
        asset.batas_barat,
      ].filter(Boolean);
      if (batas.length === 0)
        return (
          <span className="text-text-muted text-xs italic">Belum diisi</span>
        );
      return (
        <div className="text-xs text-text-secondary space-y-0.5">
          {asset.batas_utara && (
            <div>
              <span className="font-medium text-text-muted">U:</span>{" "}
              {asset.batas_utara}
            </div>
          )}
          {asset.batas_selatan && (
            <div>
              <span className="font-medium text-text-muted">S:</span>{" "}
              {asset.batas_selatan}
            </div>
          )}
          {asset.batas_timur && (
            <div>
              <span className="font-medium text-text-muted">T:</span>{" "}
              {asset.batas_timur}
            </div>
          )}
          {asset.batas_barat && (
            <div>
              <span className="font-medium text-text-muted">B:</span>{" "}
              {asset.batas_barat}
            </div>
          )}
        </div>
      );
    },
    minWidth: "160px",
  },
];

export default function DataFisikPage() {
  return (
    <SubstansiAssetPage
      title="Data Fisik"
      subtitle="Lokasi dan kondisi fisik aset."
      icon={RulerIcon}
      iconColor="from-teal-500 to-teal-600"
      columns={columns}
      substansi="fisik"
      filterPreset="fisik"
    />
  );
}
