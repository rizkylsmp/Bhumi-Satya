import { useState } from "react";
import {
  CaretDownIcon,
  CaretUpIcon,
  StackIcon,
  MapPinAreaIcon,
  CertificateIcon,
  BuildingsIcon,
} from "@phosphor-icons/react";
import Switch from "../../ui/Switch";

export default function BPNLayerControl({
  activeLayer,
  setActiveLayer,
  panelTitle = "Kontrol Layer",
  bidangLabel = "Bidang Tanah",

  showKelurahan = true,
  setShowKelurahan,
  showKecamatan = true,
  setShowKecamatan,
  isBPKAMode = false,
  showSudahSertifikat = true,
  setShowSudahSertifikat,
  showBelumSertifikat = true,
  setShowBelumSertifikat,
  data3dFilter,
  setData3dFilter,
  embedded = false,
}) {
  const [isOpen, setIsOpen] = useState(true);

  const allLayers = [
    {
      value: "bidang",
      label: bidangLabel,
      swatch: (
        <span className="w-3.5 h-2.5 rounded-sm border border-sky-400 bg-sky-400/20 shrink-0" />
      ),
    },
    {
      value: "rdtr",
      label: "RDTR / Pola Ruang",
      swatch: (
        <span
          className="w-3.5 h-2.5 rounded-sm shrink-0"
          style={{
            backgroundColor: "#22c55e",
            opacity: 0.7,
            border: "1px solid rgba(0,0,0,0.1)",
          }}
        />
      ),
    },
    {
      value: "znt",
      label: "ZNT / Nilai Tanah",
      swatch: (
        <span
          className="w-3.5 h-2.5 rounded-sm shrink-0"
          style={{
            backgroundColor: "#f97316",
            opacity: 0.7,
            border: "1px solid rgba(0,0,0,0.1)",
          }}
        />
      ),
    },
  ];

  // BPKA mode: only show bidang (Bidang Tanah), hide RDTR/ZNT
  const layers = isBPKAMode
    ? allLayers.filter((l) => l.value === "bidang")
    : allLayers;

  return (
    <div>
      {/* Header toggle is omitted when this control lives inside an accordion. */}
      {!embedded && (
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 bg-surface border border-border rounded-xl px-3 py-2.5 text-left hover:bg-surface-secondary transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <StackIcon size={15} weight="fill" className="text-accent shrink-0" />
            <span className="text-xs font-bold text-text-primary truncate">
              {panelTitle}
            </span>
          </div>
          {isOpen ? (
            <CaretUpIcon size={13} className="text-text-muted shrink-0" />
          ) : (
            <CaretDownIcon size={13} className="text-text-muted shrink-0" />
          )}
        </button>
      )}

      {/* Body */}
      {(embedded || isOpen) && (
        <div className={embedded
          ? "overflow-hidden bg-surface"
          : "mt-1.5 overflow-hidden rounded-xl border border-border bg-surface"}>
          {!isBPKAMode && (
            <div className="px-3 pt-3 pb-2.5">
              <div className="flex items-center gap-1.5 mb-2.5">
                <StackIcon size={11} className="text-text-muted" />
                <span className="text-[10px] uppercase tracking-wide font-semibold text-text-muted">
                  Lapisan Aktif
                </span>
              </div>

              <div className="space-y-2">
                {layers.map(({ value, label, swatch }) => (
                  <label
                    key={value}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="active-layer"
                      value={value}
                      checked={activeLayer === value}
                      onChange={() => setActiveLayer(value)}
                      className="w-3.5 h-3.5 accent-accent"
                    />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {swatch}
                      <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors truncate">
                        {label}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Filter Sertifikat */}
          {setShowSudahSertifikat && setShowBelumSertifikat && (
            <div className="px-3 pb-3 pt-2 border-t border-border/50">
              <div className="flex items-center gap-1.5 mb-2.5">
                <CertificateIcon size={11} className="text-text-muted" />
                <span className="text-[10px] uppercase tracking-wide font-semibold text-text-muted">
                  Filter Sertifikat
                </span>
              </div>
              <div className="space-y-1.5">
                {/* Sudah Bersertifikat */}
                <label
                  className={`flex items-center gap-2.5 cursor-pointer rounded-lg px-2.5 py-2 transition-all duration-200 border ${
                    showSudahSertifikat
                      ? "bg-sky-50 dark:bg-sky-900/15 border-sky-200 dark:border-sky-800/40"
                      : "bg-transparent border-transparent hover:bg-surface-secondary"
                  }`}
                >
                  <Switch
                    size="sm"
                    tone="sky"
                    checked={showSudahSertifikat}
                    onCheckedChange={(checked) => {
                      setActiveLayer("bidang");
                      setShowSudahSertifikat(checked);
                    }}
                    aria-label="Tampilkan aset sudah bersertifikat"
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className="w-3 h-3 shrink-0 rounded-full border-2"
                      style={{
                        backgroundColor: showSudahSertifikat
                          ? "#0ea5e9"
                          : "#94a3b8",
                        borderColor: showSudahSertifikat
                          ? "#0369a1"
                          : "#9ca3af",
                        transition: "all 0.2s",
                      }}
                    />
                    <span
                      className={`text-xs font-medium transition-colors truncate ${
                        showSudahSertifikat
                          ? "text-sky-700 dark:text-sky-300"
                          : "text-text-muted"
                      }`}
                    >
                      Sudah Bersertifikat
                    </span>
                  </div>
                </label>

                {/* Belum Bersertifikat */}
                <label
                  className={`flex items-center gap-2.5 cursor-pointer rounded-lg px-2.5 py-2 transition-all duration-200 border ${
                    showBelumSertifikat
                      ? "bg-red-50 dark:bg-red-900/15 border-red-200 dark:border-red-800/40"
                      : "bg-transparent border-transparent hover:bg-surface-secondary"
                  }`}
                >
                  <Switch
                    size="sm"
                    tone="red"
                    checked={showBelumSertifikat}
                    onCheckedChange={(checked) => {
                      setActiveLayer("bidang");
                      setShowBelumSertifikat(checked);
                    }}
                    aria-label="Tampilkan aset belum bersertifikat"
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className="w-3 h-3 shrink-0 rounded-full border-2"
                      style={{
                        backgroundColor: showBelumSertifikat
                          ? "#ef4444"
                          : "#94a3b8",
                        borderColor: showBelumSertifikat
                          ? "#b91c1c"
                          : "#9ca3af",
                        transition: "all 0.2s",
                      }}
                    />
                    <span
                      className={`text-xs font-medium transition-colors truncate ${
                        showBelumSertifikat
                          ? "text-red-700 dark:text-red-300"
                          : "text-text-muted"
                      }`}
                    >
                      Belum Bersertifikat
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {setData3dFilter && (
            <fieldset className="border-t border-border/50 px-3 pb-3 pt-2">
              <legend className="flex items-center gap-1.5 px-0 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                <BuildingsIcon size={11} />
                Data Bangunan 3D
              </legend>
              <div className="mt-2 space-y-1.5">
                {[
                  { value: "all", label: "Semua aset" },
                  { value: "available", label: "Data 3D tersedia" },
                  { value: "missing", label: "Data 3D belum lengkap" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-text-secondary hover:bg-surface-secondary"
                  >
                    <input
                      type="radio"
                      name="data-3d-filter"
                      value={option.value}
                      checked={(data3dFilter || "all") === option.value}
                      onChange={() => setData3dFilter(option.value)}
                      className="accent-violet-600"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-1.5" aria-label="Legenda kualitas tinggi bangunan">
                {[
                  ["#7c3aed", "Terukur"],
                  ["#2563eb", "Hasil turunan"],
                  ["#d97706", "Estimasi"],
                ].map(([color, label]) => (
                  <div key={label} className="flex items-center gap-2 text-[10px] text-text-muted">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
                    {label}
                  </div>
                ))}
              </div>
            </fieldset>
          )}

          {/* Batas Wilayah toggles */}
          {setShowKelurahan && setShowKecamatan && (
            <div className="px-3 pb-3 pt-2 border-t border-border/50">
              <div className="flex items-center gap-1.5 mb-2.5">
                <MapPinAreaIcon size={11} className="text-text-muted" />
                <span className="text-[10px] uppercase tracking-wide font-semibold text-text-muted">
                  Batas Wilayah
                </span>
              </div>
              <div className="space-y-1.5">
                {/* Kelurahan */}
                <label
                  className={`flex items-center gap-2.5 cursor-pointer rounded-lg px-2.5 py-2 transition-all duration-200 border ${
                    showKelurahan
                      ? "bg-emerald-50 dark:bg-emerald-900/15 border-emerald-200 dark:border-emerald-800/40"
                      : "bg-transparent border-transparent hover:bg-surface-secondary"
                  }`}
                >
                  <Switch
                    size="sm"
                    tone="emerald"
                    checked={showKelurahan}
                    onCheckedChange={setShowKelurahan}
                    aria-label="Tampilkan batas kelurahan"
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className="w-5 shrink-0 rounded-full"
                      style={{
                        height: "2px",
                        backgroundColor: showKelurahan ? "#10b981" : "#94a3b8",
                        transition: "background-color 0.2s",
                      }}
                    />
                    <span
                      className={`text-xs font-medium transition-colors truncate ${
                        showKelurahan
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-text-muted"
                      }`}
                    >
                      Batas Kelurahan
                    </span>
                  </div>
                </label>

                {/* Kecamatan */}
                <label
                  className={`flex items-center gap-2.5 cursor-pointer rounded-lg px-2.5 py-2 transition-all duration-200 border ${
                    showKecamatan
                      ? "bg-violet-50 dark:bg-violet-900/15 border-violet-200 dark:border-violet-800/40"
                      : "bg-transparent border-transparent hover:bg-surface-secondary"
                  }`}
                >
                  <Switch
                    size="sm"
                    tone="violet"
                    checked={showKecamatan}
                    onCheckedChange={setShowKecamatan}
                    aria-label="Tampilkan batas kecamatan"
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className="w-5 shrink-0"
                      style={{
                        height: "2.5px",
                        backgroundImage: `repeating-linear-gradient(90deg, ${showKecamatan ? "#8b5cf6" : "#334155"} 0 4px, transparent 4px 7px)`,
                        backgroundSize: "7px 2.5px",
                        transition: "background-image 0.2s",
                      }}
                    />
                    <span
                      className={`text-xs font-medium transition-colors truncate ${
                        showKecamatan
                          ? "text-violet-700 dark:text-violet-300"
                          : "text-text-muted"
                      }`}
                    >
                      Batas Kecamatan
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
