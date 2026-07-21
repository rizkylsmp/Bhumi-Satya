import { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import {
  XIcon,
  FloppyDiskIcon,
  MagnifyingGlassIcon,
  CaretDownIcon,
  BuildingsIcon,
  PlusIcon,
  TrashIcon,
  FileIcon,
  UploadIcon,
  WarningIcon,
  MapPinIcon,
  RulerIcon,
  CurrencyDollarIcon,
  CalendarIcon,
} from "@phosphor-icons/react";
import { asetService, uploadService } from "../../services/api";
import { normalizePolygonToGeometry } from "../../utils/geojsonExport";
import SewaPolygonMap from "./SewaPolygonMap";

const inputClass =
  "w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-surface text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors";

const PERIODE_BAYAR_OPTIONS = [
  "Bulanan",
  "Triwulan",
  "Semester",
  "Tahunan",
  "Sekali Bayar",
];

const PERIOD_MONTHS = {
  Bulanan: 1,
  Triwulan: 3,
  Semester: 6,
  Tahunan: 12,
};

const RENT_PERIOD_DIVISORS = {
  Bulanan: 12,
  Triwulan: 4,
  Semester: 2,
  Tahunan: 1,
  "Sekali Bayar": 1,
};

function formatCurrency(num) {
  const value = Number(num || 0);
  if (!value) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function countBillingPeriods(startDate, endDate, periode) {
  if (!startDate || !endDate) return 0;
  if (periode === "Sekali Bayar") return 1;

  const months = PERIOD_MONTHS[periode];
  if (!months) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  if (end <= start) return 0;

  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.ceil(days / (months * 30.4375)));
}

function calculateRentPerPeriod(nilaiAset, periode) {
  const baseValue = Number(nilaiAset || 0);
  if (!baseValue) return 0;
  const divisor = RENT_PERIOD_DIVISORS[periode] || 1;
  return Math.round(baseValue / divisor);
}

function countPolygonPoints(polygon) {
  const ring = polygon?.geometry?.coordinates?.[0] || polygon?.coordinates?.[0];
  if (!Array.isArray(ring)) return 0;
  if (ring.length < 2) return ring.length;
  const first = ring[0];
  const last = ring[ring.length - 1];
  const isClosed =
    Array.isArray(first) &&
    Array.isArray(last) &&
    Math.abs(Number(first[0]) - Number(last[0])) < 1e-9 &&
    Math.abs(Number(first[1]) - Number(last[1])) < 1e-9;
  return isClosed ? ring.length - 1 : ring.length;
}

function getAsetPolygonGeometry(aset) {
  return normalizePolygonToGeometry(
    aset?.polygon_bidang || aset?.polygon || aset?.polygon_sewa,
  );
}

export default function SewaFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false,
}) {
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    id_aset: "",
    nama_aset: "",
    lokasi_aset: "",
    no_lot: "",
    tanggal_mulai: "",
    tanggal_berakhir: "",
    nilai_sewa: "",
    periode_bayar: "Tahunan",
    catatan: "",
    polygon_sewa: null,
  });

  // Selected asset detail (read-only info)
  const [selectedAset, setSelectedAset] = useState(null);

  // Asset picker state
  const [asetList, setAsetList] = useState([]);
  const [asetSearch, setAsetSearch] = useState("");
  const [showAsetDropdown, setShowAsetDropdown] = useState(false);
  const [loadingAset, setLoadingAset] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch assets for picker
  const fetchAsetList = useCallback(async (search = "") => {
    setLoadingAset(true);
    try {
      const res = await asetService.getAll({
        limit: 50,
        ...(search && { search }),
        sort: "kode_aset",
        order: "ASC",
      });
      setAsetList(res.data?.data || []);
    } catch {
      setAsetList([]);
    } finally {
      setLoadingAset(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !isEdit) {
      fetchAsetList();
    }
  }, [isOpen, isEdit, fetchAsetList]);

  // Debounced search for assets
  useEffect(() => {
    if (!showAsetDropdown) return;
    const timer = setTimeout(() => {
      fetchAsetList(asetSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [asetSearch, showAsetDropdown, fetchAsetList]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowAsetDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectAset = (aset) => {
    const nilaiSewaPerPeriode = calculateRentPerPeriod(
      aset.nilai_aset,
      form.periode_bayar,
    );
    const assetPolygon = getAsetPolygonGeometry(aset);

    setForm((prev) => ({
      ...prev,
      id_aset: aset.id_aset,
      nama_aset: aset.nama_aset || aset.kode_aset || "",
      lokasi_aset: aset.lokasi || "",
      nilai_sewa: nilaiSewaPerPeriode || "",
      polygon_sewa: assetPolygon,
    }));
    setSelectedAset(aset);
    setGeojsonFileName(assetPolygon ? "Otomatis dari polygon data aset" : "");
    setAsetSearch("");
    setShowAsetDropdown(false);
  };

  // Foto sewa state
  const [fotoSewaFiles, setFotoSewaFiles] = useState([]);
  const [existingFotoSewa, setExistingFotoSewa] = useState([]);
  const fotoSewaInputRef = useRef(null);

  // Document upload state
  const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
  const [dokumenFiles, setDokumenFiles] = useState([]);
  const [existingDokumen, setExistingDokumen] = useState([]);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const fileInputRefs = useRef([]);
  const geojsonInputRef = useRef(null);
  const [geojsonFileName, setGeojsonFileName] = useState("");

  const addFileSlot = () => {
    setDokumenFiles((prev) => [...prev, { file: null, name: "" }]);
  };

  const removeFileSlot = (index) => {
    setDokumenFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingDoc = (index) => {
    setExistingDokumen((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setDokumenFiles((prev) =>
        prev.map((item, i) =>
          i === index
            ? { file: null, name: file.name, error: "Ukuran file melebihi 1MB" }
            : item,
        ),
      );
      return;
    }

    setDokumenFiles((prev) =>
      prev.map((item, i) =>
        i === index ? { file, name: file.name, error: null } : item,
      ),
    );
  };

  const handleGeojsonImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const polygon = normalizePolygonToGeometry(text);
      if (!polygon) {
        toast.error("File GeoJSON tidak memiliki polygon yang valid");
        return;
      }

      setForm((prev) => ({
        ...prev,
        polygon_sewa: polygon,
      }));
      setGeojsonFileName(file.name);
      toast.success("Polygon lokasi sewa berhasil diimpor");
    } catch (error) {
      console.error("Error importing sewa GeoJSON:", error);
      toast.error("Gagal membaca file GeoJSON");
    } finally {
      event.target.value = "";
    }
  };

  useEffect(() => {
    if (initialData) {
      const initialPolygon =
        initialData.polygon_sewa || getAsetPolygonGeometry(initialData.aset);
      setForm({
        id_aset: initialData.id_aset || "",
        nama_aset: initialData.nama_aset || "",
        lokasi_aset: initialData.lokasi_aset || "",
        no_lot: initialData.no_lot || "",
        tanggal_mulai: initialData.tanggal_mulai || "",
        tanggal_berakhir: initialData.tanggal_berakhir || "",
        nilai_sewa: initialData.nilai_sewa || "",
        periode_bayar: initialData.periode_bayar || "Tahunan",
        catatan: initialData.catatan || "",
        polygon_sewa: initialPolygon || null,
      });
      setExistingDokumen(
        Array.isArray(initialData.dokumen_pendukung)
          ? initialData.dokumen_pendukung
          : [],
      );
      setExistingFotoSewa(
        Array.isArray(initialData.foto_sewa) ? initialData.foto_sewa : [],
      );
      setSelectedAset(initialData.aset || null);
      setGeojsonFileName(
        !initialData.polygon_sewa && initialPolygon
          ? "Otomatis dari polygon data aset"
          : "",
      );
    } else {
      setForm({
        id_aset: "",
        nama_aset: "",
        lokasi_aset: "",
        no_lot: "",
        tanggal_mulai: "",
        tanggal_berakhir: "",
        nilai_sewa: "",
        periode_bayar: "Tahunan",
        catatan: "",
        polygon_sewa: null,
      });
      setExistingDokumen([]);
      setExistingFotoSewa([]);
      setSelectedAset(null);
      setGeojsonFileName("");
    }
    setDokumenFiles([]);
    setFotoSewaFiles([]);
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      if (name === "periode_bayar" && selectedAset?.nilai_aset) {
        return {
          ...prev,
          [name]: value,
          nilai_sewa: calculateRentPerPeriod(selectedAset.nilai_aset, value),
        };
      }

      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (dokumenFiles.some((d) => d.error)) return;

    // Upload new documents
    let uploadedUrls = [];
    const filesToUpload = dokumenFiles.filter((d) => d.file);

    if (filesToUpload.length > 0) {
      setUploadingDocs(true);
      try {
        for (const item of filesToUpload) {
          const res = await uploadService.single(item.file, "sewa-dokumen");
          if (res.data?.data?.url) {
            uploadedUrls.push(res.data.data.url);
          }
        }
      } catch {
        setUploadingDocs(false);
        return;
      }
      setUploadingDocs(false);
    }

    const allDokumen = [...existingDokumen, ...uploadedUrls];

    // Upload foto sewa
    let fotoSewaUrls = [];
    if (fotoSewaFiles.length > 0) {
      try {
        for (const file of fotoSewaFiles) {
          const res = await uploadService.single(file, "sewa-foto");
          if (res.data?.data?.url) fotoSewaUrls.push(res.data.data.url);
        }
      } catch {
        // continue
      }
    }
    const allFotoSewa = [...existingFotoSewa, ...fotoSewaUrls];

    onSubmit({
      ...form,
      id_aset: form.id_aset || null,
      tanggal_mulai: form.tanggal_mulai || null,
      tanggal_berakhir: form.tanggal_berakhir || null,
      nilai_sewa: nilaiSewaPerPeriode,
      periode_bayar: form.periode_bayar || "Tahunan",
      dokumen_pendukung: allDokumen.length > 0 ? allDokumen : null,
      foto_sewa: allFotoSewa.length > 0 ? allFotoSewa : null,
      polygon_sewa: form.polygon_sewa || null,
    });
  };

  if (!isOpen) return null;

  const billingPeriods = countBillingPeriods(
    form.tanggal_mulai,
    form.tanggal_berakhir,
    form.periode_bayar,
  );
  const nilaiAsetDasar = Number(selectedAset?.nilai_aset || 0);
  const autoNilaiSewa = calculateRentPerPeriod(
    nilaiAsetDasar,
    form.periode_bayar,
  );
  const nilaiSewaPerPeriode = selectedAset
    ? autoNilaiSewa
    : Number(form.nilai_sewa) || 0;
  const calculatedTotal = nilaiSewaPerPeriode * billingPeriods;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-surface rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-text-primary">
            {isEdit ? "Edit Aset Sewa" : "Sediakan Aset untuk Disewa"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
          >
            <XIcon size={20} className="text-text-muted" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Pilih Aset */}
          <fieldset className="border border-border rounded-xl p-4">
            <legend className="text-sm font-medium text-text-secondary px-2">
              Pilih Aset
            </legend>
            <div className="mt-2" ref={dropdownRef}>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Aset <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAsetDropdown(!showAsetDropdown)}
                  className={`${inputClass} text-left flex items-center justify-between gap-2 cursor-pointer`}
                >
                  {form.id_aset ? (
                    <span className="truncate">
                      <span className="font-mono font-semibold text-accent">
                        {form.nama_aset}
                      </span>
                      {form.lokasi_aset && (
                        <span className="text-text-muted ml-2 text-xs">
                          — {form.lokasi_aset}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-text-muted">
                      Cari dan pilih aset...
                    </span>
                  )}
                  <CaretDownIcon
                    size={14}
                    className="text-text-muted shrink-0"
                  />
                </button>

                {showAsetDropdown && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-border">
                      <div className="relative">
                        <MagnifyingGlassIcon
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                        />
                        <input
                          type="text"
                          value={asetSearch}
                          onChange={(e) => setAsetSearch(e.target.value)}
                          placeholder="Cari kode, nama, atau lokasi..."
                          className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-surface-secondary text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {loadingAset ? (
                        <div className="px-4 py-6 text-center text-sm text-text-muted">
                          Memuat data aset...
                        </div>
                      ) : asetList.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-text-muted">
                          Tidak ada aset ditemukan
                        </div>
                      ) : (
                        asetList.map((aset) => (
                          <button
                            key={aset.id_aset}
                            type="button"
                            onClick={() => handleSelectAset(aset)}
                            className={`w-full text-left px-3 py-2.5 flex items-start gap-3 hover:bg-surface-secondary transition-colors border-b border-border/50 last:border-0 ${
                              form.id_aset === aset.id_aset ? "bg-accent/5" : ""
                            }`}
                          >
                            <BuildingsIcon
                              size={16}
                              weight="duotone"
                              className="text-text-muted mt-0.5 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                                  {aset.kode_aset}
                                </span>
                                <span className="text-sm font-medium text-text-primary truncate">
                                  {aset.nama_aset}
                                </span>
                              </div>
                              {aset.lokasi && (
                                <p className="text-xs text-text-muted mt-0.5 truncate">
                                  {aset.lokasi}
                                </p>
                              )}
                              {aset.nilai_aset && (
                                <p className="text-xs text-text-muted mt-0.5">
                                  Nilai aset: {formatCurrency(aset.nilai_aset)}
                                </p>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {form.id_aset && (
                <button
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      id_aset: "",
                      nama_aset: "",
                      lokasi_aset: "",
                      nilai_sewa: "",
                      polygon_sewa: null,
                    }));
                    setSelectedAset(null);
                    setGeojsonFileName("");
                  }}
                  className="text-xs text-text-muted hover:text-red-500 mt-1 transition-colors"
                >
                  Hapus pilihan
                </button>
              )}
            </div>

            {/* Informasi Aset (read-only) */}
            {selectedAset && (
              <div className="mt-4 p-3 bg-surface-secondary rounded-lg border border-border/50 space-y-2">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                  Informasi Aset
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {selectedAset.kode_aset && (
                    <div>
                      <span className="text-text-muted">Kode Aset:</span>{" "}
                      <span className="font-mono font-medium text-text-primary">
                        {selectedAset.kode_aset}
                      </span>
                    </div>
                  )}
                  {selectedAset.atas_nama && (
                    <div>
                      <span className="text-text-muted">Atas Nama:</span>{" "}
                      <span className="text-text-primary">
                        {selectedAset.atas_nama}
                      </span>
                    </div>
                  )}
                  {selectedAset.lokasi && (
                    <div className="col-span-2 flex items-start gap-1">
                      <MapPinIcon
                        size={13}
                        className="text-text-muted mt-0.5 shrink-0"
                      />
                      <span className="text-text-primary">
                        {selectedAset.lokasi}
                      </span>
                    </div>
                  )}
                  {selectedAset.kecamatan && (
                    <div>
                      <span className="text-text-muted">Kecamatan:</span>{" "}
                      <span className="text-text-primary">
                        {selectedAset.kecamatan}
                      </span>
                    </div>
                  )}
                  {selectedAset.desa_kelurahan && (
                    <div>
                      <span className="text-text-muted">Desa/Kel:</span>{" "}
                      <span className="text-text-primary">
                        {selectedAset.desa_kelurahan}
                      </span>
                    </div>
                  )}
                  {selectedAset.luas && (
                    <div className="flex items-center gap-1">
                      <RulerIcon size={13} className="text-text-muted" />
                      <span className="text-text-muted">Luas:</span>{" "}
                      <span className="text-text-primary">
                        {Number(selectedAset.luas).toLocaleString("id-ID")} m²
                      </span>
                    </div>
                  )}
                  {selectedAset.nilai_aset && (
                    <div className="flex items-center gap-1">
                      <CurrencyDollarIcon
                        size={13}
                        className="text-text-muted"
                      />
                      <span className="text-text-muted">Nilai Aset:</span>{" "}
                      <span className="text-text-primary">
                        {formatCurrency(selectedAset.nilai_aset)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </fieldset>

          {/* Polygon Sewa */}
          <fieldset className="border border-border rounded-xl p-4">
            <legend className="text-sm font-medium text-text-secondary px-2">
              Polygon Lokasi Sewa
            </legend>
            <div className="mt-2 space-y-3">
              <div className="rounded-xl border border-dashed border-border bg-surface-secondary/60 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary">
                      Impor GeoJSON lokasi sewa
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      Jika aset sudah memiliki polygon, lokasi sewa akan terisi
                      otomatis. Impor GeoJSON dapat digunakan untuk mengganti
                      polygon lokasi sewa.
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold ${
                          form.polygon_sewa
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        <MapPinIcon size={13} weight="fill" />
                        {form.polygon_sewa
                          ? `${countPolygonPoints(form.polygon_sewa)} titik polygon`
                          : "Belum ada polygon"}
                      </span>
                      {geojsonFileName && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">
                          <FileIcon size={13} weight="fill" />
                          {geojsonFileName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => geojsonInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-white hover:bg-accent-dark transition-colors"
                    >
                      <UploadIcon size={16} weight="bold" />
                      Impor GeoJSON
                    </button>
                    {form.polygon_sewa && (
                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            polygon_sewa: null,
                          }));
                          setGeojsonFileName("");
                        }}
                        className="inline-flex items-center justify-center rounded-xl border border-border bg-surface p-2 text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Hapus polygon lokasi sewa"
                      >
                        <TrashIcon size={16} weight="bold" />
                      </button>
                    )}
                    <input
                      ref={geojsonInputRef}
                      type="file"
                      accept=".geojson,.json,application/geo+json,application/json"
                      onChange={handleGeojsonImport}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {form.polygon_sewa ? (
                <SewaPolygonMap
                  polygon={form.polygon_sewa}
                  height={280}
                  interactive={false}
                  compact
                  showHeader={false}
                />
              ) : (
                <div className="rounded-xl border border-border bg-surface-secondary px-4 py-5 text-center">
                  <MapPinIcon
                    size={28}
                    weight="duotone"
                    className="mx-auto text-text-muted mb-2"
                  />
                  <p className="text-xs text-text-muted">
                    Belum ada GeoJSON lokasi sewa yang diimpor.
                  </p>
                </div>
              )}
            </div>
          </fieldset>

          {/* Detail Sewa */}
          <fieldset className="border border-border rounded-xl p-4">
            <legend className="text-sm font-medium text-text-secondary px-2">
              Detail Sewa
            </legend>
            <div className="space-y-4 mt-2">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  No LOT
                </label>
                <input
                  type="text"
                  name="no_lot"
                  value={form.no_lot}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Nomor LOT sewa"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    name="tanggal_mulai"
                    value={form.tanggal_mulai}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Tanggal Berakhir
                  </label>
                  <input
                    type="date"
                    name="tanggal_berakhir"
                    value={form.tanggal_berakhir}
                    onChange={handleChange}
                    min={form.tanggal_mulai || undefined}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Nilai Sewa per Periode
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-secondary px-3 py-2.5 min-h-10.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <CurrencyDollarIcon
                        size={16}
                        weight="bold"
                        className="text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text-primary">
                        {nilaiSewaPerPeriode
                          ? formatCurrency(nilaiSewaPerPeriode)
                          : "-"}
                      </p>
                      <p className="text-[11px] text-text-muted">
                        Terisi otomatis dari nilai aset
                      </p>
                    </div>
                  </div>
                  <p className="mt-1 text-[11px] text-text-muted">
                    {nilaiAsetDasar
                      ? `Dasar perhitungan: ${formatCurrency(nilaiAsetDasar)}`
                      : "Pilih aset yang memiliki nilai aset agar nominal otomatis muncul."}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Periode Bayar
                  </label>
                  <select
                    name="periode_bayar"
                    value={form.periode_bayar}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    {PERIODE_BAYAR_OPTIONS.map((periode) => (
                      <option key={periode} value={periode}>
                        {periode}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(nilaiSewaPerPeriode > 0 || billingPeriods > 0) && (
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 p-3">
                  <div className="flex items-start gap-2">
                    <CalendarIcon
                      size={18}
                      weight="fill"
                      className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        Hitung otomatis nilai sewa
                      </p>
                      <p className="text-sm font-bold text-text-primary mt-0.5">
                        {formatCurrency(calculatedTotal)}
                      </p>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {billingPeriods || 0} periode x{" "}
                        {formatCurrency(nilaiSewaPerPeriode)} (
                        {form.periode_bayar})
                      </p>
                      {nilaiAsetDasar > 0 && (
                        <p className="text-[11px] text-text-muted mt-0.5">
                          Nilai per periode dihitung dari{" "}
                          {formatCurrency(nilaiAsetDasar)} /{" "}
                          {RENT_PERIOD_DIVISORS[form.periode_bayar] || 1}.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Catatan
                </label>
                <textarea
                  name="catatan"
                  value={form.catatan}
                  onChange={handleChange}
                  rows={3}
                  className={`${inputClass} resize-none`}
                  placeholder="Catatan tambahan terkait penyewaan (opsional)"
                />
              </div>
            </div>
          </fieldset>

          {/* Dokumen Pendukung */}
          <fieldset className="border border-border rounded-xl p-4">
            <legend className="text-sm font-medium text-text-secondary px-2">
              Dokumen Pendukung
            </legend>
            <p className="text-xs text-text-muted mb-3">
              Upload dokumen pendukung (maks. 5MB per file). Format: PDF, DOC,
              DOCX, JPG, PNG.
            </p>

            {existingDokumen.length > 0 && (
              <div className="space-y-2 mb-3">
                {existingDokumen.map((url, idx) => {
                  const fileName = url.split("/").pop() || `Dokumen ${idx + 1}`;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-2 bg-surface-secondary rounded-lg border border-border"
                    >
                      <FileIcon
                        size={16}
                        weight="duotone"
                        className="text-accent shrink-0"
                      />
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent hover:underline truncate flex-1"
                      >
                        {fileName}
                      </a>
                      <button
                        type="button"
                        onClick={() => removeExistingDoc(idx)}
                        className="p-1 text-text-muted hover:text-red-500 transition-colors"
                        title="Hapus dokumen"
                      >
                        <TrashIcon size={14} weight="bold" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {dokumenFiles.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <div className="flex-1 relative">
                  <input
                    ref={(el) => (fileInputRefs.current[idx] = el)}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => handleFileChange(idx, e)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[idx]?.click()}
                    className={`${inputClass} text-left flex items-center gap-2 cursor-pointer ${item.error ? "border-red-400 focus:ring-red-200" : ""}`}
                  >
                    <UploadIcon
                      size={15}
                      className="text-text-muted shrink-0"
                    />
                    <span
                      className={`truncate ${item.name ? (item.error ? "text-red-500" : "text-text-primary") : "text-text-muted"}`}
                    >
                      {item.name || "Pilih file..."}
                    </span>
                  </button>
                  {item.error && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                      <WarningIcon size={12} weight="fill" />
                      {item.error}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeFileSlot(idx)}
                  className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Hapus"
                >
                  <TrashIcon size={16} weight="bold" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addFileSlot}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-accent hover:bg-accent/10 rounded-lg transition-colors"
            >
              <PlusIcon size={14} weight="bold" />
              Tambah Dokumen
            </button>
          </fieldset>

          {/* Foto Sewa Aset */}
          <fieldset className="border border-border rounded-xl p-4">
            <legend className="text-sm font-medium text-text-secondary px-2">
              Foto Aset Sewa
            </legend>
            <p className="text-xs text-text-muted mb-3">
              Upload foto aset (maks. 10 foto, 5MB per file). Format: JPG, PNG,
              WebP.
            </p>

            {existingFotoSewa.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {existingFotoSewa.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative group aspect-4/3 rounded-lg overflow-hidden border border-border"
                  >
                    <img
                      src={url}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setExistingFotoSewa((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full items-center justify-center text-xs hidden group-hover:flex"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {fotoSewaFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {fotoSewaFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="relative group aspect-4/3 rounded-lg overflow-hidden border border-dashed border-accent/50"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`New ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFotoSewaFiles((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full items-center justify-center text-xs hidden group-hover:flex"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fotoSewaInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                const total =
                  existingFotoSewa.length + fotoSewaFiles.length + files.length;
                if (total > 10) {
                  return;
                }
                const valid = files.filter((f) => f.size <= 5 * 1024 * 1024);
                setFotoSewaFiles((prev) => [...prev, ...valid]);
                e.target.value = "";
              }}
            />
            {existingFotoSewa.length + fotoSewaFiles.length < 10 && (
              <button
                type="button"
                onClick={() => fotoSewaInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-accent hover:bg-accent/10 rounded-lg transition-colors"
              >
                <PlusIcon size={14} weight="bold" />
                Tambah Foto
              </button>
            )}
          </fieldset>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-text-secondary bg-surface-secondary hover:bg-surface-tertiary rounded-xl transition-colors border border-border"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || uploadingDocs || !form.id_aset}
              className="px-5 py-2.5 text-sm font-medium text-surface bg-linear-to-r from-accent to-accent/90 hover:shadow-lg hover:shadow-accent/30 disabled:opacity-50 rounded-xl transition-all flex items-center gap-2"
            >
              <FloppyDiskIcon size={16} />
              {uploadingDocs
                ? "Mengupload..."
                : isLoading
                  ? "Menyimpan..."
                  : isEdit
                    ? "Simpan Perubahan"
                    : "Sediakan Aset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
