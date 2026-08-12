import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BuildingsIcon,
  CaretDownIcon,
  CheckCircleIcon,
  FunnelSimpleIcon,
  ImageIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  RulerIcon,
  SignInIcon,
  StorefrontIcon,
  TagIcon,
  XIcon,
} from "@phosphor-icons/react";
import Pagination from "../components/asset/Pagination";
import { sewaService } from "../services/api";
import {
  formatCurrency as formatRupiah,
  formatNumber,
} from "../utils/format";
import RentalCategoryTabs from "../components/sewa/RentalCategoryTabs";

function getPhotos(item) {
  const source = item.foto_sewa || item.aset?.foto_aset;
  if (!source) return [];
  if (Array.isArray(source)) return source.filter(Boolean);
  if (typeof source !== "string") return [];

  try {
    const parsed = JSON.parse(source);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [source];
  } catch {
    return [source];
  }
}

function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "Hubungi pengelola";
  return formatRupiah(amount);
}

export default function PublicSewaPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [jenisAset, setJenisAset] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [category, setCategory] = useState("Tanah");
  const [pageSize, setPageSize] = useState(6);
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    let active = true;

    sewaService
      .getPublicAvailable()
      .then((response) => {
        if (active) setItems(response.data.data || []);
      })
      .catch(() => {
        if (active) {
          setItems([]);
          setLoadError("Data aset sewa belum dapat dimuat. Silakan coba lagi.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filterOptions = useMemo(() => {
    const jenis = new Set();
    const wilayah = new Set();

    items.forEach((item) => {
      if (item.aset?.jenis_aset) jenis.add(item.aset.jenis_aset);
      if (item.aset?.kecamatan) wilayah.add(item.aset.kecamatan);
    });

    return {
      jenis: [...jenis].sort((a, b) => a.localeCompare(b, "id")),
      kecamatan: [...wilayah].sort((a, b) => a.localeCompare(b, "id")),
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id");

    return items.filter((item) => {
      const aset = item.aset || {};
      const searchable = [
        item.nama_aset,
        item.lokasi_aset,
        item.no_lot,
        aset.nama_aset,
        aset.lokasi,
        aset.kecamatan,
        aset.desa_kelurahan,
        aset.jenis_aset,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("id");

      return (
        item.kategori_sewa === category &&
        (!query || searchable.includes(query)) &&
        (!jenisAset || aset.jenis_aset === jenisAset) &&
        (!kecamatan || aset.kecamatan === kecamatan)
      );
    });
  }, [category, items, search, jenisAset, kecamatan]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);
  const hasFilters = Boolean(search || jenisAset || kecamatan);

  const clearFilters = () => {
    setSearch("");
    setJenisAset("");
    setKecamatan("");
    setPage(1);
  };

  const openLogin = () => {
    navigate("/login", { state: { openLoginPanel: true } });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-secondary">
      <main>
        <section className="relative overflow-hidden border-b border-emerald-900/20 bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-800 text-white">
          <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-18 lg:px-8">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-50 backdrop-blur">
                <StorefrontIcon size={15} weight="fill" />
                Katalog Sewa Aset
              </span>
              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Temukan {category.toLowerCase()} untuk kebutuhan Anda
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/80 sm:text-base">
                Telusuri aset yang tersedia, bandingkan lokasi dan jenisnya, lalu
                masuk untuk mengajukan sewa secara resmi.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="-mt-14 relative z-10 rounded-2xl border border-border bg-surface p-4 shadow-xl shadow-emerald-950/8 sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[1.3fr_0.85fr_0.85fr]">
              <label className="relative block">
                <span className="sr-only">Cari aset sewa</span>
                <MagnifyingGlassIcon
                  size={19}
                  weight="bold"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Cari nama, lokasi, atau nomor LOT..."
                  className="h-12 w-full rounded-xl border border-border bg-surface-secondary pl-11 pr-4 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-3 focus:ring-accent/10"
                />
              </label>

              <FilterSelect
                label="Filter jenis aset"
                value={jenisAset}
                onChange={(value) => {
                  setJenisAset(value);
                  setPage(1);
                }}
                options={filterOptions.jenis}
                placeholder="Semua jenis aset"
              />
              <FilterSelect
                label="Filter kecamatan"
                value={kecamatan}
                onChange={(value) => {
                  setKecamatan(value);
                  setPage(1);
                }}
                options={filterOptions.kecamatan}
                placeholder="Semua kecamatan"
              />
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-text-secondary" aria-live="polite">
                Menampilkan{" "}
                <strong className="font-bold text-text-primary">
                  {filteredItems.length}
                </strong>{" "}
                aset yang dapat disewa
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-accent transition hover:opacity-75 sm:self-auto"
                >
                  <XIcon size={15} weight="bold" />
                  Hapus semua filter
                </button>
              )}
            </div>
          </div>

          <div className="mt-4">
            <RentalCategoryTabs
              value={category}
              onChange={(value) => {
                setCategory(value);
                setPage(1);
              }}
            />
          </div>

          <div className="mt-8">
            {loading ? (
              <LoadingGrid />
            ) : loadError ? (
              <EmptyState
                title="Data belum dapat dimuat"
                description={loadError}
                icon={<StorefrontIcon size={28} weight="duotone" />}
              />
            ) : paginatedItems.length === 0 ? (
              <EmptyState
                title="Aset tidak ditemukan"
                description="Coba gunakan kata kunci lain atau hapus filter yang sedang aktif."
                icon={<MagnifyingGlassIcon size={28} weight="duotone" />}
                action={hasFilters ? clearFilters : undefined}
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedItems.map((item) => (
                  <RentalCard
                    key={item.id_sewa}
                    item={item}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            )}
          </div>

          {!loading && !loadError && filteredItems.length > 0 && (
            <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface">
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                totalItems={filteredItems.length}
                itemsPerPage={pageSize}
                onPageChange={setPage}
                onItemsPerPageChange={(value) => {
                  setPageSize(value);
                  setPage(1);
                }}
                pageSizeOptions={[6, 9, 12]}
                embedded
                itemLabel="aset"
              />
            </div>
          )}
        </section>

        <section className="border-y border-border bg-surface">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                Siap mengajukan?
              </p>
              <h2 className="mt-2 text-2xl font-bold text-text-primary">
                Masuk untuk memulai proses sewa
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                Identitas dan status pengajuan Anda tersimpan aman dalam akun masyarakat.
              </p>
            </div>
            <button
              type="button"
              onClick={openLogin}
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-accent px-5 py-3 text-sm font-bold text-surface transition hover:bg-accent-hover md:self-auto"
            >
              <SignInIcon size={18} weight="bold" />
              Masuk dan Ajukan Sewa
            </button>
          </div>
        </section>
      </main>

      {selectedItem && (
        <RentalDetail
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onLogin={openLogin}
        />
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, placeholder }) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <FunnelSimpleIcon
        size={18}
        weight="bold"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
      />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full appearance-none rounded-xl border border-border bg-surface-secondary pl-11 pr-10 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-3 focus:ring-accent/10"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <CaretDownIcon
        size={15}
        weight="bold"
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-muted"
      />
    </label>
  );
}

function RentalCard({ item, onClick }) {
  const aset = item.aset || {};
  const photo = getPhotos(item)[0];
  const location =
    item.lokasi_aset ||
    aset.lokasi ||
    [aset.desa_kelurahan, aset.kecamatan].filter(Boolean).join(", ");
  const price = formatCurrency(item.nilai_sewa);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition duration-200 hover:-translate-y-1 hover:border-accent/30 hover:shadow-xl">
      <button
        type="button"
        onClick={onClick}
        className="flex h-full flex-col text-left focus:outline-none focus-visible:ring-3 focus-visible:ring-accent/30"
        aria-label={`Lihat detail ${item.nama_aset}`}
      >
        <div className="relative h-52 overflow-hidden bg-surface-secondary">
          {photo ? (
            <img
              src={photo}
              alt={item.nama_aset}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-text-muted">
              <ImageIcon size={40} weight="duotone" />
              <span className="text-xs">Foto belum tersedia</span>
            </div>
          )}
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-emerald-700/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur">
            <CheckCircleIcon size={13} weight="fill" />
            {item.status === "Disewakan" ? "Disewakan" : "Tersedia"}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
                {aset.jenis_aset || "Aset Kota"}
              </p>
              <h2 className="mt-1 line-clamp-2 text-base font-bold leading-snug text-text-primary">
                {item.nama_aset}
              </h2>
              {(aset.id_aset ?? item.id_aset) && (
                <p className="mt-1 font-mono text-[10px] font-semibold text-text-muted">
                  ID {aset.id_aset ?? item.id_aset}
                </p>
              )}
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <BuildingsIcon size={20} weight="duotone" />
            </span>
          </div>

          <p className="mt-3 flex min-h-10 items-start gap-2 text-sm leading-5 text-text-secondary">
            <MapPinIcon
              size={16}
              weight="fill"
              className="mt-0.5 shrink-0 text-rose-500"
            />
            <span className="line-clamp-2">{location || "Lokasi belum tersedia"}</span>
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <RulerIcon size={14} weight="bold" className="text-accent" />
              {Number(aset.luas) > 0
                ? `${formatNumber(Number(aset.luas))} m²`
                : "Luas belum ada"}
            </span>
            <span className="flex items-center justify-end gap-1.5 text-right">
              <TagIcon size={14} weight="fill" className="text-accent" />
              {item.no_lot ? `LOT ${item.no_lot}` : "Tanpa nomor LOT"}
            </span>
          </div>

          <div className="mt-4 rounded-xl bg-emerald-50 px-3.5 py-3 dark:bg-emerald-500/10">
            <span className="block text-[11px] text-emerald-800/70 dark:text-emerald-200/70">
              Nilai sewa
            </span>
            <strong className="mt-0.5 block text-sm text-emerald-800 dark:text-emerald-200">
              {price}
              {price !== "Hubungi pengelola" && (
                <span className="font-medium"> / {item.periode_bayar || "periode"}</span>
              )}
            </strong>
          </div>
        </div>
      </button>
    </article>
  );
}

function RentalDetail({ item, onClose, onLogin }) {
  const aset = item.aset || {};
  const photo = getPhotos(item)[0];
  const location = item.lokasi_aset || aset.lokasi;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="motion-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rental-detail-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl"
      >
        <div className="relative h-52 overflow-hidden bg-surface-secondary sm:h-64">
          {photo ? (
            <img src={photo} alt={item.nama_aset} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-text-muted">
              <ImageIcon size={48} weight="duotone" />
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail"
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/65 text-white transition hover:bg-slate-950"
          >
            <XIcon size={18} weight="bold" />
          </button>
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
            {aset.jenis_aset || "Aset Kota"}
          </p>
          <h2 id="rental-detail-title" className="mt-1 text-2xl font-bold text-text-primary">
            {item.nama_aset}
          </h2>
          {(aset.id_aset ?? item.id_aset) && (
            <p className="mt-1 font-mono text-xs font-semibold text-text-muted">
              ID {aset.id_aset ?? item.id_aset}
            </p>
          )}
          <p className="mt-3 flex items-start gap-2 text-sm text-text-secondary">
            <MapPinIcon size={17} weight="fill" className="mt-0.5 shrink-0 text-rose-500" />
            {location || "Lokasi belum tersedia"}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <DetailItem
              label="Luas aset"
              value={
                Number(aset.luas) > 0
                  ? `${formatNumber(Number(aset.luas))} m²`
                  : "-"
              }
            />
            <DetailItem label="Nomor LOT" value={item.no_lot || "-"} />
            <DetailItem label="Kecamatan" value={aset.kecamatan || "-"} />
          </div>

          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-emerald-800/70 dark:text-emerald-200/70">
                Nilai sewa
              </p>
              <p className="mt-1 font-bold text-emerald-900 dark:text-emerald-100">
                {formatCurrency(item.nilai_sewa)}
                {Number(item.nilai_sewa) > 0 && (
                  <span className="font-medium"> / {item.periode_bayar || "periode"}</span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={onLogin}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-surface transition hover:bg-accent-hover"
            >
              <SignInIcon size={17} weight="bold" />
              Masuk untuk Mengajukan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-surface-secondary p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-text-primary">{value}</p>
    </div>
  );
}

function EmptyState({ title, description, icon, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-secondary text-text-muted">
        {icon}
      </span>
      <h2 className="mt-4 text-lg font-bold text-text-primary">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">{description}</p>
      {action && (
        <button
          type="button"
          onClick={action}
          className="mt-5 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-surface"
        >
          Hapus Filter
        </button>
      )}
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Memuat aset sewa">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="h-[430px] animate-pulse overflow-hidden rounded-2xl border border-border bg-surface"
        >
          <div className="h-52 bg-surface-tertiary" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-24 rounded bg-surface-tertiary" />
            <div className="h-5 w-3/4 rounded bg-surface-tertiary" />
            <div className="h-4 w-full rounded bg-surface-tertiary" />
            <div className="h-16 w-full rounded-xl bg-surface-tertiary" />
          </div>
        </div>
      ))}
    </div>
  );
}
