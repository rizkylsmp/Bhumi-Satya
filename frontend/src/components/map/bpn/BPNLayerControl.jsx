import { useState } from "react";
import {
  BuildingsIcon,
  CaretDownIcon,
  CertificateIcon,
  MapPinAreaIcon,
  StackIcon,
} from "@phosphor-icons/react";
import Switch from "../../ui/Switch";

const LAYERS = [
  {
    value: "bidang",
    label: "Bidang",
    color: "border-sky-500 bg-sky-500/20",
  },
  {
    value: "rdtr",
    label: "Pola Ruang",
    color: "border-emerald-500 bg-emerald-500/70",
  },
  {
    value: "znt",
    label: "Nilai Tanah",
    color: "border-orange-500 bg-orange-500/70",
  },
];

const DATA_3D_FILTERS = [
  { value: "all", label: "Semua" },
  { value: "available", label: "Ada 3D" },
  { value: "missing", label: "Tanpa 3D" },
];

function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="mb-2 flex items-center gap-1.5">
      <Icon size={12} weight="bold" className="text-text-muted" />
      <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-text-muted">
        {children}
      </span>
    </div>
  );
}

function ToggleRow({
  checked,
  onCheckedChange,
  label,
  ariaLabel,
  tone,
  markerClass,
}) {
  return (
    <div className="flex min-h-9 items-center gap-2 rounded-lg px-2 transition-colors hover:bg-surface-secondary">
      <span className={`h-2.5 w-2.5 shrink-0 ${markerClass}`} aria-hidden="true" />
      <span
        className={`min-w-0 flex-1 truncate text-[11px] font-semibold ${
          checked ? "text-text-primary" : "text-text-muted"
        }`}
      >
        {label}
      </span>
      <Switch
        size="sm"
        tone={tone}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={ariaLabel}
      />
    </div>
  );
}

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
  const layers = isBPKAMode
    ? LAYERS.filter((layer) => layer.value === "bidang")
    : LAYERS;

  return (
    <div
      className={
        embedded
          ? "bg-surface"
          : "overflow-hidden rounded-xl border border-border bg-surface"
      }
    >
      {!embedded && (
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          aria-expanded={isOpen}
          className="flex min-h-11 w-full items-center justify-between gap-2 px-3 text-left transition-colors hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
        >
          <span className="flex min-w-0 items-center gap-2">
            <StackIcon size={15} weight="fill" className="shrink-0 text-accent" />
            <span className="truncate text-xs font-bold text-text-primary">
              {panelTitle}
            </span>
          </span>
          <CaretDownIcon
            size={13}
            weight="bold"
            className={`shrink-0 text-text-muted transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      )}

      {(embedded || isOpen) && (
        <div className="divide-y divide-border/70">
          {!isBPKAMode && (
            <section className="p-3">
              <SectionTitle icon={StackIcon}>Layer utama</SectionTitle>
              <div
                className="grid grid-cols-3 gap-1 rounded-lg bg-surface-secondary p-1"
                role="radiogroup"
                aria-label="Layer utama peta"
              >
                {layers.map((layer) => {
                  const selected = activeLayer === layer.value;
                  return (
                    <button
                      key={layer.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setActiveLayer(layer.value)}
                      className={`flex min-h-10 flex-col items-center justify-center gap-1 rounded-md px-1 text-center transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
                        selected
                          ? "bg-surface text-accent"
                          : "text-text-muted hover:bg-surface/70 hover:text-text-primary"
                      }`}
                    >
                      <span
                        className={`h-2.5 w-4 rounded-sm border ${layer.color}`}
                        aria-hidden="true"
                      />
                      <span className="text-[9px] font-bold leading-tight">
                        {layer.value === "bidang" ? bidangLabel : layer.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {setShowSudahSertifikat && setShowBelumSertifikat && (
            <section className="p-3">
              <SectionTitle icon={CertificateIcon}>Sertifikat</SectionTitle>
              <div className="grid grid-cols-1 gap-0.5">
                <ToggleRow
                  checked={showSudahSertifikat}
                  onCheckedChange={(checked) => {
                    setActiveLayer("bidang");
                    setShowSudahSertifikat(checked);
                  }}
                  label="Sudah bersertifikat"
                  ariaLabel="Tampilkan bidang sudah bersertifikat"
                  tone="sky"
                  markerClass="rounded-full border-2 border-sky-700 bg-sky-500"
                />
                <ToggleRow
                  checked={showBelumSertifikat}
                  onCheckedChange={(checked) => {
                    setActiveLayer("bidang");
                    setShowBelumSertifikat(checked);
                  }}
                  label="Belum bersertifikat"
                  ariaLabel="Tampilkan bidang belum bersertifikat"
                  tone="red"
                  markerClass="rounded-full border-2 border-red-700 bg-red-500"
                />
              </div>
            </section>
          )}

          {setShowKelurahan && setShowKecamatan && (
            <section className="p-3">
              <SectionTitle icon={MapPinAreaIcon}>Batas wilayah</SectionTitle>
              <div className="grid grid-cols-1 gap-0.5">
                <ToggleRow
                  checked={showKelurahan}
                  onCheckedChange={setShowKelurahan}
                  label="Kelurahan"
                  ariaLabel="Tampilkan batas kelurahan"
                  tone="emerald"
                  markerClass="!h-0.5 !w-4 rounded-full bg-emerald-500"
                />
                <ToggleRow
                  checked={showKecamatan}
                  onCheckedChange={setShowKecamatan}
                  label="Kecamatan"
                  ariaLabel="Tampilkan batas kecamatan"
                  tone="violet"
                  markerClass="!h-0.5 !w-4 bg-violet-500"
                />
              </div>
            </section>
          )}

          {setData3dFilter && (
            <section className="p-3">
              <SectionTitle icon={BuildingsIcon}>Ketersediaan 3D</SectionTitle>
              <div
                className="grid grid-cols-3 gap-1"
                role="radiogroup"
                aria-label="Filter ketersediaan data 3D"
              >
                {DATA_3D_FILTERS.map((option) => {
                  const selected = (data3dFilter || "all") === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setData3dFilter(option.value)}
                      className={`min-h-8 rounded-lg border px-1.5 text-[9px] font-bold transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
                        selected
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border bg-surface text-text-muted hover:bg-surface-secondary hover:text-text-primary"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
