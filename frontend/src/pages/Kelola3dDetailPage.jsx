import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import CesiumModelPreview from "../components/map/CesiumModelPreview";
import Model3dObjectsPanel from "../components/asset/Model3dObjectsPanel";
import { useConfirm } from "../components/ui/confirmContext";
import {
  aset3dCatalogService,
  asetService,
  assetModel3dService,
} from "../services/api";
import { useAuthStore } from "../stores/authStore";
import {
  getAsset3dSummary,
  HEIGHT_QUALITY_CONFIG,
} from "../utils/asset3dGeojson";
import { extractGeojsonPolygonPoints as parseGeojsonPolygonPoints } from "../utils/geojsonExport";
import { hasPermission } from "../utils/permissions";
import {
  ArrowLeftIcon,
  ArrowCounterClockwiseIcon,
  ArrowsClockwiseIcon,
  BuildingsIcon,
  CaretRightIcon,
  CheckCircleIcon,
  CrosshairIcon,
  CubeIcon,
  FileArrowUpIcon,
  FloppyDiskIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PlusIcon,
  StackIcon,
  TableIcon,
  TrashIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";

const DETAIL_SECTIONS = [
  {
    id: "data-model-3d",
    label: "Data Model",
    icon: BuildingsIcon,
  },
  {
    id: "detail-model-3d",
    label: "Detail Model",
    icon: CubeIcon,
  },
  {
    id: "verifikasi-model-3d",
    label: "Verifikasi",
    icon: CheckCircleIcon,
  },
  {
    id: "daftar-ruang-3d",
    label: "Daftar Ruang",
    icon: TableIcon,
  },
];

const TRANSFORM_KEYS = [
  "location_lat",
  "location_long",
  "altitude_m",
  "heading",
  "tilt",
  "roll",
  "scale_x",
  "scale_y",
  "scale_z",
  "offset_x_m",
  "offset_y_m",
  "offset_z_m",
];

const emptyRoom = () => ({
  id:
    globalThis.crypto?.randomUUID?.() || `ruang-${Date.now()}-${Math.random()}`,
  name: "",
  floor: "",
  area_m2: "",
  usage: "",
  unit_code: "",
  notes: "",
});

const errorMessage = (error, fallback) =>
  error?.response?.data?.error || error?.response?.data?.message || fallback;

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const metadataFromModel = (model) => ({
  display_name: model?.manifest?.display_name || "",
  description: model?.manifest?.description || "",
  location_lat: model?.location_lat ?? "",
  location_long: model?.location_long ?? "",
  altitude_m: model?.altitude_m ?? "",
  heading: model?.heading ?? "",
  tilt: model?.tilt ?? "",
  roll: model?.roll ?? "",
  scale_x: model?.scale_x ?? 1,
  scale_y: model?.scale_y ?? 1,
  scale_z: model?.scale_z ?? 1,
  offset_x_m: model?.offset_x_m ?? 0,
  offset_y_m: model?.offset_y_m ?? 0,
  offset_z_m: model?.offset_z_m ?? 0,
  source_data_type: model?.source_data_type ?? "",
  source_crs: model?.source_crs ?? "",
  source_unit: model?.source_unit ?? "m",
  source_origin_x: model?.source_origin_x ?? "",
  source_origin_y: model?.source_origin_y ?? "",
  source_origin_z: model?.source_origin_z ?? "",
  expires_at: model?.expires_at ? String(model.expires_at).slice(0, 10) : "",
  quality_checklist: {
    source_documented: model?.quality_checklist?.source_documented === true,
    crs_confirmed: model?.quality_checklist?.crs_confirmed === true,
    origin_confirmed: model?.quality_checklist?.origin_confirmed === true,
    unit_confirmed: model?.quality_checklist?.unit_confirmed === true,
    geometry_checked: model?.quality_checklist?.geometry_checked === true,
    attributes_matched: model?.quality_checklist?.attributes_matched === true,
  },
});

const asset3dMetadataFromAsset = (asset) => ({
  building_height_m: asset?.building_height_m ?? "",
  building_floors: asset?.building_floors ?? "",
  building_base_elevation_m: asset?.building_base_elevation_m ?? "",
  building_height_source: asset?.building_height_source ?? "",
  building_height_quality: asset?.building_height_quality ?? "",
  model_3d_lod: asset?.model_3d_lod ?? "",
  model_3d_source_crs: asset?.model_3d_source_crs ?? "",
  model_3d_recorded_at: asset?.model_3d_recorded_at
    ? String(asset.model_3d_recorded_at).slice(0, 10)
    : "",
  model_3d_accuracy_m: asset?.model_3d_accuracy_m ?? "",
});

const statusConfig = (model) => {
  if (model?.archived_at || model?.status === "archived") {
    return {
      label: "Diarsipkan",
      className:
        "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    };
  }
  if (model?.conversion_status === "ready") {
    return {
      label: "Siap ditampilkan",
      className:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    };
  }
  if (model?.conversion_status === "processing") {
    return {
      label: "Sedang dikonversi",
      className: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    };
  }
  if (model?.conversion_status === "failed") {
    return {
      label: "Konversi gagal",
      className: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    };
  }
  return {
    label: "Antrean konversi",
    className:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  };
};

const reviewStatusConfig = (status) => ({
  draft: { label: "Draf", className: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" },
  processing: { label: "Diproses", className: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" },
  needs_review: { label: "Perlu Verifikasi", className: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  verified: { label: "Terverifikasi", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  rejected: { label: "Ditolak", className: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300" },
  active: { label: "Aktif", className: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" },
  expired: { label: "Kedaluwarsa", className: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300" },
}[status] || { label: "Belum Dinilai", className: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" });

function SectionTitle({ icon, title, description, action }) {
  const Icon = icon;
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3.5">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Icon size={18} weight="duotone" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-black text-text-primary">{title}</h2>
          <p className="mt-0.5 text-[10px] leading-relaxed text-text-muted">
            {description}
          </p>
        </div>
      </div>
      {action}
    </div>
  );
}

function TransformSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  disabled,
  onChange,
}) {
  const numericValue = Number(value);
  const sliderValue = Number.isFinite(numericValue)
    ? Math.min(max, Math.max(min, numericValue))
    : 0;

  return (
    <label className="block rounded-lg border border-border bg-surface p-2.5">
      <span className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[8px] font-extrabold uppercase tracking-wide text-text-muted">
          {label}
        </span>
        <span className="text-[8px] font-bold text-violet-600 dark:text-violet-300">
          {Number.isFinite(numericValue) ? numericValue : 0}
          {unit}
        </span>
      </span>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={sliderValue}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="h-2 min-w-0 flex-1 cursor-pointer accent-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`${label} slider`}
        />
        <input
          type="number"
          step={step}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-20 rounded-md border border-border bg-surface-secondary px-2 text-right text-[9px] font-bold text-text-primary outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={`${label} angka`}
        />
      </div>
      <span className="mt-1.5 flex justify-between text-[7px] font-semibold text-text-muted">
        <span>{min}</span>
        <span>{max}</span>
      </span>
    </label>
  );
}

export default function Kelola3dDetailPage() {
  const { kode3d } = useParams();
  const navigate = useNavigate();
  const userRole = useAuthStore((state) => state.user?.role || "");
  const canUpdate = hasPermission(userRole, "kelola3d", "update");
  const canDelete = hasPermission(userRole, "aset", "delete");
  const fileInputRef = useRef(null);
  const footprintInputRef = useRef(null);
  const confirm = useConfirm();

  const [catalog, setCatalog] = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [metadata, setMetadata] = useState(() => metadataFromModel(null));
  const [asset3dMetadata, setAsset3dMetadata] = useState(() =>
    asset3dMetadataFromAsset(null),
  );
  const [importLod, setImportLod] = useState("LOD1");
  const [uploading, setUploading] = useState(false);
  const [savingFootprint, setSavingFootprint] = useState(false);
  const [savingAsset3dMetadata, setSavingAsset3dMetadata] = useState(false);
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [savingRooms, setSavingRooms] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [reviewDraft, setReviewDraft] = useState({ review_status: "draft", review_notes: "" });
  const [convertingModelId, setConvertingModelId] = useState(null);
  const [deletingModelId, setDeletingModelId] = useState(null);
  const [restoringModelId, setRestoringModelId] = useState(null);
  const [removingArchivedModelId, setRemovingArchivedModelId] = useState(null);
  const [deletingCatalog, setDeletingCatalog] = useState(false);
  const [previewRevision, setPreviewRevision] = useState(0);
  const [flyToRequest, setFlyToRequest] = useState(null);
  const [previewModelStatus, setPreviewModelStatus] = useState({
    state: "idle",
    loaded: 0,
    total: 0,
    failed: 0,
  });
  const [activePreviewTab, setActivePreviewTab] = useState("map");
  const [activePageSection, setActivePageSection] = useState(
    DETAIL_SECTIONS[0].id,
  );

  const selectedAsset = catalog?.asset || null;
  const selectedAssetId = selectedAsset?.id_aset || null;
  const asset3dSummary = useMemo(
    () => getAsset3dSummary(selectedAsset || {}),
    [selectedAsset],
  );
  const activeModels = useMemo(
    () =>
      models.filter(
        (model) => !model.archived_at && model.status !== "archived",
      ),
    [models],
  );
  const archivedModels = useMemo(
    () =>
      models.filter(
        (model) => model.archived_at || model.status === "archived",
      ),
    [models],
  );
  const selectedModel = useMemo(
    () =>
      activeModels.find(
        (model) => String(model.id_model_3d) === String(selectedModelId),
      ) ||
      activeModels.find((model) => model.is_active) ||
      activeModels[0] ||
      null,
    [activeModels, selectedModelId],
  );
  const verificationRequirements = useMemo(
    () => [
      {
        key: "conversion",
        label: "Konversi model selesai",
        ready:
          selectedModel?.conversion_status === "ready" &&
          Boolean(selectedModel?.converted_public_url),
      },
      {
        key: "source",
        label: "Jenis sumber terisi",
        ready: Boolean(String(metadata.source_data_type || "").trim()),
      },
      {
        key: "crs",
        label: "CRS sumber terisi",
        ready: Boolean(String(metadata.source_crs || "").trim()),
      },
      {
        key: "source_documented",
        label: "Dokumen sumber diperiksa",
        ready: metadata.quality_checklist.source_documented === true,
      },
      {
        key: "crs_confirmed",
        label: "CRS dikonfirmasi",
        ready: metadata.quality_checklist.crs_confirmed === true,
      },
      {
        key: "origin_confirmed",
        label: "Titik origin dikonfirmasi",
        ready: metadata.quality_checklist.origin_confirmed === true,
      },
      {
        key: "unit_confirmed",
        label: "Satuan dikonfirmasi",
        ready: metadata.quality_checklist.unit_confirmed === true,
      },
      {
        key: "geometry_checked",
        label: "Geometri diperiksa",
        ready: metadata.quality_checklist.geometry_checked === true,
      },
    ],
    [metadata, selectedModel],
  );
  const missingVerificationRequirements = useMemo(
    () => verificationRequirements.filter((item) => !item.ready),
    [verificationRequirements],
  );
  const verificationReady = missingVerificationRequirements.length === 0;

  const switchSection = (sectionId) => {
    setActivePageSection(sectionId);
    window.requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: "auto",
        block: "start",
      });
    });
  };

  const openModelSourceValidation = () => {
    setActivePageSection("detail-model-3d");
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById("model-source-validation")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  };

  const handlePageSectionKeyDown = (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = DETAIL_SECTIONS.findIndex(
      ({ id }) => id === activePageSection,
    );
    let nextIndex = currentIndex < 0 ? 0 : currentIndex;
    if (event.key === "ArrowRight")
      nextIndex = (nextIndex + 1) % DETAIL_SECTIONS.length;
    if (event.key === "ArrowLeft")
      nextIndex =
        (nextIndex - 1 + DETAIL_SECTIONS.length) % DETAIL_SECTIONS.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = DETAIL_SECTIONS.length - 1;
    const nextSection = DETAIL_SECTIONS[nextIndex];
    switchSection(nextSection.id);
    window.requestAnimationFrame(() =>
      document.getElementById(`detail-nav-${nextSection.id}`)?.focus(),
    );
  };

  const fetchCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const response = await aset3dCatalogService.getByCode(kode3d);
      setCatalog(response.data?.data || null);
    } catch (error) {
      toast.error(errorMessage(error, "Gagal memuat detail aset Kelola 3D"));
      setCatalog(null);
    } finally {
      setCatalogLoading(false);
    }
  }, [kode3d]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  // Compatibility values for the legacy selector markup kept hidden below.
  // Asset selection now lives exclusively on the catalog page.
  const assets = selectedAsset ? [selectedAsset] : [];
  const assetSearch = "";
  const setAssetSearch = () => {};
  const assetsLoading = catalogLoading;
  const fetchAssets = fetchCatalog;
  const setSelectedAssetId = () => {};

  const fetchModels = useCallback(async (assetId, preferredModelId = null) => {
    if (!assetId) {
      setModels([]);
      setSelectedModelId(null);
      return;
    }
    setModelsLoading(true);
    try {
      const response = await assetModel3dService.list(assetId);
      const nextModels = response.data?.data || [];
      setModels(nextModels);
      const available = nextModels.filter(
        (model) => !model.archived_at && model.status !== "archived",
      );
      const preferred = available.find(
        (model) => String(model.id_model_3d) === String(preferredModelId),
      );
      const nextSelected =
        preferred ||
        available.find((model) => model.is_active) ||
        available[0] ||
        null;
      setSelectedModelId(nextSelected?.id_model_3d || null);
      setPreviewRevision((value) => value + 1);
    } catch (error) {
      toast.error(errorMessage(error, "Gagal memuat katalog model 3D"));
      setModels([]);
      setSelectedModelId(null);
    } finally {
      setModelsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels(selectedAssetId);
  }, [selectedAssetId, fetchModels]);

  useEffect(() => {
    setAsset3dMetadata(asset3dMetadataFromAsset(selectedAsset));
    setImportLod(selectedAsset?.model_3d_lod || "LOD1");
  }, [selectedAsset]);

  useEffect(() => {
    const modelRooms = selectedModel?.manifest?.rooms;
    setMetadata(metadataFromModel(selectedModel));
    setReviewDraft({
      review_status: selectedModel?.review_status || "draft",
      review_notes: selectedModel?.review_notes || "",
    });
    setRooms(
      Array.isArray(modelRooms)
        ? modelRooms.map((room) => ({
            id: room.id || emptyRoom().id,
            name: room.name || room.nama || "",
            floor: room.floor || room.lantai || "",
            area_m2: room.area_m2 ?? room.area ?? room.luas ?? "",
            usage: room.usage || room.penggunaan || "",
            unit_code: room.unit_code || room.kode_unit || "",
            notes: room.notes || room.catatan || "",
          }))
        : [],
    );
  }, [selectedModel]);

  const handleUpload = async (file) => {
    if (!file || !selectedAssetId || !canUpdate) return;
    if (!importLod) {
      toast.error("Pilih Level of Detail sebelum mengimpor model");
      return;
    }
    if (!/\.(kmz|glb|zip)$/i.test(file.name)) {
      toast.error("File model harus berformat KMZ, GLB, atau ZIP 3D Tiles");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Ukuran model maksimal 100 MB");
      return;
    }

    setUploading(true);
    try {
      const uploadResponse = await assetModel3dService.upload(
        selectedAssetId,
        file,
      );
      const uploadedModel = uploadResponse.data?.data;
      if (uploadedModel?.id_model_3d) {
        const conversionResponse = await assetModel3dService.convert(
          selectedAssetId,
          uploadedModel.id_model_3d,
        );
        toast.success(
          conversionResponse.data?.message || "Model 3D siap ditampilkan",
        );
      } else {
        toast.success(
          uploadResponse.data?.message || "Model 3D berhasil diunggah",
        );
      }
      await asetService.update(selectedAssetId, {
        model_3d_lod: importLod,
      });
      setAsset3dMetadata((current) => ({
        ...current,
        model_3d_lod: importLod,
      }));
      await fetchModels(selectedAssetId, uploadedModel?.id_model_3d);
      await fetchCatalog();
      setFlyToRequest({
        assetId: selectedAssetId,
        token: `${selectedAssetId}-${uploadedModel?.id_model_3d || "model"}-${Date.now()}`,
      });
    } catch (error) {
      toast.error(errorMessage(error, "Gagal mengunggah model 3D"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleBuildingFootprintImport = async (file) => {
    if (!file || !selectedAssetId || !canUpdate) return;

    setSavingFootprint(true);
    try {
      const footprint = parseGeojsonPolygonPoints(await file.text());
      if (!footprint) {
        toast.error("File tidak memiliki polygon tapak bangunan yang valid");
        return;
      }
      const response = await asetService.update(selectedAssetId, {
        building_footprint: footprint,
      });
      toast.success(
        response.data?.message || "Tapak bangunan berhasil disimpan",
      );
      await fetchCatalog();
      setPreviewRevision((value) => value + 1);
    } catch (error) {
      toast.error(errorMessage(error, "Gagal menyimpan tapak bangunan"));
    } finally {
      setSavingFootprint(false);
      if (footprintInputRef.current) footprintInputRef.current.value = "";
    }
  };

  const handleConvert = async (modelId) => {
    setConvertingModelId(modelId);
    try {
      const response = await assetModel3dService.convert(
        selectedAssetId,
        modelId,
      );
      toast.success(response.data?.message || "Model GLB siap ditampilkan");
      await fetchModels(selectedAssetId, modelId);
      setFlyToRequest({
        assetId: selectedAssetId,
        token: `${selectedAssetId}-${modelId}-${Date.now()}`,
      });
    } catch (error) {
      toast.error(errorMessage(error, "Gagal memulai konversi model"));
    } finally {
      setConvertingModelId(null);
    }
  };

  const handleActivate = async (modelId) => {
    try {
      await assetModel3dService.activate(selectedAssetId, modelId);
      toast.success("Versi model 3D berhasil diaktifkan");
      await fetchModels(selectedAssetId, modelId);
    } catch (error) {
      toast.error(errorMessage(error, "Gagal mengaktifkan model"));
    }
  };

  const saveReview = async () => {
    if (!selectedModel || !selectedAssetId || !canUpdate) return;
    if (
      reviewDraft.review_status === "rejected" &&
      !reviewDraft.review_notes.trim()
    ) {
      toast.error("Tuliskan alasan perbaikan sebelum menolak model");
      return;
    }
    if (reviewDraft.review_status === "verified" && !verificationReady) {
      toast.error(
        `Lengkapi ${missingVerificationRequirements.length} pemeriksaan sebelum memverifikasi model`,
      );
      return;
    }
    setSavingReview(true);
    try {
      if (["needs_review", "verified"].includes(reviewDraft.review_status)) {
        await assetModel3dService.update(
          selectedAssetId,
          selectedModel.id_model_3d,
          metadata,
        );
      }
      const response = await assetModel3dService.review(
        selectedAssetId,
        selectedModel.id_model_3d,
        reviewDraft,
      );
      toast.success(response.data?.message || "Status verifikasi berhasil disimpan");
      await fetchModels(selectedAssetId, selectedModel.id_model_3d);
    } catch (error) {
      toast.error(errorMessage(error, "Gagal menyimpan status verifikasi"));
    } finally {
      setSavingReview(false);
    }
  };

  const saveMetadata = async () => {
    if (!selectedModel || !canUpdate) return;

    setSavingMetadata(true);
    try {
      const response = await assetModel3dService.update(
        selectedAssetId,
        selectedModel.id_model_3d,
        metadata,
      );
      toast.success(
        response.data?.message || "Metadata model 3D berhasil disimpan",
      );
      await fetchModels(selectedAssetId, selectedModel.id_model_3d);
    } catch (error) {
      toast.error(errorMessage(error, "Gagal menyimpan metadata model 3D"));
    } finally {
      setSavingMetadata(false);
    }
  };

  const saveAsset3dMetadata = async () => {
    if (!selectedAssetId || !canUpdate) return;

    setSavingAsset3dMetadata(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(asset3dMetadata).map(([key, value]) => [
          key,
          value === "" ? null : value,
        ]),
      );
      const response = await asetService.update(selectedAssetId, payload);
      toast.success(
        response.data?.message || "LOD dan metadata bangunan berhasil disimpan",
      );
      await fetchCatalog();
      setPreviewRevision((value) => value + 1);
    } catch (error) {
      toast.error(
        errorMessage(error, "Gagal menyimpan LOD dan metadata bangunan"),
      );
    } finally {
      setSavingAsset3dMetadata(false);
    }
  };

  const handleArchive = async (model) => {
    if (!canUpdate) return;
    const modelName =
      model.manifest?.display_name ||
      model.original_name ||
      `versi ${model.version}`;
    const confirmed = await confirm({
      title: "Arsipkan Model 3D",
      message: `Model "${modelName}" akan dihapus dari katalog aktif. Riwayat dan audit tetap tersimpan.`,
      confirmText: "Arsipkan",
      type: "danger",
    });
    if (!confirmed) return;

    setDeletingModelId(model.id_model_3d);
    try {
      const response = await assetModel3dService.archive(
        selectedAssetId,
        model.id_model_3d,
      );
      toast.success(response.data?.message || "Model 3D berhasil diarsipkan");
      await fetchModels(selectedAssetId, response.data?.activated_model_id);
    } catch (error) {
      toast.error(errorMessage(error, "Gagal mengarsipkan model 3D"));
    } finally {
      setDeletingModelId(null);
    }
  };

  const handleRestore = async (model) => {
    if (!canUpdate) return;
    const modelName =
      model.manifest?.display_name ||
      model.original_name ||
      `versi ${model.version}`;
    const confirmed = await confirm({
      title: "Pulihkan Model 3D?",
      message: `Model "${modelName}" akan dikembalikan ke daftar versi aktif. File, metadata, dan daftar ruang tetap dipertahankan.`,
      confirmText: "Pulihkan",
      type: "info",
    });
    if (!confirmed) return;

    setRestoringModelId(model.id_model_3d);
    try {
      const response = await assetModel3dService.restore(
        selectedAssetId,
        model.id_model_3d,
      );
      toast.success(response.data?.message || "Model 3D berhasil dipulihkan");
      await fetchModels(selectedAssetId, model.id_model_3d);
    } catch (error) {
      toast.error(errorMessage(error, "Gagal memulihkan model 3D"));
    } finally {
      setRestoringModelId(null);
    }
  };

  const handleRemoveArchived = async (model) => {
    if (!canDelete) return;
    const modelName =
      model.manifest?.display_name ||
      model.original_name ||
      `versi ${model.version}`;
    const confirmed = await confirm({
      title: "Hapus Permanen Model 3D?",
      message: `Model "${modelName}" akan dihapus permanen beserta file sumber, GLB, dan LOD terkait. Tindakan ini tidak dapat dibatalkan.`,
      confirmText: "Hapus Permanen",
      type: "danger",
    });
    if (!confirmed) return;

    setRemovingArchivedModelId(model.id_model_3d);
    try {
      const response = await assetModel3dService.removeArchived(
        selectedAssetId,
        model.id_model_3d,
      );
      toast.success(
        response.data?.message || "Model arsip berhasil dihapus permanen",
      );
      await fetchModels(selectedAssetId);
    } catch (error) {
      toast.error(errorMessage(error, "Gagal menghapus permanen model arsip"));
    } finally {
      setRemovingArchivedModelId(null);
    }
  };

  const handleDeleteCatalog = async () => {
    if (!catalog || !canUpdate) return;
    const confirmed = await confirm({
      title: "Hapus Aset 3D?",
      message:
        activeModels.length > 0
          ? `${catalog.kode_3d} akan dihapus dari Kelola 3D dan ${activeModels.length} versi model akan diarsipkan. Data aset di Pusat Data tetap tersimpan.`
          : `${catalog.kode_3d} akan dihapus dari Kelola 3D. Data aset di Pusat Data tetap tersimpan.`,
      confirmText: "Hapus Aset 3D",
      type: "danger",
    });
    if (!confirmed) return;

    setDeletingCatalog(true);
    try {
      const response = await aset3dCatalogService.remove(catalog.kode_3d);
      toast.success(response.data?.message || "Aset 3D berhasil dihapus");
      navigate("/kelola-3d", { replace: true });
    } catch (error) {
      toast.error(errorMessage(error, "Gagal menghapus aset 3D"));
      setDeletingCatalog(false);
    }
  };

  const updateRoom = (roomId, field, value) => {
    setRooms((current) =>
      current.map((room) =>
        room.id === roomId ? { ...room, [field]: value } : room,
      ),
    );
  };

  const saveRooms = async () => {
    if (!selectedModel || !canUpdate) return;
    if (rooms.some((room) => !room.name.trim())) {
      toast.error("Nama setiap ruang wajib diisi");
      return;
    }

    setSavingRooms(true);
    try {
      const payload = rooms.map((room) => ({
        ...room,
        area_m2: room.area_m2 === "" ? null : Number(room.area_m2),
      }));
      const response = await assetModel3dService.updateRooms(
        selectedAssetId,
        selectedModel.id_model_3d,
        payload,
      );
      toast.success(response.data?.message || "Daftar ruang berhasil disimpan");
      await fetchModels(selectedAssetId, selectedModel.id_model_3d);
    } catch (error) {
      toast.error(errorMessage(error, "Gagal menyimpan daftar ruang"));
    } finally {
      setSavingRooms(false);
    }
  };

  // The detail page may preview a converted version before it is verified and
  // activated. Preserve its real conversion status so the viewer loads the
  // generated GLB instead of falling back to the original KMZ.
  const previewModel = useMemo(
    () =>
      selectedModel
        ? {
            ...selectedModel,
            ...Object.fromEntries(
              TRANSFORM_KEYS.map((key) => [key, metadata[key]]),
            ),
          }
        : null,
    [metadata, selectedModel],
  );
  const hasUnsavedTransformChanges = useMemo(
    () =>
      Boolean(
        selectedModel &&
          TRANSFORM_KEYS.some(
            (key) =>
              Number(metadata[key] ?? 0) !== Number(selectedModel[key] ?? 0),
          ),
      ),
    [metadata, selectedModel],
  );
  const hasUnsavedMetadataChanges = useMemo(
    () =>
      Boolean(
        selectedModel &&
          JSON.stringify(metadata) !==
            JSON.stringify(metadataFromModel(selectedModel)),
      ),
    [metadata, selectedModel],
  );
  const handleSelectModel = async (modelId) => {
    if (String(modelId) === String(selectedModel?.id_model_3d)) return;
    if (hasUnsavedMetadataChanges) {
      const approved = await confirm({
        title: "Ganti Versi Model?",
        message:
          "Perubahan Detail Model belum disimpan. Jika versi diganti sekarang, perubahan tersebut akan dibatalkan.",
        confirmText: "Ganti Versi",
        type: "warning",
      });
      if (!approved) return;
    }
    setSelectedModelId(modelId);
    setPreviewRevision((value) => value + 1);
  };
  const discardMetadataChanges = () => {
    setMetadata(metadataFromModel(selectedModel));
  };
  const previewAsset = useMemo(
    () =>
      selectedAsset
        ? { ...selectedAsset, active_model_3d: previewModel }
        : null,
    [previewModel, selectedAsset],
  );

  return (
    <div className="min-h-full bg-surface-secondary p-4 md:p-6">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-text-muted"
        >
          <button
            type="button"
            onClick={() => navigate("/kelola-3d")}
            className="transition hover:text-accent"
          >
            Kelola 3D
          </button>
          <CaretRightIcon size={12} />
          <span className="text-text-primary">Detail</span>
        </nav>

        <header className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/kelola-3d")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-secondary text-text-secondary transition hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Kembali ke daftar Kelola 3D"
              >
                <ArrowLeftIcon size={16} weight="bold" />
              </button>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
                <CubeIcon size={20} weight="duotone" />
              </span>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-accent">
                  Detail Kelola 3D
                </p>
                <h1 className="mt-0.5 truncate text-lg font-black text-text-primary md:text-xl">
                  {catalogLoading
                    ? "Memuat aset…"
                    : selectedAsset?.nama_aset || "Aset tidak ditemukan"}
                </h1>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {[
                  { label: "Kode 3D", value: catalog?.kode_3d || "—" },
                  { label: "Versi model", value: activeModels.length },
                  { label: "Diarsipkan", value: archivedModels.length },
                  { label: "Daftar ruang", value: rooms.length },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="min-w-20 rounded-lg border border-border bg-surface-secondary px-2.5 py-1.5 text-center"
                  >
                    <p className="truncate text-xs font-black leading-none text-text-primary">
                      {item.value}
                    </p>
                    <p className="mt-1 text-[7px] font-bold uppercase tracking-wide text-text-muted">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
              {canUpdate && catalog && (
                <button
                  type="button"
                  disabled={deletingCatalog}
                  onClick={handleDeleteCatalog}
                  className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 text-[8px] font-black text-red-700 transition hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-wait disabled:opacity-60 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/15"
                >
                  {deletingCatalog ? (
                    <ArrowsClockwiseIcon size={12} className="animate-spin" />
                  ) : (
                    <TrashIcon size={12} weight="bold" />
                  )}
                  {deletingCatalog ? "Menghapus aset 3D…" : "Hapus Aset 3D"}
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="space-y-5">
          <section className="hidden" aria-hidden="true">
            <SectionTitle
              icon={StackIcon}
              title="Pilih Aset untuk Dikelola"
              description="Mulai dari kode aset yang tersinkron dari Pusat Data Aset"
              action={
                <button
                  type="button"
                  onClick={() => fetchAssets(assetSearch)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-secondary hover:text-accent focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label="Sinkronkan ulang aset"
                >
                  <ArrowsClockwiseIcon
                    size={16}
                    weight="bold"
                    className={assetsLoading ? "animate-spin" : ""}
                  />
                </button>
              }
            />
            <div className="grid gap-4 p-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
              <div className="rounded-2xl bg-surface-secondary/70 p-4">
                <span className="inline-flex rounded-full bg-accent/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-accent">
                  Langkah 1
                </span>
                <h2 className="mt-3 text-sm font-black text-text-primary">
                  Temukan kode aset
                </h2>
                <p className="mt-1 text-[10px] leading-relaxed text-text-muted">
                  Cari berdasarkan kode, nama, atau lokasi. Pilihan aset
                  menentukan model, daftar ruang, dan preview yang ditampilkan.
                </p>
                <label className="relative mt-4 block">
                  <span className="sr-only">Cari kode atau nama aset</span>
                  <MagnifyingGlassIcon
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="search"
                    value={assetSearch}
                    onChange={(event) => setAssetSearch(event.target.value)}
                    placeholder="Cari kode atau nama…"
                    className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-xs font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
                  />
                </label>
                <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2.5">
                  <span className="text-[9px] font-semibold text-text-muted">
                    Hasil tersinkron
                  </span>
                  <span className="text-xs font-black text-text-primary">
                    {assets.length} aset
                  </span>
                </div>
              </div>

              <div className="min-w-0">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black text-text-primary">
                      Daftar aset
                    </p>
                    <p className="mt-0.5 text-[9px] text-text-muted">
                      Pilih satu kartu untuk membuka area pengelolaan.
                    </p>
                  </div>
                  {selectedAsset && (
                    <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[8px] font-black text-emerald-700 sm:inline-flex dark:bg-emerald-500/10 dark:text-emerald-300">
                      <CheckCircleIcon size={12} weight="fill" /> 1 aset dipilih
                    </span>
                  )}
                </div>
                <div className="grid max-h-[22rem] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 dark:[color-scheme:dark]">
                  {assetsLoading ? (
                    [1, 2, 3, 4, 5, 6].map((item) => (
                      <div
                        key={item}
                        className="h-32 animate-pulse rounded-xl bg-surface-secondary"
                      />
                    ))
                  ) : assets.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-8 text-center sm:col-span-2 xl:col-span-3 2xl:col-span-4">
                      <BuildingsIcon
                        size={23}
                        className="mx-auto text-text-muted"
                      />
                      <p className="mt-2 text-[10px] font-bold text-text-secondary">
                        Aset tidak ditemukan
                      </p>
                    </div>
                  ) : (
                    assets.map((asset) => {
                      const assetId = asset.id_aset || asset.id;
                      const selected =
                        String(assetId) === String(selectedAssetId);
                      const has3d = Boolean(
                        asset.active_model_3d ||
                        asset.model_3d_lod ||
                        asset.building_footprint,
                      );
                      return (
                        <button
                          key={assetId}
                          type="button"
                          onClick={() => setSelectedAssetId(assetId)}
                          className={`group relative min-h-32 w-full rounded-xl border p-3.5 text-left transition-all focus-visible:ring-2 focus-visible:ring-accent ${
                            selected
                              ? "border-accent bg-accent/10 shadow-md shadow-accent/10"
                              : "border-border bg-surface hover:border-accent/40 hover:bg-accent/[0.03] hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${selected ? "bg-accent text-surface" : "bg-surface-secondary text-text-muted group-hover:text-accent"}`}
                            >
                              <BuildingsIcon
                                size={16}
                                weight={selected ? "fill" : "duotone"}
                              />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[11px] font-black text-text-primary">
                                {asset.kode_aset || "Tanpa kode aset"}
                              </span>
                              <span className="mt-0.5 block truncate text-[9px] font-semibold text-text-secondary">
                                {asset.nama_aset || "Nama aset belum diisi"}
                              </span>
                            </span>
                          </div>
                          <span className="mt-3 flex items-center gap-1 truncate text-[8px] text-text-muted">
                            <MapPinIcon size={10} />{" "}
                            {asset.lokasi ||
                              asset.desa_kelurahan ||
                              "Lokasi belum diisi"}
                          </span>
                          <span
                            className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[7px] font-black uppercase tracking-wide ${has3d ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300" : "bg-surface-secondary text-text-muted"}`}
                          >
                            <CubeIcon
                              size={10}
                              weight={has3d ? "fill" : "regular"}
                            />{" "}
                            {has3d ? "Data 3D tersedia" : "Belum ada data 3D"}
                          </span>
                          {selected && (
                            <CheckCircleIcon
                              size={17}
                              weight="fill"
                              className="absolute right-2.5 top-2.5 text-accent"
                            />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </section>

          {selectedAsset && (
            <div className="hidden" aria-hidden="true">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-surface shadow-sm">
                  <BuildingsIcon size={19} weight="fill" />
                </span>
                <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase tracking-[0.14em] text-accent">
                    Langkah 2 · Aset terpilih
                  </p>
                  <p className="mt-1 truncate text-sm font-black text-text-primary">
                    {selectedAsset.kode_aset || "Tanpa kode"} ·{" "}
                    {selectedAsset.nama_aset || "Nama aset belum diisi"}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[9px] text-text-muted">
                    <MapPinIcon size={11} />{" "}
                    {selectedAsset.lokasi ||
                      selectedAsset.desa_kelurahan ||
                      "Lokasi belum diisi"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssetId(null)}
                className="h-9 rounded-xl border border-border bg-surface px-3 text-[9px] font-extrabold text-text-secondary transition hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent"
              >
                Ganti aset
              </button>
            </div>
          )}

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(32rem,0.95fr)]">
            <div className="space-y-4">
              <nav
                aria-label="Navigasi Detail Kelola 3D"
                className="sticky top-0 z-20 overflow-x-auto rounded-xl border border-border bg-surface/95 p-2 shadow-sm backdrop-blur"
              >
                <div
                  role="tablist"
                  aria-label="Bagian pengelolaan model 3D"
                  onKeyDown={handlePageSectionKeyDown}
                  className="flex min-w-max items-center gap-1.5"
                >
                  {DETAIL_SECTIONS.map((section) => {
                    const Icon = section.icon;
                    const active = activePageSection === section.id;
                    return (
                      <button
                        type="button"
                        key={section.id}
                        id={`detail-nav-${section.id}`}
                        role="tab"
                        aria-selected={active}
                        aria-controls={section.id}
                        tabIndex={active ? 0 : -1}
                        onClick={() => switchSection(section.id)}
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

              <section
                id="data-model-3d"
                role="tabpanel"
                aria-labelledby="detail-nav-data-model-3d"
                hidden={activePageSection !== "data-model-3d"}
                className="animate-fade-in scroll-mt-20 overflow-hidden rounded-2xl border border-violet-200 bg-violet-50/60 shadow-sm dark:border-violet-500/30 dark:bg-violet-500/5"
              >
                <SectionTitle
                  icon={BuildingsIcon}
                  title="Data Bangunan 3D"
                  description={
                    selectedAsset
                      ? `${selectedAsset.kode_aset} · ${selectedAsset.nama_aset}`
                      : "Pilih aset terlebih dahulu"
                  }
                />
                <div className="p-4">
                  <div className="space-y-3">
                    <input
                      ref={footprintInputRef}
                      type="file"
                      accept=".geojson,.json,application/geo+json,application/json"
                      className="hidden"
                      onChange={(event) =>
                        handleBuildingFootprintImport(event.target.files?.[0])
                      }
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".kmz,.glb,.zip,application/vnd.google-earth.kmz,model/gltf-binary,application/zip,application/x-zip-compressed"
                      className="hidden"
                      onChange={(event) =>
                        handleUpload(event.target.files?.[0])
                      }
                    />
                    <div
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        handleUpload(event.dataTransfer.files?.[0]);
                      }}
                      className="rounded-xl border border-violet-200 bg-surface p-3 dark:border-violet-500/30"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                          <CubeIcon size={17} weight="duotone" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[10px] font-black text-text-primary">
                              {selectedModel
                                ? `Model v${selectedModel.version}`
                                : "Belum ada model"}
                            </p>
                            {selectedModel?.is_active && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[7px] font-black uppercase text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                Aktif
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-[8px] text-text-muted">
                            {selectedModel
                              ? `${activeModels.length} versi · ${selectedModel.model_type || "Model 3D"} · ${asset3dSummary.lod || "LOD belum diisi"}`
                              : "KMZ, GLB, atau ZIP 3D Tiles · maks. 100 MB"}
                          </p>
                        </div>
                        <label className="w-full sm:w-44">
                          <span className="sr-only">
                            Level of Detail model yang akan diimpor
                          </span>
                          <select
                            value={importLod}
                            disabled={!selectedAsset || !canUpdate || uploading}
                            onChange={(event) => setImportLod(event.target.value)}
                            className="h-9 w-full rounded-lg border border-border bg-surface-secondary px-2.5 text-[9px] font-extrabold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label="Pilih Level of Detail untuk model"
                          >
                            <option value="LOD1">LOD 1 · Block Model</option>
                            <option value="LOD2">LOD 2 · Roof Detail</option>
                            <option value="LOD2.5">LOD 2.5 · Facade Detail</option>
                            <option value="LOD3">LOD 3 · Detailed Facade</option>
                            <option value="LOD4">LOD 4 · Architectural Detail</option>
                            <option value="GAUSSIAN_SPLATTING">
                              Gaussian Splatting
                            </option>
                          </select>
                        </label>
                        <button
                          type="button"
                          disabled={
                            !selectedAsset || !canUpdate || uploading || !importLod
                          }
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3 text-[9px] font-extrabold text-white transition hover:bg-violet-700 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {uploading ? (
                            <ArrowsClockwiseIcon
                              size={13}
                              className="animate-spin"
                            />
                          ) : (
                            <FileArrowUpIcon size={13} weight="bold" />
                          )}
                          {uploading ? "Mengunggah…" : "Impor Model"}
                        </button>
                      </div>

                      <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-sm"
                          style={{
                            backgroundColor:
                              HEIGHT_QUALITY_CONFIG[asset3dSummary.quality]
                                ?.color || "#94a3b8",
                          }}
                        />
                        <p className="min-w-0 flex-1 text-[8px] font-semibold text-text-secondary">
                          Tapak bangunan:{" "}
                          <span className="text-text-primary">
                            {selectedAsset?.building_footprint
                              ? "tersedia"
                              : "belum tersedia"}
                          </span>
                        </p>
                        <button
                          type="button"
                          disabled={
                            !selectedAsset || !canUpdate || savingFootprint
                          }
                          onClick={() => footprintInputRef.current?.click()}
                          className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-secondary px-2.5 text-[8px] font-extrabold text-text-primary transition hover:border-accent/40 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {savingFootprint ? (
                            <ArrowsClockwiseIcon
                              size={11}
                              className="animate-spin"
                            />
                          ) : (
                            <FileArrowUpIcon size={11} weight="bold" />
                          )}
                          {savingFootprint ? "Menyimpan…" : "Impor GeoJSON"}
                        </button>
                      </div>
                    </div>
                    {!canUpdate && (
                      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[8px] font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                        Mode lihat saja. Perubahan memerlukan izin pembaruan
                        aset.
                      </p>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-violet-800 dark:text-violet-300">
                          Versi file model
                        </p>
                        {modelsLoading && (
                          <ArrowsClockwiseIcon
                            size={13}
                            className="animate-spin text-text-muted"
                          />
                        )}
                      </div>
                      {activeModels.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-violet-300 bg-surface/70 p-4 text-center text-[10px] text-text-muted dark:border-violet-500/30">
                          Belum ada file KMZ, GLB, atau ZIP 3D Tiles untuk aset ini.
                        </div>
                      ) : (
                        activeModels.map((model) => {
                          const selected =
                            String(model.id_model_3d) ===
                            String(selectedModel?.id_model_3d);
                          const status = statusConfig(model);
                          const reviewStatus = reviewStatusConfig(model.review_status);
                          return (
                            <article
                              key={model.id_model_3d}
                              className={`w-full rounded-xl border bg-surface p-3 transition ${selected ? "border-violet-400 shadow-sm shadow-violet-500/10 dark:border-violet-500/50" : "border-violet-200 hover:border-violet-400 dark:border-violet-500/25"}`}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleSelectModel(model.id_model_3d)
                                }
                                className="flex w-full items-center gap-2.5 text-left focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-violet-500"
                              >
                                <span
                                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${selected ? "bg-violet-600 text-white" : "bg-surface-secondary text-text-muted"}`}
                                >
                                  <CubeIcon size={17} weight="duotone" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-center gap-2">
                                    <span className="truncate text-[10px] font-black text-text-primary">
                                      v{model.version} ·{" "}
                                      {model.manifest?.display_name ||
                                        model.original_name}
                                    </span>
                                    {model.is_active && (
                                      <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[7px] font-black uppercase text-white">
                                        Aktif
                                      </span>
                                    )}
                                  </span>
                                  <span className="mt-1 flex flex-wrap items-center gap-1.5">
                                    <span
                                      className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-bold ${status.className}`}
                                    >
                                      {status.label}
                                    </span>
                                    <span
                                      className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-bold ${reviewStatus.className}`}
                                    >
                                      {reviewStatus.label}
                                    </span>
                                    <span className="text-[8px] font-semibold uppercase text-text-muted">
                                      {model.model_type || "MODEL 3D"}
                                    </span>
                                  </span>
                                </span>
                              </button>
                              {selected && canUpdate && (
                                <div className="mt-2.5 flex flex-wrap gap-2 border-t border-border pt-2.5">
                                  {!model.is_active && model.review_status === "verified" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleActivate(model.id_model_3d)
                                      }
                                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[8px] font-extrabold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300"
                                    >
                                      <CheckCircleIcon
                                        size={11}
                                        weight="fill"
                                      />{" "}
                                      Aktifkan
                                    </button>
                                  )}
                                  {model.conversion_status !== "ready" && (
                                    <button
                                      type="button"
                                      disabled={
                                        convertingModelId ===
                                          model.id_model_3d ||
                                        model.conversion_status === "processing"
                                      }
                                      onClick={() =>
                                        handleConvert(model.id_model_3d)
                                      }
                                      className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1.5 text-[8px] font-extrabold text-sky-700 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sky-500/10 dark:text-sky-300"
                                    >
                                      <ArrowsClockwiseIcon
                                        size={11}
                                        className={
                                          convertingModelId ===
                                          model.id_model_3d
                                            ? "animate-spin"
                                            : ""
                                        }
                                      />{" "}
                                      Konversi GLB
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    disabled={
                                      deletingModelId === model.id_model_3d
                                    }
                                    onClick={() => handleArchive(model)}
                                    className="ml-auto inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-[8px] font-extrabold text-red-700 transition hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-500/10 dark:text-red-300"
                                  >
                                    {deletingModelId === model.id_model_3d ? (
                                      <ArrowsClockwiseIcon
                                        size={11}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <TrashIcon size={11} weight="bold" />
                                    )}
                                    Arsipkan
                                  </button>
                                </div>
                              )}
                            </article>
                          );
                        })
                      )}
                    </div>

                    {archivedModels.length > 0 && (
                      <div className="space-y-2 border-t border-violet-200 pt-3 dark:border-violet-500/30">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-text-secondary">
                              Arsip model
                            </p>
                            <p className="mt-0.5 text-[8px] text-text-muted">
                              {archivedModels.length} versi dapat dipulihkan
                              tanpa mengunggah ulang file.
                            </p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-black text-slate-600 dark:bg-slate-500/15 dark:text-slate-300">
                            {archivedModels.length} arsip
                          </span>
                        </div>
                        <div className="space-y-2">
                          {archivedModels.map((model) => (
                            <article
                              key={model.id_model_3d}
                              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-surface p-3 sm:flex-row sm:items-center dark:border-slate-700"
                            >
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-300">
                                <CubeIcon size={17} weight="duotone" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[10px] font-black text-text-primary">
                                  v{model.version} ·{" "}
                                  {model.manifest?.display_name ||
                                    model.original_name}
                                </p>
                                <p className="mt-1 text-[8px] font-semibold text-text-muted">
                                  {model.model_type || "Model 3D"} · diarsipkan{" "}
                                  {formatDateTime(model.archived_at)}
                                </p>
                                <span
                                  className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[8px] font-bold ${statusConfig(model).className}`}
                                >
                                  {statusConfig(model).label}
                                </span>
                              </div>
                              {(canUpdate || canDelete) && (
                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                  {canUpdate && (
                                    <button
                                      type="button"
                                      disabled={
                                        restoringModelId ===
                                          model.id_model_3d ||
                                        removingArchivedModelId ===
                                          model.id_model_3d
                                      }
                                      onClick={() => handleRestore(model)}
                                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-[8px] font-black text-emerald-700 transition hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-wait disabled:opacity-60 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                                    >
                                      {restoringModelId ===
                                      model.id_model_3d ? (
                                        <ArrowsClockwiseIcon
                                          size={12}
                                          className="animate-spin"
                                        />
                                      ) : (
                                        <ArrowCounterClockwiseIcon
                                          size={12}
                                          weight="bold"
                                        />
                                      )}
                                      Pulihkan
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button
                                      type="button"
                                      disabled={
                                        removingArchivedModelId ===
                                          model.id_model_3d ||
                                        restoringModelId === model.id_model_3d
                                      }
                                      onClick={() =>
                                        handleRemoveArchived(model)
                                      }
                                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-[8px] font-black text-red-700 transition hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-wait disabled:opacity-60 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                                    >
                                      {removingArchivedModelId ===
                                      model.id_model_3d ? (
                                        <ArrowsClockwiseIcon
                                          size={12}
                                          className="animate-spin"
                                        />
                                      ) : (
                                        <TrashIcon size={12} weight="bold" />
                                      )}
                                      Hapus Permanen
                                    </button>
                                  )}
                                </div>
                              )}
                            </article>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    id="kelola3d-panel-lod"
                    hidden
                    aria-hidden="true"
                  >
                    <div className="rounded-xl border border-border bg-surface-secondary/60 p-3">
                      <p className="text-[10px] font-black text-text-primary">
                        LOD dan metadata bangunan
                      </p>
                      <p className="mt-1 text-[9px] leading-relaxed text-text-muted">
                        Setelah model diimpor, pilih tingkat detail yang sesuai,
                        lengkapi sumber serta kualitasnya, lalu simpan sebelum
                        model diverifikasi dan dipublikasikan ke peta.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        {
                          key: "building_height_m",
                          label: "Tinggi (m)",
                          min: "0.1",
                          max: "1000",
                          step: "0.01",
                        },
                        {
                          key: "building_floors",
                          label: "Jumlah Lantai",
                          min: "1",
                          max: "300",
                          step: "1",
                        },
                        {
                          key: "building_base_elevation_m",
                          label: "Elevasi Dasar (m)",
                          min: "-500",
                          max: "10000",
                          step: "0.01",
                        },
                      ].map((field) => (
                        <label key={field.key} className="block">
                          <span className="mb-1.5 block text-[8px] font-extrabold uppercase tracking-wide text-text-muted">
                            {field.label}
                          </span>
                          <input
                            type="number"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={asset3dMetadata[field.key]}
                            disabled={!canUpdate}
                            onChange={(event) =>
                              setAsset3dMetadata((current) => ({
                                ...current,
                                [field.key]: event.target.value,
                              }))
                            }
                            className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-[10px] font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-70"
                          />
                        </label>
                      ))}

                      <label className="block">
                        <span className="mb-1.5 block text-[8px] font-extrabold uppercase tracking-wide text-text-muted">
                          Sumber Tinggi
                        </span>
                        <select
                          value={asset3dMetadata.building_height_source}
                          disabled={!canUpdate}
                          onChange={(event) =>
                            setAsset3dMetadata((current) => ({
                              ...current,
                              building_height_source: event.target.value,
                            }))
                          }
                          className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-[10px] font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <option value="">Pilih sumber</option>
                          <option value="survey">Survei Lapangan</option>
                          <option value="lidar">LiDAR</option>
                          <option value="photogrammetry">
                            Fotogrametri/Drone
                          </option>
                          <option value="document">Dokumen Resmi</option>
                          <option value="floor_estimate">
                            Turunan Jumlah Lantai
                          </option>
                          <option value="model_3d">Metadata Model 3D</option>
                          <option value="other">Sumber Lain</option>
                        </select>
                      </label>

                      <label className="block">
                        <span className="mb-1.5 block text-[8px] font-extrabold uppercase tracking-wide text-text-muted">
                          Kualitas
                        </span>
                        <select
                          value={asset3dMetadata.building_height_quality}
                          disabled={!canUpdate}
                          onChange={(event) =>
                            setAsset3dMetadata((current) => ({
                              ...current,
                              building_height_quality: event.target.value,
                            }))
                          }
                          className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-[10px] font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <option value="">Pilih kualitas</option>
                          <option value="measured">Terukur</option>
                          <option value="derived">Hasil Turunan</option>
                          <option value="estimated">Estimasi</option>
                        </select>
                      </label>

                      <label className="block">
                        <span className="mb-1.5 block text-[8px] font-extrabold uppercase tracking-wide text-text-muted">
                          Level of Detail
                        </span>
                        <select
                          value={asset3dMetadata.model_3d_lod}
                          disabled={!canUpdate}
                          onChange={(event) =>
                            setAsset3dMetadata((current) => ({
                              ...current,
                              model_3d_lod: event.target.value,
                            }))
                          }
                          className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-[10px] font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <option value="">Pilih LOD</option>
                          <option value="LOD1">LOD1 - Blok</option>
                          <option value="LOD2">LOD2 - Bentuk Atap</option>
                          <option value="LOD2.5">
                            LOD2.5 - Detail Fasad
                          </option>
                          <option value="LOD3">
                            LOD3 - Fasad Terperinci
                          </option>
                          <option value="LOD4">
                            LOD4 - Detail Arsitektural
                          </option>
                        </select>
                      </label>

                      <label className="block">
                        <span className="mb-1.5 block text-[8px] font-extrabold uppercase tracking-wide text-text-muted">
                          CRS Sumber
                        </span>
                        <input
                          type="text"
                          value={asset3dMetadata.model_3d_source_crs}
                          disabled={!canUpdate}
                          onChange={(event) =>
                            setAsset3dMetadata((current) => ({
                              ...current,
                              model_3d_source_crs: event.target.value,
                            }))
                          }
                          placeholder="EPSG:32749"
                          className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-[10px] font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-70"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1.5 block text-[8px] font-extrabold uppercase tracking-wide text-text-muted">
                          Tanggal Perekaman
                        </span>
                        <input
                          type="date"
                          value={asset3dMetadata.model_3d_recorded_at}
                          disabled={!canUpdate}
                          onChange={(event) =>
                            setAsset3dMetadata((current) => ({
                              ...current,
                              model_3d_recorded_at: event.target.value,
                            }))
                          }
                          className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-[10px] font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-70"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1.5 block text-[8px] font-extrabold uppercase tracking-wide text-text-muted">
                          Akurasi (m)
                        </span>
                        <input
                          type="number"
                          min="0.001"
                          max="1000"
                          step="0.001"
                          value={asset3dMetadata.model_3d_accuracy_m}
                          disabled={!canUpdate}
                          onChange={(event) =>
                            setAsset3dMetadata((current) => ({
                              ...current,
                              model_3d_accuracy_m: event.target.value,
                            }))
                          }
                          className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-[10px] font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-70"
                        />
                      </label>
                    </div>

                    {canUpdate && (
                      <button
                        type="button"
                        disabled={savingAsset3dMetadata}
                        onClick={saveAsset3dMetadata}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-[10px] font-extrabold text-surface shadow-sm transition hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingAsset3dMetadata ? (
                          <ArrowsClockwiseIcon
                            size={15}
                            className="animate-spin"
                          />
                        ) : (
                          <FloppyDiskIcon size={15} weight="bold" />
                        )}
                        {savingAsset3dMetadata
                          ? "Menyimpan LOD…"
                          : "Simpan LOD & Metadata"}
                      </button>
                    )}
                  </div>
                </div>
              </section>

              <section
                id={
                  activePageSection === "verifikasi-model-3d"
                    ? "verifikasi-model-3d"
                    : "detail-model-3d"
                }
                role="tabpanel"
                aria-labelledby={`detail-nav-${activePageSection}`}
                hidden={
                  !["detail-model-3d", "verifikasi-model-3d"].includes(
                    activePageSection,
                  )
                }
                className="animate-fade-in scroll-mt-20 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
              >
                <SectionTitle
                  icon={
                    activePageSection === "verifikasi-model-3d"
                      ? CheckCircleIcon
                      : CubeIcon
                  }
                  title={
                    activePageSection === "verifikasi-model-3d"
                      ? "Verifikasi Model 3D"
                      : "Detail Model 3D"
                  }
                  description={
                    selectedModel
                      ? activePageSection === "verifikasi-model-3d"
                        ? `Periksa kesiapan dan tentukan keputusan model versi ${selectedModel.version}`
                        : `Edit identitas dan transformasi model versi ${selectedModel.version}`
                      : "Pilih model untuk melihat detail"
                  }
                />
                <div className="p-4">
                  {!selectedModel ? (
                    <div className="rounded-xl border border-dashed border-border p-6 text-center">
                      <CubeIcon size={24} className="mx-auto text-text-muted" />
                      <p className="mt-2 text-[10px] font-bold text-text-secondary">
                        Belum ada model yang dipilih
                      </p>
                      <p className="mx-auto mt-1 max-w-sm text-[9px] leading-relaxed text-text-muted">
                        Pilih versi model pada Data Model, atau impor file baru
                        untuk mulai mengatur identitas, sumber, dan transformasi.
                      </p>
                      <button
                        type="button"
                        onClick={() => switchSection("data-model-3d")}
                        className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-[9px] font-extrabold text-surface transition hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        Buka Data Model
                        <CaretRightIcon size={12} weight="bold" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div
                        className={`grid gap-2 sm:grid-cols-2 ${
                          activePageSection === "verifikasi-model-3d"
                            ? "[&>*:not(.keep-on-verification)]:hidden"
                            : ""
                        }`}
                      >
                        <div className="keep-on-verification rounded-xl border border-border bg-surface-secondary/60 p-3 sm:col-span-2">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                              <CubeIcon size={19} weight="duotone" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-text-muted">
                                Model yang sedang dikelola
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] font-black text-text-primary">
                                  Versi {selectedModel.version}
                                </span>
                                {selectedModel.is_active && (
                                  <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[7px] font-black uppercase text-white">
                                    Aktif
                                  </span>
                                )}
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${statusConfig(selectedModel).className}`}
                                >
                                  {statusConfig(selectedModel).label}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${reviewStatusConfig(selectedModel.review_status).className}`}
                                >
                                  {
                                    reviewStatusConfig(
                                      selectedModel.review_status,
                                    ).label
                                  }
                                </span>
                              </div>
                              <p className="mt-1 truncate text-[9px] text-text-muted">
                                {selectedModel.manifest?.display_name ||
                                  selectedModel.original_name ||
                                  "Model tanpa nama"}{" "}
                                · {selectedModel.model_type || "Model 3D"} ·
                                diperbarui{" "}
                                {formatDateTime(selectedModel.updated_at)}
                              </p>
                            </div>
                            <label className="block w-full lg:w-52">
                              <span className="mb-1 block text-[8px] font-extrabold uppercase tracking-wide text-text-muted">
                                Pilih versi
                              </span>
                              <select
                                value={selectedModel.id_model_3d}
                                onChange={(event) =>
                                  handleSelectModel(event.target.value)
                                }
                                className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-[9px] font-extrabold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
                              >
                                {activeModels.map((model) => (
                                  <option
                                    key={model.id_model_3d}
                                    value={model.id_model_3d}
                                  >
                                    v{model.version}
                                    {model.is_active ? " · Aktif" : ""}
                                    {" · "}
                                    {model.manifest?.display_name ||
                                      model.original_name}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                          {hasUnsavedMetadataChanges && (
                            <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[8px] font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                              <WarningCircleIcon
                                size={12}
                                weight="fill"
                                className="shrink-0"
                              />
                              Perubahan belum disimpan dan sudah ditampilkan
                              pada preview.
                            </div>
                          )}
                        </div>

                        <div className="rounded-xl border border-border bg-surface-secondary/40 p-3 sm:col-span-2">
                          <div className="mb-3">
                            <p className="text-[10px] font-black text-text-primary">
                              Informasi Dasar
                            </p>
                            <p className="mt-0.5 text-[9px] text-text-muted">
                              Gunakan nama dan deskripsi yang mudah dikenali
                              pada daftar versi.
                            </p>
                          </div>
                          <div className="grid gap-3">
                            <label className="block">
                              <span className="mb-1.5 block text-[9px] font-extrabold text-text-secondary">
                                Nama model
                              </span>
                              <input
                                type="text"
                                maxLength={150}
                                value={metadata.display_name}
                                disabled={!canUpdate}
                                onChange={(event) =>
                                  setMetadata((current) => ({
                                    ...current,
                                    display_name: event.target.value,
                                  }))
                                }
                                placeholder={selectedModel.original_name}
                                className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-[10px] font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-70"
                              />
                            </label>
                            <label className="block">
                              <span className="mb-1.5 block text-[9px] font-extrabold text-text-secondary">
                                Deskripsi
                              </span>
                              <textarea
                                rows={3}
                                maxLength={1000}
                                value={metadata.description}
                                disabled={!canUpdate}
                                onChange={(event) =>
                                  setMetadata((current) => ({
                                    ...current,
                                    description: event.target.value,
                                  }))
                                }
                                placeholder="Keterangan sumber, survei, fungsi, atau cakupan model"
                                className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2.5 text-[10px] font-semibold leading-relaxed text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-70"
                              />
                              <span className="mt-1 block text-right text-[7px] text-text-muted">
                                {metadata.description.length}/1000
                              </span>
                            </label>
                          </div>
                        </div>
                        <div
                          className={`keep-on-verification model-verification-panel overflow-hidden rounded-xl border border-border bg-surface-secondary/60 sm:col-span-2 ${
                            activePageSection === "detail-model-3d"
                              ? "hidden"
                              : ""
                          }`}
                        >
                          <div className="border-b border-border bg-surface px-3 py-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="text-[10px] font-black text-text-primary">
                                  Verifikasi dan Publikasi
                                </p>
                                <p className="mt-0.5 text-[9px] text-text-muted">
                                  Selesaikan pemeriksaan sebelum model dipublikasikan.
                                </p>
                              </div>
                              <span
                                className={`rounded-full px-2.5 py-1 text-[8px] font-black ${reviewStatusConfig(selectedModel.review_status).className}`}
                              >
                                {reviewStatusConfig(selectedModel.review_status).label}
                              </span>
                            </div>

                            <ol
                              className="mt-3 grid grid-cols-3 gap-1.5"
                              aria-label="Tahapan publikasi model 3D"
                            >
                              {[
                                {
                                  label: "Konversi",
                                  done:
                                    selectedModel.conversion_status === "ready",
                                },
                                {
                                  label: "Verifikasi",
                                  done: ["verified", "active"].includes(
                                    selectedModel.review_status,
                                  ),
                                },
                                {
                                  label: "Publikasi",
                                  done:
                                    selectedModel.is_active ||
                                    selectedModel.review_status === "active",
                                },
                              ].map((step, index) => (
                                <li
                                  key={step.label}
                                  className={`flex items-center gap-1.5 rounded-lg border px-2 py-2 ${
                                    step.done
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                                      : "border-border bg-surface-secondary text-text-muted"
                                  }`}
                                >
                                  <span
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-black ${
                                      step.done
                                        ? "bg-emerald-500 text-white"
                                        : "bg-surface text-text-muted"
                                    }`}
                                  >
                                    {step.done ? (
                                      <CheckCircleIcon size={12} weight="fill" />
                                    ) : (
                                      index + 1
                                    )}
                                  </span>
                                  <span className="truncate text-[8px] font-extrabold">
                                    {step.label}
                                  </span>
                                </li>
                              ))}
                            </ol>
                          </div>

                          <div className="space-y-3 p-3">
                            <div>
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <p className="text-[8px] font-extrabold uppercase tracking-wide text-text-muted">
                                  Kesiapan Verifikasi
                                </p>
                                <span
                                  className={`text-[8px] font-black ${
                                    verificationReady
                                      ? "text-emerald-600 dark:text-emerald-300"
                                      : "text-amber-600 dark:text-amber-300"
                                  }`}
                                >
                                  {verificationRequirements.length -
                                    missingVerificationRequirements.length}
                                  /{verificationRequirements.length} selesai
                                </span>
                              </div>
                              <div className="grid gap-1.5 sm:grid-cols-2">
                                {verificationRequirements.map((item) => (
                                  <div
                                    key={item.key}
                                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[8px] font-semibold ${
                                      item.ready
                                        ? "border-emerald-200 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
                                        : "border-amber-200 bg-amber-50/70 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300"
                                    }`}
                                  >
                                    {item.ready ? (
                                      <CheckCircleIcon
                                        size={12}
                                        weight="fill"
                                        className="shrink-0"
                                      />
                                    ) : (
                                      <WarningCircleIcon
                                        size={12}
                                        weight="fill"
                                        className="shrink-0"
                                      />
                                    )}
                                    <span className="truncate">{item.label}</span>
                                  </div>
                                ))}
                              </div>
                              {!verificationReady && (
                                <button
                                  type="button"
                                  onClick={openModelSourceValidation}
                                  className="mt-2 text-[8px] font-extrabold text-accent underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-accent"
                                >
                                  Lengkapi pemeriksaan sumber dan kualitas
                                </button>
                              )}
                            </div>

                            <fieldset
                              disabled={
                                !canUpdate ||
                                selectedModel.review_status === "processing"
                              }
                            >
                              <legend className="mb-1.5 text-[8px] font-extrabold uppercase tracking-wide text-text-muted">
                                Keputusan
                              </legend>
                              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
                                {[
                                  ["draft", "Draf"],
                                  ["needs_review", "Ajukan"],
                                  ["verified", "Setujui"],
                                  ["rejected", "Perbaiki"],
                                  ["expired", "Kedaluwarsa"],
                                ].map(([value, label]) => {
                                  const selected =
                                    reviewDraft.review_status === value;
                                  const blocked =
                                    value === "verified" && !verificationReady;
                                  return (
                                    <button
                                      key={value}
                                      type="button"
                                      disabled={blocked}
                                      onClick={() =>
                                        setReviewDraft((current) => ({
                                          ...current,
                                          review_status: value,
                                        }))
                                      }
                                      className={`h-9 rounded-lg border px-2 text-[8px] font-extrabold transition focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40 ${
                                        selected
                                          ? "border-accent bg-accent text-surface"
                                          : "border-border bg-surface text-text-secondary hover:border-accent/40 hover:text-accent"
                                      }`}
                                      aria-pressed={selected}
                                      title={
                                        blocked
                                          ? "Lengkapi seluruh pemeriksaan terlebih dahulu"
                                          : label
                                      }
                                    >
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                            </fieldset>

                            <label className="block">
                              <span className="mb-1 block text-[8px] font-extrabold uppercase tracking-wide text-text-muted">
                                {reviewDraft.review_status === "rejected"
                                  ? "Alasan Perbaikan"
                                  : "Catatan Verifikasi"}
                              </span>
                              <textarea
                                rows={2}
                                maxLength={2000}
                                value={reviewDraft.review_notes}
                                required={
                                  reviewDraft.review_status === "rejected"
                                }
                                disabled={
                                  !canUpdate ||
                                  selectedModel.review_status === "processing"
                                }
                                onChange={(event) =>
                                  setReviewDraft((current) => ({
                                    ...current,
                                    review_notes: event.target.value,
                                  }))
                                }
                                placeholder={
                                  reviewDraft.review_status === "rejected"
                                    ? "Jelaskan bagian yang harus diperbaiki…"
                                    : "Ringkasan hasil pemeriksaan (opsional)"
                                }
                                className={`w-full resize-none rounded-lg border bg-surface px-2.5 py-2 text-[9px] font-semibold text-text-primary outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70 ${
                                  reviewDraft.review_status === "rejected" &&
                                  !reviewDraft.review_notes.trim()
                                    ? "border-red-300 focus:border-red-400 focus:ring-red-500/15"
                                    : "border-border focus:border-accent focus:ring-accent/15"
                                }`}
                              />
                              <span className="mt-1 block text-right text-[7px] text-text-muted">
                                {reviewDraft.review_notes.length}/2000
                              </span>
                            </label>

                            {canUpdate &&
                              selectedModel.review_status !== "processing" && (
                                <button
                                  type="button"
                                  disabled={
                                    savingReview ||
                                    (reviewDraft.review_status === "verified" &&
                                      !verificationReady) ||
                                    (reviewDraft.review_status === "rejected" &&
                                      !reviewDraft.review_notes.trim())
                                  }
                                  onClick={saveReview}
                                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 text-[9px] font-extrabold text-surface transition hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {savingReview ? (
                                    <ArrowsClockwiseIcon
                                      size={13}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <CheckCircleIcon size={13} weight="bold" />
                                  )}
                                  {savingReview
                                    ? "Menyimpan…"
                                    : reviewDraft.review_status === "verified"
                                      ? "Verifikasi Model"
                                      : reviewDraft.review_status === "rejected"
                                        ? "Kirim untuk Perbaikan"
                                        : "Simpan Keputusan"}
                                </button>
                              )}
                          </div>
                        </div>
                        <div
                          id="model-source-validation"
                          className="scroll-mt-24 rounded-xl border border-border bg-surface-secondary/60 p-3 sm:col-span-2"
                        >
                          <div className="mb-3">
                            <p className="text-[10px] font-black text-text-primary">
                              Sumber dan Referensi Model
                            </p>
                            <p className="mt-0.5 text-[9px] leading-relaxed text-text-muted">
                              Catat CRS, origin, dan satuan file sebelum model dipublikasikan.
                            </p>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-3">
                            <label>
                              <span className="mb-1 block text-[8px] font-extrabold uppercase tracking-wide text-text-muted">Jenis Sumber</span>
                              <select
                                value={metadata.source_data_type}
                                disabled={!canUpdate}
                                onChange={(event) => setMetadata((current) => ({ ...current, source_data_type: event.target.value }))}
                                className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-[10px] font-semibold text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:opacity-70"
                              >
                                <option value="">Pilih sumber</option>
                                <option value="lidar">LiDAR</option>
                                <option value="photogrammetry">Fotogrametri/Drone</option>
                                <option value="building_outline">Building Outline/RO</option>
                                <option value="bim">BIM/Revit</option>
                                <option value="manual">Pemodelan Manual</option>
                                <option value="other">Lainnya</option>
                              </select>
                            </label>
                            <label>
                              <span className="mb-1 block text-[8px] font-extrabold uppercase tracking-wide text-text-muted">CRS Sumber</span>
                              <input
                                type="text"
                                value={metadata.source_crs}
                                disabled={!canUpdate}
                                onChange={(event) => setMetadata((current) => ({ ...current, source_crs: event.target.value }))}
                                placeholder="EPSG:32749"
                                className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-[10px] font-semibold text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:opacity-70"
                              />
                            </label>
                            <label>
                              <span className="mb-1 block text-[8px] font-extrabold uppercase tracking-wide text-text-muted">Satuan</span>
                              <select
                                value={metadata.source_unit}
                                disabled={!canUpdate}
                                onChange={(event) => setMetadata((current) => ({ ...current, source_unit: event.target.value }))}
                                className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-[10px] font-semibold text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:opacity-70"
                              >
                                <option value="m">Meter</option>
                                <option value="cm">Sentimeter</option>
                                <option value="mm">Milimeter</option>
                              </select>
                            </label>
                            {[
                              ["source_origin_x", "Origin X"],
                              ["source_origin_y", "Origin Y"],
                              ["source_origin_z", "Origin Z"],
                            ].map(([key, label]) => (
                              <label key={key}>
                                <span className="mb-1 block text-[8px] font-extrabold uppercase tracking-wide text-text-muted">{label}</span>
                                <input
                                  type="number"
                                  step="0.001"
                                  value={metadata[key]}
                                  disabled={!canUpdate}
                                  onChange={(event) => setMetadata((current) => ({ ...current, [key]: event.target.value }))}
                                  className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-[10px] font-semibold text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:opacity-70"
                                />
                              </label>
                            ))}
                            <label className="sm:col-span-3">
                              <span className="mb-1 block text-[8px] font-extrabold uppercase tracking-wide text-text-muted">Berlaku Sampai</span>
                              <input
                                type="date"
                                value={metadata.expires_at}
                                disabled={!canUpdate}
                                onChange={(event) => setMetadata((current) => ({ ...current, expires_at: event.target.value }))}
                                className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-[10px] font-semibold text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:opacity-70"
                              />
                            </label>
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {[
                              ["source_documented", "Dokumen sumber tersedia"],
                              ["crs_confirmed", "CRS sudah dikonfirmasi"],
                              ["origin_confirmed", "Titik origin sudah dikonfirmasi"],
                              ["unit_confirmed", "Satuan sudah dikonfirmasi"],
                              ["geometry_checked", "Geometri sudah diperiksa"],
                              ["attributes_matched", "Atribut/ID sudah cocok"],
                            ].map(([key, label]) => (
                              <label key={key} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-2 text-[9px] font-semibold text-text-secondary">
                                <input
                                  type="checkbox"
                                  checked={metadata.quality_checklist[key]}
                                  disabled={!canUpdate}
                                  onChange={(event) => setMetadata((current) => ({
                                    ...current,
                                    quality_checklist: {
                                      ...current.quality_checklist,
                                      [key]: event.target.checked,
                                    },
                                  }))}
                                  className="h-4 w-4 rounded border-border accent-accent"
                                />
                                {label}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3 dark:border-violet-500/30 dark:bg-violet-500/5 sm:col-span-2">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-black text-text-primary">
                                Geser Posisi Model (X, Y, Z)
                              </p>
                              <p className="mt-0.5 text-[9px] leading-relaxed text-text-muted">
                                Satuan meter. Koordinat asli file tetap
                                tersimpan dan tidak berubah.
                              </p>
                              {hasUnsavedTransformChanges && (
                                <span className="mt-1.5 inline-flex rounded-full bg-amber-100 px-2 py-1 text-[7px] font-black uppercase tracking-wide text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                                  Preview realtime · belum disimpan
                                </span>
                              )}
                            </div>
                            {canUpdate && (
                              <button
                                type="button"
                                onClick={() =>
                                  setMetadata((current) => ({
                                    ...current,
                                    offset_x_m: 0,
                                    offset_y_m: 0,
                                    offset_z_m: 0,
                                  }))
                                }
                                className="shrink-0 rounded-lg border border-border bg-surface px-2 py-1.5 text-[8px] font-extrabold text-text-secondary transition hover:border-violet-300 hover:text-violet-700 focus-visible:ring-2 focus-visible:ring-violet-500"
                              >
                                Reset posisi
                              </button>
                            )}
                          </div>
                          <div className="grid gap-2 sm:grid-cols-3">
                            {[
                              {
                                key: "offset_x_m",
                                axis: "X",
                                label: "Timur (+) / Barat (−)",
                                min: -500,
                                max: 500,
                              },
                              {
                                key: "offset_y_m",
                                axis: "Y",
                                label: "Utara (+) / Selatan (−)",
                                min: -500,
                                max: 500,
                              },
                              {
                                key: "offset_z_m",
                                axis: "Z",
                                label: "Naik (+) / Turun (−)",
                                min: -100,
                                max: 500,
                              },
                            ].map((field) => (
                              <TransformSlider
                                key={field.key}
                                label={`Sumbu ${field.axis} · ${field.label}`}
                                value={metadata[field.key]}
                                min={field.min}
                                max={field.max}
                                step={0.1}
                                unit=" m"
                                disabled={!canUpdate}
                                onChange={(value) =>
                                  setMetadata((current) => ({
                                    ...current,
                                    [field.key]: value,
                                  }))
                                }
                              />
                            ))}
                          </div>
                        </div>
                        {[
                          {
                            key: "location_lat",
                            label: "Latitude",
                            min: -90,
                            max: 90,
                            step: "0.00000001",
                          },
                          {
                            key: "location_long",
                            label: "Longitude",
                            min: -180,
                            max: 180,
                            step: "0.00000001",
                          },
                          {
                            key: "altitude_m",
                            label: "Ketinggian (m)",
                            min: -10000,
                            max: 100000,
                            step: "0.001",
                          },
                        ].map((field) => (
                          <label key={field.key} className="block">
                            <span className="mb-1 block text-[8px] font-extrabold uppercase tracking-wide text-text-muted">
                              {field.label}
                            </span>
                            <input
                              type="number"
                              min={field.min}
                              max={field.max}
                              step={field.step}
                              value={metadata[field.key]}
                              disabled={!canUpdate}
                              onChange={(event) =>
                                setMetadata((current) => ({
                                  ...current,
                                  [field.key]: event.target.value,
                                }))
                              }
                              className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-[10px] font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-70"
                            />
                          </label>
                        ))}
                        <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3 dark:border-violet-500/30 dark:bg-violet-500/5 sm:col-span-2">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-black text-text-primary">
                                Rotasi Model
                              </p>
                              <p className="mt-0.5 text-[9px] text-text-muted">
                                Geser slider dan lihat perubahan langsung pada
                                preview.
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={!canUpdate}
                              onClick={() =>
                                setMetadata((current) => ({
                                  ...current,
                                  heading: 0,
                                  tilt: 0,
                                  roll: 0,
                                }))
                              }
                              className="rounded-lg border border-border bg-surface px-2 py-1.5 text-[8px] font-extrabold text-text-secondary transition hover:border-violet-300 hover:text-violet-700 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50"
                            >
                              Reset rotasi
                            </button>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-3">
                            {[
                              ["heading", "Heading", -180, 180],
                              ["tilt", "Tilt", -180, 180],
                              ["roll", "Roll", -180, 180],
                            ].map(([key, label, min, max]) => (
                              <TransformSlider
                                key={key}
                                label={label}
                                value={metadata[key]}
                                min={min}
                                max={max}
                                step={0.5}
                                unit="°"
                                disabled={!canUpdate}
                                onChange={(value) =>
                                  setMetadata((current) => ({
                                    ...current,
                                    [key]: value,
                                  }))
                                }
                              />
                            ))}
                          </div>
                        </div>

                        <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3 dark:border-violet-500/30 dark:bg-violet-500/5 sm:col-span-2">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-black text-text-primary">
                                Skala Model
                              </p>
                              <p className="mt-0.5 text-[9px] text-text-muted">
                                Rentang slider 0,1–5. Kolom angka tetap dapat
                                menerima nilai di luar rentang.
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={!canUpdate}
                              onClick={() =>
                                setMetadata((current) => ({
                                  ...current,
                                  scale_x: 1,
                                  scale_y: 1,
                                  scale_z: 1,
                                }))
                              }
                              className="rounded-lg border border-border bg-surface px-2 py-1.5 text-[8px] font-extrabold text-text-secondary transition hover:border-violet-300 hover:text-violet-700 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50"
                            >
                              Reset skala
                            </button>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-3">
                            {[
                              ["scale_x", "Skala X"],
                              ["scale_y", "Skala Y"],
                              ["scale_z", "Skala Z"],
                            ].map(([key, label]) => (
                              <TransformSlider
                                key={key}
                                label={label}
                                value={metadata[key]}
                                min={0.1}
                                max={5}
                                step={0.01}
                                unit="×"
                                disabled={!canUpdate}
                                onChange={(value) =>
                                  setMetadata((current) => ({
                                    ...current,
                                    [key]: value,
                                  }))
                                }
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      {canUpdate &&
                        activePageSection === "detail-model-3d" && (
                          <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-xl border border-border bg-surface/95 p-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                              {hasUnsavedMetadataChanges ? (
                                <WarningCircleIcon
                                  size={15}
                                  weight="fill"
                                  className="shrink-0 text-amber-500"
                                />
                              ) : (
                                <CheckCircleIcon
                                  size={15}
                                  weight="fill"
                                  className="shrink-0 text-emerald-500"
                                />
                              )}
                              <div>
                                <p className="text-[9px] font-black text-text-primary">
                                  {hasUnsavedMetadataChanges
                                    ? "Ada perubahan belum disimpan"
                                    : "Semua perubahan sudah tersimpan"}
                                </p>
                                <p className="mt-0.5 text-[8px] text-text-muted">
                                  {hasUnsavedMetadataChanges
                                    ? "Simpan untuk menerapkan Detail Model secara permanen."
                                    : `Terakhir diperbarui ${formatDateTime(selectedModel.updated_at)}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {hasUnsavedMetadataChanges && (
                                <button
                                  type="button"
                                  disabled={savingMetadata}
                                  onClick={discardMetadataChanges}
                                  className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-border bg-surface px-3 text-[9px] font-extrabold text-text-secondary transition hover:border-accent/40 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 sm:flex-none"
                                >
                                  Batalkan
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={
                                  savingMetadata ||
                                  !hasUnsavedMetadataChanges
                                }
                                onClick={saveMetadata}
                                className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-[9px] font-extrabold text-surface transition hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                              >
                                {savingMetadata ? (
                                  <ArrowsClockwiseIcon
                                    size={13}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <FloppyDiskIcon size={13} weight="bold" />
                                )}
                                {savingMetadata
                                  ? "Menyimpan…"
                                  : "Simpan Perubahan"}
                              </button>
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </section>

              <section
                id="daftar-ruang-3d"
                role="tabpanel"
                aria-labelledby="detail-nav-daftar-ruang-3d"
                hidden={activePageSection !== "daftar-ruang-3d"}
                className="animate-fade-in scroll-mt-20 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
              >
                <SectionTitle
                  icon={TableIcon}
                  title="Daftar Ruang 3D"
                  description={
                    selectedModel
                      ? `Tersimpan pada metadata model versi ${selectedModel.version}`
                      : "Import atau pilih model untuk mengatur ruang"
                  }
                  action={
                    canUpdate && selectedModel ? (
                      <button
                        type="button"
                        onClick={() =>
                          setRooms((current) => [...current, emptyRoom()])
                        }
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-2.5 text-[9px] font-extrabold text-surface hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <PlusIcon size={12} weight="bold" /> Tambah
                      </button>
                    ) : null
                  }
                />
                <div className="p-4">
                  {!selectedModel ? (
                    <div className="rounded-xl border border-dashed border-border p-6 text-center">
                      <TableIcon
                        size={24}
                        className="mx-auto text-text-muted"
                      />
                      <p className="mt-2 text-[10px] font-bold text-text-secondary">
                        Belum ada model yang dipilih
                      </p>
                    </div>
                  ) : rooms.length === 0 ? (
                    <button
                      type="button"
                      disabled={!canUpdate}
                      onClick={() => setRooms([emptyRoom()])}
                      className="w-full rounded-xl border border-dashed border-border p-6 text-center transition hover:border-accent hover:bg-accent/5 disabled:cursor-default"
                    >
                      <PlusIcon size={23} className="mx-auto text-text-muted" />
                      <p className="mt-2 text-[10px] font-bold text-text-secondary">
                        Belum ada daftar ruang
                      </p>
                      <p className="mt-1 text-[9px] text-text-muted">
                        {canUpdate
                          ? "Klik untuk menambahkan ruang pertama."
                          : "Data ruang belum tersedia."}
                      </p>
                    </button>
                  ) : (
                    <div className="space-y-2.5">
                      {rooms.map((room, index) => (
                        <div
                          key={room.id}
                          className="rounded-xl border border-border bg-surface-secondary/60 p-3"
                        >
                          <div className="mb-2.5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-[9px] font-black text-accent">
                                {index + 1}
                              </span>
                              <p className="text-[10px] font-extrabold text-text-primary">
                                {room.name || "Ruang baru"}
                              </p>
                            </div>
                            {canUpdate && (
                              <button
                                type="button"
                                onClick={() =>
                                  setRooms((current) =>
                                    current.filter(
                                      (item) => item.id !== room.id,
                                    ),
                                  )
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-500/10"
                                aria-label={`Hapus ${room.name || `ruang ${index + 1}`}`}
                              >
                                <TrashIcon size={13} weight="bold" />
                              </button>
                            )}
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {[
                              {
                                key: "name",
                                label: "Nama ruang",
                                placeholder: "Contoh: Ruang Rapat",
                              },
                              {
                                key: "unit_code",
                                label: "Kode unit",
                                placeholder: "Contoh: RR-201",
                              },
                              {
                                key: "floor",
                                label: "Lantai",
                                placeholder: "Contoh: 2",
                              },
                              {
                                key: "area_m2",
                                label: "Luas (m²)",
                                placeholder: "0",
                                type: "number",
                              },
                              {
                                key: "usage",
                                label: "Penggunaan",
                                placeholder: "Contoh: Ruang kerja",
                              },
                              {
                                key: "notes",
                                label: "Catatan",
                                placeholder: "Keterangan tambahan",
                              },
                            ].map((field) => (
                              <label key={field.key} className="block">
                                <span className="mb-1 block text-[8px] font-extrabold uppercase tracking-wide text-text-muted">
                                  {field.label}
                                </span>
                                <input
                                  type={field.type || "text"}
                                  min={
                                    field.type === "number" ? "0" : undefined
                                  }
                                  step={
                                    field.type === "number" ? "0.01" : undefined
                                  }
                                  value={room[field.key]}
                                  disabled={!canUpdate}
                                  onChange={(event) =>
                                    updateRoom(
                                      room.id,
                                      field.key,
                                      event.target.value,
                                    )
                                  }
                                  placeholder={field.placeholder}
                                  className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-[10px] font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-70"
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      {canUpdate && (
                        <button
                          type="button"
                          disabled={savingRooms}
                          onClick={saveRooms}
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-[10px] font-extrabold text-surface shadow-sm transition hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingRooms ? (
                            <ArrowsClockwiseIcon
                              size={15}
                              className="animate-spin"
                            />
                          ) : (
                            <FloppyDiskIcon size={15} weight="bold" />
                          )}
                          {savingRooms
                            ? "Menyimpan daftar ruang…"
                            : "Simpan Daftar Ruang"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </section>

            </div>

            <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm xl:sticky xl:top-4">
              <SectionTitle
                icon={MapPinIcon}
                title="Preview Model 3D"
                description={
                  selectedAsset
                    ? `${selectedAsset.kode_aset} · ${selectedModel ? `model versi ${selectedModel.version}` : "bangunan LOD"}`
                    : "Pilih aset untuk melihat preview"
                }
                action={
                  selectedAsset && activePreviewTab === "map" ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setFlyToRequest({
                            assetId: selectedAssetId,
                            token: `${selectedAssetId}-${Date.now()}`,
                          })
                        }
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-2.5 text-[9px] font-extrabold text-surface shadow-sm transition hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                        aria-label={`Arahkan kamera ke model 3D ${selectedAsset.kode_aset}`}
                      >
                        <CrosshairIcon size={13} weight="bold" />
                        Arahkan ke 3D
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewRevision((value) => value + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-secondary hover:text-accent focus-visible:ring-2 focus-visible:ring-accent"
                        aria-label="Muat ulang preview"
                      >
                        <ArrowsClockwiseIcon size={15} weight="bold" />
                      </button>
                    </div>
                  ) : null
                }
              />
              <div className="border-b border-border px-3 pt-3">
                <div
                  role="tablist"
                  aria-label="Konten preview model 3D"
                  className="grid grid-cols-2 gap-1 rounded-xl bg-surface-secondary p-1"
                >
                  <button
                    type="button"
                    role="tab"
                    id="preview-tab-map"
                    aria-selected={activePreviewTab === "map"}
                    aria-controls="preview-panel-map"
                    tabIndex={activePreviewTab === "map" ? 0 : -1}
                    onClick={() => setActivePreviewTab("map")}
                    className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-[11px] font-extrabold transition focus-visible:ring-2 focus-visible:ring-accent ${
                      activePreviewTab === "map"
                        ? "bg-accent text-surface"
                        : "text-text-secondary hover:bg-surface hover:text-accent"
                    }`}
                  >
                    <MapPinIcon size={15} weight={activePreviewTab === "map" ? "fill" : "duotone"} />
                    Peta
                  </button>
                  <button
                    type="button"
                    role="tab"
                    id="preview-tab-attributes"
                    aria-selected={activePreviewTab === "attributes"}
                    aria-controls="preview-panel-attributes"
                    tabIndex={activePreviewTab === "attributes" ? 0 : -1}
                    onClick={() => setActivePreviewTab("attributes")}
                    className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-[11px] font-extrabold transition focus-visible:ring-2 focus-visible:ring-accent ${
                      activePreviewTab === "attributes"
                        ? "bg-accent text-surface"
                        : "text-text-secondary hover:bg-surface hover:text-accent"
                    }`}
                  >
                    <StackIcon
                      size={15}
                      weight={activePreviewTab === "attributes" ? "fill" : "duotone"}
                    />
                    Atribut
                  </button>
                </div>
              </div>

              {activePreviewTab === "map" ? (
                <div
                  id="preview-panel-map"
                  role="tabpanel"
                  aria-labelledby="preview-tab-map"
                  className="p-3"
                >
                  <div className="relative h-[min(68vh,720px)] min-h-[430px] overflow-hidden rounded-xl border border-border bg-slate-950">
                    {previewAsset ? (
                      <CesiumModelPreview
                        key={`${selectedAssetId}-${selectedModel?.id_model_3d || "lod"}-${previewRevision}`}
                        asset={previewAsset}
                        model={previewModel}
                        focusRequestKey={
                          flyToRequest?.assetId === selectedAssetId
                            ? flyToRequest.token
                            : `kelola-3d-initial-${selectedAssetId}-${selectedModel?.id_model_3d || "lod"}-${previewRevision}`
                        }
                        onStatusChange={setPreviewModelStatus}
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                        <CubeIcon
                          size={38}
                          weight="duotone"
                          className="text-slate-500"
                        />
                        <p className="mt-3 text-sm font-black text-white">
                          Preview belum tersedia
                        </p>
                        <p className="mt-1 max-w-sm text-[10px] leading-relaxed text-slate-400">
                          Pilih kode aset dari daftar tersinkron untuk menampilkan
                          lokasi, footprint, atau model 3D.
                        </p>
                      </div>
                    )}
                    {selectedModel && hasUnsavedTransformChanges && (
                      <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg border border-amber-300/30 bg-slate-950/85 px-2.5 py-2 text-[8px] font-extrabold text-amber-200 backdrop-blur">
                        Preview perubahan · belum disimpan
                      </div>
                    )}
                    {selectedModel &&
                      previewModelStatus.state === "loading" && (
                        <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-slate-950/80 px-3 py-2 text-[9px] font-bold text-white backdrop-blur">
                          <ArrowsClockwiseIcon
                            size={13}
                            className="animate-spin text-sky-300"
                          />
                          Memuat bangunan 3D…
                        </div>
                      )}
                    {selectedModel && previewModelStatus.state === "error" && (
                      <div className="absolute left-3 right-3 top-3 flex items-start gap-2 rounded-xl border border-red-400/30 bg-slate-950/90 p-3 text-red-200 backdrop-blur">
                        <WarningCircleIcon
                          size={16}
                          weight="fill"
                          className="mt-0.5 shrink-0"
                        />
                        <div>
                          <p className="text-[10px] font-black">
                            Model 3D gagal dimuat
                          </p>
                          <p className="mt-0.5 text-[9px] leading-relaxed text-red-100/80">
                            {previewModelStatus.message ||
                              "Muat ulang preview. Jika tetap gagal, periksa akses file hasil konversi atau jalankan konversi ulang."}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedAsset &&
                      !selectedModel &&
                      !selectedAsset.building_footprint && (
                        <div className="absolute bottom-3 left-3 right-3 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-slate-950/85 p-3 text-amber-200 backdrop-blur">
                          <WarningCircleIcon
                            size={16}
                            weight="fill"
                            className="mt-0.5 shrink-0"
                          />
                          <p className="text-[9px] leading-relaxed">
                            Aset ini belum memiliki model KMZ/GLB/3D Tiles maupun footprint
                            bangunan. Import model untuk mengaktifkan preview 3D.
                          </p>
                        </div>
                      )}
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-surface-secondary px-2 py-2 text-center">
                      <p className="text-[9px] font-black text-text-primary">
                        {selectedModel?.model_type ||
                          selectedAsset?.model_3d_lod ||
                          "—"}
                      </p>
                      <p className="mt-0.5 text-[7px] font-bold uppercase text-text-muted">
                        Format/LOD
                      </p>
                    </div>
                    <div className="rounded-lg bg-surface-secondary px-2 py-2 text-center">
                      <p className="text-[9px] font-black text-text-primary">
                        {selectedModel?.conversion_status || "—"}
                      </p>
                      <p className="mt-0.5 text-[7px] font-bold uppercase text-text-muted">
                        Status
                      </p>
                    </div>
                    <div className="rounded-lg bg-surface-secondary px-2 py-2 text-center">
                      <p className="text-[9px] font-black text-text-primary">
                        {rooms.length}
                      </p>
                      <p className="mt-0.5 text-[7px] font-bold uppercase text-text-muted">
                        Ruang
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  id="preview-panel-attributes"
                  role="tabpanel"
                  aria-labelledby="preview-tab-attributes"
                  className="max-h-[min(76vh,800px)] min-h-[430px] overflow-y-auto"
                >
                  <Model3dObjectsPanel
                    key={selectedModel?.id_model_3d || "no-model"}
                    assetId={selectedAssetId}
                    model={selectedModel}
                  />
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
