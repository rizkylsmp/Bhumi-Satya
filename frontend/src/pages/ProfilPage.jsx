import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "../stores/authStore";
import { authService, uploadService } from "../services/api";
import {
  UserCircleIcon,
  LockIcon,
  ClipboardTextIcon,
  CameraIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  IdentificationBadgeIcon,
  BuildingsIcon,
  ShieldCheckIcon,
  SignInIcon,
  GlobeIcon,
  CalendarBlankIcon,
  FloppyDiskIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  InfoIcon,
  UserIcon,
  FingerprintIcon,
  SpinnerGapIcon,
  QrCodeIcon,
  CopyIcon,
  ShieldWarningIcon,
} from "@phosphor-icons/react";

export default function ProfilPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [activeTab, setActiveTab] = useState("informasi_pribadi");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Profile data from API
  const [profileData, setProfileData] = useState({
    username: "",
    role: "",
    namaLengkap: "",
    nip: "",
    email: "",
    noTelepon: "",
    jabatan: "",
    instansi: "",
    alamat: "",
  });

  const [stats, setStats] = useState({
    totalLogin: 0,
    aktivitas: 0,
    hariAktif: 0,
  });
  const [lastLogin, setLastLogin] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);
  const [statusAkun, setStatusAkun] = useState("Aktif");
  const [recentActivities, setRecentActivities] = useState([]);

  // Security data
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState(null); // { qrCode, secret }
  const [mfaOtpCode, setMfaOtpCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaDisablePassword, setMfaDisablePassword] = useState("");
  const [showMfaDisable, setShowMfaDisable] = useState(false);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Fetch profile data from API
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authService.me();
      const { data, stats: s, lastLogin: ll, recentActivities: ra } = res.data;

      setProfileData({
        username: data.username || "",
        role: data.role || "",
        namaLengkap: data.nama_lengkap || "",
        nip: data.nip || "",
        email: data.email || "",
        noTelepon: data.no_telepon || "",
        jabatan: data.jabatan || "",
        instansi: data.instansi || "",
        alamat: data.alamat || "",
      });

      setStats(s || { totalLogin: 0, aktivitas: 0, hariAktif: 0 });
      setLastLogin(ll);
      setCreatedAt(data.created_at);
      setStatusAkun(data.status_aktif ? "Aktif" : "Nonaktif");
      setMfaEnabled(data.mfa_enabled || false);
      setRecentActivities(
        (ra || []).map((a) => ({
          id: a.id,
          aksi: a.aksi,
          waktu: formatDate(a.waktu),
          ip: a.ip || "-",
        })),
      );
    } catch (err) {
      console.error("Error fetching profile:", err);
      toast.error("Gagal memuat data profil");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const tabs = [
    {
      id: "informasi_pribadi",
      label: "Informasi Pribadi",
      icon: <UserCircleIcon size={16} />,
    },
    { id: "keamanan", label: "Keamanan", icon: <LockIcon size={16} /> },
    {
      id: "aktivitas_terakhir",
      label: "Aktivitas Terakhir",
      icon: <ClipboardTextIcon size={16} />,
    },
  ];

  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSecurityChange = (field, value) => {
    setSecurityData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const res = await authService.updateProfile({
        nama_lengkap: profileData.namaLengkap,
        email: profileData.email,
        no_telepon: profileData.noTelepon,
        nip: profileData.nip,
        jabatan: profileData.jabatan,
        instansi: profileData.instansi,
        alamat: profileData.alamat,
      });
      // Update auth store so sidebar/header reflect changes
      if (res.data?.data) {
        setUser({ ...user, ...res.data.data });
      }
      toast.success("Profil berhasil diperbarui!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Gagal menyimpan profil");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!securityData.currentPassword) {
      toast.error("Masukkan password saat ini!");
      return;
    }
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error("Password baru dan konfirmasi tidak cocok!");
      return;
    }
    if (securityData.newPassword.length < 8) {
      toast.error("Password minimal 8 karakter!");
      return;
    }
    try {
      setChangingPassword(true);
      await authService.changePassword({
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword,
      });
      toast.success("Password berhasil diubah!");
      setSecurityData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      toast.error(err.response?.data?.error || "Gagal mengubah password");
    } finally {
      setChangingPassword(false);
    }
  };

  // MFA handlers
  const handleMfaSetup = async () => {
    try {
      setMfaLoading(true);
      const res = await authService.setupMfa();
      setMfaSetupData({
        qrCode: res.data.qrCode,
        secret: res.data.secret,
      });
      setMfaOtpCode("");
    } catch (err) {
      toast.error(err.response?.data?.error || "Gagal memulai setup MFA");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleMfaVerifySetup = async () => {
    if (!mfaOtpCode || mfaOtpCode.length !== 6) {
      toast.error("Masukkan 6 digit kode OTP");
      return;
    }
    try {
      setMfaLoading(true);
      await authService.verifyMfaSetup(mfaOtpCode);
      toast.success("MFA berhasil diaktifkan!");
      setMfaEnabled(true);
      setMfaSetupData(null);
      setMfaOtpCode("");
    } catch (err) {
      toast.error(err.response?.data?.error || "Kode OTP tidak valid");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleMfaDisable = async () => {
    if (!mfaDisablePassword) {
      toast.error("Masukkan password untuk menonaktifkan MFA");
      return;
    }
    try {
      setMfaLoading(true);
      await authService.disableMfa(mfaDisablePassword);
      toast.success("MFA berhasil dinonaktifkan");
      setMfaEnabled(false);
      setMfaDisablePassword("");
      setShowMfaDisable(false);
    } catch (err) {
      toast.error(err.response?.data?.error || "Gagal menonaktifkan MFA");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleCancelMfaSetup = () => {
    setMfaSetupData(null);
    setMfaOtpCode("");
  };

  const handleChangeFoto = () => {
    document.getElementById("foto-input").click();
  };

  const handleFotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const res = await uploadService.single(file, "foto-profil");
        await authService.updateProfile({ foto_profil: res.data.data.url });
        toast.success("Foto profil berhasil diupload!");
      } catch (error) {
        toast.error(
          "Gagal mengupload foto: " +
            (error.response?.data?.error || error.message),
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[60vh]">
        <SpinnerGapIcon size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Profile Hero Card */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
        {/* Banner */}
        <div className="relative bg-linear-to-br from-accent via-accent/90 to-accent/70 px-5 sm:px-8 pt-6 sm:pt-8 pb-16 sm:pb-20">
          {/* Abstract pattern overlay */}
          <div className="absolute inset-0 opacity-[0.04]">
            <div className="absolute top-0 right-0 w-96 h-96 bg-surface rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-surface rounded-full translate-y-1/2 -translate-x-1/4" />
          </div>

          {/* Stats row - Desktop */}
          <div className="relative hidden sm:flex items-center justify-end gap-3">
            {[
              { value: stats.totalLogin, label: "Login" },
              { value: stats.aktivitas.toLocaleString(), label: "Aktivitas" },
              { value: stats.hariAktif, label: "Hari Aktif" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-surface/10 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center min-w-20 border border-surface/10"
              >
                <div className="text-lg font-bold text-surface">{s.value}</div>
                <div className="text-[10px] text-surface/60 font-medium">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Info - overlapping banner */}
        <div className="relative px-5 sm:px-8 -mt-12 sm:-mt-14 pb-5">
          {/* Avatar row */}
          <div className="flex items-end justify-between">
            <div className="relative shrink-0 group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-surface-secondary rounded-2xl flex items-center justify-center border-4 border-surface shadow-xl ring-1 ring-border">
                <UserCircleIcon
                  size={56}
                  weight="duotone"
                  className="text-text-muted"
                />
              </div>
              <input
                type="file"
                id="foto-input"
                accept="image/*"
                className="hidden"
                onChange={handleFotoUpload}
              />
              <button
                onClick={handleChangeFoto}
                className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-accent text-surface rounded-xl shadow-lg flex items-center justify-center hover:scale-105 transition-transform ring-2 ring-surface"
              >
                <CameraIcon size={14} weight="bold" />
              </button>
            </div>

            {/* Account meta - Desktop only */}
            <div className="hidden lg:flex items-center gap-4 text-xs text-text-muted pb-1">
              <div className="flex items-center gap-1.5">
                <CalendarBlankIcon size={13} />
                <span>Bergabung {formatDateShort(createdAt)}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-text-muted" />
              <div className="flex items-center gap-1.5">
                <SignInIcon size={13} />
                <span>
                  Login terakhir {lastLogin ? formatDate(lastLogin.waktu) : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Name & badges - below avatar, fully on white card */}
          <div className="mt-3 sm:mt-4">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary truncate">
              {profileData.namaLengkap}
            </h2>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-accent/10 text-accent text-xs font-semibold px-3 py-1.5 rounded-lg">
                <ShieldCheckIcon size={13} weight="fill" />
                {profileData.role}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-lg">
                <CheckCircleIcon size={13} weight="fill" />
                {statusAkun}
              </span>
            </div>
          </div>

          {/* Mobile stats */}
          <div className="flex sm:hidden justify-center gap-2 mt-4">
            {[
              { value: stats.totalLogin, label: "Login" },
              { value: stats.aktivitas.toLocaleString(), label: "Aktivitas" },
              { value: stats.hariAktif, label: "Hari Aktif" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-surface-secondary rounded-xl px-3 py-2 text-center flex-1 border border-border"
              >
                <div className="text-base font-bold text-text-primary">
                  {s.value}
                </div>
                <div className="text-[10px] text-text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs + Content */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
        {/* Tab bar */}
        <div className="border-b border-border bg-surface-secondary/30 px-2 sm:px-4">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-t-lg ${
                  activeTab === tab.id
                    ? "text-accent bg-surface shadow-sm border border-border border-b-surface -mb-px z-10"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {/* Tab: Informasi Pribadi */}
          {activeTab === "informasi_pribadi" && (
            <div className="space-y-6">
              {/* Read-only section */}
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <InfoIcon
                    size={15}
                    weight="fill"
                    className="text-text-muted"
                  />
                  Informasi Akun
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 bg-surface-secondary/50 border border-border rounded-xl px-4 py-3">
                    <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                      <UserIcon
                        size={16}
                        weight="duotone"
                        className="text-accent"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider">
                        Username
                      </p>
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {profileData.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-surface-secondary/50 border border-border rounded-xl px-4 py-3">
                    <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                      <ShieldCheckIcon
                        size={16}
                        weight="duotone"
                        className="text-accent"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider">
                        Role / Hak Akses
                      </p>
                      <p className="text-sm font-semibold text-text-primary truncate capitalize">
                        {profileData.role?.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editable section */}
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <FingerprintIcon
                    size={15}
                    weight="fill"
                    className="text-text-muted"
                  />
                  Data Pribadi
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      label: "Nama Lengkap",
                      field: "namaLengkap",
                      icon: UserCircleIcon,
                      type: "text",
                    },
                    {
                      label: "NIP",
                      field: "nip",
                      icon: IdentificationBadgeIcon,
                      type: "text",
                    },
                    {
                      label: "Email",
                      field: "email",
                      icon: EnvelopeIcon,
                      type: "email",
                    },
                    {
                      label: "No. Telepon",
                      field: "noTelepon",
                      icon: PhoneIcon,
                      type: "tel",
                    },
                    {
                      label: "Jabatan",
                      field: "jabatan",
                      icon: BuildingsIcon,
                      type: "text",
                    },
                    {
                      label: "Instansi",
                      field: "instansi",
                      icon: GlobeIcon,
                      type: "text",
                    },
                  ].map(({ label, field, icon: Icon, type }) => (
                    <div key={field} className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                        <Icon
                          size={13}
                          weight="duotone"
                          className="text-text-muted"
                        />
                        {label}
                      </label>
                      <input
                        type={type}
                        value={profileData[field]}
                        onChange={(e) =>
                          handleInputChange(field, e.target.value)
                        }
                        className="w-full border border-border bg-surface text-text-primary rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all placeholder:text-text-muted"
                      />
                    </div>
                  ))}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                      <MapPinIcon
                        size={13}
                        weight="duotone"
                        className="text-text-muted"
                      />
                      Alamat
                    </label>
                    <textarea
                      value={profileData.alamat}
                      onChange={(e) =>
                        handleInputChange("alamat", e.target.value)
                      }
                      rows={3}
                      className="w-full border border-border bg-surface text-text-primary rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none placeholder:text-text-muted"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-border">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 bg-accent text-surface px-6 py-2.5 rounded-xl hover:opacity-90 transition-all text-sm font-bold shadow-lg shadow-accent/20 disabled:opacity-50"
                >
                  <FloppyDiskIcon size={16} weight="bold" />
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          )}

          {/* Tab: Keamanan */}
          {activeTab === "keamanan" && (
            <div className="space-y-5">
              {/* Last login info card — full width */}
              <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <SignInIcon
                    size={18}
                    weight="duotone"
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-emerald-800 dark:text-emerald-300">
                    Login Terakhir
                  </h4>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">
                    {lastLogin ? formatDate(lastLogin.waktu) : "-"}
                  </p>
                </div>
                <CheckCircleIcon
                  size={22}
                  weight="fill"
                  className="text-emerald-500 shrink-0"
                />
              </div>

              {/* Two-column grid on desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Change password section */}
                <div className="border border-border rounded-xl overflow-hidden flex flex-col">
                  <div className="bg-surface-secondary/50 px-5 py-3.5 border-b border-border flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                      <LockIcon
                        size={15}
                        weight="duotone"
                        className="text-accent"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-text-primary">
                        Ubah Password
                      </h3>
                      <p className="text-[10px] text-text-muted">
                        Gunakan password yang kuat dan unik
                      </p>
                    </div>
                  </div>
                  <div className="p-5 space-y-4 flex-1 flex flex-col">
                    <div className="space-y-4 flex-1">
                      {[
                        {
                          label: "Password Saat Ini",
                          field: "currentPassword",
                          placeholder: "Masukkan password saat ini",
                        },
                        {
                          label: "Password Baru",
                          field: "newPassword",
                          placeholder: "Minimal 8 karakter",
                        },
                        {
                          label: "Konfirmasi Password",
                          field: "confirmPassword",
                          placeholder: "Ulangi password baru",
                        },
                      ].map(({ label, field, placeholder }) => (
                        <div key={field} className="space-y-1.5">
                          <label className="text-xs font-semibold text-text-secondary">
                            {label}
                          </label>
                          <input
                            type="password"
                            value={securityData[field]}
                            onChange={(e) =>
                              handleSecurityChange(field, e.target.value)
                            }
                            className="w-full border border-border bg-surface text-text-primary rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all placeholder:text-text-muted"
                            placeholder={placeholder}
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleChangePassword}
                      disabled={changingPassword}
                      className="flex items-center gap-2 bg-accent text-surface px-5 py-2.5 rounded-xl hover:opacity-90 transition-all text-sm font-bold shadow-lg shadow-accent/20 disabled:opacity-50"
                    >
                      <LockIcon size={14} weight="bold" />
                      {changingPassword ? "Mengubah..." : "Ubah Password"}
                    </button>
                  </div>
                </div>

                {/* MFA Section */}
                <div className="border border-border rounded-xl overflow-hidden flex flex-col">
                  <div className="bg-surface-secondary/50 px-5 py-3.5 border-b border-border flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                      <ShieldCheckIcon
                        size={15}
                        weight="duotone"
                        className="text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-text-primary">
                        Autentikasi Dua Faktor (MFA)
                      </h3>
                      <p className="text-[10px] text-text-muted">
                        Keamanan ekstra dengan Google Authenticator
                      </p>
                    </div>
                    {mfaEnabled && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
                        Aktif
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    {mfaEnabled ? (
                      /* MFA is active — show status & disable option */
                      <div className="space-y-4 flex-1 flex flex-col">
                        <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-xl">
                          <CheckCircleIcon
                            size={20}
                            weight="fill"
                            className="text-emerald-500 shrink-0"
                          />
                          <div>
                            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                              MFA Aktif
                            </p>
                            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70">
                              Akun Anda dilindungi dengan autentikasi dua faktor
                            </p>
                          </div>
                        </div>

                        <div className="flex-1" />

                        {showMfaDisable ? (
                          <div className="space-y-3">
                            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl">
                              <ShieldWarningIcon
                                size={16}
                                weight="fill"
                                className="text-amber-500 shrink-0 mt-0.5"
                              />
                              <p className="text-xs text-amber-700 dark:text-amber-300">
                                Menonaktifkan MFA akan mengurangi keamanan akun
                                Anda. Masukkan password untuk konfirmasi.
                              </p>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-text-secondary">
                                Password
                              </label>
                              <input
                                type="password"
                                value={mfaDisablePassword}
                                onChange={(e) =>
                                  setMfaDisablePassword(e.target.value)
                                }
                                className="w-full border border-border bg-surface text-text-primary rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all placeholder:text-text-muted"
                                placeholder="Masukkan password Anda"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleMfaDisable}
                                disabled={mfaLoading}
                                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl hover:bg-red-700 transition-all text-sm font-bold disabled:opacity-50"
                              >
                                {mfaLoading ? (
                                  <SpinnerGapIcon
                                    size={14}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <ShieldWarningIcon size={14} weight="bold" />
                                )}
                                {mfaLoading
                                  ? "Memproses..."
                                  : "Nonaktifkan MFA"}
                              </button>
                              <button
                                onClick={() => {
                                  setShowMfaDisable(false);
                                  setMfaDisablePassword("");
                                }}
                                className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-all border border-border"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowMfaDisable(true)}
                            className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 px-4 py-2.5 rounded-xl transition-all text-sm font-medium border border-red-200 dark:border-red-800/30"
                          >
                            <ShieldWarningIcon size={14} weight="bold" />
                            Nonaktifkan MFA
                          </button>
                        )}
                      </div>
                    ) : mfaSetupData ? (
                      /* MFA setup in progress — show QR code + verify */
                      <div className="space-y-5">
                        <div className="space-y-3">
                          <p className="text-sm text-text-secondary font-medium">
                            1. Scan QR code di bawah dengan aplikasi
                            authenticator (Google Authenticator, Authy, dll.)
                          </p>
                          <div className="flex justify-center p-4 bg-white rounded-xl border border-border">
                            <img
                              src={mfaSetupData.qrCode}
                              alt="QR Code MFA"
                              className="w-48 h-48"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm text-text-secondary font-medium">
                            Atau masukkan kode ini secara manual:
                          </p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 bg-surface-secondary text-text-primary px-4 py-2.5 rounded-xl text-xs font-mono tracking-wider border border-border break-all">
                              {mfaSetupData.secret}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  mfaSetupData.secret,
                                );
                                toast.success("Kode disalin!");
                              }}
                              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border border-border hover:bg-surface-secondary transition-all text-text-muted hover:text-text-primary"
                              aria-label="Salin kode"
                            >
                              <CopyIcon size={16} weight="bold" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm text-text-secondary font-medium">
                            2. Masukkan kode 6 digit dari aplikasi
                            authenticator:
                          </p>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={mfaOtpCode}
                            onChange={(e) =>
                              setMfaOtpCode(
                                e.target.value.replace(/\D/g, "").slice(0, 6),
                              )
                            }
                            className="w-full border border-border bg-surface text-text-primary rounded-xl px-4 py-3 text-center text-xl font-mono tracking-[0.5em] focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all placeholder:text-text-muted"
                            placeholder="000000"
                            autoComplete="one-time-code"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={handleMfaVerifySetup}
                            disabled={mfaLoading || mfaOtpCode.length !== 6}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-all text-sm font-bold disabled:opacity-50"
                          >
                            {mfaLoading ? (
                              <SpinnerGapIcon
                                size={14}
                                className="animate-spin"
                              />
                            ) : (
                              <ShieldCheckIcon size={14} weight="bold" />
                            )}
                            {mfaLoading
                              ? "Memverifikasi..."
                              : "Verifikasi & Aktifkan"}
                          </button>
                          <button
                            onClick={handleCancelMfaSetup}
                            className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-all border border-border"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* MFA not active — show setup button */
                      <div className="space-y-4 flex flex-col">
                        <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl">
                          <InfoIcon
                            size={16}
                            weight="fill"
                            className="text-blue-500 shrink-0 mt-0.5"
                          />
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            Autentikasi dua faktor menambahkan lapisan keamanan
                            ekstra. Setiap login akan memerlukan kode dari
                            aplikasi authenticator di ponsel Anda.
                          </p>
                        </div>
                        <div className="flex-1" />
                        <button
                          onClick={handleMfaSetup}
                          disabled={mfaLoading}
                          className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-all text-sm font-bold disabled:opacity-50"
                        >
                          {mfaLoading ? (
                            <SpinnerGapIcon
                              size={14}
                              className="animate-spin"
                            />
                          ) : (
                            <QrCodeIcon size={14} weight="bold" />
                          )}
                          {mfaLoading ? "Memuat..." : "Aktifkan MFA"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Aktivitas Terakhir */}
          {activeTab === "aktivitas_terakhir" && (
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <div className="text-center py-12 text-text-muted">
                  <ClipboardTextIcon
                    size={40}
                    weight="duotone"
                    className="mx-auto mb-3 opacity-40"
                  />
                  <p className="text-sm">Belum ada aktivitas tercatat</p>
                </div>
              ) : (
                <>
                  {/* Mobile view - Cards */}
                  <div className="sm:hidden space-y-2.5">
                    {recentActivities.map((activity, idx) => (
                      <div
                        key={activity.id}
                        className="bg-surface-secondary/50 border border-border rounded-xl p-3.5 flex items-start gap-3"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <ClipboardTextIcon
                            size={14}
                            weight="duotone"
                            className="text-accent"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary">
                            {activity.aksi}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-text-muted">
                              {activity.waktu}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span className="text-[10px] text-text-muted font-mono">
                              {activity.ip}
                            </span>
                          </div>
                        </div>
                        <ArrowRightIcon
                          size={14}
                          className="text-text-muted shrink-0 mt-1"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Desktop view - Table */}
                  <div className="hidden sm:block border border-border rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-surface-secondary/50">
                          <th className="text-left px-5 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                            No
                          </th>
                          <th className="text-left px-5 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                            Aksi
                          </th>
                          <th className="text-left px-5 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                            Waktu
                          </th>
                          <th className="text-left px-5 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                            IP Address
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {recentActivities.map((activity, idx) => (
                          <tr
                            key={activity.id}
                            className="hover:bg-surface-secondary/30 transition-colors"
                          >
                            <td className="px-5 py-3.5 text-xs text-text-muted font-medium">
                              {idx + 1}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="text-sm font-medium text-text-primary">
                                {activity.aksi}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-sm text-text-secondary">
                              {activity.waktu}
                            </td>
                            <td className="px-5 py-3.5">
                              <code className="text-xs text-text-muted bg-surface-secondary px-2 py-1 rounded-md font-mono">
                                {activity.ip}
                              </code>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
