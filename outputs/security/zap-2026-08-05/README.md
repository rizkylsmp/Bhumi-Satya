# ZAP Baseline — Bhumi Satya

- Target: `https://bhumisatya.web.id`
- Tanggal: 5 Agustus 2026
- Metode: passive baseline scan tanpa autentikasi
- Cakupan: landing page, aset JavaScript/CSS utama, endpoint penyewaan publik, dan endpoint marker peta publik
- Batasan: tidak menjalankan active scan, eksploitasi, brute force, atau perubahan data

## Ringkasan

ZAP mencatat 15 instance alert: 2 medium, 10 low, dan 3 informational. Tidak ada alert high yang ditemukan pada cakupan publik yang diperiksa.

## Temuan utama

| Risiko | Temuan | Instance | Rekomendasi |
| --- | --- | ---: | --- |
| Medium | Content Security Policy belum tersedia | 1 | Tambahkan header CSP bertahap, mulai dari `Content-Security-Policy-Report-Only`. |
| Medium | Proteksi clickjacking belum tersedia | 1 | Tambahkan `frame-ancestors 'none'` pada CSP atau `X-Frame-Options: DENY`. |
| Low | Strict-Transport-Security belum tersedia | 5 | Tambahkan HSTS setelah seluruh subdomain dipastikan selalu menggunakan HTTPS. |
| Low | X-Content-Type-Options belum tersedia | 3 | Tambahkan `X-Content-Type-Options: nosniff`. |
| Low | Backend mengirim `X-Powered-By` | 2 | Nonaktifkan header Express dengan `app.disable("x-powered-by")`. |
| Informational | Cache-Control perlu ditinjau | 2 | Pastikan HTML tidak menyimpan data sensitif dan aset ber-hash menggunakan cache immutable. |

## Artefak

- `zap-report.html`: laporan HTML lengkap dari ZAP.
- `zap-alerts.json`: hasil mentah untuk integrasi atau pemrosesan lanjutan.
- `testrail-security-cases.csv`: kasus uji ringkas yang dapat diimpor dan dipetakan ke field TestRail.

## Catatan TestRail

CSV sudah disiapkan, tetapi belum dapat dimasukkan ke server TestRail karena tidak ada URL atau sesi TestRail yang tersedia di browser. Saat mengimpor, petakan kolom CSV ke field bawaan atau custom field TestRail yang sesuai.
