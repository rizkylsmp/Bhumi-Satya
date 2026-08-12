import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { uploadService } from "../../services/api";
import FormInput from "../form/FormInput";
import FormSelect from "../form/FormSelect";
import FormTextarea from "../form/FormTextarea";
import FormFileUpload from "../form/FormFileUpload";
import AssetCoordinatePicker from "../map/AssetCoordinatePicker";
import AssetPolygonDrawer from "../map/AssetPolygonDrawer";
import { extractGeojsonPolygonPoints as parseGeojsonPolygonPoints } from "../../utils/geojsonExport";
import { formatNumberWithOptions } from "../../utils/format";
import {
  ClipboardTextIcon,
  ScalesIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  XIcon,
  FloppyDiskIcon,
  CircleNotchIcon,
  BuildingsIcon,
  ArrowLeftIcon,
  UploadSimpleIcon,
  FileTextIcon,
  CheckCircleIcon,
  ReceiptIcon,
} from "@phosphor-icons/react";

// Section Header component - moved outside to prevent re-creation on every render
const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-3 pb-3 mb-4 border-b border-border">
    <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center">
      <Icon size={18} weight="duotone" className="text-accent" />
    </div>
    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
      {title}
    </h3>
  </div>
);

const Building3dFields = ({
  formData,
  onChange,
  modelFile,
  onModelImport,
}) => {
  const [active3dSubtab, setActive3dSubtab] = useState("model");
  return (
    <fieldset className="space-y-5">
      <legend className="sr-only">
        Data Bangunan 3D
      </legend>

      <div
        role="tablist"
        aria-label="Bagian data bangunan 3D"
        className="inline-flex w-full gap-1 rounded-xl border border-border bg-surface p-1 sm:w-auto"
      >
        <button
          type="button"
          id="building3d-tab-model"
          role="tab"
          aria-controls="building3d-panel-model"
          aria-selected={active3dSubtab === "model"}
          tabIndex={active3dSubtab === "model" ? 0 : -1}
          onClick={() => setActive3dSubtab("model")}
          className={`flex-1 rounded-lg px-4 py-2 text-xs font-bold transition sm:flex-none ${
            active3dSubtab === "model"
              ? "bg-accent text-surface"
              : "text-text-muted hover:bg-surface-secondary hover:text-text-primary"
          }`}
        >
          Data Model
        </button>
        <button
          type="button"
          id="building3d-tab-lod"
          role="tab"
          aria-controls="building3d-panel-lod"
          aria-selected={active3dSubtab === "lod"}
          tabIndex={active3dSubtab === "lod" ? 0 : -1}
          onClick={() => setActive3dSubtab("lod")}
          className={`flex-1 rounded-lg px-4 py-2 text-xs font-bold transition sm:flex-none ${
            active3dSubtab === "lod"
              ? "bg-accent text-surface"
              : "text-text-muted hover:bg-surface-secondary hover:text-text-primary"
          }`}
        >
          LOD & Metadata
        </button>
      </div>

      <div
        id="building3d-panel-model"
        role="tabpanel"
        aria-labelledby="building3d-tab-model"
        hidden={active3dSubtab !== "model"}
        className="space-y-5"
      >
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">
            {modelFile ? modelFile.name : "Belum ada file model KMZ baru"}
          </p>
          <p className="text-xs text-text-muted">
            KMZ akan diperiksa dan diunggah sebagai versi baru setelah aset disimpan.
          </p>
          {modelFile && (
            <p className="mt-1 text-xs font-medium text-accent" aria-live="polite">
              {formatNumberWithOptions(modelFile.size / 1024, {
                maximumFractionDigits: 1,
              })} KB · KMZ
            </p>
          )}
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-surface-secondary px-4 py-2.5 text-sm font-semibold text-text-primary transition hover:border-accent/40 hover:bg-accent/5 hover:text-accent focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2">
          <UploadSimpleIcon size={16} weight="bold" />
          Pilih Model KMZ
          <input
            type="file"
            accept=".kmz,application/vnd.google-earth.kmz,application/zip"
            onChange={onModelImport}
            className="sr-only"
            aria-describedby="kmz-upload-help"
          />
        </label>
        <span id="kmz-upload-help" className="sr-only">
          Maksimum 50 megabita. File harus berisi KML dan model DAE, GLB, atau glTF.
        </span>
        </div>
      </div>

      <div
        id="building3d-panel-lod"
        role="tabpanel"
        aria-labelledby="building3d-tab-lod"
        hidden={active3dSubtab !== "lod"}
        className="space-y-4"
      >
        <p className="mb-4 text-xs font-bold uppercase tracking-wide text-text-muted">
          LOD dan metadata bangunan
        </p>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <FormInput label="Tinggi (m)" name="building_height_m" type="number" min="0.1" max="1000" step="0.01" value={formData.building_height_m} onChange={onChange} size="lg" />
        <FormInput label="Jumlah Lantai" name="building_floors" type="number" min="1" max="300" step="1" value={formData.building_floors} onChange={onChange} size="lg" />
        <FormInput label="Elevasi Dasar (m)" name="building_base_elevation_m" type="number" min="-500" max="10000" step="0.01" value={formData.building_base_elevation_m} onChange={onChange} size="lg" />
        <FormSelect label="Sumber Tinggi" name="building_height_source" value={formData.building_height_source} onChange={onChange} placeholder="Pilih sumber" options={[
          { value: "survey", label: "Survei Lapangan" }, { value: "lidar", label: "LiDAR" },
          { value: "photogrammetry", label: "Fotogrametri/Drone" }, { value: "document", label: "Dokumen Resmi" },
          { value: "floor_estimate", label: "Turunan Jumlah Lantai" }, { value: "model_3d", label: "Metadata Model 3D" },
          { value: "other", label: "Sumber Lain" },
        ]} size="lg" />
        <FormSelect label="Kualitas" name="building_height_quality" value={formData.building_height_quality} onChange={onChange} placeholder="Pilih kualitas" options={[
          { value: "measured", label: "Terukur" }, { value: "derived", label: "Hasil Turunan" },
          { value: "estimated", label: "Estimasi" },
        ]} size="lg" />
        <FormSelect label="Level of Detail" name="model_3d_lod" value={formData.model_3d_lod} onChange={onChange} placeholder="Pilih LOD" options={[
          { value: "LOD0", label: "LOD0 - Sederhana" }, { value: "LOD1", label: "LOD1 - Blok" },
          { value: "LOD2", label: "LOD2 - Bentuk Atap" },
        ]} size="lg" />
        <FormInput label="CRS Sumber" name="model_3d_source_crs" value={formData.model_3d_source_crs} onChange={onChange} placeholder="EPSG:32749" size="lg" />
        <FormInput label="Tanggal Perekaman" name="model_3d_recorded_at" type="date" value={formData.model_3d_recorded_at} onChange={onChange} size="lg" />
          <FormInput label="Akurasi (m)" name="model_3d_accuracy_m" type="number" min="0.001" max="1000" step="0.001" value={formData.model_3d_accuracy_m} onChange={onChange} size="lg" />
        </div>
      </div>
    </fieldset>
  );
};

const TaxFields = ({ formData, onChange }) => (
  <div className="space-y-5">
    <SectionHeader icon={ReceiptIcon} title="Data Pajak" />

    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
        Identitas Objek Pajak
      </p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <FormInput
          label="FID"
          name="pajak_fid"
          type="number"
          min="0"
          step="1"
          placeholder="FID objek pajak"
          value={formData.pajak_fid}
          onChange={onChange}
          size="lg"
        />
        <div className="space-y-2">
          <p className="text-sm font-semibold text-text-primary">
            Status Objek Pajak
          </p>
          <div
            className={`flex min-h-12 items-center rounded-xl border-2 px-4 text-sm font-semibold ${
              formData.nop
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
            }`}
          >
            {formData.nop
              ? "Terverifikasi"
              : "Belum Terdata"}
          </div>
        </div>
        <FormInput
          label="Nomor Objek Pajak (NOP)"
          name="nop"
          placeholder="Belum terdata/bukan objek pajak"
          value={formData.nop}
          onChange={onChange}
          size="lg"
        />
        <FormInput
          label="Nama Wajib Pajak"
          name="nama_wajib_pajak"
          placeholder="Belum terdata/bukan objek pajak"
          value={formData.nama_wajib_pajak}
          onChange={onChange}
          size="lg"
        />
      </div>
    </div>

    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
        Data Bapenda
      </p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <FormInput
          label="Nilai Bumi/Tanah per m² (Rp)"
          name="nilai_bumi_per_m2"
          type="number"
          min="0"
          step="0.01"
          placeholder="0"
          value={formData.nilai_bumi_per_m2}
          onChange={onChange}
          size="lg"
        />
        <FormInput
          label="Nilai Bangunan per m² (Rp)"
          name="nilai_bangunan_per_m2"
          type="number"
          min="0"
          step="0.01"
          placeholder="0"
          value={formData.nilai_bangunan_per_m2}
          onChange={onChange}
          size="lg"
        />
        <FormInput
          label="Luas Bumi/Tanah Bapenda (m²)"
          name="luas_bumi_bapenda"
          type="number"
          min="0"
          step="0.01"
          placeholder="0"
          value={formData.luas_bumi_bapenda}
          onChange={onChange}
          size="lg"
        />
        <FormInput
          label="Luas Bangunan Bapenda (m²)"
          name="luas_bangunan_bapenda"
          type="number"
          min="0"
          step="0.01"
          placeholder="0"
          value={formData.luas_bangunan_bapenda}
          onChange={onChange}
          size="lg"
        />
      </div>
    </div>

    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
        Hasil Pemetaan
      </p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <FormInput
          label="Luas Bumi/Tanah Pemetaan (m²)"
          name="luas_bumi_pemetaan"
          type="number"
          min="0"
          step="0.01"
          placeholder="0"
          value={formData.luas_bumi_pemetaan}
          onChange={onChange}
          size="lg"
        />
        <FormInput
          label="Luas Bangunan Pemetaan (m²)"
          name="luas_bangunan_pemetaan"
          type="number"
          min="0"
          step="0.01"
          placeholder="0"
          value={formData.luas_bangunan_pemetaan}
          onChange={onChange}
          size="lg"
        />
        <FormInput
          label="NJOP Bumi Pemetaan (Rp)"
          name="njop_bumi_pemetaan"
          type="number"
          min="0"
          step="0.01"
          placeholder="0"
          value={formData.njop_bumi_pemetaan}
          onChange={onChange}
          size="lg"
        />
        <FormInput
          label="NJOP Bangunan Pemetaan (Rp)"
          name="njop_bangunan_pemetaan"
          type="number"
          min="0"
          step="0.01"
          placeholder="0"
          value={formData.njop_bangunan_pemetaan}
          onChange={onChange}
          size="lg"
        />
        <FormInput
          label="Pajak Bumi & Bangunan Pemetaan (Rp)"
          name="pbb_pemetaan"
          type="number"
          min="0"
          step="0.01"
          placeholder="0"
          value={formData.pbb_pemetaan}
          onChange={onChange}
          size="lg"
        />
        <FormInput
          label="Volume Bangunan (m³)"
          name="volume_bangunan"
          type="number"
          min="0"
          step="0.01"
          placeholder="0"
          value={formData.volume_bangunan}
          onChange={onChange}
          size="lg"
        />
        <FormInput
          label="Tinggi Bangunan (meter)"
          name="tinggi_bangunan"
          type="number"
          min="0"
          step="0.01"
          placeholder="0"
          value={formData.tinggi_bangunan}
          onChange={onChange}
          size="lg"
        />
      </div>
    </div>
  </div>
);

const toNullableNumber = (value) =>
  value === "" || value === null || value === undefined ? null : Number(value);

const initialFormData = {
  kode_aset: "",
  nama_aset: "",
  lokasi: "",
  koordinat_lat: "",
  koordinat_long: "",
  luas: "",
  status: "Aktif",
  jenis_masalah: "",
  jenis_aset: "",
  tahun_perolehan: new Date().getFullYear().toString(),
  nomor_sertifikat: "",
  status_sertifikat: "",
  nilai_aset: "",
  foto_aset: null,
  dokumen_pendukung: null,
  keterangan: "",
  // Data Legal
  jenis_hak: "",
  kw: "",
  atas_nama: "",
  tanggal_sertifikat: "",
  riwayat_perolehan: "",
  status_hukum: "",
  // Data Fisik
  kecamatan: "",
  desa_kelurahan: "",
  luas_lapangan: "",
  batas_utara: "",
  batas_selatan: "",
  batas_timur: "",
  batas_barat: "",
  penggunaan_saat_ini: "",
  // Data Administratif
  kode_bmd: "",
  nilai_buku: "",
  nilai_njop: "",
  sk_penetapan: "",
  opd_pengguna: "",
  nibar: "",
  id_pemda: "",
  kode_barang: "",
  no_register: "",
  luas_kib: "",
  harga_perolehan: "",
  penggunaan_kib: "",
  tanggal_scan: "",
  notes: "",
  plotting_status: "",
  // Data Pajak
  pajak_fid: "",
  pajak_status: "",
  nop: "",
  nama_wajib_pajak: "",
  nilai_bumi_per_m2: "",
  nilai_bangunan_per_m2: "",
  luas_bumi_bapenda: "",
  luas_bangunan_bapenda: "",
  luas_bumi_pemetaan: "",
  luas_bangunan_pemetaan: "",
  njop_bumi_pemetaan: "",
  njop_bangunan_pemetaan: "",
  pbb_pemetaan: "",
  volume_bangunan: "",
  tinggi_bangunan: "",
  // Data Spasial
  polygon_bidang: null,
  building_height_m: "",
  building_base_elevation_m: "",
  building_floors: "",
  building_height_source: "",
  building_height_quality: "",
  model_3d_lod: "",
  model_3d_source_crs: "",
  model_3d_recorded_at: "",
  model_3d_accuracy_m: "",
};

const buildInitialFormData = () => ({ ...initialFormData });

const areSamePoint = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  return (
    Math.abs(Number(a[0]) - Number(b[0])) < 1e-9 &&
    Math.abs(Number(a[1]) - Number(b[1])) < 1e-9
  );
};

const removeClosingPoint = (points) => {
  if (!Array.isArray(points) || points.length < 2) return points || [];
  return areSamePoint(points[0], points[points.length - 1])
    ? points.slice(0, -1)
    : points;
};

const getPolygonPointCount = (polygon) => {
  if (!Array.isArray(polygon)) return 0;
  return removeClosingPoint(polygon).length;
};

const getPolygonCentroid = (polygon) => {
  const points = removeClosingPoint(polygon);
  if (!Array.isArray(points) || points.length < 3) return null;

  const validPoints = points
    .map((point) => {
      const lat = Number(point?.[0]);
      const lng = Number(point?.[1]);
      return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    })
    .filter(Boolean);

  if (validPoints.length < 3) return null;

  const total = validPoints.reduce(
    (sum, point) => ({
      lat: sum.lat + point.lat,
      lng: sum.lng + point.lng,
    }),
    { lat: 0, lng: 0 },
  );

  return {
    lat: total.lat / validPoints.length,
    lng: total.lng / validPoints.length,
  };
};

const deriveCertificateStatus = (nomorSertifikat) => {
  const value = String(nomorSertifikat || "").trim();
  return value.length > 10 ? "Telah Bersertifikat" : "Belum Bersertifikat";
};

export default function AssetFormModal({
  isOpen,
  onClose,
  onSubmit,
  assetData = null,
  isSubmitting = false,
  activeSubstansi = null,
  activeSection = null,
  onSectionChange,
  presentation = "modal",
}) {
  const isPage = presentation === "page";
  const isFullForm = !activeSubstansi;
  const isCreateMode = isFullForm && !assetData;
  const isLegacyCompactForm = false;

  const [formData, setFormData] = useState(() =>
    buildInitialFormData(),
  );
  const [polygonImportFileName, setPolygonImportFileName] = useState("");
  const [polygonImportVersion, setPolygonImportVersion] = useState(0);
  const [model3dFile, setModel3dFile] = useState(null);

  // Update form when assetData changes (for edit mode)
  useEffect(() => {
    if (assetData) {
      setFormData({
        kode_aset: assetData.kode_aset || "",
        nama_aset: assetData.nama_aset || "",
        lokasi: assetData.lokasi || "",
        koordinat_lat: assetData.koordinat_lat || "",
        koordinat_long: assetData.koordinat_long || "",
        luas: assetData.luas || "",
        status: assetData.status || "",
        jenis_masalah: assetData.jenis_masalah || "",
        jenis_aset: assetData.jenis_aset || "",
        tahun_perolehan:
          assetData.tahun_perolehan || new Date().getFullYear().toString(),
        nomor_sertifikat: assetData.nomor_sertifikat || "",
        status_sertifikat:
          assetData.status_sertifikat ||
          deriveCertificateStatus(assetData.nomor_sertifikat),
        nilai_aset: assetData.nilai_aset || "",
        foto_aset: null,
        dokumen_pendukung: null,
        keterangan: assetData.keterangan || "",
        // Data Legal
        jenis_hak: assetData.jenis_hak || "",
        kw: assetData.kw || "",
        atas_nama:
          assetData.atas_nama || "",
        tanggal_sertifikat: assetData.tanggal_sertifikat || "",
        riwayat_perolehan: assetData.riwayat_perolehan || "",
        status_hukum: assetData.status_hukum || "",
        // Data Fisik
        kecamatan: assetData.kecamatan || "",
        desa_kelurahan: assetData.desa_kelurahan || "",
        luas_lapangan: assetData.luas_lapangan || "",
        batas_utara: assetData.batas_utara || "",
        batas_selatan: assetData.batas_selatan || "",
        batas_timur: assetData.batas_timur || "",
        batas_barat: assetData.batas_barat || "",
        penggunaan_saat_ini: assetData.penggunaan_saat_ini || "",
        // Data Administratif
        kode_bmd: assetData.kode_bmd || "",
        nilai_buku: assetData.nilai_buku || "",
        nilai_njop: assetData.nilai_njop || "",
        sk_penetapan: assetData.sk_penetapan || "",
        opd_pengguna: assetData.opd_pengguna || "",
        nibar: assetData.nibar || "",
        id_pemda: assetData.id_pemda || "",
        kode_barang: assetData.kode_barang || "",
        no_register: assetData.no_register || "",
        luas_kib: assetData.luas_kib || "",
        harga_perolehan: assetData.harga_perolehan || "",
        penggunaan_kib: assetData.penggunaan_kib || "",
        tanggal_scan: assetData.tanggal_scan || "",
        notes: assetData.notes || "",
        plotting_status: assetData.plotting_status || "",
        // Data Pajak
        pajak_fid: assetData.pajak_fid ?? "",
        pajak_status: assetData.pajak_status || "",
        nop: assetData.nop || "",
        nama_wajib_pajak: assetData.nama_wajib_pajak || "",
        nilai_bumi_per_m2: assetData.nilai_bumi_per_m2 ?? "",
        nilai_bangunan_per_m2: assetData.nilai_bangunan_per_m2 ?? "",
        luas_bumi_bapenda: assetData.luas_bumi_bapenda ?? "",
        luas_bangunan_bapenda: assetData.luas_bangunan_bapenda ?? "",
        luas_bumi_pemetaan: assetData.luas_bumi_pemetaan ?? "",
        luas_bangunan_pemetaan: assetData.luas_bangunan_pemetaan ?? "",
        njop_bumi_pemetaan: assetData.njop_bumi_pemetaan ?? "",
        njop_bangunan_pemetaan: assetData.njop_bangunan_pemetaan ?? "",
        pbb_pemetaan: assetData.pbb_pemetaan ?? "",
        volume_bangunan: assetData.volume_bangunan ?? "",
        tinggi_bangunan: assetData.tinggi_bangunan ?? "",
        // Data Spasial
        polygon_bidang: assetData.polygon_bidang || null,
        building_height_m: assetData.building_height_m || "",
        building_base_elevation_m: assetData.building_base_elevation_m || "",
        building_floors: assetData.building_floors || "",
        building_height_source: assetData.building_height_source || "",
        building_height_quality: assetData.building_height_quality || "",
        model_3d_lod: assetData.model_3d_lod || "",
        model_3d_source_crs: assetData.model_3d_source_crs || "",
        model_3d_recorded_at: assetData.model_3d_recorded_at || "",
        model_3d_accuracy_m: assetData.model_3d_accuracy_m || "",
      });
      setPolygonImportFileName("");
      setModel3dFile(null);
    } else {
      setFormData(buildInitialFormData());
      setPolygonImportFileName("");
      setModel3dFile(null);
    }
  }, [assetData, isOpen]);

  const statusSertifikatOptions = [
    { value: "Telah Bersertifikat", label: "Telah Bersertifikat" },
    { value: "Belum Bersertifikat", label: "Belum Bersertifikat" },
  ];

  const jenisHakOptions = [
    { value: "HM", label: "Hak Milik (HM)" },
    { value: "HPL", label: "Hak Pengelolaan (HPL)" },
    { value: "HP", label: "Hak Pakai (HP)" },
    { value: "HGB", label: "Hak Guna Bangunan (HGB)" },
    { value: "Tanah Negara", label: "Tanah Negara" },
    { value: "Belum Bersertifikat", label: "Belum Bersertifikat" },
  ];

  const riwayatPerolehanOptions = [
    { value: "Hibah", label: "Hibah" },
    { value: "Pembelian", label: "Pembelian" },
    { value: "Tukar Menukar", label: "Tukar Menukar" },
    { value: "Penyerahan PSU", label: "Penyerahan PSU" },
    { value: "Lainnya", label: "Lainnya" },
  ];

  const statusHukumOptions = [
    { value: "Aman", label: "Aman" },
    { value: "Sengketa", label: "Sengketa" },
    { value: "Dalam Proses Sertipikasi", label: "Dalam Proses Sertipikasi" },
    { value: "Diblokir", label: "Diblokir / Catatan" },
  ];

  const penggunaanOptions = [
    { value: "Kantor", label: "Kantor" },
    { value: "Sekolah", label: "Sekolah" },
    { value: "Puskesmas", label: "Puskesmas" },
    { value: "Lahan Kosong", label: "Lahan Kosong" },
    { value: "Disewa Pihak Ketiga", label: "Disewa Pihak Ketiga" },
    { value: "Lainnya", label: "Lainnya" },
  ];

  const kecamatanOptions = [
    { value: "Danurejan", label: "Danurejan" },
    { value: "Gedongtengen", label: "Gedongtengen" },
    { value: "Gondokusuman", label: "Gondokusuman" },
    { value: "Gondomanan", label: "Gondomanan" },
    { value: "Jetis", label: "Jetis" },
    { value: "Kotagede", label: "Kotagede" },
    { value: "Kraton", label: "Kraton" },
    { value: "Mantrijeron", label: "Mantrijeron" },
    { value: "Mergangsan", label: "Mergangsan" },
    { value: "Ngampilan", label: "Ngampilan" },
    { value: "Pakualaman", label: "Pakualaman" },
    { value: "Tegalrejo", label: "Tegalrejo" },
    { value: "Umbulharjo", label: "Umbulharjo" },
    { value: "Wirobrajan", label: "Wirobrajan" },
  ];

  const kelurahanByKecamatan = {
    Danurejan: ["Bausasran", "Suryatmajan", "Tegalpanggung"],
    Gedongtengen: ["Pringgokusuman", "Sosromenduran"],
    Gondokusuman: ["Baciro", "Demangan", "Klitren", "Kotabaru", "Terban"],
    Gondomanan: ["Ngupasan", "Prawirodirjan"],
    Jetis: ["Bumijo", "Cokrodiningratan", "Gowongan"],
    Kotagede: ["Prenggan", "Purbayan", "Rejowinangun"],
    Kraton: ["Kadipaten", "Panembahan", "Patehan"],
    Mantrijeron: ["Gedongkiwo", "Mantrijeron", "Suryodiningratan"],
    Mergangsan: ["Brontokusuman", "Keparakan", "Wirogunan"],
    Ngampilan: ["Ngampilan", "Notoprajan"],
    Pakualaman: ["Gunungketur", "Purwokinanti"],
    Tegalrejo: ["Bener", "Karangwaru", "Kricak", "Tegalrejo"],
    Umbulharjo: ["Giwangan", "Muja Muju", "Pandeyan", "Semaki", "Sorosutan", "Tahunan", "Warungboto"],
    Wirobrajan: ["Pakuncen", "Patangpuluhan", "Wirobrajan"],
  };

  const getKelurahanOptions = (kecamatan) => {
    return (kelurahanByKecamatan[kecamatan] || []).map((k) => ({
      value: k,
      label: k,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    } else {
      setFormData((prev) => {
        const updated = { ...prev, [name]: value };
        // Clear jenis_masalah when status changes away from Bermasalah/Indikasi Bermasalah
        if (
          name === "status" &&
          value !== "Bermasalah" &&
          value !== "Indikasi Bermasalah"
        ) {
          updated.jenis_masalah = "";
        }
        if (name === "nomor_sertifikat") {
          updated.status_sertifikat = deriveCertificateStatus(value);
        }
        return updated;
      });
    }
  };

  const handleAssetPhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const hasValidExtension = /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!hasValidExtension) {
      toast.error("Foto harus berformat JPG, JPEG, PNG, atau WebP");
      event.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 10 MB");
      event.target.value = "";
      return;
    }

    handleInputChange(event);
  };

  const handleGeojsonImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const polygon = await parseGeojsonPolygonPoints(text);
      if (!polygon) {
        toast.error("File GeoJSON tidak memiliki polygon yang valid");
        return;
      }

      const centroid = getPolygonCentroid(polygon);
      setFormData((prev) => ({
        ...prev,
        polygon_bidang: polygon,
        koordinat_lat: centroid?.lat || prev.koordinat_lat || "",
        koordinat_long: centroid?.lng || prev.koordinat_long || "",
        _polygon_imported: true,
      }));
      setPolygonImportFileName(file.name);
      setPolygonImportVersion((version) => version + 1);
      toast.success(
        centroid
          ? "Polygon dan koordinat peta berhasil diimpor dari GeoJSON"
          : "Polygon berhasil diimpor dari GeoJSON",
      );
    } catch (error) {
      console.error("Error importing GeoJSON:", error);
      toast.error(
        error?.code === "INVALID_GEOJSON_COORDINATES"
          ? "Koordinat harus WGS84 (EPSG:4326). Ekspor ulang GeoJSON dengan CRS tersebut."
          : error?.code === "UNSUPPORTED_GEOJSON_CRS"
            ? `${error.message}. Ekspor ulang menggunakan EPSG:4326.`
          : "Gagal membaca file GeoJSON",
      );
    } finally {
      e.target.value = "";
    }
  };

  const handleModel3dImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (!file.name.toLowerCase().endsWith(".kmz")) {
        toast.error("File model harus berformat KMZ");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Ukuran file KMZ maksimum 50 MB");
        return;
      }
      const signature = new Uint8Array(await file.slice(0, 4).arrayBuffer());
      if (signature[0] !== 0x50 || signature[1] !== 0x4b) {
        toast.error("File KMZ tidak memiliki struktur arsip ZIP yang valid");
        return;
      }
      setModel3dFile(file);
      setFormData((prev) => ({
        ...prev,
        model_3d_lod: prev.model_3d_lod || "LOD1",
        model_3d_source_crs: prev.model_3d_source_crs || "EPSG:4326",
      }));
      toast.success("Model KMZ siap diunggah setelah aset disimpan");
    } finally {
      e.target.value = "";
    }
  };

  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = [
      { name: "kode_aset", label: "Kode Tanah", section: "identitas" },
      { name: "nama_aset", label: "Nama Tanah", section: "identitas" },
    ];
    const missingField = requiredFields.find((field) => (
      formData[field.name] === null
      || formData[field.name] === undefined
      || String(formData[field.name]).trim() === ""
    ));
    if (missingField) {
      onSectionChange?.(missingField.section);
      toast.error(`${missingField.label} wajib diisi`);
      window.requestAnimationFrame(() => {
        document.querySelector(`[name="${missingField.name}"]`)?.focus();
      });
      return;
    }

    setUploading(true);

    try {
      // Prepare data for API
      const submitData = {
        ...formData,
        _model_3d_file: model3dFile,
        luas: parseFloat(formData.luas) || 0,
        luas_lapangan: parseFloat(formData.luas_lapangan) || null,
        nilai_aset: parseFloat(formData.nilai_aset) || 0,
        nilai_buku: parseFloat(formData.nilai_buku) || null,
        nilai_njop: parseFloat(formData.nilai_njop) || null,
        luas_kib: parseFloat(formData.luas_kib) || null,
        harga_perolehan: parseFloat(formData.harga_perolehan) || null,
        pajak_fid: toNullableNumber(formData.pajak_fid),
        nilai_bumi_per_m2: toNullableNumber(formData.nilai_bumi_per_m2),
        nilai_bangunan_per_m2: toNullableNumber(
          formData.nilai_bangunan_per_m2,
        ),
        luas_bumi_bapenda: toNullableNumber(formData.luas_bumi_bapenda),
        luas_bangunan_bapenda: toNullableNumber(
          formData.luas_bangunan_bapenda,
        ),
        luas_bumi_pemetaan: toNullableNumber(formData.luas_bumi_pemetaan),
        luas_bangunan_pemetaan: toNullableNumber(
          formData.luas_bangunan_pemetaan,
        ),
        njop_bumi_pemetaan: toNullableNumber(formData.njop_bumi_pemetaan),
        njop_bangunan_pemetaan: toNullableNumber(
          formData.njop_bangunan_pemetaan,
        ),
        pbb_pemetaan: toNullableNumber(formData.pbb_pemetaan),
        volume_bangunan: toNullableNumber(formData.volume_bangunan),
        tinggi_bangunan: toNullableNumber(formData.tinggi_bangunan),
        building_height_m: parseFloat(formData.building_height_m) || null,
        building_base_elevation_m:
          formData.building_base_elevation_m === ""
            ? null
            : Number(formData.building_base_elevation_m),
        building_floors: parseInt(formData.building_floors, 10) || null,
        model_3d_accuracy_m: parseFloat(formData.model_3d_accuracy_m) || null,
        tahun_perolehan:
          parseInt(formData.tahun_perolehan) || new Date().getFullYear(),
      };

      // Upload foto_aset if it's a File object
      if (submitData.foto_aset instanceof File) {
        const res = await uploadService.single(
          submitData.foto_aset,
          "foto-aset",
        );
        submitData.foto_aset = res.data.data.url;
      } else if (submitData.foto_aset === null) {
        delete submitData.foto_aset;
      }

      if (submitData.dokumen_pendukung === null) {
        delete submitData.dokumen_pendukung;
      }

      // Convert empty strings to null for optional fields (prevents DB cast errors)
      Object.keys(submitData).forEach((key) => {
        if (submitData[key] === "") {
          submitData[key] = null;
        }
      });

      if (isLegacyCompactForm) {
        // submitData.kode_aset = submitData.kode_aset; // Tidak perlu dirubah
        submitData.status = submitData.status || "Aktif";
        submitData.status_sertifikat =
          submitData.status_sertifikat ||
          deriveCertificateStatus(submitData.nomor_sertifikat);
        submitData.jenis_aset = "Bidang Tanah";
        submitData.opd_pengguna = submitData.opd_pengguna || "Pengelola Aset";
        submitData.atas_nama =
        submitData.atas_nama || "Organisasi Pemilik Aset";
        if (!submitData.lokasi) {
          submitData.lokasi = [
            submitData.desa_kelurahan,
            submitData.kecamatan,
          ]
            .filter(Boolean)
            .join(", ");
        }
        if (!submitData.luas_lapangan && submitData.luas) {
          submitData.luas_lapangan = submitData.luas;
        }
      }

      onSubmit(submitData);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error(
        "Gagal mengupload file: " +
          (error.response?.data?.error || error.message),
      );
    } finally {
      setUploading(false);
    }
  };

  const handleBatal = () => {
    setFormData(buildInitialFormData());
    setModel3dFile(null);
    onClose();
  };

  // Substansi mode configuration
  const substansiConfig = {
    legal: {
      title: "Edit Data Legal",
      subtitle: "Perbarui informasi sertifikat dan status hukum aset",
      icon: ScalesIcon,
    },
    fisik: {
      title: "Edit Data Fisik",
      subtitle: "Perbarui informasi lokasi dan kondisi fisik aset",
      icon: MapPinIcon,
    },
    kib: {
      title: "Kelola Data KIB",
      subtitle: "Perbarui identitas barang dan informasi Kartu Inventaris Barang",
      icon: ClipboardTextIcon,
    },
    pajak: {
      title: "Kelola Data Pajak",
      subtitle: "Perbarui identitas objek pajak, data Bapenda, NJOP, dan PBB",
      icon: ReceiptIcon,
    },
    administratif: {
      title: "Edit Administratif",
      subtitle: "Perbarui informasi administratif dan pengelolaan aset",
      icon: CurrencyDollarIcon,
    },
    spasial: {
      title: "Edit Data Spasial",
      subtitle: "Perbarui koordinat dan informasi geospasial aset",
      icon: MapPinIcon,
    },
  };
  const currentSubstansi = activeSubstansi
    ? substansiConfig[activeSubstansi]
    : null;
  const HeaderIcon = currentSubstansi ? currentSubstansi.icon : BuildingsIcon;

  if (!isPage && !isOpen) return null;

  return (
    <div className={isPage ? "min-h-full" : "fixed inset-0 z-50 overflow-y-auto"}>
      {/* Overlay */}
      {!isPage && (
        <div
          className="motion-backdrop fixed inset-0 bg-accent/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Modal Container */}
      <div className={`min-h-full flex items-start justify-center ${isPage ? "" : "p-4 py-8"}`}>
        <div className={`relative w-full ${isPage ? "bg-transparent" : "motion-dialog-enter max-w-5xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"}`}>
          {/* Header */}
          {!isPage && (
          <div className="bg-linear-to-r from-accent to-accent/90 px-6 py-5 text-surface">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-surface/20 rounded-xl flex items-center justify-center">
                  <HeaderIcon size={24} weight="fill" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {currentSubstansi
                      ? currentSubstansi.title
                      : isLegacyCompactForm
                        ? assetData
                          ? "Edit Data Aset"
                          : "Tambah Data Aset"
                        : assetData
                          ? "Edit Data Aset"
                          : "Daftarkan Aset Baru"}
                  </h2>
                  <p className="text-sm opacity-80 mt-0.5">
                    {currentSubstansi
                      ? currentSubstansi.subtitle
                      : isLegacyCompactForm
                        ? "Lengkapi data aset sesuai kebutuhan operasional"
                        : assetData
                          ? "Perbarui informasi aset yang sudah ada"
                          : "Masukkan data inti aset — data substansi diisi melalui menu masing-masing"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={isPage ? "Kembali ke daftar aset" : "Tutup form"}
                className="p-2.5 hover:bg-surface/20 rounded-lg transition-colors"
              >
                {isPage
                  ? <ArrowLeftIcon size={20} weight="bold" />
                  : <XIcon size={20} weight="bold" />}
              </button>
            </div>
          </div>
          )}

          {/* Form Content - scrollable */}
          <div className={isPage ? "" : "max-h-[calc(100vh-220px)] overflow-y-auto"}>
            <form noValidate onSubmit={handleSubmit} className={isPage ? "space-y-5" : "p-6 space-y-6"}>
              {/* Identity info bar - shown in substansi mode */}
              {activeSubstansi && assetData && (
                <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                    <BuildingsIcon
                      size={20}
                      weight="duotone"
                      className="text-accent"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-text-primary truncate">
                      {assetData.nama_aset}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      ID {assetData.id_aset ?? assetData.id ?? "-"} &bull; {assetData.kode_aset} &bull; Tanah &bull;{" "}
                      {assetData.lokasi || "Lokasi belum diisi"}
                    </p>
                  </div>
                </div>
              )}

              {/* ========== IDENTITAS ASET ========== */}
              {isFullForm && !isLegacyCompactForm && (
                <div id="identitas" role="tabpanel" aria-labelledby="form-tab-identitas" hidden={isPage && activeSection !== "identitas"} data-form-section="identitas" className="bg-surface-secondary border border-border rounded-xl p-5 space-y-5">
                  <SectionHeader
                    icon={ClipboardTextIcon}
                    title="Identitas Aset"
                  />

                  {/* Row 1: Kode, Nama */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormInput
                      label="Kode Tanah"
                      name="kode_aset"
                      placeholder="TNH-XXX"
                      value={formData.kode_aset}
                      onChange={handleInputChange}
                      required
                      size="lg"
                    />
                    <FormInput
                      label="Nama Tanah"
                      name="nama_aset"
                      placeholder="Nama Tanah"
                      value={formData.nama_aset}
                      onChange={handleInputChange}
                      required
                      size="lg"
                    />
                  </div>
                </div>
              )}

              {/* ========== FORM KOMPAK LEGACY ========== */}
              {isLegacyCompactForm && (
                <>
                  <div className="bg-surface-secondary border border-border rounded-xl p-5 space-y-5">
                    <SectionHeader
                      icon={ClipboardTextIcon}
                      title="Identitas Aset"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormInput
                        label="Kode Tanah"
                        name="kode_aset"
                        placeholder="Contoh: TNH-XXXX"
                        value={formData.kode_aset}
                        onChange={handleInputChange}
                        required
                        size="lg"
                      />
                      <FormInput
                        label="Nama Tanah"
                        name="nama_aset"
                        placeholder="Nama bidang tanah"
                        value={formData.nama_aset}
                        onChange={handleInputChange}
                        required
                        size="lg"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormInput
                        label="No Sertifikat"
                        name="nomor_sertifikat"
                        placeholder="Contoh: 000123"
                        value={formData.nomor_sertifikat}
                        onChange={handleInputChange}
                        size="lg"
                      />
                      <FormSelect
                        label="Jenis Hak"
                        name="jenis_hak"
                        value={formData.jenis_hak}
                        onChange={handleInputChange}
                        options={jenisHakOptions}
                        placeholder="Pilih Jenis Hak"
                        size="lg"
                      />
                      <FormInput
                        label="KW"
                        name="kw"
                        placeholder="KW1, KW2..."
                        value={formData.kw}
                        onChange={handleInputChange}
                        size="lg"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <FormSelect
                        label="Status Sertifikat"
                        name="status_sertifikat"
                        value={formData.status_sertifikat}
                        onChange={handleInputChange}
                        options={statusSertifikatOptions}
                        placeholder="Pilih Status Sertifikat"
                        size="lg"
                      />
                      <FormInput
                        label="Tanggal Sertifikat"
                        name="tanggal_sertifikat"
                        type="date"
                        value={formData.tanggal_sertifikat}
                        onChange={handleInputChange}
                        size="lg"
                      />
                      <FormInput
                        label="Tanggal Scan"
                        name="tanggal_scan"
                        type="date"
                        value={formData.tanggal_scan}
                        onChange={handleInputChange}
                        size="lg"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <FormInput
                        label="Jenis Aset"
                        name="jenis_aset"
                        placeholder="Bidang Tanah"
                        value={formData.jenis_aset}
                        onChange={handleInputChange}
                        size="lg"
                      />
                      <FormInput
                        label="OPD Pengguna"
                        name="opd_pengguna"
                        placeholder="OPD Pengguna"
                        value={formData.opd_pengguna}
                        onChange={handleInputChange}
                        size="lg"
                      />
                      <FormInput
                        label="Atas Nama"
                        name="atas_nama"
                        placeholder="Organisasi Pemilik Aset"
                        value={formData.atas_nama}
                        onChange={handleInputChange}
                        size="lg"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <FormInput
                        label="Tahun Perolehan"
                        name="tahun_perolehan"
                        type="number"
                        placeholder="2026"
                        value={formData.tahun_perolehan}
                        onChange={handleInputChange}
                        size="lg"
                      />
                      <FormInput
                        label="ID Pemda"
                        name="id_pemda"
                        placeholder="ID Pemda"
                        value={formData.id_pemda}
                        onChange={handleInputChange}
                        size="lg"
                      />
                      <FormInput
                        label="Plotting"
                        name="plotting_status"
                        placeholder="ok / belum / perlu cek"
                        value={formData.plotting_status}
                        onChange={handleInputChange}
                        size="lg"
                      />
                    </div>
                  </div>

                  <div className="bg-surface-secondary border border-border rounded-xl p-5 space-y-5">
                    <SectionHeader
                      icon={ClipboardTextIcon}
                      title="Data KIB dan Administratif"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <FormInput
                        label="NIBAR"
                        name="nibar"
                        placeholder="Nomor Identifikasi Barang"
                        value={formData.nibar}
                        onChange={handleInputChange}
                        size="lg"
                      />
                      <FormInput
                        label="Kode Barang"
                        name="kode_barang"
                        placeholder="Kode barang KIB"
                        value={formData.kode_barang}
                        onChange={handleInputChange}
                        size="lg"
                      />
                      <FormInput
                        label="No Register"
                        name="no_register"
                        placeholder="No register"
                        value={formData.no_register}
                        onChange={handleInputChange}
                        size="lg"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <FormInput
                        label="Luas KIB (m²)"
                        name="luas_kib"
                        type="number"
                        placeholder="0.00"
                        value={formData.luas_kib}
                        onChange={handleInputChange}
                        step="0.01"
                        size="lg"
                      />
                      <FormInput
                        label="Harga Perolehan (Rp)"
                        name="harga_perolehan"
                        type="number"
                        placeholder="0"
                        value={formData.harga_perolehan}
                        onChange={handleInputChange}
                        step="0.01"
                        size="lg"
                      />
                      <FormInput
                        label="Nilai Aset (Rp)"
                        name="nilai_aset"
                        type="number"
                        placeholder="0"
                        value={formData.nilai_aset}
                        onChange={handleInputChange}
                        step="0.01"
                        size="lg"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormInput
                        label="Kode BMD"
                        name="kode_bmd"
                        placeholder="Kodefikasi BMD"
                        value={formData.kode_bmd}
                        onChange={handleInputChange}
                        size="lg"
                      />
                      <FormInput
                        label="Penggunaan KIB"
                        name="penggunaan_kib"
                        placeholder="Penggunaan aset menurut KIB"
                        value={formData.penggunaan_kib}
                        onChange={handleInputChange}
                        size="lg"
                      />
                    </div>
                  </div>

                  <div className="bg-surface-secondary border border-border rounded-xl p-5 space-y-5">
                    <SectionHeader
                      icon={MapPinIcon}
                      title="Lokasi, Pemanfaatan, dan Spasial"
                    />

                    <FormTextarea
                      label="Lokasi/Alamat Lengkap"
                      name="lokasi"
                      placeholder="Alamat lengkap aset"
                      value={formData.lokasi}
                      onChange={handleInputChange}
                      rows={2}
                      size="lg"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <FormSelect
                        label="Kecamatan"
                        name="kecamatan"
                        value={formData.kecamatan}
                        onChange={(e) => {
                          handleInputChange(e);
                          setFormData((prev) => ({
                            ...prev,
                            kecamatan: e.target.value,
                            desa_kelurahan: "",
                          }));
                        }}
                        options={kecamatanOptions}
                        placeholder="Pilih Kecamatan"
                        size="lg"
                      />
                      <FormSelect
                        label="Desa/Kelurahan"
                        name="desa_kelurahan"
                        value={formData.desa_kelurahan}
                        onChange={handleInputChange}
                        options={getKelurahanOptions(formData.kecamatan)}
                        placeholder={
                          formData.kecamatan
                            ? "Pilih Kelurahan"
                            : "Pilih kecamatan dulu"
                        }
                        size="lg"
                      />
                      <FormSelect
                        label="Penggunaan Saat Ini"
                        name="penggunaan_saat_ini"
                        value={formData.penggunaan_saat_ini}
                        onChange={handleInputChange}
                        options={penggunaanOptions}
                        placeholder="Pilih Penggunaan"
                        size="lg"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <FormInput
                        label="Luas (m²)"
                        name="luas"
                        type="number"
                        placeholder="0.00"
                        value={formData.luas}
                        onChange={handleInputChange}
                        step="0.01"
                        size="lg"
                      />
                      <FormInput
                        label="Luas Lapangan (m²)"
                        name="luas_lapangan"
                        type="number"
                        placeholder="0.00"
                        value={formData.luas_lapangan}
                        onChange={handleInputChange}
                        step="0.01"
                        size="lg"
                      />
                    </div>

                    <FormTextarea
                      label="Catatan"
                      name="notes"
                      placeholder="Catatan sesuai data tabel/KIB"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={2}
                      size="lg"
                    />

                    <AssetCoordinatePicker
                      latitude={formData.koordinat_lat}
                      longitude={formData.koordinat_long}
                      onCoordinateChange={(lat, lng) => {
                        setFormData((prev) => ({
                          ...prev,
                          koordinat_lat: lat,
                          koordinat_long: lng,
                        }));
                      }}
                      label="Koordinat Lokasi"
                    />

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-text-primary">
                        Polygon Bidang Tanah
                      </label>
                      <div className="bg-surface border border-border rounded-xl p-4 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              {getPolygonPointCount(formData.polygon_bidang) >=
                              3 ? (
                                <CheckCircleIcon size={20} weight="fill" />
                              ) : (
                                <FileTextIcon size={20} weight="duotone" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-text-primary">
                                {getPolygonPointCount(
                                  formData.polygon_bidang,
                                ) >= 3
                                  ? `${getPolygonPointCount(formData.polygon_bidang)} titik polygon tersimpan`
                                  : "Belum ada polygon"}
                              </p>
                              <p className="text-xs text-text-muted">
                                Tambahkan polygon melalui file GeoJSON yang valid.
                              </p>
                              {polygonImportFileName && (
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                  {polygonImportFileName}
                                </p>
                              )}
                            </div>
                          </div>
                          <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-surface rounded-lg hover:opacity-90 transition text-sm font-semibold cursor-pointer">
                            <UploadSimpleIcon size={16} weight="bold" />
                            Impor GeoJSON
                            <input
                              type="file"
                              accept=".geojson,.json,application/geo+json,application/json"
                              onChange={handleGeojsonImport}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                      <Building3dFields
                        formData={formData}
                        onChange={handleInputChange}
                        modelFile={model3dFile}
                        onModelImport={handleModel3dImport}
                      />
                    </div>
                  </div>

                </>
              )}

              {/* ========== DATA LEGAL ========== */}
              {!isLegacyCompactForm && (isFullForm || activeSubstansi === "legal") && (
                <div id="legal" role="tabpanel" aria-labelledby="form-tab-legal" hidden={isPage && activeSection !== "legal"} data-form-section="legal" className="bg-surface-secondary border border-border rounded-xl p-5 space-y-5">
                  <SectionHeader icon={ScalesIcon} title="Data Legal" />

                  {/* Row 1: Nomor Sertifikat, Status Sertifikat, Jenis Hak, KW */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <FormInput
                      label="Nomor Sertifikat"
                      name="nomor_sertifikat"
                      placeholder="No. Sertifikat / Belum Bersertifikat"
                      value={formData.nomor_sertifikat}
                      onChange={handleInputChange}
                      size="lg"
                    />
                    <FormSelect
                      label="Status Sertifikat"
                      name="status_sertifikat"
                      value={formData.status_sertifikat}
                      onChange={handleInputChange}
                      options={statusSertifikatOptions}
                      placeholder="Pilih Status Sertifikat"
                      size="lg"
                    />
                    <FormSelect
                      label="Jenis Hak"
                      name="jenis_hak"
                      value={formData.jenis_hak}
                      onChange={handleInputChange}
                      options={jenisHakOptions}
                      placeholder="Pilih Jenis Hak"
                      size="lg"
                    />
                    <FormInput
                      label="KW"
                      name="kw"
                      placeholder="KW1, KW2..."
                      value={formData.kw}
                      onChange={handleInputChange}
                      size="lg"
                    />
                  </div>

                  {/* Row 2: Atas Nama, Tanggal Sertifikat, Tahun Perolehan */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <FormInput
                      label="Atas Nama"
                      name="atas_nama"
                      placeholder="Pemda / Instansi"
                      value={formData.atas_nama}
                      onChange={handleInputChange}
                      size="lg"
                    />
                    <FormInput
                      label="Tanggal Terbit Sertifikat"
                      name="tanggal_sertifikat"
                      type="date"
                      value={formData.tanggal_sertifikat}
                      onChange={handleInputChange}
                      size="lg"
                    />
                    <FormInput
                      label="Tahun Perolehan"
                      name="tahun_perolehan"
                      type="number"
                      placeholder="2025"
                      value={formData.tahun_perolehan}
                      onChange={handleInputChange}
                      size="lg"
                    />
                  </div>

                  {/* Row 3: Riwayat Perolehan, Status Hukum, SK Penetapan */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <FormSelect
                      label="Riwayat Perolehan"
                      name="riwayat_perolehan"
                      value={formData.riwayat_perolehan}
                      onChange={handleInputChange}
                      options={riwayatPerolehanOptions}
                      placeholder="Pilih Riwayat"
                      size="lg"
                    />
                    <FormSelect
                      label="Status Hukum"
                      name="status_hukum"
                      value={formData.status_hukum}
                      onChange={handleInputChange}
                      options={statusHukumOptions}
                      placeholder="Pilih Status Hukum"
                      size="lg"
                    />
                    <FormInput
                      label="SK Penetapan Status Penggunaan"
                      name="sk_penetapan"
                      placeholder="Nomor SK Penetapan"
                      value={formData.sk_penetapan}
                      onChange={handleInputChange}
                      size="lg"
                    />
                  </div>
                </div>
              )}

              {/* ========== DATA FISIK ========== */}
              {!isLegacyCompactForm && (isFullForm || activeSubstansi === "fisik") && (
                <div id="fisik" role="tabpanel" aria-labelledby="form-tab-fisik" hidden={isPage && activeSection !== "fisik"} data-form-section="fisik" className="bg-surface-secondary border border-border rounded-xl p-5 space-y-5">
                  <SectionHeader icon={MapPinIcon} title="Data Fisik" />

                  {/* Lokasi/Alamat */}
                  <FormTextarea
                    label="Lokasi/Alamat Lengkap"
                    name="lokasi"
                    placeholder="Alamat lengkap aset"
                    value={formData.lokasi}
                    onChange={handleInputChange}
                    rows={2}
                    size="lg"
                  />

                  {/* Kecamatan, Desa/Kelurahan, Penggunaan */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <FormSelect
                      label="Kecamatan"
                      name="kecamatan"
                      value={formData.kecamatan}
                      onChange={(e) => {
                        handleInputChange(e);
                        // Reset kelurahan when kecamatan changes
                        setFormData((prev) => ({
                          ...prev,
                          kecamatan: e.target.value,
                          desa_kelurahan: "",
                        }));
                      }}
                      options={kecamatanOptions}
                      placeholder="Pilih Kecamatan"
                      size="lg"
                    />
                    <FormSelect
                      label="Desa/Kelurahan"
                      name="desa_kelurahan"
                      value={formData.desa_kelurahan}
                      onChange={handleInputChange}
                      options={getKelurahanOptions(formData.kecamatan)}
                      placeholder={
                        formData.kecamatan
                          ? "Pilih Kelurahan"
                          : "Pilih kecamatan dulu"
                      }
                      size="lg"
                    />
                    <FormSelect
                      label="Penggunaan Saat Ini"
                      name="penggunaan_saat_ini"
                      value={formData.penggunaan_saat_ini}
                      onChange={handleInputChange}
                      options={penggunaanOptions}
                      placeholder="Pilih Penggunaan"
                      size="lg"
                    />
                  </div>

                  {/* Luas Tanah */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormInput
                      label="Luas Sesuai Sertifikat (m²)"
                      name="luas"
                      type="number"
                      placeholder="0.00"
                      value={formData.luas}
                      onChange={handleInputChange}
                      step="0.01"
                      size="lg"
                    />
                    <FormInput
                      label="Luas Kondisi Lapangan (m²)"
                      name="luas_lapangan"
                      type="number"
                      placeholder="0.00"
                      value={formData.luas_lapangan}
                      onChange={handleInputChange}
                      step="0.01"
                      size="lg"
                    />
                  </div>

                  {/* Batas Tanah - Card Style */}
                  <div className="bg-surface rounded-xl p-4 border border-border">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-4">
                      Batas-Batas Tanah
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <FormInput
                        label="Batas Utara"
                        name="batas_utara"
                        placeholder="Berbatasan dengan..."
                        value={formData.batas_utara}
                        onChange={handleInputChange}
                        size="lg"
                      />
                      <FormInput
                        label="Batas Selatan"
                        name="batas_selatan"
                        placeholder="Berbatasan dengan..."
                        value={formData.batas_selatan}
                        onChange={handleInputChange}
                        size="lg"
                      />
                      <FormInput
                        label="Batas Timur"
                        name="batas_timur"
                        placeholder="Berbatasan dengan..."
                        value={formData.batas_timur}
                        onChange={handleInputChange}
                        size="lg"
                      />
                      <FormInput
                        label="Batas Barat"
                        name="batas_barat"
                        placeholder="Berbatasan dengan..."
                        value={formData.batas_barat}
                        onChange={handleInputChange}
                        size="lg"
                      />
                    </div>
                  </div>

                  {/* Foto Kondisi Eksisting */}
                  <FormFileUpload
                    label="Foto Kondisi Eksisting"
                    name="foto_aset"
                    value={formData.foto_aset || assetData?.foto_aset}
                    onChange={handleAssetPhotoChange}
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/jpg,image/png,image/webp,image/x-webp"
                    size="lg"
                  />
                </div>
              )}

              {/* ========== DATA SPASIAL ========== */}
              {!isLegacyCompactForm && (isFullForm || activeSubstansi === "spasial") && (
                <div id="spasial" role="tabpanel" aria-labelledby="form-tab-spasial" hidden={isPage && activeSection !== "spasial"} data-form-section="spasial" className="bg-surface-secondary border border-border rounded-xl p-5 space-y-5">
                  <SectionHeader icon={MapPinIcon} title="Data Spasial" />

                  <AssetCoordinatePicker
                    latitude={formData.koordinat_lat}
                    longitude={formData.koordinat_long}
                    onCoordinateChange={(lat, lng) => {
                      setFormData((prev) => ({
                        ...prev,
                        koordinat_lat: lat,
                        koordinat_long: lng,
                      }));
                    }}
                    label="Koordinat Lokasi"
                  />

                  <AssetPolygonDrawer
                    polygonData={formData.polygon_bidang}
                    revealKey={polygonImportVersion}
                    onPolygonChange={(polygon) => {
                      setFormData((prev) => ({
                        ...prev,
                        polygon_bidang: polygon,
                      }));
                    }}
                    centerLat={formData.koordinat_lat}
                    centerLng={formData.koordinat_long}
                    label="Gambar Polygon Bidang Tanah"
                  />

                  <div className="rounded-xl border border-border bg-surface p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-text-muted">
                          {getPolygonPointCount(formData.polygon_bidang) >=
                          3 ? (
                            <CheckCircleIcon size={18} weight="fill" />
                          ) : (
                            <FileTextIcon size={18} weight="duotone" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">
                            {getPolygonPointCount(formData.polygon_bidang) >= 3
                              ? `${getPolygonPointCount(formData.polygon_bidang)} titik polygon tersimpan`
                              : "Belum ada polygon"}
                          </p>
                          <p className="text-xs text-text-muted">
                            Impor file GeoJSON untuk mengisi polygon bidang
                            secara otomatis.
                          </p>
                          {polygonImportFileName && (
                            <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                              {polygonImportFileName}
                            </p>
                          )}
                        </div>
                      </div>
                      <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-surface transition hover:opacity-90">
                        <UploadSimpleIcon size={16} weight="bold" />
                        Impor GeoJSON
                        <input
                          type="file"
                          accept=".geojson,.json,application/geo+json,application/json"
                          onChange={handleGeojsonImport}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                </div>
              )}

              {/* ========== DATA KIB ========== */}
              {!isLegacyCompactForm &&
                (isFullForm || activeSubstansi === "kib") && (
                  <div
                    id="kib"
                    role="tabpanel"
                    aria-labelledby="form-tab-kib"
                    hidden={isPage && activeSection !== "kib"}
                    data-form-section="kib"
                    className="space-y-5 rounded-xl border border-border bg-surface-secondary p-5"
                  >
                    <SectionHeader
                      icon={ClipboardTextIcon}
                      title="Data Kartu Inventaris Barang"
                    />

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                      <FormInput
                        label="NIBAR"
                        name="nibar"
                        placeholder="Nomor Identifikasi Barang"
                        value={formData.nibar}
                        onChange={handleInputChange}
                        size="lg"
                      />
                      <FormInput
                        label="ID Pemda"
                        name="id_pemda"
                        placeholder="ID barang pemerintah daerah"
                        value={formData.id_pemda}
                        onChange={handleInputChange}
                        size="lg"
                      />
                      <FormInput
                        label="Kode Barang"
                        name="kode_barang"
                        placeholder="Kode barang KIB"
                        value={formData.kode_barang}
                        onChange={handleInputChange}
                        size="lg"
                      />
                      <FormInput
                        label="No. Register"
                        name="no_register"
                        placeholder="Nomor register barang"
                        value={formData.no_register}
                        onChange={handleInputChange}
                        size="lg"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                      <FormInput
                        label="Luas KIB (m²)"
                        name="luas_kib"
                        type="number"
                        placeholder="0.00"
                        value={formData.luas_kib}
                        onChange={handleInputChange}
                        step="0.01"
                        size="lg"
                      />
                      <FormInput
                        label="Harga Perolehan (Rp)"
                        name="harga_perolehan"
                        type="number"
                        placeholder="0"
                        value={formData.harga_perolehan}
                        onChange={handleInputChange}
                        step="0.01"
                        size="lg"
                      />
                      <FormInput
                        label="Status Plotting"
                        name="plotting_status"
                        placeholder="Contoh: Sudah terplotting"
                        value={formData.plotting_status}
                        onChange={handleInputChange}
                        size="lg"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <FormInput
                        label="Penggunaan KIB"
                        name="penggunaan_kib"
                        placeholder="Penggunaan menurut KIB"
                        value={formData.penggunaan_kib}
                        onChange={handleInputChange}
                        size="lg"
                      />
                      <FormTextarea
                        label="Catatan KIB"
                        name="notes"
                        placeholder="Catatan tambahan dari dokumen KIB"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows={2}
                        size="lg"
                      />
                    </div>
                  </div>
                )}

              {/* ========== DATA ADMINISTRATIF ========== */}
              {!isLegacyCompactForm && isFullForm && (
                <div id="administratif" role="tabpanel" aria-labelledby="form-tab-administratif" hidden={isPage && activeSection !== "administratif"} data-form-section="administratif" className="bg-surface-secondary border border-border rounded-xl p-5 space-y-5">
                  <SectionHeader
                    icon={CurrencyDollarIcon}
                    title="Data Administratif"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <FormInput
                      label="Nilai Perolehan (Rp)"
                      name="nilai_aset"
                      type="number"
                      placeholder="0"
                      value={formData.nilai_aset}
                      onChange={handleInputChange}
                      step="0.01"
                      size="lg"
                    />
                    <FormInput
                      label="Nilai Buku (Rp)"
                      name="nilai_buku"
                      type="number"
                      placeholder="0"
                      value={formData.nilai_buku}
                      onChange={handleInputChange}
                      step="0.01"
                      size="lg"
                    />
                    <FormInput
                      label="Nilai NJOP (Rp)"
                      name="nilai_njop"
                      type="number"
                      placeholder="0"
                      value={formData.nilai_njop}
                      onChange={handleInputChange}
                      step="0.01"
                      size="lg"
                    />
                  </div>
                </div>
              )}

              {/* ========== DATA ADMINISTRATIF (substansi mode) ========== */}
              {!isLegacyCompactForm && activeSubstansi === "administratif" && (
                <div id="administratif" role="tabpanel" aria-labelledby="form-tab-administratif" hidden={isPage && activeSection !== "administratif"} data-form-section="administratif" className="bg-surface-secondary border border-border rounded-xl p-5 space-y-5">
                  <SectionHeader
                    icon={CurrencyDollarIcon}
                    title="Administratif"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <FormInput
                      label="Kode BMD"
                      name="kode_bmd"
                      placeholder="Kodefikasi Barang Milik Daerah"
                      value={formData.kode_bmd}
                      onChange={handleInputChange}
                      size="lg"
                    />
                    <FormInput
                      label="OPD Pengguna"
                      name="opd_pengguna"
                      placeholder="Nama OPD/Instansi pengguna"
                      value={formData.opd_pengguna}
                      onChange={handleInputChange}
                      size="lg"
                    />
                    <FormInput
                      label="Tahun Perolehan"
                      name="tahun_perolehan"
                      type="number"
                      placeholder="2025"
                      value={formData.tahun_perolehan}
                      onChange={handleInputChange}
                      size="lg"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <FormInput
                      label="Nilai Perolehan (Rp)"
                      name="nilai_aset"
                      type="number"
                      placeholder="0"
                      value={formData.nilai_aset}
                      onChange={handleInputChange}
                      step="0.01"
                      size="lg"
                    />
                    <FormInput
                      label="Nilai Buku (Rp)"
                      name="nilai_buku"
                      type="number"
                      placeholder="0"
                      value={formData.nilai_buku}
                      onChange={handleInputChange}
                      step="0.01"
                      size="lg"
                    />
                    <FormInput
                      label="Nilai NJOP (Rp)"
                      name="nilai_njop"
                      type="number"
                      placeholder="0"
                      value={formData.nilai_njop}
                      onChange={handleInputChange}
                      step="0.01"
                      size="lg"
                    />
                  </div>

                  <FormInput
                    label="SK Penetapan Status Penggunaan"
                    name="sk_penetapan"
                    placeholder="Nomor SK Penetapan"
                    value={formData.sk_penetapan}
                    onChange={handleInputChange}
                    size="lg"
                  />
                </div>
              )}

              {/* ========== DATA PAJAK ========== */}
              {!isLegacyCompactForm &&
                (isFullForm || activeSubstansi === "pajak") && (
                  <div
                    id="pajak"
                    role="tabpanel"
                    aria-labelledby="form-tab-pajak"
                    hidden={isPage && activeSection !== "pajak"}
                    data-form-section="pajak"
                    className="space-y-5 rounded-xl border border-border bg-surface-secondary p-5"
                  >
                    <TaxFields
                      formData={formData}
                      onChange={handleInputChange}
                    />
                  </div>
                )}

              {/* ========== LOKASI DASAR (create mode only) ========== */}
              {isCreateMode && !isLegacyCompactForm && !isFullForm && (
                <div id="lokasi-dasar" className="scroll-mt-28 bg-surface-secondary border border-border rounded-xl p-5 space-y-5">
                  <SectionHeader icon={MapPinIcon} title="Lokasi Aset" />

                  <FormTextarea
                    label="Lokasi/Alamat Lengkap"
                    name="lokasi"
                    placeholder="Alamat lengkap aset"
                    value={formData.lokasi}
                    onChange={handleInputChange}
                    rows={2}
                    size="lg"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormInput
                      label="Luas (m²)"
                      name="luas"
                      type="number"
                      placeholder="0.00"
                      value={formData.luas}
                      onChange={handleInputChange}
                      step="0.01"
                      size="lg"
                    />
                    <FormInput
                      label="Tahun Perolehan"
                      name="tahun_perolehan"
                      type="number"
                      placeholder="2025"
                      value={formData.tahun_perolehan}
                      onChange={handleInputChange}
                      size="lg"
                    />
                  </div>

                  <AssetCoordinatePicker
                    latitude={formData.koordinat_lat}
                    longitude={formData.koordinat_long}
                    onCoordinateChange={(lat, lng) => {
                      setFormData((prev) => ({
                        ...prev,
                        koordinat_lat: lat,
                        koordinat_long: lng,
                      }));
                    }}
                    label="Koordinat Lokasi"
                  />
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4 justify-end pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={handleBatal}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 border-2 border-border text-text-primary px-6 py-3 text-sm font-bold hover:bg-surface-secondary rounded-xl transition disabled:opacity-50"
                >
                  <ArrowLeftIcon size={18} weight="bold" />
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || uploading}
                  className="bg-accent text-surface px-8 py-3 text-sm font-bold hover:opacity-90 rounded-xl transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-accent/25"
                >
                  {uploading ? (
                    <>
                      <CircleNotchIcon size={18} className="animate-spin" />
                      Mengupload file...
                    </>
                  ) : isSubmitting ? (
                    <>
                      <CircleNotchIcon size={18} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <FloppyDiskIcon size={18} weight="bold" />
                      Simpan Data
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
