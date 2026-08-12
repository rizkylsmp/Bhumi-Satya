import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  CalendarIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  FileTextIcon,
  ImageIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  StorefrontIcon,
  UserIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { sewaService } from "../../services/api";
import Pagination from "../../components/asset/Pagination";
import { formatCurrency, formatNumber } from "../../utils/format";
import RentalCategoryTabs from "../../components/sewa/RentalCategoryTabs";

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

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

function getStatusConfig(status) {
  if (status === "Akan Berakhir") {
    return {
      icon: WarningIcon,
      bg: "bg-amber-100 dark:bg-amber-500/15",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-500/30",
    };
  }

  return {
    icon: CheckCircleIcon,
    bg: "bg-emerald-100 dark:bg-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-500/30",
  };
}

function getDocumentMeta(url, index) {
  const rawName = String(url || "")
    .split("?")[0]
    .split("/")
    .pop() || `dokumen-${index + 1}`;
  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName;
  }
}

function getDocuments(item) {
  const fromPermintaan = Array.isArray(item.permintaan)
    ? item.permintaan.flatMap((request) => request.dokumen_respon || [])
    : [];
  const supporting = Array.isArray(item.dokumen_pendukung)
    ? item.dokumen_pendukung
    : [];
  return [item.file_kontrak, ...supporting, ...fromPermintaan].filter(Boolean);
}

export default function SewaDisetujuiPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tanah");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await sewaService.getApprovedForMasyarakat({
        page,
        limit: itemsPerPage,
        search,
        kategori: category,
        sortBy: "created_at",
        sortOrder: "desc",
      });
      setData(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotalItems(response.data.pagination?.total || 0);
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Gagal memuat sewa yang disetujui",
      );
    } finally {
      setLoading(false);
    }
  }, [category, itemsPerPage, page, search]);

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

  const activeCount = data.filter((item) => item.status === "Disewakan").length;
  const endingCount = data.filter(
    (item) => item.status === "Akan Berakhir",
  ).length;
  const documentCount = data.reduce(
    (total, item) => total + getDocuments(item).length,
    0,
  );

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="admin-page-header">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-accent">
            Portal Masyarakat
          </p>
          <h1 className="admin-page-header__title">
            Sewa {category} Disetujui
          </h1>
          <p className="admin-page-header__description">
            Sewa yang telah disetujui dan aktif.
          </p>
        </div>
        <div className="admin-page-header__actions grid min-w-72 grid-cols-3 gap-3">
          <SummaryCard
            icon={StorefrontIcon}
            label="Disewakan"
            value={activeCount}
          />
          <SummaryCard
            icon={WarningIcon}
            label="Akan Berakhir"
            value={endingCount}
          />
          <SummaryCard icon={FileTextIcon} label="Dokumen" value={documentCount} />
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
            placeholder={`Cari ${category.toLowerCase()}, lokasi, LOT, atau penyewa`}
            className="w-full h-11 rounded-xl border border-border bg-surface-secondary pl-10 pr-4 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-80 bg-surface border border-border rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center">
          <CheckCircleIcon
            size={42}
            weight="duotone"
            className="mx-auto text-text-muted"
          />
          <h2 className="text-lg font-bold text-text-primary mt-3">
            Belum ada data sewa disetujui
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Data akan muncul ketika pengelola aset sudah menyetujui sewa aset.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map((item) => (
            <SewaCard key={item.id_sewa} item={item} />
          ))}
        </div>
      )}

      {totalItems > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
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
            pageSizeOptions={[6, 12, 24, 48]}
            embedded
            itemLabel="penyewaan"
          />
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-surface-secondary flex items-center justify-center text-accent">
          <Icon size={20} weight="duotone" />
        </div>
        <div>
          <p className="text-xl font-bold text-text-primary">{value}</p>
          <p className="text-xs text-text-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}

function SewaCard({ item }) {
  const statusConfig = getStatusConfig(item.status);
  const StatusIcon = statusConfig.icon;
  const image = getImage(item);
  const documents = getDocuments(item);
  const approvedRequest = Array.isArray(item.permintaan)
    ? item.permintaan[0]
    : null;

  return (
    <article className="bg-surface border border-border rounded-2xl overflow-hidden hover:border-accent/30 hover:shadow-lg transition-all">
      <div className="relative h-44 bg-surface-secondary">
        {image ? (
          <img
            src={image}
            alt={item.nama_aset}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-text-muted">
            <ImageIcon size={34} weight="duotone" />
            <span className="text-xs">Belum ada foto</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-sm ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
          >
            <StatusIcon size={12} weight="bold" />
            {item.status}
          </span>
        </div>
        {item.no_lot && (
          <div className="absolute top-3 right-3 px-2 py-0.5 bg-black/60 text-white text-[10px] font-mono font-bold rounded-md">
            LOT {item.no_lot}
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h2 className="font-bold text-text-primary line-clamp-2">
            {item.nama_aset}
          </h2>
          {(item.aset?.id_aset ?? item.id_aset) && (
            <p className="mt-1 font-mono text-[10px] font-semibold text-text-muted">
              ID {item.aset?.id_aset ?? item.id_aset}
            </p>
          )}
          <p className="flex items-center gap-1.5 text-sm text-text-muted mt-1">
            <MapPinIcon size={14} className="shrink-0" />
            <span className="truncate">
              {item.lokasi_aset || item.aset?.lokasi || "-"}
            </span>
          </p>
        </div>

        <div className="grid gap-2 text-sm">
          <InfoRow icon={UserIcon} label={item.nama_penyewa || "-"} />
          <InfoRow
            icon={CalendarIcon}
            label={`${formatDate(item.tanggal_mulai)} - ${formatDate(
              item.tanggal_berakhir,
            )}`}
          />
          <InfoRow
            icon={CurrencyDollarIcon}
            label={`${formatCurrency(item.nilai_sewa)} / ${
              item.periode_bayar || "periode"
            }`}
          />
        </div>

        {(approvedRequest?.catatan_admin || documents.length > 0) && (
          <div className="pt-3 border-t border-border/60 space-y-2">
            {approvedRequest?.catatan_admin && (
              <p className="text-sm text-text-secondary">
                {approvedRequest.catatan_admin}
              </p>
            )}
            {documents.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-text-primary">
                  Dokumen persetujuan
                </p>
                {documents.map((url, index) => (
                  <a
                    key={`${url}-${index}`}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary px-3 py-2 text-xs font-semibold text-accent hover:border-accent/40"
                  >
                    <FileTextIcon size={15} weight="bold" />
                    <span className="truncate">
                      {getDocumentMeta(url, index)}
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted">
                Dokumen persetujuan belum diunggah.
              </p>
            )}
          </div>
        )}

        <div className="pt-3 border-t border-border/60 grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-text-muted">Jenis Aset</p>
            <p className="font-semibold text-text-primary truncate">
              {item.aset?.jenis_aset || "-"}
            </p>
          </div>
          <div>
            <p className="text-text-muted">Luas</p>
            <p className="font-semibold text-text-primary truncate">
              {item.aset?.luas
                ? `${formatNumber(Number(item.aset.luas))} m2`
                : "-"}
            </p>
          </div>
        </div>
      </div>
    </article>
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
