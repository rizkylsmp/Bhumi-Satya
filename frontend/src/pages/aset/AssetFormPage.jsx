import { useEffect, useState } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import toast from "react-hot-toast";
import AssetFormModal from "../../components/asset/AssetFormModal";
import { asetService, assetModel3dService } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";
import { hasPermission } from "../../utils/permissions";
import {
  ArrowLeftIcon,
  CaretRightIcon,
  CircleNotchIcon,
  ClipboardTextIcon,
  CurrencyDollarIcon,
  IdentificationCardIcon,
  MapPinIcon,
  ReceiptIcon,
  ScalesIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";

const substansiRoutes = {
  legal: "/aset/legal",
  fisik: "/aset/fisik",
  administratif: "/aset/administratif",
  kib: "/aset/kib",
  pajak: "/aset/pajak",
  spasial: "/aset/spasial",
};

const normalizeSubstansi = (value) => (
  Object.hasOwn(substansiRoutes, value) ? value : null
);

const formSections = [
  { id: "identitas", label: "Identitas", icon: ClipboardTextIcon },
  { id: "legal", label: "Legal", icon: ScalesIcon },
  { id: "fisik", label: "Fisik", icon: MapPinIcon },
  { id: "kib", label: "KIB", icon: IdentificationCardIcon },
  { id: "pajak", label: "Pajak", icon: ReceiptIcon },
  { id: "spasial", label: "Spasial", icon: MapPinIcon },
  { id: "administratif", label: "Administratif", icon: CurrencyDollarIcon },
];

const asset3dManagementFields = [
  "_model_3d_file",
  "building_footprint",
  "building_height_m",
  "building_base_elevation_m",
  "building_floors",
  "building_height_source",
  "building_height_quality",
  "model_3d_lod",
  "model_3d_source_crs",
  "model_3d_recorded_at",
  "model_3d_accuracy_m",
];

export default function AssetFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const userRole = useAuthStore((state) => state.user?.role || "");
  const isEdit = Boolean(id);
  const isManage = isEdit && location.pathname.endsWith("/kelola");
  const activeSubstansi = isEdit
    ? normalizeSubstansi(searchParams.get("bagian"))
    : null;
  const returnPath = activeSubstansi
    ? substansiRoutes[activeSubstansi]
    : substansiRoutes[normalizeSubstansi(searchParams.get("kembali"))] || "/aset";
  const canSubmit = hasPermission(
    userRole,
    "aset",
    isEdit ? "update" : "create",
  );

  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFormSection, setActiveFormSection] = useState(
    activeSubstansi || formSections[0].id,
  );

  useEffect(() => {
    if (!isEdit) return undefined;
    let active = true;
    setLoading(true);
    setLoadError("");
    asetService.getById(id)
      .then((response) => {
        if (active) setAsset(response.data?.data || null);
      })
      .catch((error) => {
        if (!active) return;
        console.error("Error fetching asset form data:", error);
        setLoadError(error.response?.data?.error || "Gagal memuat data aset");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, isEdit]);

  if (!canSubmit) return <Navigate to={returnPath} replace />;

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    let assetWasSaved = false;
    try {
      const assetPayload = { ...formData };
      asset3dManagementFields.forEach((field) => delete assetPayload[field]);
      const model3dFile = null;
      const response = isEdit
        ? await asetService.update(id, assetPayload)
        : await asetService.create(assetPayload);
      assetWasSaved = true;
      const assetId = id || response.data?.data?.id_aset;
      const modelResponse = model3dFile
        ? await assetModel3dService.upload(assetId, model3dFile)
        : null;
      let conversionError = null;
      if (modelResponse) {
        try {
          await assetModel3dService.convert(
            assetId,
            modelResponse.data.data.id_model_3d,
          );
        } catch (error) {
          conversionError = error.response?.data?.error || error.message;
        }
      }

      toast.success(
        model3dFile
          ? "Aset dan model 3D berhasil disimpan"
          : `Aset berhasil ${isEdit ? "diperbarui" : "ditambahkan"}`,
      );
      const locationWarning = modelResponse?.data?.data?.manifest?.locationAssessment;
      if (locationWarning?.status === "warning") {
        toast(locationWarning.message, { icon: "⚠️", duration: 6000 });
      }
      if (conversionError) {
        toast(`Model tersimpan, tetapi konversi GLB gagal: ${conversionError}`, {
          icon: "⚠️",
          duration: 7000,
        });
      }
      navigate(returnPath, { replace: true });
    } catch (error) {
      console.error("Error saving asset:", error);
      const errorMessage = error.response?.data?.error || "Gagal menyimpan aset";
      toast.error(
        assetWasSaved
          ? `Aset tersimpan, tetapi model 3D gagal: ${errorMessage}`
          : errorMessage,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center p-6">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-4 text-sm font-semibold text-text-secondary shadow-sm">
          <CircleNotchIcon size={20} className="animate-spin text-accent" />
          Memuat data aset…
        </div>
      </div>
    );
  }

  if (isEdit && (loadError || !asset)) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-surface p-6 text-center shadow-sm dark:border-red-500/30">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
            <WarningCircleIcon size={24} weight="duotone" />
          </span>
          <h1 className="mt-4 text-lg font-black text-text-primary">Data aset tidak dapat dibuka</h1>
          <p className="mt-1 text-sm text-text-muted">{loadError || "Aset tidak ditemukan"}</p>
          <button
            type="button"
            onClick={() => navigate(returnPath)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-surface transition hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <ArrowLeftIcon size={17} weight="bold" />
            Kembali ke daftar
          </button>
        </div>
      </div>
    );
  }

  const visibleSections = activeSubstansi
    ? formSections.filter((section) => section.id === activeSubstansi)
    : formSections;
  const pageTitle = isEdit
    ? activeSubstansi
      ? `${isManage ? "Kelola" : "Edit"} Data ${
          visibleSections[0]?.label || "Aset"
        }`
      : "Edit Data Aset"
    : "Tambah Data Aset";

  const activeSectionIndex = Math.max(
    0,
    visibleSections.findIndex((section) => section.id === activeFormSection),
  );
  const handleSectionKeyDown = (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = activeSectionIndex;
    if (event.key === "ArrowRight") nextIndex = (activeSectionIndex + 1) % visibleSections.length;
    if (event.key === "ArrowLeft") nextIndex = (activeSectionIndex - 1 + visibleSections.length) % visibleSections.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = visibleSections.length - 1;
    const nextSection = visibleSections[nextIndex];
    setActiveFormSection(nextSection.id);
    window.requestAnimationFrame(() => document.getElementById(`form-tab-${nextSection.id}`)?.focus());
  };

  return (
    <div className="min-h-full bg-surface-secondary p-4 md:p-6">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-text-muted">
          <button type="button" onClick={() => navigate("/aset")} className="transition hover:text-accent">
            Kelola Aset
          </button>
          <CaretRightIcon size={12} />
          {returnPath !== "/aset" && (
            <>
              <button type="button" onClick={() => navigate(returnPath)} className="transition hover:text-accent">
                {visibleSections[0]?.label || "Data Aset"}
              </button>
              <CaretRightIcon size={12} />
            </>
          )}
          <span className="text-text-primary">
            {isManage ? "Kelola" : isEdit ? "Edit" : "Tambah"}
          </span>
        </nav>

        <header className="rounded-xl border border-border bg-surface p-3 shadow-sm md:p-4">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <ClipboardTextIcon size={20} weight="duotone" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-accent">
                  {isEdit ? asset?.kode_aset : "Registrasi aset baru"}
                </p>
                <h1 className="text-lg font-black text-text-primary md:text-xl">{pageTitle}</h1>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(returnPath)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs font-bold text-text-secondary transition hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ArrowLeftIcon size={16} weight="bold" />
              Kembali
            </button>
          </div>
        </header>

        {!activeSubstansi && (
          <nav aria-label="Navigasi bagian form" className="sticky top-0 z-20 overflow-x-auto rounded-xl border border-border bg-surface/95 p-2 backdrop-blur">
            <div
              role="tablist"
              aria-label="Bagian form aset"
              onKeyDown={handleSectionKeyDown}
              className="flex min-w-max items-center gap-1.5"
            >
              {visibleSections.map((section) => {
                const Icon = section.icon;
                const active = activeFormSection === section.id;
                return (
                  <button
                    type="button"
                    key={section.id}
                    id={`form-tab-${section.id}`}
                    role="tab"
                    aria-controls={section.id}
                    aria-selected={active}
                    tabIndex={active ? 0 : -1}
                    onClick={() => setActiveFormSection(section.id)}
                    className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-accent ${
                      active
                        ? "bg-accent text-surface"
                        : "text-text-secondary hover:bg-accent/10 hover:text-accent"
                    }`}
                  >
                    <Icon size={15} weight={active ? "fill" : "duotone"} />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        <div className="sr-only" aria-live="polite">
          {isEdit
            ? `${isManage ? "Mengelola" : "Mengedit"} aset ${
                asset?.kode_aset || id
              }`
            : "Menambahkan aset baru"}
        </div>
        {activeSubstansi && (
          <span id={`form-tab-${activeSubstansi}`} className="sr-only">
            {visibleSections[0]?.label}
          </span>
        )}
        <AssetFormModal
          isOpen
          presentation="page"
          onClose={() => navigate(returnPath)}
          onSubmit={handleSubmit}
          assetData={asset}
          isSubmitting={isSubmitting}
          activeSubstansi={activeSubstansi}
          activeSection={activeFormSection}
          onSectionChange={setActiveFormSection}
        />
      </div>
    </div>
  );
}
