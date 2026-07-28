# Bhumi Satya - Digital Twin STPN

## 📋 Gambaran Umum

**Bhumi Satya** adalah platform Digital Twin STPN yang mengintegrasikan data aset tanah, peta 2D, model 3D, legalitas, dan informasi pemanfaatan dalam satu representasi digital terpadu.

---

## 🛠️ Tech Stack

| Layer            | Teknologi                         |
| ---------------- | --------------------------------- |
| Frontend         | React 18 + Vite + Tailwind CSS v4 |
| Backend          | Express.js + Node.js              |
| Database         | PostgreSQL                        |
| State Management | Zustand                           |
| Routing          | React Router (HashRouter)         |
| Maps             | Leaflet + React-Leaflet           |
| Authentication   | JWT                               |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/rizkylsmp/Bhumi-Satya.git
cd Bhumi-Satya

# Install all dependencies (root + backend + frontend)
npm run install:all
```

### 2. Setup Database (PostgreSQL)

```sql
CREATE DATABASE bhumi_satya;
```

### 3. Environment Variables

**Backend** (`backend/.env`):

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/bhumi_satya
JWT_SECRET=your-secret-key
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=mailer@example.com
SMTP_PASS=your-mail-password
SMTP_FROM=Bhumi Satya <mailer@example.com>
WHATSAPP_API_URL=https://provider.example.com/send-message
WHATSAPP_API_TOKEN=your-whatsapp-provider-token
```

### 4. Run Development

**🎯 Cara Tercepat (Recommended):**

```bash
# Jalankan backend dan frontend bersamaan dari root directory
npm run dev
```

**Atau jalankan terpisah:**

```bash
# Terminal 1 - Backend only
npm run dev:backend

# Terminal 2 - Frontend only
npm run dev:frontend
```

**Atau cara manual:**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Access

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## 📦 Available Scripts

Jalankan dari **root directory**:

| Command                | Deskripsi                                              |
| ---------------------- | ------------------------------------------------------ |
| `npm run dev`          | Jalankan backend + frontend bersamaan (parallel)       |
| `npm run dev:backend`  | Jalankan backend saja                                  |
| `npm run dev:frontend` | Jalankan frontend saja                                 |
| `npm run install:all`  | Install dependencies untuk root, backend, dan frontend |
| `npm run build`        | Build frontend dan backend untuk production            |
| `npm run start`        | Start production servers                               |
| `npm run test`         | Run tests untuk backend dan frontend                   |
| `npm run lint`         | Run linting untuk backend dan frontend                 |

---

## 👥 Demo Users

Password akun demo wajib diberikan melalui variabel environment `SEED_*_PASSWORD` dan tidak disimpan di repository.

### 🌐 Akses Publik (Tanpa Login)

Halaman login menampilkan **Peta Interaktif** sebagai background. Pengunjung dapat melihat lokasi aset secara visual sebelum login. Panel login bisa di-minimize untuk menjelajahi peta. Detail aset hanya tersedia setelah login.

---

## 📁 Project Structure

```
Bhumi-Satya/
├── backend/
│   ├── src/
│   │   ├── config/       # Database config
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/   # Auth middleware
│   │   ├── models/       # Sequelize models
│   │   ├── routes/       # API routes
│   │   └── server.js     # Entry point
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── layouts/      # DashboardLayout
│   │   ├── pages/        # Page components
│   │   ├── router/       # HashRouter config
│   │   ├── services/     # API services
│   │   └── stores/       # Zustand stores
│   └── package.json
│
├── package.json          # Root package.json (monorepo scripts)
└── README.md
```

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint             | Description      |
| ------ | -------------------- | ---------------- |
| POST   | `/api/auth/login`    | User login       |
| POST   | `/api/auth/register` | Register user    |
| GET    | `/api/auth/me`       | Get current user |

### Assets

| Method | Endpoint        | Description     |
| ------ | --------------- | --------------- |
| GET    | `/api/aset`     | Get all assets  |
| GET    | `/api/aset/:id` | Get asset by ID |
| POST   | `/api/aset`     | Create asset    |
| PUT    | `/api/aset/:id` | Update asset    |
| DELETE | `/api/aset/:id` | Delete asset    |

---

## 🌐 Deployment (Vercel)

### Backend

1. Sudah ada `vercel.json` di folder backend
2. Set Environment Variables di Vercel Dashboard
3. Deploy: `cd backend && vercel`

### Frontend

1. Deploy langsung: `cd frontend && vercel`

**Environment variables di Vercel Dashboard** (jangan commit ke repo):

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`, `NODE_ENV=production`, `DB_SSL=true`

---

## ✨ Features

- ✅ Multi-role Authentication (Admin, Dinas Aset, BPN, Tata Ruang, Masyarakat)
- ✅ CRUD Data Aset dengan validasi
- ✅ Peta Interaktif (Leaflet) dengan multiple layers
- ✅ Dashboard dengan statistik real-time
- ✅ Riwayat Aktivitas & Audit Trail
- ✅ Notifikasi sistem
- ✅ Backup & Restore database
- ✅ Responsive Design (Mobile & Desktop)
- ✅ Modern Monochrome UI

---

## 📄 License

MIT License - Free to use and modify.
