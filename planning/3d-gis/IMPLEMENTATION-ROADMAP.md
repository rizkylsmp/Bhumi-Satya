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

## Penyelarasan dengan Modul Pelatihan Model 3D Jakarta Citata

Audit ulang dilakukan terhadap modul Citata edisi Juli 2025 yang terdiri dari 198
halaman. Bagian yang dijadikan acuan langsung untuk aplikasi adalah georeferensi,
LOD, CityGML, 3D Tiles, unggah web, atribut bangunan, pengelolaan data, dan
pemutakhiran model. Proses produksi desktop seperti DJI Terra, Agisoft Metashape,
Global Mapper, DREAM3D, SketchUp, dan Revit tidak otomatis menjadi fitur web.

### Kemampuan yang sudah tersedia

| ID | Kemampuan modul | Kondisi Bhumi Satya |
| --- | --- | --- |
| CIT-00A | Katalog data 3D terhubung ke data aset | Selesai |
| CIT-00B | Impor model, preview, fly-to, serta pengaturan posisi dan orientasi | Selesai untuk KMZ/GLB |
| CIT-00C | Versi model, aktif/nonaktif, arsip, pulihkan, dan hapus permanen | Selesai |
| CIT-00D | Metadata LOD, tinggi, lantai, kualitas, CRS, tanggal, dan akurasi | Selesai |
| CIT-00E | Konversi KMZ ke GLB dan penyajian sebagai 3D Tiles 1.1 | Selesai |
| CIT-00F | Daftar ruang yang terhubung ke versi model | Selesai |
| CIT-00G | Search, filter dasar, sort, dan pagination katalog Kelola 3D | Selesai |

### Keputusan ruang lingkup yang harus divalidasi

Kolom **Keputusan** diisi dengan `KERJAKAN`, `TUNDA`, atau `TIDAK`. Rekomendasi
merupakan titik awal dan belum dianggap persetujuan.

| ID | Calon pekerjaan | Rekomendasi | Keputusan |
| --- | --- | --- | --- |
| CIT-01 | Impor ZIP 3D Tiles secara langsung, validasi `tileset.json`, cegah path traversal, simpan ke object storage, dan tampilkan pada preview | KERJAKAN | KERJAKAN |
| CIT-02 | Impor CityGML/CityJSON/OBJ dan konversi server-side ke format tayang | TUNDA setelah CIT-01 stabil | TUNDA |
| CIT-03 | UUID bangunan dan tabel atribut per objek 3D, termasuk CRUD manual dan bulk upload CSV dengan template | KERJAKAN | KERJAKAN |
| CIT-04 | Tabel manajemen seperti modul: nama, kategori, status, Center X/Y, URL, dibuat, diperbarui, search, filter, dan export CSV sesuai hasil filter | KERJAKAN | KERJAKAN |
| CIT-05 | Kategori selain bangunan: jalan, badan air, jalur kereta, dan landmark | TIDAK untuk tahap awal karena fokus Bhumi Satya adalah aset tanah/bangunan | TIDAK |
| CIT-06 | Status publikasi dan verifikasi: draf, diproses, perlu verifikasi, terverifikasi, ditolak, aktif, dan kedaluwarsa | KERJAKAN | KERJAKAN |
| CIT-07 | Multi-epoch: membandingkan dua versi model untuk mencatat perubahan fisik antarwaktu | TUNDA sampai katalog dan atribut stabil | TUNDA |
| CIT-08 | Integrasi wajib Cesium Ion dan AWS S3 persis seperti modul | TIDAK; gunakan pipeline dan object storage Bhumi Satya yang provider-neutral | TIDAK |
| CIT-09 | Editor pemodelan lengkap di browser untuk menggantikan QGIS/DREAM3D/SketchUp/Revit | TIDAK; web hanya mengelola, memvalidasi, dan menayangkan hasil model | TIDAK |
| CIT-10 | SOP sumber data LiDAR, DTM/BHM, BO/RO, CRS, titik origin, satuan, dan checklist kualitas sebelum upload | KERJAKAN sebagai panduan dan validasi metadata | KERJAKAN |
| CIT-11 | Replace file model tanpa membuat versi baru | TIDAK; Bhumi Satya tetap membuat versi baru agar audit dan rollback terjaga | TIDAK |

Keputusan di atas disetujui pengguna pada 27 Juli 2026.

### Urutan implementasi setelah validasi

1. **Tahap A - Kontrak data dan keamanan:** CIT-06 dan bagian metadata CIT-10.
2. **Tahap B - Impor 3D Tiles ZIP:** CIT-01, termasuk validasi arsip, storage,
   endpoint tileset, preview, fly-to, arsip, dan penghapusan.
3. **Tahap C - Atribut objek 3D:** CIT-03, UUID, template CSV, validasi bulk,
   laporan baris gagal, dan CRUD manual.
4. **Tahap D - Manajemen katalog:** CIT-04 dan kategori yang disetujui dari CIT-05.
5. **Tahap E - Format lanjutan:** CIT-02 bila disetujui.
6. **Tahap F - Perubahan antarwaktu:** CIT-07 bila disetujui.

Setiap tahap harus melalui migration, backend test, frontend test, lint, production
build, dan uji preview sebelum tahap berikutnya dimulai. Pekerjaan implementasi baru
tidak dimulai sebelum keputusan ruang lingkup di atas dikonfirmasi.

### Progres implementasi berdasarkan keputusan

- [x] **Tahap A - Kontrak data dan keamanan** (27 Juli 2026)
  - Status model: draf, diproses, perlu verifikasi, terverifikasi, ditolak, aktif,
    dan kedaluwarsa.
  - Model hasil konversi wajib diverifikasi sebelum dapat diaktifkan.
  - Metadata sumber: jenis data, CRS, satuan, origin X/Y/Z, tanggal berlaku,
    catatan pemeriksa, dan identitas pemeriksa.
  - Checklist kualitas: dokumen sumber, CRS, origin, satuan, geometri, dan
    kecocokan atribut/ID.
  - Migration dan runtime schema safeguard untuk deployment serverless.
  - Audit trail untuk verifikasi dan aktivasi model.
- [x] **Tahap B - Impor 3D Tiles ZIP** (27 Juli 2026)
  - Unggah langsung ZIP 3D Tiles hingga 100 MB dan ekstraksi terkontrol hingga
    500 MB/5.000 file.
  - Validasi `tileset.json`, tileset turunan, referensi konten, georeferensi
    region/ECEF, serta perlindungan path traversal dan URL eksternal.
  - Struktur folder dipertahankan di object storage; `converted_public_url`
    menunjuk `tileset.json` utama tanpa konversi GLB.
  - Preview langsung tersedia sebelum aktivasi, sedangkan tileset aktif masuk
    ke endpoint peta yang sama dengan model GLB.
  - Fly-to memakai pusat bounding volume paket. Paket tidak diberi transformasi
    ECEF kedua.
  - Arsip mempertahankan file dan hapus permanen membersihkan ZIP sumber beserta
    seluruh isi paket.
  - Tidak memerlukan migration baru karena format, URL hasil, manifest, status
    konversi, dan metadata lokasi memakai kolom katalog model yang sudah ada.
  - Panduan operator dan struktur paket tersedia di
    `planning/3d-gis/3D-TILES-ZIP-GUIDE.md`.
- [x] **Tahap C - Atribut objek 3D** (27 Juli 2026)
  - Tabel atribut objek terpisah per versi model dengan UUID sebagai primary key
    dan kode objek unik per model.
  - CRUD manual untuk kategori bangunan, ruang, unit, dan komponen.
  - Atribut standar: nama, kategori, lantai, penggunaan, luas, volume, tinggi,
    dan properties JSON untuk kebutuhan tambahan.
  - Search, filter kategori, pagination, editor inline, serta tampilan UUID.
  - Template CSV dan impor maksimal 2.000 baris dengan upsert berbasis kode objek.
  - Impor parsial mempertahankan baris valid dan memberikan laporan rinci untuk
    setiap baris gagal.
  - Migration, runtime schema safeguard serverless, dan audit trail perubahan.
  - Panduan tersedia di `planning/3d-gis/OBJECT-ATTRIBUTES-GUIDE.md`.
- [x] **Tahap D - Manajemen katalog** (28 Juli 2026)
  - Tabel prioritas menampilkan nama, kategori Bangunan, status katalog dan
    model, Center X/Y, URL model, serta waktu dibuat/diperbarui.
  - Center mengutamakan koordinat model aktif dengan fallback koordinat aset.
  - Search mencakup kode 3D, kode aset, nama, dan lokasi.
  - Filter status katalog, ketersediaan model, status verifikasi, format, dan
    kelengkapan center.
  - Sort berdasarkan tanggal katalog/model, kode, nama, Center X, dan Center Y.
  - Ekspor CSV memakai filter dan sort aktif serta mengekspor seluruh hasil,
    bukan hanya halaman yang sedang terbuka.
  - Tidak memerlukan migration karena semua kolom merupakan proyeksi katalog,
    aset, dan versi model yang sudah ada.
  - Panduan tersedia di `planning/3d-gis/CATALOG-MANAGEMENT-GUIDE.md`.
- [ ] **Tahap E - Format lanjutan** (ditunda)
- [ ] **Tahap F - Perubahan antarwaktu** (ditunda)

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
3. Uji performa LOD tinggi/sedang/ringan dan validasi penempatan ECEF pada data staging organisasi.
4. Jangan memulai analisis Milestone 4 sebelum uji ujung-ke-ujung katalog dan versi model dinyatakan stabil.

## Catatan pengujian

- Keempat migrasi 3D sudah diterapkan dan diverifikasi pada PostgreSQL lokal `bhumi_satya` tanggal 19 Juli 2026. Penerapan ke staging/produksi tetap harus diawali pemeriksaan target koneksi.
- Data lama tetap valid; bangunan 3D hanya muncul bila footprint dan tinggi yang dapat digunakan tersedia.
- Konverter GLB sudah diuji dengan COLLADA minimal dan file contoh `LOD1.kmz`; pengujian database/object storage tetap memerlukan lingkungan pengembangan yang aman.
- Smoke test offline `LOD1.kmz` berhasil menjalankan parser, konversi GLB, pembuatan LOD, analisis bounds, dan pembentukan tileset 3D Tiles 1.1 tanpa mengunggah ke storage.
- Uji eksternal terkendali `LOD1.kmz` berhasil mengunggah dan mengunduh ulang KMZ serta tiga GLB dari Supabase dengan checksum cocok; seluruh file dan record sementara berhasil dibersihkan setelah pengujian.
- Data demo visual berlabel bukan data resmi dapat disiapkan dan dibersihkan otomatis pada database localhost untuk pemeriksaan peta melalui browser pengguna.
- Operasional worker dan batas deployment didokumentasikan di `planning/3d-gis/ASYNC-CONVERSION-RUNBOOK.md`.
