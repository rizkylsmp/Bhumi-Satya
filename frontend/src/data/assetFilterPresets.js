const presenceOptions = (availableLabel, missingLabel) => [
  { value: "true", label: availableLabel },
  { value: "false", label: missingLabel },
];

const location = {
  key: "has_location",
  label: "Koordinat",
  allLabel: "Semua koordinat",
  options: presenceOptions("Koordinat tersedia", "Tanpa koordinat"),
};

const certificate = {
  key: "is_certified",
  label: "Sertifikat",
  allLabel: "Semua sertifikat",
  options: presenceOptions("Bersertifikat", "Belum bersertifikat"),
};

const nibar = {
  key: "has_nibar",
  label: "NIBAR",
  allLabel: "Semua NIBAR",
  options: presenceOptions("NIBAR tersedia", "Tanpa NIBAR"),
};

const kecamatan = {
  key: "kecamatan",
  label: "Kecamatan",
  allLabel: "Semua kecamatan",
  optionsKey: "kecamatan",
  resetKeys: ["desa_kelurahan"],
};

const kelurahan = {
  key: "desa_kelurahan",
  label: "Kelurahan",
  allLabel: "Semua kelurahan",
  optionsKey: "kelurahan",
};

const jenisHak = {
  key: "jenis_hak",
  label: "Jenis hak",
  allLabel: "Semua jenis hak",
  optionsKey: "jenis_hak",
};

export const ASSET_FILTER_PRESETS = {
  pusatData: [
    location,
    certificate,
    nibar,
    kecamatan,
    kelurahan,
    jenisHak,
    {
      key: "status_sewa",
      label: "Penyewaan",
      allLabel: "Semua status sewa",
      feature: "rental",
      options: [
        { value: "tersewa", label: "Tersewa" },
        { value: "tidak", label: "Tidak tersewa" },
      ],
    },
  ],
  legal: [
    certificate,
    jenisHak,
    {
      key: "status_sertifikat",
      label: "Status sertifikat",
      allLabel: "Semua status sertifikat",
      optionsKey: "status_sertifikat",
    },
    {
      key: "status_hukum",
      label: "Status hukum",
      allLabel: "Semua status hukum",
      optionsKey: "status_hukum",
    },
  ],
  fisik: [
    location,
    kecamatan,
    kelurahan,
    {
      key: "penggunaan_saat_ini",
      label: "Penggunaan",
      allLabel: "Semua penggunaan",
      optionsKey: "penggunaan_saat_ini",
    },
  ],
  administratif: [
    {
      key: "tahun",
      label: "Tahun perolehan",
      allLabel: "Semua tahun perolehan",
      optionsKey: "tahun",
    },
    {
      key: "opd_pengguna",
      label: "OPD pengguna",
      allLabel: "Semua OPD pengguna",
      optionsKey: "opd_pengguna",
    },
    {
      key: "has_value",
      label: "Nilai perolehan",
      allLabel: "Semua nilai perolehan",
      options: presenceOptions("Nilai sudah diisi", "Nilai belum diisi"),
    },
  ],
  kib: [
    nibar,
    {
      key: "has_kode_barang",
      label: "Kode barang",
      allLabel: "Semua kode barang",
      options: presenceOptions("Kode barang tersedia", "Tanpa kode barang"),
    },
    {
      key: "plotting_status",
      label: "Status plotting",
      allLabel: "Semua status plotting",
      optionsKey: "plotting_status",
    },
    {
      key: "penggunaan_kib",
      label: "Penggunaan KIB",
      allLabel: "Semua penggunaan KIB",
      optionsKey: "penggunaan_kib",
    },
  ],
  pajak: [
    {
      key: "has_nop",
      label: "NOP",
      allLabel: "Semua NOP",
      options: presenceOptions("NOP tersedia", "Tanpa NOP"),
    },
    {
      key: "has_taxpayer",
      label: "Wajib pajak",
      allLabel: "Semua wajib pajak",
      options: presenceOptions("Wajib pajak tersedia", "Tanpa wajib pajak"),
    },
    {
      key: "pajak_status",
      label: "Status pajak",
      allLabel: "Semua status pajak",
      optionsKey: "pajak_status",
    },
  ],
};

