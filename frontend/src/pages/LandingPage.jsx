import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  ArrowRightIcon,
  BuildingsIcon,
  RulerIcon,
  TagIcon,
  PhoneIcon,
  EnvelopeSimpleIcon,
  StorefrontIcon,
  SignInIcon,
  CaretLeftIcon,
  CaretRightIcon,
  XIcon,
  WhatsappLogoIcon,
  ImageIcon,
  FunnelIcon,
  MapTrifoldIcon,
  HandshakeIcon,
  PaperPlaneTiltIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  UserIcon,
  StackIcon,
  LockIcon,
  EyeIcon,
  EyeSlashIcon,
  WarningCircleIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  CalendarIcon,
  ChartBarIcon,
} from "@phosphor-icons/react";
import { sewaService, petaService, authService } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { useSessionStore } from "../stores/sessionStore";
import { formatDate } from "../utils/format";
import { normalizeMapMarkers } from "../utils/mapAssets";
import AssetMapDisplay from "../components/map/AssetMapDisplay";
import SewaPolygonMap from "../components/sewa/SewaPolygonMap";
import ChatbotButton from "../components/chatbot/ChatbotButton";
import ChatbotModal from "../components/chatbot/ChatbotModal";
import PublicNavbar from "../components/layout/PublicNavbar";
import { normalizeRole } from "../utils/permissions";
import BrandMark from "../components/shared/BrandMark";

// ============================================================
// ASSET DETAIL MODAL
// ============================================================
function AssetDetailModal({ item, onClose, onApply }) {
  const [currentPhoto, setCurrentPhoto] = useState(0);

  if (!item) return null;

  const aset = item.aset || {};
  const photos = item.foto_sewa?.length
    ? item.foto_sewa
    : aset.foto_aset
      ? [aset.foto_aset]
      : [];

  const lokasi = aset.lokasi || item.lokasi_aset;
  const wilayah = [aset.desa_kelurahan, aset.kecamatan]
    .filter(Boolean)
    .join(", ");
  const luas = aset.luas ? Number(aset.luas).toLocaleString("id-ID") : null;
  const polygonData = item.polygon_sewa || aset.polygon_bidang;
  const luasPolygon = polygonData?.properties?.luas
    ? Number(polygonData.properties.luas).toLocaleString("id-ID")
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Photo Gallery */}
        {photos.length > 0 ? (
          <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-t-2xl overflow-hidden">
            <img
              src={photos[currentPhoto]}
              alt={item.nama_aset}
              className="w-full h-full object-cover"
            />
            {photos.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentPhoto((p) =>
                      p === 0 ? photos.length - 1 : p - 1,
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <CaretLeftIcon size={18} weight="bold" />
                </button>
                <button
                  onClick={() =>
                    setCurrentPhoto((p) =>
                      p === photos.length - 1 ? 0 : p + 1,
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <CaretRightIcon size={18} weight="bold" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                  {currentPhoto + 1} / {photos.length}
                </div>
              </>
            )}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <XIcon size={18} weight="bold" />
            </button>
          </div>
        ) : (
          <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-t-2xl flex items-center justify-center">
            <ImageIcon size={48} className="text-gray-300 dark:text-gray-600" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <XIcon size={18} weight="bold" />
            </button>
          </div>
        )}

        <div className="p-6 space-y-5">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold text-text-primary leading-snug">
                {item.nama_aset}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border shrink-0 ${
                  item.status === "Disewakan"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/20"
                }`}
              >
                <StorefrontIcon size={13} weight="fill" />
                {item.status === "Disewakan" ? "Disewakan" : "Tersedia"}
              </span>
            </div>
            {item.no_lot && (
              <p className="text-sm font-mono font-medium text-text-muted mt-1">
                LOT-{item.no_lot}
              </p>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lokasi && (
              <div className="sm:col-span-2 flex items-start gap-2.5 bg-surface-secondary rounded-xl p-3 border border-border">
                <MapPinIcon
                  size={18}
                  weight="fill"
                  className="text-red-500 mt-0.5 shrink-0"
                />
                <div>
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    Lokasi
                  </p>
                  <p className="text-sm text-text-primary mt-0.5">{lokasi}</p>
                </div>
              </div>
            )}
            {wilayah && (
              <div className="flex items-start gap-2.5 bg-surface-secondary rounded-xl p-3 border border-border">
                <BuildingsIcon
                  size={18}
                  weight="fill"
                  className="text-blue-500 shrink-0"
                />
                <div>
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    Wilayah
                  </p>
                  <p className="text-sm text-text-primary mt-0.5">{wilayah}</p>
                </div>
              </div>
            )}
            {(luas || luasPolygon) && (
              <div className="flex items-start gap-2.5 bg-surface-secondary rounded-xl p-3 border border-border">
                <RulerIcon
                  size={18}
                  weight="bold"
                  className="text-emerald-500 shrink-0"
                />
                <div>
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    Luas
                  </p>
                  <p className="text-sm text-text-primary mt-0.5">
                    {luas || luasPolygon} m²
                  </p>
                </div>
              </div>
            )}
            {item.status === "Disewakan" && (
              <div className="flex items-start gap-2.5 bg-surface-secondary rounded-xl p-3 border border-border">
                <CalendarIcon
                  size={18}
                  weight="fill"
                  className="text-amber-500 shrink-0"
                />
                <div>
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    Berakhir Sampai
                  </p>
                  <p className="text-sm text-text-primary mt-0.5">
                    {item.tanggal_berakhir
                      ? formatDate(item.tanggal_berakhir)
                      : "Belum ditentukan"}
                  </p>
                </div>
              </div>
            )}
            {aset.jenis_aset && (
              <div className="flex items-start gap-2.5 bg-surface-secondary rounded-xl p-3 border border-border">
                <TagIcon
                  size={18}
                  weight="fill"
                  className="text-purple-500 shrink-0"
                />
                <div>
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    Jenis Aset
                  </p>
                  <p className="text-sm text-text-primary mt-0.5">
                    {aset.jenis_aset}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Polygon Map */}
          {polygonData && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                <MapTrifoldIcon
                  size={14}
                  weight="fill"
                  className="inline mr-1 -mt-0.5"
                />
                Peta Lokasi
              </p>
              <div className="rounded-xl overflow-hidden border border-border">
                <SewaPolygonMap
                  polygon={polygonData}
                  height={240}
                  showHeader={false}
                />
              </div>
            </div>
          )}

          {/* Catatan */}
          {item.catatan && (
            <div className="bg-surface-secondary rounded-xl p-4 border border-border">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                Deskripsi / Catatan
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">
                {item.catatan}
              </p>
            </div>
          )}

          {/* CTA */}
          {item.status === "Disewakan" ? (
            <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold rounded-xl border border-emerald-500/20">
              <StorefrontIcon size={18} weight="fill" />
              Aset ini sedang disewakan
            </div>
          ) : (
            <button
              onClick={() => {
                onApply(item);
                onClose();
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <PaperPlaneTiltIcon size={18} weight="fill" />
              Masuk untuk Ajukan Sewa
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ASSET CARD
// ============================================================
function AssetCard({ item, onClick }) {
  const aset = item.aset || {};
  const thumbnail = item.foto_sewa?.[0] || aset.foto_aset;

  return (
    <button
      onClick={onClick}
      className="group bg-surface rounded-xl border border-border shadow-sm hover:shadow-lg hover:border-accent/20 transition-all duration-200 overflow-hidden text-left w-full h-full flex flex-col"
    >
      <div className="h-44 sm:h-48 bg-gray-100 dark:bg-gray-800 overflow-hidden relative shrink-0">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={item.nama_aset}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={36} className="text-gray-300 dark:text-gray-600" />
          </div>
        )}
        <div className="absolute top-2.5 left-2.5">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-surface text-xs font-semibold rounded-full backdrop-blur-sm ${
              item.status === "Disewakan"
                ? "bg-emerald-500/90"
                : "bg-cyan-500/90"
            }`}
          >
            <StorefrontIcon size={13} weight="fill" />
            {item.status === "Disewakan" ? "Disewakan" : "Tersedia"}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-text-primary text-sm leading-snug line-clamp-2 min-h-10 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {item.nama_aset}
        </h3>
        <div className="mt-2 min-h-5">
          {(aset.lokasi || item.lokasi_aset) && (
            <div className="flex items-start gap-1.5">
              <MapPinIcon
                size={14}
                weight="fill"
                className="text-red-400 mt-0.5 shrink-0"
              />
              <span className="text-xs text-text-muted line-clamp-1">
                {aset.lokasi || item.lokasi_aset}
              </span>
            </div>
          )}
        </div>
        <div className="mt-2.5 min-h-16 flex flex-col gap-1.5">
          {(aset.luas || item.polygon_sewa?.properties?.luas) && (
            <span className="text-xs text-text-muted flex items-center gap-1 min-w-0">
              <RulerIcon size={12} weight="bold" className="shrink-0" />
              <span className="truncate">
                {Number(
                  aset.luas || item.polygon_sewa?.properties?.luas,
                ).toLocaleString("id-ID")}{" "}
                m²
              </span>
            </span>
          )}
          <div className="flex items-center gap-3 min-w-0">
            {item.no_lot && (
              <span className="text-xs text-text-muted flex items-center gap-1 min-w-0">
                <TagIcon size={12} weight="fill" className="shrink-0" />
                <span className="truncate">LOT-{item.no_lot}</span>
              </span>
            )}
            {aset.jenis_aset && (
              <span className="text-xs text-text-muted flex items-center gap-1 min-w-0">
                <TagIcon size={12} weight="fill" className="shrink-0" />
                <span className="truncate">{aset.jenis_aset}</span>
              </span>
            )}
          </div>
          <div className="min-h-4">
            {item.status === "Disewakan" && (
              <span className="text-xs text-text-muted flex items-center gap-1 min-w-0">
                <CalendarIcon size={12} weight="fill" className="shrink-0" />
                <span className="truncate">
                  Sampai{" "}
                  {item.tanggal_berakhir
                    ? formatDate(item.tanggal_berakhir)
                    : "belum ditentukan"}
                </span>
              </span>
            )}
          </div>
        </div>
        <div className="pt-2 mt-auto border-t border-border">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:gap-2 transition-all">
            Lihat Detail
            <ArrowRightIcon size={12} weight="bold" />
          </span>
        </div>
      </div>
    </button>
  );
}

// ============================================================
// LANDING PAGE
// ============================================================
export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setToken } = useAuthStore();
  const startSession = useSessionStore((s) => s.startSession);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  // Sections refs
  const petaRef = useRef(null);
  const asetRef = useRef(null);
  const sewaRef = useRef(null);
  const kontakRef = useRef(null);

  // Sewa data
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [jenisAset, setJenisAset] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  // Map data
  const [mapAssets, setMapAssets] = useState([]);
  const [mapSearch, setMapSearch] = useState("");
  const [focusedAsset, setFocusedAsset] = useState(null);
  const [showMapMarkers, setShowMapMarkers] = useState(true);
  const [showMapPolygons, setShowMapPolygons] = useState(false);

  // Login panel state
  const [showLoginPanel, setShowLoginPanel] = useState(
    location.state?.openLoginPanel === true,
  );
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetRecipient, setResetRecipient] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaToken, setMfaToken] = useState("");
  const [otpType, setOtpType] = useState("authenticator");
  const [otpRecipient, setOtpRecipient] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [mfaEmailLoading, setMfaEmailLoading] = useState(false);

  // Fetch map markers
  useEffect(() => {
    petaService
      .getPublicMarkers()
      .then((res) => setMapAssets(normalizeMapMarkers(res.data.data || [])))
      .catch(() => setMapAssets([]));
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch available sewa
  useEffect(() => {
    setLoading(true);
    const params = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (kecamatan) params.kecamatan = kecamatan;
    if (jenisAset) params.jenis_aset = jenisAset;

    sewaService
      .getPublicAvailable(params)
      .then((res) => setItems(res.data.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [debouncedSearch, kecamatan, jenisAset]);

  const filterOptions = useMemo(() => {
    const kecSet = new Set();
    const jenisSet = new Set();
    items.forEach((item) => {
      if (item.aset?.kecamatan) kecSet.add(item.aset.kecamatan);
      if (item.aset?.jenis_aset) jenisSet.add(item.aset.jenis_aset);
    });
    return {
      kecamatan: [...kecSet].sort(),
      jenis: [...jenisSet].sort(),
    };
  }, [items]);

  const filteredMapAssets = useMemo(() => {
    if (!mapSearch.trim()) return mapAssets;
    const q = mapSearch.toLowerCase();
    return mapAssets.filter(
      (a) =>
        a.nama_aset?.toLowerCase().includes(q) ||
        a.lokasi?.toLowerCase().includes(q) ||
        a.kecamatan?.toLowerCase().includes(q) ||
        a.desa_kelurahan?.toLowerCase().includes(q),
    );
  }, [mapAssets, mapSearch]);

  const assetOverview = useMemo(() => {
    const kecamatanSet = new Set();
    const jenisSet = new Set();
    let certified = 0;

    mapAssets.forEach((asset) => {
      if (asset.kecamatan) kecamatanSet.add(asset.kecamatan);
      if (asset.jenis_aset) jenisSet.add(asset.jenis_aset);
      if (
        asset.nomor_sertifikat ||
        asset.no_sertifikat ||
        asset.status_sertifikat === "bersertifikat"
      ) {
        certified += 1;
      }
    });

    return {
      total: mapAssets.length,
      kecamatan: kecamatanSet.size,
      jenis: jenisSet.size,
      certified,
      featured: mapAssets.slice(0, 6),
    };
  }, [mapAssets]);

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleApply = () => setShowLoginPanel(true);

  const navLinks = [
    {
      label: "Peta Aset",
      icon: MapTrifoldIcon,
      onClick: () => navigate("/peta-publik"),
    },
    { label: "Katalog Aset", icon: BuildingsIcon, onClick: () => scrollTo(asetRef) },
    { label: "Layanan Sewa", icon: HandshakeIcon, onClick: () => scrollTo(sewaRef) },
  ];

  const getPostLoginPath = (role) =>
    normalizeRole(role) === "masyarakat"
      ? "/sewa/aset-tersedia"
      : "/dashboard";

  // Login handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      if (!loginUsername || !loginPassword) {
        setLoginError("Username dan password harus diisi");
        setLoginLoading(false);
        return;
      }
      const response = await authService.login(
        loginUsername,
        loginPassword,
        "email",
      );
      if (response.data.mfaRequired) {
        setMfaToken(response.data.mfaToken);
        setOtpType("authenticator");
        setOtpRecipient("");
        setMfaStep(true);
        setOtpCode("");
        setLoginLoading(false);
        return;
      }
      if (response.data.otpRequired) {
        setMfaToken(response.data.otpToken);
        setOtpType(response.data.otpChannel || "email");
        setOtpRecipient(response.data.recipient || "");
        setMfaStep(true);
        setOtpCode("");
        setLoginLoading(false);
        return;
      }
      setToken(response.data.token);
      setUser(response.data.user);
      startSession(response.data.sessionDuration);
      toast.success("Login berhasil!");
      navigate(getPostLoginPath(response.data.user?.role));
    } catch (err) {
      const msg = err.response?.data?.error || "Login gagal";
      setLoginError(msg);
      toast.error(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleMfaVerify = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      if (!otpCode || otpCode.length !== 6) {
        setLoginError("Masukkan 6 digit kode OTP");
        setLoginLoading(false);
        return;
      }
      const response =
        otpType === "authenticator"
          ? await authService.verifyMfaLogin(mfaToken, otpCode)
          : await authService.verifyLoginOtp(mfaToken, otpCode);
      setToken(response.data.token);
      setUser(response.data.user);
      startSession(response.data.sessionDuration);
      toast.success("Login berhasil!");
      navigate(getPostLoginPath(response.data.user?.role));
    } catch (err) {
      const msg = err.response?.data?.error || "Verifikasi OTP gagal";
      setLoginError(msg);
      toast.error(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRequestMfaEmailOtp = async () => {
    setLoginError("");
    setMfaEmailLoading(true);
    try {
      const response = await authService.requestMfaEmailOtp(mfaToken);
      setMfaToken(response.data.otpToken);
      setOtpType("email");
      setOtpRecipient(response.data.recipient || "");
      setOtpCode("");
      toast.success("Kode OTP telah dikirim ke email");
    } catch (err) {
      const msg = err.response?.data?.error || "Gagal mengirim OTP email";
      setLoginError(msg);
      toast.error(msg);
    } finally {
      setMfaEmailLoading(false);
    }
  };

  const handlePasswordResetRequest = async (e) => {
    e.preventDefault();
    setLoginError("");

    if (!resetIdentifier.trim()) {
      setLoginError("Masukkan username atau email akun");
      return;
    }

    setResetLoading(true);
    try {
      const response = await authService.requestPasswordReset(
        resetIdentifier.trim(),
      );
      setResetToken(response.data.resetToken);
      setResetRecipient(response.data.recipient || "");
      setResetCode("");
      setResetNewPassword("");
      setResetConfirmPassword("");
      toast.success("Kode reset password dikirim ke email");
    } catch (err) {
      const msg =
        err.response?.data?.error || "Gagal mengirim kode reset password";
      setLoginError(msg);
      toast.error(msg);
    } finally {
      setResetLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");

    if (resetCode.length !== 6) {
      setLoginError("Masukkan 6 digit kode OTP");
      return;
    }
    if (resetNewPassword.length < 8) {
      setLoginError("Password baru minimal 8 karakter");
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setLoginError("Konfirmasi password tidak sama");
      return;
    }

    setResetLoading(true);
    try {
      await authService.resetPasswordWithOtp({
        resetToken,
        code: resetCode,
        newPassword: resetNewPassword,
      });
      toast.success("Password berhasil direset. Silakan login kembali.");
      setForgotPasswordMode(false);
      setResetIdentifier("");
      setResetToken("");
      setResetRecipient("");
      setResetCode("");
      setResetNewPassword("");
      setResetConfirmPassword("");
      setLoginPassword("");
    } catch (err) {
      const msg = err.response?.data?.error || "Gagal mereset password";
      setLoginError(msg);
      toast.error(msg);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-surface-secondary">
      <PublicNavbar
        links={navLinks}
        onLogin={() => setShowLoginPanel(true)}
      />

      {/* ==================== HERO ==================== */}
      <section className="relative overflow-hidden bg-linear-to-br from-emerald-100 via-white to-white dark:from-slate-950 dark:via-emerald-950 dark:to-teal-900">
        <div className="absolute inset-0 opacity-0 dark:opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZ2LTRoMnY0aC0yem0tNiA2aC0ydi00aDJ2NHptMC02di00aDJ2NGgtMnoiLz48L2c+PC9nPjwvc3ZnPg==')]" />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-emerald-800 backdrop-blur-sm dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100">
              <BuildingsIcon size={15} weight="fill" />
              Portal Informasi Aset Tanah Kota Pasuruan
            </div>
            <h2 className="max-w-3xl text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-6xl">
              Kenali aset kota,
              <span className="block text-emerald-600 dark:text-emerald-300">
                lokasi, dan pemanfaatannya.
              </span>
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">
              Bhumi Satya menyajikan inventaris aset tanah secara terpadu—mulai
              dari persebaran lokasi, karakteristik bidang, legalitas, hingga
              informasi pemanfaatan yang dapat diakses masyarakat.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/peta-publik")}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:bg-emerald-400 dark:text-emerald-950 dark:shadow-emerald-950/30 dark:hover:bg-emerald-300 dark:focus:ring-emerald-200 dark:focus:ring-offset-emerald-950"
              >
                <MapTrifoldIcon size={19} weight="fill" />
                Jelajahi Peta Aset
              </button>
              <button
                type="button"
                onClick={() => scrollTo(asetRef)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-sm transition hover:border-emerald-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:border-white/20 dark:bg-white/10 dark:text-white dark:shadow-none dark:hover:border-white/20 dark:hover:bg-white/15 dark:focus:ring-white/60 dark:focus:ring-offset-emerald-950"
              >
                <BuildingsIcon size={19} weight="duotone" />
                Lihat Katalog Aset
              </button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-2">
                <MapPinIcon size={15} weight="fill" className="text-sky-600 dark:text-sky-300" />
                Persebaran dan batas bidang
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheckIcon size={15} weight="fill" className="text-emerald-600 dark:text-emerald-300" />
                Informasi legalitas
              </span>
              <span className="inline-flex items-center gap-2">
                <StackIcon size={15} weight="fill" className="text-amber-600 dark:text-amber-300" />
                Data pemanfaatan aset
              </span>
            </div>
          </div>
          <aside className="rounded-3xl border border-emerald-100 bg-white/75 p-5 shadow-2xl shadow-emerald-950/10 backdrop-blur-xl dark:border-white/15 dark:bg-white/10 dark:shadow-slate-950/30 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">
                  Cakupan Data Publik
                </p>
                <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                  Ringkasan inventaris aset
                </h3>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-300/15 dark:text-emerald-200">
                <BuildingsIcon size={23} weight="duotone" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { label: "Total aset", value: assetOverview.total, icon: BuildingsIcon },
                { label: "Kecamatan", value: assetOverview.kecamatan, icon: MapPinIcon },
                { label: "Jenis aset", value: assetOverview.jenis, icon: StackIcon },
                { label: "Bersertifikat", value: assetOverview.certified, icon: ShieldCheckIcon },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-950/25"
                >
                  <stat.icon size={18} weight="duotone" className="text-emerald-600 dark:text-emerald-300" />
                  <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                    {stat.value || "—"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => scrollTo(petaRef)}
              className="mt-4 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-white hover:text-emerald-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:border-white/10 dark:hover:bg-white/10 dark:hover:text-slate-100"
            >
              Lihat persebaran aset
              <ArrowRightIcon size={16} weight="bold" />
            </button>
          </aside>
        </div>
      </section>

      {/* ==================== KATALOG ASET ==================== */}
      <section ref={asetRef} className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                Katalog Aset
              </p>
              <h3 className="mt-2 text-2xl font-bold text-text-primary md:text-3xl">
                Sorotan aset Kota Pasuruan
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
                Temukan informasi dasar aset yang tersebar di berbagai wilayah.
                Pilih salah satu aset untuk melihat posisinya pada peta.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/peta-publik")}
              className="inline-flex items-center gap-2 self-start rounded-xl border border-border bg-surface-secondary px-4 py-2.5 text-sm font-semibold text-text-primary transition hover:border-emerald-500/40 hover:text-emerald-700 dark:hover:text-emerald-300 sm:self-auto"
            >
              Lihat Semua di Peta
              <ArrowRightIcon size={15} weight="bold" />
            </button>
          </div>

          {assetOverview.featured.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assetOverview.featured.map((asset, index) => (
                <article
                  key={asset.id || asset.id_aset || `${asset.nama_aset}-${index}`}
                  className="group overflow-hidden rounded-2xl border border-border bg-surface-secondary transition hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between border-b border-border bg-linear-to-r from-emerald-500/10 to-sky-500/10 px-5 py-4">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      <BuildingsIcon size={16} weight="duotone" />
                      {asset.jenis_aset || "Aset Tanah"}
                    </span>
                    {asset.status && (
                      <span className="rounded-full bg-surface px-2.5 py-1 text-[10px] font-bold text-text-muted shadow-sm">
                        {asset.status}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h4 className="line-clamp-2 min-h-12 text-base font-bold leading-snug text-text-primary">
                      {asset.nama_aset || "Aset Tanah Kota Pasuruan"}
                    </h4>
                    <p className="mt-3 flex min-h-10 items-start gap-2 text-xs leading-relaxed text-text-secondary">
                      <MapPinIcon size={15} weight="fill" className="mt-0.5 shrink-0 text-emerald-500" />
                      <span className="line-clamp-2">
                        {asset.lokasi || asset.kecamatan || "Kota Pasuruan"}
                      </span>
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                      <span className="text-xs font-medium text-text-muted">
                        {Number(asset.luas) > 0
                          ? `${Number(asset.luas).toLocaleString("id-ID")} m²`
                          : "Luas belum tersedia"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setFocusedAsset(asset);
                          scrollTo(petaRef);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 transition group-hover:gap-2 dark:text-emerald-300"
                      >
                        Lihat di peta
                        <ArrowRightIcon size={13} weight="bold" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-surface-secondary px-6 py-12 text-center">
              <BuildingsIcon size={36} weight="duotone" className="mx-auto text-text-muted" />
              <p className="mt-3 text-sm font-semibold text-text-primary">
                Data aset sedang disiapkan
              </p>
              <p className="mt-1 text-xs text-text-muted">
                Katalog akan tampil setelah data publik tersedia.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ==================== PETA SECTION ==================== */}
      <section
        ref={petaRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
            <MapTrifoldIcon
              size={20}
              weight="fill"
              className="text-blue-600 dark:text-blue-400"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-text-primary">
              Peta Lokasi Aset
            </h3>
            <p className="text-sm text-text-muted">
              Lokasi seluruh aset tanah Kota Pasuruan
            </p>
          </div>
          <div className="relative w-64 hidden sm:block">
            <MagnifyingGlassIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              placeholder="Cari lokasi di peta..."
              value={mapSearch}
              onChange={(e) => setMapSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
            />
            {mapSearch && (
              <button
                onClick={() => setMapSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              >
                <XIcon size={14} weight="bold" />
              </button>
            )}
          </div>
        </div>
        {/* Mobile search */}
        <div className="sm:hidden mb-4">
          <div className="relative">
            <MagnifyingGlassIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              placeholder="Cari lokasi di peta..."
              value={mapSearch}
              onChange={(e) => setMapSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
            />
            {mapSearch && (
              <button
                onClick={() => setMapSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              >
                <XIcon size={14} weight="bold" />
              </button>
            )}
          </div>
        </div>
        {mapSearch && (
          <div className="mb-3 space-y-1.5">
            <p className="text-xs text-text-muted">
              {filteredMapAssets.length} hasil ditemukan
            </p>
            {filteredMapAssets.length > 0 && (
              <div className="bg-surface-secondary rounded-xl border border-border max-h-48 overflow-y-auto divide-y divide-border">
                {filteredMapAssets.slice(0, 20).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setFocusedAsset(a);
                      setMapSearch("");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-tertiary transition-colors text-left"
                  >
                    <MapPinIcon
                      size={14}
                      weight="fill"
                      className="text-emerald-500 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {a.nama_aset}
                      </p>
                      {a.lokasi && (
                        <p className="text-[11px] text-text-muted truncate">
                          {a.lokasi}
                        </p>
                      )}
                    </div>
                    <ArrowRightIcon
                      size={14}
                      weight="bold"
                      className="text-text-muted shrink-0"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => navigate("/peta-publik")}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-text-secondary transition-colors hover:border-blue-500/40 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
          >
            <MapTrifoldIcon size={16} weight="bold" />
            Buka Peta Layar Penuh
            <ArrowRightIcon size={14} weight="bold" />
          </button>
        </div>
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="relative h-[34rem] md:h-[42rem] lg:h-[48rem]">
            <AssetMapDisplay
              assets={mapAssets}
              allAssets={mapAssets}
              mode="integrated"
              highlightAssetId={focusedAsset?.id || null}
              highlightRequestKey={focusedAsset ? `landing-${focusedAsset.id}` : null}
              showControls={false}
              activeLayer="bidang"
              showMarkers={showMapMarkers}
              setShowMarkers={setShowMapMarkers}
              showPolygons={showMapPolygons}
              setShowPolygons={setShowMapPolygons}
              showKelurahan
              showKecamatan
              showSudahSertifikat
              showBelumSertifikat
            />
            <div className="pointer-events-none absolute bottom-4 left-4 z-20">
              <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-slate-950/75 px-3 py-2.5 text-white shadow-xl backdrop-blur-xl">
                <span className="flex items-center gap-1.5 text-[10px] font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                  Bersertifikat
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  Tidak bersertifikat
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SEWA ASET SECTION ==================== */}
      <section
        ref={sewaRef}
        className="bg-surface border-t border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
              <HandshakeIcon
                size={20}
                weight="fill"
                className="text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                Aset Tersedia untuk Disewa
              </h3>
              <p className="text-sm text-text-muted">
                {loading ? "Memuat..." : `${items.length} aset tersedia`}
              </p>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="bg-surface-secondary rounded-xl border border-border p-4 flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <MagnifyingGlassIcon
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                placeholder="Cari nama atau lokasi aset..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
              />
            </div>
            <div className="relative sm:w-44">
              <FunnelIcon
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <select
                value={kecamatan}
                onChange={(e) => setKecamatan(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
              >
                <option value="">Semua Kecamatan</option>
                {filterOptions.kecamatan.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative sm:w-44">
              <TagIcon
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <select
                value={jenisAset}
                onChange={(e) => setJenisAset(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
              >
                <option value="">Semua Jenis</option>
                {filterOptions.jenis.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-surface rounded-xl border border-border overflow-hidden animate-pulse h-full flex flex-col"
                >
                  <div className="h-44 sm:h-48 bg-gray-200 dark:bg-gray-700 shrink-0" />
                  <div className="p-4 flex flex-col flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-4" />
                    <div className="space-y-2 mt-3 min-h-16">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mt-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <StorefrontIcon
                size={48}
                weight="light"
                className="mx-auto text-text-muted mb-4"
              />
              <h4 className="text-lg font-semibold text-text-primary mb-2">
                Belum Ada Aset Tersedia
              </h4>
              <p className="text-sm text-text-muted max-w-md mx-auto">
                {search || kecamatan || jenisAset
                  ? "Tidak ditemukan aset yang sesuai filter."
                  : "Saat ini belum ada aset yang tersedia untuk disewakan."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {items.map((item) => (
                <AssetCard
                  key={item.id_sewa}
                  item={item}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ==================== REQUEST CTA ==================== */}
      <section
        ref={kontakRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14"
      >
        <div className="text-center mb-10">
          <h3 className="text-2xl font-bold text-text-primary mb-2">
            Ajukan Permintaan Sewa
          </h3>
          <p className="text-text-secondary text-sm max-w-lg mx-auto">
            Pengajuan sewa dilakukan melalui akun masyarakat agar status
            permintaan dan dokumen balasan pengelola aset bisa dipantau dengan aman.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
          <div className="lg:col-span-3">
            <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8">
              <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-5">
                <ShieldCheckIcon size={24} weight="fill" />
              </div>
              <h4 className="text-xl font-bold text-text-primary mb-2">
                Masuk untuk Mengajukan Sewa
              </h4>
              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                Pengajuan sewa hanya dapat dikirim melalui akun masyarakat.
                Setelah masuk, identitas pemohon akan terisi otomatis dan Anda
                dapat memantau status pada menu Sewa yang Diajukan.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowLoginPanel(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-surface transition hover:opacity-90"
                >
                  <SignInIcon size={18} weight="bold" />
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/masyarakat/login?mode=register")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-secondary px-4 py-3 text-sm font-semibold text-text-primary transition hover:border-accent/40 hover:text-accent"
                >
                  <UserIcon size={18} weight="bold" />
                  Daftar Akun
                </button>
              </div>

              <div className="mt-6 grid gap-3 text-sm text-text-secondary">
                <div className="flex items-start gap-2">
                  <CheckCircleIcon
                    size={16}
                    weight="fill"
                    className="mt-0.5 shrink-0 text-emerald-500"
                  />
                  <span>Status pengajuan tersimpan di akun masyarakat.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircleIcon
                    size={16}
                    weight="fill"
                    className="mt-0.5 shrink-0 text-emerald-500"
                  />
                  <span>Dokumen balasan diterima oleh akun pemohon.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircleIcon
                    size={16}
                    weight="fill"
                    className="mt-0.5 shrink-0 text-emerald-500"
                  />
                  <span>Data identitas pemohon tidak perlu diketik ulang.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-surface rounded-2xl border border-border p-6">
              <h4 className="font-bold text-text-primary text-sm mb-4">
                Kontak Pengelola Aset Kota Pasuruan
              </h4>
              <div className="space-y-4">
                <a
                  href="https://wa.me/-"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <WhatsappLogoIcon
                      size={20}
                      weight="fill"
                      className="text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      WhatsApp
                    </p>
                    <p className="text-xs text-text-muted">-</p>
                  </div>
                </a>

                <a
                  href="tel:+623435421111"
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <PhoneIcon
                      size={20}
                      weight="fill"
                      className="text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Telepon
                    </p>
                    <p className="text-xs text-text-muted">-</p>
                  </div>
                </a>

                <a
                  href="mailto:bpkad@pasuruankota.go.id"
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <EnvelopeSimpleIcon
                      size={20}
                      weight="fill"
                      className="text-purple-600 dark:text-purple-400"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Email
                    </p>
                    <p className="text-xs text-text-muted">-</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="bg-surface rounded-2xl border border-border p-6">
              <h4 className="font-bold text-text-primary text-sm mb-3">
                Alamat Kantor
              </h4>
              <div className="flex items-start gap-2.5">
                <MapPinIcon
                  size={18}
                  weight="fill"
                  className="text-red-500 mt-0.5 shrink-0"
                />
                <p className="text-sm text-text-secondary leading-relaxed">
                  Jl. Pahlawan No. 20, Kota Pasuruan, Jawa Timur 67126
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-accent dark:bg-surface border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BrandMark className="h-6 w-6 rounded-md text-[8px]" />
            <span className="text-xs text-surface/70 dark:text-text-muted">
              Bhumi Satya
            </span>
          </div>
          <span className="text-xs text-surface/50 dark:text-text-muted">
            Sistem Manajemen Aset Tanah
          </span>
        </div>
      </footer>

      {/* ==================== LOGIN SIDE PANEL ==================== */}
      <div
        className={`fixed top-0 right-0 h-full z-50 transition-all duration-500 ease-out ${
          showLoginPanel
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            showLoginPanel ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => {
            setShowLoginPanel(false);
            setMfaStep(false);
            setMfaToken("");
            setOtpType("authenticator");
            setOtpRecipient("");
            setOtpCode("");
            setLoginError("");
          }}
        />

        {/* Panel */}
        <div className="relative h-full w-screen sm:w-96 md:w-104 bg-surface dark:bg-gray-900 flex flex-col shadow-2xl max-h-screen overflow-hidden border-l border-border ml-auto">
          {/* Close button */}
          <button
            onClick={() => {
              setShowLoginPanel(false);
              setMfaStep(false);
              setMfaToken("");
              setOtpType("authenticator");
              setOtpRecipient("");
              setOtpCode("");
              setLoginError("");
            }}
            className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-surface-secondary border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors z-10"
          >
            <XIcon size={18} weight="bold" />
          </button>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Header */}
            <div className="px-6 md:px-8 pt-8 pb-6 text-center">
              <BrandMark className="mx-auto mb-4 h-16 w-16 text-lg shadow-xl" />
              <h2 className="text-text-primary font-bold text-xl tracking-tight">
                Bhumi Satya
              </h2>
              <p className="text-text-muted text-sm mt-1.5">
                Masuk ke akun Anda untuk melanjutkan
              </p>
            </div>

            {/* Form */}
            <div className="px-6 md:px-8 pb-6">
              {loginError && (
                <div className="mb-5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl p-3.5 flex items-start gap-3">
                  <div className="w-5 h-5 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <WarningCircleIcon
                      size={12}
                      weight="fill"
                      className="text-red-600 dark:text-red-400"
                    />
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {loginError}
                  </p>
                </div>
              )}

              {mfaStep ? (
                <form onSubmit={handleMfaVerify} className="space-y-5">
                  <div className="text-center mb-2">
                    <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl mx-auto flex items-center justify-center mb-3">
                      <ShieldCheckIcon
                        size={28}
                        weight="duotone"
                        className="text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                    <h3 className="text-text-primary font-bold text-base">
                      Verifikasi Dua Langkah
                    </h3>
                    <p className="text-text-muted text-xs mt-1">
                      {otpType === "authenticator"
                        ? "Masukkan kode 6 digit dari aplikasi authenticator Anda"
                        : `Masukkan kode 6 digit yang dikirim ke ${
                            otpType === "whatsapp" ? "WhatsApp" : "email"
                          }${otpRecipient ? ` ${otpRecipient}` : ""}`}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
                      <ShieldCheckIcon size={12} weight="bold" />
                      Kode OTP
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoComplete="one-time-code"
                      value={otpCode}
                      onChange={(e) =>
                        setOtpCode(
                          e.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                      disabled={loginLoading}
                      placeholder="000000"
                      className="w-full h-14 px-4 text-center text-2xl font-mono tracking-[0.5em] bg-surface-secondary border border-border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-text-primary placeholder:text-text-muted disabled:opacity-50"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loginLoading || otpCode.length !== 6}
                    className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loginLoading ? (
                      <>
                        <CircleNotchIcon
                          size={18}
                          weight="bold"
                          className="animate-spin"
                        />
                        Memverifikasi...
                      </>
                    ) : (
                      <>
                        <ShieldCheckIcon size={18} weight="bold" />
                        Verifikasi
                      </>
                    )}
                  </button>
                  {otpType === "authenticator" && (
                    <button
                      type="button"
                      onClick={handleRequestMfaEmailOtp}
                      disabled={loginLoading || mfaEmailLoading}
                      className="w-full h-11 text-sm text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 font-semibold transition-colors flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {mfaEmailLoading ? (
                        <CircleNotchIcon
                          size={16}
                          weight="bold"
                          className="animate-spin"
                        />
                      ) : (
                        <EnvelopeSimpleIcon size={16} weight="bold" />
                      )}
                      {mfaEmailLoading
                        ? "Mengirim OTP..."
                        : "Tidak punya akses? Kirim OTP email"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMfaStep(false);
                      setMfaToken("");
                      setOtpType("authenticator");
                      setOtpRecipient("");
                      setOtpCode("");
                      setMfaEmailLoading(false);
                      setLoginError("");
                    }}
                    className="w-full h-11 text-sm text-text-muted hover:text-text-primary font-medium transition-colors flex items-center justify-center gap-2 bg-surface-secondary hover:bg-surface-secondary/80 rounded-xl border border-border"
                  >
                    <ArrowLeftIcon size={16} weight="bold" />
                    Kembali ke Login
                  </button>
                </form>
              ) : forgotPasswordMode ? (
                <form
                  onSubmit={
                    resetToken
                      ? handlePasswordResetSubmit
                      : handlePasswordResetRequest
                  }
                  className="space-y-5"
                >
                  <div className="text-center mb-2">
                    <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl mx-auto flex items-center justify-center mb-3">
                      <EnvelopeSimpleIcon
                        size={28}
                        weight="duotone"
                        className="text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                    <h3 className="text-text-primary font-bold text-base">
                      Lupa Kata Sandi
                    </h3>
                    <p className="text-text-muted text-xs mt-1">
                      {resetToken
                        ? `Masukkan kode yang dikirim ke email${resetRecipient ? ` ${resetRecipient}` : ""}.`
                        : "Masukkan username atau email untuk menerima kode reset."}
                    </p>
                  </div>

                  {!resetToken ? (
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
                        <UserIcon size={12} weight="bold" />
                        Username atau Email
                      </label>
                      <input
                        type="text"
                        value={resetIdentifier}
                        onChange={(e) => setResetIdentifier(e.target.value)}
                        disabled={resetLoading}
                        placeholder="Masukkan username atau email"
                        className="w-full h-12 px-4 text-sm bg-surface-secondary border border-border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-text-primary placeholder:text-text-muted disabled:opacity-50"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
                          <ShieldCheckIcon size={12} weight="bold" />
                          Kode OTP
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={resetCode}
                          onChange={(e) =>
                            setResetCode(
                              e.target.value.replace(/\D/g, "").slice(0, 6),
                            )
                          }
                          disabled={resetLoading}
                          placeholder="000000"
                          className="w-full h-12 px-4 text-center text-xl font-mono tracking-[0.35em] bg-surface-secondary border border-border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-text-primary placeholder:text-text-muted disabled:opacity-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
                          <LockIcon size={12} weight="bold" />
                          Password Baru
                        </label>
                        <input
                          type="password"
                          value={resetNewPassword}
                          onChange={(e) => setResetNewPassword(e.target.value)}
                          disabled={resetLoading}
                          placeholder="Minimal 8 karakter"
                          className="w-full h-12 px-4 text-sm bg-surface-secondary border border-border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-text-primary placeholder:text-text-muted disabled:opacity-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
                          <LockIcon size={12} weight="bold" />
                          Konfirmasi Password
                        </label>
                        <input
                          type="password"
                          value={resetConfirmPassword}
                          onChange={(e) =>
                            setResetConfirmPassword(e.target.value)
                          }
                          disabled={resetLoading}
                          placeholder="Ulangi password baru"
                          className="w-full h-12 px-4 text-sm bg-surface-secondary border border-border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-text-primary placeholder:text-text-muted disabled:opacity-50"
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {resetLoading ? (
                      <>
                        <CircleNotchIcon
                          size={18}
                          weight="bold"
                          className="animate-spin"
                        />
                        Memproses...
                      </>
                    ) : resetToken ? (
                      "Reset Password"
                    ) : (
                      "Kirim Kode Reset"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordMode(false);
                      setResetToken("");
                      setResetCode("");
                      setResetNewPassword("");
                      setResetConfirmPassword("");
                      setLoginError("");
                    }}
                    className="w-full h-11 text-sm text-text-muted hover:text-text-primary font-medium transition-colors flex items-center justify-center gap-2 bg-surface-secondary hover:bg-surface-secondary/80 rounded-xl border border-border"
                  >
                    <ArrowLeftIcon size={16} weight="bold" />
                    Kembali ke Login
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
                      <UserIcon size={12} weight="bold" />
                      Username
                    </label>
                    <input
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      disabled={loginLoading}
                      placeholder="Masukkan username"
                      className="w-full h-12 px-4 text-sm bg-surface-secondary border border-border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-text-primary placeholder:text-text-muted disabled:opacity-50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
                        <LockIcon size={12} weight="bold" />
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotPasswordMode(true);
                          setResetIdentifier(loginUsername);
                          setLoginError("");
                        }}
                        className="text-xs text-text-muted hover:text-text-primary transition-colors"
                      >
                        Lupa password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        disabled={loginLoading}
                        placeholder="Masukkan password"
                        className="w-full h-12 pl-4 pr-12 text-sm bg-surface-secondary border border-border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-text-primary placeholder:text-text-muted disabled:opacity-50"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-surface-secondary"
                      >
                        {showPassword ? (
                          <EyeSlashIcon size={18} />
                        ) : (
                          <EyeIcon size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loginLoading ? (
                      <>
                        <CircleNotchIcon
                          size={18}
                          weight="bold"
                          className="animate-spin"
                        />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <SignInIcon size={18} weight="bold" />
                        Masuk
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 px-6 md:px-8 py-4 border-t border-border bg-surface-secondary/50">
            <p className="text-center text-text-muted text-[10px]">
              Bhumi Satya
            </p>
          </div>
        </div>
      </div>

      {/* ==================== DETAIL MODAL ==================== */}
      {selectedItem && (
        <AssetDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onApply={handleApply}
        />
      )}

      {/* ==================== CHATBOT ==================== */}
      <ChatbotButton onClick={() => setChatbotOpen(true)} />
      {chatbotOpen && (
        <ChatbotModal
          isOpen={chatbotOpen}
          onClose={() => setChatbotOpen(false)}
        />
      )}
    </div>
  );
}
