import { Suspense, useState, useEffect, useMemo, useRef } from "react";
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
import { formatDate, formatNumber } from "../utils/format";
import { normalizeMapMarkers } from "../utils/mapAssets";
import {
  searchMapRecords,
  splitMapSearchHighlight,
} from "../utils/mapSearch";
import ChatbotButton from "../components/chatbot/ChatbotButton";
import ChatbotModal from "../components/chatbot/ChatbotModal";
import { normalizeRole } from "../utils/permissions";
import {
  PUBLIC_REGISTRATION_ENABLED,
  RENTAL_FEATURE_ENABLED,
} from "../config/featureFlags";
import BrandMark from "../components/shared/BrandMark";
import { lazyWithRetry } from "../utils/lazyWithRetry";

const AssetMapDisplay = lazyWithRetry(
  () => import("../components/map/AssetMapDisplay"),
);
const AssetDetailPanel = lazyWithRetry(
  () => import("../components/map/shared/AssetDetailPanel"),
);
const SewaPolygonMap = lazyWithRetry(
  () => import("../components/sewa/SewaPolygonMap"),
);

function MapLoadingState({ deferred = false }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-surface-secondary/70 px-6 text-center">
      <div>
        <CircleNotchIcon
          size={25}
          weight="bold"
          className="mx-auto animate-spin text-accent"
        />
        <p className="mt-3 text-sm font-semibold text-text-secondary">
          {deferred ? "Peta dimuat saat diperlukan" : "Menyiapkan Digital Twin"}
        </p>
        <p className="mt-1 text-xs text-text-muted">
          {deferred
            ? "Gulir sedikit lagi untuk membuka peta interaktif."
            : "Mohon tunggu sebentar."}
        </p>
      </div>
    </div>
  );
}

function MapSearchHighlight({ text, query }) {
  return splitMapSearchHighlight(text, query).map((segment, index) =>
    segment.highlighted ? (
      <mark
        key={`${segment.text}-${index}`}
        className="rounded-sm bg-amber-300/80 px-0.5 text-slate-950"
      >
        {segment.text}
      </mark>
    ) : (
      <span key={`${segment.text}-${index}`}>{segment.text}</span>
    ));
}

const initialRegisterForm = {
  nama_lengkap: "",
  username: "",
  email: "",
  no_telepon: "",
  nik: "",
  alamat: "",
  password: "",
};

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
  const luas = aset.luas ? formatNumber(Number(aset.luas)) : null;
  const polygonData = item.polygon_sewa || aset.polygon_bidang;
  const luasPolygon = polygonData?.properties?.luas
    ? formatNumber(Number(polygonData.properties.luas))
    : null;

  return (
    <div
      className="motion-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
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
                <Suspense
                  fallback={
                    <div className="grid h-60 place-items-center bg-surface-secondary text-xs font-semibold text-text-muted">
                      Menyiapkan peta lokasi…
                    </div>
                  }
                >
                  <SewaPolygonMap
                    polygon={polygonData}
                    height={240}
                    showHeader={false}
                  />
                </Suspense>
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
                {formatNumber(
                  Number(aset.luas || item.polygon_sewa?.properties?.luas),
                )}{" "}
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
function AuthPanelField({
  label,
  value,
  onChange,
  icon: Icon = UserIcon,
  type = "text",
  autoComplete,
  inputMode,
  maxLength,
  minLength,
  placeholder,
  required = false,
  disabled = false,
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
        <Icon size={12} weight="bold" />
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        minLength={minLength}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="h-12 w-full rounded-xl border border-border bg-surface-secondary px-4 text-sm text-text-primary transition-all placeholder:text-text-muted focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50"
      />
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setToken } = useAuthStore();
  const startSession = useSessionStore((s) => s.startSession);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  // Sections refs
  const petaRef = useRef(null);
  const sewaRef = useRef(null);
  const kontakRef = useRef(null);

  // Sewa data
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  // Map data
  const [mapAssets, setMapAssets] = useState([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapSearch, setMapSearch] = useState("");
  const [focusedAsset, setFocusedAsset] = useState(null);
  const [focusedModel, setFocusedModel] = useState(null);
  const [selectedMapAsset, setSelectedMapAsset] = useState(null);
  const [isLandingMap3d, setIsLandingMap3d] = useState(false);
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  const [showMapMarkers, setShowMapMarkers] = useState(false);
  const [showMapPolygons, setShowMapPolygons] = useState(true);

  // Login panel state
  const [showLoginPanel, setShowLoginPanel] = useState(
    location.state?.openLoginPanel === true,
  );
  const [authMode, setAuthMode] = useState(
    PUBLIC_REGISTRATION_ENABLED &&
      new URLSearchParams(location.search).get("mode") === "register"
      ? "register"
      : "login",
  );
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [registerLoading, setRegisterLoading] = useState(false);
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

  useEffect(() => {
    if (
      location.state?.openLoginPanel === true ||
      location.pathname === "/login"
    ) {
      const requestedMode =
        location.state?.authMode ||
        new URLSearchParams(location.search).get("mode");
      setShowLoginPanel(true);
      setAuthMode(
        PUBLIC_REGISTRATION_ENABLED && requestedMode === "register"
          ? "register"
          : "login",
      );
    }
  }, [
    location.key,
    location.pathname,
    location.search,
    location.state?.authMode,
    location.state?.openLoginPanel,
  ]);

  useEffect(() => {
    const mapSection = petaRef.current;
    if (!mapSection || !("IntersectionObserver" in window)) {
      setShouldLoadMap(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldLoadMap(true);
        observer.disconnect();
      },
      { rootMargin: "500px 0px" },
    );

    observer.observe(mapSection);
    return () => observer.disconnect();
  }, []);

  // Fetch map markers
  useEffect(() => {
    petaService
      .getPublicMarkers()
      .then((res) => setMapAssets(normalizeMapMarkers(res.data.data || [])))
      .catch(() => setMapAssets([]))
      .finally(() => setMapLoading(false));
  }, []);

  // Fetch available sewa
  useEffect(() => {
    if (!RENTAL_FEATURE_ENABLED) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    sewaService
      .getPublicAvailable()
      .then((res) => setItems(res.data.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredMapAssets = useMemo(() => {
    if (!mapSearch.trim()) return [];
    return searchMapRecords(mapAssets, mapSearch);
  }, [mapAssets, mapSearch]);

  const publicStats = useMemo(() => {
    const parcelCodes = new Set(
      mapAssets.map((asset) => asset.kode_2d).filter(Boolean),
    );
    const buildingCodes = new Set(
      mapAssets.flatMap((asset) => asset.kode_3d_list || []).filter(Boolean),
    );
    const buildingCount = buildingCodes.size || mapAssets.reduce(
      (total, asset) => total + (Number(asset.building_count_3d) || 0),
      0,
    );
    const districts = new Set(
      mapAssets
        .map((asset) => String(asset.kecamatan || "").trim())
        .filter(Boolean),
    );

    return {
      parcels: parcelCodes.size,
      buildings: buildingCount,
      districts: districts.size,
    };
  }, [mapAssets]);

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  const openAuthPanel = (mode = "login") => {
    setAuthMode(PUBLIC_REGISTRATION_ENABLED ? mode : "login");
    setForgotPasswordMode(false);
    setMfaStep(false);
    setLoginError("");
    setShowLoginPanel(true);
  };

  const handleApply = () => openAuthPanel("login");

  const getHomePath = (role) =>
    RENTAL_FEATURE_ENABLED && normalizeRole(role) === "masyarakat"
      ? "/sewa/aset-tersedia"
      : "/dashboard";

  const isDisabledMasyarakatAccount = (role) =>
    !RENTAL_FEATURE_ENABLED && normalizeRole(role) === "masyarakat";

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
      if (isDisabledMasyarakatAccount(response.data.user?.role)) {
        const message = "Portal masyarakat sedang tidak digunakan.";
        setLoginError(message);
        toast.error(message);
        return;
      }
      setToken(response.data.token);
      setUser(response.data.user);
      startSession(response.data.sessionDuration);
      toast.success("Login berhasil!");
      navigate(getHomePath(response.data.user?.role));
    } catch (err) {
      const msg = err.response?.data?.error || "Login gagal";
      setLoginError(msg);
      toast.error(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoginError("");
    setRegisterLoading(true);

    try {
      await authService.register(registerForm);
      setLoginUsername(registerForm.username);
      setLoginPassword(registerForm.password);
      setRegisterForm(initialRegisterForm);
      setAuthMode("login");
      toast.success("Registrasi berhasil. Silakan masuk.");
    } catch (err) {
      const msg = err.response?.data?.error || "Registrasi gagal";
      setLoginError(msg);
      toast.error(msg);
    } finally {
      setRegisterLoading(false);
    }
  };

  const updateRegisterForm = (field, value) => {
    setRegisterForm((current) => ({ ...current, [field]: value }));
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
      if (isDisabledMasyarakatAccount(response.data.user?.role)) {
        const message = "Portal masyarakat sedang tidak digunakan.";
        setLoginError(message);
        toast.error(message);
        return;
      }
      setToken(response.data.token);
      setUser(response.data.user);
      startSession(response.data.sessionDuration);
      toast.success("Login berhasil!");
      navigate(getHomePath(response.data.user?.role));
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
    <div className="min-h-[calc(100vh-4rem)] bg-surface-secondary">
      {/* ==================== HERO ==================== */}
      <section className="relative overflow-hidden bg-linear-to-br from-emerald-100 via-white to-white dark:from-slate-950 dark:via-emerald-950 dark:to-teal-900">
        <div className="absolute inset-0 opacity-0 dark:opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZ2LTRoMnY0aC0yem0tNiA2aC0ydi00aDJ2NHptMC02di00aDJ2NGgtMnoiLz48L2c+PC9nPjwvc3ZnPg==')]" />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-emerald-800 backdrop-blur-sm dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100">
              <BuildingsIcon size={15} weight="fill" />
              Platform Digital Twin
            </div>
            <h2 className="max-w-3xl text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-6xl">
              Jelajahi ruang secara digital.
              <span className="block text-emerald-600 dark:text-emerald-300">
                Kelola pemanfaatannya lebih mudah.
              </span>
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">
              Bhumi Satya menghadirkan Digital Twin dalam mode 2D dan 3D untuk
              memahami kondisi ruang, lokasi aset, dan informasi pertanahan
              secara terpadu.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/peta-publik")}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:bg-emerald-400 dark:text-emerald-950 dark:shadow-emerald-950/30 dark:hover:bg-emerald-300 dark:focus:ring-emerald-200 dark:focus:ring-offset-emerald-950"
              >
                <MapTrifoldIcon size={19} weight="fill" />
                Jelajahi Digital Twin
              </button>
              {RENTAL_FEATURE_ENABLED && (
                <button
                  type="button"
                  onClick={() => scrollTo(sewaRef)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/70 px-5 py-3 text-sm font-bold text-slate-700 backdrop-blur-sm transition hover:border-emerald-300 hover:bg-white hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:border-emerald-300/40 dark:hover:bg-white/15 dark:hover:text-emerald-100 dark:focus:ring-emerald-200 dark:focus:ring-offset-emerald-950"
                >
                  <StorefrontIcon size={19} weight="duotone" />
                  Lihat Penyewaan
                </button>
              )}
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-2">
                <MapPinIcon
                  size={15}
                  weight="fill"
                  className="text-sky-600 dark:text-sky-300"
                />
                Digital Twin
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheckIcon
                  size={15}
                  weight="fill"
                  className="text-emerald-600 dark:text-emerald-300"
                />
                Data ruang terhubung
              </span>
              {RENTAL_FEATURE_ENABLED && (
                <span className="inline-flex items-center gap-2">
                  <StackIcon
                    size={15}
                    weight="fill"
                    className="text-amber-600 dark:text-amber-300"
                  />
                  Penyewaan dalam satu alur
                </span>
              )}
            </div>
          </div>
          <aside className="rounded-3xl border border-emerald-100 bg-white/75 p-5 shadow-2xl shadow-emerald-950/10 backdrop-blur-xl dark:border-white/15 dark:bg-white/10 dark:shadow-slate-950/30 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">
                  Satu Platform Terintegrasi
                </p>
                <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                  Digital Twin pertanahan terpadu
                </h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Pahami kondisi ruang, bidang tanah, dan bangunan secara visual
                  melalui data 2D dan 3D yang saling terhubung.
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-300/15 dark:text-emerald-200">
                <BuildingsIcon size={23} weight="duotone" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                {
                  label: "Bidang 2D",
                  value: mapLoading ? "—" : formatNumber(publicStats.parcels),
                  description: "Bidang terpetakan",
                  icon: MapTrifoldIcon,
                },
                {
                  label: "Bangunan 3D",
                  value: mapLoading ? "—" : formatNumber(publicStats.buildings),
                  description: "Bangunan tervisualisasi",
                  icon: BuildingsIcon,
                },
                ...(RENTAL_FEATURE_ENABLED
                  ? [
                      {
                  label: "Tersedia Disewa",
                  value: loading ? "—" : formatNumber(items.length),
                  description: "Objek ditawarkan",
                  icon: StorefrontIcon,
                },
                {
                  label: "Kecamatan",
                  value: mapLoading ? "—" : formatNumber(publicStats.districts),
                  description: "Wilayah tercakup",
                  icon: MapPinIcon,
                      },
                    ]
                  : []),
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-950/25"
                >
                  <stat.icon
                    size={18}
                    weight="duotone"
                    className="text-emerald-600 dark:text-emerald-300"
                  />
                  <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {stat.description}
                  </p>
                </div>
              ))}
            </div>
            <div
              className={`mt-4 grid gap-3 ${
                RENTAL_FEATURE_ENABLED ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              <button
                type="button"
                onClick={() => navigate("/peta-publik")}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-white hover:text-emerald-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:border-emerald-300/30 dark:hover:bg-white/10 dark:hover:text-emerald-100"
              >
                Digital Twin
                <ArrowRightIcon size={16} weight="bold" />
              </button>
              {RENTAL_FEATURE_ENABLED && (
              <button
                type="button"
                onClick={() => scrollTo(sewaRef)}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-white hover:text-emerald-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:border-emerald-300/30 dark:hover:bg-white/10 dark:hover:text-emerald-100"
              >
                Penyewaan
                <ArrowRightIcon size={16} weight="bold" />
              </button>
              )}
            </div>
          </aside>
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
              Digital Twin
            </h3>
            <p className="text-sm text-text-muted">
              Eksplorasi data ruang dalam konteks lokasi yang saling terhubung
            </p>
          </div>
          <div className="relative w-64 hidden sm:block">
            <MagnifyingGlassIcon
              size={16}
              weight="bold"
              aria-hidden="true"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-sky-600 dark:text-cyan-300"
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
              weight="bold"
              aria-hidden="true"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-sky-600 dark:text-cyan-300"
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
                {filteredMapAssets.slice(0, 20).map(({ record: a, matches }) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setFocusedAsset(a);
                      const matchingModel = searchMapRecords(
                        a.active_models_3d || (a.active_model_3d ? [a.active_model_3d] : []),
                        mapSearch,
                      )[0]?.record || a.active_model_3d || a.active_models_3d?.[0] || null;
                      setFocusedModel(matchingModel ? {
                        assetId: a.id_aset || a.id,
                        modelId: matchingModel.id_model_3d,
                        kode3d: matchingModel.kode_3d,
                      } : null);
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
                        <MapSearchHighlight
                          text={a.nama_aset || "Aset tanpa nama"}
                          query={mapSearch}
                        />
                      </p>
                      {a.lokasi && (
                        <p className="text-[11px] text-text-muted truncate">
                          <MapSearchHighlight text={a.lokasi} query={mapSearch} />
                        </p>
                      )}
                      {matches[0] && (
                        <p className="mt-0.5 truncate text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                          {matches[0].label}:{" "}
                          <MapSearchHighlight text={matches[0].value} query={mapSearch} />
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
            Buka Digital Twin
            <ArrowRightIcon size={14} weight="bold" />
          </button>
        </div>
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="relative h-[34rem] md:h-[42rem] lg:h-[48rem]">
            {shouldLoadMap ? (
              <Suspense fallback={<MapLoadingState />}>
                <AssetMapDisplay
                  assets={mapAssets}
                  allAssets={mapAssets}
                  mode="integrated"
                  highlightAssetId={focusedAsset?.id || null}
                  highlightRequestKey={
                    focusedAsset ? `landing-${focusedAsset.id}` : null
                  }
                  focus3dTarget={isLandingMap3d ? focusedModel : null}
                  focus3dRequestKey={focusedModel
                    ? `landing-model-${focusedModel.modelId || focusedModel.kode3d}`
                    : null}
                  onAsset3dModeChange={setIsLandingMap3d}
                  onFeatureClick={setSelectedMapAsset}
                  onOtherLayerClick={() => setSelectedMapAsset(null)}
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
                  popupSectionScope="general"
                />
                {selectedMapAsset && (
                  <AssetDetailPanel
                    key={selectedMapAsset.id_aset || selectedMapAsset.id}
                    asset={selectedMapAsset}
                    onClose={() => setSelectedMapAsset(null)}
                    showModel3d={isLandingMap3d}
                    visibleSectionIds={["general", "model3d", "land"]}
                  />
                )}
              </Suspense>
            ) : (
              <MapLoadingState deferred />
            )}
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
      {RENTAL_FEATURE_ENABLED && (
        <section
        ref={sewaRef}
        className="bg-surface border-t border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                Layanan Penyewaan
              </p>
              <h3 className="mt-2 text-2xl font-bold text-text-primary md:text-3xl">
                Pilihan ruang yang tersedia untuk disewa
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
                Temukan objek yang tersedia, pelajari detail ruangnya, lalu
                ajukan pemanfaatan melalui satu alur layanan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/sewa-aset")}
              className="inline-flex items-center gap-2 self-start rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-surface transition hover:bg-accent-hover sm:self-auto"
            >
              Lihat Pilihan Sewa
              <ArrowRightIcon size={16} weight="bold" />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
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
                Belum Ada Objek Sewa
              </h4>
              <p className="text-sm text-text-muted max-w-md mx-auto">
                Saat ini belum ada objek yang ditawarkan untuk disewa.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.slice(0, 3).map((item) => (
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
      )}

      {/* ==================== REQUEST CTA ==================== */}
      {RENTAL_FEATURE_ENABLED && (
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
            permintaan dan dokumen balasan pengelola bisa dipantau dengan
            aman.
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
                  onClick={() => openAuthPanel("login")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-surface transition hover:opacity-90"
                >
                  <SignInIcon size={18} weight="bold" />
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => openAuthPanel("register")}
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
                Kontak Pengelola
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
                  href="#"
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
                  href="#"
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
                  Informasi alamat belum tersedia
                </p>
              </div>
            </div>
          </div>
        </div>
        </section>
      )}

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
            setAuthMode("login");
            setMfaStep(false);
            setMfaToken("");
            setOtpType("authenticator");
            setOtpRecipient("");
            setOtpCode("");
            setLoginError("");
          }}
        />

        {/* Panel */}
        <div className="relative h-full w-screen sm:w-[30rem] bg-surface dark:bg-gray-900 flex flex-col shadow-2xl max-h-screen overflow-hidden border-l border-border ml-auto">
          {/* Close button */}
          <button
            aria-label="Tutup panel login"
            onClick={() => {
              setShowLoginPanel(false);
              setAuthMode("login");
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
              <BrandMark className="mx-auto mb-4 h-16 w-16 text-lg" />
              <h2 className="text-text-primary font-bold text-xl tracking-tight">
                Bhumi Satya
              </h2>
              <p className="text-text-muted text-sm mt-1.5">
                {PUBLIC_REGISTRATION_ENABLED && authMode === "register"
                  ? "Buat akun masyarakat untuk menggunakan layanan penyewaan"
                  : "Masuk ke sistem Bhumi Satya"}
              </p>
            </div>

            {/* Form */}
            <div className="px-6 md:px-8 pb-6">
              {PUBLIC_REGISTRATION_ENABLED &&
                !mfaStep &&
                !forgotPasswordMode && (
                <div className="mb-5 grid grid-cols-2 rounded-xl border border-border bg-surface-secondary p-1">
                  {[
                    { key: "login", label: "Masuk" },
                    { key: "register", label: "Daftar" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      aria-pressed={authMode === item.key}
                      onClick={() => {
                        setAuthMode(item.key);
                        setLoginError("");
                      }}
                      className={`h-10 rounded-lg text-sm font-semibold transition-colors ${
                        authMode === item.key
                          ? "bg-surface text-text-primary"
                          : "text-text-muted hover:text-text-primary"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}

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
              ) : PUBLIC_REGISTRATION_ENABLED && authMode === "register" ? (
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <p className="text-sm font-bold text-text-primary">
                      Daftar Akun Masyarakat
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-text-muted">
                      Buat akun untuk mengajukan dan memantau penyewaan.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <AuthPanelField
                      label="Nama Lengkap"
                      value={registerForm.nama_lengkap}
                      onChange={(value) =>
                        updateRegisterForm("nama_lengkap", value)
                      }
                      placeholder="Nama lengkap"
                      autoComplete="name"
                      required
                      disabled={registerLoading}
                    />
                    <AuthPanelField
                      label="Username"
                      value={registerForm.username}
                      onChange={(value) =>
                        updateRegisterForm("username", value)
                      }
                      placeholder="Buat username"
                      autoComplete="username"
                      required
                      disabled={registerLoading}
                    />
                    <AuthPanelField
                      label="Email"
                      value={registerForm.email}
                      onChange={(value) => updateRegisterForm("email", value)}
                      icon={EnvelopeSimpleIcon}
                      type="email"
                      placeholder="nama@email.com"
                      autoComplete="email"
                      required
                      disabled={registerLoading}
                    />
                    <AuthPanelField
                      label="Nomor WhatsApp"
                      value={registerForm.no_telepon}
                      onChange={(value) =>
                        updateRegisterForm("no_telepon", value)
                      }
                      icon={PhoneIcon}
                      inputMode="tel"
                      placeholder="08xxxxxxxxxx"
                      autoComplete="tel"
                      required
                      disabled={registerLoading}
                    />
                    <AuthPanelField
                      label="NIK (Opsional)"
                      value={registerForm.nik}
                      onChange={(value) =>
                        updateRegisterForm(
                          "nik",
                          value.replace(/\D/g, "").slice(0, 16),
                        )
                      }
                      inputMode="numeric"
                      maxLength={16}
                      placeholder="16 digit NIK"
                      disabled={registerLoading}
                    />
                    <AuthPanelField
                      label="Password"
                      value={registerForm.password}
                      onChange={(value) =>
                        updateRegisterForm("password", value)
                      }
                      icon={LockIcon}
                      type={showPassword ? "text" : "password"}
                      minLength={6}
                      placeholder="Minimal 6 karakter"
                      autoComplete="new-password"
                      required
                      disabled={registerLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
                      <MapPinIcon size={12} weight="bold" />
                      Alamat (Opsional)
                    </label>
                    <textarea
                      value={registerForm.alamat}
                      onChange={(event) =>
                        updateRegisterForm("alamat", event.target.value)
                      }
                      disabled={registerLoading}
                      rows={3}
                      placeholder="Masukkan alamat"
                      className="w-full resize-none rounded-xl border border-border bg-surface-secondary px-4 py-3 text-sm text-text-primary transition-all placeholder:text-text-muted focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={registerLoading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 text-sm font-bold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {registerLoading ? (
                      <>
                        <CircleNotchIcon
                          size={18}
                          weight="bold"
                          className="animate-spin"
                        />
                        Membuat akun...
                      </>
                    ) : (
                      <>
                        <UserIcon size={18} weight="bold" />
                        Daftar Akun
                      </>
                    )}
                  </button>
                  <p className="text-center text-[11px] leading-relaxed text-text-muted">
                    Akun baru otomatis mendapatkan akses masyarakat.
                  </p>
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
      {RENTAL_FEATURE_ENABLED && selectedItem && (
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
