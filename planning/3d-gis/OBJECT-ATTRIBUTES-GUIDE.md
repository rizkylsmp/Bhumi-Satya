# Panduan Atribut per Objek 3D

## Identitas objek

Setiap objek memiliki dua identitas:

- `id_object_3d`: UUID yang dibuat sistem dan tidak berubah ketika atribut diedit.
- `object_code`: kode bisnis yang unik di dalam satu versi model, misalnya
  `BLD-001`, `RUANG-201`, atau `UNIT-A-01`.

Objek terikat pada satu versi model. Membuat versi model baru tidak otomatis
menyalin atribut dari versi sebelumnya agar histori antarversi tetap jelas.

## Kolom yang tersedia

`object_code` dan `name` wajib diisi. Kolom lainnya adalah kategori, lantai,
penggunaan, luas, volume, tinggi, dan `properties` untuk atribut tambahan dalam
format JSON object.

Kategori tahap awal dibatasi pada `bangunan`, `ruang`, `unit`, dan `komponen`.
Kategori jalan, badan air, jalur kereta, dan landmark tidak diaktifkan sesuai
keputusan ruang lingkup.

## Impor CSV

Unduh template dari bagian **Atribut per Objek 3D**. CSV menerima maksimal 2 MB
dan 2.000 baris dengan kolom:

```text
object_code,name,category,floor,usage,area_m2,volume_m3,height_m,properties_json
```

- Baris valid langsung ditambahkan atau memperbarui objek dengan kode yang sama.
- UUID objek lama dipertahankan saat diperbarui melalui CSV.
- Baris tidak valid tidak membatalkan baris valid lain.
- Ringkasan impor menampilkan jumlah baru, diperbarui, dan daftar baris gagal.
- Kode objek duplikat dalam satu CSV dilaporkan sebagai kegagalan.

