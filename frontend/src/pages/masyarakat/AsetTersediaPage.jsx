import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  CalendarIcon,
  CurrencyDollarIcon,
  ImageIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PaperPlaneTiltIcon,
  StorefrontIcon,
  XIcon,
} from "@phosphor-icons/react";
import { permintaanService, sewaService } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";
import Pagination from "../../components/asset/Pagination";
import { formatCurrency } from "../../utils/format";
import RentalCategoryTabs from "../../components/sewa/RentalCategoryTabs";

function getImage(item) {
  const source = item.foto_sewa || item.aset?.foto_aset;
  if (!source) return null;
  if (Array.isArray(source)) return source[0] || null;
  if (typeof source === "string") {
    try {
      const parsed = JSON.parse(source);
      return Array.isArray(parsed) ? parsed[0] : source;
    } catch {
      return source;
    }
  }
  return null;
}

export default function AsetTersediaPage() {
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tanah");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    tujuan_sewa: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await sewaService.getAvailableForMasyarakat({
        search,
        kategori: category,
      });
      setData(response.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.error || "Gagal memuat aset tersedia");
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  const safePage = Math.min(page, totalPages);
  const paginatedData = data.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage,
  );

  const openRequest = (item) => {
    setSelected(item);
    setForm({
      tujuan_sewa: "",
    });
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    if (!selected || !form.tujuan_sewa.trim()) {
      toast.error("Tujuan sewa wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      await permintaanService.submitForMasyarakat({
        id_sewa: selected.id_sewa,
        nama_aset: selected.nama_aset,
        tujuan_sewa: form.tujuan_sewa,
      });
      toast.success("Pengajuan sewa berhasil dikirim");
      setSelected(null);
    } catch (error) {
      toast.error(error.response?.data?.error || "Gagal mengirim pengajuan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="admin-page-header">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-accent">Portal Masyarakat</p>
          <h1 className="admin-page-header__title">
            {category} Tersedia
          </h1>
          <p className="admin-page-header__description">
            Aset yang siap diajukan untuk disewa.
          </p>
        </div>
        <div className="min-w-52 rounded-xl border border-border bg-surface p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-secondary flex items-center justify-center text-accent">
              <StorefrontIcon size={20} weight="duotone" />
            </div>
            <div>
              <p className="text-xl font-bold text-text-primary">{data.length}</p>
              <p className="text-xs text-text-muted">aset siap disewa</p>
            </div>
          </div>
        </div>
      </div>

      <RentalCategoryTabs
        value={category}
        onChange={(value) => {
          setCategory(value);
          setPage(1);
        }}
      />

      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="relative max-w-xl">
          <MagnifyingGlassIcon
            size={18}
            weight="bold"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={`Cari ${category.toLowerCase()} atau lokasi`}
            className="w-full h-11 rounded-xl border border-border bg-surface-secondary pl-10 pr-4 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-80 bg-surface border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center">
          <StorefrontIcon size={42} weight="duotone" className="mx-auto text-text-muted" />
          <h2 className="text-lg font-bold text-text-primary mt-3">
            Belum ada aset tersedia
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Aset akan muncul ketika pengelola aset menandainya siap disewakan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedData.map((item) => (
            <AvailableCard key={item.id_sewa} item={item} onRequest={openRequest} />
          ))}
        </div>
      )}

      {data.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={data.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setPage(1);
            }}
            pageSizeOptions={[6, 12, 24, 48]}
            embedded
            itemLabel="aset"
          />
        </div>
      )}

      {selected && (
        <div className="motion-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={submitRequest}
            className="w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-text-primary">
                  Ajukan Sewa
                </h2>
                <p className="text-sm text-text-muted">{selected.nama_aset}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="w-9 h-9 rounded-lg hover:bg-surface-secondary text-text-muted"
              >
                <XIcon size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-2xl border border-border bg-surface-secondary p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Identitas Pemohon
                </p>
                <div className="mt-3 grid gap-2 text-sm">
                  <ReadOnlyRow
                    label="Nama"
                    value={user?.nama_lengkap || user?.username || "-"}
                  />
                  <ReadOnlyRow label="NIK" value={user?.nik || "-"} />
                  <ReadOnlyRow
                    label="No. Telepon"
                    value={user?.no_telepon || "-"}
                  />
                  <ReadOnlyRow label="Email" value={user?.email || "-"} />
                  <ReadOnlyRow label="Alamat" value={user?.alamat || "-"} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Tujuan Sewa
                </label>
                <textarea
                  value={form.tujuan_sewa}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, tujuan_sewa: event.target.value }))
                  }
                  rows={4}
                  required
                  className="w-full rounded-xl border border-border bg-surface-secondary px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-4 py-2 rounded-xl border border-border text-sm font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-surface text-sm font-semibold disabled:opacity-60"
              >
                <PaperPlaneTiltIcon size={16} weight="bold" />
                {submitting ? "Mengirim..." : "Kirim Pengajuan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function AvailableCard({ item, onRequest }) {
  const image = getImage(item);

  return (
    <article className="bg-surface border border-border rounded-2xl overflow-hidden hover:border-accent/30 hover:shadow-lg transition-all">
      <div className="relative h-44 bg-surface-secondary">
        {image ? (
          <img src={image} alt={item.nama_aset} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-text-muted">
            <ImageIcon size={34} weight="duotone" />
            <span className="text-xs">Belum ada foto</span>
          </div>
        )}
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-cyan-100 text-cyan-700 border-cyan-200">
          <StorefrontIcon size={12} weight="bold" />
          Tersedia
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h2 className="font-bold text-text-primary line-clamp-2">{item.nama_aset}</h2>
          {(item.aset?.id_aset ?? item.id_aset) && (
            <p className="mt-1 font-mono text-[10px] font-semibold text-text-muted">
              ID {item.aset?.id_aset ?? item.id_aset}
            </p>
          )}
          <p className="flex items-center gap-1.5 text-sm text-text-muted mt-1">
            <MapPinIcon size={14} className="shrink-0" />
            <span className="truncate">{item.lokasi_aset || item.aset?.lokasi || "-"}</span>
          </p>
        </div>
        <div className="grid gap-2 text-sm">
          <InfoRow icon={CurrencyDollarIcon} label={`${formatCurrency(item.nilai_sewa)} / ${item.periode_bayar || "periode"}`} />
          <InfoRow icon={CalendarIcon} label={item.no_lot ? `LOT ${item.no_lot}` : "Belum ada LOT"} />
        </div>
        <button
          onClick={() => onRequest(item)}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-surface hover:bg-accent/90"
        >
          <PaperPlaneTiltIcon size={16} weight="bold" />
          Ajukan Sewa
        </button>
      </div>
    </article>
  );
}

function ReadOnlyRow({ label, value }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-2">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-text-primary break-words">{value}</span>
    </div>
  );
}

function InfoRow({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 text-text-secondary">
      <Icon size={14} className="text-text-muted shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
}
