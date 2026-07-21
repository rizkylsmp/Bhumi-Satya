import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  XIcon,
  FunnelIcon,
  ArrowCounterClockwiseIcon,
  ArrowsClockwiseIcon,
  HandshakeIcon,
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  ImageIcon,
  CheckCircleIcon,
  WarningIcon,
  XCircleIcon,
  ArrowUUpLeftIcon,
  ProhibitIcon,
  CurrencyDollarIcon,
  DownloadSimpleIcon,
} from "@phosphor-icons/react";
import toast from "react-hot-toast";
import { sewaService } from "../../services/api";
import Pagination from "../../components/asset/Pagination";
import SewaFormModal from "../../components/sewa/SewaFormModal";
import { downloadSewaPdf } from "../../utils/pdfExport";
import { downloadAssetGeojson } from "../../utils/geojsonExport";

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "Tersedia", label: "Tersedia" },
  { value: "Diproses", label: "Diproses" },
  { value: "Disewakan", label: "Disewakan" },
];

const getStatusConfig = (status) => {
  const configs = {
    Tersedia: {
      bg: "bg-cyan-100 dark:bg-cyan-500/15",
      text: "text-cyan-700 dark:text-cyan-400",
      border: "border-cyan-200 dark:border-cyan-500/30",
      icon: HandshakeIcon,
    },
    Diproses: {
      bg: "bg-amber-100 dark:bg-amber-500/15",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-500/30",
      icon: WarningIcon,
    },
    Disewakan: {
      bg: "bg-emerald-100 dark:bg-emerald-500/15",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-500/30",
      icon: CheckCircleIcon,
    },
    "Akan Berakhir": {
      bg: "bg-amber-100 dark:bg-amber-500/15",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-500/30",
      icon: WarningIcon,
    },
    Berakhir: {
      bg: "bg-red-100 dark:bg-red-500/15",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-200 dark:border-red-500/30",
      icon: XCircleIcon,
    },
    Dikembalikan: {
      bg: "bg-blue-100 dark:bg-blue-500/15",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-500/30",
      icon: ArrowUUpLeftIcon,
    },
    Dibatalkan: {
      bg: "bg-gray-100 dark:bg-gray-500/15",
      text: "text-gray-600 dark:text-gray-400",
      border: "border-gray-200 dark:border-gray-500/30",
      icon: ProhibitIcon,
    },
  };
  return (
    configs[status] || {
      bg: "bg-gray-100 dark:bg-gray-500/15",
      text: "text-gray-600 dark:text-gray-400",
      border: "border-gray-200 dark:border-gray-500/30",
      icon: ProhibitIcon,
    }
  );
};

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(num) {
  if (num === null || num === undefined || num === "") return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
}

function getLinkedRequest(item) {
  if (!Array.isArray(item?.permintaan) || item.permintaan.length === 0) {
    return null;
  }
  return (
    item.permintaan.find((request) => request.status === "Diproses") ||
    item.permintaan.find((request) => request.status === "Disetujui") ||
    item.permintaan[0]
  );
}

export default function PenyewaanPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState(null);
  const [openDownloadMenu, setOpenDownloadMenu] = useState(null);

  // Form modal
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, statsRes] = await Promise.all([
        sewaService.getAll({
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
          status: statusFilter,
          sortBy: "created_at",
          sortOrder: "desc",
        }),
        sewaService.getStats(),
      ]);
      setData(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalItems(res.data.pagination?.total || 0);
      setStats(statsRes.data?.data || null);
    } catch {
      toast.error("Gagal memuat data penyewaan");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCreate = async (formData) => {
    setFormLoading(true);
    try {
      await sewaService.create(formData);
      toast.success("Aset berhasil ditambahkan untuk disewakan");
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Gagal menambahkan penyewaan");
    } finally {
      setFormLoading(false);
    }
  };

  const handleCardClick = (item) => {
    navigate(`/sewa/penyewaan/${item.id_sewa}`);
  };

  const handleDownloadSewaPdf = async (event, item) => {
    event.stopPropagation();
    setOpenDownloadMenu(null);
    const toastId = toast.loading("Menyiapkan PDF penyewaan...");
    try {
      const response = await sewaService.getById(item.id_sewa);
      downloadSewaPdf(response.data.data || response.data || item);
      toast.success("PDF penyewaan mulai diunduh", { id: toastId });
    } catch (error) {
      console.error("Error preparing sewa PDF:", error);
      downloadSewaPdf(item);
      toast.success("PDF penyewaan dibuat dari data card", { id: toastId });
    }
  };

  const getSewaAssetPayload = (item) => {
    const asset = item?.aset || item?.asset;
    if (!asset) return item;
    return {
      ...asset,
      polygon_sewa: item?.polygon_sewa || asset?.polygon_sewa,
    };
  };

  const handleDownloadSewaGeojson = async (event, item) => {
    event.stopPropagation();
    setOpenDownloadMenu(null);
    const toastId = toast.loading("Menyiapkan GeoJSON aset...");
    try {
      const response = await sewaService.getById(item.id_sewa);
      const fullItem = response.data.data || response.data || item;
      const downloaded = downloadAssetGeojson(getSewaAssetPayload(fullItem));
      if (!downloaded) {
        toast.error("Aset belum memiliki polygon untuk diekspor", {
          id: toastId,
        });
        return;
      }
      toast.success("GeoJSON aset mulai diunduh", { id: toastId });
    } catch (error) {
      console.error("Error preparing sewa GeoJSON:", error);
      const downloaded = downloadAssetGeojson(getSewaAssetPayload(item));
      if (downloaded) {
        toast.success("GeoJSON dibuat dari data card", { id: toastId });
      } else {
        toast.error("Aset belum memiliki polygon untuk diekspor", {
          id: toastId,
        });
      }
    }
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  const getCardImage = (item) => {
    if (item.foto_sewa && item.foto_sewa.length > 0) return item.foto_sewa[0];
    if (item.aset?.foto_aset) return item.aset.foto_aset;
    return null;
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <HandshakeIcon size={24} weight="fill" className="text-surface" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-text-primary">
              Penyewaan Aset
            </h1>
            <p className="text-text-muted text-sm">
              Kelola aset yang disediakan untuk disewa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-all text-sm font-medium disabled:opacity-50"
          >
            <ArrowsClockwiseIcon
              size={18}
              weight="bold"
              className={loading ? "animate-spin" : ""}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 bg-linear-to-r from-accent to-accent/90 text-surface px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-accent/30 transition-all text-sm font-medium"
          >
            <PlusIcon size={18} weight="bold" />
            Tambah Aset Sewa
          </button>
        </div>
      </div>

      {/* Summary Nilai */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          {
            label: "Nilai Aset Tersewa",
            value: formatCurrency(stats?.totalNilaiAsetTersewa),
            tone: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-500/10",
          },
          {
            label: "Nilai Sewa Aktif",
            value: formatCurrency(stats?.totalNilaiSewa),
            tone: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-500/10",
          },
          {
            label: "Sewa Triwulan",
            value: formatCurrency(stats?.totalNilaiSewaTriwulan),
            tone: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-500/10",
          },
          {
            label: "Sewa Semester",
            value: formatCurrency(stats?.totalNilaiSewaSemester),
            tone: "text-cyan-600 dark:text-cyan-400",
            bg: "bg-cyan-50 dark:bg-cyan-500/10",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-surface rounded-2xl border border-border p-4 flex items-center gap-3"
          >
            <div
              className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}
            >
              <CurrencyDollarIcon
                size={20}
                weight="fill"
                className={item.tone}
              />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                {item.label}
              </p>
              <p className="text-sm font-bold text-text-primary truncate">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="bg-surface rounded-2xl border border-border p-4 lg:p-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama aset, penyewa, nomor kontrak..."
              className="w-full pl-10 pr-10 py-2.5 border border-border rounded-xl text-sm bg-surface text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
              >
                <XIcon size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${
              showFilters || statusFilter
                ? "bg-accent/10 border-accent/30 text-accent"
                : "border-border text-text-secondary hover:bg-surface-secondary"
            }`}
          >
            <FunnelIcon size={16} />
            Filter
          </button>
          {(searchInput || statusFilter) && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm text-text-secondary hover:bg-surface-secondary transition-colors"
            >
              <ArrowCounterClockwiseIcon size={16} />
              Reset
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-surface text-text-primary focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cards Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text-primary">
            Aset Sewa
          </span>
          <span className="px-2.5 py-0.5 bg-accent/10 text-accent text-xs font-semibold rounded-full">
            {totalItems} data
          </span>
        </div>
        <div className="text-xs text-text-muted">
          Halaman {currentPage} dari {totalPages}
        </div>
      </div>

      {/* Card Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, idx) => (
            <div
              key={idx}
              className="bg-surface rounded-2xl border border-border overflow-hidden animate-pulse"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="h-40 bg-surface-tertiary" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-surface-tertiary rounded w-3/4" />
                <div className="h-3 bg-surface-tertiary rounded w-1/2" />
                <div className="h-3 bg-surface-tertiary rounded w-2/3" />
                <div className="h-6 bg-surface-tertiary rounded-full w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 bg-surface-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HandshakeIcon size={28} className="text-text-muted" />
          </div>
          <h3 className="text-base font-semibold text-text-primary mb-1">
            Belum Ada Aset Sewa
          </h3>
          <p className="text-sm text-text-muted mb-4">
            {searchTerm || statusFilter
              ? "Tidak ditemukan data yang sesuai filter"
              : "Tambahkan aset yang akan disediakan untuk disewa"}
          </p>
          {!searchTerm && !statusFilter && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-accent text-surface px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              <PlusIcon size={16} weight="bold" />
              Tambah Aset Sewa
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.map((item) => {
            const sc = getStatusConfig(item.status);
            const StatusIcon = sc.icon;
            const thumbnail = getCardImage(item);
            const linkedRequest = getLinkedRequest(item);
            const displayPenyewa =
              item.nama_penyewa ||
              linkedRequest?.nama_pemohon ||
              linkedRequest?.pemohon_username;

            return (
              <div
                key={item.id_sewa}
                onClick={() => handleCardClick(item)}
                className="group bg-surface rounded-2xl border border-border overflow-hidden cursor-pointer hover:shadow-lg hover:border-accent/30 hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Image / Thumbnail */}
                <div className="relative h-40 bg-surface-secondary overflow-hidden">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={item.nama_aset}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-text-muted">
                      <ImageIcon size={32} weight="duotone" />
                      <span className="text-xs">Belum ada foto</span>
                    </div>
                  )}

                  {/* Status badge overlay */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-sm ${sc.bg} ${sc.text} ${sc.border}`}
                    >
                      <StatusIcon size={12} weight="bold" />
                      {item.status}
                    </span>
                  </div>

                  {/* LOT badge */}
                  {item.no_lot && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-mono font-bold rounded-md">
                        LOT {item.no_lot}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  {/* Asset Name */}
                  <div>
                    <h3 className="font-semibold text-sm text-text-primary line-clamp-2 group-hover:text-accent transition-colors">
                      {item.nama_aset}
                    </h3>
                    {item.lokasi_aset && (
                      <p className="flex items-center gap-1 text-xs text-text-muted mt-1">
                        <MapPinIcon size={12} className="shrink-0" />
                        <span className="truncate">{item.lokasi_aset}</span>
                      </p>
                    )}
                  </div>

                  {/* Info rows */}
                  <div className="space-y-1.5">
                    {displayPenyewa && (
                      <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <UserIcon
                          size={12}
                          className="text-text-muted shrink-0"
                        />
                        <span className="truncate">
                          {item.status === "Diproses"
                            ? `Pemohon: ${displayPenyewa}`
                            : displayPenyewa}
                        </span>
                      </div>
                    )}
                    {linkedRequest?.tujuan_sewa && item.status === "Diproses" && (
                      <p className="text-xs text-text-muted line-clamp-2">
                        {linkedRequest.tujuan_sewa}
                      </p>
                    )}
                    {item.tanggal_mulai && item.tanggal_berakhir ? (
                      <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <CalendarIcon
                          size={12}
                          className="text-text-muted shrink-0"
                        />
                        <span>
                          {formatDate(item.tanggal_mulai)} —{" "}
                          {formatDate(item.tanggal_berakhir)}
                        </span>
                      </div>
                    ) : (
                      !item.nama_penyewa && (
                        <p className="text-xs text-text-muted italic">
                          Menunggu penyewa
                        </p>
                      )
                    )}
                  </div>

                  {item.aset?.nilai_aset && (
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-secondary px-2.5 py-2">
                      <span className="text-[11px] text-text-muted">
                        Nilai Aset
                      </span>
                      <span className="text-xs font-semibold text-text-primary truncate">
                        {formatCurrency(item.aset.nilai_aset)}
                      </span>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                    {item.nilai_sewa ? (
                      <span className="text-xs font-semibold text-accent">
                        {formatCurrency(item.nilai_sewa)}
                      </span>
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
                    )}
                    <div className="flex items-center gap-1.5">
                      {item.aset?.kode_aset && (
                        <span className="text-[10px] font-mono text-text-muted bg-surface-secondary px-1.5 py-0.5 rounded">
                          {item.aset.kode_aset}
                        </span>
                      )}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenDownloadMenu((current) =>
                              current === item.id_sewa ? null : item.id_sewa,
                            );
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 transition-colors"
                          title="Unduh dokumen penyewaan"
                        >
                          <DownloadSimpleIcon size={12} weight="bold" />
                          Unduh
                        </button>
                        {openDownloadMenu === item.id_sewa && (
                          <div
                            onClick={(event) => event.stopPropagation()}
                            className="absolute right-0 bottom-full z-40 mb-1 w-36 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-xl"
                          >
                            <button
                              type="button"
                              onClick={(event) =>
                                handleDownloadSewaPdf(event, item)
                              }
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-medium text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                            >
                              <DownloadSimpleIcon size={13} weight="bold" />
                              PDF
                            </button>
                            <button
                              type="button"
                              onClick={(event) =>
                                handleDownloadSewaGeojson(event, item)
                              }
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-medium text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                            >
                              <DownloadSimpleIcon size={13} weight="bold" />
                              GeoJSON
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-surface rounded-2xl border border-border p-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(val) => {
              setItemsPerPage(val);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Form Modal — to add new asset for rent */}
      <SewaFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
        isLoading={formLoading}
      />
    </div>
  );
}
