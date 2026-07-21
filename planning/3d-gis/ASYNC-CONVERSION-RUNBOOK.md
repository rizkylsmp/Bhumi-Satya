# Runbook Antrean Konversi Model 3D

## Tujuan

Konversi KMZ/DAE ke GLB dijalankan di luar request HTTP. Upload hanya menyimpan model dengan status `pending`, sehingga pengguna tidak perlu menunggu proses model selesai.

## Siklus status

1. `pending`: model menunggu worker.
2. `processing`: satu worker sudah mengunci dan mengambil model.
3. `ready`: GLB berhasil dibuat dan siap dipakai viewer.
4. `failed`: konversi gagal; pengguna dapat memilih **Coba Lagi** untuk mengembalikannya ke `pending`.

Pekerjaan `processing` yang tidak selesai melewati batas waktu akan dikembalikan ke `pending` saat worker berikutnya dimulai.

## Menjalankan worker

Dari folder `backend/`:

```bash
npm run model3d:worker
```

Mode ini terus aktif dan memeriksa antrean secara berkala. Untuk cron atau scheduled job yang harus berhenti setelah antrean kosong:

```bash
npm run model3d:worker:once
```

Verifikasi skema database dan pipeline file dapat dijalankan tanpa mengunggah ke object storage:

```bash
npm run model3d:schema:verify
npm run model3d:pipeline:verify -- "C:/lokasi/contoh.kmz"
```

Uji ujung-ke-ujung ke object storage eksternal hanya dijalankan setelah target `.env` diperiksa. Perintah berikut membuat record/aset sementara, mengunggah KMZ dan seluruh LOD, memverifikasi checksum hasil unduh, lalu menghapus kembali file, audit, dan record uji:

```bash
npm run model3d:external:verify -- "C:/lokasi/contoh.kmz" --confirm-external-cleanup
```

Jangan menjalankan opsi konfirmasi tersebut pada konfigurasi yang target database atau bucket-nya belum diketahui.

Untuk menyiapkan data demo visual pada database lokal, gunakan perintah berikut. Perintah membuat admin, aset, katalog model, serta file storage dengan penanda khusus `MODEL3D-VISUAL`; perintah akan menolak database non-localhost.

```bash
npm run model3d:visual:smoke -- create "C:/lokasi/contoh.kmz"
```

Setelah pemeriksaan UI selesai, hapus seluruh artefak demo visual dengan:

```bash
npm run model3d:visual:smoke -- cleanup
```

## Variabel lingkungan

- `MODEL3D_WORKER_POLL_MS`: interval polling, default 5000 ms dan minimum 1000 ms.
- `MODEL3D_WORKER_STALE_MINUTES`: batas pekerjaan dianggap macet, default 30 menit dan minimum 5 menit.
- `MODEL3D_WORKER_BATCH_LIMIT`: jumlah maksimum model pada mode `--once`, default 25.
- Worker memakai konfigurasi database dan Supabase Storage yang sama dengan backend.

## Deployment

- Server Node/cPanel/VPS: jalankan `model3d:worker` sebagai proses terpisah yang dikelola process manager.
- Serverless: jangan mengandalkan proses setelah respons HTTP selesai. Jalankan `model3d:worker:once` melalui scheduled worker/container yang memiliki akses ke database dan storage.
- Beberapa worker boleh berjalan bersamaan. Pengambilan job memakai row lock dan `skip locked` agar satu model tidak dikerjakan dua worker.

## Pemeriksaan operasional

- Pantau jumlah record `pending`, `processing`, dan `failed` pada `aset_model_3d`.
- Periksa `conversion_error` untuk kegagalan model.
- Pastikan pekerjaan tidak terus berada di `processing` melebihi `MODEL3D_WORKER_STALE_MINUTES`.
- Uji file besar di lingkungan staging sebelum menaikkan batas upload 50 MB.

## Hasil optimasi

Worker selalu menyimpan GLB utama (LOD tinggi) dan menghitung bounding box serta jumlah segitiganya. Untuk model dengan sedikitnya 1.000 segitiga, worker juga membuat LOD sedang (target 50%) dan LOD ringan (target 20%) secara berurutan agar penggunaan memori tetap terkendali. Ketiga tingkat tersebut disusun dinamis dalam hierarki 3D Tiles 1.1.

Jika optimasi LOD gagal tetapi GLB utama berhasil dibuat, model tetap berstatus `ready`. Penyebabnya disimpan pada `optimization_error` dan ditampilkan sebagai peringatan di katalog versi; viewer tetap dapat memakai GLB utama.
