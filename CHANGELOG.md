# Changelog

Semua perubahan penting pada Bhumi Satya dicatat di dokumen ini. Formatnya
mengikuti prinsip [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/)
dan penomoran versi menggunakan [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- Tombol pembuka panel peta kini selalu menggunakan label `Kontrol Peta`,
  tidak lagi berubah menjadi `Data 2D` atau `Data 3D`.
- Tombol login pada peta publik kini kembali ke rute login sekaligus langsung
  membuka panel login.

### Fixed

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
- Peta publik menghasilkan error MapLibre saat memuat proyeksi dan layer
  ekstrusi 3D karena ekspresi data dipakai pada `fill-extrusion-opacity`.
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

- Platform Bhumi Satya sebagai sistem informasi manajemen aset tanah Kota
  Pasuruan dengan frontend React/Vite dan backend Express/PostgreSQL.
- Landing page publik yang memaparkan aset dan menyediakan satu alur login.
- Peta publik dan peta internal berbagi komponen serta sumber data aset dari
  API/database.
- Master aset terintegrasi untuk data BPN dan BPKA, termasuk data legal, fisik,
  administratif, spasial, rekonsiliasi, pencarian, filter, statistik, dan
  riwayat perubahan.
- Portal masyarakat untuk registrasi, melihat aset tersedia, mengajukan sewa,
  dan memantau permintaan maupun sewa yang disetujui.
- Modul internal untuk dashboard, pengelolaan aset, pusat data, penyewaan,
  pengguna, notifikasi, riwayat audit, backup/restore, pengaturan, dan EKASMAT.
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
- Istilah "Mode digital twins" diganti menjadi "Mode 3D".
- Navigasi setelah login membedakan pengguna `masyarakat` dari pengguna
  internal berdasarkan role.

### Security

- Menambahkan middleware validasi JWT dan permission pada route internal.
- Membatasi tipe serta ukuran file pada endpoint unggahan umum dan model 3D.
- Menambahkan allowlist CORS untuk localhost dan domain Bhumi Satya.
- Menambahkan pencatatan audit untuk login dan mutasi data penting.
