# Changelog

Semua perubahan penting pada Bhumi Satya dicatat di dokumen ini. Formatnya
mengikuti prinsip [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/)
dan penomoran versi menggunakan [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Menambahkan tabel manajemen katalog 3D dengan Center X/Y, URL model, status,
  filter lanjutan, sort, dan ekspor CSV yang mengikuti hasil filter.
- Menambahkan UUID, CRUD, pencarian, filter, pagination, template CSV, dan impor
  massal untuk atribut per objek pada setiap versi model 3D.
- Kelola 3D menerima ZIP 3D Tiles georeferensi secara langsung, memvalidasi
  seluruh referensi paket, menampilkan preview, dan mengarahkan fly-to ke pusat
  model.
- Menambahkan validasi keamanan arsip 3D Tiles, rollback file parsial, serta
  pembersihan seluruh isi paket saat model arsip dihapus permanen.

### Changed

- Identitas produk disederhanakan menjadi `Digital Twin`; label sidebar juga
  diringkas tanpa kata `Aset`, termasuk
  `Kelola Data`, `Pusat Data`, `Penyewaan`, dan `Objek Tersedia`.
- Tampilan skala peta diperbarui menjadi ruler kartografis yang responsif,
  adaptif terhadap mode terang/gelap, dan tidak tertutup panel kontrol maupun
  atribusi peta pada desktop dan mobile.
- File WebAssembly `assimpjs.wasm` kini disertakan secara eksplisit dalam
  bundle backend Vercel agar impor dan konversi model 3D dapat berjalan pada
  runtime serverless.
- Identitas sistem diperbarui menjadi `Bhumi Satya — Digital Twin` pada
  metadata, navbar, header internal, footer, pengaturan,
  chatbot, dokumentasi, dan halaman API; hero landing page kini menekankan
  integrasi peta 2D, model 3D, serta data spasial.
- Navbar publik kini memakai satu layout persisten dengan susunan menu, ukuran,
  posisi, status aktif, dan aksi login yang konsisten di seluruh halaman.
- Rute beranda publik kini menggunakan `/beranda`; rute lama
  `/sewa-tersedia` dialihkan untuk menjaga kompatibilitas tautan.
- Kolom Aksi pada tabel Kelola 3D kini dibekukan di sisi kanan agar kontrol
  tetap terlihat saat tabel digeser horizontal.
- Data Model, Detail Model, dan Daftar Ruang pada detail Kelola 3D kini
  berganti sebagai komponen pada rute yang sama; seluruh komponen tetap
  terpasang agar data dan state form bertahan saat pengguna berpindah tab.
- UX Detail Model 3D kini menampilkan pemilih versi, ringkasan status dan file,
  informasi dasar yang lebih terstruktur, indikator perubahan menyeluruh,
  konfirmasi sebelum mengganti versi, serta aksi simpan/batalkan yang tetap
  mudah dijangkau.
- Data Legal, Fisik, Administratif, dan Spasial kini memakai aksi `Kelola`
  yang langsung membuka bagian data terkait, tanpa tombol `Tambah Aset` atau
  aksi penghapusan data master dari halaman substansi.
- Menu Data Spasial pada sidebar kini menjadi dropdown yang mengelompokkan
  Kelola 2D dan Kelola 3D sesuai hak akses pengguna.
- Seluruh halaman internal menggunakan density visual kompak yang mengikuti
  ukuran Kelola 3D, tanpa mengubah skala landing page, halaman publik, atau
  kanvas peta.
- Sidebar internal kini memakai ukuran kompak yang selaras dengan halaman,
  termasuk teks, ikon, padding, badge, dan panel submenu; menu Peta berada
  tepat di bawah Dashboard.
- Shell halaman internal kini menyesuaikan konten ke lebar viewport tanpa
  menyembunyikan overflow horizontal; wrapper density menggunakan lebar riil
  100%, sedangkan scroll horizontal hanya berada pada komponen yang memang
  lebih lebar, seperti tabel data.
- Merapikan struktur frontend dengan memisahkan context konfirmasi dari
  komponennya, memindahkan komponen form statis keluar dari render, dan
  menyederhanakan penamaan internal.
- Seluruh menu navigasi, dropdown, tab, pagination, dan kontrol peta kini
  tampil datar tanpa efek glow atau shadow dekoratif.
- Tombol pembuka panel peta kini selalu menggunakan label `Kontrol Peta`,
  tidak lagi berubah menjadi `Data 2D` atau `Data 3D`.
- Tombol login pada peta publik kini kembali ke rute login sekaligus langsung
  membuka panel login.

### Removed

- Menghapus fitur EKASMAT dari halaman publik, login, menu admin, routing,
  permission, service API, endpoint backend, model, dan artefak schema legacy.
- Menghapus menu, tombol, dan section Katalog Aset dari landing page.
- Menghapus modul frontend legacy yang tidak memiliki route/import aktif,
  aset logo lama, CSS Leaflet, serta dependency UI dan peta yang tidak dipakai.

### Fixed

- Memulihkan scroll vertikal seluruh landing page dan halaman publik dengan
  menghapus penguncian tinggi viewport serta overflow global pada dokumen.
- Memperbaiki panel kontrol yang kosong setelah ditutup dan dibuka kembali
  ketika mode 3D masih aktif.

### Documentation

- Menambahkan changelog awal berdasarkan riwayat Git dan audit kode pada
  23 Juli 2026.

### Known Issues

- Migrasi `sequelize-cli` belum dapat membangun seluruh skema pada database
  PostgreSQL kosong karena migrasi dasar berada di direktori yang tidak
  dikonfigurasi sebagai `migrations-path`.
- Model role lama (`pengelola_aset`, `verifikator_aset`, dan `viewer`) masih
  aktif di backend dan frontend; konsolidasi role internal menjadi `admin`
  belum tuntas.
- Modul 3D, migrasi, pipeline konversi, halaman pengelolaan, dan dependensinya
  masih tersedia meskipun pernah diputuskan untuk dibersihkan.
- Database lokal masih berisi satu aset contoh pengujian model 3D sehingga
  landing page belum benar-benar kosong dan masih menampilkan data nonresmi.
- Endpoint peta publik mengirim metadata pertanahan yang perlu ditinjau kembali
  sebelum dipublikasikan, termasuk NIB, nomor sertifikat, NIBAR, dan atas nama.
- Endpoint autentikasi publik belum memiliki rate limiting atau penguncian akun
  untuk membatasi percobaan login, OTP, registrasi, dan reset password.
- Tautan kontak landing page masih memakai nilai placeholder/tidak konsisten;
  WhatsApp mengarah ke `wa.me/-` dan nilai yang ditampilkan berbeda dari target
  telepon serta email.
- Lint frontend belum bersih dan integration test API belum lulus.
- Audit dependensi tanggal 23 Juli 2026 mendeteksi 17 kerentanan produksi di
  backend dan 10 di frontend.
- Build produksi berhasil, tetapi beberapa chunk JavaScript melampaui 500 kB.

## [0.1.0] - 2026-07-21

### Added

- Platform Bhumi Satya sebagai Digital Twin dengan frontend
  React/Vite dan backend Express/PostgreSQL.
- Landing page publik yang memaparkan aset dan menyediakan satu alur login.
- Peta publik dan peta internal berbagi komponen serta sumber data aset dari
  API/database.
- Master aset terintegrasi untuk data BPN dan BPKA, termasuk data legal, fisik,
  administratif, spasial, rekonsiliasi, pencarian, filter, statistik, dan
  riwayat perubahan.
- Portal masyarakat untuk registrasi, melihat aset tersedia, mengajukan sewa,
  dan memantau permintaan maupun sewa yang disetujui.
- Modul internal untuk dashboard, pengelolaan aset, pusat data, penyewaan,
  pengguna, notifikasi, riwayat audit, backup/restore, dan pengaturan.
- Autentikasi JWT, hashing password, OTP email/WhatsApp, MFA berbasis TOTP,
  reset password, perpanjangan sesi, dan notifikasi aktivitas login.
- Otorisasi berbasis role dan permission untuk `admin`, `pengelola_aset`,
  `verifikator_aset`, `viewer`, dan `masyarakat`.
- Dukungan data dan visualisasi 3D, termasuk unggahan KMZ, konversi GLB,
  optimasi LOD, metadata ruangan, serta 3D Tiles.
- Dukungan object storage untuk foto, dokumen, backup, dan model 3D.
- Konfigurasi database melalui `DATABASE_URL` atau variabel PostgreSQL terpisah,
  termasuk pengaturan pool untuk deployment serverless.
- Unit test backend untuk autentikasi, permission, adapter pusat data, audit,
  OTP, dan pipeline 3D serta unit test frontend untuk session dan utilitas data.

### Changed

- Identitas produk, teks antarmuka, email, dan copyright menggunakan nama
  Bhumi Satya.
- Logo utama disederhanakan menjadi monogram teks `BS`.
- Istilah "Mode Digital Twin" diganti menjadi "Mode 3D".
- Navigasi setelah login membedakan pengguna `masyarakat` dari pengguna
  internal berdasarkan role.

### Security

- Menambahkan middleware validasi JWT dan permission pada route internal.
- Membatasi tipe serta ukuran file pada endpoint unggahan umum dan model 3D.
- Menambahkan allowlist CORS untuk localhost dan domain Bhumi Satya.
- Menambahkan pencatatan audit untuk login dan mutasi data penting.
