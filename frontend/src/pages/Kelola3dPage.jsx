import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  ArrowCounterClockwiseIcon,
  ArrowsClockwiseIcon,
  BuildingsIcon,
  CheckCircleIcon,
  CubeIcon,
  DownloadSimpleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  LinkSimpleIcon,
  MapPinIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useConfirm } from "../components/ui/confirmContext";
import { aset3dCatalogService } from "../services/api";
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
  { value: "nama_aset:ASC", label: "Nama aset A–Z" },
];
const DEFAULT_SORT = "created_at:DESC";
const CATALOG_COLUMN_WIDTHS = {
  kode_3d: 150,
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
    nama: item.asset?.nama_aset,
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
    setAddingId(asset.id_aset);
    try {
      const response = await aset3dCatalogService.create(asset.id_aset);
      toast.success(response.data?.message || "Aset berhasil ditambahkan");
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
              <h2 id="add-asset-3d-title" className="text-base font-black text-text-primary">Cari dan Tambahkan Aset</h2>
              <p className="mt-1 text-[10px] text-text-muted">Hanya aset yang belum terdaftar di Kelola 3D yang ditampilkan.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-surface-secondary hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent" aria-label="Tutup dialog">
            <XIcon size={17} weight="bold" />
          </button>
        </header>

        <div className="border-b border-border p-4">
          <label className="relative block">
            <span className="sr-only">Cari aset berdasarkan kode, nama, lokasi, atau OPD</span>
            <MagnifyingGlassIcon size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input autoFocus type="search" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Cari kode aset, nama, lokasi, atau OPD…" className="h-11 w-full rounded-xl border border-border bg-surface-secondary pl-10 pr-4 text-xs font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15" />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 dark:[color-scheme:dark]">
          {loading ? (
            <div className="grid gap-3 md:grid-cols-2">{[1, 2, 3, 4].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-surface-secondary" />)}</div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
              <BuildingsIcon size={30} className="mx-auto text-text-muted" />
              <p className="mt-3 text-xs font-black text-text-primary">Aset tidak ditemukan</p>
              <p className="mt-1 text-[10px] text-text-muted">Coba kata kunci lain atau aset tersebut sudah masuk Kelola 3D.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((asset) => (
                <article key={asset.id_aset} className="flex min-w-0 items-start gap-3 rounded-xl border border-border bg-surface p-3.5 transition hover:border-accent/40 hover:shadow-sm">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><BuildingsIcon size={19} weight="duotone" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-black text-accent">{asset.kode_aset}</p>
                    <p className="mt-0.5 truncate text-[11px] font-extrabold text-text-primary">{asset.nama_aset}</p>
                    <p className="mt-1 flex items-center gap-1 truncate text-[9px] text-text-muted"><MapPinIcon size={10} /> {asset.lokasi || asset.desa_kelurahan || "Lokasi belum diisi"}</p>
                  </div>
                  <button type="button" disabled={addingId === asset.id_aset} onClick={() => addAsset(asset)} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 text-[9px] font-black text-surface transition hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-60">
                    {addingId === asset.id_aset ? <ArrowsClockwiseIcon size={13} className="animate-spin" /> : <PlusIcon size={13} weight="bold" />}
                    Tambah
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
  const confirm = useConfirm();
  const userRole = useAuthStore((state) => state.user?.role || "");
  const canUpdate = hasPermission(userRole, "kelola3d", "update");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [modelStatus, setModelStatus] = useState("all");
  const [catalogStatus, setCatalogStatus] = useState("all");
  const [reviewStatus, setReviewStatus] = useState("all");
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
        catalog_status: catalogStatus,
        review_status: reviewStatus,
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
  }, [catalogStatus, centerStatus, format, limit, modelStatus, order, page, reviewStatus, search, sort]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const removeItem = async (item) => {
    const approved = await confirm({
      title: "Hapus Aset 3D?",
      message: item.model_count > 0
        ? `${item.kode_3d} akan dihapus dari Kelola 3D dan ${item.model_count} versi model akan diarsipkan. Data aset di Pusat Data tetap tersimpan.`
        : `${item.kode_3d} akan dihapus dari Kelola 3D. Data aset di Pusat Data tetap tersimpan.`,
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
        catalog_status: catalogStatus,
        review_status: reviewStatus,
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

  const totalWithModels = items.filter((item) => item.model_count > 0).length;
  const activeFilterCount = [
    modelStatus,
    catalogStatus,
    reviewStatus,
    format,
    centerStatus,
  ].filter((value) => value !== "all").length;
  const hasActiveControls =
    Boolean(input) || activeFilterCount > 0 || sortValue !== DEFAULT_SORT;
  const resetControls = () => {
    setInput("");
    setModelStatus("all");
    setCatalogStatus("all");
    setReviewStatus("all");
    setFormat("all");
    setCenterStatus("all");
    setSortValue(DEFAULT_SORT);
    setPage(1);
  };

  return (
    <div className="min-h-full bg-surface-secondary p-4 md:p-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-violet-600 to-sky-500 text-white">
              <CubeIcon size={21} weight="duotone" />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-text-primary">Kelola 3D</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-accent px-3 text-xs font-bold text-surface transition hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                <PlusIcon size={15} weight="bold" />
                Cari & Tambah Aset
              </button>
            )}
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Total katalog", value: pagination?.totalItems || 0, icon: BuildingsIcon, tone: "text-accent bg-accent/10" },
            { label: "Dengan model · halaman ini", value: totalWithModels, icon: CheckCircleIcon, tone: "text-emerald-600 bg-emerald-500/10" },
            { label: "Perlu model · halaman ini", value: Math.max(0, items.length - totalWithModels), icon: CubeIcon, tone: "text-amber-600 bg-amber-500/10" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.tone}`}><stat.icon size={18} weight="duotone" /></span>
              <div><p className="text-lg font-black leading-none text-text-primary">{stat.value}</p><p className="mt-1 text-[8px] font-bold uppercase tracking-wide text-text-muted">{stat.label}</p></div>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="flex min-w-0 flex-wrap items-center gap-2 border-b border-border p-3">
            <label className="relative min-w-56 flex-1">
              <span className="sr-only">Cari katalog 3D</span>
              <MagnifyingGlassIcon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input type="search" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Cari kode 3D, kode aset, nama, lokasi…" className="h-10 w-full rounded-xl border border-border bg-surface-secondary pl-10 pr-3 text-[10px] font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15" />
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
            <div className="grid grid-cols-2 gap-2 border-b border-border p-3 md:grid-cols-3 xl:grid-cols-5">
              <select value={modelStatus} onChange={(event) => { setModelStatus(event.target.value); setPage(1); }} className="h-9 min-w-0 rounded-lg border border-border bg-surface px-2.5 text-[9px] font-bold text-text-secondary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15">
                <option value="all">Semua status model</option>
                <option value="with_model">Dengan model</option>
                <option value="without_model">Belum ada model</option>
              </select>
              <select value={catalogStatus} onChange={(event) => { setCatalogStatus(event.target.value); setPage(1); }} className="h-9 min-w-0 rounded-lg border border-border bg-surface px-2.5 text-[9px] font-bold text-text-secondary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15">
                <option value="all">Semua status katalog</option>
                <option value="active">Katalog aktif</option>
                <option value="inactive">Katalog nonaktif</option>
              </select>
              <select value={reviewStatus} onChange={(event) => { setReviewStatus(event.target.value); setPage(1); }} className="h-9 min-w-0 rounded-lg border border-border bg-surface px-2.5 text-[9px] font-bold text-text-secondary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15">
                <option value="all">Semua status verifikasi</option>
                <option value="draft">Draf</option>
                <option value="processing">Diproses</option>
                <option value="needs_review">Perlu verifikasi</option>
                <option value="verified">Terverifikasi</option>
                <option value="rejected">Ditolak</option>
                <option value="active">Aktif</option>
                <option value="expired">Kedaluwarsa</option>
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
            <table className="w-full min-w-[1754px] table-fixed border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-linear-to-r from-surface-secondary to-surface">
                  {[
                    ["kode_3d", "Kode 3D"],
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
                  <tr><td colSpan="9" className="px-6 py-14 text-center"><CubeIcon size={32} className="mx-auto text-text-muted" /><p className="mt-3 text-xs font-black text-text-primary">Belum ada aset di Kelola 3D</p><p className="mt-1 text-[10px] text-text-muted">Gunakan tombol Cari & Tambah Aset untuk memulai.</p></td></tr>
                ) : sortedItems.map((item) => (
                  <tr key={item.kode_3d} className="group transition hover:bg-accent/[0.025]">
                    <td className="px-4 py-3"><span className="inline-flex rounded-lg bg-violet-50 px-2.5 py-1.5 font-mono text-[10px] font-black text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">{item.kode_3d}</span></td>
                    <td className="px-4 py-3"><p className="max-w-64 truncate text-[10px] font-bold text-text-primary">{item.asset?.nama_aset || "Nama aset belum diisi"}</p><p className="mt-1 text-[8px] font-bold uppercase text-text-muted">{item.asset?.kode_aset || "—"} · {item.category || "Bangunan"} · {item.model_format || "Tanpa model"}</p></td>
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
      <AddAssetDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onAdded={() => { setPage(1); fetchCatalog(); }} />
    </div>
  );
}
