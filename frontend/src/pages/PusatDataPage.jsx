import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { asetService } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { hasPermission } from "../utils/permissions";
import { normalizePolygonToGeometry } from "../utils/geojsonExport";
import { useConfirm } from "../components/ui/ConfirmDialog";
import {
  DatabaseIcon,
  PlusIcon,
  ArrowsClockwiseIcon,
  PencilSimpleIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  XIcon,
  CaretUpIcon,
  CaretDownIcon,
  CaretUpDownIcon,
  BuildingsIcon,
  MapPinIcon,
  HashIcon,
  UserIcon,
  FileTextIcon,
  FloppyDiskIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CertificateIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";

const PUSAT_DATA_DEFAULT_FORM = {
  kode_aset: "",
  nama_aset: "",
  status: "Aktif",
  jenis_masalah: "",
  jenis_aset: "",
  sumber: "BPN",
  nib: "",
  nomor_hak: "",
  jenis_hak: "",
  luas: "",
  luas_lapangan: "",
  batas_utara: "",
  batas_selatan: "",
  batas_timur: "",
  batas_barat: "",
  penggunaan: "",
  penggunaan_saat_ini: "",
  kecamatan: "",
  kelurahan: "",
  alamat: "",
  status_sertifikat: "",
  surat_ukur: "",
  pemilik_pertama: "",
  pemilik_akhir: "",
  atas_nama: "",
  tanggal_sertifikat: "",
  riwayat_perolehan: "",
  status_hukum: "",
  produk: "",
  kw: "",
  opd: "",
  opd_pengguna: "",
  nilai_aset: "",
  tahun_perolehan: "",
  kode_bmd: "",
  nilai_buku: "",
  nilai_njop: "",
  sk_penetapan: "",
  nibar: "",
  id_pemda: "",
  kode_barang: "",
  no_register: "",
  luas_kib: "",
  harga_perolehan: "",
  penggunaan_kib: "",
  tanggal_scan: "",
  file_sertifikat: "",
  notes: "",
  plotting_status: "",
  koordinat_lat: "",
  koordinat_long: "",
  polygon_bidang: "",
  foto_aset: "",
  dokumen_pendukung: "",
  keterangan: "",
};

const mapAsetToPusatDataView = (asset) => ({
  ...asset,
  id_pusat_data: asset.id_aset,
  alamat: asset.lokasi,
  kelurahan: asset.desa_kelurahan,
  penggunaan: asset.penggunaan_saat_ini,
  opd: asset.opd_pengguna,
});

const mapPusatDataFormToAset = (formData) => {
  const payload = { ...formData };

  payload.lokasi = payload.alamat;
  payload.desa_kelurahan = payload.kelurahan;
  payload.penggunaan_saat_ini =
    payload.penggunaan_saat_ini || payload.penggunaan;
  payload.opd_pengguna = payload.opd_pengguna || payload.opd;
  payload.nomor_sertifikat = payload.nomor_sertifikat || payload.nomor_hak;

  delete payload.alamat;
  delete payload.kelurahan;
  delete payload.penggunaan;
  delete payload.opd;

  Object.keys(payload).forEach((key) => {
    if (payload[key] === "") payload[key] = null;
  });

  return payload;
};

const ASSET_SORT_FIELD_MAP = {
  alamat: "lokasi",
  kelurahan: "desa_kelurahan",
  penggunaan: "penggunaan_saat_ini",
  opd: "opd_pengguna",
};

const ADDITIONAL_FORM_SECTIONS = [
  {
    title: "Identitas dan Status",
    fields: [
      {
        name: "status",
        label: "Status Aset",
        type: "select",
        options: ["Aktif", "Bermasalah", "Indikasi Bermasalah", "Diblokir"],
      },
      { name: "jenis_aset", label: "Jenis Aset", placeholder: "Tanah, bangunan, dll" },
      {
        name: "jenis_masalah",
        label: "Jenis Masalah",
        type: "select",
        options: ["", "Sengketa", "Konflik", "Berperkara"],
      },
      { name: "sumber", label: "Sumber Data", type: "select", options: ["BPN", "BPKA"] },
    ],
  },
  {
    title: "Substansi Legal",
    fields: [
      { name: "tanggal_sertifikat", label: "Tanggal Sertifikat", type: "date" },
      { name: "riwayat_perolehan", label: "Riwayat Perolehan", placeholder: "Hibah, pembelian, dll" },
      {
        name: "status_hukum",
        label: "Status Hukum",
        type: "select",
        options: ["", "Aman", "Sengketa", "Dalam Proses Sertipikasi", "Diblokir"],
      },
    ],
  },
  {
    title: "Substansi Fisik",
    fields: [
      { name: "penggunaan_saat_ini", label: "Penggunaan Saat Ini", placeholder: "Kantor, sekolah, lahan kosong, dll" },
      { name: "batas_utara", label: "Batas Utara" },
      { name: "batas_selatan", label: "Batas Selatan" },
      { name: "batas_timur", label: "Batas Timur" },
      { name: "batas_barat", label: "Batas Barat" },
    ],
  },
  {
    title: "Substansi Administratif",
    fields: [
      { name: "kode_bmd", label: "Kode BMD" },
      { name: "tahun_perolehan", label: "Tahun Perolehan", type: "number" },
      { name: "nilai_aset", label: "Nilai Aset (Rp)", type: "number" },
      { name: "nilai_buku", label: "Nilai Buku (Rp)", type: "number" },
      { name: "nilai_njop", label: "Nilai NJOP (Rp)", type: "number" },
      { name: "harga_perolehan", label: "Harga Perolehan (Rp)", type: "number" },
      { name: "sk_penetapan", label: "SK Penetapan" },
      { name: "opd_pengguna", label: "OPD Pengguna" },
    ],
  },
  {
    title: "Substansi Spasial",
    fields: [
      { name: "koordinat_lat", label: "Koordinat Latitude", type: "number", step: "0.00000001" },
      { name: "koordinat_long", label: "Koordinat Longitude", type: "number", step: "0.00000001" },
      { name: "polygon_bidang", label: "Polygon Bidang (GeoJSON)", textarea: true },
      { name: "foto_aset", label: "URL Foto Aset" },
      { name: "dokumen_pendukung", label: "Dokumen Pendukung (JSON/URL)", textarea: true },
    ],
  },
  {
    title: "Data KIB / Tambahan",
    fields: [
      { name: "nibar", label: "NIBAR" },
      { name: "id_pemda", label: "ID Pemda" },
      { name: "kode_barang", label: "Kode Barang" },
      { name: "no_register", label: "No Register" },
      { name: "luas_kib", label: "Luas KIB (m2)", type: "number" },
      { name: "penggunaan_kib", label: "Penggunaan KIB" },
      { name: "tanggal_scan", label: "Tanggal Scan", type: "date" },
      { name: "file_sertifikat", label: "File Sertifikat" },
      { name: "plotting_status", label: "Status Plotting" },
      { name: "notes", label: "Notes", textarea: true },
    ],
  },
];

export default function PusatDataPage() {
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role?.toLowerCase() || "";
  const canCreate = hasPermission(userRole, "pusatData", "create");
  const canUpdate = hasPermission(userRole, "pusatData", "update");
  const canDelete = hasPermission(userRole, "pusatData", "delete");
  const confirm = useConfirm();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, totalLuas: 0 });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("DESC");
  const limit = 20;

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [formData, setFormData] = useState(PUSAT_DATA_DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await asetService.getAll({
        page,
        limit,
        search,
        sort: ASSET_SORT_FIELD_MAP[sortBy] || sortBy,
        order: sortOrder,
      });
      setData((res.data.data || []).map(mapAsetToPusatDataView));
      setTotal(res.data.pagination?.totalItems || 0);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, sortOrder]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await asetService.getStats();
      setStats({
        total: res.data.data?.totalAset || 0,
        totalLuas: res.data.data?.totalLuas || 0,
      });
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortOrder((o) => (o === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(col);
      setSortOrder("ASC");
    }
  };

  const SortIcon = ({ col }) => {
    if (sortBy !== col)
      return <CaretUpDownIcon size={14} className="opacity-40" />;
    return sortOrder === "ASC" ? (
      <CaretUpIcon size={14} className="text-accent" />
    ) : (
      <CaretDownIcon size={14} className="text-accent" />
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const resetForm = () => {
    setFormData(PUSAT_DATA_DEFAULT_FORM);
    setEditingItem(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData(
      Object.keys(PUSAT_DATA_DEFAULT_FORM).reduce((acc, key) => {
        const value = item[key];
        return {
          ...acc,
          [key]:
            value && typeof value === "object"
              ? JSON.stringify(value, null, 2)
              : (value ?? ""),
        };
      }, {}),
    );
    setShowForm(true);
  };

  const handleOpenView = (item) => {
    setViewingItem(item);
    setShowView(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = mapPusatDataFormToAset(formData);
      ["polygon_bidang", "dokumen_pendukung"].forEach((field) => {
        const value = payload[field];
        const trimmed = typeof value === "string" ? value.trim() : "";
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
          try {
            payload[field] = JSON.parse(value);
          } catch {
            // Keep original text when it is not valid JSON.
          }
        }
      });

      if (editingItem) {
        await asetService.update(editingItem.id_aset, payload);
        toast.success("Data berhasil diperbarui");
      } else {
        await asetService.create(payload);
        toast.success("Data berhasil ditambahkan");
      }
      setShowForm(false);
      resetForm();
      fetchData();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || "Gagal menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = await confirm({
      title: "Hapus Data",
      message: `Apakah Anda yakin ingin menghapus data NIB "${item.nib || "-"}"?`,
      confirmText: "Hapus",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      await asetService.delete(item.id_aset);
      toast.success("Data berhasil dihapus");
      fetchData();
      fetchStats();
    } catch {
      toast.error("Gagal menghapus data");
    }
  };

  const formatNumber = (val) => {
    if (!val) return "-";
    return new Intl.NumberFormat("id-ID").format(val);
  };

  const updateFormField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePolygonGeojsonImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const geometry = normalizePolygonToGeometry(text);
      if (!geometry) {
        toast.error("File GeoJSON tidak memiliki polygon yang valid");
        return;
      }

      updateFormField("polygon_bidang", JSON.stringify(geometry, null, 2));
      toast.success("Polygon berhasil diimpor dari GeoJSON");
    } catch (error) {
      console.error("Error importing GeoJSON:", error);
      toast.error("Gagal membaca file GeoJSON");
    } finally {
      event.target.value = "";
    }
  };

  const renderAdditionalField = (field) => {
    const commonClass =
      "w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-text-primary placeholder:text-text-muted transition-all";

    return (
      <div
        key={field.name}
        className={`space-y-1.5 ${field.textarea ? "sm:col-span-2" : ""}`}
      >
        <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
          <FileTextIcon size={12} weight="bold" />
          {field.label}
        </label>
        {field.name === "polygon_bidang" && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-secondary px-3 py-2">
            <span className="text-xs text-text-muted">
              Impor file GeoJSON untuk mengisi polygon bidang.
            </span>
            <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-surface hover:opacity-90">
              <UploadSimpleIcon size={13} weight="bold" />
              Import
              <input
                type="file"
                accept=".geojson,.json,application/geo+json,application/json"
                onChange={handlePolygonGeojsonImport}
                className="hidden"
              />
            </label>
          </div>
        )}
        {field.type === "select" ? (
          <select
            value={formData[field.name] || ""}
            onChange={(e) => updateFormField(field.name, e.target.value)}
            className={commonClass}
          >
            {field.options.map((option) => (
              <option key={option || "empty"} value={option}>
                {option || "Pilih opsi"}
              </option>
            ))}
          </select>
        ) : field.textarea ? (
          <textarea
            value={formData[field.name] || ""}
            onChange={(e) => updateFormField(field.name, e.target.value)}
            placeholder={field.placeholder || field.label}
            rows={2}
            className={`${commonClass} resize-none`}
          />
        ) : (
          <input
            type={field.type || "text"}
            step={field.step || (field.type === "number" ? "0.01" : undefined)}
            value={formData[field.name] || ""}
            onChange={(e) => updateFormField(field.name, e.target.value)}
            placeholder={field.placeholder || field.label}
            className={commonClass}
          />
        )}
      </div>
    );
  };

  const columns = [
    { key: "kode_aset", label: "Kode Aset", width: "120px", mono: true },
    { key: "nama_aset", label: "Nama Aset", width: "180px", truncate: true },
    { key: "jenis_masalah", label: "Jenis Masalah", width: "140px" },
    { key: "jenis_aset", label: "Jenis Aset", width: "130px" },
    { key: "sumber", label: "Sumber", width: "90px" },
    { key: "nib", label: "NIB", width: "110px", mono: true },
    { key: "nomor_hak", label: "Nomor Hak", width: "150px", mono: true },
    { key: "jenis_hak", label: "Jenis Hak", width: "120px" },
    {
      key: "status_sertifikat",
      label: "Status Sertifikat",
      width: "150px",
      type: "certificate",
    },
    { key: "surat_ukur", label: "Surat Ukur", width: "150px", mono: true },
    { key: "pemilik_pertama", label: "Pemilik Pertama", width: "180px", truncate: true },
    { key: "pemilik_akhir", label: "Pemilik Akhir", width: "180px", truncate: true },
    { key: "atas_nama", label: "Atas Nama", width: "180px", truncate: true },
    { key: "tanggal_sertifikat", label: "Tanggal Sertifikat", width: "150px", type: "date" },
    { key: "riwayat_perolehan", label: "Riwayat Perolehan", width: "160px" },
    { key: "status_hukum", label: "Status Hukum", width: "150px", type: "status" },
    { key: "produk", label: "Produk", width: "120px" },
    { key: "kw", label: "KW", width: "100px" },
    { key: "luas", label: "Luas Sertifikat (m2)", width: "150px", type: "number", align: "right" },
    { key: "luas_lapangan", label: "Luas Lapangan (m2)", width: "150px", type: "number", align: "right" },
    { key: "penggunaan", label: "Penggunaan", width: "160px", truncate: true },
    { key: "penggunaan_saat_ini", label: "Penggunaan Saat Ini", width: "170px", truncate: true },
    { key: "kecamatan", label: "Kecamatan", width: "130px" },
    { key: "kelurahan", label: "Kelurahan", width: "130px" },
    { key: "alamat", label: "Alamat", width: "220px", truncate: true },
    { key: "batas_utara", label: "Batas Utara", width: "160px", truncate: true },
    { key: "batas_selatan", label: "Batas Selatan", width: "160px", truncate: true },
    { key: "batas_timur", label: "Batas Timur", width: "160px", truncate: true },
    { key: "batas_barat", label: "Batas Barat", width: "160px", truncate: true },
    { key: "opd", label: "OPD", width: "180px", truncate: true },
    { key: "opd_pengguna", label: "OPD Pengguna", width: "180px", truncate: true },
    { key: "nilai_aset", label: "Nilai Aset", width: "150px", type: "currency", align: "right" },
    { key: "tahun_perolehan", label: "Tahun Perolehan", width: "150px", align: "center" },
    { key: "kode_bmd", label: "Kode BMD", width: "140px", mono: true },
    { key: "nilai_buku", label: "Nilai Buku", width: "150px", type: "currency", align: "right" },
    { key: "nilai_njop", label: "Nilai NJOP", width: "150px", type: "currency", align: "right" },
    { key: "sk_penetapan", label: "SK Penetapan", width: "180px", truncate: true },
    { key: "nibar", label: "NIBAR", width: "140px", mono: true },
    { key: "id_pemda", label: "ID Pemda", width: "140px", mono: true },
    { key: "kode_barang", label: "Kode Barang", width: "140px", mono: true },
    { key: "no_register", label: "No Register", width: "130px", mono: true },
    { key: "luas_kib", label: "Luas KIB (m2)", width: "130px", type: "number", align: "right" },
    { key: "harga_perolehan", label: "Harga Perolehan", width: "160px", type: "currency", align: "right" },
    { key: "penggunaan_kib", label: "Penggunaan KIB", width: "170px", truncate: true },
    { key: "tanggal_scan", label: "Tanggal Scan", width: "140px", type: "date" },
    { key: "file_sertifikat", label: "File Sertifikat", width: "180px", truncate: true },
    { key: "notes", label: "Notes", width: "180px", truncate: true },
    { key: "plotting_status", label: "Status Plotting", width: "150px" },
    { key: "koordinat_lat", label: "Latitude", width: "130px", mono: true },
    { key: "koordinat_long", label: "Longitude", width: "130px", mono: true },
    {
      key: "polygon_bidang",
      label: "Polygon Bidang",
      width: "180px",
      type: "json",
      truncate: true,
      sortable: false,
    },
    { key: "foto_aset", label: "Foto Aset", width: "180px", truncate: true },
    {
      key: "dokumen_pendukung",
      label: "Dokumen Pendukung",
      width: "200px",
      type: "json",
      truncate: true,
      sortable: false,
    },
    { key: "keterangan", label: "Keterangan", width: "200px", truncate: true },
  ];

  const tableMinWidth = columns.reduce((totalWidth, col) => {
    const width = parseInt(col.width, 10);
    return totalWidth + (Number.isNaN(width) ? 140 : width);
  }, 180);

  const stringifyCellValue = (value) => {
    if (value === null || value === undefined || value === "") return "";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const renderTableValue = (item, col) => {
    const value = item[col.key];
    if (value === null || value === undefined || value === "") return "-";

    if (col.type === "number") return formatNumber(value);
    if (col.type === "currency") return `Rp ${formatNumber(value)}`;
    if (col.type === "date") return value;
    if (col.type === "json") return stringifyCellValue(value);

    if (col.type === "certificate") {
      const normalized = String(value).toLowerCase();
      const isCertified =
        normalized.includes("sudah") || normalized.includes("telah");
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            isCertified
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {value}
        </span>
      );
    }

    if (col.type === "status") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-secondary text-text-secondary border border-border">
          {value}
        </span>
      );
    }

    return value;
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <DatabaseIcon size={24} weight="fill" className="text-surface" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-text-primary">
              Pusat Data Aset
            </h1>
            <p className="text-sm text-text-secondary">
              Master aset terpadu Kota Pasuruan
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchData();
              fetchStats();
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary bg-surface border border-border rounded-lg hover:bg-surface-secondary transition-all"
          >
            <ArrowsClockwiseIcon size={16} weight="bold" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          {canCreate && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-surface bg-accent hover:bg-accent-hover rounded-lg shadow-lg shadow-accent/20 transition-all"
            >
              <PlusIcon size={16} weight="bold" />
              Tambah Data
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <DatabaseIcon
                size={20}
                className="text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {formatNumber(stats.total)}
              </div>
              <div className="text-xs text-text-tertiary">Total Data</div>
            </div>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
              <MapPinIcon
                size={20}
                className="text-amber-600 dark:text-amber-400"
              />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {formatNumber(stats.totalLuas)}
              </div>
              <div className="text-xs text-text-tertiary">Total Luas (m²)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              placeholder="Cari NIB, nomor hak, kecamatan, kelurahan, OPD..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-surface-secondary border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-text-primary placeholder:text-text-muted transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <XIcon size={14} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-accent text-surface rounded-lg hover:bg-accent-hover text-sm font-medium transition-all"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm"
            style={{ minWidth: `${tableMinWidth}px` }}
          >
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider w-12">
                  No
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider transition-colors ${
                      col.sortable === false
                        ? ""
                        : "cursor-pointer hover:text-text-primary"
                    }`}
                    style={{ minWidth: col.width }}
                    onClick={() =>
                      col.sortable === false ? undefined : handleSort(col.key)
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      {col.sortable === false ? null : <SortIcon col={col.key} />}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider w-28">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + 2}
                    className="px-4 py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-text-muted">
                        Memuat data...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 2}
                    className="px-4 py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-surface-secondary rounded-2xl flex items-center justify-center">
                        <DatabaseIcon
                          size={32}
                          weight="duotone"
                          className="text-text-muted"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">
                          Belum ada data
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          {search
                            ? "Tidak ditemukan data yang sesuai"
                            : "Tambahkan data pertama Anda"}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr
                    key={item.id_pusat_data}
                    className="hover:bg-surface-secondary/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-text-muted text-xs">
                      {(page - 1) * limit + idx + 1}
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-xs ${
                          col.align === "right"
                            ? "text-right"
                            : col.align === "center"
                              ? "text-center"
                              : ""
                        } ${col.mono ? "font-mono" : ""} ${
                          col.key === "nib"
                            ? "font-medium text-text-primary"
                            : "text-text-secondary"
                        }`}
                      >
                        <span
                          className={`block ${
                            col.truncate
                              ? "max-w-48 truncate"
                              : ""
                          }`}
                          title={stringifyCellValue(item[col.key])}
                        >
                          {renderTableValue(item, col)}
                        </span>
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenView(item)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-all"
                          title="Lihat Detail"
                        >
                          <EyeIcon size={14} weight="bold" />
                        </button>
                        {canUpdate && (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 transition-all"
                            title="Edit"
                          >
                            <PencilSimpleIcon size={14} weight="bold" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(item)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all"
                            title="Hapus"
                          >
                            <TrashIcon size={14} weight="bold" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-surface-secondary/30">
            <p className="text-xs text-text-muted">
              Menampilkan {(page - 1) * limit + 1}-
              {Math.min(page * limit, total)} dari {total} data
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <CaretLeftIcon size={14} weight="bold" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                      page === pageNum
                        ? "bg-accent text-surface shadow-md"
                        : "text-text-muted hover:bg-surface-secondary"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <CaretRightIcon size={14} weight="bold" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================== CREATE/EDIT MODAL ==================== */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowForm(false);
              resetForm();
            }}
          />
          <div className="relative bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border bg-surface-secondary/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <DatabaseIcon
                    size={20}
                    weight="duotone"
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                </div>
                <div>
                  <h2 className="font-bold text-text-primary">
                    {editingItem ? "Edit Data" : "Tambah Data Baru"}
                  </h2>
                  <p className="text-xs text-text-muted">
                    {editingItem
                      ? "Perbarui informasi data aset"
                      : "Masukkan informasi data aset baru"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-secondary hover:text-text-primary transition-all"
              >
                <XIcon size={16} weight="bold" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Kode Aset */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <HashIcon size={12} weight="bold" />
                      Kode Aset
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.kode_aset}
                      onChange={(e) =>
                        setFormData({ ...formData, kode_aset: e.target.value })
                      }
                      placeholder="BPN-XXXXX"
                      className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-text-primary placeholder:text-text-muted transition-all"
                    />
                  </div>

                  {/* Nama Aset */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <FileTextIcon size={12} weight="bold" />
                      Nama Aset
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nama_aset}
                      onChange={(e) =>
                        setFormData({ ...formData, nama_aset: e.target.value })
                      }
                      placeholder="Nama aset"
                      className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-text-primary placeholder:text-text-muted transition-all"
                    />
                  </div>

                  {/* NIB */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <HashIcon size={12} weight="bold" />
                      NIB
                    </label>
                    <input
                      type="text"
                      value={formData.nib}
                      onChange={(e) =>
                        setFormData({ ...formData, nib: e.target.value })
                      }
                      placeholder="Nomor Identifikasi Bidang"
                      className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-text-primary placeholder:text-text-muted transition-all"
                    />
                  </div>

                  {/* Nomor Hak */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <FileTextIcon size={12} weight="bold" />
                      Nomor Hak
                    </label>
                    <input
                      type="text"
                      value={formData.nomor_hak}
                      onChange={(e) =>
                        setFormData({ ...formData, nomor_hak: e.target.value })
                      }
                      placeholder="Nomor sertifikat/hak"
                      className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-text-primary placeholder:text-text-muted transition-all"
                    />
                  </div>

                  {/* Jenis Hak */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <FileTextIcon size={12} weight="bold" />
                      Jenis Hak
                    </label>
                    <input
                      type="text"
                      value={formData.jenis_hak}
                      onChange={(e) =>
                        setFormData({ ...formData, jenis_hak: e.target.value })
                      }
                      placeholder="Hak Pakai, Hak Milik, HGB, dll"
                      className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-text-primary placeholder:text-text-muted transition-all"
                    />
                  </div>

                  {/* Luas */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <MapPinIcon size={12} weight="bold" />
                      Luas (m²)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.luas}
                      onChange={(e) =>
                        setFormData({ ...formData, luas: e.target.value })
                      }
                      placeholder="Luas dalam meter persegi"
                      className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-text-primary placeholder:text-text-muted transition-all"
                    />
                  </div>

                  {/* Luas Lapangan */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <MapPinIcon size={12} weight="bold" />
                      Luas Lapangan (m²)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.luas_lapangan}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          luas_lapangan: e.target.value,
                        })
                      }
                      placeholder="Luas lapangan"
                      className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-text-primary placeholder:text-text-muted transition-all"
                    />
                  </div>

                  {/* Penggunaan */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <BuildingsIcon size={12} weight="bold" />
                      Penggunaan
                    </label>
                    <input
                      type="text"
                      value={formData.penggunaan}
                      onChange={(e) =>
                        setFormData({ ...formData, penggunaan: e.target.value })
                      }
                      placeholder="Penggunaan saat ini"
                      className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-text-primary placeholder:text-text-muted transition-all"
                    />
                  </div>

                  {/* Kecamatan */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <MapPinIcon size={12} weight="bold" />
                      Kecamatan
                    </label>
                    <input
                      type="text"
                      value={formData.kecamatan}
                      onChange={(e) =>
                        setFormData({ ...formData, kecamatan: e.target.value })
                      }
                      placeholder="Kecamatan"
                      className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-text-primary placeholder:text-text-muted transition-all"
                    />
                  </div>

                  {/* Kelurahan */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <MapPinIcon size={12} weight="bold" />
                      Kelurahan
                    </label>
                    <input
                      type="text"
                      value={formData.kelurahan}
                      onChange={(e) =>
                        setFormData({ ...formData, kelurahan: e.target.value })
                      }
                      placeholder="Kelurahan"
                      className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-text-primary placeholder:text-text-muted transition-all"
                    />
                  </div>

                  {/* Status Sertifikat */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <CertificateIcon size={12} weight="bold" />
                      Status Sertifikat
                    </label>
                    <select
                      value={formData.status_sertifikat}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status_sertifikat: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-text-primary transition-all"
                    >
                      <option value="">Pilih status</option>
                      <option value="Telah Bersertifikat">
                        Telah Bersertifikat
                      </option>
                      <option value="Belum Bersertifikat">
                        Belum Bersertifikat
                      </option>
                    </select>
                  </div>

                  {/* Atas Nama */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <UserIcon size={12} weight="bold" />
                      Atas Nama
                    </label>
                    <input
                      type="text"
                      value={formData.atas_nama}
                      onChange={(e) =>
                        setFormData({ ...formData, atas_nama: e.target.value })
                      }
                      placeholder="Atas nama pemegang hak"
                      className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-text-primary placeholder:text-text-muted transition-all"
                    />
                  </div>

                  {/* Surat Ukur */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <FileTextIcon size={12} weight="bold" />
                      Surat Ukur
                    </label>
                    <input
                      type="text"
                      value={formData.surat_ukur}
                      onChange={(e) =>
                        setFormData({ ...formData, surat_ukur: e.target.value })
                      }
                      placeholder="Nomor surat ukur"
                      className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-text-primary placeholder:text-text-muted transition-all"
                    />
                  </div>

                  {/* Pemilik Pertama */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <UserIcon size={12} weight="bold" />
                      Pemilik Pertama
                    </label>
                    <input
                      type="text"
                      value={formData.pemilik_pertama}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pemilik_pertama: e.target.value,
                        })
                      }
                      placeholder="Pemilik pertama"
                      className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-text-primary placeholder:text-text-muted transition-all"
                    />
                  </div>

                  {/* Pemilik Akhir */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <UserIcon size={12} weight="bold" />
                      Pemilik Akhir
                    </label>
                    <input
                      type="text"
                      value={formData.pemilik_akhir}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pemilik_akhir: e.target.value,
                        })
                      }
                      placeholder="Pemilik akhir"
                      className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-text-primary placeholder:text-text-muted transition-all"
                    />
                  </div>

                  {/* Produk */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <FileTextIcon size={12} weight="bold" />
                      Produk
                    </label>
                    <input
                      type="text"
                      value={formData.produk}
                      onChange={(e) =>
                        setFormData({ ...formData, produk: e.target.value })
                      }
                      placeholder="Elektronik / Analog"
                      className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-text-primary placeholder:text-text-muted transition-all"
                    />
                  </div>

                  {/* KW */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <BuildingsIcon size={12} weight="bold" />
                      KW
                    </label>
                    <input
                      type="text"
                      value={formData.kw}
                      onChange={(e) =>
                        setFormData({ ...formData, kw: e.target.value })
                      }
                      placeholder="Kantor Wilayah"
                      className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-text-primary placeholder:text-text-muted transition-all"
                    />
                  </div>

                  {/* OPD */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <BuildingsIcon size={12} weight="bold" />
                      OPD
                    </label>
                    <input
                      type="text"
                      value={formData.opd}
                      onChange={(e) =>
                        setFormData({ ...formData, opd: e.target.value })
                      }
                      placeholder="Organisasi Perangkat Daerah"
                      className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-text-primary placeholder:text-text-muted transition-all"
                    />
                  </div>

                  {ADDITIONAL_FORM_SECTIONS.map((section) => (
                    <div
                      key={section.title}
                      className="sm:col-span-2 pt-3 border-t border-border/60"
                    >
                      <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
                        {section.title}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {section.fields.map(renderAdditionalField)}
                      </div>
                    </div>
                  ))}

                  {/* Alamat - full width */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <MapPinIcon size={12} weight="bold" />
                      Alamat
                    </label>
                    <textarea
                      required
                      value={formData.alamat}
                      onChange={(e) =>
                        setFormData({ ...formData, alamat: e.target.value })
                      }
                      placeholder="Alamat lengkap"
                      rows={2}
                      className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-text-primary placeholder:text-text-muted transition-all resize-none"
                    />
                  </div>

                  {/* Keterangan - full width */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <FileTextIcon size={12} weight="bold" />
                      Keterangan
                    </label>
                    <textarea
                      value={formData.keterangan}
                      onChange={(e) =>
                        setFormData({ ...formData, keterangan: e.target.value })
                      }
                      placeholder="Catatan tambahan"
                      rows={2}
                      className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-text-primary placeholder:text-text-muted transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-border bg-surface-secondary/30 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-surface-secondary transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-surface bg-accent hover:bg-accent-hover rounded-lg shadow-lg shadow-accent/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-surface border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FloppyDiskIcon size={16} weight="bold" />
                  )}
                  {editingItem ? "Simpan Perubahan" : "Tambah Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== VIEW MODAL ==================== */}
      {showView && viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowView(false)}
          />
          <div className="relative bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border bg-surface-secondary/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <EyeIcon
                    size={20}
                    weight="duotone"
                    className="text-blue-600 dark:text-blue-400"
                  />
                </div>
                <div>
                  <h2 className="font-bold text-text-primary">Detail Data</h2>
                  <p className="text-xs text-text-muted">
                    {viewingItem.kode_aset || viewingItem.nib || "-"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowView(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-secondary hover:text-text-primary transition-all"
              >
                <XIcon size={16} weight="bold" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    label: "Kode Aset",
                    value: viewingItem.kode_aset,
                    icon: HashIcon,
                  },
                  {
                    label: "Nama Aset",
                    value: viewingItem.nama_aset,
                    icon: FileTextIcon,
                  },
                  {
                    label: "NIB",
                    value: viewingItem.nib,
                    icon: HashIcon,
                  },
                  {
                    label: "Nomor Hak",
                    value: viewingItem.nomor_hak,
                    icon: FileTextIcon,
                  },
                  {
                    label: "Jenis Hak",
                    value: viewingItem.jenis_hak,
                    icon: FileTextIcon,
                  },
                  {
                    label: "Luas (m²)",
                    value: viewingItem.luas
                      ? formatNumber(viewingItem.luas)
                      : null,
                    icon: MapPinIcon,
                  },
                  {
                    label: "Luas Lapangan (m²)",
                    value: viewingItem.luas_lapangan
                      ? formatNumber(viewingItem.luas_lapangan)
                      : null,
                    icon: MapPinIcon,
                  },
                  {
                    label: "Penggunaan",
                    value: viewingItem.penggunaan,
                    icon: BuildingsIcon,
                  },
                  {
                    label: "Kecamatan",
                    value: viewingItem.kecamatan,
                    icon: MapPinIcon,
                  },
                  {
                    label: "Kelurahan",
                    value: viewingItem.kelurahan,
                    icon: MapPinIcon,
                  },
                  {
                    label: "Status Sertifikat",
                    value: viewingItem.status_sertifikat,
                    icon: CertificateIcon,
                  },
                  {
                    label: "Atas Nama",
                    value: viewingItem.atas_nama,
                    icon: UserIcon,
                  },
                  {
                    label: "Surat Ukur",
                    value: viewingItem.surat_ukur,
                    icon: FileTextIcon,
                  },
                  {
                    label: "Pemilik Pertama",
                    value: viewingItem.pemilik_pertama,
                    icon: UserIcon,
                  },
                  {
                    label: "Pemilik Akhir",
                    value: viewingItem.pemilik_akhir,
                    icon: UserIcon,
                  },
                  {
                    label: "Produk",
                    value: viewingItem.produk,
                    icon: FileTextIcon,
                  },
                  {
                    label: "KW",
                    value: viewingItem.kw,
                    icon: BuildingsIcon,
                  },
                  {
                    label: "OPD",
                    value: viewingItem.opd,
                    icon: BuildingsIcon,
                  },
                  {
                    label: "Status Aset",
                    value: viewingItem.status,
                    icon: CertificateIcon,
                  },
                  {
                    label: "Jenis Masalah",
                    value: viewingItem.jenis_masalah,
                    icon: FileTextIcon,
                  },
                  {
                    label: "Jenis Aset",
                    value: viewingItem.jenis_aset,
                    icon: BuildingsIcon,
                  },
                  {
                    label: "Sumber Data",
                    value: viewingItem.sumber,
                    icon: DatabaseIcon,
                  },
                  {
                    label: "Tanggal Sertifikat",
                    value: viewingItem.tanggal_sertifikat,
                    icon: CertificateIcon,
                  },
                  {
                    label: "Riwayat Perolehan",
                    value: viewingItem.riwayat_perolehan,
                    icon: FileTextIcon,
                  },
                  {
                    label: "Status Hukum",
                    value: viewingItem.status_hukum,
                    icon: CertificateIcon,
                  },
                  {
                    label: "Penggunaan Saat Ini",
                    value: viewingItem.penggunaan_saat_ini,
                    icon: BuildingsIcon,
                  },
                  {
                    label: "Batas Utara",
                    value: viewingItem.batas_utara,
                    icon: MapPinIcon,
                  },
                  {
                    label: "Batas Selatan",
                    value: viewingItem.batas_selatan,
                    icon: MapPinIcon,
                  },
                  {
                    label: "Batas Timur",
                    value: viewingItem.batas_timur,
                    icon: MapPinIcon,
                  },
                  {
                    label: "Batas Barat",
                    value: viewingItem.batas_barat,
                    icon: MapPinIcon,
                  },
                  {
                    label: "Kode BMD",
                    value: viewingItem.kode_bmd,
                    icon: HashIcon,
                  },
                  {
                    label: "Tahun Perolehan",
                    value: viewingItem.tahun_perolehan,
                    icon: FileTextIcon,
                  },
                  {
                    label: "Nilai Aset",
                    value: viewingItem.nilai_aset
                      ? formatNumber(viewingItem.nilai_aset)
                      : null,
                    icon: FileTextIcon,
                  },
                  {
                    label: "Nilai Buku",
                    value: viewingItem.nilai_buku
                      ? formatNumber(viewingItem.nilai_buku)
                      : null,
                    icon: FileTextIcon,
                  },
                  {
                    label: "Nilai NJOP",
                    value: viewingItem.nilai_njop
                      ? formatNumber(viewingItem.nilai_njop)
                      : null,
                    icon: FileTextIcon,
                  },
                  {
                    label: "Harga Perolehan",
                    value: viewingItem.harga_perolehan
                      ? formatNumber(viewingItem.harga_perolehan)
                      : null,
                    icon: FileTextIcon,
                  },
                  {
                    label: "SK Penetapan",
                    value: viewingItem.sk_penetapan,
                    icon: FileTextIcon,
                  },
                  {
                    label: "OPD Pengguna",
                    value: viewingItem.opd_pengguna,
                    icon: BuildingsIcon,
                  },
                  {
                    label: "Latitude",
                    value: viewingItem.koordinat_lat,
                    icon: MapPinIcon,
                  },
                  {
                    label: "Longitude",
                    value: viewingItem.koordinat_long,
                    icon: MapPinIcon,
                  },
                  {
                    label: "Polygon Bidang",
                    value: stringifyCellValue(viewingItem.polygon_bidang),
                    icon: MapPinIcon,
                  },
                  {
                    label: "Foto Aset",
                    value: viewingItem.foto_aset,
                    icon: FileTextIcon,
                  },
                  {
                    label: "Dokumen Pendukung",
                    value: stringifyCellValue(viewingItem.dokumen_pendukung),
                    icon: FileTextIcon,
                  },
                  {
                    label: "NIBAR",
                    value: viewingItem.nibar,
                    icon: HashIcon,
                  },
                  {
                    label: "ID Pemda",
                    value: viewingItem.id_pemda,
                    icon: HashIcon,
                  },
                  {
                    label: "Kode Barang",
                    value: viewingItem.kode_barang,
                    icon: HashIcon,
                  },
                  {
                    label: "No Register",
                    value: viewingItem.no_register,
                    icon: HashIcon,
                  },
                  {
                    label: "Luas KIB",
                    value: viewingItem.luas_kib
                      ? formatNumber(viewingItem.luas_kib)
                      : null,
                    icon: MapPinIcon,
                  },
                  {
                    label: "Penggunaan KIB",
                    value: viewingItem.penggunaan_kib,
                    icon: BuildingsIcon,
                  },
                  {
                    label: "Tanggal Scan",
                    value: viewingItem.tanggal_scan,
                    icon: FileTextIcon,
                  },
                  {
                    label: "File Sertifikat",
                    value: viewingItem.file_sertifikat,
                    icon: FileTextIcon,
                  },
                  {
                    label: "Status Plotting",
                    value: viewingItem.plotting_status,
                    icon: MapPinIcon,
                  },
                  {
                    label: "Notes",
                    value: viewingItem.notes,
                    icon: FileTextIcon,
                  },
                  {
                    label: "Alamat",
                    value: viewingItem.alamat,
                    icon: MapPinIcon,
                  },
                  {
                    label: "Keterangan",
                    value: viewingItem.keterangan,
                    icon: FileTextIcon,
                  },
                ].map((field) => (
                  <div
                    key={field.label}
                    className="flex items-start gap-3 p-3 bg-surface-secondary/50 rounded-xl border border-border/50"
                  >
                    <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center shrink-0 border border-border">
                      <field.icon
                        size={14}
                        weight="bold"
                        className="text-text-muted"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                        {field.label}
                      </p>
                      <p className="text-sm text-text-primary mt-0.5 wrap-break-word">
                        {field.value || "-"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border bg-surface-secondary/30 flex items-center justify-end gap-3 shrink-0">
              {canUpdate && (
                <button
                  onClick={() => {
                    setShowView(false);
                    handleOpenEdit(viewingItem);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
                >
                  <PencilSimpleIcon size={14} weight="bold" />
                  Edit
                </button>
              )}
              <button
                onClick={() => setShowView(false)}
                className="px-4 py-2.5 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-surface-secondary transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
