import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { sequelize, User, Aset, Riwayat } from "./models/index.js";

// Import routes
import authRoutes from "./routes/auth.routes.js";
import asetRoutes from "./routes/aset.routes.js";
import petaRoutes from "./routes/peta.routes.js";
import riwayatRoutes from "./routes/riwayat.routes.js";
import backupRoutes from "./routes/backup.routes.js";
import notifikasiRoutes from "./routes/notifikasi.routes.js";
import userRoutes from "./routes/user.routes.js";
import pusatDataRoutes from "./routes/pusatData.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import sewaAsetRoutes from "./routes/sewaAset.routes.js";
import permintaanRoutes from "./routes/permintaan.routes.js";
import ekasmatRoutes from "./routes/ekasmat.routes.js";
import chatbotRoutes from "./routes/chatbot.routes.js";
import aset3dRoutes from "./routes/aset3d.routes.js";

// Load .env only for local development (Vercel injects env vars directly)
if (!process.env.VERCEL) {
  dotenv.config();
}

const app = express();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://bhumi-satya.vercel.app",
  "https://bhumisatya.web.id",
  "https://www.bhumisatya.web.id",
  process.env.FRONTEND_URL,
].filter(Boolean);

// Manual CORS middleware to ensure exact origin is used
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Prevent caching of CORS responses
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  // Allow requests with no origin (mobile apps, curl, etc.)
  if (!origin) {
    return next();
  }

  // Check if origin matches any allowed origin (including www variants)
  const isAllowed = allowedOrigins.some((allowed) => {
    // Exact match
    if (origin === allowed) return true;

    // Treat www and apex domains as the same configured origin.
    const originWithoutWww = origin.replace("https://www.", "https://");
    const allowedWithoutWww = allowed.replace("https://www.", "https://");
    return originWithoutWww === allowedWithoutWww;
  });

  if (isAllowed) {
    // Set the exact origin that made the request
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.setHeader("Vary", "Origin");
  }

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});

// Static files
// app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/aset", asetRoutes);
app.use("/api/peta", petaRoutes);
app.use("/api/riwayat", riwayatRoutes);
app.use("/api/backup", backupRoutes);
app.use("/api/notifikasi", notifikasiRoutes);
app.use("/api/users", userRoutes);
app.use("/api/pusat-data", pusatDataRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/sewa", sewaAsetRoutes);
app.use("/api/permintaan", permintaanRoutes);
app.use("/api/ekasmat", ekasmatRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/aset-3d", aset3dRoutes);

// Landing page - inline HTML for serverless compatibility
app.get("/", (req, res) => {
  const uptime = process.uptime();
  const uptimeFormatted = `${Math.floor(uptime / 3600)}h ${Math.floor(
    (uptime % 3600) / 60,
  )}m ${Math.floor(uptime % 60)}s`;

  res.send(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bhumi Satya API - Sistem Manajemen Aset Tanah</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }
        .container { text-align: center; padding: 2rem; max-width: 600px; }
        .logo { font-size: 4rem; margin-bottom: 1rem; }
        h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .subtitle { color: #94a3b8; margin-bottom: 2rem; }
        .status {
          background: rgba(255,255,255,0.1);
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 2rem;
        }
        .status-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .status-item:last-child { border-bottom: none; }
        .badge {
          background: #22c55e;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.875rem;
        }
        .endpoints {
          text-align: left;
          background: rgba(255,255,255,0.05);
          padding: 1rem;
          border-radius: 8px;
        }
        .endpoints h3 { margin-bottom: 0.5rem; color: #94a3b8; font-size: 0.875rem; }
        .endpoint { font-family: monospace; color: #60a5fa; padding: 0.25rem 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🏛️</div>
        <h1>Bhumi Satya API</h1>
        <p class="subtitle">Sistem Manajemen Aset Tanah - Backend Service</p>
        <div class="status">
          <div class="status-item">
            <span>Status</span>
            <span class="badge">● Running</span>
          </div>
          <div class="status-item">
            <span>Environment</span>
            <span>${process.env.NODE_ENV || "development"}</span>
          </div>
          <div class="status-item">
            <span>Uptime</span>
            <span>${uptimeFormatted}</span>
          </div>
          <div class="status-item">
            <span>Server Time</span>
            <span>${new Date().toLocaleTimeString("id-ID")}</span>
          </div>
        </div>
        <div class="endpoints">
          <h3>API ENDPOINTS</h3>
          <div class="endpoint">POST /api/auth/login</div>
          <div class="endpoint">GET /api/aset</div>
          <div class="endpoint">GET /api/peta</div>
          <div class="endpoint">GET /api/riwayat</div>
          <div class="endpoint">GET /api/health</div>
        </div>
        <p style="margin-top: 2rem; color: #64748b; font-size: 0.875rem;">
          Bhumi Satya
        </p>
      </div>
    </body>
    </html>
  `);
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "Server running", timestamp: new Date() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

// Initialize database and start server (skip listen in serverless)
if (!process.env.VERCEL) {
  sequelize
    .authenticate()
    .then(() => {
      console.log("✅ Database connected");
      app.listen(PORT, HOST, () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(
          `🌐 Frontend URL: ${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }`,
        );
      });
    })
    .catch((error) => {
      console.error("❌ Failed to start server:", error);
      process.exit(1);
    });
}

export default app;
