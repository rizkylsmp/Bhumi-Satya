import {
  XIcon,
  ClipboardTextIcon,
  ScalesIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  FolderOpenIcon,
  BuildingsIcon,
  CalendarIcon,
  RulerIcon,
  CheckCircleIcon,
  WarningIcon,
  LightningIcon,
  MinusCircleIcon,
  ShieldCheckIcon,
  GavelIcon,
  HourglassHighIcon,
  ProhibitIcon,
  PencilSimpleIcon,
  PrinterIcon,
  DownloadSimpleIcon,
  MapTrifoldIcon,
  ImageIcon,
  FileTextIcon,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { assetModel3dService } from "../../services/api";
import { getAsset3dSummary, HEIGHT_QUALITY_CONFIG } from "../../utils/asset3dGeojson";
import { useConfirm } from "../ui/confirmContext";

// Helper functions - moved outside component to prevent re-creation on every render
const formatCurrency = (num) => {
  if (!num) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
};

const formatNumber = (num) => {
  if (!num) return "0";
  return new Intl.NumberFormat("id-ID").format(num);
};

const formatFileSizeKb = (bytes) =>
  `${(Number(bytes) / 1024).toLocaleString("id-ID", { maximumFractionDigits: 1 })} KB`;

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const hasValue = (value) =>
  value !== null && value !== undefined && String(value).trim() !== "";

const formatOptionalCurrency = (num) =>
  hasValue(num) ? formatCurrency(num) : "-";

const hasPolygonData = (value) => {
  if (!value) return false;
  if (typeof value === "string") return value.trim().length > 2;
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === "object" && Object.keys(value).length > 0;
};

const getPolygonSummary = (value) => {
  if (!hasPolygonData(value)) return "-";
  if (Array.isArray(value)) return `${value.length} titik koordinat`;
  if (typeof value === "string") {
    try {
      return getPolygonSummary(JSON.parse(value));
    } catch {
      return "GeoJSON tersimpan";
    }
  }
  if (value?.type) return value.type;
  if (Array.isArray(value?.coordinates)) return "GeoJSON coordinates";
  return "Polygon tersimpan";
};

const getDocumentHref = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return getDocumentHref(value[0]);
  return value.url || value.path || value.file_url || "";
};

// Status config - moved outside component
const STATUS_CONFIGS = {
  aktif: {
    bg: "bg-emerald-100 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-400",
    icon: CheckCircleIcon,
  },
  bermasalah: {
    bg: "bg-yellow-100 dark:bg-yellow-500/20",
    text: "text-yellow-700 dark:text-yellow-400",
    icon: WarningIcon,
  },
  "indikasi bermasalah": {
    bg: "bg-amber-100 dark:bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-400",
    icon: LightningIcon,
  },
  diblokir: {
    bg: "bg-red-100 dark:bg-red-500/20",
    text: "text-red-700 dark:text-red-400",
    icon: MinusCircleIcon,
  },
};

const getStatusConfig = (status) => {
  const statusLower = status?.toLowerCase();
  return STATUS_CONFIGS[statusLower] || STATUS_CONFIGS["diblokir"];
};

// Status hukum config - moved outside component
const STATUS_HUKUM_CONFIGS = {
  Aman: {
    bg: "bg-emerald-100 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-400",
    icon: ShieldCheckIcon,
  },
  Sengketa: {
    bg: "bg-red-100 dark:bg-red-500/20",
    text: "text-red-700 dark:text-red-400",
    icon: GavelIcon,
  },
  "Dalam Proses Sertipikasi": {
    bg: "bg-blue-100 dark:bg-blue-500/20",
    text: "text-blue-700 dark:text-blue-400",
    icon: HourglassHighIcon,
  },
  Diblokir: {
    bg: "bg-amber-100 dark:bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-400",
    icon: ProhibitIcon,
  },
};

const MODEL_CONVERSION_CONFIG = {
  pending: { label: "Menunggu konversi", className: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300" },
  processing: { label: "Sedang dikonversi", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" },
  ready: { label: "GLB siap", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  failed: { label: "Konversi gagal", className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" },
};

const DETAIL_NAV_ITEMS = [
  { id: "detail-identitas-aset", label: "Identitas" },
  { id: "detail-data-legal", label: "Legal" },
  { id: "detail-data-fisik", label: "Fisik" },
  { id: "detail-data-kib", label: "KIB" },
  { id: "detail-data-administratif-keuangan", label: "Keuangan" },
  { id: "detail-data-spasial", label: "Spasial" },
  { id: "detail-data-bangunan-3d", label: "3D" },
];

const getStatusHukumConfig = (statusHukum) => {
  return STATUS_HUKUM_CONFIGS[statusHukum] || null;
};

// Sub-components - moved outside to prevent re-creation on every render
const InfoItem = ({ label, value, icon: Icon, highlight = false }) => (
  <div className="min-w-0 rounded-xl border border-border/80 bg-surface px-3.5 py-3">
    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-text-muted">
      {Icon && <Icon size={12} />}
      {label}
    </p>
    <p
      className={`mt-1.5 break-words text-sm leading-relaxed ${highlight ? "font-bold text-text-primary" : "font-medium text-text-secondary"}`}
    >
      {value || "-"}
    </p>
  </div>
);

const Section = ({ title, icon: Icon, children, columns = 2, hidden = false }) => {
  const columnClass =
    columns === 3
      ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
      : "grid-cols-1 md:grid-cols-2";

  const sectionId = `detail-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
  return (
    <section
      id={sectionId}
      role="tabpanel"
      aria-labelledby={`tab-${sectionId}`}
      hidden={hidden}
      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
    >
      <h3 className="flex items-center gap-2 border-b border-border bg-surface-secondary/70 px-4 py-3.5 text-xs font-black uppercase tracking-[0.1em] text-text-primary">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Icon size={17} weight="duotone" />
        </span>
        {title}
      </h3>
      <div className={`grid ${columnClass} gap-3 p-4`}>
        {children}
      </div>
    </section>
  );
};

export default function AssetViewModal({
  isOpen,
  onClose,
  asset,
  onEdit,
  canEdit = true,
  publicMode = false,
  onDownloadPdf,
  onDownloadGeojson,
}) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState(DETAIL_NAV_ITEMS[0].id);
  const [model3dCatalog, setModel3dCatalog] = useState({ assetId: null, versions: [] });
  const [convertingModelId, setConvertingModelId] = useState(null);
  const [downloadingModel, setDownloadingModel] = useState(null);
  const [archivingModelId, setArchivingModelId] = useState(null);
  const downloadMenuRef = useRef(null);

  useEffect(() => {
    if (isOpen) setActiveDetailTab(DETAIL_NAV_ITEMS[0].id);
  }, [asset?.id_aset, isOpen]);

  const handleDetailTabKeyDown = (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = Math.max(
      0,
      DETAIL_NAV_ITEMS.findIndex((item) => item.id === activeDetailTab),
    );
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % DETAIL_NAV_ITEMS.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + DETAIL_NAV_ITEMS.length) % DETAIL_NAV_ITEMS.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = DETAIL_NAV_ITEMS.length - 1;
    const nextId = DETAIL_NAV_ITEMS[nextIndex].id;
    setActiveDetailTab(nextId);
    window.requestAnimationFrame(() => document.getElementById(`tab-${nextId}`)?.focus());
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        downloadMenuRef.current &&
        !downloadMenuRef.current.contains(event.target)
      ) {
        setShowDownloadMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || !asset?.id_aset || publicMode) {
      return;
    }
    let cancelled = false;
    assetModel3dService.list(asset.id_aset)
      .then((response) => {
        if (!cancelled) {
          setModel3dCatalog({ assetId: asset.id_aset, versions: response.data?.data || [] });
        }
      })
      .catch((error) => {
        console.error("Error loading 3D model versions:", error);
        if (!cancelled) setModel3dCatalog({ assetId: asset.id_aset, versions: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [asset?.id_aset, isOpen, publicMode]);

  const hasQueuedModels = model3dCatalog.assetId === asset?.id_aset
    && model3dCatalog.versions.some((model) => ["pending", "processing"].includes(model.conversion_status));

  useEffect(() => {
    if (!isOpen || !asset?.id_aset || !hasQueuedModels) return undefined;
    let cancelled = false;
    const intervalId = window.setInterval(() => {
      assetModel3dService.list(asset.id_aset)
        .then((response) => {
          if (!cancelled) {
            setModel3dCatalog({ assetId: asset.id_aset, versions: response.data?.data || [] });
          }
        })
        .catch((error) => {
          console.error("Error refreshing 3D conversion queue:", error);
        });
    }, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [asset?.id_aset, hasQueuedModels, isOpen]);

  const handleActivateModel3d = async (modelId) => {
    try {
      await assetModel3dService.activate(asset.id_aset, modelId);
      setModel3dCatalog((catalog) => ({
        ...catalog,
        versions: catalog.versions.map((version) => ({
          ...version,
          is_active: version.id_model_3d === modelId,
        })),
      }));
    } catch (error) {
      console.error("Error activating 3D model version:", error);
    }
  };

  const handleConvertModel3d = async (modelId) => {
    setConvertingModelId(modelId);
    setModel3dCatalog((catalog) => ({
      ...catalog,
      versions: catalog.versions.map((version) => version.id_model_3d === modelId
        ? { ...version, conversion_status: "pending", conversion_error: null }
        : version),
    }));
    try {
      const response = await assetModel3dService.convert(asset.id_aset, modelId);
      const updatedModel = response.data?.data;
      setModel3dCatalog((catalog) => ({
        ...catalog,
        versions: catalog.versions.map((version) => version.id_model_3d === modelId
          ? updatedModel
          : version),
      }));
      toast.success(response.data?.message || "Model masuk antrean konversi GLB");
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      setModel3dCatalog((catalog) => ({
        ...catalog,
        versions: catalog.versions.map((version) => version.id_model_3d === modelId
          ? { ...version, conversion_status: "failed", conversion_error: message }
          : version),
      }));
      toast.error(`Konversi GLB gagal: ${message}`);
    } finally {
      setConvertingModelId(null);
    }
  };

  const handlePreviewModel3d = () => {
    const assetId = asset?.id_aset;
    if (!assetId) return;
    onClose();
    navigate("/peta", {
      state: {
        highlightAssetId: assetId,
        openWebgisPopup: true,
        previewModel3d: true,
      },
    });
  };

  const handleDownloadModel3d = async (model, variant) => {
    const downloadKey = `${model.id_model_3d}-${variant}`;
    setDownloadingModel(downloadKey);
    try {
      const response = await assetModel3dService.download(
        asset.id_aset,
        model.id_model_3d,
        variant,
      );
      const fallbackName = variant === "glb"
        ? `${model.original_name.replace(/\.kmz$/i, "")}-v${model.version}.glb`
        : model.original_name;
      const disposition = response.headers?.["content-disposition"] || "";
      const headerName = disposition.match(/filename="([^"]+)"/i)?.[1];
      const objectUrl = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = headerName || fallbackName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      const sourceLabel = String(model.format || "model").toUpperCase();
      toast.success(`${variant === "glb" ? "GLB" : `${sourceLabel} sumber`} mulai diunduh`);
    } catch (error) {
      console.error("Error downloading 3D model:", error);
      toast.error("Gagal mengunduh file model 3D");
    } finally {
      setDownloadingModel(null);
    }
  };

  const handleArchiveModel3d = async (model) => {
    const confirmed = await confirm({
      title: `Arsipkan model versi ${model.version}?`,
      message: "Model tidak akan tampil di peta, tetapi KMZ, GLB, metadata, dan riwayat audit tetap disimpan.",
      confirmText: "Arsipkan",
      cancelText: "Batal",
      type: "warning",
    });
    if (!confirmed) return;

    setArchivingModelId(model.id_model_3d);
    try {
      const response = await assetModel3dService.archive(asset.id_aset, model.id_model_3d);
      const archivedModel = response.data?.data;
      const activatedModelId = response.data?.activated_model_id;
      setModel3dCatalog((catalog) => ({
        ...catalog,
        versions: catalog.versions.map((version) => {
          if (version.id_model_3d === model.id_model_3d) return archivedModel;
          if (activatedModelId) {
            return { ...version, is_active: version.id_model_3d === activatedModelId };
          }
          return version;
        }),
      }));
      toast.success(`Model versi ${model.version} telah diarsipkan`);
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      toast.error(`Gagal mengarsipkan model: ${message}`);
    } finally {
      setArchivingModelId(null);
    }
  };

  if (!isOpen || !asset) return null;

  const documentHref = getDocumentHref(asset.dokumen_pendukung);
  const statusConfig = getStatusConfig(asset.status);
  const statusHukumConfig = getStatusHukumConfig(asset.status_hukum);
  const StatusIcon = statusConfig.icon;
  const asset3d = getAsset3dSummary(asset);
  const model3dVersions = model3dCatalog.assetId === asset.id_aset
    ? model3dCatalog.versions
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-accent/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative flex h-full w-full max-w-[96rem] flex-col overflow-hidden border-border bg-surface shadow-2xl md:h-auto md:max-h-[calc(100vh-32px)] md:rounded-2xl md:border">
        {/* Header */}
        <div className="shrink-0 border-b border-border bg-surface px-4 py-4 md:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3 md:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-surface shadow-md shadow-accent/20 md:h-14 md:w-14">
                <BuildingsIcon size={26} weight="fill" />
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-accent">
                  Data Lengkap Aset · {asset.kode_aset}
                </p>
                <h2 className="truncate text-lg font-black text-text-primary md:text-xl">{asset.nama_aset}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}
                  >
                    <StatusIcon size={14} weight="fill" />
                    {asset.status}
                  </span>
                  {asset.jenis_masalah && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">
                      {asset.jenis_masalah}
                    </span>
                  )}
                  {statusHukumConfig && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${statusHukumConfig.bg} ${statusHukumConfig.text}`}
                    >
                      <statusHukumConfig.icon size={14} weight="fill" />
                      {asset.status_hukum}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {(onDownloadPdf || onDownloadGeojson) && (
                <div className="relative" ref={downloadMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowDownloadMenu((value) => !value)}
                    className="flex h-9 items-center gap-2 rounded-lg border border-border bg-surface-secondary px-3 text-xs font-bold text-text-secondary transition hover:border-accent hover:text-accent"
                  >
                    <DownloadSimpleIcon size={16} weight="bold" />
                    Unduh
                  </button>
                  {showDownloadMenu && (
                    <div className="absolute right-0 top-full z-[9999] mt-2 w-44 overflow-hidden rounded-xl border border-border bg-surface py-1 text-text-primary">
                      {onDownloadPdf && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowDownloadMenu(false);
                            onDownloadPdf(asset);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                        >
                          <DownloadSimpleIcon size={14} weight="bold" />
                          Unduh PDF
                        </button>
                      )}
                      {onDownloadGeojson && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowDownloadMenu(false);
                            onDownloadGeojson(asset);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                        >
                          <DownloadSimpleIcon size={14} weight="bold" />
                          Unduh GeoJSON
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              {canEdit && onEdit && (
                <button
                  onClick={() => {
                    onClose();
                    onEdit(asset.id_aset);
                  }}
                  className="flex h-9 items-center gap-2 rounded-lg bg-accent px-3 text-xs font-bold text-surface transition hover:bg-accent/90"
                >
                  <PencilSimpleIcon size={16} weight="bold" />
                  Edit
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="Tutup detail"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-secondary hover:text-text-primary"
              >
                <XIcon size={20} weight="bold" />
              </button>
            </div>
          </div>
        </div>

        <nav aria-label="Navigasi data lengkap" className="shrink-0 overflow-x-auto border-b border-border bg-surface px-4 py-2 md:px-6">
          <div
            role="tablist"
            aria-label="Bagian data aset"
            onKeyDown={handleDetailTabKeyDown}
            className="flex min-w-max items-center gap-1"
          >
            {DETAIL_NAV_ITEMS.map((item) => (
              <button
                type="button"
                key={item.id}
                id={`tab-${item.id}`}
                role="tab"
                aria-controls={item.id}
                aria-selected={activeDetailTab === item.id}
                tabIndex={activeDetailTab === item.id ? 0 : -1}
                onClick={() => setActiveDetailTab(item.id)}
                className={`rounded-lg px-3 py-2 text-[10px] font-bold transition focus-visible:ring-2 focus-visible:ring-accent ${
                  activeDetailTab === item.id
                    ? "bg-accent text-surface"
                    : "text-text-secondary hover:bg-accent/10 hover:text-accent"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-surface-secondary/50 p-4 md:p-6">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className={`${activeDetailTab === "detail-identitas-aset" ? "xl:col-span-3" : "xl:col-span-4"} space-y-6`}>
              {/* Identitas Aset */}
              <Section
                title="Identitas Aset"
                icon={ClipboardTextIcon}
                columns={3}
                hidden={activeDetailTab !== "detail-identitas-aset"}
              >
                <InfoItem label="Kode Aset" value={asset.kode_aset} highlight />
                <InfoItem label="Nama Aset" value={asset.nama_aset} highlight />
                <InfoItem label="ID Aset" value={asset.id_aset} />
                <InfoItem label="Kode BMD" value={asset.kode_bmd} />
                <InfoItem label="Jenis Aset" value={asset.jenis_aset} />
                <InfoItem label="Asal Data (audit)" value={asset.sumber} />
                <InfoItem
                  label="Status Rekonsiliasi"
                  value={asset.reconciliation_status}
                />
                <InfoItem label="OPD Pengguna" value={asset.opd_pengguna} />
                <InfoItem
                  label="Tahun Perolehan"
                  value={asset.tahun_perolehan}
                  icon={CalendarIcon}
                />
              </Section>

              {/* Data Legal */}
              <Section title="Data Legal" icon={ScalesIcon} columns={3} hidden={activeDetailTab !== "detail-data-legal"}>
                <InfoItem label="Jenis Hak" value={asset.jenis_hak} />
                <InfoItem label="NIB" value={asset.nib} />
                <InfoItem
                  label="Nomor Sertifikat"
                  value={asset.nomor_sertifikat}
                />
                <InfoItem
                  label="Status Sertifikat"
                  value={asset.status_sertifikat}
                />
                <InfoItem label="KW" value={asset.kw} />
                <InfoItem label="Atas Nama" value={asset.atas_nama} />
                <InfoItem
                  label="Tanggal Sertifikat"
                  value={formatDate(asset.tanggal_sertifikat)}
                />
                <InfoItem
                  label="Riwayat Perolehan"
                  value={asset.riwayat_perolehan}
                />
                <InfoItem label="Status Hukum" value={asset.status_hukum} />
                <InfoItem label="SK Penetapan" value={asset.sk_penetapan} />
                <InfoItem
                  label="File Sertifikat"
                  value={asset.file_sertifikat}
                />
              </Section>

              {/* Data Fisik */}
              <Section title="Data Fisik" icon={MapPinIcon} columns={2} hidden={activeDetailTab !== "detail-data-fisik"}>
                <div className="md:col-span-2">
                  <InfoItem
                    label="Lokasi / Alamat"
                    value={asset.lokasi}
                    icon={MapPinIcon}
                    highlight
                  />
                </div>
                <InfoItem label="Desa/Kelurahan" value={asset.desa_kelurahan} />
                <InfoItem label="Kecamatan" value={asset.kecamatan} />
                <InfoItem
                  label="Penggunaan Saat Ini"
                  value={asset.penggunaan_saat_ini}
                />
                <InfoItem
                  label="Luas Sertifikat"
                  value={`${formatNumber(asset.luas)} m²`}
                  icon={RulerIcon}
                  highlight
                />
                <InfoItem
                  label="Luas Lapangan"
                  value={
                    asset.luas_lapangan
                      ? `${formatNumber(asset.luas_lapangan)} m²`
                      : "-"
                  }
                  icon={RulerIcon}
                />
              </Section>

              {/* Data KIB */}
              <Section
                title="Data KIB"
                icon={ClipboardTextIcon}
                columns={3}
                hidden={activeDetailTab !== "detail-data-kib"}
              >
                <InfoItem label="NIBAR" value={asset.nibar} highlight />
                <InfoItem label="ID Pemda" value={asset.id_pemda} />
                <InfoItem label="Kode Barang" value={asset.kode_barang} />
                <InfoItem label="No. Register" value={asset.no_register} />
                <InfoItem
                  label="Luas KIB"
                  value={
                    hasValue(asset.luas_kib)
                      ? `${formatNumber(asset.luas_kib)} m²`
                      : "-"
                  }
                />
                <InfoItem
                  label="Penggunaan KIB"
                  value={asset.penggunaan_kib}
                />
                <InfoItem
                  label="Harga Perolehan"
                  value={formatOptionalCurrency(asset.harga_perolehan)}
                />
                <InfoItem
                  label="Tanggal Scan"
                  value={formatDate(asset.tanggal_scan)}
                />
                <InfoItem
                  label="Status Plotting"
                  value={asset.plotting_status}
                />
              </Section>

              {/* Keuangan */}
              <Section
                title="Keuangan"
                icon={CurrencyDollarIcon}
                columns={3}
                hidden={activeDetailTab !== "detail-data-administratif-keuangan"}
              >
                <InfoItem
                  label="Nilai Aset"
                  value={formatOptionalCurrency(asset.nilai_aset)}
                  highlight
                />
                <InfoItem
                  label="Nilai Buku"
                  value={formatOptionalCurrency(asset.nilai_buku)}
                />
                <InfoItem
                  label="Nilai NJOP"
                  value={formatOptionalCurrency(asset.nilai_njop)}
                />
                <InfoItem
                  label="Harga Perolehan"
                  value={formatOptionalCurrency(asset.harga_perolehan)}
                />
                <InfoItem label="OPD Pengguna" value={asset.opd_pengguna} />
                <InfoItem label="SK Penetapan" value={asset.sk_penetapan} />
              </Section>

              {/* Data Sewa */}
              {(asset.status_sewa || asset.penyewa_aktif) && (
                <Section title="Data Sewa" icon={BuildingsIcon} columns={3} hidden={activeDetailTab !== "detail-data-administratif-keuangan"}>
                  <InfoItem label="Status Sewa" value={asset.status_sewa} />
                  <InfoItem label="Penyewa Aktif" value={asset.penyewa_aktif} />
                  <InfoItem
                    label="Nilai Sewa"
                    value={formatOptionalCurrency(asset.nilai_sewa)}
                  />
                </Section>
              )}

              {/* Batas Tanah */}
              <div hidden={activeDetailTab !== "detail-data-fisik"} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wide mb-3">
                  Batas-Batas Tanah
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-3 bg-surface rounded-lg border border-border">
                    <p className="text-[10px] font-medium text-text-muted uppercase mb-1">
                      Utara
                    </p>
                    <p className="text-text-secondary">
                      {asset.batas_utara || "-"}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-surface rounded-lg border border-border">
                    <p className="text-[10px] font-medium text-text-muted uppercase mb-1">
                      Selatan
                    </p>
                    <p className="text-text-secondary">
                      {asset.batas_selatan || "-"}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-surface rounded-lg border border-border">
                    <p className="text-[10px] font-medium text-text-muted uppercase mb-1">
                      Timur
                    </p>
                    <p className="text-text-secondary">
                      {asset.batas_timur || "-"}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-surface rounded-lg border border-border">
                    <p className="text-[10px] font-medium text-text-muted uppercase mb-1">
                      Barat
                    </p>
                    <p className="text-text-secondary">
                      {asset.batas_barat || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Foto Kondisi Eksisting */}
              {activeDetailTab === "detail-data-fisik" && asset.foto_aset && (
                <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                  <h4 className="text-xs font-bold text-text-muted uppercase tracking-wide flex items-center gap-2 mb-3">
                    <ImageIcon size={14} />
                    Foto Kondisi Eksisting
                  </h4>
                  <a
                    href={asset.foto_aset}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-lg border border-border hover:border-accent transition-colors"
                  >
                    <img
                      src={asset.foto_aset}
                      alt="Foto kondisi eksisting"
                      className="w-full max-h-64 object-cover"
                    />
                  </a>
                </div>
              )}

              {/* Data Spasial */}
              {activeDetailTab === "detail-data-spasial" && (asset.koordinat_lat ||
                asset.koordinat_long ||
                hasPolygonData(asset.polygon_bidang)) && (
                <div id="detail-data-spasial" role="tabpanel" aria-labelledby="tab-detail-data-spasial" className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-wide flex items-center gap-2">
                      <MapTrifoldIcon size={14} />
                      Data Spasial
                    </h4>
                    {asset.koordinat_lat && asset.koordinat_long && (
                      <a
                        href={`https://www.google.com/maps?q=${asset.koordinat_lat},${asset.koordinat_long}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent hover:underline font-medium"
                      >
                        Buka di Google Maps →
                      </a>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="p-3 bg-surface rounded-lg border border-border">
                      <p className="text-[10px] font-medium text-text-muted uppercase mb-1">
                        Latitude
                      </p>
                      <p className="font-mono text-text-primary">
                        {asset.koordinat_lat || "-"}
                      </p>
                    </div>
                    <div className="p-3 bg-surface rounded-lg border border-border">
                      <p className="text-[10px] font-medium text-text-muted uppercase mb-1">
                        Longitude
                      </p>
                      <p className="font-mono text-text-primary">
                        {asset.koordinat_long || "-"}
                      </p>
                    </div>
                    <div className="p-3 bg-surface rounded-lg border border-border">
                      <p className="text-[10px] font-medium text-text-muted uppercase mb-1">
                        Polygon Bidang
                      </p>
                      <p className="font-medium text-text-primary">
                        {getPolygonSummary(asset.polygon_bidang)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeDetailTab === "detail-data-spasial" && !asset.koordinat_lat && !asset.koordinat_long && !hasPolygonData(asset.polygon_bidang) && (
                <div id="detail-data-spasial" role="tabpanel" aria-labelledby="tab-detail-data-spasial" className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
                  <MapTrifoldIcon size={30} className="mx-auto text-text-muted" />
                  <p className="mt-3 text-sm font-bold text-text-primary">Data spasial belum tersedia</p>
                  <p className="mt-1 text-xs text-text-muted">Tambahkan koordinat atau polygon bidang melalui halaman edit aset.</p>
                </div>
              )}

              {activeDetailTab === "detail-data-bangunan-3d" && (asset3d.height || model3dVersions.length > 0) && (
                <section id="detail-data-bangunan-3d" role="tabpanel" aria-labelledby="tab-detail-data-bangunan-3d" className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 shadow-sm dark:border-violet-500/30 dark:bg-violet-500/5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h4 id="asset-3d-summary" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-violet-800 dark:text-violet-300">
                      <BuildingsIcon size={15} weight="fill" />
                      Data Bangunan 3D
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <InfoItem label="LOD" value={asset3d.lod} />
                    <InfoItem label="Tinggi" value={asset3d.height ? `${asset3d.height} m` : "-"} />
                    <InfoItem label="Lantai" value={asset3d.floors} />
                    <InfoItem label="Kualitas" value={asset3d.qualityLabel} />
                    <InfoItem label="CRS Sumber" value={asset3d.crs} />
                    <InfoItem label="Tanggal Rekam" value={formatDate(asset3d.recordedAt)} />
                    <InfoItem label="Akurasi" value={asset3d.accuracy ? `${asset3d.accuracy} m` : "-"} />
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Status</p>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-primary">
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: HEIGHT_QUALITY_CONFIG[asset3d.quality]?.color || "#94a3b8" }} />
                        {asset3d.available ? "Siap LOD1" : "Belum lengkap"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-violet-200 pt-3 dark:border-violet-500/30">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-violet-800 dark:text-violet-300">
                      Versi File Model
                    </p>
                    {model3dVersions.length === 0 ? (
                      <p className="text-xs text-text-muted">Belum ada file KMZ yang tersimpan.</p>
                    ) : (
                      <div className="space-y-2">
                        {model3dVersions.map((model) => (
                          <div key={model.id_model_3d} className={`flex flex-col gap-2 rounded-lg border bg-surface px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${model.archived_at ? "border-slate-200 dark:border-slate-700" : "border-violet-200 dark:border-violet-500/30"}`}>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="truncate text-xs font-semibold text-text-primary">
                                  v{model.version} · {model.original_name}
                                </p>
                                {model.archived_at && (
                                  <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700 dark:bg-slate-500/15 dark:text-slate-300">
                                    Diarsipkan
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-text-muted">
                                {model.format}/{model.model_type} · {(Number(model.file_size_bytes) / 1024).toLocaleString("id-ID", { maximumFractionDigits: 1 })} KB · {model.location_long}, {model.location_lat}
                              </p>
                              {model.manifest?.locationAssessment?.status === "warning" && (
                                <p className="mt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300" role="alert">
                                  {model.manifest.locationAssessment.message}
                                </p>
                              )}
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5" aria-live="polite">
                                <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${MODEL_CONVERSION_CONFIG[model.conversion_status]?.className || MODEL_CONVERSION_CONFIG.pending.className}`}>
                                  {MODEL_CONVERSION_CONFIG[model.conversion_status]?.label || MODEL_CONVERSION_CONFIG.pending.label}
                                </span>
                                {model.converted_size_bytes && (
                                  <span className="text-[10px] text-text-muted">
                                    {String(model.format).toUpperCase() === "3DTILES"
                                      ? "Tileset"
                                      : "GLB"}{" "}
                                    {(Number(model.converted_size_bytes) / 1024).toLocaleString("id-ID", { maximumFractionDigits: 1 })} KB
                                  </span>
                                )}
                              </div>
                              {model.converted_triangle_count && (
                                <dl
                                  className="mt-2 grid grid-cols-1 gap-1 text-[10px] sm:grid-cols-3"
                                  aria-label="Level detail model 3D"
                                >
                                  {[
                                    {
                                      label: "LOD tinggi",
                                      triangles: model.converted_triangle_count,
                                      size: model.converted_size_bytes,
                                    },
                                    {
                                      label: "LOD sedang",
                                      triangles: model.lod_medium_triangle_count,
                                      size: model.lod_medium_size_bytes,
                                    },
                                    {
                                      label: "LOD ringan",
                                      triangles: model.lod_low_triangle_count,
                                      size: model.lod_low_size_bytes,
                                    },
                                  ].filter((lod) => lod.triangles).map((lod) => (
                                    <div key={lod.label} className="rounded-md bg-surface-secondary px-2 py-1.5">
                                      <dt className="font-bold text-text-secondary">{lod.label}</dt>
                                      <dd className="text-text-muted">
                                        {formatNumber(lod.triangles)} segitiga
                                        {lod.size ? ` · ${formatFileSizeKb(lod.size)}` : ""}
                                      </dd>
                                    </div>
                                  ))}
                                </dl>
                              )}
                              {model.optimization_error && (
                                <p className="mt-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300" role="status">
                                  GLB utama tetap siap. Optimasi LOD belum berhasil: {model.optimization_error}
                                </p>
                              )}
                              {model.conversion_status === "failed" && model.conversion_error && (
                                <p className="mt-1 text-[11px] font-medium text-red-700 dark:text-red-300" role="alert">
                                  {model.conversion_error}
                                </p>
                              )}
                            </div>
                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                              {model.is_active && !model.archived_at ? (
                                <span className="inline-flex w-fit rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">Aktif</span>
                              ) : canEdit && !model.archived_at ? (
                                <button
                                  type="button"
                                  onClick={() => handleActivateModel3d(model.id_model_3d)}
                                  className="inline-flex w-fit rounded-lg border border-violet-200 px-2.5 py-1.5 text-[10px] font-bold text-violet-700 hover:bg-violet-100 focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-violet-500/30 dark:text-violet-300"
                                >
                                  Jadikan Aktif
                                </button>
                              ) : null}
                              {model.is_active && !model.archived_at && (
                                <button
                                  type="button"
                                  onClick={handlePreviewModel3d}
                                  className="inline-flex w-fit rounded-lg border border-blue-200 px-2.5 py-1.5 text-[10px] font-bold text-blue-700 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-500/30 dark:text-blue-300 dark:hover:bg-blue-500/10"
                                >
                                  Lihat di Peta 3D
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDownloadModel3d(model, "source")}
                                disabled={downloadingModel === `${model.id_model_3d}-source`}
                                className="inline-flex w-fit rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-bold text-text-secondary hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-wait disabled:opacity-60"
                              >
                                {downloadingModel === `${model.id_model_3d}-source`
                                  ? "Mengunduh…"
                                  : `Unduh ${String(model.format || "sumber").toUpperCase()}`}
                              </button>
                              {String(model.format).toUpperCase() !== "3DTILES"
                                && model.conversion_status === "ready"
                                && model.converted_size_bytes && (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadModel3d(model, "glb")}
                                  disabled={downloadingModel === `${model.id_model_3d}-glb`}
                                  className="inline-flex w-fit rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-bold text-text-secondary hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-wait disabled:opacity-60"
                                >
                                  {downloadingModel === `${model.id_model_3d}-glb` ? "Mengunduh…" : "Unduh GLB"}
                                </button>
                              )}
                              {canEdit && !model.archived_at && model.conversion_status !== "ready" && (
                                <button
                                  type="button"
                                  onClick={() => handleConvertModel3d(model.id_model_3d)}
                                  disabled={model.conversion_status === "processing" || convertingModelId === model.id_model_3d}
                                  className="inline-flex w-fit rounded-lg bg-violet-600 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-violet-700 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-wait disabled:opacity-60"
                                >
                                  {model.conversion_status === "failed" ? "Coba Lagi" : "Konversi GLB"}
                                </button>
                              )}
                              {canEdit && !model.archived_at && (
                                <button
                                  type="button"
                                  onClick={() => handleArchiveModel3d(model)}
                                  disabled={archivingModelId === model.id_model_3d}
                                  aria-describedby={`archive-model-${model.id_model_3d}`}
                                  className="inline-flex w-fit rounded-lg border border-amber-200 px-2.5 py-1.5 text-[10px] font-bold text-amber-700 hover:bg-amber-50 focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-wait disabled:opacity-60 dark:border-amber-500/30 dark:text-amber-300 dark:hover:bg-amber-500/10"
                                >
                                  {archivingModelId === model.id_model_3d ? "Mengarsipkan…" : "Arsipkan"}
                                </button>
                              )}
                              <span id={`archive-model-${model.id_model_3d}`} className="sr-only">
                                Pengarsipan tidak menghapus file atau riwayat audit model.
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {activeDetailTab === "detail-data-bangunan-3d" && !asset3d.height && model3dVersions.length === 0 && (
                <div id="detail-data-bangunan-3d" role="tabpanel" aria-labelledby="tab-detail-data-bangunan-3d" className="rounded-2xl border border-dashed border-violet-300 bg-violet-50/40 p-10 text-center dark:border-violet-500/30 dark:bg-violet-500/5">
                  <BuildingsIcon size={30} className="mx-auto text-violet-400" />
                  <p className="mt-3 text-sm font-bold text-text-primary">Data bangunan 3D belum tersedia</p>
                  <p className="mt-1 text-xs text-text-muted">Impor model KMZ/GLB melalui Kelola 3D.</p>
                </div>
              )}
            </div>

            {/* Sidebar - 1 column */}
            {activeDetailTab === "detail-identitas-aset" && <div className="space-y-6">
              {/* Nilai Aset Card */}
              <div className="bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <CurrencyDollarIcon size={20} weight="bold" />
                  <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
                    Nilai Aset
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide opacity-70">
                      Nilai Perolehan
                    </p>
                    <p className="text-xl font-bold">
                      {formatOptionalCurrency(asset.nilai_aset)}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-surface/20 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide opacity-70">
                        Nilai Buku
                      </p>
                      <p className="text-sm font-semibold">
                        {formatOptionalCurrency(asset.nilai_buku)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide opacity-70">
                        Nilai NJOP
                      </p>
                      <p className="text-sm font-semibold">
                        {formatOptionalCurrency(asset.nilai_njop)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="bg-surface-secondary rounded-xl p-4 space-y-4">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wide">
                  Ringkasan
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">Luas Total</span>
                    <span className="text-sm font-semibold text-text-primary">
                      {formatNumber(asset.luas)} m²
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">Jenis Hak</span>
                    <span className="text-sm font-semibold text-text-primary">
                      {asset.jenis_hak || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">Tahun</span>
                    <span className="text-sm font-semibold text-text-primary">
                      {asset.tahun_perolehan || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dokumentasi */}
              <div className="bg-surface-secondary rounded-xl p-4 space-y-4">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wide flex items-center gap-2">
                  <FolderOpenIcon size={14} />
                  Dokumentasi
                </h4>
                <div className="space-y-2">
                  {asset.foto_aset ? (
                    <a
                      href={asset.foto_aset}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg hover:border-accent transition-colors"
                    >
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <ImageIcon
                          size={20}
                          className="text-blue-600 dark:text-blue-400"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">
                          Foto Aset
                        </p>
                        <p className="text-xs text-text-muted">
                          Klik untuk melihat
                        </p>
                      </div>
                    </a>
                  ) : (
                    <div className="p-3 bg-surface border border-dashed border-border rounded-lg text-center">
                      <ImageIcon
                        size={24}
                        className="text-text-muted mx-auto mb-1"
                      />
                      <p className="text-xs text-text-muted">Belum ada foto</p>
                    </div>
                  )}
                  {documentHref ? (
                    <a
                      href={documentHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg hover:border-accent transition-colors"
                    >
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                        <FileTextIcon
                          size={20}
                          className="text-amber-600 dark:text-amber-400"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">
                          Dokumen
                        </p>
                        <p className="text-xs text-text-muted">
                          Klik untuk unduh
                        </p>
                      </div>
                    </a>
                  ) : (
                    <div className="p-3 bg-surface border border-dashed border-border rounded-lg text-center">
                      <FileTextIcon
                        size={24}
                        className="text-text-muted mx-auto mb-1"
                      />
                      <p className="text-xs text-text-muted">
                        Belum ada dokumen
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Keterangan */}
              {asset.keterangan && (
                <div className="bg-surface-secondary rounded-xl p-4">
                  <h4 className="text-xs font-bold text-text-muted uppercase tracking-wide mb-2">
                    Keterangan
                  </h4>
                  <p className="text-sm text-text-secondary">
                    {asset.keterangan}
                  </p>
                </div>
              )}

              {asset.notes && (
                <div className="bg-surface-secondary rounded-xl p-4">
                  <h4 className="text-xs font-bold text-text-muted uppercase tracking-wide mb-2">
                    Notes KIB
                  </h4>
                  <p className="text-sm text-text-secondary">{asset.notes}</p>
                </div>
              )}
            </div>}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-surface-secondary border-t border-border flex items-center justify-between shrink-0">
          <p className="text-xs text-text-muted">
            ID: {asset.id_aset} • Terakhir diperbarui:{" "}
            {formatDate(asset.updated_at || asset.created_at)}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface rounded-lg transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
