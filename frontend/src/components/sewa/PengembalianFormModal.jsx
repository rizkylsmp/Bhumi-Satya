import { useState, useRef } from "react";
import {
  XIcon,
  FloppyDiskIcon,
  CameraIcon,
  TrashIcon,
  ImageIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { uploadService } from "../../services/api";

const KONDISI_OPTIONS = ["Baik", "Rusak Ringan", "Rusak Berat"];
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_PHOTOS = 5;

const inputClass =
  "w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-surface text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors";

export default function PengembalianFormModal({
  isOpen,
  onClose,
  onSubmit,
  sewaData,
  isLoading = false,
}) {
  const [form, setForm] = useState({
    tanggal_pengembalian: new Date().toISOString().split("T")[0],
    kondisi_pengembalian: "Baik",
    catatan_pengembalian: "",
  });

  // Photo upload state
  const [photos, setPhotos] = useState([]); // { file, preview, error }
  const [uploading, setUploading] = useState(false);
  const photoInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddPhotos = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_PHOTOS - photos.length;
    const newPhotos = files.slice(0, remaining).map((file) => {
      const error =
        file.size > MAX_FILE_SIZE ? "Ukuran file melebihi 1MB" : null;
      return { file, preview: URL.createObjectURL(file), error };
    });
    setPhotos((prev) => [...prev, ...newPhotos]);
    e.target.value = "";
  };

  const removePhoto = (index) => {
    setPhotos((prev) => {
      const removed = prev[index];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (photos.some((p) => p.error)) return;

    const validPhotos = photos.filter((p) => p.file && !p.error);

    if (validPhotos.length > 0) {
      setUploading(true);
      try {
        const uploadPromises = validPhotos.map((p) =>
          uploadService.single(p.file, "foto-kondisi"),
        );
        const results = await Promise.all(uploadPromises);
        const urls = results.map((r) => r.data.url);
        onSubmit({ ...form, foto_kondisi: urls });
      } catch {
        return;
      } finally {
        setUploading(false);
      }
    } else {
      onSubmit(form);
    }
  };

  if (!isOpen || !sewaData) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            Proses Pengembalian
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
          >
            <XIcon size={20} className="text-text-muted" />
          </button>
        </div>

        {/* Sewa Info */}
        <div className="px-6 pt-4 pb-2">
          <div className="bg-surface-secondary rounded-xl border border-border p-3 space-y-1">
            <div className="text-sm">
              <span className="text-text-muted">Aset: </span>
              <span className="font-medium text-text-primary">
                {sewaData.nama_aset}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-text-muted">Penyewa: </span>
              <span className="font-medium text-text-primary">
                {sewaData.nama_penyewa}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-text-muted">No. Kontrak: </span>
              <span className="font-medium text-text-primary">
                {sewaData.nomor_kontrak || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Tanggal Pengembalian <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="tanggal_pengembalian"
              value={form.tanggal_pengembalian}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Kondisi Aset <span className="text-red-500">*</span>
            </label>
            <select
              name="kondisi_pengembalian"
              value={form.kondisi_pengembalian}
              onChange={handleChange}
              required
              className={inputClass}
            >
              {KONDISI_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Catatan Pengembalian
            </label>
            <textarea
              name="catatan_pengembalian"
              value={form.catatan_pengembalian}
              onChange={handleChange}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Catatan terkait kondisi / pengembalian aset"
            />
          </div>

          {/* Foto Kondisi */}
          <fieldset className="border border-border rounded-xl p-4">
            <legend className="text-sm font-medium text-text-secondary px-2">
              Foto Kondisi Aset
            </legend>
            <p className="text-xs text-text-muted mb-3">
              Upload foto kondisi aset saat dikembalikan (maks. {MAX_PHOTOS}{" "}
              foto, 1MB per file)
            </p>

            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {photos.map((photo, idx) => (
                  <div
                    key={idx}
                    className={`relative group rounded-lg overflow-hidden border ${photo.error ? "border-red-400" : "border-border"}`}
                  >
                    <img
                      src={photo.preview}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-24 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Hapus foto"
                    >
                      <TrashIcon size={12} weight="bold" />
                    </button>
                    {photo.error && (
                      <div className="absolute bottom-0 inset-x-0 bg-red-500/90 px-1.5 py-0.5 flex items-center gap-1">
                        <WarningIcon
                          size={10}
                          weight="fill"
                          className="text-white shrink-0"
                        />
                        <span className="text-[10px] text-white truncate">
                          {photo.error}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {photos.length < MAX_PHOTOS && (
              <>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  multiple
                  onChange={handleAddPhotos}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-accent hover:bg-accent/10 rounded-lg transition-colors"
                >
                  <CameraIcon size={14} weight="bold" />
                  Tambah Foto
                </button>
              </>
            )}
          </fieldset>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-text-secondary bg-surface-secondary hover:bg-surface-tertiary rounded-xl transition-colors border border-border"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || uploading || photos.some((p) => p.error)}
              className="px-5 py-2.5 text-sm font-medium text-surface bg-linear-to-r from-accent to-accent/90 hover:shadow-lg hover:shadow-accent/30 disabled:opacity-50 rounded-xl transition-all flex items-center gap-2"
            >
              <FloppyDiskIcon size={16} />
              {uploading
                ? "Mengupload foto..."
                : isLoading
                  ? "Memproses..."
                  : "Proses Pengembalian"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
