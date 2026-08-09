import { useState } from "react";
import {
  ArrowRightIcon,
  ArrowSquareOutIcon,
  ArrowsInSimpleIcon,
  ArrowsOutSimpleIcon,
  BuildingsIcon,
  CaretDownIcon,
  CheckCircleIcon,
  CubeIcon,
  DatabaseIcon,
  FileTextIcon,
  IdentificationCardIcon,
  InfoIcon,
  MapTrifoldIcon,
  MapPinIcon,
  NoteIcon,
  ReceiptIcon,
  RulerIcon,
  SealCheckIcon,
  XIcon,
} from "@phosphor-icons/react";
import { buildAssetPopupData, hasPopupValue } from "../../../utils/assetPopupData";
import {
  formatCurrency,
  formatNumberWithOptions,
} from "../../../utils/format";

const formatNumber = (value, suffix = "") => {
  if (!hasPopupValue(value)) return null;
  const numeric = Number(value);
  const formatted = Number.isFinite(numeric)
    ? formatNumberWithOptions(numeric, { maximumFractionDigits: 2 })
    : String(value);
  return suffix ? `${formatted} ${suffix}` : formatted;
};

const formatValue = (item) => {
  if (!hasPopupValue(item.value)) return "-";
  if (item.format === "currency") {
    const numeric = Number(item.value);
    return Number.isFinite(numeric)
      ? formatCurrency(numeric)
      : String(item.value);
  }
  if (item.format === "area") return formatNumber(item.value, "m²");
  if (item.format === "coordinate") {
    const numeric = Number(item.value);
    return Number.isFinite(numeric)
      ? numeric.toLocaleString("id-ID", {
          useGrouping: false,
          maximumFractionDigits: 8,
        })
      : String(item.value);
  }
  if (item.format === "height") return formatNumber(item.value, "m");
  return String(item.value);
};

function DetailRow({ label, value, format, href = null }) {
  const formattedValue = formatValue({ value, format });

  return (
    <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3 border-b border-border/50 px-3 py-2.5 last:border-b-0">
      <dt className="text-[9px] font-bold uppercase tracking-wide text-text-muted">
        {label}
      </dt>
      <dd className="min-w-0 break-words text-right text-[11px] font-semibold leading-relaxed text-text-primary">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={
              label === "Google Maps"
                ? "Buka lokasi di Google Maps"
                : `Buka ${label}`
            }
            title="Buka lokasi di Google Maps"
            className="inline-flex items-center justify-end gap-1 text-sky-600 underline decoration-sky-400/50 underline-offset-2 transition-colors hover:text-blue-700 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
          >
            <span>{formattedValue}</span>
            <ArrowSquareOutIcon
              size={10}
              weight="bold"
              className="shrink-0"
            />
          </a>
        ) : (
          formattedValue
        )}
      </dd>
    </div>
  );
}

function AccordionSection({
  id,
  icon: Icon,
  title,
  summary,
  open,
  onToggle,
  children,
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface">
      <h4>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`popup-section-${id}`}
          className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
            <Icon size={12} weight="duotone" />
          </span>
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate text-[9px] font-black uppercase tracking-[0.08em] text-text-primary">
              {title}
            </span>
            {summary && (
              <span className="truncate text-[7px] font-semibold text-text-muted">
                {summary}
              </span>
            )}
          </span>
          <CaretDownIcon
            size={11}
            weight="bold"
            className={`shrink-0 text-text-muted transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </h4>
      <div
        id={`popup-section-${id}`}
        hidden={!open}
        className="border-t border-border bg-surface-secondary/35"
      >
        {children}
      </div>
    </section>
  );
}

function ModelDetails({ model, statusLabel }) {
  const rows = [
    { label: "Nama Bangunan", value: model.name },
    { label: "LOD", value: model.lod },
    {
      label: "Versi",
      value: hasPopupValue(model.version) ? `v${model.version}` : null,
    },
    { label: "Format", value: model.format },
    { label: "Tinggi", value: model.height, format: "height" },
    { label: "Jumlah Lantai", value: model.floors },
    { label: "CRS Sumber", value: model.sourceCrs },
  ].map((item) => ({
    ...item,
    value: hasPopupValue(item.value) ? item.value : "-",
  }));

  return (
    <>
      {model.recordAvailable && (
        <div className="border-b border-border/50 px-3 py-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[7px] font-black uppercase ${
              model.active
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
            }`}
          >
            <CheckCircleIcon size={10} weight="fill" />
            {statusLabel}
          </span>
        </div>
      )}
      <dl>
        {rows.map((item) => (
          <DetailRow
            key={item.label}
            {...item}
            value={
              item.format === "height"
                ? formatNumber(item.value, "m")
                : item.value
            }
          />
        ))}
      </dl>
    </>
  );
}

function SpatialDataGroup({ icon: Icon, title, summary, children }) {
  return (
    <div className="border-b border-border/50 last:border-b-0">
      <div className="flex items-center gap-2 bg-surface-secondary/65 px-3 py-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
          <Icon size={11} weight="duotone" />
        </span>
        <span className="text-[8px] font-black uppercase tracking-[0.08em] text-text-primary">
          {title}
        </span>
        {summary && (
          <span className="ml-auto text-[7px] font-semibold text-text-muted">
            {summary}
          </span>
        )}
      </div>
      {children}
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
  showModel3d = true,
  visibleSectionIds = null,
}) {
  const [openSections, setOpenSections] = useState(
    () => new Set(["general", "model3d"]),
  );

  if (!asset) return null;

  const popup = buildAssetPopupData(asset, model);
  const latitude = Number(
    popup.spatial.find((item) => item.label === "Latitude")?.value,
  );
  const longitude = Number(
    popup.spatial.find((item) => item.label === "Longitude")?.value,
  );
  const googleMapsUrl =
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${latitude},${longitude}`,
        )}`
      : null;
  const spatialRows = googleMapsUrl
    ? popup.spatial.flatMap((item) =>
        item.label === "Longitude"
          ? [
              item,
              {
                label: "Google Maps",
                value: "Buka lokasi",
                href: googleMapsUrl,
              },
            ]
          : [item],
      )
    : popup.spatial;
  const modelStatusLabel = popup.model.active
    ? "Ditampilkan di peta"
    : "Preview versi belum aktif";
  const isBuildingPopup = popup.context === "3d";
  const hasModelSection = showModel3d && isBuildingPopup;
  const sections = [
    {
      id: "general",
      icon: isBuildingPopup ? BuildingsIcon : InfoIcon,
      title: isBuildingPopup ? "Data Umum Bangunan" : "Data Umum Tanah",
      summary: `${popup.general.length} informasi`,
      visible: true,
    },
    {
      id: "model3d",
      icon: CubeIcon,
      title: "Data Model 3D",
      summary:
        [popup.model.lod, popup.model.format]
          .filter(hasPopupValue)
          .join(" · ") || "Belum lengkap",
      visible: hasModelSection,
    },
    {
      id: "land",
      icon: MapPinIcon,
      title: "Lokasi & Bidang Tanah",
      summary: popup.parcelCode || popup.assetCode || "Belum terhubung",
      visible: isBuildingPopup,
    },
    {
      id: "legal",
      icon: SealCheckIcon,
      title: "Data Legal & Pertanahan",
      summary: `${popup.legal.length} informasi`,
      visible: true,
    },
    {
      id: "physical",
      icon: RulerIcon,
      title: "Data Fisik",
      summary: `${popup.physical.length} informasi`,
      visible: true,
    },
    {
      id: "kib",
      icon: DatabaseIcon,
      title: "Data KIB",
      summary: `${popup.kib.length} informasi`,
      visible: true,
    },
    {
      id: "administrative",
      icon: FileTextIcon,
      title: "Data Administratif",
      summary: `${popup.administrative.length} informasi`,
      visible: true,
    },
    {
      id: "spatial",
      icon: MapTrifoldIcon,
      title: isBuildingPopup ? "Data Spasial Tanah" : "Data Spasial",
      summary: `${spatialRows.length} informasi`,
      visible: true,
    },
    {
      id: "tax",
      icon: ReceiptIcon,
      title: "Data Pajak",
      summary: `${popup.tax.length} informasi`,
      visible: true,
    },
  ].filter(
    (section) =>
      section.visible &&
      (!visibleSectionIds || visibleSectionIds.includes(section.id)),
  );
  const allExpanded =
    sections.length > 0 &&
    sections.every((section) => openSections.has(section.id));

  const toggleSection = (sectionId) => {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const toggleAll = () => {
    setOpenSections(
      allExpanded ? new Set() : new Set(sections.map((section) => section.id)),
    );
  };

  const stopHeaderAction = (event) => event.stopPropagation();

  return (
    <>
      <header
        {...headerProps}
        className={`bg-accent px-3.5 py-2 text-surface ${
          headerProps.className || ""
        } ${isDragging ? "cursor-grabbing" : preview ? "" : "cursor-grab"}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface/15">
              <BuildingsIcon size={15} weight="fill" />
            </span>
            <h3 className="min-w-0 flex-1 truncate font-mono text-sm font-black leading-tight">
              {popup.context === "3d"
                ? popup.catalogCode || popup.assetCode || "Tanpa kode"
                : popup.context === "2d"
                  ? popup.parcelCode || popup.assetCode || "Tanpa kode"
                  : popup.assetCode || popup.catalogCode || "Tanpa kode"}
            </h3>
          </div>
          <button
            type="button"
            onPointerDown={stopHeaderAction}
            onClick={toggleAll}
            aria-label={allExpanded ? "Tutup semua bagian" : "Buka semua bagian"}
            title={allExpanded ? "Tutup semua" : "Buka semua"}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface/10 text-surface/85 transition-colors hover:bg-surface/20 hover:text-surface focus-visible:ring-2 focus-visible:ring-surface/70"
          >
            {allExpanded ? (
              <ArrowsInSimpleIcon size={13} weight="bold" />
            ) : (
              <ArrowsOutSimpleIcon size={13} weight="bold" />
            )}
          </button>
          {onClose && (
            <button
              type="button"
              onPointerDown={stopHeaderAction}
              onClick={onClose}
              aria-label="Tutup detail aset"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-surface/80 transition-colors hover:bg-surface/15 hover:text-surface focus-visible:ring-2 focus-visible:ring-surface/70"
            >
              <XIcon size={15} weight="bold" />
            </button>
          )}
        </div>
      </header>

      <div className="space-y-2 p-3">
        {sections.map((section) => (
          <AccordionSection
            key={section.id}
            {...section}
            open={openSections.has(section.id)}
            onToggle={() => toggleSection(section.id)}
          >
            {section.id === "general" && (
              <>
                {popup.general.length > 0 && (
                  <dl>
                    {popup.general.map((item) => (
                      <DetailRow key={item.label} {...item} />
                    ))}
                  </dl>
                )}
                {!isBuildingPopup && (
                  <div className="flex items-start gap-2 border-t border-border/50 px-3 py-2.5">
                    <MapPinIcon
                      size={13}
                      className="mt-0.5 shrink-0 text-text-muted"
                    />
                    <div className="min-w-0">
                      <p className="text-[8px] font-black uppercase tracking-wide text-text-muted">
                        Lokasi
                      </p>
                      <p className="mt-1 text-[11px] font-semibold leading-relaxed text-text-secondary">
                        {popup.location || "-"}
                      </p>
                    </div>
                  </div>
                )}
                {!isBuildingPopup && (
                  <div className="flex items-start gap-2 border-t border-border/50 px-3 py-2.5">
                    <NoteIcon
                      size={13}
                      className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300"
                    />
                    <div className="min-w-0">
                      <p className="text-[8px] font-black uppercase tracking-wide text-text-muted">
                        Keterangan
                      </p>
                      <p className="mt-1 text-[10px] leading-relaxed text-text-secondary">
                        {popup.description || "-"}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
            {section.id === "model3d" && (
              <ModelDetails
                model={popup.model}
                statusLabel={modelStatusLabel}
              />
            )}
            {section.id === "land" && (
              <dl>
                {popup.landContext.map((item) => (
                  <DetailRow key={item.label} {...item} />
                ))}
              </dl>
            )}
            {section.id === "spatial" && (
              <SpatialDataGroup
                icon={MapPinIcon}
                title={isBuildingPopup ? "Data Bidang Tanah" : "Data Bidang"}
                summary={`${spatialRows.length} informasi`}
              >
                <dl>
                  {spatialRows.map((item) => (
                    <DetailRow key={item.label} {...item} />
                  ))}
                </dl>
              </SpatialDataGroup>
            )}
            {[
              "legal",
              "physical",
              "kib",
              "administrative",
              "tax",
            ].includes(section.id) && (
              <dl>
                {popup[section.id].map((item) => (
                  <DetailRow key={item.label} {...item} />
                ))}
              </dl>
            )}
          </AccordionSection>
        ))}

        {sections.length === 0 && (
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
