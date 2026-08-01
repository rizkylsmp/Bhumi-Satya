# Deployment Bhumi Satya dengan Coolify

Panduan ini ditujukan untuk VPS Ubuntu Server 24.04 LTS dengan 2 vCPU, RAM 4 GB,
dan storage 60 GB. Coolify mengambil source dari GitHub, membangun image di VPS,
kemudian menjalankan aplikasi menggunakan Docker Compose. Swap 4 GB disiapkan
sebagai pengaman lonjakan memori selama build.

## Arsitektur

- `frontend`: Nginx yang menyajikan hasil build React pada port internal 80.
- `backend`: Node.js/Express pada port internal 5000.
- `migrate`: menjalankan migrasi Sequelize satu kali sebelum backend dimulai.
- PostgreSQL tetap berada di Neon.
- Hanya frontend yang diberi domain publik. Permintaan `/api` diteruskan oleh
  Nginx ke backend melalui jaringan internal Compose.

## 1. Persiapkan VPS

Pilih Ubuntu Server 24.04 LTS 64-bit. Setelah VPS aktif, arahkan A record domain
ke alamat IPv4 VPS. Buka port 80 dan 443 untuk publik; batasi port 22 ke alamat
IP administrator jika memungkinkan.

Tambahkan swap 4 GB sebagai pengaman saat terjadi lonjakan penggunaan memori:

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-bhumi-satya.conf
sudo sysctl --system
```

Swap bukan pengganti RAM. Jika penggunaan swap berlangsung terus-menerus atau
proses model 3D sering gagal, naikkan paket VPS.

## 2. Instal Coolify

Masuk melalui SSH sebagai root atau gunakan `sudo`, lalu jalankan installer
resmi Coolify:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash
```

Segera buka alamat dashboard yang ditampilkan installer dan buat akun admin.
Jangan memasang aaPanel atau reverse proxy lain pada server yang sama.

## 3. Hubungkan GitHub

Hubungkan akun GitHub melalui GitHub App di Coolify dan berikan akses hanya ke
repository `rizkylsmp/Bhumi-Satya`. Repository tetap boleh bersifat private.
Tidak diperlukan GitHub Actions, GHCR, atau token package terpisah.

## 4. Buat resource di Coolify

1. Hubungkan repository GitHub `rizkylsmp/Bhumi-Satya` ke Coolify.
2. Buat resource **Docker Compose** dari branch `main`.
3. Isi lokasi Compose dengan `/compose.coolify.yaml`.
4. Pasang domain `https://bhumisatya.web.id` pada service `frontend` port 80.
5. Jangan memasang domain atau port publik pada service `backend` dan `migrate`.
6. Aktifkan **Auto Deploy** untuk branch `main`.
7. Batasi deployment paralel menjadi satu agar build tidak saling berebut RAM.

## 5. Isi environment variables

Isi nilai berikut pada resource Compose di Coolify. Jangan menyimpannya dalam
repository atau file `.env` yang ikut di-commit.

### Wajib

```dotenv
DATABASE_URL=postgresql://...
DB_SSL=true
JWT_SECRET=buat-random-minimal-64-karakter
FRONTEND_URL=https://bhumisatya.web.id
```

### Upload dan backup

```dotenv
SUPABASE_URL=https://....supabase.co
SUPABASE_SERVICE_KEY=...
SUPABASE_BUCKET=backups
```

### Email OTP

```dotenv
SMTP_HOST=...
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=...
```

Nilai bawaan yang sudah disetel untuk VPS 4 GB:

```dotenv
DB_POOL_MAX=3
NODE_OPTIONS=--max-old-space-size=1536
```

## 6. Auto-deploy Coolify

GitHub App Coolify memasang webhook repository secara otomatis. Tidak ada
repository secret deployment yang perlu disimpan di GitHub.

Mulai saat itu alurnya adalah:

1. Push ke branch `main`.
2. GitHub mengirim webhook ke Coolify.
3. Coolify mengambil commit terbaru.
4. Coolify membangun frontend dan backend di VPS.
5. Coolify menjalankan migrasi dan mengganti container aplikasi.

Jika build atau migrasi gagal, container lama tetap menjadi acuan untuk
investigasi dan deployment ditandai gagal di Coolify.

## 7. Pemeriksaan setelah deployment

- Buka `https://bhumisatya.web.id` dan lakukan login.
- Pastikan `https://bhumisatya.web.id/api/health` mengembalikan status server.
- Uji upload foto dan satu model 3D berukuran kecil.
- Periksa pemakaian RAM, swap, CPU, dan disk di Coolify.
- Aktifkan pembersihan Docker otomatis agar cache dan image lama tidak memenuhi
  storage 60 GB.

## Rollback

Pilih deployment terakhir yang stabil pada riwayat deployment Coolify lalu
lakukan redeploy. Jika diperlukan, ubah commit sumber sementara ke SHA yang
stabil, deploy ulang, kemudian kembalikan sumber ke branch `main` setelah
masalah diperbaiki.
