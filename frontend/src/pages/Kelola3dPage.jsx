import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRightIcon,
  ArrowCounterClockwiseIcon,
  ArrowsClockwiseIcon,
  BuildingsIcon,
  CheckCircleIcon,
  CubeIcon,
  DownloadSimpleIcon,
  FileArrowUpIcon,
  FilesIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  LinkSimpleIcon,
  MapPinIcon,
  PlusIcon,
  TrashIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useConfirm } from "../components/ui/confirmContext";
import { aset3dCatalogService, assetModel3dService } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { hasPermission } from "../utils/permissions";
import Pagination from "../components/asset/Pagination";
import SortableTableHeader from "../components/shared/SortableTableHeader";
import useColumnResize from "../hooks/useColumnResize";
import useTableSort from "../hooks/useTableSort";

const errorMessage = (error, fallback) =>
  error?.response?.data?.error || error?.response?.data?.message || fallback;

const formatDate = (value) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const formatCoordinate = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(6) : "—";
};

const modelStatusLabel = {
  belum_ada: "Belum ada model",
  draft: "Draf",
  processing: "Diproses",
  needs_review: "Perlu verifikasi",
  verified: "Terverifikasi",
  rejected: "Ditolak",
  active: "Aktif",
  expired: "Kedaluwarsa",
  ready: "Siap",
  pending: "Antrean",
};

const sortOptions = [
  { value: "created_at:DESC", label: "Terbaru ditambahkan" },
  { value: "created_at:ASC", label: "Terlama ditambahkan" },
  { value: "updated_at:DESC", label: "Terakhir diperbarui" },
  { value: "model_updated_at:DESC", label: "Model terbaru diperbarui" },
  { value: "center_x:ASC", label: "Center X terkecil" },
  { value: "center_y:ASC", label: "Center Y terkecil" },
  { value: "kode_3d:ASC", label: "Kode 3D A–Z" },
  { value: "kode_aset:ASC", label: "Kode aset A–Z" },
  { value: "building_name:ASC", label: "Nama bangunan A–Z" },
];
const DEFAULT_SORT = "created_at:DESC";
const BATCH_LOD_OPTIONS = ["LOD1", "LOD2", "LOD2.5", "LOD3", "LOD4"];
const CATALOG_COLUMN_WIDTHS = {
  kode_3d: 190,
  nama: 250,
  lokasi: 240,
  data_bangunan: 230,
  model_status: 200,
  center: 170,
  model_url: 180,
  updated_at: 190,
  actions: 144,
};

const getCatalogSortValue = (item, key) => {
  const values = {
    nama: item.building_name,
    lokasi: item.asset?.lokasi || item.asset?.desa_kelurahan,
    data_bangunan:
      Number(item.asset?.building_floors || 0) * 1000 +
      Number(item.asset?.building_height_m || 0),
    model_status: item.model_status || (item.model_count > 0 ? "ready" : ""),
    center: Number(item.center_x) || Number(item.center_y) || 0,
    updated_at: new Date(
      item.model_updated_at || item.updated_at || item.created_at,
    ).getTime(),
  };
  return key in values ? values[key] : item?.[key];
};

const batchFileId = (file) =>
  `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`;

function BatchImportDialog({ open, onClose, onCompleted }) {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [existingBuildings, setExistingBuildings] = useState([]);
  const [existingBuildingsLoading, setExistingBuildingsLoading] = useState(false);
  const [lod, setLod] = useState("LOD1");
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(() => setSearch(input.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [input, open]);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    const load = async () => {
      setCandidatesLoading(true);
      try {
        const response = await aset3dCatalogService.candidates({
          page: 1,
          limit: 12,
          search: search || undefined,
        });
        if (!cancelled) setCandidates(response.data?.data || []);
      } catch (error) {
        if (!cancelled) {
          toast.error(errorMessage(error, "Gagal memuat bidang 2D"));
          setCandidates([]);
        }
      } finally {
        if (!cancelled) setCandidatesLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, search]);

  useEffect(() => {
    if (!open || !selectedParcel?.kode_2d) {
      setExistingBuildings([]);
      setExistingBuildingsLoading(false);
      return undefined;
    }
    let cancelled = false;
    const load = async () => {
      setExistingBuildingsLoading(true);
      try {
        const response = await aset3dCatalogService.list({
          page: 1,
          limit: 100,
          search: selectedParcel.kode_2d,
          catalog_status: "active",
          sort: "created_at",
          order: "DESC",
        });
        if (!cancelled) {
          setExistingBuildings(
            (response.data?.data || []).filter(
              (item) => item.kode_2d === selectedParcel.kode_2d,
            ),
          );
        }
      } catch (error) {
        if (!cancelled) {
          setExistingBuildings([]);
          toast.error(errorMessage(error, "Gagal memuat kode 3D pada bidang ini"));
        }
      } finally {
        if (!cancelled) setExistingBuildingsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, selectedParcel?.kode_2d]);

  useEffect(() => {
    if (open) return;
    setInput("");
    setSearch("");
    setSelectedParcel(null);
    setExistingBuildings([]);
    setExistingBuildingsLoading(false);
    setLod("LOD1");
    setFiles([]);
    setProcessing(false);
  }, [open]);

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    const valid = incoming.filter(
      (file) => /\.(kmz|glb|zip)$/i.test(file.name)
        && file.size <= 100 * 1024 * 1024,
    );
    if (valid.length !== incoming.length) {
      toast.error("Sebagian file dilewati. Gunakan KMZ, GLB, atau ZIP maksimal 100 MB.");
    }
    setFiles((current) => [
      ...current,
      ...valid.slice(0, Math.max(0, 20 - current.length)).map((file) => ({
        id: batchFileId(file),
        file,
        state: "pending",
        targetKode3d: "new",
        kode3d: null,
        error: "",
      })),
    ]);
    if (incoming.length + files.length > 20) {
      toast.error("Maksimal 20 bangunan dalam satu proses batch");
    }
  };

  const updateFileState = (id, changes) => {
    setFiles((current) => current.map((item) => (
      item.id === id ? { ...item, ...changes } : item
    )));
  };

  const startImport = async () => {
    if (!selectedParcel || files.length === 0 || processing) {
      toast.error("Pilih kode 2D dan minimal satu file model");
      return;
    }
    setProcessing(true);
    let successCount = 0;
    for (const item of files) {
      if (item.state === "success") {
        successCount += 1;
        continue;
      }
      let createdCode = null;
      let targetCode = item.targetKode3d === "new" ? null : item.targetKode3d;
      updateFileState(item.id, {
        state: targetCode ? "uploading" : "creating",
        error: "",
      });
      try {
        let assetId = selectedParcel.id_aset;
        if (!targetCode) {
          const catalogResponse = await aset3dCatalogService.create(
            selectedParcel.kode_2d,
          );
          const catalog = catalogResponse.data?.data;
          createdCode = catalog?.kode_3d;
          targetCode = createdCode;
          assetId = catalog?.asset?.id_aset || assetId;
          if (!targetCode || !assetId) {
            throw new Error("Kode 3D baru tidak diterima dari server");
          }
        }
        if (!assetId) throw new Error("Aset tujuan model tidak ditemukan");
        updateFileState(item.id, { state: "uploading", kode3d: targetCode });
        const uploadResponse = await assetModel3dService.upload(
          assetId,
          targetCode,
          item.file,
          lod,
        );
        const modelId = uploadResponse.data?.data?.id_model_3d;
        if (modelId) {
          updateFileState(item.id, { state: "converting", kode3d: targetCode });
          await assetModel3dService.convert(assetId, modelId);
        }
        updateFileState(item.id, { state: "success", kode3d: targetCode });
        successCount += 1;
      } catch (error) {
        if (createdCode) {
          await aset3dCatalogService.remove(createdCode).catch(() => {});
        }
        updateFileState(item.id, {
          state: "failed",
          kode3d: item.targetKode3d === "new" ? null : targetCode,
          error: errorMessage(error, error.message || "Import gagal"),
        });
      }
    }
    setProcessing(false);
    await onCompleted();
    if (successCount === files.length) {
      toast.success(`${successCount} bangunan 3D berhasil diimpor ke ${selectedParcel.kode_2d}`);
    } else {
      toast.error(`${successCount} berhasil, ${files.length - successCount} gagal`);
    }
  };

  if (!open) return null;
  const completedCount = files.filter((item) => item.state === "success").length;
  const failedCount = files.filter((item) => item.state === "failed").length;
  return (
    <div className="motion-backdrop fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => !processing && event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="batch-import-title" className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white"><FilesIcon size={19} weight="duotone" /></span>
            <div className="min-w-0"><h2 id="batch-import-title" className="text-sm font-black text-text-primary">Import Batch Bangunan 3D</h2><p className="mt-0.5 truncate text-[9px] text-text-muted">Tentukan tujuan kode 3D secara terpisah untuk setiap file.</p></div>
          </div>
          <button type="button" disabled={processing} onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-surface-secondary hover:text-text-primary disabled:opacity-40" aria-label="Tutup import batch"><XIcon size={17} weight="bold" /></button>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="min-h-0 border-b border-border p-4 lg:border-b-0 lg:border-r">
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-text-muted">1 · Pilih kode 2D</p>
            <label className="relative mt-2 block"><span className="sr-only">Cari kode 2D</span><MagnifyingGlassIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" /><input type="search" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Cari kode 2D atau nama aset…" className="h-10 w-full rounded-xl border border-border bg-surface-secondary pl-9 pr-3 text-[10px] font-semibold text-text-primary outline-none focus:border-accent" /></label>
            <div className="mt-2 max-h-[48vh] space-y-1.5 overflow-y-auto pr-1 dark:[color-scheme:dark]">
              {candidatesLoading ? [1, 2, 3].map((row) => <div key={row} className="h-16 animate-pulse rounded-xl bg-surface-secondary" />) : candidates.map((candidate) => {
                const active = selectedParcel?.kode_2d === candidate.kode_2d;
                return <button key={candidate.kode_2d} type="button" disabled={processing || files.some((item) => item.state === "success")} onClick={() => { setSelectedParcel(candidate); setFiles((current) => current.map((item) => ({ ...item, state: "pending", targetKode3d: "new", kode3d: null, error: "" }))); }} className={`flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${active ? "border-violet-500 bg-violet-500/10" : "border-border hover:border-violet-300 hover:bg-surface-secondary"}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-violet-600 text-white" : "bg-violet-500/10 text-violet-600 dark:text-violet-300"}`}><BuildingsIcon size={15} weight="duotone" /></span><span className="min-w-0 flex-1"><span className="block font-mono text-[9px] font-black text-text-primary">{candidate.kode_2d}</span><span className="mt-0.5 block truncate text-[8px] text-text-muted">{candidate.kode_aset} · {candidate.nama_aset}</span></span>{active && <CheckCircleIcon size={15} weight="fill" className="text-violet-500" />}</button>;
              })}
              {!candidatesLoading && candidates.length === 0 && <div className="rounded-xl border border-dashed border-border py-8 text-center text-[9px] text-text-muted">Bidang 2D tidak ditemukan.</div>}
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto p-4 dark:[color-scheme:dark]">
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1"><p className="text-[8px] font-black uppercase tracking-[0.14em] text-text-muted">2 · Pilih file dan tujuan 3D</p><p className="mt-1 text-[9px] font-bold text-text-secondary">{selectedParcel ? `Tujuan bidang ${selectedParcel.kode_2d}` : "Kode 2D belum dipilih"}</p></div>
              <label><span className="mb-1 block text-[7px] font-black uppercase text-text-muted">LOD</span><select value={lod} disabled={processing} onChange={(event) => setLod(event.target.value)} className="h-9 rounded-lg border border-border bg-surface-secondary px-2.5 text-[9px] font-black text-text-primary outline-none focus:border-violet-500">{BATCH_LOD_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
            </div>

            <label className="mt-3 flex min-h-20 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300 bg-violet-50/60 px-4 text-[9px] font-black text-violet-700 transition hover:border-violet-500 dark:border-violet-500/40 dark:bg-violet-500/5 dark:text-violet-300"><FileArrowUpIcon size={16} weight="bold" />Pilih Beberapa File<input type="file" multiple accept=".kmz,.glb,.zip" disabled={processing || files.length >= 20} onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }} className="hidden" /></label>

            <div className="mt-3 space-y-1.5">
              {files.map((item) => {
                const stateLabel = { pending: "Menunggu", creating: "Membuat kode", uploading: "Mengunggah", converting: "Konversi", success: item.kode3d || "Berhasil", failed: "Gagal" }[item.state];
                return (
                  <div key={item.id} className={`rounded-xl border px-3 py-2 ${item.state === "success" ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/5" : item.state === "failed" ? "border-red-200 bg-red-50/60 dark:border-red-500/30 dark:bg-red-500/5" : "border-border bg-surface-secondary"}`}>
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-text-muted">
                        {["creating", "uploading", "converting"].includes(item.state) ? <ArrowsClockwiseIcon size={14} className="animate-spin text-violet-500" /> : item.state === "success" ? <CheckCircleIcon size={15} weight="fill" className="text-emerald-500" /> : item.state === "failed" ? <WarningCircleIcon size={15} weight="fill" className="text-red-500" /> : <CubeIcon size={14} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[9px] font-bold text-text-primary">{item.file.name}</span>
                        <span className={`mt-0.5 block truncate text-[7px] ${item.state === "failed" ? "text-red-600 dark:text-red-300" : "text-text-muted"}`}>
                          {item.error || `${(item.file.size / 1024 / 1024).toFixed(1)} MB · ${stateLabel}`}
                        </span>
                      </span>
                      {!processing && item.state !== "success" && <button type="button" onClick={() => setFiles((current) => current.filter((fileItem) => fileItem.id !== item.id))} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10" aria-label={`Hapus ${item.file.name}`}><XIcon size={12} weight="bold" /></button>}
                    </div>
                    <label className="mt-2 flex items-center gap-2 pl-10">
                      <span className="shrink-0 text-[7px] font-black uppercase tracking-wide text-text-muted">Masukkan ke</span>
                      <select
                        value={item.targetKode3d}
                        disabled={processing || item.state === "success" || !selectedParcel || existingBuildingsLoading}
                        onChange={(event) => updateFileState(item.id, {
                          targetKode3d: event.target.value,
                          state: "pending",
                          kode3d: null,
                          error: "",
                        })}
                        className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 text-[8px] font-bold text-text-primary outline-none focus:border-violet-500 disabled:cursor-not-allowed disabled:opacity-65"
                        aria-label={`Tujuan kode 3D untuk ${item.file.name}`}
                      >
                        <option value="new">Buat kode 3D baru</option>
                        {existingBuildings.map((building) => (
                          <option key={building.kode_3d} value={building.kode_3d}>
                            {building.kode_3d} · {building.building_name || "Tanpa nama"}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                );
              })}
              {files.length === 0 && <div className="rounded-xl border border-dashed border-border py-8 text-center"><FilesIcon size={24} className="mx-auto text-text-muted" /><p className="mt-2 text-[9px] font-bold text-text-muted">Belum ada file · Maksimal 20 file</p></div>}
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-secondary/60 px-5 py-3"><p className="text-[9px] font-bold text-text-muted">{files.length} file · {completedCount} berhasil{failedCount > 0 ? ` · ${failedCount} gagal` : ""}</p><div className="flex gap-2"><button type="button" disabled={processing} onClick={onClose} className="h-9 rounded-lg border border-border bg-surface px-3 text-[9px] font-black text-text-secondary hover:border-accent">{completedCount > 0 ? "Selesai" : "Batal"}</button><button type="button" disabled={processing || !selectedParcel || files.length === 0 || completedCount === files.length} onClick={startImport} className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-[9px] font-black text-surface transition hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">{processing ? <ArrowsClockwiseIcon size={14} className="animate-spin" /> : <FileArrowUpIcon size={14} weight="bold" />}{processing ? "Memproses batch…" : failedCount > 0 ? "Coba Lagi yang Gagal" : "Mulai Import"}</button></div></footer>
      </section>
    </div>
  );
}

function AddAssetDialog({ open, onClose, onAdded }) {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    const timeout = setTimeout(() => {
      setSearch(input.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [input, open]);

  const fetchCandidates = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const response = await aset3dCatalogService.candidates({
        page,
        limit: 8,
        search: search || undefined,
      });
      setItems(response.data?.data || []);
      setPagination(response.data?.pagination || null);
    } catch (error) {
      toast.error(errorMessage(error, "Gagal mencari aset Pusat Data"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [open, page, search]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const addAsset = async (asset) => {
    setAddingId(asset.kode_2d);
    try {
      const response = await aset3dCatalogService.create(asset.kode_2d);
      toast.success(response.data?.message || "Bangunan 3D berhasil ditambahkan");
      await fetchCandidates();
      onAdded();
    } catch (error) {
      toast.error(errorMessage(error, "Gagal menambahkan aset ke Kelola 3D"));
    } finally {
      setAddingId(null);
    }
  };

  if (!open) return null;
  return (
    <div className="motion-backdrop fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="add-asset-3d-title" className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-surface"><PlusIcon size={18} weight="bold" /></span>
            <div>
              <h2 id="add-asset-3d-title" className="text-base font-black text-text-primary">Pilih Bidang Tanah 2D</h2>
              <p className="mt-1 text-[10px] text-text-muted">Satu bidang 2D dapat memiliki beberapa bangunan dengan kode 3D berbeda.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-surface-secondary hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent" aria-label="Tutup dialog">
            <XIcon size={17} weight="bold" />
          </button>
        </header>

        <div className="border-b border-border p-4">
          <label className="relative block">
            <span className="sr-only">Cari bidang berdasarkan kode 2D, kode aset, nama, atau lokasi</span>
            <MagnifyingGlassIcon size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input autoFocus type="search" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Cari kode 2D, kode aset, nama, atau lokasi…" className="h-11 w-full rounded-xl border border-border bg-surface-secondary pl-10 pr-4 text-xs font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15" />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 dark:[color-scheme:dark]">
          {loading ? (
            <div className="grid gap-3 md:grid-cols-2">{[1, 2, 3, 4].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-surface-secondary" />)}</div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
              <BuildingsIcon size={30} className="mx-auto text-text-muted" />
              <p className="mt-3 text-xs font-black text-text-primary">Bidang 2D tidak ditemukan</p>
              <p className="mt-1 text-[10px] text-text-muted">Coba kata kunci lain atau tambahkan bidang melalui Pusat Data.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((asset) => (
                <article key={asset.kode_2d} className="flex min-w-0 items-start gap-3 rounded-xl border border-border bg-surface p-3.5 transition hover:border-accent/40 hover:shadow-sm">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><BuildingsIcon size={19} weight="duotone" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md bg-accent/10 px-2 py-1 font-mono text-[9px] font-black text-accent">{asset.kode_2d}</span>
                      <span className="truncate text-[9px] font-bold text-text-muted">Aset {asset.kode_aset}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] font-extrabold text-text-primary">{asset.nama_aset}</p>
                    <p className="mt-1 flex items-center gap-1 truncate text-[9px] text-text-muted"><MapPinIcon size={10} /> {asset.lokasi || asset.desa_kelurahan || "Lokasi belum diisi"}</p>
                    <p className="mt-1 text-[8px] font-bold text-text-muted">{asset.building_count || 0} bangunan 3D terdaftar</p>
                  </div>
                  <button type="button" disabled={addingId === asset.kode_2d} onClick={() => addAsset(asset)} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 text-[9px] font-black text-surface transition hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-60">
                    {addingId === asset.kode_2d ? <ArrowsClockwiseIcon size={13} className="animate-spin" /> : <PlusIcon size={13} weight="bold" />}
                    Bangunan
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
        <Pagination pagination={pagination} onChange={setPage} />
      </section>
    </div>
  );
}

export default function Kelola3dPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const confirm = useConfirm();
  const userRole = useAuthStore((state) => state.user?.role || "");
  const canUpdate = hasPermission(userRole, "kelola3d", "update");
  const initialSearch = searchParams.get("search")?.trim() || "";
  const [input, setInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [modelStatus, setModelStatus] = useState("all");
  const [format, setFormat] = useState("all");
  const [centerStatus, setCenterStatus] = useState("all");
  const [sortValue, setSortValue] = useState(DEFAULT_SORT);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [items, setItems] = useState([]);
  const {
    columnWidths,
    onResizeStart,
    resizeColumn,
    resetColumnWidth,
  } = useColumnResize(CATALOG_COLUMN_WIDTHS);
  const {
    sortedRows: sortedItems,
    sortKey: tableSortKey,
    sortDirection: tableSortDirection,
    requestSort: requestTableSort,
  } = useTableSort(items, {
    initialKey: "updated_at",
    initialDirection: "desc",
    getValue: getCatalogSortValue,
  });
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [deletingCode, setDeletingCode] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(input.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [input]);

  const [sort, order] = useMemo(() => sortValue.split(":"), [sortValue]);
  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const response = await aset3dCatalogService.list({
        page,
        limit,
        search: search || undefined,
        model_status: modelStatus,
        format,
        center_status: centerStatus,
        sort,
        order,
      });
      setItems(response.data?.data || []);
      setPagination(response.data?.pagination || null);
    } catch (error) {
      toast.error(errorMessage(error, "Gagal memuat daftar Kelola 3D"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [centerStatus, format, limit, modelStatus, order, page, search, sort]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const removeItem = async (item) => {
    const approved = await confirm({
      title: "Hapus Aset 3D?",
      message: item.model_count > 0
        ? `${item.kode_3d} dan ${item.model_count} versi modelnya akan dihapus permanen. Bidang 2D dan data aset tetap tersimpan.`
        : `${item.kode_3d} akan dihapus permanen. Bidang 2D dan data aset tetap tersimpan.`,
      confirmText: "Hapus Aset 3D",
      variant: "danger",
    });
    if (!approved) return;
    setDeletingCode(item.kode_3d);
    try {
      const response = await aset3dCatalogService.remove(item.kode_3d);
      toast.success(response.data?.message || "Aset 3D berhasil dihapus");
      if (items.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await fetchCatalog();
      }
    } catch (error) {
      toast.error(errorMessage(error, "Gagal menghapus aset 3D"));
    } finally {
      setDeletingCode(null);
    }
  };

  const exportCatalog = async () => {
    try {
      const response = await aset3dCatalogService.exportCsv({
        search: search || undefined,
        model_status: modelStatus,
        format,
        center_status: centerStatus,
        sort,
        order,
      });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `katalog-3d-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Katalog sesuai filter berhasil diekspor");
    } catch (error) {
      toast.error(errorMessage(error, "Gagal mengekspor katalog 3D"));
    }
  };

  const activeFilterCount = [
    modelStatus,
    format,
    centerStatus,
  ].filter((value) => value !== "all").length;
  const hasActiveControls =
    Boolean(input) || activeFilterCount > 0 || sortValue !== DEFAULT_SORT;
  const resetControls = () => {
    setInput("");
    setModelStatus("all");
    setFormat("all");
    setCenterStatus("all");
    setSortValue(DEFAULT_SORT);
    setPage(1);
  };

  return (
    <div className="min-h-full bg-surface-secondary p-4 md:p-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="admin-page-header">
          <div className="admin-page-header__identity">
            <span className="admin-page-header__icon bg-linear-to-br from-violet-600 to-sky-500 text-white">
              <CubeIcon size={21} weight="duotone" />
            </span>
            <div className="min-w-0">
              <h1 className="admin-page-header__title">Kelola 3D</h1>
            </div>
          </div>
          <div className="admin-page-header__actions">
            <button
              type="button"
              onClick={fetchCatalog}
              disabled={loading}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs font-bold text-text-secondary transition hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
            >
              <ArrowsClockwiseIcon
                size={15}
                weight="bold"
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
            {canUpdate && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBatchDialogOpen(true)}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-accent/35 bg-accent/10 px-3 text-xs font-bold text-accent transition hover:border-accent/60 hover:bg-accent/15 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  <FilesIcon size={15} weight="duotone" />
                  Import Batch 3D
                </button>
                <button
                  type="button"
                  onClick={() => setDialogOpen(true)}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-accent px-3 text-xs font-bold text-surface transition hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  <PlusIcon size={15} weight="bold" />
                  Tambah Bangunan 3D
                </button>
              </div>
            )}
          </div>
        </header>

        <section className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="flex min-w-0 flex-wrap items-center gap-2 border-b border-border p-3">
            <label className="relative min-w-56 flex-1">
              <span className="sr-only">Cari katalog 3D</span>
              <MagnifyingGlassIcon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input type="search" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Cari kode 3D, nama bangunan, aset, lokasi…" className="h-10 w-full rounded-xl border border-border bg-surface-secondary pl-10 pr-3 text-[10px] font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15" />
            </label>
            <select value={sortValue} onChange={(event) => { setSortValue(event.target.value); setPage(1); }} className="h-10 rounded-xl border border-border bg-surface-secondary px-3 text-[10px] font-bold text-text-secondary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15">
              {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              aria-expanded={showFilters}
              className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-[10px] font-bold transition ${
                showFilters || activeFilterCount
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border text-text-secondary hover:bg-surface-secondary"
              }`}
            >
              <FunnelIcon size={14} weight={showFilters ? "fill" : "bold"} />
              Filter
              {activeFilterCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {hasActiveControls && (
              <button
                type="button"
                onClick={resetControls}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border px-3 text-[10px] font-bold text-text-secondary transition hover:border-accent hover:text-accent"
              >
                <ArrowCounterClockwiseIcon size={14} weight="bold" />
                Reset
              </button>
            )}
            <button type="button" onClick={exportCatalog} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-3 text-[9px] font-black text-surface transition hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent">
              <DownloadSimpleIcon size={14} weight="bold" /> Ekspor CSV
            </button>
          </div>
          {showFilters && (
            <div className="grid grid-cols-2 gap-2 border-b border-border p-3 md:grid-cols-3">
              <select value={modelStatus} onChange={(event) => { setModelStatus(event.target.value); setPage(1); }} className="h-9 min-w-0 rounded-lg border border-border bg-surface px-2.5 text-[9px] font-bold text-text-secondary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15">
                <option value="all">Semua status model</option>
                <option value="with_model">Dengan model</option>
                <option value="without_model">Belum ada model</option>
              </select>
              <select value={format} onChange={(event) => { setFormat(event.target.value); setPage(1); }} className="h-9 min-w-0 rounded-lg border border-border bg-surface px-2.5 text-[9px] font-bold text-text-secondary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15">
                <option value="all">Semua format</option>
                <option value="KMZ">KMZ</option>
                <option value="GLB">GLB</option>
                <option value="3DTILES">3D Tiles</option>
              </select>
              <select value={centerStatus} onChange={(event) => { setCenterStatus(event.target.value); setPage(1); }} className="h-9 min-w-0 rounded-lg border border-border bg-surface px-2.5 text-[9px] font-bold text-text-secondary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15">
                <option value="all">Semua kelengkapan koordinat</option>
                <option value="with_center">Center tersedia</option>
                <option value="without_center">Center belum tersedia</option>
              </select>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="admin-data-table min-w-[1754px] table-fixed">
              <thead>
                <tr className="border-b border-border bg-linear-to-r from-surface-secondary to-surface">
                  {[
                    ["kode_3d", "Bidang 2D / Bangunan 3D"],
                    ["nama", "Nama / Kategori"],
                    ["lokasi", "Lokasi"],
                    ["data_bangunan", "Data Bangunan"],
                    ["model_status", "Status Model"],
                    ["center", "Center X / Y"],
                    ["model_url", "URL Model"],
                    ["updated_at", "Dibuat / Diperbarui"],
                  ].map(([key, label]) => (
                    <SortableTableHeader
                      key={key}
                      columnKey={key}
                      sortKey={tableSortKey}
                      sortDirection={tableSortDirection}
                      onSort={requestTableSort}
                      width={columnWidths[key]}
                      onResizeStart={onResizeStart}
                      onResizeBy={resizeColumn}
                      onResetWidth={resetColumnWidth}
                    >
                      {label}
                    </SortableTableHeader>
                  ))}
                  <SortableTableHeader
                    columnKey="actions"
                    sortable={false}
                    className="sticky right-0 z-20 border-l border-border bg-surface-secondary text-right"
                    width={columnWidths.actions}
                    onResizeStart={onResizeStart}
                    onResizeBy={resizeColumn}
                    onResetWidth={resetColumnWidth}
                  >
                    Aksi
                  </SortableTableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? [1, 2, 3, 4, 5].map((item) => <tr key={item}><td colSpan="9" className="px-4 py-3"><div className="h-14 animate-pulse rounded-lg bg-surface-secondary" /></td></tr>) : items.length === 0 ? (
                  <tr><td colSpan="9" className="px-6 py-14 text-center"><CubeIcon size={32} className="mx-auto text-text-muted" /><p className="mt-3 text-xs font-black text-text-primary">Belum ada bangunan di Kelola 3D</p><p className="mt-1 text-[10px] text-text-muted">Pilih bidang 2D lalu tambahkan bangunan 3D pertama.</p></td></tr>
                ) : sortedItems.map((item) => (
                  <tr key={item.kode_3d} className="group transition hover:bg-accent/[0.025]">
                    <td className="px-4 py-3"><p className="font-mono text-[9px] font-bold text-text-muted">{item.kode_2d || "Kode 2D —"}</p><span className="mt-1 inline-flex rounded-lg bg-violet-50 px-2.5 py-1.5 font-mono text-[10px] font-black text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">{item.kode_3d}</span></td>
                    <td className="px-4 py-3"><p className="max-w-64 truncate text-[10px] font-bold text-text-primary">{item.building_name || "Nama bangunan belum diisi"}</p><p className="mt-1 text-[8px] font-bold uppercase text-text-muted">{item.asset?.kode_aset || "—"} · {item.category || "Bangunan"} · {item.model_format || "Tanpa model"}</p></td>
                    <td className="px-4 py-3"><p className="flex max-w-64 items-center gap-1 truncate text-[9px] text-text-secondary"><MapPinIcon size={10} /> {item.asset?.lokasi || item.asset?.desa_kelurahan || "—"}</p><p className="mt-1 max-w-64 truncate text-[8px] text-text-muted">{item.asset?.opd_pengguna || "OPD belum diisi"}</p></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {[...new Set(
                          (item.active_models || [])
                            .map((model) => model.lod)
                            .filter(Boolean),
                        )].map((lod) => (
                          <span key={lod} className="rounded-md bg-violet-50 px-2 py-1 text-[8px] font-black text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                            {lod} aktif
                          </span>
                        ))}
                        {(item.active_models || []).length === 0 && (
                          <span className="rounded-md bg-surface-secondary px-2 py-1 text-[8px] font-bold text-text-muted">
                            Belum ada LOD aktif
                          </span>
                        )}
                        <span className="rounded-md bg-surface-secondary px-2 py-1 text-[8px] font-bold text-text-secondary">{item.asset?.building_height_m ? `${item.asset.building_height_m} m` : "Tinggi —"}</span>
                        <span className="rounded-md bg-surface-secondary px-2 py-1 text-[8px] font-bold text-text-secondary">{item.asset?.building_floors ? `${item.asset.building_floors} lantai` : "Lantai —"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {item.model_count > 0 ? (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[8px] font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                            <CheckCircleIcon size={11} weight="fill" />
                            {modelStatusLabel[item.model_status] || item.model_status}
                          </span>
                          <p className="mt-1 text-[8px] font-semibold uppercase text-text-muted">
                            {item.model_count} versi · {item.active_model?.model_type || "Model 3D"} · v{item.active_model?.version || "—"}
                          </p>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[8px] font-black text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                          <CubeIcon size={11} /> Belum ada file model
                        </span>
                      )}
                      <p className="mt-1 text-[8px] font-bold uppercase text-text-muted">
                        Katalog {item.status === "active" ? "aktif" : "nonaktif"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-[9px] font-semibold text-text-secondary">
                        X {formatCoordinate(item.center_x)}
                      </p>
                      <p className="mt-1 font-mono text-[9px] font-semibold text-text-secondary">
                        Y {formatCoordinate(item.center_y)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {item.model_url ? (
                        <a
                          href={item.model_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex max-w-48 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[8px] font-bold text-accent hover:border-accent"
                          title={item.model_url}
                        >
                          <LinkSimpleIcon size={11} />
                          <span className="truncate">Buka URL model</span>
                        </a>
                      ) : (
                        <span className="text-[9px] text-text-muted">Belum tersedia</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[9px] font-semibold text-text-secondary">
                        Dibuat {formatDate(item.created_at)}
                      </p>
                      <p className="mt-1 text-[8px] text-text-muted">
                        Diperbarui {formatDate(item.model_updated_at || item.updated_at)}
                      </p>
                    </td>
                    <td className="sticky right-0 z-10 w-36 min-w-36 border-l border-border bg-surface px-4 py-3 group-hover:bg-surface-secondary"><div className="flex justify-end gap-1.5"><button type="button" onClick={() => navigate(`/kelola-3d/${encodeURIComponent(item.kode_3d)}`)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-[9px] font-black text-surface transition hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent"><span>Kelola</span><ArrowRightIcon size={12} weight="bold" /></button>{canUpdate && <button type="button" disabled={deletingCode === item.kode_3d} onClick={() => removeItem(item)} className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-wait disabled:opacity-50 dark:hover:bg-red-500/10" aria-label={`Hapus aset 3D ${item.kode_3d}`} title="Hapus aset 3D">{deletingCode === item.kode_3d ? <ArrowsClockwiseIcon size={14} className="animate-spin" /> : <TrashIcon size={14} weight="bold" />}</button>}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            pagination={pagination}
            onChange={setPage}
            pageSize={limit}
            pageSizeOptions={[10, 20, 50]}
            onPageSizeChange={(value) => {
              setLimit(value);
              setPage(1);
            }}
            embedded
            itemLabel="aset"
          />
        </section>
      </div>
      <BatchImportDialog
        open={batchDialogOpen}
        onClose={() => setBatchDialogOpen(false)}
        onCompleted={fetchCatalog}
      />
      <AddAssetDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onAdded={() => { setPage(1); fetchCatalog(); }} />
    </div>
  );
}
