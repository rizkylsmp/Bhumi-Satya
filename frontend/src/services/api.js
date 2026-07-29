import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(
  /\/$/,
  "",
);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Endpoints yang BUKAN session expired (login gagal, OTP salah, dll)
const AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/verify-otp",
  "/auth/verify-mfa",
  "/auth/request-otp",
  "/auth/request-password-reset",
  "/auth/reset-password",
];

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Skip auth endpoints - 401 here means wrong credentials, not expired session
      const requestUrl = error.config?.url || "";
      const isAuthEndpoint = AUTH_ENDPOINTS.some((endpoint) =>
        requestUrl.includes(endpoint),
      );

      if (!isAuthEndpoint) {
        // Always force logout on 401 (token invalid atau expired)
        // Clear all session data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("sessionExpiresAt");
        localStorage.removeItem("sessionGraceExpiresAt");

        // Redirect to login
        window.location.hash = "#/login";
        toast.error("Sesi telah berakhir, silakan login kembali");
      }
    }
    // 403 errors are handled silently - menu will be hidden based on role
    return Promise.reject(error);
  },
);

export const authService = {
  login: (username, password, otpChannel = "email") =>
    api.post("/auth/login", { username, password, otpChannel }),
  verifyLoginOtp: (otpToken, code) =>
    api.post("/auth/otp/verify", { otpToken, code }),
  requestPasswordReset: (identifier) =>
    api.post("/auth/forgot-password/request", { identifier }),
  resetPasswordWithOtp: (data) =>
    api.post("/auth/forgot-password/reset", data),
  logout: () => api.post("/auth/logout"),
  register: (data) => api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/profile", data),
  changePassword: (data) => api.put("/auth/change-password", data),
  refreshToken: () => api.post("/auth/refresh-token"),
  // MFA
  setupMfa: () => api.post("/auth/mfa/setup"),
  verifyMfaSetup: (code) => api.post("/auth/mfa/verify-setup", { code }),
  verifyMfaLogin: (mfaToken, code) =>
    api.post("/auth/mfa/verify", { mfaToken, code }),
  requestMfaEmailOtp: (mfaToken) =>
    api.post("/auth/mfa/email-otp", { mfaToken }),
  disableMfa: (password) => api.post("/auth/mfa/disable", { password }),
};

export const asetService = {
  getAll: (params) => api.get("/aset", { params }),
  getById: (id) => api.get(`/aset/${id}`),
  create: (data) => api.post("/aset", data),
  update: (id, data) => api.put(`/aset/${id}`, data),
  delete: (id) => api.delete(`/aset/${id}`),
  getStats: () => api.get("/aset/stats"),
  getFilterOptions: () => api.get("/aset/filter-options"),
};

export const assetModel3dService = {
  list: (assetId) => api.get(`/aset/${assetId}/models-3d`),
  upload: (assetId, file, lod) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("lod", lod);
    return api.post(`/aset/${assetId}/models-3d`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  activate: (assetId, modelId) =>
    api.put(`/aset/${assetId}/models-3d/${modelId}/activate`),
  review: (assetId, modelId, reviewData) =>
    api.put(`/aset/${assetId}/models-3d/${modelId}/review`, reviewData),
  convert: (assetId, modelId) =>
    api.post(`/aset/${assetId}/models-3d/${modelId}/convert`),
  update: (assetId, modelId, metadata) =>
    api.put(`/aset/${assetId}/models-3d/${modelId}`, metadata),
  updateRooms: (assetId, modelId, rooms) =>
    api.put(`/aset/${assetId}/models-3d/${modelId}/rooms`, { rooms }),
  download: (assetId, modelId, variant = "source") =>
    api.get(`/aset/${assetId}/models-3d/${modelId}/download`, {
      params: { variant },
      responseType: "blob",
    }),
  remove: (assetId, modelId) =>
    api.delete(`/aset/${assetId}/models-3d/${modelId}`),
  restore: (assetId, modelId) =>
    api.put(`/aset/${assetId}/models-3d/${modelId}/restore`),
  removeArchived: (assetId, modelId) =>
    api.delete(`/aset/${assetId}/models-3d/${modelId}/permanent`),
  listObjects: (assetId, modelId, params) =>
    api.get(`/aset/${assetId}/models-3d/${modelId}/objects`, { params }),
  createObject: (assetId, modelId, data) =>
    api.post(`/aset/${assetId}/models-3d/${modelId}/objects`, data),
  updateObject: (assetId, modelId, objectId, data) =>
    api.put(`/aset/${assetId}/models-3d/${modelId}/objects/${objectId}`, data),
  removeObject: (assetId, modelId, objectId) =>
    api.delete(`/aset/${assetId}/models-3d/${modelId}/objects/${objectId}`),
  downloadObjectTemplate: (assetId, modelId) =>
    api.get(`/aset/${assetId}/models-3d/${modelId}/objects/template`, {
      responseType: "blob",
    }),
  importObjects: (assetId, modelId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/aset/${assetId}/models-3d/${modelId}/objects/import`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const aset3dCatalogService = {
  list: (params) => api.get("/aset-3d", { params }),
  exportCsv: (params) => api.get("/aset-3d/export", {
    params,
    responseType: "blob",
  }),
  candidates: (params) => api.get("/aset-3d/candidates", { params }),
  getByCode: (kode3d) => api.get(`/aset-3d/${encodeURIComponent(kode3d)}`),
  create: (assetId) => api.post("/aset-3d", { id_aset: assetId }),
  remove: (kode3d) => api.delete(`/aset-3d/${encodeURIComponent(kode3d)}`),
};

export const petaService = {
  getLayers: () => api.get("/peta/layers"),
  getMarkers: (params) => api.get("/peta/markers", { params }),
  getModel3dTileset: (assetIds) => api.get("/peta/models-3d/tileset.json", {
    params: assetIds?.length ? { asset_ids: assetIds.join(",") } : undefined,
  }),
  getPublicMarkers: () => api.get("/peta/public-markers"),
  getPublicDetail: (id) => api.get(`/peta/public-detail/${id}`),
};

export const riwayatService = {
  getAll: (params) => api.get("/riwayat", { params }),
  getStats: () => api.get("/riwayat/stats"),
};

export const notifikasiService = {
  getAll: (params) => api.get("/notifikasi", { params }),
  getRecent: (limit = 5) =>
    api.get("/notifikasi/recent", { params: { limit } }),
  markAsRead: (id) => api.put(`/notifikasi/${id}/read`),
  markAllAsRead: () => api.put("/notifikasi/read-all"),
  getUnreadCount: () => api.get("/notifikasi/unread-count"),
  delete: (id) => api.delete(`/notifikasi/${id}`),
  clearAll: () => api.delete("/notifikasi/clear-all"),
};

export const userService = {
  getAll: (params) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post("/users", data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getStats: () => api.get("/users/stats"),
};

export const backupService = {
  getAll: () => api.get("/backup"),
  getStats: () => api.get("/backup/stats"),
  exportData: (tables = ["aset", "user", "riwayat"]) =>
    api.post("/backup/export", { tables }),
  upload: (data, filename) => api.post("/backup/upload", { data, filename }),
  importData: (filename, options = {}) =>
    api.post("/backup/import", { filename, options }),
  download: (filename) =>
    api.get(`/backup/download/${filename}`, { responseType: "blob" }),
  remove: (filename) => api.delete(`/backup/${encodeURIComponent(filename)}`),
  exportCsv: () => api.post("/backup/export-csv", {}, { responseType: "blob" }),
};

export const uploadService = {
  single: (file, folder = "uploads") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    return api.post("/upload/single", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  multiple: (files, folder = "uploads") => {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }
    formData.append("folder", folder);
    return api.post("/upload/multiple", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  delete: (filename) => api.delete("/upload", { data: { filename } }),
};

export const sewaService = {
  getAll: (params) => api.get("/sewa", { params }),
  getById: (id) => api.get(`/sewa/${id}`),
  getStats: () => api.get("/sewa/stats"),
  create: (data) => api.post("/sewa", data),
  update: (id, data) => api.put(`/sewa/${id}`, data),
  delete: (id) => api.delete(`/sewa/${id}`),
  // Pengembalian
  getPengembalian: (params) => api.get("/sewa/pengembalian", { params }),
  prosesPengembalian: (id, data) => api.put(`/sewa/${id}/pengembalian`, data),
  // Public
  getPublicAvailable: (params) => api.get("/sewa/public-available", { params }),
  getAvailableForMasyarakat: (params) =>
    api.get("/sewa/masyarakat/tersedia", { params }),
  getApprovedForMasyarakat: (params) =>
    api.get("/sewa/masyarakat/disetujui", { params }),
};

export const permintaanService = {
  submit: (data) => api.post("/permintaan/submit", data),
  submitForMasyarakat: (data) => api.post("/permintaan/masyarakat/submit", data),
  getForMasyarakat: (params) => api.get("/permintaan/masyarakat", { params }),
  getAll: (params) => api.get("/permintaan", { params }),
  update: (id, data) => api.put(`/permintaan/${id}`, data),
  updateStatus: (id, data) => api.put(`/permintaan/${id}/status`, data),
  delete: (id) => api.delete(`/permintaan/${id}`),
};

export const chatbotService = {
  sendMessage: (data) => api.post("/chatbot/chat", data),
  getHistory: (sessionId) =>
    api.get("/chatbot/history", { params: { session_id: sessionId } }),
  submitFeedback: (id, data) => api.put(`/chatbot/${id}/feedback`, data),
  clearHistory: (sessionId) =>
    api.delete("/chatbot/clear", { params: { session_id: sessionId } }),
  getSuggestions: () => api.get("/chatbot/suggestions"),
};

export default api;
