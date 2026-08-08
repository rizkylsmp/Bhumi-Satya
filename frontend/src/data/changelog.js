export const changelogEntries = [
  {
    id: "pdf-brand-logo-coordinate-callout",
    date: "2026-08-08",
    type: "peningkatan",
    title: "Memperjelas identitas dan lokasi pada PDF",
    summary:
      "Header PDF kini memakai logo Bhumi Satya dan marker sketsa lokasi menampilkan latitude serta longitude dalam callout yang mudah dibaca.",
    area: "Dokumen PDF",
  },
  {
    id: "realtime-3d-shadow-analysis",
    date: "2026-08-08",
    type: "fitur",
    title: "Menambahkan analisis bayangan 3D",
    summary:
      "Analisis bayangan kini mempertahankan warna polygon 2D, membuat basemap terang pada siang dan gelap pada malam, serta menampilkan tepi bayangan yang lebih lembut.",
    area: "Digital Twin",
  },
  {
    id: "system-building-identity",
    date: "2026-08-08",
    type: "peningkatan",
    title: "Menyelaraskan identitas bangunan",
    summary:
      "Seluruh sistem kini menggunakan istilah kode bangunan dan nama bangunan serta menampilkan ID primary key pada daftar dan detail utama.",
    area: "Seluruh Sistem",
  },
  {
    id: "pdf-photo-and-location-sketch",
    date: "2026-08-08",
    type: "peningkatan",
    title: "Menambahkan foto dan sketsa lokasi ke PDF",
    summary:
      "Dokumen PDF kini menyertakan foto kondisi eksisting serta citra peta satelit dengan marker pada koordinat lokasi.",
    area: "Dokumen PDF",
  },
  {
    id: "official-data-sheet-pdf-layout",
    date: "2026-08-07",
    type: "peningkatan",
    title: "Memperbarui tampilan dokumen PDF",
    summary:
      "Unduhan data aset dan penyewaan kini memakai format lembar data resmi dengan header Bhumi Satya, tabel berbagian, dan penomoran halaman.",
    area: "Dokumen PDF",
  },
  {
    id: "public-digital-twin-hero-stats",
    date: "2026-08-07",
    type: "peningkatan",
    title: "Memperjelas ringkasan publik Digital Twin",
    summary:
      "Hero Beranda kini menampilkan jumlah bidang 2D, bangunan 3D, objek tersedia disewa, dan kecamatan yang tercakup berdasarkan data publik.",
    area: "Beranda",
  },
  {
    id: "configurable-production-database-ssl",
    date: "2026-08-07",
    type: "perbaikan",
    title: "Menyesuaikan koneksi database deployment",
    summary:
      "Proses migrasi dan backend kini mengikuti pengaturan SSL database sehingga deployment dapat menggunakan penyedia PostgreSQL tanpa SSL.",
    area: "Deployment",
  },
  {
    id: "spatial-editor-basemap-and-layout",
    date: "2026-08-07",
    type: "peningkatan",
    title: "Mempermudah pengisian data spasial",
    summary:
      "Peta gambar polygon kini langsung terbuka, impor GeoJSON ditempatkan setelah peta, dan pemilih titik maupun polygon menyediakan pilihan basemap.",
    area: "Kelola 2D",
  },
  {
    id: "accurate-notification-summary",
    date: "2026-08-07",
    type: "perbaikan",
    title: "Menyesuaikan ringkasan notifikasi",
    summary:
      "Jumlah total, belum dibaca, sudah dibaca, dan notifikasi hari ini kini dihitung dari seluruh data pengguna, bukan hanya halaman yang sedang dibuka.",
    area: "Notifikasi",
  },
  {
    id: "paginated-changelog",
    date: "2026-08-07",
    type: "peningkatan",
    title: "Mempermudah penelusuran changelog",
    summary:
      "Daftar perubahan kini dilengkapi pagination dan pilihan jumlah data per halaman agar riwayat panjang tetap ringkas dan mudah dibaca.",
    area: "Changelog",
  },
  {
    id: "unified-landing-digital-twin",
    date: "2026-08-07",
    type: "peningkatan",
    title: "Menyamakan Digital Twin di Beranda",
    summary:
      "Peta Beranda kini langsung terbuka dalam mode 3D dengan layer awal dan tampilan popup Data Umum yang konsisten dengan Digital Twin publik.",
    area: "Beranda",
  },
  {
    id: "instant-map-layer-visibility",
    date: "2026-08-07",
    type: "perbaikan",
    title: "Menghilangkan refresh saat mengganti layer",
    summary:
      "Switch marker dan polygon kini hanya mengubah visibilitas layer tanpa memuat ulang viewer atau mengubah posisi kamera.",
    area: "Digital Twin",
  },
  {
    id: "context-aware-2d-3d-map-popup",
    date: "2026-08-07",
    type: "perbaikan",
    title: "Menyesuaikan popup dengan objek peta yang dipilih",
    summary:
      "Klik bidang 2D kini menampilkan kode bidang dan jumlah bangunan terkait, sedangkan klik bangunan 3D menampilkan kode serta nama bangunan yang tepat.",
    area: "Digital Twin",
  },
  {
    id: "digital-twin-dashboard-coverage",
    date: "2026-08-07",
    type: "peningkatan",
    title: "Memperjelas statistik cakupan Digital Twin",
    summary:
      "Dashboard kini membandingkan bidang yang sudah dan belum terhubung ke bangunan 3D tanpa persentase model yang dapat melebihi jumlah bidang.",
    area: "Dashboard",
  },
  {
    id: "shared-building-name-per-3d-code",
    date: "2026-08-07",
    type: "perbaikan",
    title: "Menyatukan nama bangunan untuk seluruh LOD",
    summary:
      "Nama bangunan kini diisi satu kali untuk setiap kode 3D, digunakan oleh seluruh LOD, pencarian, daftar model, dan informasi popup peta.",
    area: "Kelola 3D",
  },
  {
    id: "exclusive-lod-map-display",
    date: "2026-08-07",
    type: "perbaikan",
    title: "Mencegah model antar-LOD bertumpuk",
    summary:
      "Digital Twin kini hanya menampilkan model dari satu LOD yang dipilih, dengan LOD 1 sebagai tampilan awal dan perpindahan penuh saat LOD lain dibuka.",
    area: "Digital Twin",
  },
  {
    id: "disable-orthophoto-menu-during-development",
    date: "2026-08-07",
    type: "peningkatan",
    title: "Menandai pengelolaan Orthophoto dalam pengembangan",
    summary:
      "Menu Kelola Orthophoto kini berada di bawah Kelola 3D dan dinonaktifkan sementara dengan penanda pengembangan.",
    area: "Navigasi",
  },
  {
    id: "remove-3d-availability-map-filter",
    date: "2026-08-07",
    type: "peningkatan",
    title: "Meringkas kontrol layer peta",
    summary:
      "Filter Ketersediaan 3D telah dihapus dari menu peta mode 2D dan 3D agar pilihan layer lebih ringkas dan langsung dipahami.",
    area: "Digital Twin",
  },
  {
    id: "stable-digital-twin-rendering",
    date: "2026-08-06",
    type: "perbaikan",
    title: "Menstabilkan tampilan peta Digital Twin",
    summary:
      "Inisialisasi ganda Cesium telah dicegah dan basemap tidak lagi dipasang ulang saat pilihannya belum berubah, sehingga peta tidak berkedip saat digunakan.",
    area: "Digital Twin",
  },
  {
    id: "batch-import-per-file-3d-target",
    date: "2026-08-06",
    type: "peningkatan",
    title: "Menambahkan pilihan tujuan pada import batch 3D",
    summary:
      "Setiap file batch kini dapat dibuatkan kode 3D baru atau dimasukkan sebagai versi model pada kode 3D yang sudah ada dalam bidang yang sama.",
    area: "Kelola 3D",
  },
  {
    id: "managed-3d-building-name-in-catalog",
    date: "2026-08-06",
    type: "perbaikan",
    title: "Menyelaraskan nama bangunan pada Kelola 3D",
    summary:
      "Kolom Nama/Kategori kini menampilkan nama bangunan 3D yang diisi pada Detail Model, termasuk pada pencarian, pengurutan, dan ekspor data.",
    area: "Kelola 3D",
  },
  {
    id: "interactive-map-compass",
    date: "2026-08-06",
    type: "peningkatan",
    title: "Menambahkan kompas interaktif pada peta",
    summary:
      "Kompas di samping kontrol zoom kini mengikuti putaran peta secara langsung dan dapat diklik untuk mengembalikan arah pandang ke utara pada mode 2D maupun 3D.",
    area: "Digital Twin",
  },
  {
    id: "batch-3d-import-per-parcel",
    date: "2026-08-06",
    type: "fitur",
    title: "Menambahkan import batch bangunan 3D",
    summary:
      "Beberapa file model kini dapat diimpor sekaligus ke satu kode 2D, dengan kode 3D dan status proses terpisah untuk setiap bangunan.",
    area: "Kelola 3D",
  },
  {
    id: "managed-internal-orthophoto",
    date: "2026-08-06",
    type: "fitur",
    title: "Menambahkan pengelolaan orthophoto internal",
    summary:
      "GeoTIFF kini dapat diunggah, dipreview, dan dipublikasikan sebagai pilihan basemap internal pada peta 2D, mode 3D, dan preview model.",
    area: "Data Spasial",
  },
  {
    id: "restore-selected-2d-polygon",
    date: "2026-08-06",
    type: "perbaikan",
    title: "Memulihkan polygon 2D setelah detail ditutup",
    summary:
      "Polygon bidang yang dibuka dari Kelola 2D kini kembali ke warna layer 2D normal setelah panel informasinya ditutup.",
    area: "Digital Twin",
  },
  {
    id: "compact-3d-import-control",
    date: "2026-08-06",
    type: "peningkatan",
    title: "Meringkas tampilan impor model 3D",
    summary:
      "Area impor kini menampilkan format, pilihan LOD, dan tombol file dalam satu baris ringkas agar proses unggah lebih cepat dipahami.",
    area: "Kelola 3D",
  },
  {
    id: "editable-3d-parcel-link",
    date: "2026-08-06",
    type: "peningkatan",
    title: "Memperbarui bidang 2D bangunan 3D",
    summary:
      "Kode 2D dapat diganti lewat ikon edit pada kartu kode, dan preview menampilkan polygon bidang yang sedang terhubung sebagai konteks model bangunan.",
    area: "Kelola 3D",
  },
  {
    id: "linked-dashboard-content",
    date: "2026-08-06",
    type: "peningkatan",
    title: "Menghubungkan dashboard dengan data terkait",
    summary:
      "Kartu, diagram, relasi 2D–3D, penyewaan, dan aktivitas dashboard kini dapat dibuka langsung menuju halaman pengelolaannya.",
    area: "Dashboard",
  },
  {
    id: "asset-2d-3d-management-flow",
    date: "2026-08-06",
    type: "fitur",
    title: "Menambahkan alur pengelolaan bidang 2D",
    summary:
      "Aset kini dipilih terlebih dahulu ke Kelola 2D untuk memperoleh kode bidang, kemudian bangunan 3D dibuat berdasarkan kode 2D tersebut.",
    area: "Kelola 2D",
  },
  {
    id: "accurate-map-search-and-spatial-stats",
    date: "2026-08-06",
    type: "perbaikan",
    title: "Memperbaiki tujuan pencarian dan statistik spasial",
    summary:
      "Pencarian 3D kini mengarah ke bangunan yang dipilih dan statistik dashboard dihitung dari bidang yang benar-benar masuk Kelola 2D.",
    area: "Digital Twin",
  },
  {
    id: "dashboard-buildings-per-parcel",
    date: "2026-08-06",
    type: "peningkatan",
    title: "Menampilkan relasi data 2D dan 3D",
    summary:
      "Dashboard kini memperlihatkan jumlah kode bangunan 3D yang terhubung pada setiap kode 2D.",
    area: "Dashboard",
  },
  {
    id: "compact-data-management-pages",
    date: "2026-08-06",
    type: "peningkatan",
    title: "Meringkas halaman pengelolaan data",
    summary:
      "Kartu ringkasan di halaman Kelola Data dan Kelola 3D dihapus agar pengguna dapat langsung mengakses pencarian, filter, dan tabel.",
    area: "Kelola Data dan 3D",
  },
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
