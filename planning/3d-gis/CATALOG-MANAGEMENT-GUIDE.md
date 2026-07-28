# Panduan Tabel Manajemen Katalog 3D

## Informasi utama

Setiap baris Kelola 3D menampilkan kode 3D, nama aset, kategori, lokasi, status
model, Center X/Y, URL model, tanggal dibuat, dan tanggal model terakhir
diperbarui. Kategori tahap awal tetap **Bangunan** sesuai keputusan ruang
lingkup.

Center X adalah longitude dan Center Y adalah latitude. Sistem mengutamakan
pusat model aktif; bila belum tersedia, koordinat aset digunakan sebagai
fallback. URL mengutamakan hasil tayang GLB/3D Tiles dan memakai URL sumber bila
hasil tayang belum tersedia.

## Pencarian, filter, dan sort

Pencarian mencakup kode 3D, kode aset, nama, dan lokasi. Filter tersedia untuk:

- status katalog;
- ada atau belum adanya versi model;
- status verifikasi;
- format KMZ, GLB, atau 3D Tiles;
- ketersediaan Center X/Y.

Sort dapat menggunakan waktu katalog, waktu pembaruan model, kode, nama,
Center X, atau Center Y. Pagination dan baris per halaman hanya memengaruhi
tampilan, bukan isi ekspor.

## Ekspor CSV

Tombol **Ekspor CSV** mengirim pencarian, seluruh filter, dan sort aktif ke
backend. CSV memuat semua hasil yang cocok, tidak hanya baris pada halaman yang
sedang dibuka. Kolom ekspor:

```text
kode_3d,kode_aset,nama_aset,kategori,status_katalog,status_model,format,
center_x,center_y,url_model,dibuat,diperbarui
```

