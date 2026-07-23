import { createElement, useState } from "react";
import {
  ArrowsOutIcon,
  BuildingsIcon,
  CheckCircleIcon,
  CrosshairIcon,
  CubeIcon,
  EyeIcon,
  FolderOpenIcon,
  FunnelSimpleIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  MapTrifoldIcon,
  RulerIcon,
  TableIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import Switch from "../../ui/Switch";

const TABS = [
  { id: "data3d", label: "Data 3D" },
  { id: "data2d", label: "Data 2D" },
  { id: "tampilan", label: "Tampilan" },
  { id: "analisis", label: "Analisis" },
];

const ANALYSIS_TOOL_COPY = {
  distance: {
    title: "Ukur jarak",
    instruction: "Klik minimal dua titik pada peta. Setiap titik berikutnya menambah segmen jarak.",
  },
  volume: {
    title: "Estimasi volume",
    instruction: "Klik bangunan 3D. Volume dihitung dari tapak dan tinggi, atau kotak batas model.",
  },
  height: {
    title: "Ukur tinggi",
    instruction: "Klik bangunan 3D untuk membaca tinggi yang tersimpan pada model atau metadata aset.",
  },
  coordinate: {
    title: "Baca koordinat",
    instruction: "Klik satu titik pada peta untuk membaca longitude dan latitude.",
  },
};

function ToolButton({
  icon,
  label,
  description,
  onClick,
  disabled = false,
  active = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active || undefined}
      className={`group relative min-h-24 rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:border-border disabled:hover:shadow-none ${
        active
          ? "border-violet-500 bg-violet-50 shadow-sm shadow-violet-500/10 dark:bg-violet-500/10"
          : "border-border bg-surface hover:border-violet-300"
      }`}
    >
      {disabled && (
        <span className="absolute right-2 top-2 rounded-full bg-surface-secondary px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-text-muted">
          Segera
        </span>
      )}
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors group-hover:bg-violet-600 group-hover:text-white ${
        active
          ? "bg-violet-600 text-white"
          : "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
      }`}>
        {createElement(icon, { size: 19, weight: "duotone" })}
      </span>
      <span className="mt-2 block text-[11px] font-extrabold uppercase tracking-wide text-text-primary">{label}</span>
      <span className="mt-0.5 block text-[9px] leading-snug text-text-muted">{description}</span>
    </button>
  );
}

function LocationAction({ icon, label, shortLabel, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active || undefined}
      className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 transition-colors focus-visible:ring-2 focus-visible:ring-violet-500 ${
        active
          ? "bg-violet-600 text-white"
          : "text-accent hover:bg-accent/10 dark:text-sky-300 dark:hover:bg-sky-500/10"
      }`}
    >
      {createElement(icon, { size: 17, weight: active ? "fill" : "bold" })}
      <span className="max-w-full truncate text-[7px] font-extrabold uppercase tracking-wide">{shortLabel}</span>
    </button>
  );
}

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

export default function Model3dControlPanel({
  embedded = false,
  onClose,
  onDisable3d,
  data2dContent = null,
  buildingCount,
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
  analysisPointCount = 0,
  onAnalysisToolChange,
  onClearAnalysis,
}) {
  const [activeTab, setActiveTab] = useState("data3d");
  const [searchTerm, setSearchTerm] = useState("");
  const [crossSectionId, setCrossSectionId] = useState(null);
  const [roomTableId, setRoomTableId] = useState(null);
  const allIds = locations.map((location) => String(location.id));
  const selectedIds = visibleLocationIds === null
    ? allIds
    : visibleLocationIds.map(String).filter((id) => allIds.includes(id));
  const selectedIdSet = new Set(selectedIds);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredLocations = locations.filter((location) => !normalizedSearch || [
    location.name,
    location.location,
    location.lod,
    location.modelType,
  ].some((value) => String(value || "").toLowerCase().includes(normalizedSearch)));

  const updateSelection = (nextIds) => {
    const normalizedIds = Array.from(new Set(nextIds.map(String)));
    onVisibleLocationIdsChange?.(
      normalizedIds.length === allIds.length ? null : normalizedIds,
    );
  };

  const toggleLocation = (locationId) => {
    const id = String(locationId);
    updateSelection(
      selectedIdSet.has(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id],
    );
  };

  const isolateLocation = (locationId) => {
    const id = String(locationId);
    const isIsolated = selectedIds.length === 1 && selectedIdSet.has(id);
    updateSelection(isIsolated ? allIds : [id]);
  };

  const tilesMessage = tilesetStatus.state === "loading"
    ? `Menyiapkan ${tiledModelCount} model detail…`
    : tilesetStatus.state === "error"
      ? "Sebagian model detail gagal dimuat."
      : `${selectedIds.length} dari ${locations.length} lokasi ditampilkan`;

  return (
    <aside
      className={embedded
        ? "flex h-full w-full flex-col overflow-hidden bg-surface"
        : "mt-1.5 flex max-h-[calc(100vh-5rem)] w-[min(20rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-white/80 bg-surface/95 shadow-xl shadow-slate-950/15 backdrop-blur-xl dark:border-slate-700 dark:shadow-black/40"}
      aria-label="Panel kontrol peta"
    >
      <header className="flex items-start gap-3 border-b border-border bg-gradient-to-r from-violet-600/12 via-sky-500/7 to-transparent px-4 py-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-sky-500 text-white">
          <CubeIcon size={21} weight="duotone" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black text-text-primary">Kontrol Peta</h2>
          <p className="mt-0.5 text-[10px] font-medium text-text-muted">{locations.length} lokasi data 3D Bhumi Satya</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup panel kontrol peta"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <XIcon size={17} weight="bold" />
        </button>
      </header>

      <div className="overflow-x-auto border-b border-border bg-surface/95 px-2 pt-1 backdrop-blur" role="tablist" aria-label="Menu panel peta">
        <div className="flex min-w-full">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-3d-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 border-b-2 px-3 py-2.5 text-[10px] font-extrabold transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 ${
                activeTab === tab.id
                  ? "border-violet-600 text-violet-700 dark:text-violet-300"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3.5">
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
          <section id="panel-3d-data3d" role="tabpanel" className="space-y-3">
            <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-cyan-400 bg-cyan-50/60 px-3 py-2.5 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
              <FolderOpenIcon size={17} weight="fill" />
              <span className="text-[11px] font-extrabold">Katalog Data 3D</span>
            </div>

            <label className="relative block">
              <span className="sr-only">Cari data 3D</span>
              <MagnifyingGlassIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari lokasi atau data 3D…"
                className="h-9 w-full rounded-lg border border-border bg-surface-secondary pl-9 pr-3 text-[10px] font-semibold text-text-primary outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => updateSelection(allIds)} className="rounded-lg border border-cyan-300 bg-cyan-50 px-2 py-2 text-[9px] font-extrabold text-cyan-700 transition hover:bg-cyan-100 focus-visible:ring-2 focus-visible:ring-cyan-500 dark:bg-cyan-500/10 dark:text-cyan-300">
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
              <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-2 py-2 text-center dark:border-cyan-500/30 dark:bg-cyan-500/10">
                <p className="text-sm font-black leading-none text-cyan-700 dark:text-cyan-300">{selectedIds.length}</p>
                <p className="mt-1 text-[8px] font-bold text-cyan-700/70 dark:text-cyan-300/70">Ditampilkan</p>
              </div>
              <div className="rounded-lg border border-violet-200 bg-violet-50 px-2 py-2 text-center dark:border-violet-500/30 dark:bg-violet-500/10">
                <p className="text-sm font-black leading-none text-violet-700 dark:text-violet-300">{detailedModelCount}</p>
                <p className="mt-1 text-[8px] font-bold text-violet-700/70 dark:text-violet-300/70">Model detail</p>
              </div>
            </div>

            <p className="rounded-lg bg-surface-secondary px-2.5 py-2 text-[8px] font-semibold text-text-muted">
              {tilesMessage} · {buildingCount} bangunan LOD
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
                    <article key={location.id} className={`rounded-xl border bg-surface p-3 shadow-sm transition ${isSelected ? "border-cyan-300" : "border-border opacity-70"}`}>
                      <div className="flex items-start gap-2.5">
                        <Switch
                          size="sm"
                          tone="cyan"
                          checked={isSelected}
                          onCheckedChange={() => toggleLocation(location.id)}
                          className="mt-0.5"
                          aria-label={`${isSelected ? "Sembunyikan" : "Tampilkan"} ${location.name}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-extrabold text-text-primary" title={location.name}>{location.name}</p>
                          <p className="mt-0.5 flex items-center gap-1 truncate text-[9px] text-text-muted"><MapPinIcon size={10} weight="fill" /> {location.location}</p>
                        </div>
                        <span className="rounded-md bg-violet-50 px-1.5 py-1 text-[8px] font-black text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">{location.lod}</span>
                      </div>

                      <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div className={`h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 transition-all ${isSelected ? "w-full" : "w-0"}`} />
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
          </section>
        )}

        {activeTab === "tampilan" && (
          <section id="panel-3d-tampilan" role="tabpanel">
            <p className="mb-3 text-[10px] leading-relaxed text-text-muted">Gunakan preset kamera untuk memeriksa bentuk dan posisi model.</p>
            <div className="grid grid-cols-2 gap-2">
              <ToolButton icon={EyeIcon} label="Perspektif" description="Sudut miring untuk membaca volume." onClick={onPerspective} />
              <ToolButton icon={MapTrifoldIcon} label="Tampak atas" description="Kembali ke sudut peta tegak." onClick={onTopView} />
              <ToolButton icon={CrosshairIcon} label="Fokus model" description="Pusatkan kamera pada model aktif." onClick={() => onFocusModels?.()} />
              <ToolButton icon={ArrowsOutIcon} label="Arah utara" description="Luruskan orientasi peta ke utara." onClick={onNorthView} />
            </div>
          </section>
        )}

        {activeTab === "analisis" && (
          <section id="panel-3d-analisis" role="tabpanel" className="space-y-3">
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-[10px] leading-relaxed text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200">
              <p className="font-extrabold">
                {analysisTool
                  ? ANALYSIS_TOOL_COPY[analysisTool]?.title
                  : "Pilih jenis pengukuran"}
              </p>
              <p className="mt-1 font-medium">
                {analysisTool
                  ? ANALYSIS_TOOL_COPY[analysisTool]?.instruction
                  : "Aktifkan alat, lalu klik titik atau bangunan pada peta 3D."}
              </p>
              {analysisTool === "distance" && analysisPointCount > 0 && (
                <p className="mt-2 font-bold text-violet-600 dark:text-violet-300">
                  {analysisPointCount} titik pengukuran dipilih
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ToolButton
                icon={RulerIcon}
                label="Jarak"
                description="Jarak kumulatif antartitik."
                active={analysisTool === "distance"}
                onClick={() => onAnalysisToolChange?.("distance")}
              />
              <ToolButton
                icon={CubeIcon}
                label="Volume"
                description="Estimasi volume bangunan."
                active={analysisTool === "volume"}
                onClick={() => onAnalysisToolChange?.("volume")}
              />
              <ToolButton
                icon={BuildingsIcon}
                label="Tinggi"
                description="Tinggi dari metadata 3D."
                active={analysisTool === "height"}
                onClick={() => onAnalysisToolChange?.("height")}
              />
              <ToolButton
                icon={MapPinIcon}
                label="Koordinat"
                description="Longitude dan latitude titik."
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
                    <p className="mt-0.5 break-words text-base font-black">
                      {analysisResult.value}
                    </p>
                    {analysisResult.detail && (
                      <p className="mt-1 text-[9px] font-medium leading-relaxed opacity-80">
                        {analysisResult.detail}
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

            <p className="text-[8px] leading-relaxed text-text-muted">
              Hasil simulasi bersifat indikatif dan bukan pengganti pengukuran survei atau dokumen legal.
            </p>
          </section>
        )}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-border bg-surface-secondary/70 px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/15" /> Mode 3D aktif
        </span>
        <button type="button" onClick={onDisable3d} className="text-[10px] font-extrabold text-violet-700 hover:text-violet-900 focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-violet-300">
          Kembali ke 2D
        </button>
      </footer>
    </aside>
  );
}
