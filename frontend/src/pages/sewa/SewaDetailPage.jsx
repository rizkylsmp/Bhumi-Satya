import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  PencilSimpleIcon,
  TrashIcon,
  ArrowUUpLeftIcon,
  MapPinIcon,
  UserIcon,
  CalendarIcon,
  HashIcon,
  ImageIcon,
  PolygonIcon,
  CheckCircleIcon,
  WarningIcon,
  XCircleIcon,
  ProhibitIcon,
  BuildingsIcon,
  CurrencyDollarIcon,
  FileTextIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationCardIcon,
  CaretLeftIcon,
  CaretRightIcon,
  StorefrontIcon,
} from "@phosphor-icons/react";
import toast from "react-hot-toast";
import { sewaService } from "../../services/api";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import SewaFormModal from "../../components/sewa/SewaFormModal";
import PengembalianFormModal from "../../components/sewa/PengembalianFormModal";
import SewaPolygonMap from "../../components/sewa/SewaPolygonMap";

// ============================================================
// Helpers
// ============================================================
function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatCurrency(num) {
  if (!num) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
}

const PERIOD_MONTHS = {
  Bulanan: 1,
  Triwulan: 3,
  Semester: 6,
  Tahunan: 12,
};

function countBillingPeriods(startDate, endDate, periode) {
  if (!startDate || !endDate) return 0;
  if (periode === "Sekali Bayar") return 1;

  const months = PERIOD_MONTHS[periode];
  if (!months) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  if (end <= start) return 0;

  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.ceil(days / (months * 30.4375)));
}

function getDocumentMeta(url, index) {
  const rawName =
    String(url || "")
      .split("?")[0]
      .split("/")
      .pop() || `dokumen-${index + 1}`;
  let fileName = rawName;

  try {
    fileName = decodeURIComponent(rawName);
  } catch {
    fileName = rawName;
  }

  const extension = fileName.includes(".")
    ? fileName.split(".").pop().toUpperCase()
    : "FILE";

  return { fileName, extension };
}

const getStatusConfig = (status) => {
  const configs = {
    Tersedia: {
      bg: "bg-cyan-100 dark:bg-cyan-500/15",
      text: "text-cyan-700 dark:text-cyan-400",
      border: "border-cyan-200 dark:border-cyan-500/30",
      icon: StorefrontIcon,
    },
    Disewakan: {
      bg: "bg-emerald-100 dark:bg-emerald-500/15",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-500/30",
      icon: CheckCircleIcon,
    },
    "Akan Berakhir": {
      bg: "bg-amber-100 dark:bg-amber-500/15",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-500/30",
      icon: WarningIcon,
    },
    Berakhir: {
      bg: "bg-red-100 dark:bg-red-500/15",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-200 dark:border-red-500/30",
      icon: XCircleIcon,
    },
    Dikembalikan: {
      bg: "bg-blue-100 dark:bg-blue-500/15",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-500/30",
      icon: ArrowUUpLeftIcon,
    },
    Dibatalkan: {
      bg: "bg-gray-100 dark:bg-gray-500/15",
      text: "text-gray-600 dark:text-gray-400",
      border: "border-gray-200 dark:border-gray-500/30",
      icon: ProhibitIcon,
    },
  };
  return (
    configs[status] || {
      bg: "bg-gray-100 dark:bg-gray-500/15",
      text: "text-gray-600 dark:text-gray-400",
      border: "border-gray-200 dark:border-gray-500/30",
      icon: ProhibitIcon,
    }
  );
};

// ============================================================
// Photo Gallery — large slider with lightbox
// ============================================================
function PhotoGallery({ photos, title }) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(null);

  if (!photos || photos.length === 0) {
    return (
      <div className="w-full h-48 flex flex-col items-center justify-center text-text-muted gap-2 bg-surface-secondary rounded-xl border border-border">
        <ImageIcon size={32} weight="duotone" />
        <span className="text-xs">Belum ada foto</span>
      </div>
    );
  }

  const goPrev = () =>
    setCurrent((current - 1 + photos.length) % photos.length);
  const goNext = () => setCurrent((current + 1) % photos.length);

  return (
    <>
      {/* Main slider */}
      <div className="relative rounded-xl overflow-hidden border border-border bg-surface-secondary">
        <button
          onClick={() => setLightbox(current)}
          className="block w-full cursor-zoom-in"
        >
          <img
            src={photos[current]}
            alt={`${title} ${current + 1}`}
            className="w-full aspect-16/9 object-cover"
          />
        </button>

        {/* Prev / Next */}
        {photos.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
            >
              <CaretLeftIcon size={18} weight="bold" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
            >
              <CaretRightIcon size={18} weight="bold" />
            </button>
          </>
        )}

        {/* Counter */}
        {photos.length > 1 && (
          <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium rounded-lg">
            {current + 1} / {photos.length}
          </div>
        )}
      </div>

      {/* Thumbnail dots / strip (if multiple) */}
      {photos.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          {photos.map((url, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`rounded-lg overflow-hidden border-2 transition-all ${
                idx === current
                  ? "border-accent ring-2 ring-accent/20"
                  : "border-border opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={url}
                alt={`Thumb ${idx + 1}`}
                className="w-14 h-10 object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 bg-black/80 z-100 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(null);
            }}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            ✕
          </button>
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const prev = (lightbox - 1 + photos.length) % photos.length;
                  setLightbox(prev);
                  setCurrent(prev);
                }}
                className="absolute left-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <CaretLeftIcon size={20} weight="bold" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const next = (lightbox + 1) % photos.length;
                  setLightbox(next);
                  setCurrent(next);
                }}
                className="absolute right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <CaretRightIcon size={20} weight="bold" />
              </button>
            </>
          )}
          <img
            src={photos[lightbox]}
            alt={`${title} ${lightbox + 1}`}
            className="max-w-full max-h-[85vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 text-white/60 text-xs">
            {lightbox + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// Info Field component
// ============================================================
function InfoField({ icon: Icon, label, value, className = "" }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-surface-secondary border border-border flex items-center justify-center shrink-0">
        <Icon size={14} weight="bold" className="text-text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm text-text-primary mt-0.5 wrap-break-word">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Section wrapper
// ============================================================
function Section({ title, icon: Icon, children, className = "" }) {
  return (
    <div
      className={`bg-surface rounded-2xl border border-border overflow-hidden ${className}`}
    >
      <div className="px-5 py-3.5 bg-surface-secondary/50 border-b border-border flex items-center gap-2.5">
        <Icon size={16} weight="duotone" className="text-accent" />
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function SewaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const [aset, setAset] = useState(null);
  const [sewa, setSewa] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Return modal
  const [showReturn, setShowReturn] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sewaService.getById(id);
      const sewaData = res.data.data || res.data;
      setSewa(sewaData);
      setAset(sewaData.aset || null);
    } catch {
      toast.error("Gagal memuat detail penyewaan");
      navigate("/sewa/penyewaan");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdate = async (formData) => {
    setEditLoading(true);
    try {
      await sewaService.update(sewa.id_sewa, formData);
      toast.success("Data berhasil diperbarui");
      setShowEdit(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Gagal memperbarui data");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Hapus Data Penyewaan",
      message: `Data penyewaan "${sewa.nama_aset}" akan dihapus permanen.`,
      confirmText: "Hapus",
      cancelText: "Batal",
      type: "danger",
    });
    if (!confirmed) return;

    try {
      await sewaService.delete(sewa.id_sewa);
      toast.success("Data berhasil dihapus");
      navigate("/sewa/penyewaan");
    } catch {
      toast.error("Gagal menghapus data");
    }
  };

  const handleProcessReturn = async (formData) => {
    setReturnLoading(true);
    try {
      await sewaService.prosesPengembalian(sewa.id_sewa, formData);
      toast.success("Pengembalian berhasil diproses");
      setShowReturn(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Gagal memproses pengembalian");
    } finally {
      setReturnLoading(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-surface-tertiary rounded-xl" />
          <div className="space-y-2 flex-1">
            <div className="h-6 bg-surface-tertiary rounded w-1/3" />
            <div className="h-4 bg-surface-tertiary rounded w-1/5" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-surface-tertiary rounded-2xl" />
          <div className="h-64 bg-surface-tertiary rounded-2xl" />
          <div className="h-48 bg-surface-tertiary rounded-2xl" />
          <div className="h-48 bg-surface-tertiary rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!sewa) return null;

  const hasSewa = true;
  const polygon = sewa.polygon_sewa || aset?.polygon_bidang;
  const allPhotos = hasSewa ? [...(sewa.foto_sewa || [])] : [];
  const sc = hasSewa ? getStatusConfig(sewa.status) : null;
  const StatusIcon = sc?.icon;
  const billingPeriods = countBillingPeriods(
    sewa.tanggal_mulai,
    sewa.tanggal_berakhir,
    sewa.periode_bayar,
  );
  const totalNilaiSewa = (Number(sewa.nilai_sewa) || 0) * billingPeriods;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/sewa/penyewaan")}
            className="w-10 h-10 rounded-xl border border-border bg-surface hover:bg-surface-secondary flex items-center justify-center transition-colors"
          >
            <ArrowLeftIcon
              size={18}
              weight="bold"
              className="text-text-secondary"
            />
          </button>
          <div>
            <h1 className="text-lg lg:text-xl font-bold text-text-primary">
              {sewa.nama_aset}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${sc.bg} ${sc.text} ${sc.border}`}
              >
                <StatusIcon size={12} weight="bold" />
                {sewa.status}
              </span>
              {sewa.no_lot && (
                <span className="text-xs font-mono font-semibold text-text-muted bg-surface-secondary px-2 py-0.5 rounded-lg border border-border">
                  LOT {sewa.no_lot}
                </span>
              )}
              {aset?.kode_aset && (
                <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-lg">
                  {aset.kode_aset}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {sewa.status === "Disewakan" && (
            <button
              onClick={() => setShowReturn(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
            >
              <ArrowUUpLeftIcon size={16} weight="bold" />
              Pengembalian
            </button>
          )}
          <button
            onClick={() => setShowEdit(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
          >
            <PencilSimpleIcon size={16} weight="bold" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          >
            <TrashIcon size={16} weight="bold" />
            Hapus
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* === Section 1: No LOT === */}
        {hasSewa && (
          <div className="space-y-5 lg:col-span-1">
            <Section title="No LOT" icon={HashIcon}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center">
                  <HashIcon
                    size={24}
                    weight="duotone"
                    className="text-accent"
                  />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary font-mono">
                    {sewa.no_lot || "-"}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Nomor LOT sewa
                  </p>
                </div>
              </div>
              {sewa.nomor_kontrak && (
                <div className="mt-4 pt-4 border-t border-border">
                  <InfoField
                    icon={FileTextIcon}
                    label="Nomor Kontrak"
                    value={sewa.nomor_kontrak}
                  />
                </div>
              )}
            </Section>

            {/* === Section 4: Tahun Sewa & Berakhir (only if dates exist) === */}
            {(sewa.tanggal_mulai || sewa.tanggal_berakhir || sewa.nilai_sewa) && (
              <Section title="Tahun Sewa & Berakhir" icon={CalendarIcon}>
                <div className="space-y-4">
                  {/* Period info with visual timeline */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                      <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        Mulai
                      </p>
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                        {formatDate(sewa.tanggal_mulai)}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/20">
                      <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
                        Berakhir
                      </p>
                      <p className="text-sm font-bold text-red-700 dark:text-red-300 mt-1">
                        {formatDate(sewa.tanggal_berakhir)}
                      </p>
                    </div>
                  </div>

                  {/* Financial info */}
                  <div className="grid grid-cols-1 gap-4 pt-4 border-t border-border">
                    <InfoField
                      icon={CurrencyDollarIcon}
                      label="Nilai Sewa per Periode"
                      value={formatCurrency(sewa.nilai_sewa)}
                    />
                    <InfoField
                      icon={CalendarIcon}
                      label="Periode Bayar"
                      value={sewa.periode_bayar}
                    />
                    <InfoField
                      icon={CurrencyDollarIcon}
                      label="Estimasi Total Sewa"
                      value={
                        billingPeriods
                          ? `${formatCurrency(totalNilaiSewa)} (${billingPeriods} periode)`
                          : formatCurrency(sewa.nilai_sewa)
                      }
                    />
                    <InfoField
                      icon={CurrencyDollarIcon}
                      label="Nilai Aset"
                      value={formatCurrency(aset?.nilai_aset)}
                    />
                  </div>

                  {/* Pengembalian info if returned */}
                  {sewa.status === "Dikembalikan" && (
                    <div className="pt-4 border-t border-border space-y-4">
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        Informasi Pengembalian
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoField
                          icon={CalendarIcon}
                          label="Tanggal Kembali"
                          value={formatDate(sewa.tanggal_pengembalian)}
                        />
                        <InfoField
                          icon={CheckCircleIcon}
                          label="Kondisi"
                          value={sewa.kondisi_pengembalian}
                        />
                      </div>
                      {sewa.catatan_pengembalian && (
                        <InfoField
                          icon={FileTextIcon}
                          label="Catatan Pengembalian"
                          value={sewa.catatan_pengembalian}
                        />
                      )}
                      {sewa.foto_kondisi && sewa.foto_kondisi.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                            Foto Kondisi
                          </p>
                          <PhotoGallery
                            photos={sewa.foto_kondisi}
                            title="Kondisi"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Section>
            )}
          </div>
        )}

        {/* === Section 2: Foto Sewa Aset === */}
        <Section title="Foto Aset" icon={ImageIcon} className="lg:col-span-2">
          {allPhotos.length > 0 ? (
            <PhotoGallery photos={allPhotos} title="Sewa Aset" />
          ) : aset?.foto_aset ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="aspect-4/3 rounded-xl overflow-hidden border border-border">
                <img
                  src={aset?.foto_aset}
                  alt={aset?.nama_aset || sewa.nama_aset}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ) : (
            <div className="w-full h-48 flex flex-col items-center justify-center text-text-muted gap-2 bg-surface-secondary rounded-xl border border-border">
              <ImageIcon size={32} weight="duotone" />
              <span className="text-xs">Belum ada foto</span>
            </div>
          )}
        </Section>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* === Section 3: Pemilik & Penyewa === */}
        <Section title="Pemilik & Penyewa" icon={UserIcon}>
          <div className="space-y-5">
            {/* Pemilik / Atas Nama */}
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                Pemilik Aset
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoField
                  icon={BuildingsIcon}
                  label="Atas Nama"
                  value={aset?.atas_nama}
                />
                <InfoField
                  icon={BuildingsIcon}
                  label="Nama Aset"
                  value={aset?.nama_aset || sewa.nama_aset}
                />
              </div>
            </div>

            {/* Penyewa (only if penyewa data exists) */}
            {sewa.nama_penyewa && (
              <div className="pt-4 border-t border-border">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                  Penyewa
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoField
                    icon={UserIcon}
                    label="Nama Penyewa"
                    value={sewa.nama_penyewa}
                  />
                  <InfoField
                    icon={IdentificationCardIcon}
                    label="NIK"
                    value={sewa.nik_penyewa}
                  />
                  <InfoField
                    icon={BuildingsIcon}
                    label="Instansi"
                    value={sewa.instansi_penyewa}
                  />
                  <InfoField
                    icon={PhoneIcon}
                    label="Telepon"
                    value={sewa.telepon_penyewa}
                  />
                  <InfoField
                    icon={EnvelopeIcon}
                    label="Email"
                    value={sewa.email_penyewa}
                  />
                  <InfoField
                    icon={MapPinIcon}
                    label="Alamat"
                    value={sewa.alamat_penyewa}
                  />
                </div>
              </div>
            )}

            {/* If Tersedia, show note */}
            {sewa.status === "Tersedia" && !sewa.nama_penyewa && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-text-muted italic">
                  Belum ada penyewa — aset ini sedang tersedia untuk disewa.
                </p>
              </div>
            )}
          </div>
        </Section>

        {/* === Section 5: Lokasi === */}
        <Section title="Lokasi" icon={MapPinIcon}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField
                icon={MapPinIcon}
                label="Alamat / Lokasi"
                value={aset?.lokasi || sewa.lokasi_aset}
              />
              <InfoField
                icon={MapPinIcon}
                label="Kecamatan"
                value={aset?.kecamatan}
              />
              <InfoField
                icon={MapPinIcon}
                label="Kelurahan"
                value={aset?.desa_kelurahan}
              />
              <InfoField
                icon={PolygonIcon}
                label="Luas"
                value={
                  aset?.luas
                    ? `${Number(aset.luas).toLocaleString("id-ID")} m²`
                    : null
                }
              />
            </div>

            {/* Coordinate */}
            {aset?.koordinat_lat && aset?.koordinat_long && (
              <div className="pt-3 border-t border-border">
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                  Koordinat
                </p>
                <p className="text-xs font-mono text-text-secondary">
                  {aset?.koordinat_lat}, {aset?.koordinat_long}
                </p>
              </div>
            )}
          </div>
        </Section>

        {/* === Section 6: Bidang Polygon dan Peta === */}
        <Section title="Bidang Polygon dan Peta" icon={PolygonIcon}>
          <SewaPolygonMap polygon={polygon} height={360} />
        </Section>

        {/* Dokumen (sewa) */}
        {hasSewa &&
          sewa.dokumen_pendukung &&
          sewa.dokumen_pendukung.length > 0 && (
            <Section title="Dokumen Pendukung" icon={FileTextIcon}>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-secondary px-3 py-2.5 border border-border">
                  <div>
                    <p className="text-xs font-semibold text-text-primary">
                      {sewa.dokumen_pendukung.length} dokumen tersedia
                    </p>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Berkas kontrak dan lampiran penyewaan
                    </p>
                  </div>
                  <FileTextIcon
                    size={22}
                    weight="duotone"
                    className="text-accent shrink-0"
                  />
                </div>

                <div className="space-y-2">
                  {sewa.dokumen_pendukung.map((url, idx) => {
                    const { fileName, extension } = getDocumentMeta(url, idx);

                    return (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 rounded-xl border border-border bg-surface-secondary/60 px-3 py-3 hover:border-accent/40 hover:bg-accent/5 transition-all"
                      >
                        <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/15 flex items-center justify-center shrink-0">
                          <FileTextIcon
                            size={18}
                            weight="duotone"
                            className="text-accent"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-md shrink-0">
                              {extension}
                            </span>
                            <p className="text-xs font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
                              {fileName}
                            </p>
                          </div>
                          <p className="text-[11px] text-text-muted mt-1">
                            Buka dokumen
                          </p>
                        </div>
                        <CaretRightIcon
                          size={16}
                          weight="bold"
                          className="text-text-muted group-hover:text-accent transition-colors shrink-0"
                        />
                      </a>
                    );
                  })}
                </div>
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* Catatan (sewa) */}
      {hasSewa && sewa.catatan && (
        <div className="bg-surface rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileTextIcon size={16} weight="duotone" className="text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">Catatan</h3>
          </div>
          <p className="text-sm text-text-secondary whitespace-pre-wrap">
            {sewa.catatan}
          </p>
        </div>
      )}

      {/* Edit Sewa Modal */}
      <SewaFormModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        onSubmit={handleUpdate}
        initialData={sewa}
        isLoading={editLoading}
      />

      {/* Return Modal */}
      <PengembalianFormModal
        isOpen={showReturn}
        onClose={() => setShowReturn(false)}
        onSubmit={handleProcessReturn}
        sewaData={sewa}
        isLoading={returnLoading}
      />
    </div>
  );
}
