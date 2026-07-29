import {
  ArrowRightIcon,
  BuildingsIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  CubeIcon,
  IdentificationCardIcon,
  MapPinIcon,
  NoteIcon,
  RulerIcon,
  XIcon,
} from "@phosphor-icons/react";
import { buildAssetPopupData, hasPopupValue } from "../../../utils/assetPopupData";

const formatNumber = (value, suffix = "") => {
  if (!hasPopupValue(value)) return null;
  const numeric = Number(value);
  const formatted = Number.isFinite(numeric)
    ? numeric.toLocaleString("id-ID", { maximumFractionDigits: 2 })
    : String(value);
  return suffix ? `${formatted} ${suffix}` : formatted;
};

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <dt className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-text-muted">
        {label}
      </dt>
      <dd className="min-w-0 break-words text-right text-[11px] font-semibold leading-relaxed text-text-primary">
        {String(value)}
      </dd>
    </div>
  );
}

function ModelMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg bg-surface px-2 py-2 text-center">
      <p className="truncate text-[11px] font-black text-text-primary">
        {hasPopupValue(value) ? value : "—"}
      </p>
      <p className="mt-0.5 text-[7px] font-bold uppercase tracking-wide text-text-muted">
        {label}
      </p>
    </div>
  );
}

export default function AssetPopupCard({
  asset,
  model = null,
  onClose,
  onViewDetail,
  headerProps = {},
  isDragging = false,
  preview = false,
}) {
  if (!asset) return null;

  const popup = buildAssetPopupData(asset, model);
  const modelStatusLabel = popup.model.active
    ? "Ditampilkan di peta"
    : "Preview versi belum aktif";

  return (
    <>
      <header
        {...headerProps}
        className={`bg-accent px-4 py-3 text-surface ${
          headerProps.className || ""
        } ${isDragging ? "cursor-grabbing" : preview ? "" : "cursor-grab"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface/15">
              <BuildingsIcon size={17} weight="fill" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-black leading-tight">
                {popup.title}
              </h3>
              <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[9px] font-semibold text-surface/75">
                {popup.assetCode && (
                  <span className="truncate font-mono">{popup.assetCode}</span>
                )}
                {popup.assetCode && popup.catalogCode && (
                  <span aria-hidden="true">·</span>
                )}
                {popup.catalogCode && (
                  <span className="truncate font-mono">{popup.catalogCode}</span>
                )}
              </div>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup detail aset"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-surface/80 transition-colors hover:bg-surface/15 hover:text-surface focus-visible:ring-2 focus-visible:ring-surface/70"
            >
              <XIcon size={15} weight="bold" />
            </button>
          )}
        </div>
      </header>

      <div className="space-y-3 p-3.5">
        {popup.model.available && (
          <section className="rounded-xl border border-violet-200 bg-violet-50/70 p-2.5 dark:border-violet-500/30 dark:bg-violet-500/10">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wide text-violet-700 dark:text-violet-300">
                <CubeIcon size={13} weight="fill" />
                Model 3D
              </span>
              {popup.model.recordAvailable && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[7px] font-black uppercase ${
                    popup.model.active
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                  }`}
                >
                  <CheckCircleIcon size={10} weight="fill" />
                  {modelStatusLabel}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <ModelMetric label="LOD" value={popup.model.lod} />
              <ModelMetric
                label="Versi"
                value={
                  hasPopupValue(popup.model.version)
                    ? `v${popup.model.version}`
                    : null
                }
              />
              <ModelMetric label="Format" value={popup.model.format} />
              <ModelMetric
                label="Tinggi"
                value={formatNumber(popup.model.height, "m")}
              />
              <ModelMetric label="Lantai" value={popup.model.floors} />
              <ModelMetric label="CRS" value={popup.model.sourceCrs} />
            </div>
          </section>
        )}

        {popup.details.length > 0 && (
          <dl className="divide-y divide-border/60 rounded-xl bg-surface-secondary px-3">
            {popup.details.map((item) => (
              <DetailRow key={item.label} {...item} />
            ))}
          </dl>
        )}

        {popup.location && (
          <div className="flex items-start gap-2 rounded-xl bg-surface-secondary p-2.5">
            <MapPinIcon
              size={13}
              className="mt-0.5 shrink-0 text-text-muted"
            />
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-wide text-text-muted">
                Lokasi
              </p>
              <p className="mt-1 text-[11px] font-semibold leading-relaxed text-text-secondary">
                {popup.location}
              </p>
            </div>
          </div>
        )}

        {(hasPopupValue(popup.area) || hasPopupValue(popup.year)) && (
          <div className="grid grid-cols-2 gap-2">
            {hasPopupValue(popup.area) && (
              <div className="rounded-xl bg-surface-secondary p-2.5">
                <div className="mb-1 flex items-center gap-1.5 text-text-muted">
                  <RulerIcon size={11} />
                  <span className="text-[8px] font-bold uppercase tracking-wide">
                    Luas
                  </span>
                </div>
                <p className="text-xs font-black text-text-primary">
                  {formatNumber(popup.area, "m²")}
                </p>
              </div>
            )}
            {hasPopupValue(popup.year) && (
              <div className="rounded-xl bg-surface-secondary p-2.5">
                <div className="mb-1 flex items-center gap-1.5 text-text-muted">
                  <CalendarBlankIcon size={11} />
                  <span className="text-[8px] font-bold uppercase tracking-wide">
                    Tahun
                  </span>
                </div>
                <p className="text-xs font-black text-text-primary">
                  {popup.year}
                </p>
              </div>
            )}
          </div>
        )}

        {popup.description && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-2.5 dark:border-amber-500/30 dark:bg-amber-500/10">
            <NoteIcon
              size={13}
              className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300"
            />
            <p className="text-[10px] leading-relaxed text-amber-800 dark:text-amber-200">
              {popup.description}
            </p>
          </div>
        )}

        {!popup.model.available &&
          popup.details.length === 0 &&
          !popup.location &&
          !hasPopupValue(popup.area) &&
          !hasPopupValue(popup.year) && (
            <div className="rounded-xl border border-dashed border-border p-4 text-center">
              <IdentificationCardIcon
                size={24}
                className="mx-auto text-text-muted"
              />
              <p className="mt-2 text-[10px] font-bold text-text-muted">
                Belum ada atribut tambahan untuk ditampilkan.
              </p>
            </div>
          )}

        {onViewDetail && (
          <button
            type="button"
            onClick={() => onViewDetail(asset)}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-surface transition-colors hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Lihat Detail Lengkap
            <ArrowRightIcon
              size={14}
              weight="bold"
              className="transition-transform group-hover:translate-x-0.5"
            />
          </button>
        )}
      </div>
    </>
  );
}
