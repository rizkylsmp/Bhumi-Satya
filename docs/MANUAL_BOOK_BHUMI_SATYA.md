# MANUAL BOOK APLIKASI BHUMI SATYA

**Sistem Informasi Pengelolaan Aset Tanah dan Digital Twin**

| Informasi Dokumen | Keterangan |
|---|---|
| Nama aplikasi | Bhumi Satya |
| Jenis dokumen | Manual Book / Panduan Pengguna |
| Instansi | Organisasi Pengelola Aset |
| Tanggal penyusunan | 6 Agustus 2026 |
| Status dokumen | Draf siap dipindahkan ke Microsoft Word |

---

## Lembar Pengesahan

| Disusun oleh | Diperiksa oleh | Disahkan oleh |
|---|---|---|
| Nama: ____________________ | Nama: ____________________ | Nama: ____________________ |
| Jabatan: __________________ | Jabatan: __________________ | Jabatan: __________________ |
| Tanggal: __________________ | Tanggal: __________________ | Tanggal: __________________ |
| Tanda tangan: | Tanda tangan: | Tanda tangan: |
| <br><br><br> | <br><br><br> | <br><br><br> |

---

## Riwayat Perubahan Dokumen

| No. | Tanggal | Uraian Perubahan | Penyusun |
|---:|---|---|---|
| 1 | 6 Agustus 2026 | Penyusunan awal manual book | ____________________ |

---

## Daftar Isi

1. Pendahuluan
2. Persyaratan dan Akses Aplikasi
3. Hak Akses Pengguna
4. Pengenalan Antarmuka
5. Halaman Publik
6. Masuk dan Keluar dari Aplikasi
7. Dashboard
8. Digital Twin
9. Pusat Data
10. Pendaftaran dan Pengelolaan Data Aset
11. Data Legal
12. Data Fisik
13. Data KIB
14. Data Administratif
15. Data Pajak
16. Kelola 2D
17. Kelola 3D
18. Riwayat Aktivitas
19. Notifikasi
20. Backup dan Restore
21. Profil Saya
22. Pengaturan
23. Manajemen User
24. Penanganan Kendala
25. Praktik Penggunaan yang Baik
26. Lampiran

> **Petunjuk untuk penyunting dokumen:** setelah dipindahkan ke Microsoft Word, gunakan fitur *References > Table of Contents* untuk membuat daftar isi otomatis dari struktur heading.

---

# 1. Pendahuluan

## 1.1 Tentang Bhumi Satya

Bhumi Satya adalah aplikasi pengelolaan aset tanah organisasi. Aplikasi menggabungkan data identitas, legal, fisik, Kartu Inventaris Barang (KIB), administratif, pajak, data spasial 2D, dan model 3D dalam satu sistem.

Fungsi utama aplikasi meliputi:

- menampilkan ringkasan kondisi aset;
- menyimpan dan memperbarui master data aset;
- menampilkan aset pada peta Digital Twin 2D dan 3D;
- mengelola data legal, fisik, KIB, administratif, dan pajak;
- mengelola polygon bidang tanah serta model bangunan 3D;
- mencatat riwayat aktivitas pengguna;
- mengirim dan mengelola notifikasi sistem;
- melakukan backup, ekspor, dan pemulihan data sesuai hak akses; dan
- mengelola profil, preferensi, serta akun pengguna.

## 1.2 Tujuan Manual Book

Dokumen ini membantu pengguna memahami cara mengakses dan menggunakan setiap halaman aktif pada aplikasi Bhumi Satya. Tampilan tombol dan menu dapat berbeda sesuai peran pengguna.

## 1.3 Konvensi Penulisan

- Nama tombol dan menu ditulis dengan format **tebal**.
- Teks yang harus diisi pengguna ditulis dengan format `monospace`.
- Kata **pilih** berarti klik atau ketuk elemen pada layar.
- Aksi penghapusan dan pemulihan data harus dilakukan dengan kehati-hatian.

---

# 2. Persyaratan dan Akses Aplikasi

## 2.1 Persyaratan Umum

Gunakan perangkat dan koneksi berikut agar aplikasi berjalan dengan baik:

- komputer, laptop, tablet, atau telepon genggam;
- browser modern, misalnya Google Chrome, Microsoft Edge, Mozilla Firefox, atau Safari versi terbaru;
- koneksi internet atau jaringan instansi yang stabil;
- JavaScript dan cookie browser aktif; dan
- akun Bhumi Satya yang masih aktif untuk mengakses halaman internal.

Untuk penggunaan peta 3D, disarankan memakai komputer dengan akselerasi grafis aktif dan koneksi yang stabil.

## 2.2 Membuka Aplikasi

1. Buka browser.
2. Masukkan alamat aplikasi yang diberikan administrator.
3. Tekan **Enter**.
4. Halaman beranda publik Bhumi Satya akan ditampilkan.

---

# 3. Hak Akses Pengguna

Aplikasi menggunakan pembatasan akses berdasarkan peran. Menu yang tidak diizinkan tidak akan ditampilkan atau tidak dapat dibuka.

| Peran | Kewenangan Utama |
|---|---|
| Admin | Akses penuh dashboard, data aset, Digital Twin, riwayat, notifikasi, backup/restore, pengaturan, dan manajemen user. |
| Pengelola Aset | Mengelola data aset dan data spasial, melihat dashboard lengkap, mengelola 3D, melihat riwayat yang diizinkan, dan menerima notifikasi. |
| Verifikator Aset | Melihat data, memperbarui atau memverifikasi data aset yang diizinkan, mengelola data spasial/3D yang diizinkan, serta menerima notifikasi. Tidak dapat menghapus aset. |
| Viewer | Melihat dashboard, data aset, Digital Twin, Pusat Data, dan notifikasi tanpa hak tambah, ubah, atau hapus. |
| Masyarakat | Diperuntukkan bagi modul layanan penyewaan ketika fitur tersebut diaktifkan. |

> **Catatan:** kewenangan akhir tetap mengikuti konfigurasi sistem dan kebijakan administrator. Jika tombol tidak muncul, kemungkinan akun tidak mempunyai izin untuk aksi tersebut.

---

# 4. Pengenalan Antarmuka

## 4.1 Header

Header berada di bagian atas halaman internal dan berisi:

- logo serta nama **Bhumi Satya** untuk kembali ke Dashboard;
- penghitung sisa waktu sesi;
- tombol mode terang/gelap;
- ikon lonceng dan jumlah notifikasi belum dibaca; dan
- menu profil pengguna.

## 4.2 Sidebar

Sidebar menyediakan menu sesuai peran pengguna. Tombol panah dapat digunakan untuk membuka submenu. Tombol sembunyikan/perluas sidebar membantu memperbesar area kerja. Pada layar kecil, gunakan tombol menu di header.

Menu utama yang dapat tersedia adalah:

- Dashboard;
- Digital Twin;
- Pusat Data;
- Kelola Data;
- Aktivitas & Sistem; dan
- Pengaturan.

## 4.3 Tabel Data

Tabel pada aplikasi umumnya mendukung:

- pencarian berdasarkan kata kunci;
- filter data;
- pengurutan dengan memilih judul kolom;
- perubahan jumlah baris per halaman;
- navigasi halaman; dan
- perubahan lebar kolom dengan menyeret batas kolom.

## 4.4 Sesi Pengguna

Sisa waktu sesi ditampilkan pada header. Saat waktu hampir habis, indikator berubah menjadi peringatan. Simpan pekerjaan sebelum sesi berakhir. Jika dialog sesi berakhir muncul, masuk kembali untuk melanjutkan.

### Ruang Screenshot — Struktur Antarmuka Internal

| Tempel screenshot halaman internal dan beri nomor pada Header, Sidebar, Area Konten, serta Menu Profil |
|---|
| <br><br><br><br><br><br><br><br> |

---

# 5. Halaman Publik

## 5.1 Beranda Publik

Halaman Beranda memperkenalkan Bhumi Satya dan menyediakan akses ke informasi publik, peta publik, dokumentasi, serta panel login.

Cara menggunakan:

1. Buka alamat aplikasi.
2. Gunakan navigasi atas untuk berpindah bagian.
3. Pilih **Login** untuk membuka panel masuk.
4. Gunakan tombol mode tampilan untuk beralih antara tema terang dan gelap.

### Ruang Screenshot — Beranda Publik

| Tempel screenshot penuh Halaman Beranda Publik di sini |
|---|
| <br><br><br><br><br><br><br><br> |

## 5.2 Peta Publik

Peta Publik menampilkan informasi spasial yang memang disediakan untuk pengunjung tanpa login.

Cara menggunakan:

1. Pilih menu **Peta Publik** dari navigasi publik.
2. Geser peta untuk berpindah lokasi.
3. Gunakan kontrol perbesar/perkecil.
4. Pilih objek pada peta untuk melihat informasi yang tersedia.
5. Gunakan pencarian atau kontrol layer bila ditampilkan.

### Ruang Screenshot — Peta Publik

| Tempel screenshot Halaman Peta Publik beserta kontrol petanya di sini |
|---|
| <br><br><br><br><br><br><br><br> |

## 5.3 Dokumentasi dan Changelog

Halaman Dokumentasi menampilkan catatan perkembangan aplikasi yang dikelompokkan berdasarkan waktu.

Cara menggunakan:

1. Pilih menu **Dokumentasi** pada navigasi publik.
2. Gulir halaman untuk membaca daftar fitur, peningkatan, dan perbaikan.
3. Perhatikan tanggal pada setiap catatan untuk mengetahui perubahan terbaru.

### Ruang Screenshot — Dokumentasi

| Tempel screenshot Halaman Dokumentasi di sini |
|---|
| <br><br><br><br><br><br><br><br> |

---

# 6. Masuk dan Keluar dari Aplikasi

## 6.1 Login

1. Pada halaman publik, pilih **Login**.
2. Masukkan `Username`.
3. Masukkan `Password`.
4. Pilih tombol **Masuk**.
5. Jika data benar, aplikasi mengarahkan pengguna ke halaman sesuai perannya.

Jika autentikasi tambahan diwajibkan:

1. Masukkan kode OTP enam digit dari aplikasi autentikator.
2. Pilih tombol verifikasi.
3. Jika akses ke autentikator tidak tersedia dan opsi tersebut muncul, pilih **Kirim OTP email**.

### Ruang Screenshot — Panel Login

| Tempel screenshot Panel Login di sini |
|---|
| <br><br><br><br><br><br><br><br> |

## 6.2 Lupa Kata Sandi

1. Pada panel login, pilih **Lupa password?**.
2. Masukkan username atau email akun.
3. Minta kode reset kata sandi.
4. Periksa email dan masukkan kode OTP enam digit.
5. Masukkan kata sandi baru minimal delapan karakter.
6. Ulangi kata sandi baru.
7. Simpan perubahan, lalu login kembali.

Jangan membagikan kode OTP kepada pihak lain.

### Ruang Screenshot — Lupa Kata Sandi

| Tempel screenshot alur Lupa Kata Sandi di sini |
|---|
| <br><br><br><br><br><br><br><br> |

## 6.3 Logout

1. Pilih foto/inisial pengguna di kanan atas.
2. Pilih **Keluar**.
3. Aplikasi menghapus sesi dan kembali ke halaman login.

Selalu logout setelah menggunakan komputer bersama.

---

# 7. Dashboard

Dashboard menampilkan ringkasan data aset dan Digital Twin. Informasi dapat mencakup statistik aset, kelengkapan data spasial, jumlah Digital Twin, grafik, dan aktivitas terbaru.

Cara menggunakan:

1. Pilih **Dashboard** pada sidebar.
2. Baca kartu ringkasan untuk mengetahui kondisi data secara cepat.
3. Gunakan grafik atau panel statistik untuk membandingkan data.
4. Pilih elemen interaktif yang tersedia untuk menuju data terkait.
5. Pastikan indikator **Data aktual** muncul pada bagian atas.

### Ruang Screenshot — Dashboard

| Tempel screenshot penuh Halaman Dashboard di sini |
|---|
| <br><br><br><br><br><br><br><br> |

---

# 8. Digital Twin

Halaman Digital Twin adalah ruang kerja peta internal untuk data bidang 2D dan model 3D.

## 8.1 Pencarian Data Peta

1. Pilih **Digital Twin**.
2. Pilih kotak **Cari data 2D atau 3D**.
3. Masukkan minimal sebagian kode aset, nama, lokasi, atau NIBAR.
4. Pilih tab **Data 2D** atau **Data 3D**.
5. Pilih hasil pencarian untuk mengarahkan kamera ke objek.

## 8.2 Kontrol Layer 2D

Pada panel **Layer Peta**, pengguna dapat:

- memilih layer utama;
- menampilkan bidang yang sudah atau belum bersertifikat;
- menampilkan batas kelurahan atau kecamatan;
- menyaring data berdasarkan ketersediaan model 3D; dan
- menampilkan atau menyembunyikan polygon.

Pilih bidang pada peta untuk membuka informasi aset. Dari panel detail, pengguna dapat melihat informasi lebih lanjut, mengunduh data yang tersedia, atau mengubah data jika memiliki izin.

## 8.3 Mode 3D

Pada mode 3D, pengguna dapat:

- memilih Level of Detail (LOD);
- mencari dan memilih model 3D;
- menampilkan, menyembunyikan, memfokuskan, atau mengisolasi model;
- memilih tampilan perspektif, tampak atas, fokus model, atau arah utara;
- membuka daftar ruang dan potongan model; serta
- memakai alat ukur jarak, volume, tinggi, dan koordinat.

Gunakan tombol **Kembali ke 2D** untuk menutup mode 3D.

### Ruang Screenshot — Digital Twin Mode 2D

| Tempel screenshot Digital Twin 2D beserta panel layer di sini |
|---|
| <br><br><br><br><br><br><br><br> |

### Ruang Screenshot — Digital Twin Mode 3D

| Tempel screenshot Digital Twin 3D beserta kontrol model di sini |
|---|
| <br><br><br><br><br><br><br><br> |

---

# 9. Pusat Data

Pusat Data merupakan master daftar aset terpadu.

## 9.1 Mencari dan Memfilter Aset

1. Pilih **Pusat Data**.
2. Masukkan kata kunci pada kotak **Cari**.
3. Jika diperlukan, buka filter lanjutan.
4. Pilih satu atau beberapa filter, seperti kecamatan, kelurahan, ketersediaan lokasi, NIBAR, jenis hak, status sertifikat, sumber data, atau status rekonsiliasi.
5. Hapus filter untuk kembali ke seluruh data.

## 9.2 Aksi pada Data

Ikon pada kolom **Aksi** dapat digunakan untuk:

- melihat detail aset;
- melihat aset di peta;
- mengunduh PDF aset;
- mengunduh GeoJSON jika polygon tersedia;
- mengubah data; dan
- menghapus data jika mempunyai izin.

Pilih judul kolom untuk mengurutkan data. Gunakan navigasi di bawah tabel untuk berpindah halaman atau mengubah jumlah data per halaman.

> **Peringatan:** penghapusan aset dapat memengaruhi data yang berkaitan. Baca dialog konfirmasi sebelum melanjutkan.

### Ruang Screenshot — Pusat Data

| Tempel screenshot Halaman Pusat Data beserta filter dan tombol aksi di sini |
|---|
| <br><br><br><br><br><br><br><br> |

### Ruang Screenshot — Detail Aset

| Tempel screenshot modal/panel Detail Aset di sini |
|---|
| <br><br><br><br><br><br><br><br> |

---

# 10. Pendaftaran dan Pengelolaan Data Aset

## 10.1 Mendaftarkan Aset Baru

1. Buka **Pusat Data**.
2. Pilih **Daftarkan Aset Baru**.
3. Isi data inti, terutama kode aset dan nama aset.
4. Lengkapi bagian yang diperlukan.
5. Pilih **Simpan**.
6. Pastikan muncul notifikasi berhasil.

Data aset disusun dalam bagian:

| Bagian | Contoh Data |
|---|---|
| Identitas | Kode aset, nama aset, jenis aset, OPD pengguna, tahun perolehan. |
| Legal | Nomor dan status sertifikat, jenis hak, atas nama, tanggal sertifikat, status hukum. |
| Fisik | Lokasi, kecamatan, kelurahan, penggunaan, luas, batas bidang, foto. |
| KIB | NIBAR, ID Pemda, kode barang, nomor register, luas KIB, harga perolehan. |
| Pajak | FID, NOP, wajib pajak, luas bumi/bangunan, NJOP, dan PBB. |
| Spasial | Koordinat lokasi dan polygon bidang tanah. |
| Administratif | Kode BMD, OPD pengguna, nilai perolehan, nilai buku, nilai NJOP, dan SK penetapan. |

## 10.2 Mengubah Data Aset

1. Cari aset pada Pusat Data atau halaman substansi.
2. Pilih ikon **Edit/Ubah Data** atau tombol **Kelola**.
3. Pilih bagian data yang akan diperbarui.
4. Ubah informasi yang diperlukan.
5. Pilih **Simpan Perubahan**.
6. Periksa kembali data setelah proses berhasil.

## 10.3 Mengisi Koordinat dan Polygon

1. Buka bagian **Fisik** atau **Spasial** pada formulir aset.
2. Pilih titik lokasi melalui pemilih koordinat atau masukkan koordinat yang benar.
3. Gambar atau unggah polygon menggunakan kontrol yang tersedia.
4. Periksa bentuk bidang pada peta.
5. Simpan perubahan.

Pastikan koordinat tidak tertukar antara lintang dan bujur serta polygon tidak saling berpotongan.

### Ruang Screenshot — Form Aset Baru

| Tempel screenshot Form Pendaftaran Aset Baru di sini |
|---|
| <br><br><br><br><br><br><br><br> |

### Ruang Screenshot — Form Kelola/Ubah Aset

| Tempel screenshot Form Kelola Aset beserta tab bagian data di sini |
|---|
| <br><br><br><br><br><br><br><br> |

---

# 11. Data Legal

Halaman Data Legal menampilkan legalitas dan status hukum aset. Kolom penting meliputi nomor sertifikat, status sertifikat, jenis hak, atas nama, tanggal sertifikat, riwayat perolehan, dan status hukum.

Cara menggunakan:

1. Buka **Kelola Data > Data Legal**.
2. Cari atau filter aset.
3. Pilih judul kolom untuk mengurutkan data.
4. Pilih **Kelola** pada aset yang akan diperbarui.
5. Lengkapi data legal dan simpan.
6. Pilih **Refresh** untuk memuat ulang daftar bila diperlukan.

### Ruang Screenshot — Data Legal

| Tempel screenshot Halaman Data Legal di sini |
|---|
| <br><br><br><br><br><br><br><br> |

---

# 12. Data Fisik

Halaman Data Fisik menampilkan lokasi dan kondisi fisik aset, termasuk desa/kelurahan, luas sertifikat, luas lapangan, penggunaan, serta batas utara, selatan, timur, dan barat.

Cara menggunakan:

1. Buka **Kelola Data > Data Fisik**.
2. Cari aset berdasarkan kode, nama, atau lokasi.
3. Pilih **Kelola**.
4. Isi alamat, wilayah, penggunaan, luas, batas bidang, foto kondisi, dan koordinat.
5. Simpan perubahan.

### Ruang Screenshot — Data Fisik

| Tempel screenshot Halaman Data Fisik di sini |
|---|
| <br><br><br><br><br><br><br><br> |

---

# 13. Data KIB

Halaman Data KIB menampilkan identitas KIB dan nilai perolehan. Data mencakup NIBAR, ID Pemda, kode barang, nomor register, luas KIB, harga perolehan, penggunaan KIB, dan status plotting.

Cara menggunakan:

1. Buka **Kelola Data > Data KIB**.
2. Cari aset yang diperlukan.
3. Pilih **Kelola**.
4. Salin data dari dokumen KIB secara teliti.
5. Simpan perubahan dan cocokkan kembali dengan dokumen sumber.

### Ruang Screenshot — Data KIB

| Tempel screenshot Halaman Data KIB di sini |
|---|
| <br><br><br><br><br><br><br><br> |

---

# 14. Data Administratif

Halaman Administratif menyimpan data pengelolaan dan nilai aset, antara lain kode BMD, OPD pengguna, tahun perolehan, nilai perolehan, nilai buku, nilai NJOP, serta SK penetapan.

Cara menggunakan:

1. Buka **Kelola Data > Data Administratif**.
2. Cari dan pilih aset.
3. Pilih **Kelola**.
4. Isi data administratif berdasarkan dokumen resmi.
5. Simpan perubahan.

### Ruang Screenshot — Data Administratif

| Tempel screenshot Halaman Data Administratif di sini |
|---|
| <br><br><br><br><br><br><br><br> |

---

# 15. Data Pajak

Halaman Data Pajak menyimpan pemetaan pajak, NJOP, dan PBB. Informasi dapat meliputi FID, status objek pajak, NOP, nama wajib pajak, luas bumi menurut Bapenda/pemetaan, NJOP bumi, dan PBB pemetaan.

Cara menggunakan:

1. Buka **Kelola Data > Data Pajak**.
2. Cari aset yang akan diperbarui.
3. Pilih **Kelola**.
4. Masukkan data pajak sesuai sumber resmi.
5. Pastikan format angka dan NOP benar.
6. Simpan perubahan.

### Ruang Screenshot — Data Pajak

| Tempel screenshot Halaman Data Pajak di sini |
|---|
| <br><br><br><br><br><br><br><br> |

---

# 16. Kelola 2D

Halaman Kelola 2D mengelola katalog bidang tanah dan kelengkapan spasialnya.

## 16.1 Daftar Kelola 2D

Daftar menampilkan kode 2D/kode aset, nama dan lokasi, koordinat, kelengkapan polygon, relasi 3D, dan aksi.

Cara menggunakan:

1. Buka **Kelola Data > Data Spasial > Kelola 2D**.
2. Gunakan pencarian untuk menemukan kode atau nama aset.
3. Gunakan filter **Semua kelengkapan**, **Koordinat & polygon lengkap**, atau **Data spasial belum lengkap**.
4. Urutkan berdasarkan waktu pembaruan, waktu pendaftaran, kode 2D, kode aset, atau nama aset.
5. Pilih aksi pengelolaan pada baris yang diperlukan.

## 16.2 Menambahkan Bidang ke Katalog 2D

1. Pilih tombol penambahan bidang jika tersedia.
2. Cari aset dari Pusat Data.
3. Pilih aset yang belum masuk katalog 2D.
4. Konfirmasi penambahan.
5. Lengkapi koordinat dan polygon melalui halaman kelola.

### Ruang Screenshot — Daftar Kelola 2D

| Tempel screenshot Halaman Kelola 2D di sini |
|---|
| <br><br><br><br><br><br><br><br> |

### Ruang Screenshot — Detail Kelola 2D

| Tempel screenshot Detail/Form Spasial Kelola 2D di sini |
|---|
| <br><br><br><br><br><br><br><br> |

---

# 17. Kelola 3D

## 17.1 Daftar Kelola 3D

Halaman ini menampilkan katalog bangunan/model 3D yang berelasi dengan bidang 2D.

Cara menggunakan:

1. Buka **Kelola Data > Data Spasial > Kelola 3D**.
2. Cari berdasarkan kode 3D, kode aset, nama, atau lokasi.
3. Gunakan filter status model, katalog, verifikasi, format, dan kelengkapan koordinat.
4. Pilih **Kelola** untuk membuka detail.
5. Gunakan ekspor katalog bila diperlukan.
6. Pengguna berizin dapat menghapus entri setelah membaca konfirmasi.

Format model yang didukung aplikasi mencakup KMZ, GLB, dan 3D Tiles.

## 17.2 Menambahkan Aset 3D

1. Pilih tombol penambahan pada halaman Kelola 3D.
2. Cari kode 2D, kode aset, nama, atau lokasi.
3. Pilih bidang tanah 2D yang akan diberi data bangunan 3D.
4. Konfirmasi penambahan.

## 17.3 Detail Kelola 3D

Pada halaman detail, pengguna dapat:

- mengimpor model dan memilih LOD;
- melihat versi model;
- mengaktifkan versi yang ditampilkan pada peta;
- mengisi metadata model dan sumber data;
- mengatur status verifikasi/publikasi;
- mengatur transformasi posisi, rotasi, dan skala;
- mengisi tinggi, jumlah lantai, elevasi dasar, akurasi, dan CRS;
- membuat serta menyimpan daftar ruang; dan
- melihat preview model 3D.

Alur umum pengelolaan model:

1. Buka aset melalui tombol **Kelola**.
2. Pilih area impor lalu unggah berkas yang didukung.
3. Pilih LOD yang sesuai.
4. Tunggu pemrosesan hingga selesai.
5. Periksa preview model.
6. Sesuaikan posisi, rotasi, atau skala bila diperlukan.
7. Lengkapi metadata dan daftar ruang.
8. Simpan perubahan.
9. Atur status verifikasi sesuai prosedur instansi.
10. Aktifkan versi model yang telah diperiksa untuk ditampilkan di Digital Twin.

> **Peringatan:** hapus permanen model hanya jika berkas benar-benar tidak diperlukan. Gunakan pemulihan jika model masih berada dalam status yang dapat dipulihkan.

### Ruang Screenshot — Daftar Kelola 3D

| Tempel screenshot Halaman Daftar Kelola 3D di sini |
|---|
| <br><br><br><br><br><br><br><br> |

### Ruang Screenshot — Detail dan Impor Model 3D

| Tempel screenshot bagian impor serta metadata model di sini |
|---|
| <br><br><br><br><br><br><br><br> |

### Ruang Screenshot — Preview Model 3D

| Tempel screenshot Preview Model 3D di sini |
|---|
| <br><br><br><br><br><br><br><br> |

---

# 18. Riwayat Aktivitas

Halaman Riwayat mencatat aktivitas pengguna dan perubahan data untuk kebutuhan penelusuran serta audit.

Cara menggunakan:

1. Buka **Aktivitas & Sistem > Riwayat**.
2. Tentukan tanggal mulai dan tanggal akhir bila diperlukan.
3. Pilih jenis aktivitas, misalnya login atau perubahan data.
4. Terapkan filter.
5. Pilih judul kolom untuk mengurutkan log.
6. Pilih tombol detail pada baris untuk melihat informasi lebih lengkap.
7. Gunakan **Refresh** untuk memperbarui data.

Isi log dapat mencakup waktu, pengguna, jenis aktivitas, deskripsi, tabel/modul, alamat IP, dan detail perubahan. Cakupan log yang terlihat mengikuti peran pengguna.

### Ruang Screenshot — Riwayat Aktivitas

| Tempel screenshot Halaman Riwayat Aktivitas di sini |
|---|
| <br><br><br><br><br><br><br><br> |

---

# 19. Notifikasi

Notifikasi memberi informasi tentang aktivitas sistem, perubahan data, login, backup, atau kejadian lain yang relevan.

Cara menggunakan:

1. Pilih ikon lonceng pada header untuk melihat ringkasan.
2. Pilih sebuah notifikasi untuk membacanya.
3. Pilih **Lihat Semua Notifikasi** untuk membuka halaman lengkap.
4. Gunakan filter kategori atau status baca bila tersedia.
5. Gunakan **Tandai semua dibaca** untuk membersihkan indikator notifikasi belum dibaca.
6. Hapus satu atau seluruh notifikasi jika tidak lagi diperlukan.

Menghapus notifikasi tidak membatalkan aktivitas yang dilaporkan oleh notifikasi tersebut.

### Ruang Screenshot — Dropdown Notifikasi

| Tempel screenshot Dropdown Notifikasi pada header di sini |
|---|
| <br><br><br><br><br><br><br><br> |

### Ruang Screenshot — Halaman Notifikasi

| Tempel screenshot Halaman Notifikasi di sini |
|---|
| <br><br><br><br><br><br><br><br> |

---

# 20. Backup dan Restore

Halaman Backup hanya tersedia bagi pengguna berwenang, terutama Admin.

## 20.1 Membuat Backup

1. Buka **Aktivitas & Sistem > Backup**.
2. Pilih opsi pembuatan backup.
3. Tunggu sampai proses selesai.
4. Pastikan backup baru muncul pada daftar.

## 20.2 Mengunduh dan Mengekspor Data

- Pilih ikon **Download** pada backup untuk mengunduh berkas backup.
- Gunakan ekspor CSV untuk mendapatkan data dalam format tabel jika tersedia.

## 20.3 Restore Data

1. Pilih backup yang akan dipulihkan atau unggah berkas backup sesuai kontrol yang tersedia.
2. Periksa nama, tanggal, dan sumber backup.
3. Pilih **Restore**.
4. Baca dialog konfirmasi dengan teliti.
5. Tunggu proses hingga selesai tanpa menutup browser.
6. Periksa ringkasan jumlah data yang berhasil diimpor.

## 20.4 Jadwal Backup

Jika penjadwalan tersedia, pilih frekuensi **Harian**, **Mingguan**, atau **Bulanan**, kemudian simpan pengaturan.

> **Peringatan:** restore dapat mengubah data aktif. Lakukan backup terbaru dan koordinasikan dengan administrator sebelum memulai.

### Ruang Screenshot — Backup dan Restore

| Tempel screenshot Halaman Backup beserta daftar backup di sini |
|---|
| <br><br><br><br><br><br><br><br> |

---

# 21. Profil Saya

Halaman Profil menampilkan identitas, statistik aktivitas, login terakhir, pengaturan foto, perubahan kata sandi, dan keamanan MFA.

## 21.1 Memperbarui Profil

1. Pilih menu profil di kanan atas.
2. Pilih **Profil Saya**.
3. Pilih mode edit jika diperlukan.
4. Ubah data yang diizinkan atau unggah foto profil.
5. Simpan perubahan.

## 21.2 Mengubah Kata Sandi

1. Buka bagian keamanan akun.
2. Masukkan kata sandi saat ini.
3. Masukkan kata sandi baru yang kuat dan unik.
4. Ulangi kata sandi baru.
5. Simpan perubahan.

## 21.3 Mengaktifkan MFA

1. Pilih **Aktifkan MFA**.
2. Pindai QR Code dengan aplikasi autentikator.
3. Simpan kode rahasia di tempat aman bila diperlukan.
4. Masukkan kode OTP enam digit.
5. Konfirmasi aktivasi hingga status **MFA Aktif** muncul.

Untuk menonaktifkan MFA, pilih **Nonaktifkan MFA**, masukkan kata sandi, lalu konfirmasi. Penonaktifan MFA mengurangi keamanan akun.

### Ruang Screenshot — Profil Saya

| Tempel screenshot Halaman Profil Saya di sini |
|---|
| <br><br><br><br><br><br><br><br> |

### Ruang Screenshot — Pengaturan MFA

| Tempel screenshot bagian MFA tanpa memperlihatkan kode rahasia di sini |
|---|
| <br><br><br><br><br><br><br><br> |

> **Keamanan dokumentasi:** kaburkan QR Code, kode rahasia MFA, email sensitif, NIK, token, dan data pribadi sebelum memasukkan screenshot ke manual book.

---

# 22. Pengaturan

Halaman Pengaturan tersedia sesuai hak akses dan terdiri dari beberapa tab.

## 22.1 Tab Umum

Admin dapat mengatur informasi seperti:

- nama dan deskripsi aplikasi;
- email admin;
- telepon dan alamat kantor;
- zona waktu; dan
- bahasa aplikasi.

## 22.2 Tab Notifikasi

Pengaturan mencakup channel notifikasi dan jenis kejadian, seperti login, perubahan data aset, backup/restore, serta user baru.

## 22.3 Tab Tampilan

Pengguna berwenang dapat memilih:

- mode terang atau gelap;
- jumlah item per halaman;
- format tanggal; dan
- pemisah ribuan.

Setelah melakukan perubahan, pilih **Simpan Pengaturan** dan pastikan notifikasi berhasil muncul.

### Ruang Screenshot — Pengaturan Umum

| Tempel screenshot Tab Umum pada Halaman Pengaturan di sini |
|---|
| <br><br><br><br><br><br><br><br> |

### Ruang Screenshot — Pengaturan Notifikasi dan Tampilan

| Tempel screenshot tab Notifikasi/Tampilan di sini |
|---|
| <br><br><br><br><br><br><br><br> |

---

# 23. Manajemen User

Tab **Manajemen User** berada pada halaman Pengaturan dan hanya tersedia bagi Admin.

## 23.1 Menambah User

1. Buka **Pengaturan > Manajemen User**.
2. Pilih tombol tambah user.
3. Isi nama lengkap, username, email, kata sandi, dan peran.
4. Pilih **Simpan**.
5. Pastikan user baru muncul pada daftar.

Peran yang dapat tersedia adalah Admin, Pengelola Aset, Verifikator Aset, Viewer, dan Masyarakat jika fitur terkait diaktifkan.

## 23.2 Mencari dan Memfilter User

1. Masukkan nama, username, atau email pada kolom pencarian.
2. Gunakan filter peran pada tabel.
3. Gunakan pagination untuk berpindah halaman.

## 23.3 Mengubah User

1. Pilih ikon **Edit** pada baris user.
2. Ubah identitas, email, peran, status, atau kata sandi bila diperlukan.
3. Simpan perubahan.

## 23.4 Menghapus User

1. Pilih ikon **Hapus**.
2. Periksa identitas user pada dialog konfirmasi.
3. Konfirmasi hanya jika akun benar-benar tidak diperlukan.

Hindari menghapus satu-satunya akun Admin yang masih dapat mengelola sistem.

### Ruang Screenshot — Manajemen User

| Tempel screenshot Tab Manajemen User di sini |
|---|
| <br><br><br><br><br><br><br><br> |

### Ruang Screenshot — Form Tambah/Edit User

| Tempel screenshot Form Tambah atau Edit User di sini |
|---|
| <br><br><br><br><br><br><br><br> |

---

# 24. Penanganan Kendala

| Kendala | Kemungkinan Penyebab | Tindakan |
|---|---|---|
| Login gagal | Username/password salah atau akun tidak aktif | Periksa penulisan, coba reset kata sandi, atau hubungi Admin. |
| OTP tidak diterima | Email terlambat, alamat email salah, atau pesan masuk spam | Tunggu beberapa saat, periksa folder spam, lalu kirim ulang OTP. |
| Menu tidak muncul | Peran tidak memiliki izin | Pastikan login dengan akun yang benar atau hubungi Admin. |
| Data tidak tampil | Filter terlalu spesifik atau koneksi bermasalah | Hapus filter, pilih Refresh, lalu periksa koneksi. |
| Aset tidak terlihat pada peta | Koordinat/polygon belum lengkap atau layer disembunyikan | Periksa data spasial dan aktifkan layer terkait. |
| GeoJSON tidak dapat diunduh | Aset belum mempunyai polygon | Lengkapi polygon pada Kelola 2D terlebih dahulu. |
| Model 3D tidak tampil | Model belum aktif, koordinat belum tersedia, format bermasalah, atau proses belum selesai | Periksa status model, metadata, LOD, transformasi, dan preview. |
| Upload gagal | Format/ukuran berkas tidak didukung atau koneksi terputus | Periksa format dan ukuran, lalu unggah ulang menggunakan koneksi stabil. |
| Sesi berakhir | Tidak ada aktivitas hingga batas sesi habis | Login kembali dan ulangi perubahan yang belum tersimpan. |
| Restore gagal | Berkas backup tidak sesuai atau koneksi/database bermasalah | Jangan mengulang berkali-kali; simpan pesan kesalahan dan hubungi administrator teknis. |

Saat melaporkan kendala, sertakan:

- waktu kejadian;
- halaman dan langkah yang dilakukan;
- pesan kesalahan;
- peran pengguna;
- browser dan perangkat; serta
- screenshot yang sudah mengaburkan data sensitif.

---

# 25. Praktik Penggunaan yang Baik

## 25.1 Keamanan

- Jangan membagikan password, OTP, QR Code MFA, atau kode rahasia.
- Gunakan kata sandi unik dan aktifkan MFA.
- Logout setelah memakai perangkat bersama.
- Jangan menyimpan kredensial pada dokumen manual atau screenshot.

## 25.2 Kualitas Data

- Gunakan dokumen resmi sebagai sumber data.
- Periksa kode aset, NIBAR, NOP, luas, nilai, dan koordinat sebelum menyimpan.
- Hindari membuat aset ganda.
- Catat perubahan penting pada kolom catatan jika tersedia.
- Periksa peta setelah memperbarui koordinat atau polygon.

## 25.3 Backup

- Buat backup sebelum impor atau perubahan data berskala besar.
- Simpan backup di lokasi yang aman dan terbatas.
- Uji proses pemulihan sesuai prosedur instansi.
- Jangan menghapus backup terakhir yang telah terverifikasi.

---

# 26. Lampiran

## 26.1 Status Fitur Penyewaan

Pada saat manual ini disusun, fitur penyewaan dan pendaftaran mandiri akun masyarakat dinonaktifkan dalam konfigurasi aplikasi. Oleh karena itu, halaman berikut tidak dimasukkan sebagai prosedur operasional aktif:

- katalog sewa publik;
- daftar aset sewa dan permintaan sewa internal;
- objek tersedia, sewa diajukan, dan sewa disetujui untuk masyarakat; serta
- pendaftaran mandiri akun masyarakat.

Jika fitur penyewaan diaktifkan kembali, manual perlu direvisi dan dilengkapi dengan screenshot serta prosedur yang sesuai versi aplikasi saat itu.

## 26.2 Daftar Screenshot yang Perlu Disiapkan

| No. | Halaman/Bagian | Status |
|---:|---|---|
| 1 | Struktur antarmuka internal | ☐ |
| 2 | Beranda publik | ☐ |
| 3 | Peta publik | ☐ |
| 4 | Dokumentasi | ☐ |
| 5 | Panel login | ☐ |
| 6 | Lupa kata sandi | ☐ |
| 7 | Dashboard | ☐ |
| 8 | Digital Twin 2D | ☐ |
| 9 | Digital Twin 3D | ☐ |
| 10 | Pusat Data | ☐ |
| 11 | Detail aset | ☐ |
| 12 | Form aset baru | ☐ |
| 13 | Form kelola aset | ☐ |
| 14 | Data Legal | ☐ |
| 15 | Data Fisik | ☐ |
| 16 | Data KIB | ☐ |
| 17 | Data Administratif | ☐ |
| 18 | Data Pajak | ☐ |
| 19 | Daftar Kelola 2D | ☐ |
| 20 | Detail Kelola 2D | ☐ |
| 21 | Daftar Kelola 3D | ☐ |
| 22 | Detail dan impor model 3D | ☐ |
| 23 | Preview model 3D | ☐ |
| 24 | Riwayat aktivitas | ☐ |
| 25 | Dropdown notifikasi | ☐ |
| 26 | Halaman notifikasi | ☐ |
| 27 | Backup dan restore | ☐ |
| 28 | Profil Saya | ☐ |
| 29 | Pengaturan MFA | ☐ |
| 30 | Pengaturan Umum | ☐ |
| 31 | Pengaturan Notifikasi/Tampilan | ☐ |
| 32 | Manajemen User | ☐ |
| 33 | Form tambah/edit user | ☐ |

## 26.3 Aturan Pengambilan Screenshot

1. Gunakan resolusi layar dan tingkat zoom browser yang konsisten.
2. Gunakan data contoh atau kaburkan data pribadi dan rahasia.
3. Hindari menampilkan password, OTP, token, QR Code MFA, NIK lengkap, atau alamat pribadi.
4. Tutup notifikasi browser atau aplikasi lain sebelum mengambil gambar.
5. Beri caption dan nomor gambar secara berurutan setelah dipindahkan ke Word.
6. Pangkas screenshot pada area yang relevan tanpa menghilangkan konteks halaman.

Contoh caption:

> **Gambar 1. Halaman Dashboard Bhumi Satya**

---

**Akhir Dokumen**
