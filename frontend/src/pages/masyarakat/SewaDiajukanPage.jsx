import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  ClockIcon,
  FileTextIcon,
  MagnifyingGlassIcon,
  PaperPlaneTiltIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { permintaanService } from "../../services/api";
import Pagination from "../../components/asset/Pagination";

const STATUS_CONFIG = {
  Baru: {
    icon: PaperPlaneTiltIcon,
    bg: "bg-sky-100 dark:bg-sky-500/15",
    text: "text-sky-700 dark:text-sky-400",
    border: "border-sky-200 dark:border-sky-500/30",
  },
  Diproses: {
    icon: ClockIcon,
    bg: "bg-amber-100 dark:bg-amber-500/15",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-500/30",
  },
  Ditolak: {
    icon: XCircleIcon,
    bg: "bg-red-100 dark:bg-red-500/15",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-500/30",
  },
  Disetujui: {
    icon: FileTextIcon,
    bg: "bg-emerald-100 dark:bg-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-500/30",
  },
};

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function SewaDiajukanPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await permintaanService.getForMasyarakat({
        page,
        limit: itemsPerPage,
        search,
        sortBy: "created_at",
        sortOrder: "desc",
      });
      setData(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotalItems(response.data.pagination?.total || 0);
    } catch (error) {
      toast.error(error.response?.data?.error || "Gagal memuat pengajuan");
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage, page, search]);

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

  const activeCount = data.filter((item) =>
    ["Baru", "Diproses"].includes(item.status),
  ).length;
  const approvedCount = data.filter((item) => item.status === "Disetujui").length;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-accent">Portal Masyarakat</p>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary mt-1">
            Sewa yang Diajukan
          </h1>
          <p className="text-sm text-text-muted mt-2 max-w-2xl">
            Riwayat pengajuan sewa aset berdasarkan username akun masyarakat
            yang sedang login.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 min-w-72">
          <SummaryCard label="Dalam Proses" value={activeCount} />
          <SummaryCard label="Disetujui" value={approvedCount} />
        </div>
      </div>

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
            placeholder="Cari nama aset atau tujuan sewa"
            className="w-full h-11 rounded-xl border border-border bg-surface-secondary pl-10 pr-4 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-32 bg-surface border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center">
          <PaperPlaneTiltIcon size={42} weight="duotone" className="mx-auto text-text-muted" />
          <h2 className="text-lg font-bold text-text-primary mt-3">
            Belum ada pengajuan
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Pengajuan dari menu Aset Tersedia akan tampil di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <RequestCard key={item.id_permintaan} item={item} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="bg-surface rounded-2xl border border-border p-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <p className="text-xl font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}

function RequestCard({ item }) {
  const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.Baru;
  const StatusIcon = config.icon;

  return (
    <article className="bg-surface border border-border rounded-2xl p-4">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-bold text-text-primary truncate">{item.nama_aset}</h2>
          <p className="text-sm text-text-muted mt-1 line-clamp-2">
            {item.tujuan_sewa}
          </p>
          <div className="flex flex-wrap gap-2 mt-3 text-xs text-text-muted">
            <span>Diajukan: {formatDate(item.created_at)}</span>
            {item.sewa?.no_lot && <span>LOT {item.sewa.no_lot}</span>}
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${config.bg} ${config.text} ${config.border}`}
        >
          <StatusIcon size={13} weight="bold" />
          {item.status}
        </span>
      </div>
      {(item.catatan_admin || item.dokumen_respon?.length > 0) && (
        <div className="mt-4 pt-4 border-t border-border/60 space-y-2">
          {item.catatan_admin && (
            <p className="text-sm text-text-secondary">{item.catatan_admin}</p>
          )}
          {item.dokumen_respon?.length > 0 && (
            <p className="text-xs font-semibold text-emerald-600">
              {item.dokumen_respon.length} dokumen respon tersedia di menu Sewa Disetujui.
            </p>
          )}
        </div>
      )}
    </article>
  );
}
