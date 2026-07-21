import {
  MapPinIcon,
  XIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  WarningIcon,
  LightningIcon,
  MinusCircleIcon,
  RulerIcon,
  CalendarBlankIcon,
  NoteIcon,
  IdentificationCardIcon,
  BuildingOfficeIcon,
  BuildingsIcon,
  UserIcon,
  SealCheckIcon,
  HouseIcon,
} from "@phosphor-icons/react";
import { getAsset3dSummary, HEIGHT_QUALITY_CONFIG } from "../../../utils/asset3dGeojson";

const InfoRow = ({ icon: Icon, label, value, valueClass = "" }) => {
  if (!value || value === "-") return null;
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      {Icon && <Icon size={13} className="text-text-muted shrink-0 mt-0.5" />}
      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wide font-medium text-text-muted shrink-0">
          {label}
        </span>
        <span
          className={`text-xs font-semibold text-right leading-tight truncate max-w-[60%] ${valueClass || "text-text-primary"}`}
        >
          {value}
        </span>
      </div>
    </div>
  );
};

export default function AssetDetailPanel({ asset, onClose, onViewDetail }) {
  if (!asset) return null;

  const isBPKA = asset.sumber === "BPKA";

  const getStatusConfig = (status) => {
    const s = status?.toLowerCase().replace(/\s+/g, "_");
    const configs = {
      aktif: {
        bg: "bg-emerald-100 dark:bg-emerald-900/30",
        text: "text-emerald-700 dark:text-emerald-300",
        border: "border-emerald-200 dark:border-emerald-700",
        icon: CheckCircleIcon,
        dot: "bg-emerald-500",
      },
      bermasalah: {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        text: "text-yellow-700 dark:text-yellow-300",
        border: "border-yellow-200 dark:border-yellow-700",
        icon: WarningIcon,
        dot: "bg-yellow-500",
      },
      indikasi_bermasalah: {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-700 dark:text-blue-300",
        border: "border-blue-200 dark:border-blue-700",
        icon: LightningIcon,
        dot: "bg-blue-500",
      },
      diblokir: {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-700 dark:text-red-300",
        border: "border-red-200 dark:border-red-700",
        icon: MinusCircleIcon,
        dot: "bg-red-500",
      },
    };
    return (
      configs[s] || {
        bg: "bg-gray-100 dark:bg-gray-900/30",
        text: "text-gray-700 dark:text-gray-300",
        border: "border-gray-200 dark:border-gray-700",
        icon: MinusCircleIcon,
        dot: "bg-gray-500",
      }
    );
  };

  const statusConfig = getStatusConfig(asset.status);
  const StatusIcon = statusConfig.icon;
  const statusLabel =
    asset.status?.charAt(0).toUpperCase() +
    asset.status?.slice(1).replace(/_/g, " ");
  const asset3d = getAsset3dSummary(asset);

  const sertifIsBelum =
    asset.status_sertifikat?.toLowerCase().includes("belum") ?? false;
  const sertifIsSudah =
    asset.status_sertifikat?.toLowerCase().includes("sudah") ?? false;

  return (
    <div className="absolute top-4 right-3 left-3 sm:left-auto sm:right-16 sm:w-80 bg-surface/97 backdrop-blur-md rounded-2xl border border-border shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 max-h-[calc(100vh-6rem)] overflow-y-auto">
      {/* Header */}
      <div className="bg-linear-to-r from-accent to-accent/80 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 bg-surface/20 rounded-xl flex items-center justify-center shrink-0">
              <MapPinIcon size={16} weight="fill" className="text-surface" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm text-surface truncate leading-tight">
                {asset.nama_aset}
              </h3>
              <p className="text-[10px] text-surface/70 font-mono mt-0.5 truncate">
                {asset.kode_aset}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup detail aset"
            className="w-7 h-7 flex items-center justify-center hover:bg-surface/20 rounded-lg transition-colors text-surface/80 hover:text-surface shrink-0 ml-2"
          >
            <XIcon size={14} weight="bold" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5 space-y-3">
        {/* Status Badge + Jenis source */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${statusConfig.bg} ${statusConfig.border}`}
          >
            <StatusIcon size={13} weight="fill" className={statusConfig.text} />
            <span className={`text-xs font-bold ${statusConfig.text}`}>
              {statusLabel}
            </span>
          </div>
          <span
            className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold border ${
              isBPKA
                ? "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700"
                : "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700"
            }`}
          >
            {isBPKA ? "BPKA" : "BPN"}
          </span>
          {asset.jenis_masalah && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
              <WarningIcon
                size={11}
                weight="fill"
                className="text-red-500 dark:text-red-400"
              />
              <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                {asset.jenis_masalah}
              </span>
            </div>
          )}
        </div>

        {(asset.building_footprint || asset3d.height) && (
          <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-2.5 dark:border-violet-500/30 dark:bg-violet-500/10">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-violet-700 dark:text-violet-300">
                <BuildingsIcon size={12} weight="fill" /> Data 3D
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-text-secondary">
                <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: HEIGHT_QUALITY_CONFIG[asset3d.quality]?.color || "#94a3b8" }} />
                {asset3d.qualityLabel}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><p className="text-[9px] uppercase text-text-muted">LOD</p><p className="text-xs font-bold text-text-primary">{asset3d.lod || "-"}</p></div>
              <div><p className="text-[9px] uppercase text-text-muted">Tinggi</p><p className="text-xs font-bold text-text-primary">{asset3d.height ? `${asset3d.height} m` : "-"}</p></div>
              <div><p className="text-[9px] uppercase text-text-muted">Lantai</p><p className="text-xs font-bold text-text-primary">{asset3d.floors || "-"}</p></div>
            </div>
          </div>
        )}

        {/* Keterangan */}
        {asset.keterangan && (
          <div className="flex items-start gap-2 p-2.5 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-800/30">
            <NoteIcon
              size={13}
              className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
            />
            <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
              {asset.keterangan}
            </p>
          </div>
        )}

        {/* BPN / BPKA specific fields */}
        <div className="bg-surface-secondary rounded-xl px-3 py-1 divide-y divide-border/50">
          {isBPKA ? (
            <>
              <InfoRow
                icon={IdentificationCardIcon}
                label="NIBAR"
                value={asset.nibar}
              />
              <InfoRow
                icon={IdentificationCardIcon}
                label="NIB"
                value={asset.nib}
              />
              <InfoRow
                icon={SealCheckIcon}
                label="Jenis Hak"
                value={asset.jenis_hak}
              />
              <InfoRow
                icon={HouseIcon}
                label="Penggunaan"
                value={asset.penggunaan_saat_ini}
              />
              <InfoRow
                icon={BuildingOfficeIcon}
                label="OPD"
                value={asset.opd_pengguna}
              />
              <InfoRow
                icon={UserIcon}
                label="Atas Nama"
                value={asset.atas_nama}
              />
              <InfoRow
                icon={MapPinIcon}
                label="Kecamatan"
                value={asset.kecamatan}
              />
            </>
          ) : (
            <>
              <InfoRow
                icon={IdentificationCardIcon}
                label="NIB"
                value={asset.nib}
              />
              <InfoRow
                label="Status Sertifikat"
                value={asset.status_sertifikat}
                valueClass={
                  sertifIsSudah
                    ? "text-emerald-600 dark:text-emerald-400"
                    : sertifIsBelum
                      ? "text-red-600 dark:text-red-400"
                      : ""
                }
              />
              <InfoRow
                icon={SealCheckIcon}
                label="Nomor Hak"
                value={asset.nomor_sertifikat}
              />
              <InfoRow label="Jenis Hak" value={asset.jenis_hak} />
              <InfoRow
                icon={HouseIcon}
                label="Penggunaan"
                value={asset.penggunaan_saat_ini}
              />
              <InfoRow label="KW" value={asset.kw} />
              <InfoRow
                icon={MapPinIcon}
                label="Kecamatan"
                value={asset.kecamatan}
              />
            </>
          )}
        </div>

        {/* Lokasi */}
        <div className="flex items-start gap-2 p-2.5 bg-surface-secondary rounded-xl">
          <MapPinIcon size={13} className="text-text-muted shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
            {asset.lokasi || "Lokasi tidak tersedia"}
          </p>
        </div>

        {/* Info Grid: Luas + Tahun */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-secondary rounded-xl p-2.5">
            <div className="flex items-center gap-1.5 text-text-muted mb-1">
              <RulerIcon size={11} />
              <span className="text-[10px] uppercase tracking-wide font-medium">
                Luas
              </span>
            </div>
            <p className="text-sm font-bold text-text-primary">
              {parseFloat(
                asset.luas_lapangan || asset.luas || 0,
              ).toLocaleString("id-ID")}{" "}
              m²
            </p>
          </div>
          <div className="bg-surface-secondary rounded-xl p-2.5">
            <div className="flex items-center gap-1.5 text-text-muted mb-1">
              <CalendarBlankIcon size={11} />
              <span className="text-[10px] uppercase tracking-wide font-medium">
                Tahun
              </span>
            </div>
            <p className="text-sm font-bold text-text-primary">
              {asset.tahun || "-"}
            </p>
          </div>
        </div>

        {/* View Detail Button */}
        <button
          onClick={() => onViewDetail(asset)}
          className="w-full bg-accent text-surface px-4 py-2.5 text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-accent/30 transition-all flex items-center justify-center gap-2 group"
        >
          <span>Lihat Detail Lengkap</span>
          <ArrowRightIcon
            size={14}
            weight="bold"
            className="group-hover:translate-x-1 transition-transform"
          />
        </button>
      </div>
    </div>
  );
}
