import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { backupService } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { hasPermission } from "../utils/permissions";
import { useConfirm } from "../components/ui/confirmContext";
import {
  WarningCircleIcon,
  CalendarBlankIcon,
  DatabaseIcon,
  ChartBarIcon,
  CheckCircleIcon,
  FloppyDiskIcon,
  ArrowsClockwiseIcon,
  FolderOpenIcon,
  ClipboardTextIcon,
  DownloadSimpleIcon,
  TrashIcon,
  ShieldCheckIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  HardDrivesIcon,
  TimerIcon,
  FileArrowDownIcon,
  FileArrowUpIcon,
  CircleNotchIcon,
  InfoIcon,
  ArrowClockwiseIcon,
} from "@phosphor-icons/react";
import Pagination from "../components/asset/Pagination";

export default function BackupPage() {
  // Auth & Permissions
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || "";
  const canCreate = hasPermission(userRole, "backup", "create");
  const canRestore = hasPermission(userRole, "backup", "restore");
  const confirm = useConfirm();

  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupSchedule, setBackupSchedule] = useState("harian");
  const [backupTime, setBackupTime] = useState("02:00");
  const [uploadedFile, setUploadedFile] = useState(null);

  // Stats from API
  const [dbInfo, setDbInfo] = useState({
    backupTerakhir: "-",
    ukuranDatabase: "-",
    totalRecord: "0",
    statusSistem: "Normal",
  });

  // Backup history
  const [backupHistory, setBackupHistory] = useState([]);
  const [backupPage, setBackupPage] = useState(1);
  const [backupPageSize, setBackupPageSize] = useState(10);

  const backupTotalPages = Math.max(
    1,
    Math.ceil(backupHistory.length / backupPageSize),
  );
  const safeBackupPage = Math.min(backupPage, backupTotalPages);
  const paginatedBackupHistory = backupHistory.slice(
    (safeBackupPage - 1) * backupPageSize,
    safeBackupPage * backupPageSize,
  );

  // Fetch backup list
  const loadBackups = useCallback(async () => {
    try {
      // Fetch backup list and stats in parallel
      const [listRes, statsRes] = await Promise.all([
        backupService.getAll(),
        backupService.getStats(),
      ]);

      // Parse backup list — backend returns array directly
      const backups = listRes.data?.data || [];
      setBackupHistory(
        backups.map((file) => ({
          id: file.filename, // use filename as unique id
          namaFile: file.filename,
          ukuran: file.size,
          tanggal: file.createdAt
            ? new Date(file.createdAt).toLocaleString("id-ID")
            : "-",
          status: "Success",
          dilakukanOleh: file.createdBy || "admin",
        })),
      );

      // Parse stats
      const stats = statsRes.data?.data;
      if (stats) {
        const db = stats.database || {};
        const bk = stats.backups || {};
        const totalRecords =
          (db.totalAset || 0) + (db.totalUser || 0) + (db.totalRiwayat || 0);

        setDbInfo({
          backupTerakhir: bk.lastBackup?.createdAt
            ? new Date(bk.lastBackup.createdAt).toLocaleString("id-ID")
            : "-",
          ukuranDatabase: bk.totalSize ? formatBytes(bk.totalSize) : "-",
          totalRecord: totalRecords.toLocaleString(),
          statusSistem: "Normal",
        });
      }
    } catch (error) {
      console.error("Error fetching backup data:", error);
      toast.error("Gagal memuat data backup");
    }
  }, []);

  // Helper to format bytes
  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  // ===== BACKUP NOW =====
  const handleBackupNow = async () => {
    setExporting(true);
    try {
      const response = await backupService.exportData([
        "aset",
        "user",
        "riwayat",
      ]);
      if (response.data.success) {
        const info = response.data.data;
        toast.success(
          `Backup berhasil! ${Object.entries(info.recordCounts || {})
            .map(([t, c]) => `${t}: ${c}`)
            .join(", ")}`,
        );
        loadBackups();

        // Auto-download the created backup file
        if (info.filename) {
          await handleDownloadBackup(info.filename);
        }
      }
    } catch (error) {
      console.error("Error creating backup:", error);
      toast.error(
        "Gagal membuat backup: " +
          (error.response?.data?.error || error.message),
      );
    } finally {
      setExporting(false);
    }
  };

  // ===== DOWNLOAD BACKUP =====
  const handleDownloadBackup = async (filename) => {
    try {
      const response = await backupService.download(filename);
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download dimulai");
    } catch (error) {
      console.error("Error downloading backup:", error);
      toast.error("Gagal mendownload backup");
    }
  };

  // ===== EXPORT CSV =====
  const handleExportCsv = async () => {
    try {
      const response = await backupService.exportCsv();
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aset_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Export CSV berhasil!");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Gagal export CSV");
    }
  };

  // ===== SAVE SCHEDULE (UI only) =====
  const handleSaveSchedule = () => {
    toast.success(
      `Jadwal backup disimpan: ${backupSchedule} pada ${backupTime} WIB`,
    );
  };

  // ===== FILE UPLOAD =====
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  // ===== RESTORE — Upload file to server then import =====
  const handleRestore = async () => {
    if (!uploadedFile) {
      toast.error("Pilih file backup terlebih dahulu!");
      return;
    }

    const confirmed = await confirm({
      title: "Restore Database",
      message: `Apakah Anda yakin ingin melakukan restore dari file "${uploadedFile.name}"? Proses ini akan mengganti SEMUA data saat ini.`,
      confirmText: "Ya, Restore",
      cancelText: "Batal",
      type: "danger",
    });

    if (!confirmed) return;

    setRestoring(true);
    try {
      // Step 1: Read and validate the uploaded JSON file
      const text = await uploadedFile.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        toast.error("File backup tidak valid (bukan format JSON)");
        setRestoring(false);
        return;
      }

      if (!parsed.tables || !parsed.version) {
        toast.error(
          "Format file backup tidak valid. File harus hasil export dari sistem ini.",
        );
        setRestoring(false);
        return;
      }

      const availableTables = Object.keys(parsed.tables);

      // Step 2: Create a safety backup of current data
      toast.loading("Membuat safety backup...", { id: "restore-progress" });
      try {
        await backupService.exportData(["aset", "user", "riwayat"]);
      } catch {
        // Non-critical — continue even if safety backup fails
      }

      // Step 3: Upload the file to the server
      toast.loading("Mengupload file backup...", { id: "restore-progress" });
      const uploadRes = await backupService.upload(parsed, uploadedFile.name);

      if (!uploadRes.data.success) {
        toast.error("Gagal mengupload file backup", {
          id: "restore-progress",
        });
        setRestoring(false);
        return;
      }

      const serverFilename = uploadRes.data.data.filename;

      // Step 4: Import from the uploaded file
      toast.loading("Memulai restore data...", { id: "restore-progress" });
      const importRes = await backupService.importData(serverFilename, {
        overwrite: true,
        tables: availableTables,
      });

      if (importRes.data.success) {
        const results = importRes.data.data;
        const summary = Object.entries(results.imported || {})
          .map(([t, c]) => `${t}: ${c}`)
          .join(", ");
        const skipped = Object.entries(results.skipped || {})
          .filter(([, c]) => c > 0)
          .map(([t, c]) => `${t}: ${c}`)
          .join(", ");

        let msg = `Restore berhasil! Imported: ${summary || "0"}`;
        if (skipped) msg += ` | Skipped: ${skipped}`;
        if (results.errors?.length > 0) {
          msg += ` | ${results.errors.length} error(s)`;
        }
        toast.success(msg, { id: "restore-progress", duration: 5000 });
        setUploadedFile(null);
        // Reset file input
        const fileInput = document.getElementById("backup-file");
        if (fileInput) fileInput.value = "";
        loadBackups();
      } else {
        toast.error("Gagal melakukan restore", { id: "restore-progress" });
      }
    } catch (error) {
      console.error("Error restoring backup:", error);
      toast.error(
        "Gagal melakukan restore: " +
          (error.response?.data?.error || error.message),
        { id: "restore-progress" },
      );
    } finally {
      setRestoring(false);
    }
  };

  // ===== RESTORE FROM SERVER HISTORY =====
  const handleRestoreFromHistory = async (filename) => {
    const confirmed = await confirm({
      title: "Restore Database",
      message: `Apakah Anda yakin ingin melakukan restore dari backup "${filename}"? Proses ini akan mengganti SEMUA data saat ini.`,
      confirmText: "Ya, Restore",
      cancelText: "Batal",
      type: "danger",
    });

    if (!confirmed) return;

    setRestoring(true);
    try {
      // Step 1: Create a safety backup of current data
      toast.loading("Membuat safety backup...", { id: "restore-progress" });
      try {
        await backupService.exportData(["aset", "user", "riwayat"]);
      } catch {
        // Non-critical
      }

      // Step 2: Import from server-side file
      toast.loading("Memulai restore data...", { id: "restore-progress" });
      const importRes = await backupService.importData(filename, {
        overwrite: true,
        tables: ["aset", "user", "riwayat"],
      });

      if (importRes.data.success) {
        const results = importRes.data.data;
        const summary = Object.entries(results.imported || {})
          .map(([t, c]) => `${t}: ${c}`)
          .join(", ");
        toast.success(`Restore berhasil! Imported: ${summary || "0"}`, {
          id: "restore-progress",
          duration: 5000,
        });
        loadBackups();
      } else {
        toast.error("Gagal melakukan restore", { id: "restore-progress" });
      }
    } catch (error) {
      console.error("Error restoring from history:", error);
      toast.error(
        "Gagal melakukan restore: " +
          (error.response?.data?.error || error.message),
        { id: "restore-progress" },
      );
    } finally {
      setRestoring(false);
    }
  };

  // ===== DELETE BACKUP =====
  const handleDeleteBackup = async (filename) => {
    const confirmed = await confirm({
      title: "Hapus Backup",
      message: `Apakah Anda yakin ingin menghapus backup "${filename}"?`,
      confirmText: "Hapus",
      cancelText: "Batal",
      type: "danger",
    });

    if (confirmed) {
      try {
        const response = await backupService.remove(filename);
        if (response.data.success) {
          toast.success("Backup berhasil dihapus");
          loadBackups();
        }
      } catch (error) {
        console.error("Error deleting backup:", error);
        toast.error(
          "Gagal menghapus backup: " +
            (error.response?.data?.error || error.message),
        );
      }
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* ==================== PAGE HEADER ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-linear-to-br from-accent to-accent/70 rounded-xl flex items-center justify-center">
            <HardDrivesIcon
              size={24}
              weight="duotone"
              className="text-surface"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
              Backup & Restore
            </h1>
            <p className="mt-0.5 text-xs text-text-tertiary">
              Cadangkan atau pulihkan data sistem.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && (
            <button
              onClick={handleExportCsv}
              className="flex items-center justify-center gap-2 bg-surface border border-border text-text-primary px-4 py-2.5 rounded-xl hover:bg-surface-secondary transition-all text-sm font-semibold"
            >
              <DownloadSimpleIcon size={16} weight="bold" />
              Export CSV
            </button>
          )}
          {canCreate && (
            <button
              onClick={handleBackupNow}
              disabled={exporting}
              className="flex items-center justify-center gap-2 bg-accent text-surface px-5 py-2.5 rounded-xl hover:opacity-90 transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
            >
              {exporting ? (
                <>
                  <CircleNotchIcon
                    size={18}
                    weight="bold"
                    className="animate-spin"
                  />
                  Membuat Backup...
                </>
              ) : (
                <>
                  <CloudArrowUpIcon size={18} weight="bold" />
                  Backup Sekarang
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ==================== STATS CARDS ==================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: "Backup Terakhir",
            value: dbInfo.backupTerakhir,
            icon: CalendarBlankIcon,
            iconBg: "bg-blue-100 dark:bg-blue-900/30",
            iconColor: "text-blue-600 dark:text-blue-400",
          },
          {
            label: "Ukuran Database",
            value: dbInfo.ukuranDatabase,
            icon: DatabaseIcon,
            iconBg: "bg-purple-100 dark:bg-purple-900/30",
            iconColor: "text-purple-600 dark:text-purple-400",
          },
          {
            label: "Total Record",
            value: dbInfo.totalRecord,
            icon: ChartBarIcon,
            iconBg: "bg-orange-100 dark:bg-orange-900/30",
            iconColor: "text-orange-600 dark:text-orange-400",
          },
          {
            label: "Status Sistem",
            value: dbInfo.statusSistem,
            icon: CheckCircleIcon,
            iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
            iconColor: "text-emerald-600 dark:text-emerald-400",
            valueColor: "text-emerald-600 dark:text-emerald-400",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-surface rounded-xl border border-border p-3.5 sm:p-4 hover:shadow-md hover:border-border/80 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 ${stat.iconBg} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                >
                  <Icon size={20} weight="duotone" className={stat.iconColor} />
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-bold truncate ${stat.valueColor || "text-text-primary"}`}
                  >
                    {stat.value}
                  </p>
                  <p className="text-[10px] sm:text-xs text-text-muted mt-0.5">
                    {stat.label}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ==================== MAIN GRID ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* ===== BACKUP SCHEDULE ===== */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-surface-secondary/50 flex items-center gap-3">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
              <TimerIcon size={16} weight="duotone" className="text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-primary">
                Jadwal Backup Otomatis
              </h3>
              <p className="text-[10px] text-text-muted">
                Atur frekuensi dan waktu backup
              </p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {/* Auto Backup Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-surface-secondary rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${autoBackup ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-gray-100 dark:bg-gray-800"}`}
                >
                  <ArrowsClockwiseIcon
                    size={16}
                    weight="bold"
                    className={
                      autoBackup
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-text-muted"
                    }
                  />
                </div>
                <div>
                  <span className="text-sm font-semibold text-text-primary">
                    Backup Otomatis
                  </span>
                  <p className="text-[10px] text-text-muted">
                    {autoBackup ? "Aktif" : "Nonaktif"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAutoBackup(!autoBackup)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  autoBackup ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-surface rounded-full shadow-md transition-transform ${
                    autoBackup ? "translate-x-5.5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Schedule Options */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Frekuensi
                </label>
                <select
                  value={backupSchedule}
                  onChange={(e) => setBackupSchedule(e.target.value)}
                  className="w-full border border-border bg-surface text-text-primary rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                >
                  <option value="harian">Harian</option>
                  <option value="mingguan">Mingguan</option>
                  <option value="bulanan">Bulanan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Waktu Backup
                </label>
                <input
                  type="time"
                  value={backupTime}
                  onChange={(e) => setBackupTime(e.target.value)}
                  className="w-full border border-border bg-surface text-text-primary rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex items-start gap-2.5 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl">
              <InfoIcon
                size={16}
                weight="fill"
                className="text-blue-500 shrink-0 mt-0.5"
              />
              <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                Backup otomatis akan berjalan sesuai jadwal. Pastikan server
                tetap aktif pada waktu yang ditentukan.
              </p>
            </div>

            <button
              onClick={handleSaveSchedule}
              className="w-full bg-accent text-surface px-4 py-2.5 rounded-xl hover:opacity-90 transition-all text-sm font-bold flex items-center justify-center gap-2"
            >
              <FloppyDiskIcon size={16} weight="bold" />
              Simpan Jadwal
            </button>
          </div>
        </div>

        {/* ===== RESTORE DATABASE ===== */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-surface-secondary/50 flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
              <CloudArrowDownIcon
                size={16}
                weight="duotone"
                className="text-red-500 dark:text-red-400"
              />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-primary">
                Restore Database
              </h3>
              <p className="text-[10px] text-text-muted">
                Pulihkan data dari file backup
              </p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {/* Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                uploadedFile
                  ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10"
                  : "border-border hover:border-accent/50 hover:bg-accent/5"
              }`}
            >
              <input
                type="file"
                id="backup-file"
                accept=".json"
                className="hidden"
                onChange={handleFileUpload}
              />
              <label htmlFor="backup-file" className="cursor-pointer block">
                {uploadedFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mx-auto">
                      <FileArrowUpIcon
                        size={24}
                        weight="duotone"
                        className="text-emerald-500"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setUploadedFile(null);
                      }}
                      className="text-xs text-red-500 hover:text-red-600 font-medium"
                    >
                      Hapus file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-surface-secondary rounded-xl flex items-center justify-center mx-auto group-hover:bg-accent/10">
                      <FolderOpenIcon
                        size={24}
                        weight="duotone"
                        className="text-text-muted"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        Pilih File Backup
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        Format: .json (hasil export sistem)
                      </p>
                    </div>
                  </div>
                )}
              </label>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl">
              <WarningCircleIcon
                size={16}
                weight="fill"
                className="text-red-500 shrink-0 mt-0.5"
              />
              <p className="text-[11px] text-red-700 dark:text-red-300 leading-relaxed">
                <span className="font-bold">Perhatian!</span> Restore akan
                mengganti <span className="font-bold">SEMUA data</span> saat
                ini. Pastikan sudah membuat backup terbaru sebelum melakukan
                restore.
              </p>
            </div>

            {canRestore ? (
              <button
                onClick={handleRestore}
                disabled={!uploadedFile || restoring}
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  uploadedFile && !restoring
                    ? "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20"
                    : "bg-surface-secondary text-text-muted cursor-not-allowed border border-border"
                }`}
              >
                {restoring ? (
                  <>
                    <CircleNotchIcon
                      size={16}
                      weight="bold"
                      className="animate-spin"
                    />
                    Memproses Restore...
                  </>
                ) : (
                  <>
                    <ArrowClockwiseIcon size={16} weight="bold" />
                    Mulai Restore
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 p-3 bg-surface-secondary rounded-xl border border-border">
                <ShieldCheckIcon size={16} className="text-text-muted" />
                <span className="text-xs text-text-muted font-medium">
                  Hanya admin yang dapat melakukan restore
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== BACKUP HISTORY ==================== */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-surface-secondary/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
              <ClipboardTextIcon
                size={16}
                weight="duotone"
                className="text-accent"
              />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-primary">
                Riwayat Backup
              </h3>
              <p className="text-[10px] text-text-muted">
                Daftar backup yang tersimpan di server
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-text-muted bg-surface-secondary border border-border px-2.5 py-1 rounded-lg">
            {backupHistory.length} file
          </span>
        </div>

        {backupHistory.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-surface-secondary rounded-2xl flex items-center justify-center mb-4">
              <DatabaseIcon
                size={32}
                weight="duotone"
                className="text-text-muted"
              />
            </div>
            <p className="text-sm font-semibold text-text-secondary mb-1">
              Belum ada backup
            </p>
            <p className="text-xs text-text-muted">
              Buat backup pertama untuk melihat riwayat di sini
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border max-h-105 overflow-y-auto">
            {paginatedBackupHistory.map((backup) => (
              <div
                key={backup.id}
                className="px-5 py-3.5 flex items-center gap-4 hover:bg-surface-secondary/50 transition-colors group"
              >
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    backup.status === "Success"
                      ? "bg-emerald-100 dark:bg-emerald-900/20"
                      : "bg-red-100 dark:bg-red-900/20"
                  }`}
                >
                  <FileArrowDownIcon
                    size={20}
                    weight="duotone"
                    className={
                      backup.status === "Success"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {backup.namaFile}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        backup.status === "Success"
                          ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {backup.status === "Success" ? (
                        <CheckCircleIcon size={10} weight="fill" />
                      ) : (
                        <WarningCircleIcon size={10} weight="fill" />
                      )}
                      {backup.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-text-muted">
                      {backup.tanggal}
                    </span>
                    <span className="text-[10px] text-text-muted">•</span>
                    <span className="text-xs text-text-muted">
                      {backup.ukuran}
                    </span>
                    <span className="text-[10px] text-text-muted">•</span>
                    <span className="text-xs text-text-muted">
                      {backup.dilakukanOleh}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {backup.status === "Success" && (
                    <>
                      <button
                        onClick={() => handleDownloadBackup(backup.namaFile)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-accent bg-accent/10 rounded-lg hover:bg-accent/20 transition-colors"
                        title="Download backup"
                      >
                        <DownloadSimpleIcon size={14} weight="bold" />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                      {canRestore && (
                        <button
                          onClick={() =>
                            handleRestoreFromHistory(backup.namaFile)
                          }
                          disabled={restoring}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors disabled:opacity-50"
                          title="Restore dari backup ini"
                        >
                          <ArrowClockwiseIcon size={14} weight="bold" />
                          <span className="hidden sm:inline">Restore</span>
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => handleDeleteBackup(backup.id)}
                    className="flex items-center gap-1.5 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Hapus backup"
                  >
                    <TrashIcon size={16} weight="bold" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {backupHistory.length > 0 && (
          <Pagination
            currentPage={safeBackupPage}
            totalPages={backupTotalPages}
            totalItems={backupHistory.length}
            itemsPerPage={backupPageSize}
            onPageChange={setBackupPage}
            onItemsPerPageChange={(value) => {
              setBackupPageSize(value);
              setBackupPage(1);
            }}
            pageSizeOptions={[10, 20, 50]}
            embedded
            itemLabel="backup"
          />
        )}
      </div>
    </div>
  );
}
