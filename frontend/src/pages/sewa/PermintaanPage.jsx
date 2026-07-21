import { useState, useEffect, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  ArrowsDownUpIcon,
  EnvelopeOpenIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PhoneIcon,
  UserIcon,
  TrashIcon,
  CaretLeftIcon,
  CaretRightIcon,
  PencilSimpleIcon,
  XIcon,
  CircleNotchIcon,
  StorefrontIcon,
  IdentificationCardIcon,
  MapPinIcon,
  ChatTextIcon,
  PaperclipIcon,
  FileIcon,
  DownloadSimpleIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import { permintaanService, uploadService } from "../../services/api";
import toast from "react-hot-toast";

// Status config
const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "Baru", label: "Baru" },
  { value: "Diproses", label: "Diproses" },
  { value: "Disetujui", label: "Disetujui" },
  { value: "Ditolak", label: "Ditolak" },
];

const getStatusConfig = (status) => {
  const configs = {
    Baru: {
      bg: "bg-blue-100 dark:bg-blue-500/15",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-500/30",
      icon: EnvelopeOpenIcon,
    },
    Diproses: {
      bg: "bg-amber-100 dark:bg-amber-500/15",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-500/30",
      icon: ClockIcon,
    },
    Disetujui: {
      bg: "bg-emerald-100 dark:bg-emerald-500/15",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-500/30",
      icon: CheckCircleIcon,
    },
    Ditolak: {
      bg: "bg-red-100 dark:bg-red-500/15",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-200 dark:border-red-500/30",
      icon: XCircleIcon,
    },
  };
  return configs[status] || configs.Baru;
};

// ============================================================
// DETAIL / UPDATE MODAL
// ============================================================
function DetailModal({ item, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    nama_aset: item?.nama_aset || "",
    nama_pemohon: item?.nama_pemohon || "",
    nik: item?.nik || "",
    no_telepon: item?.no_telepon || "",
    email: item?.email || "",
    alamat: item?.alamat || "",
    tujuan_sewa: item?.tujuan_sewa || "",
  });
  const [status, setStatus] = useState(item?.status || "Baru");
  const [catatan, setCatatan] = useState(item?.catatan_admin || "");
  const [dokumen, setDokumen] = useState(item?.dokumen_respon || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!item) return null;

  const sc = getStatusConfig(item.status);
  const StatusIcon = sc.icon;

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const res = await uploadService.multiple(files, "permintaan-dokumen");
      const newUrls = res.data.data.map((f) => ({
        url: f.url,
        name: f.originalName,
      }));
      setDokumen((prev) => [...prev, ...newUrls]);
      toast.success(`${files.length} dokumen berhasil diupload`);
    } catch {
      toast.error("Gagal mengupload dokumen");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveDoc = (idx) => {
    setDokumen((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateEdit = () => {
    if (!formData.nama_aset.trim()) return "Nama aset wajib diisi";
    if (!formData.nama_pemohon.trim()) return "Nama pemohon wajib diisi";
    if (!formData.no_telepon.trim()) return "Nomor telepon wajib diisi";
    if (!formData.tujuan_sewa.trim()) return "Tujuan sewa wajib diisi";
    return null;
  };

  const handleSave = async () => {
    const validationError = validateEdit();
    if (validationError) return toast.error(validationError);
    setSaving(true);
    try {
      const payload = {
        ...formData,
        status,
        catatan_admin: catatan,
        dokumen_respon: dokumen,
      };
      await permintaanService.update(item.id_permintaan, payload);
      toast.success("Permintaan diperbarui");
      onUpdate();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Gagal memperbarui permintaan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-bold text-text-primary">Edit Permintaan</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
          >
            <XIcon size={18} weight="bold" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Current Status */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${sc.bg} ${sc.text} ${sc.border}`}
            >
              <StatusIcon size={14} weight="fill" />
              {item.status}
            </span>
            <span className="text-xs text-text-muted">
              {new Date(item.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Edit Data */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Data Permintaan
            </h4>
            <div>
              <label className="block text-xs text-text-muted mb-1">
                Nama Aset
              </label>
              <div className="relative">
                <StorefrontIcon
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  value={formData.nama_aset}
                  onChange={(e) =>
                    handleFieldChange("nama_aset", e.target.value)
                  }
                  className="w-full pl-9 pr-3 py-2 bg-surface-secondary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                />
              </div>
              {item.sewa && (
                <p className="text-xs text-text-muted mt-1">
                  No. Lot: {item.sewa.no_lot || "-"}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-muted mb-1">
                  Nama Pemohon
                </label>
                <div className="relative">
                  <UserIcon
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    value={formData.nama_pemohon}
                    onChange={(e) =>
                      handleFieldChange("nama_pemohon", e.target.value)
                    }
                    className="w-full pl-9 pr-3 py-2 bg-surface-secondary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">
                  Telepon
                </label>
                <div className="relative">
                  <PhoneIcon
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    value={formData.no_telepon}
                    onChange={(e) =>
                      handleFieldChange("no_telepon", e.target.value)
                    }
                    className="w-full pl-9 pr-3 py-2 bg-surface-secondary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">
                  NIK
                </label>
                <div className="relative">
                  <IdentificationCardIcon
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    value={formData.nik}
                    onChange={(e) => handleFieldChange("nik", e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-surface-secondary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">
                  Email
                </label>
                <div className="relative">
                  <EnvelopeOpenIcon
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      handleFieldChange("email", e.target.value)
                    }
                    className="w-full pl-9 pr-3 py-2 bg-surface-secondary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">
                Alamat
              </label>
              <div className="relative">
                <MapPinIcon
                  size={15}
                  className="absolute left-3 top-3 text-text-muted"
                />
                <textarea
                  value={formData.alamat}
                  onChange={(e) => handleFieldChange("alamat", e.target.value)}
                  rows={2}
                  className="w-full pl-9 pr-3 py-2 bg-surface-secondary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">
                Tujuan Sewa
              </label>
              <div className="relative">
                <ChatTextIcon
                  size={15}
                  className="absolute left-3 top-3 text-text-muted"
                />
                <textarea
                  value={formData.tujuan_sewa}
                  onChange={(e) =>
                    handleFieldChange("tujuan_sewa", e.target.value)
                  }
                  rows={3}
                  className="w-full pl-9 pr-3 py-2 bg-surface-secondary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Dokumen Respon (read-only view if already has docs) */}
          {item.dokumen_respon?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                Dokumen dari Admin
              </h4>
              <div className="space-y-1.5">
                {item.dokumen_respon.map((doc, idx) => (
                  <a
                    key={idx}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/15 transition-colors"
                  >
                    <FileIcon
                      size={16}
                      weight="fill"
                      className="text-blue-500 shrink-0"
                    />
                    <span className="flex-1 text-xs text-text-primary font-medium truncate">
                      {doc.name}
                    </span>
                    <DownloadSimpleIcon
                      size={14}
                      weight="bold"
                      className="text-blue-500 shrink-0"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Update Status */}
          <div className="border-t border-border pt-5 space-y-3">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Update Status
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {["Baru", "Diproses", "Disetujui", "Ditolak"].map((s) => {
                const cfg = getStatusConfig(s);
                const Icon = cfg.icon;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      status === s
                        ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-2 ring-current/20`
                        : "bg-surface-secondary border-border text-text-muted hover:bg-surface-tertiary"
                    }`}
                  >
                    <Icon
                      size={18}
                      weight={status === s ? "fill" : "regular"}
                    />
                    {s}
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">
                Catatan Admin
              </label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={2}
                placeholder="Catatan untuk pemohon (opsional)..."
                className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none"
              />
            </div>

            {/* Dokumen Respon */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">
                Dokumen Lampiran
              </label>

              {/* Existing docs */}
              {dokumen.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {dokumen.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-surface-secondary rounded-lg border border-border group"
                    >
                      <FileIcon
                        size={16}
                        weight="fill"
                        className="text-blue-500 shrink-0"
                      />
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-xs text-text-primary hover:text-accent truncate font-medium"
                      >
                        {doc.name}
                      </a>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-6 h-6 rounded flex items-center justify-center text-text-muted hover:text-accent transition-colors shrink-0"
                      >
                        <DownloadSimpleIcon size={14} weight="bold" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(idx)}
                        className="w-6 h-6 rounded flex items-center justify-center text-text-muted hover:text-red-500 transition-colors shrink-0"
                      >
                        <XIcon size={14} weight="bold" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              <label className="flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent/40 hover:bg-surface-secondary/50 transition-colors">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
                {uploading ? (
                  <>
                    <CircleNotchIcon
                      size={16}
                      weight="bold"
                      className="animate-spin text-accent"
                    />
                    <span className="text-xs text-text-muted">
                      Mengupload...
                    </span>
                  </>
                ) : (
                  <>
                    <UploadSimpleIcon
                      size={16}
                      weight="bold"
                      className="text-text-muted"
                    />
                    <span className="text-xs text-text-muted">
                      Upload dokumen (PDF, DOC, gambar)
                    </span>
                  </>
                )}
              </label>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-surface text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 ${
                status === "Disetujui"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : status === "Ditolak"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-accent hover:bg-accent-hover"
              }`}
            >
              {saving ? (
                <CircleNotchIcon
                  size={16}
                  weight="bold"
                  className="animate-spin"
                />
              ) : status === "Disetujui" ? (
                <CheckCircleIcon size={16} weight="bold" />
              ) : (
                <PencilSimpleIcon size={16} weight="bold" />
              )}
              {saving
                ? "Menyimpan..."
                : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PERMINTAAN PAGE
// ============================================================
export default function PermintaanPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = {
      page,
      limit: 10,
      sortOrder,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (status) params.status = status;

    permintaanService
      .getAll(params)
      .then((res) => {
        setData(res.data.data || []);
        setPagination(res.data.pagination || {});
      })
      .catch(() => {
        setData([]);
        setPagination({});
      })
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, status, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (item) => {
    if (!confirm(`Hapus permintaan dari "${item.nama_pemohon}"?`)) return;
    try {
      await permintaanService.delete(item.id_permintaan);
      toast.success("Permintaan dihapus");
      fetchData();
    } catch {
      toast.error("Gagal menghapus permintaan");
    }
  };

  return (
    <div className="space-y-6 m-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">Permintaan Sewa</h1>
        <p className="text-sm text-text-muted mt-1">
          Kelola permintaan sewa aset dari masyarakat
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {["Baru", "Diproses", "Disetujui", "Ditolak"].map((s) => {
          const cfg = getStatusConfig(s);
          const Icon = cfg.icon;
          const count = data.filter
            ? data.filter((d) => d.status === s).length
            : 0;
          return (
            <button
              key={s}
              onClick={() => {
                setStatus(status === s ? "" : s);
                setPage(1);
              }}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                status === s
                  ? `${cfg.bg} ${cfg.border} ${cfg.text}`
                  : "bg-surface border-border hover:bg-surface-secondary"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  status === s ? cfg.bg : "bg-surface-secondary"
                }`}
              >
                <Icon
                  size={18}
                  weight="fill"
                  className={status === s ? cfg.text : "text-text-muted"}
                />
              </div>
              <div className="text-left">
                <p
                  className={`text-lg font-bold leading-none ${status === s ? cfg.text : "text-text-primary"}`}
                >
                  {count}
                </p>
                <p
                  className={`text-xs ${status === s ? cfg.text : "text-text-muted"}`}
                >
                  {s}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Cari nama pemohon, aset, atau telepon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setSortOrder((o) => (o === "desc" ? "asc" : "desc"))}
            className="px-3 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors flex items-center gap-1.5"
          >
            <ArrowsDownUpIcon size={16} weight="bold" />
            {sortOrder === "desc" ? "Terbaru" : "Terlama"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <CircleNotchIcon
              size={28}
              weight="bold"
              className="animate-spin text-text-muted"
            />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16">
            <EnvelopeOpenIcon
              size={40}
              weight="light"
              className="mx-auto text-text-muted mb-3"
            />
            <p className="text-sm font-medium text-text-primary mb-1">
              Tidak Ada Permintaan
            </p>
            <p className="text-xs text-text-muted">
              {search || status
                ? "Coba ubah filter pencarian"
                : "Belum ada permintaan sewa yang masuk"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-secondary/50">
                  <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">
                    Pemohon
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">
                    Aset
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">
                    Tujuan
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((item) => {
                  const sc = getStatusConfig(item.status);
                  const StatusIcon = sc.icon;
                  return (
                    <tr
                      key={item.id_permintaan}
                      className="hover:bg-surface-secondary/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-text-primary">
                          {item.nama_pemohon}
                        </p>
                        <p className="text-xs text-text-muted">
                          {item.no_telepon}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-text-primary font-medium">
                          {item.nama_aset}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-text-secondary line-clamp-2 max-w-xs">
                          {item.tujuan_sewa}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.bg} ${sc.text} ${sc.border}`}
                          >
                            <StatusIcon size={12} weight="fill" />
                            {item.status}
                          </span>
                          {item.dokumen_respon?.length > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-medium">
                              <PaperclipIcon size={10} weight="bold" />
                              {item.dokumen_respon.length}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="p-1.5 text-text-muted hover:text-accent hover:bg-surface-secondary rounded-lg transition-colors"
                            title="Edit"
                          >
                            <PencilSimpleIcon size={18} weight="bold" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-text-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <TrashIcon size={18} weight="bold" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted">
            Halaman {pagination.page} dari {pagination.totalPages} (
            {pagination.total} permintaan)
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-surface-secondary disabled:opacity-40 transition-colors"
            >
              <CaretLeftIcon size={16} weight="bold" />
            </button>
            <button
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={page >= pagination.totalPages}
              className="p-2 rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-surface-secondary disabled:opacity-40 transition-colors"
            >
              <CaretRightIcon size={16} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <DetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={fetchData}
        />
      )}
    </div>
  );
}
