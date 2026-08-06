import { useEffect, useMemo, useRef, useState } from "react";
import {
  BuildingsIcon,
  CrosshairIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  MapTrifoldIcon,
  XIcon,
} from "@phosphor-icons/react";
import { hasUsableAsset3dData } from "../../../utils/asset3dGeojson";

const SEARCH_FIELDS = [
  "nama_aset",
  "kode_aset",
  "kode_2d",
  "kode_3d",
  "nib",
  "nibar",
  "nomor_sertifikat",
  "opd_pengguna",
  "lokasi",
  "kecamatan",
  "desa_kelurahan",
];

function normalizeText(value) {
  return String(value || "").toLocaleLowerCase("id").trim();
}

function hasCoordinatePair(latitude, longitude) {
  if (
    latitude === null
    || latitude === undefined
    || longitude === null
    || longitude === undefined
    || String(latitude).trim() === ""
    || String(longitude).trim() === ""
  ) {
    return false;
  }
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

function has2dGeometry(asset) {
  return (
    hasCoordinatePair(asset?.latitude, asset?.longitude)
    || hasPolygonCoordinates(asset?.polygon)
  );
}

function matchesTerm(asset, term) {
  if (!term) return true;
  return SEARCH_FIELDS.some((field) => normalizeText(asset?.[field]).includes(term));
}

function getAssetLocation(asset) {
  return [asset?.desa_kelurahan, asset?.kecamatan, asset?.lokasi]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(" · ") || "Lokasi belum dilengkapi";
}

function getAssetLods(asset) {
  const models = Array.isArray(asset?.active_models_3d)
    ? asset.active_models_3d
    : asset?.active_model_3d
      ? [asset.active_model_3d]
      : [];

  return [...new Set(models.map((model) => model?.lod).filter(Boolean))].join(", ");
}

function splitAssetBuildings3d(asset) {
  const models = Array.isArray(asset?.active_models_3d)
    ? asset.active_models_3d
    : asset?.active_model_3d
      ? [asset.active_model_3d]
      : [];
  const groups = new Map();

  models.forEach((model) => {
    const code = model?.kode_3d || asset?.kode_3d || "";
    if (!groups.has(code)) groups.set(code, []);
    groups.get(code).push(model);
  });

  if (groups.size === 0) return hasUsableAsset3dData(asset) ? [asset] : [];
  return [...groups.entries()].map(([code, buildingModels]) => ({
    ...asset,
    kode_3d: code || asset?.kode_3d,
    active_model_3d: buildingModels[0] || null,
    active_models_3d: buildingModels,
  }));
}

export default function MapSearchOverlay({
  assets = [],
  activeMapMode = "2d",
  onSelectAsset,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchMode, setSearchMode] = useState(activeMapMode);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const assetsByMode = useMemo(() => ({
    "2d": assets.filter(has2dGeometry),
    "3d": assets.flatMap(splitAssetBuildings3d),
  }), [assets]);

  const results = useMemo(() => {
    const term = normalizeText(query);
    return assetsByMode[searchMode]
      .filter((asset) => matchesTerm(asset, term))
      .sort((left, right) =>
        String(left?.nama_aset || left?.kode_aset || "").localeCompare(
          String(right?.nama_aset || right?.kode_aset || ""),
          "id",
        ),
      );
  }, [assetsByMode, query, searchMode]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 50);
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeMapMode, isOpen]);

  const updateQuery = (value) => {
    setQuery(value);
  };

  const openSearch = () => {
    setSearchMode(activeMapMode);
    setIsOpen(true);
  };

  const selectAsset = (asset) => {
    onSelectAsset?.(asset, searchMode);
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        className="group flex h-11 w-full items-center gap-3 rounded-xl border border-border bg-surface/95 px-3.5 text-left shadow-lg shadow-black/10 backdrop-blur-xl transition-colors hover:border-accent/50 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <MagnifyingGlassIcon
          size={18}
          weight="bold"
          className="shrink-0 text-sky-600 transition-colors group-hover:text-accent dark:text-cyan-300"
        />
        <span className="min-w-0 flex-1 truncate text-sm text-text-muted">
          {query || "Cari data 2D atau 3D…"}
        </span>
        <span className="rounded-md bg-surface-secondary px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-text-secondary">
          {activeMapMode.toUpperCase()}
        </span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[48] flex items-start justify-center bg-slate-950/45 px-3 pb-3 pt-16 backdrop-blur-[3px] sm:px-6 sm:pt-[9vh]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="map-search-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <div className="flex max-h-[82vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/30">
            <header className="flex items-start justify-between gap-4 border-b border-border px-4 py-3.5 sm:px-5">
              <div className="min-w-0">
                <h2 id="map-search-title" className="text-sm font-black text-text-primary sm:text-base">
                  Cari Data Peta
                </h2>
                <p className="mt-0.5 text-[10px] text-text-muted sm:text-xs">
                  {activeMapMode === "3d"
                    ? "Cari data 2D atau 3D tanpa mengubah mode peta."
                    : "Cari data 2D lalu arahkan peta ke aset yang dipilih."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Tutup pencarian"
              >
                <XIcon size={17} weight="bold" />
              </button>
            </header>

            <div className="border-b border-border px-4 py-3 sm:px-5">
              <div className="relative">
                <MagnifyingGlassIcon
                  size={19}
                  weight="bold"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-accent"
                />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(event) => updateQuery(event.target.value)}
                  placeholder="Cari kode aset, nama, lokasi, NIBAR…"
                  className="h-12 w-full rounded-xl border border-border bg-surface-secondary pl-11 pr-11 text-sm font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 placeholder:font-normal placeholder:text-text-muted [&::-webkit-search-cancel-button]:hidden"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => updateQuery("")}
                    className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    aria-label="Hapus kata pencarian"
                  >
                    <XIcon size={15} weight="bold" />
                  </button>
                )}
              </div>

              {activeMapMode === "3d" ? (
                <div className="mt-3 grid grid-cols-2 gap-2" role="tablist" aria-label="Jenis data peta">
                  {[
                    { id: "2d", label: "Data 2D", icon: MapTrifoldIcon },
                    { id: "3d", label: "Data 3D", icon: CubeIcon },
                  ].map(({ id, label, icon: ModeIcon }) => {
                  const selected = searchMode === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setSearchMode(id)}
                      className={`flex h-10 items-center justify-center gap-2 rounded-xl border text-xs font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        selected
                          ? "border-accent bg-accent text-white"
                          : "border-border bg-surface text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                      }`}
                    >
                      <ModeIcon size={16} weight={selected ? "fill" : "bold"} />
                      {label}
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                        selected ? "bg-white/20 text-white" : "bg-surface-secondary text-text-muted"
                      }`}>
                        {assetsByMode[id].length}
                      </span>
                    </button>
                  );
                  })}
                </div>
              ) : (
                <div className="mt-3 flex h-10 items-center justify-between rounded-xl border border-sky-500/25 bg-sky-500/5 px-3 text-sky-700 dark:text-sky-200">
                  <span className="flex items-center gap-2 text-xs font-black">
                    <MapTrifoldIcon size={16} weight="fill" />
                    Data 2D
                  </span>
                  <span className="rounded-full bg-sky-500/10 px-2 py-1 text-[9px] font-black">
                    {assetsByMode["2d"].length} data
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-b border-border bg-surface-secondary/60 px-4 py-2 sm:px-5">
              <p className="text-[10px] font-bold text-text-secondary">
                {results.length} data ditemukan
              </p>
              {query && (
                <p className="max-w-[55%] truncate text-[10px] text-text-muted">
                  Hasil untuk “{query}”
                </p>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3 dark:[color-scheme:dark] sm:p-4">
              {results.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {results.map((asset) => {
                    const lods = searchMode === "3d" ? getAssetLods(asset) : "";
                    return (
                      <article
                        key={`${searchMode}-${asset.id_aset || asset.id}-${asset.kode_3d || asset.active_model_3d?.id_model_3d || "asset"}`}
                        className="group flex min-h-28 flex-col rounded-xl border border-border bg-surface p-3 transition-colors hover:border-accent/45 hover:bg-surface-secondary/60"
                      >
                        <div className="flex min-w-0 items-start gap-2.5">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            searchMode === "3d"
                              ? "bg-violet-500/10 text-violet-600 dark:text-violet-300"
                              : "bg-sky-500/10 text-sky-600 dark:text-sky-300"
                          }`}>
                            {searchMode === "3d"
                              ? <BuildingsIcon size={17} weight="fill" />
                              : <MapPinIcon size={17} weight="fill" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-xs font-black text-text-primary">
                              {asset.nama_aset || "Aset tanpa nama"}
                            </h3>
                            <p className="mt-0.5 truncate font-mono text-[9px] font-bold text-accent">
                              {asset.kode_aset || "Kode aset belum tersedia"}
                            </p>
                          </div>
                          {lods && (
                            <span className="shrink-0 rounded-md bg-violet-500/10 px-1.5 py-1 text-[8px] font-black uppercase text-violet-700 dark:text-violet-200">
                              {lods}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-text-muted">
                          {getAssetLocation(asset)}
                        </p>
                        <button
                          type="button"
                          onClick={() => selectAsset(asset)}
                          className="mt-auto flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-accent/10 text-[10px] font-black text-accent transition-colors hover:bg-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          <CrosshairIcon size={14} weight="bold" />
                          Lihat di peta
                        </button>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-secondary text-text-muted">
                    <MagnifyingGlassIcon size={23} weight="bold" />
                  </span>
                  <p className="mt-3 text-xs font-black text-text-primary">Data tidak ditemukan</p>
                  <p className="mt-1 max-w-sm text-[10px] leading-relaxed text-text-muted">
                    Coba kata kunci lain atau pindah ke mode pencarian {searchMode === "2d" ? "3D" : "2D"}.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
