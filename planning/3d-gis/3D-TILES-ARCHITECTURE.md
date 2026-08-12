# Arsitektur 3D Tiles Bhumi Satya

## Keputusan format

- KMZ tetap menjadi sumber asli.
- GLB menjadi format tayang untuk satu model.
- Kumpulan GLB aktif disajikan sebagai tileset 3D Tiles 1.1.
- GLB direferensikan langsung melalui `content.uri`; format lama B3DM tidak dibuat.

## Pipeline

1. Worker mengonversi KMZ/DAE menjadi GLB, membaca bounding box mesh, lalu membuat LOD sedang dan ringan untuk model dengan sedikitnya 1.000 segitiga.
2. Endpoint `/api/peta/models-3d/tileset.json` mengambil versi aktif yang berstatus `ready`.
3. Backend menghitung transformasi ECEF dari lokasi, orientasi, dan skala KML.
4. Bounding volume memakai ukuran mesh GLB; footprint/tinggi aset tetap menjadi batas konservatif bila hasil analisis mesh tidak tersedia.
5. Setiap model disusun sebagai rantai LOD ringan → sedang → tinggi dengan mode penggantian `REPLACE`.
6. Model dibagi menjadi hierarki spasial rekursif agar runtime dapat melakukan culling dan streaming.
7. Mode 3D memuat `Tile3DLayer` secara dinamis; model tanpa GLB siap tetap memakai fallback KMZ dan LOD1.

## Keamanan dan filter

- Endpoint tileset memerlukan autentikasi dan izin melihat peta.
- Frontend mengirim ID aset yang sedang berada dalam hasil peta, maksimum 1.000 ID per permintaan.
- URL GLB berasal dari object storage yang sama dengan katalog model.

## Batas saat ini

- Model di bawah 1.000 segitiga tidak disederhanakan karena overhead LOD lebih besar daripada manfaatnya.
- Tekstur belum dikompresi ke KTX2 dan tetap mengikuti hasil konversi GLB.
- Pengujian visual ECEF, heading, tilt, dan roll tetap perlu dilakukan pada data staging organisasi.

## Tahap optimasi berikutnya

- Menambahkan statistik waktu muat, penggunaan memori, tile gagal, dan cache hit.
- Memvalidasi tileset staging dengan validator resmi 3D Tiles.

## Atribusi

Simplifikasi mesh menggunakan meshoptimizer. Copyright (c) 2016-2026, Arseny Kapoulkine.
