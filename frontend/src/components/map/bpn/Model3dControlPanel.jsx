import { createElement, useState } from "react";
import {
  ArrowSquareOutIcon,
  ArrowsOutIcon,
  BuildingsIcon,
  CaretDownIcon,
  CheckCircleIcon,
  CrosshairIcon,
  CubeIcon,
  EyeIcon,
  MapPinIcon,
  MapTrifoldIcon,
  RulerIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import { groupLocationsByArea2d } from "../../../utils/model3dCatalogGroups";
import ShadowAnalysisPanel from "./ShadowAnalysisPanel";

const TABS = [
  { id: "data3d", label: "Level of Detail" },
  { id: "data2d", label: "Layer Controls" },
  { id: "tampilan", label: "Navigation" },
  { id: "status", label: "Node Status" },
  { id: "analisis", label: "Tools" },
  { id: "shadow", label: "Analisis Bayangan" },
  { id: "information", label: "Informasi" },
];

const TEAM_MEMBERS = [
  "Fikry Satrio",
  "M. Zaky Fahlevy",
  "Rizky Lanang Sadana Mulyono Putra",
];

const LOD_OPTIONS = [
  { id: "lod1", shortLabel: "LOD 1", label: "LOD 1 – Block Model" },
  { id: "lod2", shortLabel: "LOD 2", label: "LOD 2 – Roof Detail" },
  { id: "lod2.5", shortLabel: "LOD 2.5", label: "LOD 2.5 – Facade Detail" },
  { id: "lod3", shortLabel: "LOD 3", label: "LOD 3 – Detailed Facade" },
  { id: "lod4", shortLabel: "LOD 4", label: "LOD 4 – Architectural Detail" },
  { id: "gaussian", shortLabel: "GS", label: "Gaussian Splatting" },
];

function resolveLodOption(location) {
  const value = `${location?.lod || ""} ${location?.modelType || ""}`
    .toLowerCase()
    .replaceAll("_", ".");

  if (value.includes("gaussian") || value.includes("splat")) return "gaussian";
  if (value.includes("lod4") || value.includes("lod 4")) return "lod4";
  if (
    value.includes("lod2.5")
    || value.includes("lod 2.5")
    || value.includes("lod25")
  ) return "lod2.5";
  if (value.includes("lod3") || value.includes("lod 3")) return "lod3";
  if (value.includes("lod2") || value.includes("lod 2")) return "lod2";
  return "lod1";
}

function ToolButton({
  icon,
  label,
  description,
  onClick,
  disabled = false,
  active = false,
  compact = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active || undefined}
      className={`group relative rounded-xl border text-left transition-colors focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border ${
        compact
          ? "flex h-12 items-center gap-2 px-2.5"
          : "min-h-24 p-3"
      } ${
        active
          ? "border-accent bg-surface-tertiary"
          : "border-border bg-surface hover:border-text-muted"
      }`}
    >
      {disabled && (
        <span className="absolute right-2 top-2 rounded-full bg-surface-secondary px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-text-muted">
          Segera
        </span>
      )}
      <span className={`flex shrink-0 items-center justify-center rounded-lg transition-colors group-hover:bg-accent group-hover:text-surface ${
        compact ? "h-7 w-7" : "h-9 w-9"
      } ${
        active
          ? "bg-accent text-surface"
          : "bg-surface-tertiary text-text-secondary"
      }`}>
        {createElement(icon, { size: compact ? 15 : 19, weight: "duotone" })}
      </span>
      <span
        className={`block font-extrabold uppercase tracking-wide text-text-primary ${
          compact ? "text-[9px]" : "mt-2 text-[11px]"
        }`}
      >
        {label}
      </span>
      {!compact && description && (
        <span className="mt-0.5 block text-[9px] leading-snug text-text-muted">
          {description}
        </span>
      )}
    </button>
  );
}

/*
function RoomTable({ rooms }) {
  if (!rooms.length) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface-secondary p-3 text-center">
        <TableIcon size={20} className="mx-auto text-text-muted" />
        <p className="mt-1.5 text-[10px] font-bold text-text-secondary">Belum ada daftar ruang 3D</p>
        <p className="mt-0.5 text-[9px] leading-relaxed text-text-muted">Data ruang akan muncul setelah metadata ruang ditambahkan ke model.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-left text-[9px]">
        <thead className="bg-surface-secondary text-text-muted">
          <tr>
            <th className="px-2 py-1.5 font-extrabold">Ruang</th>
            <th className="px-2 py-1.5 font-extrabold">Lantai</th>
            <th className="px-2 py-1.5 text-right font-extrabold">Luas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rooms.map((room, index) => (
            <tr key={room?.id || room?.name || index}>
              <td className="px-2 py-1.5 font-semibold text-text-primary">{room?.name || room?.nama || String(room)}</td>
              <td className="px-2 py-1.5 text-text-secondary">{room?.floor || room?.lantai || "-"}</td>
              <td className="px-2 py-1.5 text-right text-text-secondary">
                {(room?.area_m2 ?? room?.area ?? room?.luas) != null
                  ? `${room.area_m2 ?? room.area ?? room.luas} m²`
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
*/

export default function Model3dControlPanel({
  embedded = false,
  onClose,
  onDisable3d,
  data2dContent = null,
  detailedModelCount,
  tiledModelCount,
  fallbackCount,
  tilesetStatus,
  fallbackStatus,
  locations = [],
  visibleLocationIds = null,
  onVisibleLocationIdsChange,
  onPerspective,
  onTopView,
  onNorthView,
  onFocusModels,
  analysisTool = null,
  analysisResult = null,
  onAnalysisToolChange,
  onClearAnalysis,
  shadowEnabled = false,
  shadowDate,
  shadowMinutes,
  onShadowEnabledChange,
  onShadowDateChange,
  onShadowMinutesChange,
  onUseCurrentShadowTime,
}) {
  const [activeTab, setActiveTab] = useState("data3d");
  const [selectedLod, setSelectedLod] = useState(null);
  const [expandedArea2d, setExpandedArea2d] = useState(undefined);
  const allIds = locations.map((location) => String(location.id));
  const selectedIds = visibleLocationIds === null
    ? allIds
    : visibleLocationIds.map(String).filter((id) => allIds.includes(id));
  const locationsByLod = Object.fromEntries(
    LOD_OPTIONS.map((option) => [
      option.id,
      locations.filter((location) => resolveLodOption(location) === option.id),
    ]),
  );
  const effectiveSelectedLod = selectedLod
    || LOD_OPTIONS.find((option) => locationsByLod[option.id].length > 0)?.id
    || "lod3";
  const activeLodGroups = groupLocationsByArea2d(
    locationsByLod[effectiveSelectedLod],
  );
  const effectiveExpandedArea2d = expandedArea2d === undefined
    ? activeLodGroups[0]?.key
    : expandedArea2d;

  const updateSelection = (nextIds) => {
    const normalizedIds = Array.from(new Set(nextIds.map(String)));
    onVisibleLocationIdsChange?.(normalizedIds);
  };

  const selectLod = (lodId) => {
    const matchingIds = locationsByLod[lodId].map((location) => String(location.id));
    if (!matchingIds.length) return;
    setSelectedLod(lodId);
    setExpandedArea2d(undefined);
    updateSelection(matchingIds);
  };

  const tilesMessage = tilesetStatus.state === "loading"
    ? `Menyiapkan ${tiledModelCount} model detail…`
    : tilesetStatus.state === "error"
      ? "Sebagian model detail gagal dimuat."
      : `${selectedIds.length} dari ${locations.length} lokasi ditampilkan`;
  const activeTabIndex = TABS.findIndex((tab) => tab.id === activeTab);

  return (
    <aside
      className={embedded
        ? "flex max-h-[calc(100vh-5.75rem)] min-h-0 w-full flex-col overflow-hidden bg-surface/95 backdrop-blur-xl"
        : "motion-panel-enter mt-1.5 flex max-h-[calc(100vh-5rem)] w-[min(19rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-border bg-surface/95 shadow-xl shadow-black/15 backdrop-blur-xl"}
      aria-label="Menu peta 3D"
    >
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border bg-surface px-3">
        <CubeIcon size={15} weight="fill" className="text-accent" />
        <h2 className="min-w-0 flex-1 text-[10px] font-black uppercase tracking-[0.12em] text-text-primary">
          Menu Peta 3D
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup menu peta 3D"
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent"
        >
          <XIcon size={14} weight="bold" />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
      <div className="contents" role="tablist" aria-label="Menu peta 3D">
        {TABS.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-expanded={activeTab === tab.id}
            aria-controls={`panel-3d-${tab.id}`}
            onClick={() => setActiveTab((current) => current === tab.id ? null : tab.id)}
            style={{ order: index * 2 }}
            className={`flex min-h-11 w-full shrink-0 items-center justify-between gap-3 border-b border-border px-3.5 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
              activeTab === tab.id
                ? "bg-accent text-surface"
                : "bg-surface text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
            }`}
          >
            <span>{tab.label}</span>
            <CaretDownIcon
              size={13}
              weight="bold"
              className={`transition-transform duration-200 ${activeTab === tab.id ? "rotate-180" : ""}`}
            />
          </button>
        ))}
      </div>

      {activeTab && <div
        className="border-b border-border bg-surface-secondary/80 p-3"
        style={{ order: activeTabIndex * 2 + 1 }}
      >
        {activeTab === "data2d" && (
          <section id="panel-3d-data2d" role="tabpanel">
            {data2dContent || (
              <div className="rounded-xl border border-dashed border-border p-5 text-center text-[10px] text-text-muted">
                Kontrol Data 2D tidak tersedia pada tampilan ini.
              </div>
            )}
          </section>
        )}

        {activeTab === "data3d" && (
          <section id="panel-3d-data3d" role="tabpanel" aria-label="Pilih level of detail" className="space-y-2">
            <div
              role="tablist"
              aria-label="Level of Detail model 3D"
              className="grid grid-cols-3 gap-1"
            >
              {LOD_OPTIONS.map((option) => {
                const count = locationsByLod[option.id].length;
                const isActive = effectiveSelectedLod === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    role="tab"
                    onClick={() => selectLod(option.id)}
                    disabled={count === 0}
                    aria-selected={isActive}
                    title={option.label}
                    className={`inline-flex h-7 min-w-0 items-center justify-center gap-1 rounded-md border px-1.5 text-[8px] font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      isActive
                        ? "border-accent bg-accent text-surface"
                        : "border-border bg-surface text-text-secondary hover:bg-surface-tertiary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    }`}
                  >
                    <span>{option.shortLabel}</span>
                    <span
                      className={`flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 text-[7px] font-black ${
                        isActive
                          ? "bg-surface/20 text-surface"
                          : "bg-surface-secondary text-text-muted"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2 px-0.5">
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-text-primary">
                {
                  LOD_OPTIONS.find(
                    (option) => option.id === effectiveSelectedLod,
                  )?.label
                }
              </p>
              <span className="shrink-0 rounded-full bg-surface px-1.5 py-0.5 text-[7px] font-black text-text-secondary">
                {locationsByLod[effectiveSelectedLod].length} data
              </span>
            </div>

            {locationsByLod[effectiveSelectedLod].length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface px-3 py-5 text-center">
                <BuildingsIcon size={21} className="mx-auto text-text-muted" />
                <p className="mt-2 text-[9px] font-bold text-text-muted">
                  Belum ada data pada level ini.
                </p>
              </div>
            ) : (
              <div className="max-h-60 space-y-1 overflow-y-auto pr-0.5">
                {activeLodGroups.map((group) => {
                  const isExpanded = effectiveExpandedArea2d === group.key;
                  const visibleCount = group.items.filter((location) =>
                    selectedIds.includes(String(location.id))).length;

                  return (
                    <div key={group.key} className="overflow-hidden rounded-lg border border-border bg-surface">
                      <button
                        type="button"
                        onClick={() => setExpandedArea2d(isExpanded ? null : group.key)}
                        aria-expanded={isExpanded}
                        aria-controls={`area-2d-${group.key}`}
                        className="flex min-h-10 w-full items-center gap-2 px-2 py-1.5 text-left transition-colors hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
                          <MapTrifoldIcon size={14} weight="duotone" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-mono text-[9px] font-black text-text-primary" title={group.code}>
                            {group.code}
                          </span>
                          <span className="block truncate text-[7px] text-text-muted" title={group.location}>
                            {group.location}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-surface-secondary px-1.5 py-0.5 text-[7px] font-black text-text-secondary">
                          {visibleCount}/{group.items.length}
                        </span>
                        <CaretDownIcon
                          size={11}
                          weight="bold"
                          className={`shrink-0 text-text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </button>

                      {isExpanded && (
                        <div id={`area-2d-${group.key}`} className="space-y-1 border-t border-border bg-surface-secondary/45 p-1.5">
                          {group.items.map((location) => {
                            const isVisible = selectedIds.includes(String(location.id));
                            return (
                              <article
                                key={location.id}
                                className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5"
                              >
                                <span
                                  className={`h-2 w-2 shrink-0 rounded-full ${
                                    isVisible ? "bg-emerald-500" : "bg-text-muted"
                                  }`}
                                  title={isVisible ? "Ditampilkan" : "Disembunyikan"}
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[9px] font-extrabold text-text-primary" title={location.name}>
                                    {location.name}
                                  </p>
                                  <p className="flex items-center gap-1 truncate text-[7px] text-text-muted">
                                    <MapPinIcon size={8} weight="fill" />
                                    {location.location}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onFocusModels?.(location)}
                                  className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-accent/30 bg-accent/10 px-1.5 text-[7px] font-extrabold text-accent transition-colors hover:border-accent hover:bg-accent hover:text-surface focus-visible:ring-2 focus-visible:ring-accent"
                                  aria-label={`Fly To ${location.name}`}
                                  title={`Fly To ${location.name}`}
                                >
                                  <CrosshairIcon size={10} weight="bold" />
                                  Fly
                                </button>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/*
            <label className="relative block">
              <span className="sr-only">Cari data 3D</span>
              <MagnifyingGlassIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari lokasi atau data 3D…"
                className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-[10px] font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => updateSelection(allIds)} className="rounded-lg border border-accent bg-accent px-2 py-2 text-[9px] font-extrabold text-surface transition hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent">
                Pilih Semua
              </button>
              <button type="button" onClick={() => updateSelection([])} className="rounded-lg border border-red-200 bg-red-50 px-2 py-2 text-[9px] font-extrabold text-red-600 transition hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-500 dark:bg-red-500/10 dark:text-red-300">
                Kosongkan Pilihan
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5" role="status" aria-live="polite">
              <div className="rounded-lg border border-border bg-surface-secondary px-2 py-2 text-center">
                <p className="text-sm font-black leading-none text-text-primary">{locations.length}</p>
                <p className="mt-1 text-[8px] font-bold text-text-muted">Lokasi</p>
              </div>
              <div className="rounded-lg border border-border bg-surface px-2 py-2 text-center">
                <p className="text-sm font-black leading-none text-text-primary">{selectedIds.length}</p>
                <p className="mt-1 text-[8px] font-bold text-text-muted">Ditampilkan</p>
              </div>
              <div className="rounded-lg border border-border bg-surface px-2 py-2 text-center">
                <p className="text-sm font-black leading-none text-text-primary">{detailedModelCount}</p>
                <p className="mt-1 text-[8px] font-bold text-text-muted">Model detail</p>
              </div>
            </div>

            <p className="rounded-lg bg-surface-secondary px-2.5 py-2 text-[8px] font-semibold text-text-muted">
              {tilesMessage}
              {fallbackStatus.failed > 0 ? ` · ${fallbackCount} fallback` : ""}
            </p>

            {filteredLocations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <BuildingsIcon size={24} className="mx-auto text-text-muted" />
                <p className="mt-2 text-[11px] font-extrabold text-text-primary">Data 3D tidak ditemukan</p>
                <p className="mt-1 text-[9px] text-text-muted">Coba gunakan kata pencarian lain.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredLocations.map((location) => {
                  const isSelected = selectedIdSet.has(String(location.id));
                  const isIsolated = selectedIds.length === 1 && isSelected;
                  const showRooms = roomTableId === location.id;
                  const crossSectionActive = crossSectionId === location.id;
                  return (
                    <article key={location.id} className={`rounded-xl border bg-surface p-3 transition ${isSelected ? "border-accent" : "border-border opacity-70"}`}>
                      <div className="flex items-start gap-2.5">
                        <Switch
                          size="sm"
                          tone="accent"
                          checked={isSelected}
                          onCheckedChange={() => toggleLocation(location.id)}
                          className="mt-0.5"
                          aria-label={`${isSelected ? "Sembunyikan" : "Tampilkan"} ${location.name}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-extrabold text-text-primary" title={location.name}>{location.name}</p>
                          <p className="mt-0.5 flex items-center gap-1 truncate text-[9px] text-text-muted"><MapPinIcon size={10} weight="fill" /> {location.location}</p>
                        </div>
                        <span className="rounded-md bg-surface-tertiary px-1.5 py-1 text-[8px] font-black text-text-secondary">{location.lod}</span>
                      </div>

                      <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div className={`h-full rounded-full bg-accent transition-all ${isSelected ? "w-full" : "w-0"}`} />
                      </div>

                      <div className="mt-2 grid grid-cols-4 gap-1 border-t border-border pt-1.5">
                        <LocationAction icon={CrosshairIcon} shortLabel="Fokus" label={`Arahkan ke ${location.name}`} onClick={() => onFocusModels?.(location)} />
                        <LocationAction icon={CubeIcon} shortLabel="Potongan" label={`Cross-section ${location.name}`} active={crossSectionActive} onClick={() => setCrossSectionId(crossSectionActive ? null : location.id)} />
                        <LocationAction icon={TableIcon} shortLabel="Ruang" label={`Daftar ruang ${location.name}`} active={showRooms} onClick={() => setRoomTableId(showRooms ? null : location.id)} />
                        <LocationAction icon={FunnelSimpleIcon} shortLabel="Isolasi" label={`${isIsolated ? "Tampilkan semua data 3D" : "Isolasi visual"} ${location.name}`} active={isIsolated} onClick={() => isolateLocation(location.id)} />
                      </div>

                      {crossSectionActive && (
                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[9px] leading-relaxed text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                          Cross-section dipilih. Mesin clipping bidang potong akan diaktifkan pada tahap analisis berikutnya.
                        </div>
                      )}
                      {showRooms && <div className="mt-2"><RoomTable rooms={location.rooms} /></div>}
                    </article>
                  );
                })}
              </div>
            )}
            */}
          </section>
        )}

        {activeTab === "tampilan" && (
          <section id="panel-3d-tampilan" role="tabpanel">
            <div className="grid grid-cols-2 gap-1.5">
              <ToolButton compact icon={EyeIcon} label="Perspektif" onClick={onPerspective} />
              <ToolButton compact icon={MapTrifoldIcon} label="Tampak atas" onClick={onTopView} />
              <ToolButton compact icon={CrosshairIcon} label="Fokus model" onClick={() => onFocusModels?.()} />
              <ToolButton compact icon={ArrowsOutIcon} label="Arah utara" onClick={onNorthView} />
            </div>
          </section>
        )}

        {activeTab === "status" && (
          <section id="panel-3d-status" role="tabpanel" className="space-y-2" aria-live="polite">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border bg-surface-secondary p-2.5">
                <p className="text-base font-black text-text-primary">{selectedIds.length}</p>
                <p className="text-[8px] font-bold text-text-muted">Objek aktif</p>
              </div>
              <div className="rounded-lg border border-border bg-surface-secondary p-2.5">
                <p className="text-base font-black text-text-primary">{detailedModelCount}</p>
                <p className="text-[8px] font-bold text-text-muted">Model detail</p>
              </div>
            </div>
            <p className="rounded-lg border border-border bg-surface-secondary px-3 py-2 text-[9px] font-semibold text-text-muted">
              {tilesMessage}
              {fallbackStatus.failed > 0 ? ` · ${fallbackCount} model fallback` : ""}
            </p>
          </section>
        )}

        {activeTab === "analisis" && (
          <section id="panel-3d-analisis" role="tabpanel" className="space-y-2">
            <div className="grid grid-cols-2 gap-1.5">
              <ToolButton
                icon={RulerIcon}
                label="Jarak"
                compact
                active={analysisTool === "distance"}
                onClick={() => onAnalysisToolChange?.("distance")}
              />
              <ToolButton
                icon={CubeIcon}
                label="Volume"
                compact
                active={analysisTool === "volume"}
                onClick={() => onAnalysisToolChange?.("volume")}
              />
              <ToolButton
                icon={BuildingsIcon}
                label="Tinggi"
                compact
                active={analysisTool === "height"}
                onClick={() => onAnalysisToolChange?.("height")}
              />
              <ToolButton
                icon={MapPinIcon}
                label="Koordinat"
                compact
                active={analysisTool === "coordinate"}
                onClick={() => onAnalysisToolChange?.("coordinate")}
              />
            </div>

            {analysisResult && (
              <div
                role="status"
                aria-live="polite"
                className={`rounded-xl border p-3 ${
                  analysisResult.status === "error"
                    ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                }`}
              >
                <div className="flex items-start gap-2">
                  <CheckCircleIcon size={18} weight="fill" className="mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-extrabold uppercase tracking-wide opacity-75">
                      {analysisResult.label}
                    </p>
                    {analysisResult.mapsUrl ? (
                      <a
                        href={analysisResult.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Buka koordinat terpilih di Google Maps"
                        title="Buka di Google Maps"
                        className="mt-0.5 inline-flex items-center gap-1.5 break-words text-base font-black underline decoration-current/40 underline-offset-2 transition-opacity hover:opacity-75 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
                      >
                        <span>{analysisResult.value}</span>
                        <ArrowSquareOutIcon
                          size={13}
                          weight="bold"
                          className="shrink-0"
                        />
                      </a>
                    ) : (
                      <p className="mt-0.5 break-words text-base font-black">
                        {analysisResult.value}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(analysisTool || analysisResult) && (
              <button
                type="button"
                onClick={onClearAnalysis}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-[9px] font-extrabold text-text-secondary transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-500/10"
              >
                <TrashIcon size={14} weight="bold" />
                Hapus hasil dan nonaktifkan alat
              </button>
            )}
          </section>
        )}

        {activeTab === "shadow" && (
          <ShadowAnalysisPanel
            enabled={shadowEnabled}
            date={shadowDate}
            minutes={shadowMinutes}
            onEnabledChange={onShadowEnabledChange}
            onDateChange={onShadowDateChange}
            onMinutesChange={onShadowMinutesChange}
            onUseCurrentTime={onUseCurrentShadowTime}
          />
        )}

        {activeTab === "information" && (
          <section id="panel-3d-information" role="tabpanel">
            <p className="text-[8px] font-extrabold uppercase tracking-[0.14em] text-text-muted">
              Team
            </p>
            <ul className="mt-2 space-y-1.5">
              {TEAM_MEMBERS.map((member) => (
                <li
                  key={member}
                  className="flex items-start gap-2 text-[9px] leading-relaxed text-text-secondary"
                >
                  <span
                    className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent/60"
                    aria-hidden="true"
                  />
                  <span>{member}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>}
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-3 bg-surface px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Mode 3D aktif
        </span>
        <button type="button" onClick={onDisable3d} className="text-[10px] font-extrabold text-accent hover:text-accent-hover focus-visible:ring-2 focus-visible:ring-accent">
          Kembali ke 2D
        </button>
      </footer>
    </aside>
  );
}
