export const changelogEntries = [
  {
    id: "deployment-cache-recovery",
    date: "2026-08-06",
    type: "perbaikan",
    title: "Memulihkan cache setelah deployment",
    summary:
      "Halaman utama tidak lagi tersangkut pada versi lama setelah pembaruan dan dapat membersihkan cache aplikasi secara otomatis tanpa menghapus sesi login.",
    area: "Stabilitas",
  },
  {
    id: "orthophoto-basemap",
    date: "2026-08-05",
    type: "fitur",
    title: "Menambahkan basemap orthophoto",
    summary:
      "Basemap Orthophoto Clarity kini dapat dipilih pada Digital Twin 2D, mode 3D, dan preview model untuk melihat citra permukaan yang lebih jelas.",
    area: "Digital Twin",
  },
  {
    id: "temporarily-disable-rental-service",
    date: "2026-08-05",
    type: "peningkatan",
    title: "Menonaktifkan sementara layanan penyewaan",
    summary:
      "Menu penyewaan, portal masyarakat, pendaftaran akun publik, serta informasi sewa disembunyikan sementara tanpa menghapus modul dari sistem.",
    area: "Navigasi",
  },
  {
    id: "consistent-responsive-page-layout",
    date: "2026-08-04",
    type: "peningkatan",
    title: "Menyeragamkan tampilan halaman internal",
    summary:
      "Seluruh halaman dashboard kini mengikuti lebar, header, kelompok tombol, dan tata letak tabel Kelola 3D agar konsisten di desktop maupun perangkat seluler.",
    area: "Antarmuka",
  },
  {
    id: "parcel-2d-building-3d-hierarchy",
    date: "2026-08-04",
    type: "fitur",
    title: "Memisahkan kode bidang 2D dan bangunan 3D",
    summary:
      "Setiap bidang tanah kini memiliki kode 2D sendiri dan dapat menampung beberapa bangunan berkode 3D beserta versi modelnya secara terpisah.",
    area: "Kelola 3D",
  },
  {
    id: "map-search-overlay",
    date: "2026-08-04",
    type: "fitur",
    title: "Menambahkan pencarian data peta 2D dan 3D",
    summary:
      "Pencarian aset kini tersedia dalam overlay yang nyaman, tidak memuat ulang peta, dan dapat mengarahkan kamera langsung ke bidang atau model 3D.",
    area: "Digital Twin",
  },
  {
    id: "cesium-map-interactions",
    date: "2026-08-04",
    type: "peningkatan",
    title: "Menyempurnakan interaksi aset pada peta 3D",
    summary:
      "Bidang aset dapat disorot dan dibuka dari Cesium, fly-to mengikuti posisi model 3D, serta kontrol LOD dibuat lebih ringkas.",
    area: "Digital Twin",
  },
  {
    id: "physical-file-preview",
    date: "2026-08-04",
    type: "peningkatan",
    title: "Merapikan input foto kondisi aset",
    summary:
      "Foto yang dipilih dapat dipreview melalui tombol ringkas dan menu Dokumentasi yang tidak digunakan telah dihapus dari formulir aset.",
    area: "Pusat Data",
  },
  {
    id: "faster-stable-production-loading",
    date: "2026-08-04",
    type: "peningkatan",
    title: "Mempercepat dan menstabilkan pemuatan website",
    summary:
      "Mode 3D kini dimuat hanya saat diperlukan, data peta publik menggunakan cache singkat, dan kegagalan cache browser tidak lagi menyebabkan loading tanpa batas.",
    area: "Performa",
  },
  {
    id: "unified-login-registration-panel",
    date: "2026-08-03",
    type: "peningkatan",
    title: "Menyatukan login dan registrasi masyarakat",
    summary:
      "Login seluruh pengguna dan pendaftaran akun masyarakat kini tersedia dalam satu panel pada landing page.",
    area: "Login",
  },
  {
    id: "blackbox-testing-guide",
    date: "2026-08-03",
    type: "peningkatan",
    title: "Menambahkan panduan pengujian blackbox",
    summary:
      "Daftar pengujian inti disiapkan dalam format Excel agar hasil aktual dan status pemeriksaan sistem dapat dicatat dengan mudah.",
    area: "Dokumentasi",
  },
  {
    id: "stable-imported-model-position",
    date: "2026-08-02",
    type: "perbaikan",
    title: "Menstabilkan posisi model 3D hasil impor",
    summary:
      "Koordinat model dari KMZ kini tetap konsisten antara preview dan Digital Twin, sementara GLB tanpa georeferensi mengikuti lokasi aset.",
    area: "Kelola 3D",
  },
  {
    id: "coolify-deployment",
    date: "2026-08-01",
    type: "peningkatan",
    title: "Menyiapkan deployment Bhumi Satya di Coolify",
    summary:
      "Konfigurasi produksi disederhanakan agar frontend dan backend dapat dipublikasikan sebagai satu aplikasi.",
    area: "Deployment",
  },
  {
    id: "native-build",
    date: "2026-08-01",
    type: "perbaikan",
    title: "Menstabilkan proses build produksi",
    summary:
      "Proses build native digunakan untuk mengurangi kendala instalasi pada lingkungan deployment.",
    area: "Deployment",
  },
  {
    id: "map-popup-analysis",
    date: "2026-07-31",
    type: "peningkatan",
    title: "Menyempurnakan popup dan alat analisis peta",
    summary:
      "Informasi aset dan alat ukur peta dibuat lebih ringkas serta mudah digunakan.",
    area: "Digital Twin",
  },
  {
    id: "map-layer-controls",
    date: "2026-07-31",
    type: "peningkatan",
    title: "Menyederhanakan kontrol layer Digital Twin",
    summary:
      "Kontrol Level of Detail, layer, navigasi, dan tools ditata ulang dalam panel yang lebih efisien.",
    area: "Digital Twin",
  },
  {
    id: "polygon-centroid",
    date: "2026-07-31",
    type: "perbaikan",
    title: "Memperbaiki posisi titik tengah polygon",
    summary:
      "Perhitungan centroid dibuat lebih stabil dan tampilan tabel data dibuat lebih padat.",
    area: "Peta 2D",
  },
  {
    id: "data-center-popup",
    date: "2026-07-30",
    type: "peningkatan",
    title: "Merapikan pusat data dan popup aset",
    summary:
      "Tabel pusat data dan tampilan informasi aset disederhanakan agar lebih mudah dipindai.",
    area: "Pusat Data",
  },
  {
    id: "spatial-import",
    date: "2026-07-30",
    type: "peningkatan",
    title: "Meningkatkan proses impor data spasial",
    summary:
      "Impor data peta diperkuat dan format angka diselaraskan pada seluruh tampilan terkait.",
    area: "Data Spasial",
  },
  {
    id: "kib-tax-data",
    date: "2026-07-29",
    type: "fitur",
    title: "Menambahkan Data KIB dan Data Pajak",
    summary:
      "Halaman, navigasi, serta alur pengelolaan Data KIB dan Pajak tersedia di pusat data.",
    area: "Pusat Data",
  },
  {
    id: "popup-3d-attributes",
    date: "2026-07-29",
    type: "perbaikan",
    title: "Menyelaraskan popup peta dengan atribut 3D",
    summary:
      "Data aset dan atribut model 3D kini ditampilkan secara konsisten pada popup.",
    area: "Kelola 3D",
  },
  {
    id: "digital-twin-3d",
    date: "2026-07-29",
    type: "fitur",
    title: "Mengembangkan pengelolaan model dan peta 3D",
    summary:
      "Digital Twin memperoleh dukungan pengelolaan model, kontrol peta, dan tampilan bangunan 3D.",
    area: "Digital Twin",
  },
];
