import { useState, useEffect, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  XIcon,
  FunnelIcon,
  ArrowCounterClockwiseIcon,
  ArrowsClockwiseIcon,
  ArrowUUpLeftIcon,
} from "@phosphor-icons/react";
import toast from "react-hot-toast";
import { sewaService } from "../../services/api";
import PengembalianTable from "../../components/sewa/PengembalianTable";
import SewaViewModal from "../../components/sewa/SewaViewModal";
import Pagination from "../../components/asset/Pagination";

const KONDISI_OPTIONS = [
  { value: "", label: "Semua Kondisi" },
  { value: "Baik", label: "Baik" },
  { value: "Rusak Ringan", label: "Rusak Ringan" },
  { value: "Rusak Berat", label: "Rusak Berat" },
];

export default function PengembalianPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [kondisiFilter, setKondisiFilter] = useState("");
  const [sortBy, setSortBy] = useState("tanggal_pengembalian");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [showView, setShowView] = useState(false);
  const [viewData, setViewData] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sewaService.getPengembalian({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        kondisi: kondisiFilter,
        sortBy,
        sortOrder,
      });
      setData(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalItems(res.data.pagination?.total || 0);
    } catch {
      toast.error("Gagal memuat data pengembalian");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, kondisiFilter, sortBy, sortOrder]);

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

  const handleSort = useCallback(
    (column) => {
      if (sortBy === column) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(column);
        setSortOrder("asc");
      }
    },
    [sortBy],
  );

  const handleView = (item) => {
    setViewData(item);
    setShowView(true);
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setKondisiFilter("");
    setCurrentPage(1);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ArrowUUpLeftIcon
              size={24}
              weight="fill"
              className="text-surface"
            />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-text-primary">
              Pengembalian Aset
            </h1>
            <p className="text-text-muted text-sm">
              Riwayat pengembalian aset yang telah disewa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
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
        </div>
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
              showFilters || kondisiFilter
                ? "bg-accent/10 border-accent/30 text-accent"
                : "border-border text-text-secondary hover:bg-surface-secondary"
            }`}
          >
            <FunnelIcon size={16} />
            Filter
          </button>
          {(searchInput || kondisiFilter) && (
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
                  Kondisi Pengembalian
                </label>
                <select
                  value={kondisiFilter}
                  onChange={(e) => {
                    setKondisiFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-surface text-text-primary focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                >
                  {KONDISI_OPTIONS.map((opt) => (
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

      {/* Data Table */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        {/* Table Info Header */}
        <div className="px-4 lg:px-6 py-4 border-b border-border flex items-center justify-between bg-surface-secondary/50">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-text-primary">
              Riwayat Pengembalian
            </span>
            <span className="px-2.5 py-0.5 bg-accent/10 text-accent text-xs font-semibold rounded-full">
              {totalItems} data
            </span>
          </div>
          <div className="text-xs text-text-muted">
            Halaman {currentPage} dari {totalPages}
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="overflow-hidden">
            <div className="bg-linear-to-r from-surface-secondary to-surface border-b border-border px-4 py-4">
              <div className="flex gap-4">
                {[40, 120, 120, 100, 100, 80, 60].map((w, i) => (
                  <div
                    key={i}
                    className="h-4 bg-surface-tertiary rounded animate-pulse"
                    style={{ width: w }}
                  />
                ))}
              </div>
            </div>
            <div className="divide-y divide-border">
              {[...Array(5)].map((_, idx) => (
                <div
                  key={idx}
                  className="px-4 py-5 flex gap-4 items-center animate-pulse"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="w-8 h-4 bg-surface-tertiary rounded" />
                  <div className="w-32 h-5 bg-surface-tertiary rounded" />
                  <div className="w-28 h-4 bg-surface-tertiary rounded" />
                  <div className="w-24 h-4 bg-surface-tertiary rounded" />
                  <div className="w-24 h-4 bg-surface-tertiary rounded" />
                  <div className="w-20 h-6 bg-surface-tertiary rounded-full" />
                  <div className="w-10 h-8 bg-surface-tertiary rounded-lg ml-auto" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <PengembalianTable
            data={data}
            onView={handleView}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-border p-4">
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
      </div>

      {/* View Modal */}
      <SewaViewModal
        isOpen={showView}
        onClose={() => {
          setShowView(false);
          setViewData(null);
        }}
        data={viewData}
      />
    </div>
  );
}
