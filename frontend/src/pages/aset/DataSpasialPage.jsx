import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowCounterClockwiseIcon,
  ArrowRightIcon,
  ArrowsClockwiseIcon,
  BuildingsIcon,
  CheckCircleIcon,
  FunnelIcon,
  GlobeHemisphereWestIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  NavigationArrowIcon,
  PlusIcon,
  PolygonIcon,
  TrashIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import Pagination from "../../components/asset/Pagination";
import { useConfirm } from "../../components/ui/confirmContext";
import { aset2dCatalogService } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";
import { hasPermission } from "../../utils/permissions";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.error || error?.response?.data?.message || fallback;

const formatCoordinate = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(6) : "—";
};

function StatusBadge({ available, label, emptyLabel, icon: Icon }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[8px] font-black ${
        available
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
      }`}
    >
      <Icon size={11} weight={available ? "fill" : "bold"} />
      {available ? label : emptyLabel}
    </span>
  );
}

function AddAsset2dDialog({ open, onClose, onAdded }) {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addingCode, setAddingCode] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    const timeout = window.setTimeout(() => {
      setSearch(input.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [input, open]);

  const fetchCandidates = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const response = await aset2dCatalogService.candidates({
        page,
        limit: 8,
        search: search || undefined,
      });
      setItems(response.data?.data || []);
      setPagination(response.data?.pagination || null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal mencari aset Pusat Data"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [open, page, search]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const addAsset = async (asset) => {
    setAddingCode(asset.kode_aset);
    try {
      const response = await aset2dCatalogService.create(asset.kode_aset);
      toast.success(response.data?.message || "Tanah ditambahkan ke Data Spasial");
      await fetchCandidates();
      await onAdded();
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal menambahkan tanah ke Data Spasial"));
    } finally {
      setAddingCode(null);
    }
  };

  if (!open) return null;
  return (
    <div
      className="motion-backdrop fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-asset-2d-title"
        className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-surface">
              <PlusIcon size={18} weight="bold" />
            </span>
            <div>
              <h2 id="add-asset-2d-title" className="text-base font-black text-text-primary">
                Pilih Tanah untuk Data Spasial
              </h2>
              <p className="mt-1 text-[10px] text-text-muted">
                Sistem membuat satu Kode Bidang yang terhubung ke Kode Tanah terpilih.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-secondary hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Tutup dialog"
          >
            <XIcon size={17} weight="bold" />
          </button>
        </header>

        <div className="border-b border-border p-4">
          <label className="relative block">
            <span className="sr-only">Cari kode tanah, nama tanah, atau lokasi</span>
            <MagnifyingGlassIcon size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              autoFocus
              type="search"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Cari kode tanah, nama tanah, atau lokasi…"
              className="h-11 w-full rounded-xl border border-border bg-surface-secondary pl-10 pr-4 text-xs font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 dark:[color-scheme:dark]">
          {loading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-28 animate-pulse rounded-xl bg-surface-secondary" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
              <CheckCircleIcon size={30} className="mx-auto text-emerald-500" weight="duotone" />
              <p className="mt-3 text-xs font-black text-text-primary">Tidak ada aset yang dapat ditambahkan</p>
              <p className="mt-1 text-[10px] text-text-muted">
                Semua hasil pencarian sudah berada di Data Spasial atau belum tersedia di Pusat Data Tanah.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((asset) => (
                <article
                  key={asset.id_aset}
                  className="flex min-w-0 items-start gap-3 rounded-xl border border-border bg-surface p-3.5 transition hover:border-accent/40"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-300">
                    <GlobeHemisphereWestIcon size={19} weight="duotone" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="rounded-md bg-accent/10 px-2 py-1 font-mono text-[9px] font-black text-accent">
                      {asset.kode_aset}
                    </span>
                    <p className="mt-1 truncate text-[11px] font-extrabold text-text-primary">
                      {asset.nama_aset}
                    </p>
                    <p className="mt-1 flex items-center gap-1 truncate text-[9px] text-text-muted">
                      <MapPinIcon size={10} />
                      {asset.lokasi || asset.desa_kelurahan || "Lokasi belum diisi"}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={addingCode === asset.kode_aset}
                    onClick={() => addAsset(asset)}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 text-[9px] font-black text-surface transition hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
                  >
                    {addingCode === asset.kode_aset
                      ? <ArrowsClockwiseIcon size={13} className="animate-spin" />
                      : <PlusIcon size={13} weight="bold" />}
                    Pilih
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-border p-4">
          <Pagination pagination={pagination} onChange={setPage} itemLabel="tanah" />
        </div>
      </section>
    </div>
  );
}

export default function DataSpasialPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const userRole = useAuthStore((state) => state.user?.role || "");
  const canUpdate = hasPermission(userRole, "aset", "update");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [coordinateStatus, setCoordinateStatus] = useState("all");
  const [polygonStatus, setPolygonStatus] = useState("all");
  const [buildingStatus, setBuildingStatus] = useState("all");
  const [sortValue, setSortValue] = useState("updated_at:DESC");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removingCode, setRemovingCode] = useState(null);

  const [sort, order] = useMemo(() => sortValue.split(":"), [sortValue]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(input.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [input]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const catalogResponse = await aset2dCatalogService.list({
        page,
        limit,
        search: search || undefined,
        coordinate_status: coordinateStatus,
        polygon_status: polygonStatus,
        building_status: buildingStatus,
        sort,
        order,
      });
      setItems(catalogResponse.data?.data || []);
      setPagination(catalogResponse.data?.pagination || null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal memuat Data Spasial"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [buildingStatus, coordinateStatus, limit, order, page, polygonStatus, search, sort]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const removeItem = async (item) => {
    const approved = await confirm({
      title: "Keluarkan dari Data Spasial?",
      message: `${item.kode_2d} akan dikeluarkan dari Data Spasial. Data tanah di Pusat Data Tanah tidak dihapus.`,
      confirmText: "Keluarkan",
      variant: "danger",
    });
    if (!approved) return;
    setRemovingCode(item.kode_2d);
    try {
      const response = await aset2dCatalogService.remove(item.kode_2d);
      toast.success(response.data?.message || "Bidang dikeluarkan dari Data Spasial");
      if (items.length === 1 && page > 1) setPage((current) => current - 1);
      else await fetchData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal mengeluarkan bidang 2D"));
    } finally {
      setRemovingCode(null);
    }
  };

  const activeFilterCount = [coordinateStatus, polygonStatus, buildingStatus]
    .filter((value) => value !== "all").length;
  const hasActiveControls = Boolean(input) || activeFilterCount > 0;
  const resetControls = () => {
    setInput("");
    setCoordinateStatus("all");
    setPolygonStatus("all");
    setBuildingStatus("all");
    setPage(1);
  };

  return (
    <div className="min-h-full bg-surface-secondary p-4 md:p-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="admin-page-header">
          <div className="admin-page-header__identity">
            <span className="admin-page-header__icon bg-linear-to-br from-cyan-500 to-blue-600 text-white">
              <GlobeHemisphereWestIcon size={21} weight="duotone" />
            </span>
            <div className="min-w-0">
              <h1 className="admin-page-header__title">Data Spasial</h1>
              <p className="admin-page-header__description">
                Pilih tanah dari Pusat Data Tanah, lengkapi Kode Bidang, lalu hubungkan bangunan 3D bila diperlukan.
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
                onClick={() => setDialogOpen(true)}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-accent px-3 text-xs font-bold text-surface transition hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent"
              >
                <PlusIcon size={15} weight="bold" />
                Pilih Tanah
              </button>
            )}
          </div>
        </header>

        <section className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="flex min-w-0 flex-wrap items-center gap-2 border-b border-border p-3">
            <label className="relative min-w-56 flex-1">
              <span className="sr-only">Cari data spasial tanah</span>
              <MagnifyingGlassIcon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="search"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Cari kode bidang, kode tanah, nama tanah, atau lokasi…"
                className="h-10 w-full rounded-xl border border-border bg-surface-secondary pl-10 pr-3 text-[10px] font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
            </label>
            <select
              value={sortValue}
              onChange={(event) => { setSortValue(event.target.value); setPage(1); }}
              className="h-10 rounded-xl border border-border bg-surface-secondary px-3 text-[10px] font-bold text-text-secondary outline-none focus:border-accent"
              aria-label="Urutkan bidang 2D"
            >
              <option value="updated_at:DESC">Terakhir diperbarui</option>
              <option value="created_at:DESC">Terbaru ditambahkan</option>
              <option value="kode_2d:ASC">Kode Bidang A–Z</option>
              <option value="kode_aset:ASC">Kode Tanah A–Z</option>
              <option value="nama_aset:ASC">Nama Tanah A–Z</option>
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
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 gap-2 border-b border-border p-3 md:grid-cols-3">
              <select value={coordinateStatus} onChange={(event) => { setCoordinateStatus(event.target.value); setPage(1); }} className="h-9 min-w-0 rounded-lg border border-border bg-surface px-2.5 text-[9px] font-bold text-text-secondary outline-none focus:border-accent" aria-label="Filter koordinat">
                <option value="all">Semua koordinat</option>
                <option value="available">Koordinat tersedia</option>
                <option value="missing">Tanpa koordinat</option>
              </select>
              <select value={polygonStatus} onChange={(event) => { setPolygonStatus(event.target.value); setPage(1); }} className="h-9 min-w-0 rounded-lg border border-border bg-surface px-2.5 text-[9px] font-bold text-text-secondary outline-none focus:border-accent" aria-label="Filter polygon">
                <option value="all">Semua polygon</option>
                <option value="available">Polygon tersedia</option>
                <option value="missing">Tanpa polygon</option>
              </select>
              <select value={buildingStatus} onChange={(event) => { setBuildingStatus(event.target.value); setPage(1); }} className="h-9 min-w-0 rounded-lg border border-border bg-surface px-2.5 text-[9px] font-bold text-text-secondary outline-none focus:border-accent" aria-label="Filter relasi 3D">
                <option value="all">Semua relasi 3D</option>
                <option value="linked">Memiliki bangunan 3D</option>
                <option value="unlinked">Belum memiliki bangunan 3D</option>
              </select>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="admin-data-table min-w-[1080px]">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="px-4 py-3 text-left">Kode Bidang</th>
                  <th className="px-4 py-3 text-left">Nama dan Lokasi</th>
                  <th className="px-4 py-3 text-left">Koordinat</th>
                  <th className="px-4 py-3 text-left">Kelengkapan</th>
                  <th className="px-4 py-3 text-left">Relasi 3D</th>
                  <th className="sticky right-0 border-l border-border bg-surface-secondary px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  [1, 2, 3, 4, 5].map((item) => (
                    <tr key={item}><td colSpan="6" className="px-4 py-3"><div className="h-12 animate-pulse rounded-lg bg-surface-secondary" /></td></tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-14 text-center">
                      <GlobeHemisphereWestIcon size={32} className="mx-auto text-text-muted" />
                      <p className="mt-3 text-xs font-black text-text-primary">Belum ada bidang di Data Spasial</p>
                      <p className="mt-1 text-[10px] text-text-muted">Pilih tanah dari Pusat Data Tanah untuk membuat Kode Bidang.</p>
                    </td>
                  </tr>
                ) : items.map((item) => (
                  <tr key={item.kode_2d} className="group transition hover:bg-accent/[0.025]">
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-lg bg-cyan-500/10 px-2.5 py-1.5 font-mono text-[10px] font-black text-cyan-700 dark:text-cyan-300">
                        {item.kode_2d}
                      </span>
                      <p className="mt-1 font-mono text-[8px] font-bold text-text-muted">ID {item.id_aset ?? item.asset?.id_aset ?? "-"} &bull; Tanah {item.asset?.kode_aset || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-72 truncate text-[10px] font-bold text-text-primary">{item.asset?.nama_aset || "Nama tanah belum diisi"}</p>
                      <p className="mt-1 flex max-w-72 items-center gap-1 truncate text-[9px] text-text-muted"><MapPinIcon size={10} /> {item.asset?.lokasi || item.asset?.desa_kelurahan || "Lokasi belum diisi"}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-[9px] text-text-secondary">
                      <p>Lat {formatCoordinate(item.asset?.koordinat_lat)}</p>
                      <p className="mt-1">Lng {formatCoordinate(item.asset?.koordinat_long)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <StatusBadge available={item.has_coordinates} label="Koordinat tersedia" emptyLabel="Tanpa koordinat" icon={NavigationArrowIcon} />
                        <StatusBadge available={item.has_polygon} label="Polygon tersedia" emptyLabel="Tanpa polygon" icon={PolygonIcon} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[8px] font-black ${item.building_count > 0 ? "bg-violet-500/10 text-violet-700 dark:text-violet-300" : "bg-surface-secondary text-text-muted"}`}>
                        <BuildingsIcon size={11} weight="fill" /> {item.building_count} bangunan 3D
                      </span>
                    </td>
                    <td className="sticky right-0 border-l border-border bg-surface px-4 py-3 group-hover:bg-surface-secondary">
                      <div className="flex justify-end gap-1.5">
                        {(item.has_coordinates || item.has_polygon) && (
                          <button
                            type="button"
                            onClick={() => navigate("/peta", { state: { highlightAssetId: item.id_aset, openWebgisPopup: true, mapMode: "2d" } })}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-muted transition hover:border-accent hover:text-accent"
                            title="Lihat di peta"
                            aria-label={`Lihat ${item.kode_2d} di peta`}
                          >
                            <NavigationArrowIcon size={14} weight="bold" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => navigate(`/kelola-2d/${item.id_aset}/kelola?bagian=spasial`)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-[9px] font-black text-surface transition hover:bg-accent/90"
                        >
                          Kelola <ArrowRightIcon size={12} weight="bold" />
                        </button>
                        {canUpdate && (
                          <button
                            type="button"
                            disabled={removingCode === item.kode_2d || item.building_count > 0}
                            onClick={() => removeItem(item)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-500/10"
                            title={item.building_count > 0 ? "Hapus bangunan 3D terlebih dahulu" : "Keluarkan dari Data Spasial"}
                            aria-label={`Keluarkan ${item.kode_2d} dari Data Spasial`}
                          >
                            {removingCode === item.kode_2d
                              ? <ArrowsClockwiseIcon size={14} className="animate-spin" />
                              : item.building_count > 0
                                ? <WarningCircleIcon size={14} weight="bold" />
                                : <TrashIcon size={14} weight="bold" />}
                          </button>
                        )}
                      </div>
                    </td>
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
            onPageSizeChange={(value) => { setLimit(value); setPage(1); }}
            embedded
            itemLabel="bidang"
          />
        </section>
      </div>

      <AddAsset2dDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdded={fetchData}
      />
    </div>
  );
}
