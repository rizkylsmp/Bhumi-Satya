import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import AssetMapDisplay from "../components/map/AssetMapDisplay";
import { useConfirm } from "../components/ui/ConfirmDialog";
import { asetService, assetModel3dService } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { hasPermission } from "../utils/permissions";
import {
  ArrowsClockwiseIcon,
  BuildingsIcon,
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
  UploadSimpleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";

const emptyRoom = () => ({
  id: globalThis.crypto?.randomUUID?.() || `ruang-${Date.now()}-${Math.random()}`,
  name: "",
  floor: "",
  area_m2: "",
  usage: "",
  unit_code: "",
  notes: "",
});

const errorMessage = (error, fallback) =>
  error?.response?.data?.error || error?.response?.data?.message || fallback;

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
});

const statusConfig = (model) => {
  if (model?.archived_at || model?.status === "archived") {
    return { label: "Diarsipkan", className: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" };
  }
  if (model?.conversion_status === "ready") {
    return { label: "Siap ditampilkan", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" };
  }
  if (model?.conversion_status === "processing") {
    return { label: "Sedang dikonversi", className: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" };
  }
  if (model?.conversion_status === "failed") {
    return { label: "Konversi gagal", className: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300" };
  }
  return { label: "Antrean konversi", className: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" };
};

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
          <p className="mt-0.5 text-[10px] leading-relaxed text-text-muted">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

export default function Kelola3dPage() {
  const userRole = useAuthStore((state) => state.user?.role || "");
  const canUpdate = hasPermission(userRole, "kelola3d", "update");
  const fileInputRef = useRef(null);
  const confirm = useConfirm();

  const [assetSearch, setAssetSearch] = useState("");
  const [assets, setAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [metadata, setMetadata] = useState(() => metadataFromModel(null));
  const [uploading, setUploading] = useState(false);
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [savingRooms, setSavingRooms] = useState(false);
  const [convertingModelId, setConvertingModelId] = useState(null);
  const [deletingModelId, setDeletingModelId] = useState(null);
  const [previewRevision, setPreviewRevision] = useState(0);
  const [flyToRequest, setFlyToRequest] = useState(null);

  const selectedAsset = useMemo(
    () => assets.find((asset) => String(asset.id_aset || asset.id) === String(selectedAssetId)) || null,
    [assets, selectedAssetId],
  );
  const activeModels = useMemo(
    () => models.filter((model) => !model.archived_at && model.status !== "archived"),
    [models],
  );
  const selectedModel = useMemo(
    () => activeModels.find((model) => String(model.id_model_3d) === String(selectedModelId))
      || activeModels.find((model) => model.is_active)
      || activeModels[0]
      || null,
    [activeModels, selectedModelId],
  );

  const fetchAssets = useCallback(async (search = "") => {
    setAssetsLoading(true);
    try {
      const response = await asetService.getAll({
        page: 1,
        limit: 100,
        search: search.trim() || undefined,
        sort: "kode_aset",
        order: "ASC",
      });
      const nextAssets = response.data?.data || [];
      setAssets(nextAssets);
      setSelectedAssetId((currentId) => {
        if (nextAssets.some((asset) => String(asset.id_aset || asset.id) === String(currentId))) {
          return currentId;
        }
        return nextAssets[0]?.id_aset || nextAssets[0]?.id || null;
      });
    } catch (error) {
      toast.error(errorMessage(error, "Gagal menyinkronkan aset dari Pusat Data"));
      setAssets([]);
    } finally {
      setAssetsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchAssets(assetSearch), 300);
    return () => clearTimeout(timeout);
  }, [assetSearch, fetchAssets]);

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
      const available = nextModels.filter((model) => !model.archived_at && model.status !== "archived");
      const preferred = available.find((model) => String(model.id_model_3d) === String(preferredModelId));
      const nextSelected = preferred || available.find((model) => model.is_active) || available[0] || null;
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
    const modelRooms = selectedModel?.manifest?.rooms;
    setMetadata(metadataFromModel(selectedModel));
    setRooms(Array.isArray(modelRooms) ? modelRooms.map((room) => ({
      id: room.id || emptyRoom().id,
      name: room.name || room.nama || "",
      floor: room.floor || room.lantai || "",
      area_m2: room.area_m2 ?? room.area ?? room.luas ?? "",
      usage: room.usage || room.penggunaan || "",
      unit_code: room.unit_code || room.kode_unit || "",
      notes: room.notes || room.catatan || "",
    })) : []);
  }, [selectedModel]);

  const handleUpload = async (file) => {
    if (!file || !selectedAssetId || !canUpdate) return;
    if (!file.name.toLowerCase().endsWith(".kmz")) {
      toast.error("File model harus berformat KMZ");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Ukuran model maksimal 50 MB");
      return;
    }

    setUploading(true);
    try {
      const uploadResponse = await assetModel3dService.upload(selectedAssetId, file);
      const uploadedModel = uploadResponse.data?.data;
      toast.success(uploadResponse.data?.message || "Model 3D berhasil diunggah");
      if (uploadedModel?.id_model_3d) {
        try {
          await assetModel3dService.convert(selectedAssetId, uploadedModel.id_model_3d);
        } catch {
          toast("Model tersimpan, tetapi antrean konversi belum dapat dimulai");
        }
      }
      await fetchModels(selectedAssetId, uploadedModel?.id_model_3d);
    } catch (error) {
      toast.error(errorMessage(error, "Gagal mengunggah model 3D"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConvert = async (modelId) => {
    setConvertingModelId(modelId);
    try {
      const response = await assetModel3dService.convert(selectedAssetId, modelId);
      toast.success(response.data?.message || "Model masuk antrean konversi");
      await fetchModels(selectedAssetId, modelId);
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

  const saveMetadata = async () => {
    if (!selectedModel || !canUpdate) return;

    setSavingMetadata(true);
    try {
      const response = await assetModel3dService.update(
        selectedAssetId,
        selectedModel.id_model_3d,
        metadata,
      );
      toast.success(response.data?.message || "Metadata model 3D berhasil disimpan");
      await fetchModels(selectedAssetId, selectedModel.id_model_3d);
    } catch (error) {
      toast.error(errorMessage(error, "Gagal menyimpan metadata model 3D"));
    } finally {
      setSavingMetadata(false);
    }
  };

  const handleArchive = async (model) => {
    if (!canUpdate) return;
    const modelName = model.manifest?.display_name || model.original_name || `versi ${model.version}`;
    const confirmed = await confirm({
      title: "Arsipkan Model 3D",
      message: `Model "${modelName}" akan dihapus dari katalog aktif. Riwayat dan audit tetap tersimpan.`,
      confirmText: "Arsipkan",
      variant: "danger",
    });
    if (!confirmed) return;

    setDeletingModelId(model.id_model_3d);
    try {
      const response = await assetModel3dService.archive(selectedAssetId, model.id_model_3d);
      toast.success(response.data?.message || "Model 3D berhasil diarsipkan");
      await fetchModels(selectedAssetId, response.data?.activated_model_id);
    } catch (error) {
      toast.error(errorMessage(error, "Gagal mengarsipkan model 3D"));
    } finally {
      setDeletingModelId(null);
    }
  };

  const updateRoom = (roomId, field, value) => {
    setRooms((current) => current.map((room) => (
      room.id === roomId ? { ...room, [field]: value } : room
    )));
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

  const previewModel = selectedModel
    ? {
        ...selectedModel,
        conversion_status: selectedModel.is_active ? selectedModel.conversion_status : "preview",
      }
    : null;
  const previewAsset = selectedAsset
    ? { ...selectedAsset, active_model_3d: previewModel }
    : null;

  return (
    <div className="min-h-full bg-surface-secondary p-4 md:p-6">
      <div className="mx-auto max-w-[1800px] space-y-5">
        <header className="relative overflow-hidden rounded-2xl border border-border bg-surface px-5 py-5 shadow-sm md:px-6">
          <div className="absolute inset-y-0 right-0 w-72 bg-gradient-to-l from-violet-500/10 to-transparent" />
          <div className="relative flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-sky-500 text-white shadow-lg shadow-violet-500/20">
                <CubeIcon size={25} weight="duotone" />
              </span>
              <div>
                <h1 className="text-xl font-black text-text-primary md:text-2xl">Kelola 3D</h1>
                <p className="mt-1 max-w-3xl text-xs leading-relaxed text-text-muted">
                  Sinkronkan kode aset dari Pusat Data, kelola versi model KMZ, metadata ruang, dan preview peta 3D dalam satu alur.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Aset tersinkron", value: assets.length },
                { label: "Versi model", value: activeModels.length },
                { label: "Daftar ruang", value: rooms.length },
              ].map((item) => (
                <div key={item.label} className="min-w-24 rounded-xl border border-border bg-surface-secondary px-3 py-2 text-center">
                  <p className="text-lg font-black leading-none text-text-primary">{item.value}</p>
                  <p className="mt-1 text-[8px] font-bold uppercase tracking-wide text-text-muted">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="space-y-5">
          <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <SectionTitle
              icon={StackIcon}
              title="Pilih Aset untuk Dikelola"
              description="Mulai dari kode aset yang tersinkron dari Pusat Data Aset"
              action={(
                <button type="button" onClick={() => fetchAssets(assetSearch)} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-secondary hover:text-accent focus-visible:ring-2 focus-visible:ring-accent" aria-label="Sinkronkan ulang aset">
                  <ArrowsClockwiseIcon size={16} weight="bold" className={assetsLoading ? "animate-spin" : ""} />
                </button>
              )}
            />
            <div className="grid gap-4 p-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
              <div className="rounded-2xl bg-surface-secondary/70 p-4">
                <span className="inline-flex rounded-full bg-accent/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-accent">Langkah 1</span>
                <h2 className="mt-3 text-sm font-black text-text-primary">Temukan kode aset</h2>
                <p className="mt-1 text-[10px] leading-relaxed text-text-muted">Cari berdasarkan kode, nama, atau lokasi. Pilihan aset menentukan model, daftar ruang, dan preview yang ditampilkan.</p>
                <label className="relative mt-4 block">
                  <span className="sr-only">Cari kode atau nama aset</span>
                  <MagnifyingGlassIcon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="search"
                    value={assetSearch}
                    onChange={(event) => setAssetSearch(event.target.value)}
                    placeholder="Cari kode atau nama…"
                    className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-xs font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
                  />
                </label>
                <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2.5">
                  <span className="text-[9px] font-semibold text-text-muted">Hasil tersinkron</span>
                  <span className="text-xs font-black text-text-primary">{assets.length} aset</span>
                </div>
              </div>

              <div className="min-w-0">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black text-text-primary">Daftar aset</p>
                    <p className="mt-0.5 text-[9px] text-text-muted">Pilih satu kartu untuk membuka area pengelolaan.</p>
                  </div>
                  {selectedAsset && (
                    <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[8px] font-black text-emerald-700 sm:inline-flex dark:bg-emerald-500/10 dark:text-emerald-300">
                      <CheckCircleIcon size={12} weight="fill" /> 1 aset dipilih
                    </span>
                  )}
                </div>
                <div className="grid max-h-[22rem] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 dark:[color-scheme:dark]">
                {assetsLoading ? (
                  [1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-32 animate-pulse rounded-xl bg-surface-secondary" />)
                ) : assets.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center sm:col-span-2 xl:col-span-3 2xl:col-span-4">
                    <BuildingsIcon size={23} className="mx-auto text-text-muted" />
                    <p className="mt-2 text-[10px] font-bold text-text-secondary">Aset tidak ditemukan</p>
                  </div>
                ) : assets.map((asset) => {
                  const assetId = asset.id_aset || asset.id;
                  const selected = String(assetId) === String(selectedAssetId);
                  const has3d = Boolean(asset.active_model_3d || asset.model_3d_lod || asset.building_footprint);
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
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${selected ? "bg-accent text-white" : "bg-surface-secondary text-text-muted group-hover:text-accent"}`}>
                          <BuildingsIcon size={16} weight={selected ? "fill" : "duotone"} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] font-black text-text-primary">{asset.kode_aset || "Tanpa kode aset"}</span>
                          <span className="mt-0.5 block truncate text-[9px] font-semibold text-text-secondary">{asset.nama_aset || "Nama aset belum diisi"}</span>
                        </span>
                      </div>
                      <span className="mt-3 flex items-center gap-1 truncate text-[8px] text-text-muted"><MapPinIcon size={10} /> {asset.lokasi || asset.desa_kelurahan || "Lokasi belum diisi"}</span>
                      <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[7px] font-black uppercase tracking-wide ${has3d ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300" : "bg-surface-secondary text-text-muted"}`}>
                        <CubeIcon size={10} weight={has3d ? "fill" : "regular"} /> {has3d ? "Data 3D tersedia" : "Belum ada data 3D"}
                      </span>
                      {selected && <CheckCircleIcon size={17} weight="fill" className="absolute right-2.5 top-2.5 text-accent" />}
                    </button>
                  );
                })}
                </div>
              </div>
            </div>
          </section>

          {selectedAsset && (
            <div className="flex flex-col gap-3 rounded-2xl border border-accent/20 bg-gradient-to-r from-accent/10 via-surface to-violet-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-sm"><BuildingsIcon size={19} weight="fill" /></span>
                <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase tracking-[0.14em] text-accent">Langkah 2 · Aset terpilih</p>
                  <p className="mt-1 truncate text-sm font-black text-text-primary">{selectedAsset.kode_aset || "Tanpa kode"} · {selectedAsset.nama_aset || "Nama aset belum diisi"}</p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[9px] text-text-muted"><MapPinIcon size={11} /> {selectedAsset.lokasi || selectedAsset.desa_kelurahan || "Lokasi belum diisi"}</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedAssetId(null)} className="h-9 rounded-xl border border-border bg-surface px-3 text-[9px] font-extrabold text-text-secondary transition hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent">Ganti aset</button>
            </div>
          )}

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(32rem,0.95fr)]">
          <div className="space-y-4">
            <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              <SectionTitle
                icon={UploadSimpleIcon}
                title="Import Model 3D"
                description={selectedAsset ? `${selectedAsset.kode_aset} · ${selectedAsset.nama_aset}` : "Pilih aset terlebih dahulu"}
              />
              <div className="space-y-3 p-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".kmz,application/vnd.google-earth.kmz"
                  className="hidden"
                  onChange={(event) => handleUpload(event.target.files?.[0])}
                />
                <button
                  type="button"
                  disabled={!selectedAsset || !canUpdate || uploading}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleUpload(event.dataTransfer.files?.[0]);
                  }}
                  className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50/60 px-4 py-6 text-center transition hover:border-violet-500 hover:bg-violet-50 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-violet-500/40 dark:bg-violet-500/10"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-500/20">
                    {uploading ? <ArrowsClockwiseIcon size={21} className="animate-spin" /> : <FileArrowUpIcon size={21} weight="duotone" />}
                  </span>
                  <span className="mt-3 text-xs font-black text-violet-800 dark:text-violet-200">{uploading ? "Mengunggah dan memvalidasi…" : "Pilih atau jatuhkan file KMZ"}</span>
                  <span className="mt-1 text-[9px] text-violet-700/70 dark:text-violet-300/70">Maksimal 50 MB · versi baru otomatis menjadi aktif</span>
                </button>
                {!canUpdate && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[9px] font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                    Akun Anda memiliki akses lihat saja. Import, edit, arsip, dan perubahan ruang memerlukan izin pembaruan aset.
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-text-muted">Riwayat versi model</p>
                    {modelsLoading && <ArrowsClockwiseIcon size={13} className="animate-spin text-text-muted" />}
                  </div>
                  {activeModels.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-4 text-center text-[10px] text-text-muted">Belum ada model 3D untuk aset ini.</div>
                  ) : activeModels.map((model) => {
                    const selected = String(model.id_model_3d) === String(selectedModel?.id_model_3d);
                    const status = statusConfig(model);
                    return (
                      <article
                        key={model.id_model_3d}
                        className={`w-full rounded-xl border p-3 transition ${selected ? "border-violet-300 bg-violet-50/70 dark:border-violet-500/40 dark:bg-violet-500/10" : "border-border hover:bg-surface-secondary"}`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedModelId(model.id_model_3d);
                            setPreviewRevision((value) => value + 1);
                          }}
                          className="flex w-full items-center gap-2.5 text-left focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-violet-500"
                        >
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${selected ? "bg-violet-600 text-white" : "bg-surface-secondary text-text-muted"}`}>
                            <CubeIcon size={17} weight="duotone" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-[10px] font-black text-text-primary">
                                Versi {model.version} · {model.manifest?.display_name || model.original_name}
                              </span>
                              {model.is_active && <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[7px] font-black uppercase text-white">Aktif</span>}
                            </span>
                            <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[8px] font-bold ${status.className}`}>{status.label}</span>
                          </span>
                        </button>
                        {selected && canUpdate && (
                          <div className="mt-2.5 flex flex-wrap gap-2 border-t border-border pt-2.5">
                            {!model.is_active && (
                              <button
                                type="button"
                                onClick={() => handleActivate(model.id_model_3d)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[8px] font-extrabold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300"
                              >
                                <CheckCircleIcon size={11} weight="fill" /> Aktifkan
                              </button>
                            )}
                            {model.conversion_status !== "ready" && (
                              <button
                                type="button"
                                onClick={() => handleConvert(model.id_model_3d)}
                                className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1.5 text-[8px] font-extrabold text-sky-700 hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-300"
                              >
                                <ArrowsClockwiseIcon size={11} className={convertingModelId === model.id_model_3d ? "animate-spin" : ""} /> Konversi GLB
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={deletingModelId === model.id_model_3d}
                              onClick={() => handleArchive(model)}
                              className="ml-auto inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-[8px] font-extrabold text-red-700 transition hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-500/10 dark:text-red-300"
                            >
                              {deletingModelId === model.id_model_3d
                                ? <ArrowsClockwiseIcon size={11} className="animate-spin" />
                                : <TrashIcon size={11} weight="bold" />}
                              Arsipkan
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              <SectionTitle
                icon={CubeIcon}
                title="Detail Model 3D"
                description={selectedModel ? `Edit identitas dan transformasi model versi ${selectedModel.version}` : "Pilih model untuk melihat detail"}
              />
              <div className="p-4">
                {!selectedModel ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center">
                    <CubeIcon size={24} className="mx-auto text-text-muted" />
                    <p className="mt-2 text-[10px] font-bold text-text-secondary">Belum ada model yang dipilih</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="block sm:col-span-2">
                        <span className="mb-1 block text-[8px] font-extrabold uppercase tracking-wide text-text-muted">Nama model</span>
                        <input
                          type="text"
                          maxLength={150}
                          value={metadata.display_name}
                          disabled={!canUpdate}
                          onChange={(event) => setMetadata((current) => ({ ...current, display_name: event.target.value }))}
                          placeholder={selectedModel.original_name}
                          className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-[10px] font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-70"
                        />
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="mb-1 block text-[8px] font-extrabold uppercase tracking-wide text-text-muted">Deskripsi</span>
                        <textarea
                          rows={2}
                          maxLength={1000}
                          value={metadata.description}
                          disabled={!canUpdate}
                          onChange={(event) => setMetadata((current) => ({ ...current, description: event.target.value }))}
                          placeholder="Keterangan sumber, survei, atau fungsi model"
                          className="w-full resize-none rounded-lg border border-border bg-surface px-2.5 py-2 text-[10px] font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-70"
                        />
                      </label>
                      {[
                        { key: "location_lat", label: "Latitude", min: -90, max: 90, step: "0.00000001" },
                        { key: "location_long", label: "Longitude", min: -180, max: 180, step: "0.00000001" },
                        { key: "altitude_m", label: "Ketinggian (m)", min: -10000, max: 100000, step: "0.001" },
                        { key: "heading", label: "Heading (°)", min: -360, max: 360, step: "0.00001" },
                        { key: "tilt", label: "Tilt (°)", min: -180, max: 180, step: "0.00001" },
                        { key: "roll", label: "Roll (°)", min: -360, max: 360, step: "0.00001" },
                        { key: "scale_x", label: "Skala X", min: 0.000001, max: 10000, step: "0.000001" },
                        { key: "scale_y", label: "Skala Y", min: 0.000001, max: 10000, step: "0.000001" },
                        { key: "scale_z", label: "Skala Z", min: 0.000001, max: 10000, step: "0.000001" },
                      ].map((field) => (
                        <label key={field.key} className="block">
                          <span className="mb-1 block text-[8px] font-extrabold uppercase tracking-wide text-text-muted">{field.label}</span>
                          <input
                            type="number"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={metadata[field.key]}
                            disabled={!canUpdate}
                            onChange={(event) => setMetadata((current) => ({ ...current, [field.key]: event.target.value }))}
                            className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-[10px] font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-70"
                          />
                        </label>
                      ))}
                    </div>
                    {canUpdate && (
                      <button
                        type="button"
                        disabled={savingMetadata}
                        onClick={saveMetadata}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-[10px] font-extrabold text-white shadow-sm transition hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingMetadata
                          ? <ArrowsClockwiseIcon size={15} className="animate-spin" />
                          : <FloppyDiskIcon size={15} weight="bold" />}
                        {savingMetadata ? "Menyimpan metadata…" : "Simpan Detail Model"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              <SectionTitle
                icon={TableIcon}
                title="Daftar Ruang 3D"
                description={selectedModel ? `Tersimpan pada metadata model versi ${selectedModel.version}` : "Import atau pilih model untuk mengatur ruang"}
                action={canUpdate && selectedModel ? (
                  <button type="button" onClick={() => setRooms((current) => [...current, emptyRoom()])} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-2.5 text-[9px] font-extrabold text-white hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent">
                    <PlusIcon size={12} weight="bold" /> Tambah
                  </button>
                ) : null}
              />
              <div className="p-4">
                {!selectedModel ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center">
                    <TableIcon size={24} className="mx-auto text-text-muted" />
                    <p className="mt-2 text-[10px] font-bold text-text-secondary">Belum ada model yang dipilih</p>
                  </div>
                ) : rooms.length === 0 ? (
                  <button
                    type="button"
                    disabled={!canUpdate}
                    onClick={() => setRooms([emptyRoom()])}
                    className="w-full rounded-xl border border-dashed border-border p-6 text-center transition hover:border-accent hover:bg-accent/5 disabled:cursor-default"
                  >
                    <PlusIcon size={23} className="mx-auto text-text-muted" />
                    <p className="mt-2 text-[10px] font-bold text-text-secondary">Belum ada daftar ruang</p>
                    <p className="mt-1 text-[9px] text-text-muted">{canUpdate ? "Klik untuk menambahkan ruang pertama." : "Data ruang belum tersedia."}</p>
                  </button>
                ) : (
                  <div className="space-y-2.5">
                    {rooms.map((room, index) => (
                      <div key={room.id} className="rounded-xl border border-border bg-surface-secondary/60 p-3">
                        <div className="mb-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-[9px] font-black text-accent">{index + 1}</span>
                            <p className="text-[10px] font-extrabold text-text-primary">{room.name || "Ruang baru"}</p>
                          </div>
                          {canUpdate && (
                            <button type="button" onClick={() => setRooms((current) => current.filter((item) => item.id !== room.id))} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-500/10" aria-label={`Hapus ${room.name || `ruang ${index + 1}`}`}>
                              <TrashIcon size={13} weight="bold" />
                            </button>
                          )}
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {[
                            { key: "name", label: "Nama ruang", placeholder: "Contoh: Ruang Rapat" },
                            { key: "unit_code", label: "Kode unit", placeholder: "Contoh: RR-201" },
                            { key: "floor", label: "Lantai", placeholder: "Contoh: 2" },
                            { key: "area_m2", label: "Luas (m²)", placeholder: "0", type: "number" },
                            { key: "usage", label: "Penggunaan", placeholder: "Contoh: Ruang kerja" },
                            { key: "notes", label: "Catatan", placeholder: "Keterangan tambahan" },
                          ].map((field) => (
                            <label key={field.key} className="block">
                              <span className="mb-1 block text-[8px] font-extrabold uppercase tracking-wide text-text-muted">{field.label}</span>
                              <input
                                type={field.type || "text"}
                                min={field.type === "number" ? "0" : undefined}
                                step={field.type === "number" ? "0.01" : undefined}
                                value={room[field.key]}
                                disabled={!canUpdate}
                                onChange={(event) => updateRoom(room.id, field.key, event.target.value)}
                                placeholder={field.placeholder}
                                className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-[10px] font-semibold text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-70"
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    {canUpdate && (
                      <button type="button" disabled={savingRooms} onClick={saveRooms} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-[10px] font-extrabold text-white shadow-sm transition hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
                        {savingRooms ? <ArrowsClockwiseIcon size={15} className="animate-spin" /> : <FloppyDiskIcon size={15} weight="bold" />}
                        {savingRooms ? "Menyimpan daftar ruang…" : "Simpan Daftar Ruang"}
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
              title="Preview Peta 3D"
              description={selectedAsset ? `${selectedAsset.kode_aset} · ${selectedModel ? `model versi ${selectedModel.version}` : "bangunan LOD"}` : "Pilih aset untuk melihat preview"}
              action={selectedAsset ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFlyToRequest({
                      assetId: selectedAssetId,
                      token: `${selectedAssetId}-${Date.now()}`,
                    })}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-2.5 text-[9px] font-extrabold text-white shadow-sm transition hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                    aria-label={`Arahkan kamera ke model 3D ${selectedAsset.kode_aset}`}
                  >
                    <CrosshairIcon size={13} weight="bold" />
                    Fly to 3D
                  </button>
                  <button type="button" onClick={() => setPreviewRevision((value) => value + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-secondary hover:text-accent focus-visible:ring-2 focus-visible:ring-accent" aria-label="Muat ulang preview">
                    <ArrowsClockwiseIcon size={15} weight="bold" />
                  </button>
                </div>
              ) : null}
            />
            <div className="p-3">
              <div className="relative h-[min(68vh,720px)] min-h-[430px] overflow-hidden rounded-xl border border-border bg-slate-950">
                {previewAsset ? (
                  <AssetMapDisplay
                    key={`${selectedAssetId}-${selectedModel?.id_model_3d || "lod"}-${previewRevision}`}
                    assets={[previewAsset]}
                    allAssets={[previewAsset]}
                    mode="integrated"
                    initialAsset3dMode
                    showAsset3dToolbar={false}
                    highlightAssetId={selectedAssetId}
                    highlightRequestKey={`kelola-3d-${selectedAssetId}-${previewRevision}`}
                    focus3dRequestKey={flyToRequest?.assetId === selectedAssetId ? flyToRequest.token : null}
                    showControls={false}
                    activeLayer="bidang"
                    showMarkers
                    showPolygons
                    showKelurahan
                    showKecamatan
                    showSudahSertifikat
                    showBelumSertifikat
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                    <CubeIcon size={38} weight="duotone" className="text-slate-500" />
                    <p className="mt-3 text-sm font-black text-white">Preview belum tersedia</p>
                    <p className="mt-1 max-w-sm text-[10px] leading-relaxed text-slate-400">Pilih kode aset dari daftar tersinkron untuk menampilkan lokasi, footprint, atau model 3D.</p>
                  </div>
                )}
                {selectedAsset && !selectedModel && !selectedAsset.building_footprint && (
                  <div className="absolute bottom-3 left-3 right-3 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-slate-950/85 p-3 text-amber-200 backdrop-blur">
                    <WarningCircleIcon size={16} weight="fill" className="mt-0.5 shrink-0" />
                    <p className="text-[9px] leading-relaxed">Aset ini belum memiliki model KMZ maupun footprint bangunan. Import model untuk mengaktifkan preview 3D.</p>
                  </div>
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-surface-secondary px-2 py-2 text-center">
                  <p className="text-[9px] font-black text-text-primary">{selectedModel?.model_type || selectedAsset?.model_3d_lod || "—"}</p>
                  <p className="mt-0.5 text-[7px] font-bold uppercase text-text-muted">Format/LOD</p>
                </div>
                <div className="rounded-lg bg-surface-secondary px-2 py-2 text-center">
                  <p className="text-[9px] font-black text-text-primary">{selectedModel?.conversion_status || "—"}</p>
                  <p className="mt-0.5 text-[7px] font-bold uppercase text-text-muted">Status</p>
                </div>
                <div className="rounded-lg bg-surface-secondary px-2 py-2 text-center">
                  <p className="text-[9px] font-black text-text-primary">{rooms.length}</p>
                  <p className="mt-0.5 text-[7px] font-bold uppercase text-text-muted">Ruang</p>
                </div>
              </div>
            </div>
          </section>
          </div>
        </div>
      </div>
    </div>
  );
}
