# Panduan Paket ZIP 3D Tiles

## Tujuan

Kelola 3D menerima paket 3D Tiles yang sudah siap tayang tanpa mengubahnya
menjadi GLB. Paket digunakan untuk model bangunan atau kawasan yang telah
memiliki georeferensi bumi.

## Struktur paket

ZIP harus memuat satu `tileset.json` utama dan seluruh file yang dirujuk olehnya.
Folder pembungkus diperbolehkan.

```text
nama-model.zip
└── nama-model/
    ├── tileset.json
    ├── tiles/
    │   ├── 0.b3dm
    │   └── 1.glb
    └── textures/
        └── facade.webp
```

Path relatif di dalam `tileset.json` harus sama dengan struktur di ZIP. Referensi
HTTP eksternal, path absolut, path traversal (`../`), data URI, blob URI, dan
implicit tiling bertemplate belum diterima.

## Georeferensi

- `boundingVolume.region` dibaca langsung sebagai koordinat geografis.
- `boundingVolume.box` atau `sphere` harus berada pada koordinat ECEF, atau
  memiliki `transform` yang memindahkannya ke ECEF.
- Paket lokal yang berpusat di sekitar `0,0,0` ditolak. Gunakan GLB bila model
  memang belum georeferensi.
- Pusat bounding volume disimpan sebagai lokasi model dan digunakan oleh tombol
  fly-to. Koordinat aset tetap digunakan untuk menilai apakah model terlalu jauh
  dari aset.
- Transformasi X/Y/Z Bhumi Satya tidak ditambahkan lagi pada paket 3D Tiles,
  sehingga georeferensi dari paket tidak diterapkan dua kali.

## Batas dan validasi

- Ukuran ZIP pada aplikasi: maksimal 100 MB.
- Ukuran hasil ekstraksi: maksimal 500 MB.
- Jumlah entri: maksimal 5.000 file.
- `tileset.json` wajib memiliki `asset.version` dan `root.boundingVolume`.
- Semua konten dan tileset turunan yang dirujuk harus berada di dalam ZIP.
- Arsip sumber dan file hasil ekstraksi dibersihkan bila salah satu proses unggah
  gagal.

Host serverless dapat memiliki batas request yang lebih kecil daripada batas
aplikasi. Untuk paket produksi berukuran besar, gunakan backend non-serverless
atau alur unggah langsung ke object storage yang tetap diikuti validasi server.

## Alur operator

1. Tambahkan atau pilih aset pada menu Kelola 3D.
2. Unggah ZIP melalui halaman Detail Kelola 3D.
3. Sistem memvalidasi paket dan menampilkan preview dari `tileset.json`.
4. Gunakan **Arahkan ke 3D** untuk menuju pusat georeferensi model.
5. Lengkapi metadata sumber dan checklist kualitas.
6. Ubah status menjadi **Terverifikasi**, lalu aktifkan model.
7. Arsip mempertahankan semua file. Hapus permanen membersihkan ZIP sumber dan
   seluruh file paket dari object storage.

