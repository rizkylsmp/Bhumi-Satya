import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowsClockwiseIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  FileArrowUpIcon,
  ImageIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import OrthophotoPreviewMap from "../components/map/OrthophotoPreviewMap";
import { notifyBasemapOptionsChanged } from "../components/map/useBasemapOptions";
import Pagination from "../components/asset/Pagination";
import Switch from "../components/ui/Switch";
import { useConfirm } from "../components/ui/confirmContext";
import { orthophotoService } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { hasPermission } from "../utils/permissions";

const emptyForm = () => ({
  name: "",
  source: "",
  acquisition_date: "",
  source_crs: "",
  description: "",
  related_kode_2d: "",
  bounds_west: "",
  bounds_south: "",
  bounds_east: "",
  bounds_north: "",
});

const errorMessage = (error, fallback) =>
  error?.response?.data?.error || error?.response?.data?.message || fallback;

const formatBytes = (value) => {
  const bytes = Number(value || 0);
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export default function OrthophotoPage() {
  const confirm = useConfirm();
  const fileRef = useRef(null);
  const userRole = useAuthStore((state) => state.user?.role || "");
  const canUpdate = hasPermission(userRole, "aset", "update");
  const canDelete = hasPermission(userRole, "aset", "delete");
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [publishingId, setPublishingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await orthophotoService.list({ page, limit, search, status });
      const nextItems = response.data?.data || [];
      setItems(nextItems);
      setPagination(response.data?.pagination || null);
      setSelectedId((current) => (
        nextItems.some((item) => item.id_orthophoto === current)
          ? current
          : nextItems[0]?.id_orthophoto || null
      ));
    } catch (error) {
      toast.error(errorMessage(error, "Gagal memuat orthophoto"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [limit, page, search, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selected = useMemo(
    () => items.find((item) => item.id_orthophoto === selectedId) || null,
    [items, selectedId],
  );

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submitUpload = async (event) => {
    event.preventDefault();
    if (!file || !form.name.trim() || uploading) {
      toast.error("Nama dan file GeoTIFF wajib diisi");
      return;
    }
    const data = new FormData();
    data.append("file", file);
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    setUploading(true);
    try {
      const response = await orthophotoService.create(data);
      toast.success(response.data?.message || "Orthophoto berhasil diunggah");
      setForm(emptyForm());
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setUploadOpen(false);
      await fetchData();
    } catch (error) {
      toast.error(errorMessage(error, "Gagal mengunggah orthophoto"));
    } finally {
      setUploading(false);
    }
  };

  const togglePublished = async (item, checked) => {
    setPublishingId(item.id_orthophoto);
    try {
      const response = await orthophotoService.setPublished(item.id_orthophoto, checked);
      toast.success(response.data?.message || "Status orthophoto diperbarui");
      notifyBasemapOptionsChanged();
      await fetchData();
    } catch (error) {
      toast.error(errorMessage(error, "Gagal mengubah status publikasi"));
    } finally {
      setPublishingId(null);
    }
  };

  const removeItem = async (item) => {
    const accepted = await confirm({
      title: "Hapus orthophoto?",
      message: `${item.name} dan file GeoTIFF-nya akan dihapus permanen.`,
      confirmLabel: "Hapus Permanen",
      tone: "danger",
    });
    if (!accepted) return;
    setDeletingId(item.id_orthophoto);
    try {
      const response = await orthophotoService.remove(item.id_orthophoto);
      toast.success(response.data?.message || "Orthophoto berhasil dihapus");
      notifyBasemapOptionsChanged();
      await fetchData();
    } catch (error) {
      toast.error(errorMessage(error, "Gagal menghapus orthophoto"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-full bg-surface-secondary p-4 md:p-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="admin-page-header">
          <div className="admin-page-header__identity">
            <span className="admin-page-header__icon bg-linear-to-br from-sky-500 to-cyan-600 text-white">
              <ImageIcon size={21} weight="duotone" />
            </span>
            <div className="min-w-0">
              <h1 className="admin-page-header__title">Kelola Orthophoto</h1>
              <p className="admin-page-header__description">
                Unggah citra berkoordinat dan publikasikan sebagai basemap internal.
              </p>
            </div>
          </div>
          <div className="admin-page-header__actions">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs font-bold text-text-secondary transition hover:border-accent hover:text-accent disabled:opacity-50"
            >
              <ArrowsClockwiseIcon size={15} weight="bold" className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            {canUpdate && (
              <button
                type="button"
                onClick={() => setUploadOpen((value) => !value)}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-accent px-3 text-xs font-bold text-surface transition hover:bg-accent/90"
              >
                {uploadOpen ? <XIcon size={15} weight="bold" /> : <PlusIcon size={15} weight="bold" />}
                {uploadOpen ? "Tutup" : "Upload Orthophoto"}
              </button>
            )}
          </div>
        </header>

        {uploadOpen && (
          <form onSubmit={submitUpload} className="rounded-2xl border border-sky-200 bg-surface p-4 dark:border-sky-500/30">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.55fr)]">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="space-y-1">
                  <span className="text-[8px] font-black uppercase tracking-wide text-text-muted">Nama *</span>
                  <input value={form.name} onChange={(event) => updateForm("name", event.target.value)} className="h-10 w-full rounded-lg border border-border bg-surface-secondary px-3 text-[10px] font-semibold text-text-primary outline-none focus:border-accent" placeholder="Orthophoto STPN 2026" required />
                </label>
                <label className="space-y-1">
                  <span className="text-[8px] font-black uppercase tracking-wide text-text-muted">Tanggal Akuisisi</span>
                  <input type="date" value={form.acquisition_date} onChange={(event) => updateForm("acquisition_date", event.target.value)} className="h-10 w-full rounded-lg border border-border bg-surface-secondary px-3 text-[10px] font-semibold text-text-primary outline-none focus:border-accent" />
                </label>
                <label className="space-y-1">
                  <span className="text-[8px] font-black uppercase tracking-wide text-text-muted">Sumber</span>
                  <input value={form.source} onChange={(event) => updateForm("source", event.target.value)} className="h-10 w-full rounded-lg border border-border bg-surface-secondary px-3 text-[10px] font-semibold text-text-primary outline-none focus:border-accent" placeholder="Drone / BIG / ATR-BPN" />
                </label>
                <label className="space-y-1">
                  <span className="text-[8px] font-black uppercase tracking-wide text-text-muted">CRS (opsional)</span>
                  <input value={form.source_crs} onChange={(event) => updateForm("source_crs", event.target.value)} className="h-10 w-full rounded-lg border border-border bg-surface-secondary px-3 font-mono text-[10px] text-text-primary outline-none focus:border-accent" placeholder="Otomatis, mis. EPSG:32749" />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-[8px] font-black uppercase tracking-wide text-text-muted">Kode 2D terkait (opsional)</span>
                  <input value={form.related_kode_2d} onChange={(event) => updateForm("related_kode_2d", event.target.value)} className="h-10 w-full rounded-lg border border-border bg-surface-secondary px-3 font-mono text-[10px] text-text-primary outline-none focus:border-accent" placeholder="2D-001, 2D-002" />
                </label>
              </div>
              <label className="flex min-h-24 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-sky-300 bg-sky-50/60 p-3 transition hover:border-sky-500 dark:border-sky-500/40 dark:bg-sky-500/5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-white">
                  <FileArrowUpIcon size={18} weight="duotone" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[10px] font-black text-text-primary">{file?.name || "Pilih GeoTIFF"}</span>
                  <span className="mt-0.5 block text-[8px] text-text-muted">TIF/GeoTIFF · Maks. 150 MB</span>
                </span>
                <input ref={fileRef} type="file" accept=".tif,.tiff,image/tiff" className="hidden" onChange={(event) => setFile(event.target.files?.[0] || null)} required />
              </label>
            </div>

            <details className="mt-3 rounded-xl border border-border bg-surface-secondary/60">
              <summary className="cursor-pointer px-3 py-2 text-[9px] font-bold text-text-secondary">Batas WGS84 manual jika CRS tidak terbaca</summary>
              <div className="grid grid-cols-2 gap-2 border-t border-border p-3 sm:grid-cols-4">
                {["west", "south", "east", "north"].map((direction) => (
                  <label key={direction} className="space-y-1">
                    <span className="text-[7px] font-black uppercase text-text-muted">{direction}</span>
                    <input type="number" step="any" value={form[`bounds_${direction}`]} onChange={(event) => updateForm(`bounds_${direction}`, event.target.value)} className="h-9 w-full rounded-lg border border-border bg-surface px-2 font-mono text-[9px] text-text-primary outline-none focus:border-accent" />
                  </label>
                ))}
              </div>
            </details>
            <div className="mt-3 flex justify-end">
              <button type="submit" disabled={uploading} className="inline-flex h-9 items-center gap-2 rounded-lg bg-sky-600 px-4 text-[9px] font-black text-white transition hover:bg-sky-700 disabled:opacity-50">
                {uploading ? <ArrowsClockwiseIcon size={14} className="animate-spin" /> : <FileArrowUpIcon size={14} weight="bold" />}
                {uploading ? "Memproses GeoTIFF…" : "Upload sebagai Draf"}
              </button>
            </div>
          </form>
        )}

        <section className="grid overflow-hidden rounded-2xl border border-border bg-surface xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]">
          <div className="min-w-0 border-b border-border xl:border-b-0 xl:border-r">
            <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
              <label className="relative min-w-56 flex-1">
                <span className="sr-only">Cari orthophoto</span>
                <MagnifyingGlassIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Cari nama, sumber, CRS…" className="h-10 w-full rounded-xl border border-border bg-surface-secondary pl-9 pr-3 text-[10px] font-semibold text-text-primary outline-none focus:border-accent" />
              </label>
              <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-10 rounded-xl border border-border bg-surface-secondary px-3 text-[10px] font-bold text-text-secondary outline-none focus:border-accent">
                <option value="all">Semua status</option>
                <option value="published">Dipublikasikan</option>
                <option value="draft">Draf</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="admin-data-table min-w-[760px]">
                <thead><tr className="border-b border-border bg-surface-secondary"><th className="px-4 py-3 text-left">Orthophoto</th><th className="px-4 py-3 text-left">Cakupan</th><th className="px-4 py-3 text-left">File</th><th className="px-4 py-3 text-left">Publikasi</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {loading ? [1, 2, 3, 4].map((row) => <tr key={row}><td colSpan="5" className="px-4 py-3"><div className="h-12 animate-pulse rounded-lg bg-surface-secondary" /></td></tr>) : items.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-14 text-center"><ImageIcon size={32} className="mx-auto text-text-muted" /><p className="mt-3 text-xs font-black text-text-primary">Belum ada orthophoto</p><p className="mt-1 text-[10px] text-text-muted">Upload GeoTIFF untuk menambah basemap internal.</p></td></tr>
                  ) : items.map((item) => (
                    <tr key={item.id_orthophoto} onClick={() => setSelectedId(item.id_orthophoto)} className={`cursor-pointer transition ${selectedId === item.id_orthophoto ? "bg-sky-500/5" : "hover:bg-surface-secondary"}`}>
                      <td className="px-4 py-3"><p className="max-w-60 truncate text-[10px] font-black text-text-primary">{item.name}</p><p className="mt-1 flex items-center gap-1 text-[8px] text-text-muted"><CalendarBlankIcon size={10} /> {item.acquisition_date || "Tanggal belum diisi"}</p></td>
                      <td className="px-4 py-3"><p className="font-mono text-[8px] font-bold text-text-secondary">{item.source_crs}</p><p className="mt-1 flex items-center gap-1 text-[8px] text-text-muted"><MapPinIcon size={10} /> {item.bounds.west.toFixed(4)}, {item.bounds.south.toFixed(4)}</p></td>
                      <td className="px-4 py-3"><p className="max-w-40 truncate text-[8px] font-bold text-text-secondary">{item.original_name}</p><p className="mt-1 text-[8px] text-text-muted">{formatBytes(item.file_size_bytes)} · {item.raster_width}×{item.raster_height}</p></td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><Switch size="sm" tone="sky" checked={item.status === "published"} disabled={!canUpdate || publishingId === item.id_orthophoto} onCheckedChange={(checked) => togglePublished(item, checked)} onClick={(event) => event.stopPropagation()} aria-label={`Publikasikan ${item.name}`} /><span className={`text-[8px] font-black ${item.status === "published" ? "text-emerald-600 dark:text-emerald-300" : "text-text-muted"}`}>{item.status === "published" ? "Aktif" : "Draf"}</span></div></td>
                      <td className="px-4 py-3"><div className="flex justify-end gap-1.5"><button type="button" onClick={(event) => { event.stopPropagation(); setSelectedId(item.id_orthophoto); }} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-muted hover:border-sky-400 hover:text-sky-600" title="Preview"><ImageIcon size={13} /></button>{canDelete && <button type="button" disabled={deletingId === item.id_orthophoto} onClick={(event) => { event.stopPropagation(); removeItem(item); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10" title="Hapus permanen">{deletingId === item.id_orthophoto ? <ArrowsClockwiseIcon size={13} className="animate-spin" /> : <TrashIcon size={13} />}</button>}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={pagination} onChange={setPage} pageSize={limit} pageSizeOptions={[10, 20, 50]} onPageSizeChange={(value) => { setLimit(value); setPage(1); }} embedded itemLabel="orthophoto" />
          </div>

          <aside className="min-h-[420px] p-3">
            {selected ? (
              <div className="flex h-full min-h-[390px] flex-col overflow-hidden rounded-xl border border-border">
                <div className="flex items-center justify-between border-b border-border bg-surface-secondary px-3 py-2.5"><div className="min-w-0"><p className="truncate text-[10px] font-black text-text-primary">{selected.name}</p><p className="mt-0.5 text-[8px] text-text-muted">Preview cakupan WGS84</p></div>{selected.status === "published" && <CheckCircleIcon size={16} weight="fill" className="text-emerald-500" />}</div>
                <div className="min-h-0 flex-1"><OrthophotoPreviewMap orthophoto={selected} /></div>
              </div>
            ) : (
              <div className="flex h-full min-h-[390px] flex-col items-center justify-center rounded-xl border border-dashed border-border text-center"><ImageIcon size={34} className="text-text-muted" /><p className="mt-3 text-[10px] font-black text-text-primary">Pilih data untuk preview</p></div>
            )}
          </aside>
        </section>
      </div>
    </div>
  );
}
