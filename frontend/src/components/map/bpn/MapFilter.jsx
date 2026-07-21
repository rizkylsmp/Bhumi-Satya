import { useState, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  ChartPieIcon,
  XIcon,
  HandshakeIcon,
  StorefrontIcon,
  CrosshairIcon,
  ProhibitIcon,
} from "@phosphor-icons/react";

const SEARCH_FIELDS = [
  "nama_aset",
  "kode_aset",
  "nib",
  "nibar",
  "nomor_sertifikat",
  "opd_pengguna",
  "lokasi",
  "kecamatan",
  "desa_kelurahan",
];

function normalizeText(value) {
  return value ? String(value).toLowerCase().trim() : "";
}

function normalizeDigits(value) {
  return value ? String(value).replace(/\D/g, "") : "";
}

function matchesSearch(value, term, termDigits) {
  const text = normalizeText(value);
  if (text.includes(term)) return true;

  const digits = normalizeDigits(value);
  return termDigits.length >= 2 && digits.includes(termDigits);
}

function hasCoordinatePair(latitude, longitude) {
  return Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude));
}

function hasPolygonCoordinates(value) {
  if (!value) return false;

  if (typeof value === "string") {
    try {
      return hasPolygonCoordinates(JSON.parse(value));
    } catch {
      return false;
    }
  }

  if (Array.isArray(value)) {
    const [first, second] = value;
    if (hasCoordinatePair(first, second)) return true;
    return value.some((item) => hasPolygonCoordinates(item));
  }

  if (typeof value === "object") {
    if (hasCoordinatePair(value.lat, value.lng)) return true;
    if (hasCoordinatePair(value.latitude, value.longitude)) return true;
    return ["coordinates", "geometry", "features"].some((key) =>
      hasPolygonCoordinates(value[key]),
    );
  }

  return false;
}

function hasMapGeometry(asset) {
  return (
    hasCoordinatePair(asset?.latitude, asset?.longitude) ||
    hasPolygonCoordinates(asset?.polygon)
  );
}

function hasMapPolygon(asset) {
  return hasPolygonCoordinates(asset?.polygon);
}

function isCertifiedAsset(asset) {
  const status = normalizeText(asset?.status_sertifikat);
  if (status.includes("belum") || status.includes("tidak")) return false;
  if (status.includes("telah") || status.includes("sudah")) return true;

  return String(asset?.nomor_sertifikat || "").trim().length > 10;
}

export default function MapFilter({
  selectedSewaLayers,
  onSewaLayerToggle,
  onSearch,
  onSelectAsset,
  assets = [],
  searchResults = null,
  searchLoading = false,
  isBPKAMode = false,
  showStatistics = true,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term);
  };

  // Search results for dropdown (max 6)
  const localSearchResults = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const lower = normalizeText(searchTerm);
    const digits = normalizeDigits(searchTerm);
    return assets
      .filter((asset) =>
        SEARCH_FIELDS.some((field) =>
          matchesSearch(asset[field], lower, digits),
        ),
      )
      .slice(0, 6);
  }, [searchTerm, assets]);
  const displayedSearchResults = searchResults ?? localSearchResults;

  const clearSearch = () => {
    setSearchTerm("");
    onSearch("");
  };

  return (
    <div className="space-y-5">
      {/* Search Box */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-text-muted uppercase tracking-wide">
          Cari Aset
        </label>
        <div className="relative">
          <MagnifyingGlassIcon
            size={18}
            weight="bold"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder={
              isBPKAMode
                ? "NIBAR, No Sertifikat, OPD..."
                : "Nama atau kode aset..."
            }
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-9 py-3 text-sm bg-surface border-2 border-border rounded-xl outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all text-text-primary placeholder:text-text-muted"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
            >
              <XIcon size={16} weight="bold" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchLoading ? (
          <div className="mt-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-[11px] text-text-muted shadow-lg">
            Mencari aset...
          </div>
        ) : null}

        {displayedSearchResults.length > 0 && !searchLoading && (
          <div className="mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
            {displayedSearchResults.map((asset) => {
              const hasMap = hasMapGeometry(asset);
              const hasBidang = hasMapPolygon(asset);
              const hasPointOnly = hasMap && !hasBidang;
              const SearchActionIcon = hasBidang ? CrosshairIcon : ProhibitIcon;

              return (
              <div
                key={asset.id}
                className={`flex items-center justify-between gap-2 px-3 py-2.5 border-b border-border last:border-b-0 transition-colors ${
                  hasBidang
                    ? "hover:bg-surface-secondary"
                    : "bg-amber-50/70 hover:bg-amber-50 dark:bg-amber-900/10 dark:hover:bg-amber-900/20"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">
                      {asset.nama_aset || asset.kode_aset}
                    </p>
                    {!hasBidang && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                        <ProhibitIcon size={10} weight="bold" />
                        Tanpa bidang
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-text-muted truncate">
                    {!hasBidang
                      ? "Belum memiliki bidang/polygon"
                      : isBPKAMode && asset.nibar
                      ? `NIBAR: ${asset.nibar}`
                      : asset.kecamatan
                        ? `Kec. ${asset.kecamatan}`
                        : asset.lokasi || "-"}
                  </p>
                </div>
                <button
                  onClick={() => onSelectAsset?.(asset)}
                  disabled={!hasBidang}
                  aria-label={
                    hasBidang ? "Lihat bidang di peta" : "Tidak ada bidang"
                  }
                  title={
                    hasBidang
                      ? "Lihat bidang aset di peta"
                      : hasPointOnly
                        ? "Aset ini hanya memiliki titik koordinat, belum ada polygon bidang"
                        : "Aset ini belum memiliki polygon bidang"
                  }
                  className={`shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    hasBidang
                      ? "text-surface bg-accent hover:bg-accent/80"
                      : "text-amber-700 bg-amber-100 cursor-not-allowed dark:text-amber-200 dark:bg-amber-900/30"
                  }`}
                >
                  <SearchActionIcon size={16} weight="bold" />
                </button>
              </div>
              );
            })}
          </div>
        )}

        {searchTerm.length >= 2 &&
          displayedSearchResults.length === 0 &&
          !searchLoading && (
            <div className="mt-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-[11px] text-text-muted shadow-lg">
              Tidak ditemukan aset yang cocok.
            </div>
          )}
      </div>

      {/* Filter Sewa — BPKA only */}
      {isBPKAMode && selectedSewaLayers && onSewaLayerToggle && (
        <div className="space-y-3">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wide flex items-center gap-2">
            <HandshakeIcon size={14} />
            Filter Sewa
          </label>
          <div className="grid grid-cols-2 gap-2">
            {/* Tersedia / Sedia Disewakan */}
            <button
              onClick={() => onSewaLayerToggle("tersedia")}
              className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all ${
                selectedSewaLayers.tersedia
                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400"
                  : "bg-surface border-border opacity-50"
              }`}
            >
              <div className="w-5 h-5 rounded-md flex items-center justify-center bg-emerald-500">
                <StorefrontIcon
                  size={12}
                  weight="fill"
                  className="text-surface"
                />
              </div>
              <span
                className={`text-xs font-medium ${selectedSewaLayers.tersedia ? "text-text-primary" : "text-text-muted"}`}
              >
                Tersedia
              </span>
            </button>
            {/* Tersewa */}
            <button
              onClick={() => onSewaLayerToggle("tersewa")}
              className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all ${
                selectedSewaLayers.tersewa
                  ? "bg-amber-50 dark:bg-amber-900/20 border-amber-400"
                  : "bg-surface border-border opacity-50"
              }`}
            >
              <div className="w-5 h-5 rounded-md flex items-center justify-center bg-amber-500">
                <HandshakeIcon
                  size={12}
                  weight="fill"
                  className="text-surface"
                />
              </div>
              <span
                className={`text-xs font-medium ${selectedSewaLayers.tersewa ? "text-text-primary" : "text-text-muted"}`}
              >
                Tersewa
              </span>
            </button>
          </div>
        </div>
      )}

      {showStatistics && (
        <MapAssetStats assets={assets} isBPKAMode={isBPKAMode} />
      )}
    </div>
  );
}

export function MapAssetStats({ assets = [], isBPKAMode = false }) {
  const stats = useMemo(() => {
    const certified = assets.filter(isCertifiedAsset).length;
    return {
      total: assets.length,
      bersertifikat: certified,
      belumBersertifikat: assets.length - certified,
      tersewa: assets.filter((a) => a.status_sewa === "Tersewa").length,
      tersedia: assets.filter((a) => a.status_sewa === "Tersedia").length,
    };
  }, [assets]);

  return (
    <div className="bg-linear-to-br from-accent/10 to-accent/5 rounded-xl p-4 border border-accent/20">
      <div className="flex items-center gap-2 mb-3">
        <ChartPieIcon size={16} weight="fill" className="text-accent" />
        <h4 className="text-sm font-bold text-text-primary">Statistik Aset</h4>
      </div>

      <div className="flex items-center justify-between mb-3 p-2.5 bg-surface rounded-lg">
        <span className="text-xs text-text-secondary">Total Aset</span>
        <span className="text-xl font-bold text-text-primary">
          {stats.total}
        </span>
      </div>

      {!isBPKAMode && (
        <>
          <div className="space-y-1.5">
            {[
              {
                label: "Bersertifikat",
                count: stats.bersertifikat,
                bgColor: "bg-sky-500",
              },
              {
                label: "Belum Bersertifikat",
                count: stats.belumBersertifikat,
                bgColor: "bg-red-500",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${item.bgColor}`}
                  />
                  <span className="text-text-secondary">{item.label}</span>
                </div>
                <span className="font-bold text-text-primary">
                  {item.count}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 h-1.5 bg-surface rounded-full overflow-hidden flex">
            {stats.total > 0 && (
              <>
                <div
                  className="bg-sky-500 transition-all"
                  style={{
                    width: `${(stats.bersertifikat / stats.total) * 100}%`,
                  }}
                />
                <div
                  className="bg-red-500 transition-all"
                  style={{
                    width: `${(stats.belumBersertifikat / stats.total) * 100}%`,
                  }}
                />
              </>
            )}
          </div>
        </>
      )}

      {isBPKAMode && (
        <>
          <div className="space-y-1.5">
            {[
              {
                label: "Tersedia Disewa",
                count: stats.tersedia,
                bgColor: "bg-emerald-500",
              },
              {
                label: "Tersewa",
                count: stats.tersewa,
                bgColor: "bg-amber-500",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${item.bgColor}`}
                  />
                  <span className="text-text-secondary">{item.label}</span>
                </div>
                <span className="font-bold text-text-primary">
                  {item.count}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 h-1.5 bg-surface rounded-full overflow-hidden flex">
            {stats.total > 0 && (
              <>
                <div
                  className="bg-emerald-500 transition-all"
                  style={{
                    width: `${(stats.tersedia / stats.total) * 100}%`,
                  }}
                />
                <div
                  className="bg-amber-500 transition-all"
                  style={{
                    width: `${(stats.tersewa / stats.total) * 100}%`,
                  }}
                />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
