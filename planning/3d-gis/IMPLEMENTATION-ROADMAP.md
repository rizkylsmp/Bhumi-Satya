# Roadmap Penerapan 3D GIS Bhumi Satya

## Tujuan

Menambahkan kemampuan 3D secara bertahap ke Bhumi Satya tanpa mengganti alur GIS 2D yang sudah berjalan. Tahap awal memakai model **LOD1**: tapak bangunan diekstrusi berdasarkan tinggi, sehingga pengguna dapat melihat volume bangunan dan tetap menelusuri aset yang sama.

## Prinsip penerapan

- Data 2D tetap menjadi sumber utama untuk bidang tanah dan lokasi aset.
- Mode 3D bersifat pilihan dan dapat dikembalikan ke tampilan 2D.
- Kualitas, sumber, waktu perekaman, CRS, dan akurasi data disimpan sebagai metadata.
- Data yang belum lengkap tetap dapat disimpan, tetapi diberi status kualitas dan tidak dianggap siap ditampilkan sebagai bangunan 3D.
- Validasi spasial memberi peringatan bila tapak bangunan jauh dari bidang/lokasi aset; pengguna tidak langsung diblokir agar data lama tetap dapat diperbaiki bertahap.

## Milestone 1 — Fondasi data 3D (selesai)

- [x] Menambahkan kolom tapak bangunan, tinggi, elevasi dasar, jumlah lantai, sumber tinggi, kualitas tinggi, LOD, CRS, tanggal perekaman, dan akurasi.
- [x] Menambahkan migrasi database yang aman untuk data aset lama karena seluruh kolom baru bersifat nullable.
- [x] Memvalidasi nilai numerik, enum kualitas/sumber/LOD, CRS, tanggal, dan struktur GeoJSON di backend.
- [x] Menyertakan metadata 3D pada respons API peta publik dan admin.
- [x] Menambahkan tes unit normalisasi dan validasi metadata.

**Kriteria selesai:** API dapat membuat, memperbarui, membaca, dan mengirim metadata 3D tanpa mengubah kontrak data 2D yang ada.

## Milestone 2 — LOD1 pada antarmuka peta (selesai)

- [x] Form aset dapat mengimpor tapak bangunan dari GeoJSON dan mengisi metadata LOD1.
- [x] Form menampilkan peringatan bila tapak bangunan jauh dari bidang/lokasi aset.
- [x] Detail aset menampilkan ringkasan ketersediaan, tinggi, lantai, kualitas, sumber, CRS, tanggal, dan akurasi.
- [x] Tapak bangunan dapat diekspor kembali sebagai GeoJSON.
- [x] Filter membedakan aset yang memiliki data 3D siap pakai dan yang belum lengkap.
- [x] Legenda menjelaskan tinggi terukur, turunan jumlah lantai, dan perkiraan.
- [x] Peta memiliki tombol Mode 3D/2D dan menampilkan bangunan sebagai ekstrusi LOD1.
- [x] Klik pada bangunan 3D tetap membuka aset Bhumi Satya yang terkait.
- [x] Menambahkan tes pembentukan feature collection dan pemeriksaan kedekatan spasial.

**Kriteria selesai:** pengguna dapat mengisi, memeriksa, memfilter, mengekspor, dan melihat bangunan LOD1 pada peta yang sama.

## Milestone 3 — Katalog dan unggah model 3D

- [x] Menerima KMZ sebagai format masukan awal untuk model georeferensi dari SketchUp/Google Earth.
- [x] Menetapkan GLB sebagai format tayang objek tunggal dan KMZ sebagai sumber asli; 3D Tiles tetap menjadi target untuk kumpulan/kawasan besar.
- [x] Menambahkan tabel versi model 3D yang terhubung ke aset, bukan hanya satu URL pada tabel aset.
- [x] Menambahkan unggah ke object storage dengan pemeriksaan ukuran, MIME type, checksum, dan hak akses.
- [x] Membaca KML di dalam KMZ serta memvalidasi model DAE/GLB/glTF, lokasi, orientasi, skala, dan inventaris isi.
- [x] Menyimpan versi, status, pembuat, waktu unggah, sumber koordinat, checksum, dan manifest file.
- [x] Menyediakan katalog versi pada detail aset dan tindakan mengganti versi aktif.
- [x] Menambahkan viewer lazy-load yang mengutamakan GLB hasil konversi dan memakai KMZ/LOD1 sebagai fallback bila pemuatan gagal.
- [x] Membuat proses konversi KMZ/DAE ke GLB, menyimpan checksum/status/galat hasil, serta menyediakan tindakan retry.
- [x] Memindahkan konversi ke antrean persisten dengan worker terpisah, retry, pemulihan pekerjaan macet, dan polling status di UI.
- [x] Menambahkan pratinjau di peta 3D, unduh KMZ/GLB melalui API berautentikasi, dan arsip model tanpa menghapus file maupun riwayat audit.
- [x] Menambahkan tileset 3D Tiles 1.1 dinamis, transformasi ECEF, hierarki spasial, streaming runtime, dan fallback KMZ/LOD1.
- [x] Menambahkan simplifikasi mesh/LOD bertingkat dan bounding box yang dihitung langsung dari GLB untuk model besar.

**Kriteria selesai:** model detail dapat dikelola, diaudit, dan ditampilkan tanpa membebani pemuatan awal peta.

## Milestone 4 — Analisis 3D untuk pengelolaan aset

- [ ] Menghitung estimasi luas lantai dan volume bangunan dengan label bahwa hasil bersifat estimasi.
- [ ] Membandingkan tapak bangunan terhadap bidang tanah untuk mendeteksi keluar batas atau tumpang tindih.
- [ ] Membuat daftar prioritas survei berdasarkan kelengkapan, usia, sumber, kualitas, dan akurasi data.
- [ ] Menambahkan analisis perubahan antarwaktu bila tersedia dua hasil survei atau model.
- [ ] Menambahkan ekspor laporan analisis beserta metodologi dan tingkat keyakinan.

**Kriteria selesai:** hasil analisis dapat ditelusuri kembali ke data sumber dan tidak disajikan sebagai ukuran legal.

## Milestone 5 — Integrasi survei dan pemutakhiran lapangan

- [ ] Menentukan SOP input dari drone, fotogrametri, LiDAR, GNSS, atau pengukuran manual.
- [ ] Menambahkan antrean verifikasi oleh petugas berwenang sebelum data dipublikasikan.
- [ ] Menyimpan riwayat koreksi geometri dan metadata lengkap pada audit trail.
- [ ] Menambahkan status data: draf, perlu verifikasi, terverifikasi, ditolak, dan kedaluwarsa.
- [ ] Menyediakan tampilan perbandingan data lapangan dengan bidang/aset yang tersimpan.

**Kriteria selesai:** pembaruan dari lapangan memiliki alur pemeriksaan, otorisasi, dan histori yang jelas.

## Milestone 6 — Kesiapan produksi dan tata kelola

- [ ] Menguji performa pada jumlah aset dan model yang menyerupai produksi.
- [ ] Menerapkan pemuatan berdasarkan area/zoom, cache, kompresi, dan batas penggunaan memori.
- [ ] Memastikan otorisasi backend berlaku untuk unggah, publikasi, penggantian versi, dan penghapusan/arsip.
- [ ] Menambahkan monitoring kegagalan pemrosesan, model rusak, waktu muat, dan penggunaan storage.
- [ ] Menyusun backup, retensi, pemulihan, dan prosedur migrasi model.
- [ ] Melakukan uji penerimaan pengguna dan menyiapkan panduan operasional.

**Kriteria selesai:** fitur 3D dapat dipelihara, dipantau, diamankan, dan dipulihkan dalam lingkungan produksi.

## Urutan kerja berikutnya

1. Terapkan keempat migrasi 3D pada database pengembangan setelah koneksi database dipastikan aman.
2. Lakukan uji ujung-ke-ujung: unggah KMZ contoh, konversi GLB, aktifkan versi, lalu buka Mode 3D pada peta.
3. Uji performa LOD tinggi/sedang/ringan dan validasi penempatan ECEF pada data staging di Pasuruan.
4. Jangan memulai analisis Milestone 4 sebelum uji ujung-ke-ujung katalog dan versi model dinyatakan stabil.

## Catatan pengujian

- Keempat migrasi 3D sudah diterapkan dan diverifikasi pada PostgreSQL lokal `bhumi_satya` tanggal 19 Juli 2026. Penerapan ke staging/produksi tetap harus diawali pemeriksaan target koneksi.
- Data lama tetap valid; bangunan 3D hanya muncul bila footprint dan tinggi yang dapat digunakan tersedia.
- Konverter GLB sudah diuji dengan COLLADA minimal dan file contoh `LOD1.kmz`; pengujian database/object storage tetap memerlukan lingkungan pengembangan yang aman.
- Smoke test offline `LOD1.kmz` berhasil menjalankan parser, konversi GLB, pembuatan LOD, analisis bounds, dan pembentukan tileset 3D Tiles 1.1 tanpa mengunggah ke storage.
- Uji eksternal terkendali `LOD1.kmz` berhasil mengunggah dan mengunduh ulang KMZ serta tiga GLB dari Supabase dengan checksum cocok; seluruh file dan record sementara berhasil dibersihkan setelah pengujian.
- Data demo visual berlabel bukan data resmi dapat disiapkan dan dibersihkan otomatis pada database localhost untuk pemeriksaan peta melalui browser pengguna.
- Operasional worker dan batas deployment didokumentasikan di `planning/3d-gis/ASYNC-CONVERSION-RUNBOOK.md`.
