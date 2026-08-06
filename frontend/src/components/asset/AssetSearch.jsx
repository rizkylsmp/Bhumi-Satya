import { useState, useEffect, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  XIcon,
  FunnelIcon,
  ArrowCounterClockwiseIcon,
} from "@phosphor-icons/react";
import { RENTAL_FEATURE_ENABLED } from "../../config/featureFlags";

const JENIS_HAK_OPTIONS = [
  "HAK PAKAI",
  "HAK MILIK",
  "HAK GUNA BANGUNAN",
  "HAK PENGELOLAAN",
];

export default function AssetSearch({
  onSearch,
  onFilterChange,
  filterOptions = { kecamatan: [], kelurahan: [] },
  embedded = false,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [kecamatanFilter, setKecamatanFilter] = useState("");
  const [kelurahanFilter, setKelurahanFilter] = useState("");
  const [hasLocationFilter, setHasLocationFilter] = useState("");
  const [hasNibarFilter, setHasNibarFilter] = useState("");
  const [jenisHakFilter, setJenisHakFilter] = useState("");
  const [statusSewaFilter, setStatusSewaFilter] = useState("");
  const [isCertifiedFilter, setIsCertifiedFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [reconciliationFilter, setReconciliationFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Available kelurahan — derived from all loaded asset data.
  const kelurahanList = filterOptions.kelurahan || [];

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  // Emit all filters at once
  const emitFilters = useCallback(
    (overrides = {}) => {
      const current = {
        kecamatan: kecamatanFilter,
        desa_kelurahan: kelurahanFilter,
        has_location: hasLocationFilter,
        has_nibar: hasNibarFilter,
        jenis_hak: jenisHakFilter,
        status_sewa: statusSewaFilter,
        is_certified: isCertifiedFilter,
        sumber: sourceFilter,
        reconciliation_status: reconciliationFilter,
        ...overrides,
      };
      onFilterChange(current);
    },
    [
      onFilterChange,
      kecamatanFilter,
      kelurahanFilter,
      hasLocationFilter,
      hasNibarFilter,
      jenisHakFilter,
      statusSewaFilter,
      isCertifiedFilter,
      sourceFilter,
      reconciliationFilter,
    ],
  );

  const handleKecamatanChange = useCallback(
    (e) => {
      const val = e.target.value;
      setKecamatanFilter(val);
      setKelurahanFilter("");
      emitFilters({ kecamatan: val, desa_kelurahan: "" });
    },
    [emitFilters],
  );

  const handleKelurahanChange = useCallback(
    (e) => {
      const val = e.target.value;
      setKelurahanFilter(val);
      emitFilters({ desa_kelurahan: val });
    },
    [emitFilters],
  );

  const handleLocationFilterChange = useCallback(
    (event) => {
      const value = event.target.value;
      setHasLocationFilter(value);
      emitFilters({ has_location: value });
    },
    [emitFilters],
  );

  const handleNibarFilterChange = useCallback(
    (event) => {
      const value = event.target.value;
      setHasNibarFilter(value);
      emitFilters({ has_nibar: value });
    },
    [emitFilters],
  );

  const handleJenisHakChange = useCallback(
    (e) => {
      const val = e.target.value;
      setJenisHakFilter(val);
      emitFilters({ jenis_hak: val });
    },
    [emitFilters],
  );

  const handleStatusSewaChange = useCallback(
    (event) => {
      const value = event.target.value;
      setStatusSewaFilter(value);
      emitFilters({ status_sewa: value });
    },
    [emitFilters],
  );

  const handleIsCertifiedChange = useCallback(
    (event) => {
      const value = event.target.value;
      setIsCertifiedFilter(value);
      emitFilters({ is_certified: value });
    },
    [emitFilters],
  );

  const handleSourceChange = useCallback(
    (event) => {
      const value = event.target.value;
      setSourceFilter(value);
      emitFilters({ sumber: value });
    },
    [emitFilters],
  );

  const handleReconciliationChange = useCallback(
    (event) => {
      const value = event.target.value;
      setReconciliationFilter(value);
      emitFilters({ reconciliation_status: value });
    },
    [emitFilters],
  );

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setKecamatanFilter("");
    setKelurahanFilter("");
    setHasLocationFilter("");
    setHasNibarFilter("");
    setJenisHakFilter("");
    setStatusSewaFilter("");
    setIsCertifiedFilter("");
    setSourceFilter("");
    setReconciliationFilter("");
    onSearch("");
    onFilterChange({
      kecamatan: "",
      desa_kelurahan: "",
      has_location: "",
      has_nibar: "",
      jenis_hak: "",
      status_sewa: "",
      is_certified: "",
      sumber: "",
      reconciliation_status: "",
    });
  }, [onSearch, onFilterChange]);

  const allFilters = [
    kecamatanFilter,
    kelurahanFilter,
    hasLocationFilter,
    hasNibarFilter,
    jenisHakFilter,
    statusSewaFilter,
    isCertifiedFilter,
    sourceFilter,
    reconciliationFilter,
  ];
  const hasActiveFilters = searchTerm || allFilters.some(Boolean);
  const activeFilterCount = allFilters.filter(Boolean).length;

  const selectClass =
    "h-9 min-w-0 rounded-lg border border-border bg-surface px-2.5 text-[11px] font-medium text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

  return (
    <div
      className={
        embedded
          ? "border-b border-border bg-surface p-3"
          : "rounded-2xl border border-border bg-surface p-3"
      }
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <label className="relative min-w-56 flex-1">
          <span className="sr-only">Cari data</span>
          <MagnifyingGlassIcon
            size={16}
            weight="bold"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="search"
            placeholder="Cari..."
            aria-label="Cari data"
            value={searchTerm}
            onChange={handleSearch}
            className="h-10 w-full rounded-xl border border-border bg-surface-secondary pl-9 pr-9 text-[11px] font-semibold text-text-primary outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/15"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              aria-label="Hapus pencarian"
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-text-muted hover:bg-surface-tertiary hover:text-text-primary"
            >
              <XIcon size={12} weight="bold" />
            </button>
          )}
        </label>
        <button
          type="button"
          onClick={() => setShowFilters((value) => !value)}
          className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-[10px] font-bold transition ${
            showFilters || activeFilterCount
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-border text-text-secondary hover:bg-surface-secondary"
          }`}
          aria-expanded={showFilters}
        >
          <FunnelIcon size={14} weight={showFilters ? "fill" : "bold"} />
          Filter
          {activeFilterCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border px-3 text-[10px] font-bold text-text-secondary transition hover:border-accent hover:text-accent"
          >
            <ArrowCounterClockwiseIcon size={14} weight="bold" />
            Reset
          </button>
        )}
      </div>

      {showFilters && (
        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-2 md:grid-cols-3 xl:grid-cols-5">
          <select
            value={hasLocationFilter}
            onChange={handleLocationFilterChange}
            className={selectClass}
            aria-label="Filter lokasi"
          >
            <option value="">Semua lokasi</option>
            <option value="true">Ada lokasi</option>
            <option value="false">Belum ada lokasi</option>
          </select>
          <select
            value={isCertifiedFilter}
            onChange={handleIsCertifiedChange}
            className={selectClass}
            aria-label="Filter sertifikat"
          >
            <option value="">Semua sertifikat</option>
            <option value="true">Bersertifikat</option>
            <option value="false">Belum bersertifikat</option>
          </select>
          <select
            value={hasNibarFilter}
            onChange={handleNibarFilterChange}
            className={selectClass}
            aria-label="Filter NIBAR"
          >
            <option value="">Semua NIBAR</option>
            <option value="true">Ada NIBAR</option>
            <option value="false">Tanpa NIBAR</option>
          </select>
          {RENTAL_FEATURE_ENABLED && (
            <select
              value={statusSewaFilter}
              onChange={handleStatusSewaChange}
              className={selectClass}
              aria-label="Filter penyewaan"
            >
              <option value="">Semua status sewa</option>
              <option value="tersewa">Tersewa</option>
              <option value="tidak">Tidak tersewa</option>
            </select>
          )}
          <select
            value={kecamatanFilter}
            onChange={handleKecamatanChange}
            className={selectClass}
            aria-label="Filter kecamatan"
          >
            <option value="">Semua kecamatan</option>
            {(filterOptions.kecamatan || []).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={kelurahanFilter}
            onChange={handleKelurahanChange}
            className={selectClass}
            aria-label="Filter kelurahan"
          >
            <option value="">Semua kelurahan</option>
            {kelurahanList.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={jenisHakFilter}
            onChange={handleJenisHakChange}
            className={selectClass}
            aria-label="Filter jenis hak"
          >
            <option value="">Semua jenis hak</option>
            {JENIS_HAK_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={sourceFilter}
            onChange={handleSourceChange}
            className={selectClass}
            aria-label="Filter asal data"
          >
            <option value="">Semua asal data</option>
            <option value="BPN">BPN</option>
            <option value="BPKA">BPKA</option>
          </select>
          <select
            value={reconciliationFilter}
            onChange={handleReconciliationChange}
            className={selectClass}
            aria-label="Filter rekonsiliasi"
          >
            <option value="">Semua rekonsiliasi</option>
            <option value="belum_diperiksa">Belum diperiksa</option>
            <option value="cocok">Cocok</option>
            <option value="konflik">Konflik</option>
            <option value="terverifikasi">Terverifikasi</option>
          </select>
        </div>
      )}
    </div>
  );
}
