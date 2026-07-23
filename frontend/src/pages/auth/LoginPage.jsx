import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polygon,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { authService, petaService } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";
import { useSessionStore } from "../../stores/sessionStore";
import { useThemeStore } from "../../stores/themeStore";
import { normalizeRole } from "../../utils/permissions";
import ChatbotButton from "../../components/chatbot/ChatbotButton";
import ChatbotModal from "../../components/chatbot/ChatbotModal";
import {
  SignInIcon,
  EyeIcon,
  EyeSlashIcon,
  MapTrifoldIcon,
  MoonIcon,
  SunIcon,
  CircleNotchIcon,
  WarningCircleIcon,
  UserIcon,
  LockIcon,
  CaretRightIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  BuildingsIcon,
  StorefrontIcon,
  ChartBarIcon,
  EnvelopeSimpleIcon,
  WhatsappLogoIcon,
  StackIcon,
  PolygonIcon,
} from "@phosphor-icons/react";
import BrandMark from "../../components/shared/BrandMark";

const CERTIFICATE_COLORS = {
  certified: "#0ea5e9",
  certifiedStroke: "#0369a1",
  uncertified: "#ef4444",
  uncertifiedStroke: "#b91c1c",
};

const PUBLIC_BASEMAP_OPTIONS = [
  {
    id: "maplibre",
    label: "MapLibre",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  },
  {
    id: "osm",
    label: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  },
  {
    id: "esri_satellite",
    label: "ESRI Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  },
];

const isAssetCertified = (asset) => {
  const certificateStatus = String(
    asset?.status_sertifikat ||
      asset?.statusSertifikat ||
      asset?.["STATUS SERTIFIKAT"] ||
      "",
  ).toLowerCase();
  if (
    certificateStatus.includes("belum") ||
    certificateStatus.includes("tidak")
  ) {
    return false;
  }
  if (
    certificateStatus.includes("sudah") ||
    certificateStatus.includes("telah") ||
    certificateStatus.includes("bersertifikat")
  ) {
    return true;
  }

  return String(
    asset?.nomor_sertifikat || asset?.nomorSertifikat || asset?.["NOMOR HAK"] || "",
  ).trim().length > 10;
};

const getCertificateConfig = (asset) => {
  const certified = isAssetCertified(asset);
  return certified
    ? {
        label: "Bersertifikat",
        color: CERTIFICATE_COLORS.certified,
        stroke: CERTIFICATE_COLORS.certifiedStroke,
        bg: "bg-sky-100 text-sky-700",
        dot: "bg-sky-500",
      }
    : {
        label: "Tidak Bersertifikat",
        color: CERTIFICATE_COLORS.uncertified,
        stroke: CERTIFICATE_COLORS.uncertifiedStroke,
        bg: "bg-red-100 text-red-700",
        dot: "bg-red-500",
      };
};

const getAssetLatLng = (asset = {}) => {
  const lat = Number(asset.latitude ?? asset.lat);
  const lng = Number(asset.longitude ?? asset.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
};

function MarkerNumberCanvas({ markers, visible }) {
  const map = useMap();
  const canvasRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const size = map.getSize();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = size.x * ratio;
    canvas.height = size.y * ratio;
    canvas.style.width = `${size.x}px`;
    canvas.style.height = `${size.y}px`;

    const topLeft = map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(canvas, topLeft);

    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, size.x, size.y);

    if (!visible) return;

    const zoom = map.getZoom();
    const fontSize = zoom >= 17 ? 9 : 8;
    ctx.font = `800 ${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "rgba(15, 23, 42, 0.62)";
    ctx.lineWidth = 2.4;

    markers.forEach(({ position, number }) => {
      const point = map.latLngToLayerPoint(position).subtract(topLeft);
      if (
        point.x < -16 ||
        point.y < -16 ||
        point.x > size.x + 16 ||
        point.y > size.y + 16
      ) {
        return;
      }
      const label = String(number);
      ctx.strokeText(label, point.x, point.y + 0.2);
      ctx.fillText(label, point.x, point.y + 0.2);
    });
  }, [map, markers, visible]);

  useEffect(() => {
    const canvas = L.DomUtil.create(
      "canvas",
      "bhumi-satya-marker-number-canvas",
    );
    canvas.style.position = "absolute";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "420";
    canvasRef.current = canvas;
    map.getPanes().overlayPane.appendChild(canvas);

    draw();
    map.on("move zoom resize zoomend moveend", draw);

    return () => {
      map.off("move zoom resize zoomend moveend", draw);
      canvas.remove();
      canvasRef.current = null;
    };
  }, [draw, map]);

  useEffect(() => {
    draw();
  }, [draw]);

  return null;
}

// Zoom-aware markers with popup
function ZoomAwareMarkers({ assets, onLoginClick, dotsOnly = false }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const canvasRenderer = useMemo(() => L.canvas({ padding: 0.4 }), []);

  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom());
    map.on("zoomend", onZoom);
    return () => map.off("zoomend", onZoom);
  }, [map]);

  const radius = dotsOnly
    ? Math.max(3, Math.min(5, 3 + (zoom - 10) * 0.4))
    : Math.max(5, Math.min(9, 5 + (zoom - 10) * 0.6));
  const showMarkerNumbers = !dotsOnly && zoom >= 14;
  const markerItems = useMemo(
    () =>
      assets
        .map((asset) => ({ asset, position: getAssetLatLng(asset) }))
        .filter((item) => item.position)
        .map((item, index) => ({
          ...item,
          number: index + 1,
        })),
    [assets],
  );

  return (
    <>
      <MarkerNumberCanvas markers={markerItems} visible={showMarkerNumbers} />
      {markerItems.map(({ asset, position }) => {
        const sc = getCertificateConfig(asset);
        return (
          <CircleMarker
            key={asset.id || asset.id_aset || `${position[0]}-${position[1]}`}
            center={position}
            radius={radius}
            renderer={canvasRenderer}
            pathOptions={{
              color: sc.stroke,
              weight: 1.4,
              fillColor: sc.color,
              fillOpacity: 0.9,
            }}
            eventHandlers={{
              click: () =>
                map.setView(position, Math.max(zoom, 16), { animate: true }),
            }}
          >
            <Popup closeButton={true} maxWidth={320} minWidth={280}>
            <div className="font-sans p-1">
              {/* Header */}
              <div className="font-bold text-base text-gray-800 leading-snug mb-2">
                {asset.nama_aset}
              </div>

              {/* Status badge */}
              <div className="mb-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg}`}
                >
                  <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                  {sc.label}
                </span>
              </div>

              {/* Info rows */}
              <div className="space-y-1.5 text-xs text-gray-600">
                {asset.lokasi && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 shrink-0">📍</span>
                    <span className="leading-snug">{asset.lokasi}</span>
                  </div>
                )}
                {(asset.kecamatan || asset.desa_kelurahan) && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 shrink-0">🏘️</span>
                    <span>
                      {[asset.desa_kelurahan, asset.kecamatan]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
                {asset.luas && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 shrink-0">📐</span>
                    <span>{Number(asset.luas).toLocaleString("id-ID")} m²</span>
                  </div>
                )}
                {asset.jenis_aset && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 shrink-0">🏷️</span>
                    <span>{asset.jenis_aset}</span>
                  </div>
                )}
              </div>

              {/* Divider + Login CTA */}
              <div className="border-t border-gray-200 mt-3 pt-2.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    map.closePopup();
                    onLoginClick();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  🔒 Login untuk detail lengkap
                </button>
              </div>
            </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

function getLeafletPolygonPoints(polygon) {
  if (!polygon) return null;

  const normalizeGeojsonPoint = (point) => {
    if (!Array.isArray(point) || point.length < 2) return null;
    const lng = Number(point[0]);
    const lat = Number(point[1]);
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
  };

  const normalizeLatLngPoint = (point) => {
    if (Array.isArray(point)) {
      const lat = Number(point[0]);
      const lng = Number(point[1]);
      return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
    }
    const lat = Number(point?.lat);
    const lng = Number(point?.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
  };

  const coordinates =
    polygon?.type === "FeatureCollection"
      ? polygon.features?.find((feature) => feature?.geometry?.type === "Polygon")
          ?.geometry?.coordinates?.[0]
      : polygon?.geometry?.coordinates?.[0] || polygon?.coordinates?.[0];

  if (coordinates) {
    const points = coordinates.map(normalizeGeojsonPoint).filter(Boolean);
    return points.length >= 3 ? points : null;
  }

  if (Array.isArray(polygon)) {
    const rawRing = Array.isArray(polygon[0]?.[0]) ? polygon[0] : polygon;
    const points = rawRing.map(normalizeLatLngPoint).filter(Boolean);
    return points.length >= 3 ? points : null;
  }

  return null;
}

function AssetPolygons({ assets = [], onLoginClick }) {
  return assets
    .map((asset) => ({
      asset,
      points: getLeafletPolygonPoints(
        asset.polygon || asset.polygon_bidang || asset.polygon_sewa,
      ),
    }))
    .filter((item) => item.points)
    .map(({ asset, points }) => {
      const sc = getCertificateConfig(asset);
      return (
        <Polygon
          key={`polygon-${asset.id}`}
          positions={points}
          pathOptions={{
            color: sc.stroke,
            weight: 1.5,
            fillColor: sc.color,
            fillOpacity: 0.15,
          }}
        >
          <Popup closeButton={true} maxWidth={320} minWidth={280}>
            <div className="font-sans p-1">
              <div className="font-bold text-sm text-gray-800 mb-1">
                {asset.nama_aset}
              </div>
              {asset.lokasi && (
                <p className="text-xs text-gray-600 mb-2">{asset.lokasi}</p>
              )}
              <button
                onClick={() => onLoginClick?.()}
                className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Login untuk detail lengkap
              </button>
            </div>
          </Popup>
        </Polygon>
      );
    });
}

function PublicMapLayerControl({
  activeBaseLayer,
  setActiveBaseLayer,
  showMarkers,
  setShowMarkers,
  showPolygons,
  setShowPolygons,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative pointer-events-auto">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-10 h-10 md:w-11 md:h-11 items-center justify-center rounded-xl border border-white/10 bg-gray-900/80 text-white shadow-xl backdrop-blur-xl transition-all hover:scale-105 hover:bg-gray-900"
        title="Layer peta"
        aria-label="Layer peta"
      >
        <StackIcon size={20} weight="fill" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-60 rounded-xl border border-surface/20 bg-surface/95 p-3 shadow-xl backdrop-blur-md">
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-text-muted">
              Pilih Layer Map
            </p>
            <div className="space-y-1.5">
              {PUBLIC_BASEMAP_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-text-secondary hover:bg-surface-secondary"
                  title={option.label}
                >
                  <input
                    type="radio"
                    name="login-basemap"
                    checked={activeBaseLayer === option.id}
                    onChange={() => setActiveBaseLayer(option.id)}
                    className="h-3.5 w-3.5 accent-accent"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="my-3 border-t border-border/70" />

          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-text-muted">
              Tampilan Layer
            </p>
            <div className="space-y-1.5">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-text-secondary hover:bg-surface-secondary">
              <input
                type="checkbox"
                checked={showMarkers}
                onChange={(e) => setShowMarkers(e.target.checked)}
                className="h-3.5 w-3.5 accent-accent"
              />
              <MapTrifoldIcon size={14} weight="fill" className="text-sky-600" />
              Tampilkan marker
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-text-secondary hover:bg-surface-secondary">
              <input
                type="checkbox"
                checked={showPolygons}
                onChange={(e) => setShowPolygons(e.target.checked)}
                className="h-3.5 w-3.5 accent-accent"
              />
              <PolygonIcon size={14} weight="fill" className="text-sky-600" />
              Tampilkan polygon
            </label>
            {!showMarkers && !showPolygons && (
              <p className="px-2 pt-1 text-[10px] text-text-muted">
                Menampilkan dot tanpa nomor.
              </p>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage({ publicMapOnly = false }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetRecipient, setResetRecipient] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [showLoginPanel, setShowLoginPanel] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState("bhumi-satya");
  const [assets, setAssets] = useState([]);
  const [showMapMarkers, setShowMapMarkers] = useState(true);
  const [showMapPolygons, setShowMapPolygons] = useState(false);
  const [activeMapLayer, setActiveMapLayer] = useState("osm");
  const activeMapLayerConfig =
    PUBLIC_BASEMAP_OPTIONS.find((option) => option.id === activeMapLayer) ||
    PUBLIC_BASEMAP_OPTIONS[1];
  // MFA state
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaToken, setMfaToken] = useState("");
  const [otpType, setOtpType] = useState("authenticator");
  const [otpRecipient, setOtpRecipient] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [mfaEmailLoading, setMfaEmailLoading] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();
  const startSession = useSessionStore((s) => s.startSession);
  const { darkMode, toggleDarkMode, initDarkMode } = useThemeStore();

  const getPostLoginPath = (role) =>
    normalizeRole(role) === "masyarakat"
      ? "/sewa/aset-tersedia"
      : "/dashboard";

  useEffect(() => {
    initDarkMode();
  }, [initDarkMode]);

  // Fetch real asset markers for the map background
  useEffect(() => {
    petaService
      .getPublicMarkers()
      .then((res) => setAssets(res.data.data || []))
      .catch(() => setAssets([]));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!username || !password) {
        setError("Username dan password harus diisi");
        setLoading(false);
        return;
      }

      const response = await authService.login(username, password, "email");

      // Check if MFA is required
      if (response.data.mfaRequired) {
        setMfaToken(response.data.mfaToken);
        setOtpType("authenticator");
        setOtpRecipient("");
        setMfaStep(true);
        setOtpCode("");
        setLoading(false);
        return;
      }

      if (response.data.otpRequired) {
        setMfaToken(response.data.otpToken);
        setOtpType(response.data.otpChannel || "email");
        setOtpRecipient(response.data.recipient || "");
        setMfaStep(true);
        setOtpCode("");
        setLoading(false);
        return;
      }

      setToken(response.data.token);
      setUser(response.data.user);
      startSession(response.data.sessionDuration);
      toast.success("Login berhasil!");
      navigate(getPostLoginPath(response.data.user?.role));
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Login gagal";
      setError(errorMsg);
      toast.error(errorMsg);
      setUsername("");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!otpCode || otpCode.length !== 6) {
        setError("Masukkan 6 digit kode OTP");
        setLoading(false);
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
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Verifikasi OTP gagal";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestMfaEmailOtp = async () => {
    setError("");
    setMfaEmailLoading(true);
    try {
      const response = await authService.requestMfaEmailOtp(mfaToken);
      setMfaToken(response.data.otpToken);
      setOtpType("email");
      setOtpRecipient(response.data.recipient || "");
      setOtpCode("");
      toast.success("Kode OTP telah dikirim ke email");
    } catch (error) {
      const errorMsg =
        error.response?.data?.error || "Gagal mengirim OTP email";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setMfaEmailLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setMfaStep(false);
    setMfaToken("");
    setOtpType("authenticator");
    setOtpRecipient("");
    setOtpCode("");
    setMfaEmailLoading(false);
    setForgotPasswordMode(false);
    setResetToken("");
    setResetCode("");
    setResetNewPassword("");
    setResetConfirmPassword("");
    setError("");
  };

  const handlePasswordResetRequest = async (e) => {
    e.preventDefault();
    setError("");

    if (!resetIdentifier.trim()) {
      setError("Masukkan username atau email akun");
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
    } catch (error) {
      const errorMsg =
        error.response?.data?.error || "Gagal mengirim kode reset password";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setResetLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (resetCode.length !== 6) {
      setError("Masukkan 6 digit kode OTP");
      return;
    }
    if (resetNewPassword.length < 8) {
      setError("Password baru minimal 8 karakter");
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setError("Konfirmasi password tidak sama");
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
      setPassword("");
    } catch (error) {
      const errorMsg =
        error.response?.data?.error || "Gagal mereset password";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setResetLoading(false);
    }
  };

  // System configuration for branding
  const systemConfig = {
    "bhumi-satya": {
      name: "Bhumi Satya",
      fullName: "Sistem Manajemen Aset Tanah Kota Pasuruan",
      shortDesc: "Master aset terpadu",
      Icon: BuildingsIcon,
    },
  };

  const currentSystem = systemConfig[selectedSystem];

  const openDetailLoginPanel = () => {
    setSelectedSystem("bhumi-satya");
    setShowLoginPanel(true);
    setError("");
    setMfaStep(false);
    setForgotPasswordMode(false);
    setOtpCode("");
  };

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-gray-900">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={[-7.6469, 112.9075]}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          scrollWheelZoom={true}
          dragging={true}
          doubleClickZoom={true}
          attributionControl={false}
          preferCanvas={true}
        >
          <TileLayer
            key={activeMapLayerConfig.id}
            url={activeMapLayerConfig.url}
          />

          {showMapPolygons && (
            <AssetPolygons
              assets={assets}
              onLoginClick={openDetailLoginPanel}
            />
          )}

          {(showMapMarkers || (!showMapMarkers && !showMapPolygons)) && (
            <ZoomAwareMarkers
              assets={assets}
              onLoginClick={openDetailLoginPanel}
              dotsOnly={!showMapMarkers && !showMapPolygons}
            />
          )}
        </MapContainer>
      </div>

      {/* Map Overlay (subtle darkening) */}
      <div className="absolute inset-0 z-1 bg-accent/10 dark:bg-surface/30 pointer-events-none" />

      {/* Top Left - Bhumi Satya Logo Badge */}
      {!publicMapOnly && <div
        className="absolute top-4 left-4 md:top-6 md:left-6 z-10 pointer-events-auto"
      >
        <div className="flex items-center gap-2 md:gap-3 bg-accent/80 dark:bg-surface/80 backdrop-blur-xl rounded-2xl px-3 md:px-4 py-2 md:py-3 shadow-xl border border-surface/10">
          <BrandMark className="h-8 w-8 text-[10px] md:h-10 md:w-10 md:text-xs" />
          <div>
            <h1 className="text-surface dark:text-accent font-bold text-sm md:text-lg tracking-tight">
              Bhumi Satya
            </h1>
            <p className="text-surface/60 dark:text-accent/60 text-[10px] md:text-xs hidden sm:block">
              Sistem Manajemen Aset Tanah
            </p>
          </div>
        </div>
      </div>}

      {/* Top Right - Layer + Dark Mode Toggle */}
      <div className={`absolute right-4 md:right-6 z-30 pointer-events-auto flex items-center gap-2 ${
        publicMapOnly ? "top-20 md:top-20" : "top-4 md:top-6"
      }`}>
        <PublicMapLayerControl
          activeBaseLayer={activeMapLayer}
          setActiveBaseLayer={setActiveMapLayer}
          showMarkers={showMapMarkers}
          setShowMarkers={setShowMapMarkers}
          showPolygons={showMapPolygons}
          setShowPolygons={setShowMapPolygons}
        />
        {!publicMapOnly && (
          <button
            onClick={toggleDarkMode}
            aria-label={darkMode ? "Aktifkan Light Mode" : "Aktifkan Dark Mode"}
            className={`w-10 h-10 md:w-11 md:h-11 rounded-xl backdrop-blur-xl shadow-xl border border-surface/10 flex items-center justify-center transition-all hover:scale-105 ${
              showLoginPanel ? "sm:hidden" : ""
            } ${darkMode ? "bg-gray-950/80 text-amber-400" : "bg-gray-900/80 text-surface"}`}
            title={darkMode ? "Light Mode" : "Dark Mode"}
          >
            {darkMode ? (
              <SunIcon size={20} weight="bold" />
            ) : (
              <MoonIcon size={20} weight="bold" />
            )}
          </button>
        )}
      </div>

      {/* Bottom Left - Legend */}
      <div
        className={`absolute ${
          showLoginPanel ? "bottom-4" : "bottom-24"
        } sm:bottom-4 md:bottom-6 left-4 md:left-6 z-10 pointer-events-auto transition-all duration-300`}
      >
        <div className="bg-accent/80 dark:bg-surface/80 backdrop-blur-xl rounded-2xl px-3 md:px-4 py-2 md:py-3 border border-surface/10 shadow-xl">
          <div className="flex items-center gap-3 md:gap-4">
            {[
              { label: "Bersertifikat", color: "bg-sky-500" },
              { label: "Tidak Bersertifikat", color: "bg-red-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${item.color}`}
                />
                <span className="text-surface dark:text-accent text-[10px] md:text-xs">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== PUBLIC BHUMI SATYA LANDING ==================== */}
      {!publicMapOnly && !showLoginPanel && (
        <main className="absolute inset-x-4 top-24 bottom-28 sm:bottom-6 z-10 flex items-center pointer-events-none">
          <section className="pointer-events-auto w-full max-w-xl md:ml-4 lg:ml-[8vw] rounded-3xl border border-white/20 bg-slate-950/72 p-5 sm:p-7 md:p-8 text-white shadow-2xl backdrop-blur-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-sky-400/10 px-3 py-1 text-[11px] font-bold tracking-wide text-sky-200">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
              Portal layanan publik Bhumi Satya
            </div>
            <h2 className="mt-4 max-w-lg text-2xl font-black leading-tight sm:text-3xl md:text-4xl">
              Informasi aset dan sewa dalam satu layanan terpadu.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
              Jelajahi aset yang tersedia untuk disewa, pantau layanan masyarakat,
              atau akses evaluasi kinerja tanpa memilih sistem berdasarkan instansi.
            </p>

            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              <button
                onClick={() => navigate("/sewa-tersedia")}
                className="group flex min-h-14 items-center gap-3 rounded-2xl bg-sky-500 px-4 py-3 text-left text-sm font-bold text-white shadow-lg shadow-sky-950/30 transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:ring-offset-2 focus:ring-offset-slate-950 sm:col-span-2"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <StorefrontIcon size={20} weight="duotone" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block">Lihat Aset Tersedia untuk Disewa</span>
                  <span className="mt-0.5 block text-xs font-medium text-white/75">
                    Informasi publik aset yang siap disewakan
                  </span>
                </span>
                <CaretRightIcon
                  size={18}
                  weight="bold"
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </button>

              <button
                onClick={() => navigate("/masyarakat/login")}
                className="group flex min-h-14 items-center gap-3 rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-left text-sm font-bold text-white transition hover:border-emerald-300/50 hover:bg-emerald-400/15 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-200">
                  <UserIcon size={19} weight="duotone" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block">Login Masyarakat</span>
                  <span className="mt-0.5 block text-xs font-medium text-white/60">
                    Ajukan dan pantau sewa
                  </span>
                </span>
                <CaretRightIcon
                  size={16}
                  weight="bold"
                  className="text-white/60 transition-transform group-hover:translate-x-0.5"
                />
              </button>

              <button
                onClick={() => navigate("/ekasmat")}
                className="group flex min-h-14 items-center gap-3 rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-left text-sm font-bold text-white transition hover:border-violet-300/50 hover:bg-violet-400/15 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-400/20 text-violet-200">
                  <ChartBarIcon size={19} weight="duotone" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block">EKASMAT</span>
                  <span className="mt-0.5 block text-xs font-medium text-white/60">
                    Evaluasi kinerja aplikasi
                  </span>
                </span>
                <CaretRightIcon
                  size={16}
                  weight="bold"
                  className="text-white/60 transition-transform group-hover:translate-x-0.5"
                />
              </button>
            </div>
          </section>
        </main>
      )}

      {/* ==================== LOGIN PANEL ==================== */}
      <div
        className={`absolute top-0 right-0 h-full z-30 transition-all duration-500 ease-out ${
          showLoginPanel
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0"
        }`}
      >
        <div className="h-full w-screen sm:w-100 md:w-107.5 bg-surface dark:bg-gray-900 flex flex-col shadow-2xl max-h-screen overflow-hidden border-l border-gray-200/50 dark:border-gray-700/50">
          {/* Toggle Button (desktop) */}
          <button
            onClick={() => setShowLoginPanel(false)}
            aria-label="Tutup panel login dan jelajahi peta"
            className="absolute top-1/2 -translate-y-1/2 -left-10 hidden sm:flex w-10 h-20 bg-surface dark:bg-gray-900 rounded-l-xl items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all border border-r-0 border-gray-200 dark:border-gray-700 shadow-lg"
            title="Jelajahi Peta"
          >
            <CaretRightIcon size={18} weight="bold" />
          </button>

          {/* Mobile Close */}
          <button
            onClick={() => setShowLoginPanel(false)}
            aria-label="Tutup panel login"
            className="absolute top-3 right-3 sm:hidden w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors z-10"
          >
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Header */}
            <div className="px-6 md:px-8 pt-6 md:pt-10 pb-6 md:pb-8 text-center">
              {/* Bhumi Satya icon */}
              <BrandMark className="mx-auto mb-4 h-16 w-16 text-lg shadow-xl md:mb-5 md:h-20 md:w-20 md:text-xl" />
              <h2 className="text-gray-900 dark:text-gray-100 font-bold text-xl md:text-2xl tracking-tight">
                {currentSystem?.name || "Bhumi Satya"}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1.5">
                {currentSystem?.fullName ||
                  "Masuk ke akun Anda untuk melanjutkan"}
              </p>

              {/* Dark mode toggle inside panel */}
              <button
                onClick={toggleDarkMode}
                className="mx-auto mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                {darkMode ? (
                  <SunIcon size={14} weight="bold" className="text-amber-500" />
                ) : (
                  <MoonIcon size={14} weight="bold" />
                )}
                {darkMode ? "Light Mode" : "Dark Mode"}
              </button>
            </div>

            {/* Form */}
            <div className="px-6 md:px-8 pb-4 md:pb-6">
              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="mb-5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl p-3.5 flex items-start gap-3"
                >
                  <div className="w-5 h-5 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <WarningCircleIcon
                      size={12}
                      weight="fill"
                      className="text-red-600 dark:text-red-400"
                    />
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {error}
                  </p>
                </div>
              )}

              {mfaStep ? (
                /* ===== MFA OTP VERIFICATION ===== */
                <form
                  onSubmit={handleMfaVerify}
                  className="space-y-4 md:space-y-5"
                >
                  <div className="text-center mb-2">
                    <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl mx-auto flex items-center justify-center mb-3">
                      <ShieldCheckIcon
                        size={28}
                        weight="duotone"
                        className="text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                    <h3 className="text-gray-900 dark:text-gray-100 font-bold text-base">
                      Verifikasi Dua Langkah
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                      {otpType === "authenticator"
                        ? "Masukkan kode 6 digit dari aplikasi authenticator Anda"
                        : `Masukkan kode 6 digit yang dikirim ke ${
                            otpType === "whatsapp" ? "WhatsApp" : "email"
                          }${otpRecipient ? ` ${otpRecipient}` : ""}`}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="otpCode"
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400"
                    >
                      <ShieldCheckIcon size={12} weight="bold" />
                      Kode OTP
                    </label>
                    <input
                      id="otpCode"
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
                      disabled={loading}
                      placeholder="000000"
                      className="w-full h-14 px-4 text-center text-2xl font-mono tracking-[0.5em] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-surface/20 focus:border-gray-400 dark:focus:border-gray-500 focus:bg-surface dark:focus:bg-gray-800 transition-all text-gray-900 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-600 disabled:opacity-50"
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpCode.length !== 6}
                    className="w-full h-12 bg-accent hover:bg-gray-800 dark:hover:bg-gray-100 text-surface text-sm font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
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
                      disabled={loading || mfaEmailLoading}
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
                    onClick={handleBackToLogin}
                    className="w-full h-11 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <ArrowLeftIcon size={16} weight="bold" />
                    Kembali ke Login
                  </button>
                </form>
              ) : (
                /* ===== NORMAL LOGIN FORM ===== */
                forgotPasswordMode ? (
                  <form
                    onSubmit={
                      resetToken
                        ? handlePasswordResetSubmit
                        : handlePasswordResetRequest
                    }
                    className="space-y-4 md:space-y-5"
                  >
                    <div className="text-center mb-2">
                      <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl mx-auto flex items-center justify-center mb-3">
                        <EnvelopeSimpleIcon
                          size={28}
                          weight="duotone"
                          className="text-emerald-600 dark:text-emerald-400"
                        />
                      </div>
                      <h3 className="text-gray-900 dark:text-gray-100 font-bold text-base">
                        Lupa Kata Sandi
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                        {resetToken
                          ? `Masukkan kode yang dikirim ke email${resetRecipient ? ` ${resetRecipient}` : ""}.`
                          : "Masukkan username atau email untuk menerima kode reset."}
                      </p>
                    </div>

                    {!resetToken ? (
                      <div className="space-y-2">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400">
                          <UserIcon size={12} weight="bold" />
                          Username atau Email
                        </label>
                        <input
                          type="text"
                          value={resetIdentifier}
                          onChange={(e) => setResetIdentifier(e.target.value)}
                          disabled={resetLoading}
                          placeholder="Masukkan username atau email"
                          className="w-full h-12 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-surface/20 focus:border-gray-400 dark:focus:border-gray-500 transition-all text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400">
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
                            className="w-full h-12 px-4 text-center text-xl font-mono tracking-[0.35em] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-surface/20 focus:border-gray-400 dark:focus:border-gray-500 transition-all text-gray-900 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-600 disabled:opacity-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400">
                            <LockIcon size={12} weight="bold" />
                            Password Baru
                          </label>
                          <input
                            type="password"
                            value={resetNewPassword}
                            onChange={(e) =>
                              setResetNewPassword(e.target.value)
                            }
                            disabled={resetLoading}
                            placeholder="Minimal 8 karakter"
                            className="w-full h-12 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-surface/20 focus:border-gray-400 dark:focus:border-gray-500 transition-all text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400">
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
                            className="w-full h-12 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-surface/20 focus:border-gray-400 dark:focus:border-gray-500 transition-all text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50"
                          />
                        </div>
                      </>
                    )}

                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full h-12 bg-accent hover:bg-gray-800 dark:hover:bg-gray-100 text-surface text-sm font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                        setError("");
                      }}
                      className="w-full h-11 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700"
                    >
                      <ArrowLeftIcon size={16} weight="bold" />
                      Kembali ke Login
                    </button>
                  </form>
                ) : (
                  <>
                  <form
                    onSubmit={handleLogin}
                    className="space-y-4 md:space-y-5"
                  >
                    {/* Username */}
                    <div className="space-y-2">
                      <label
                        htmlFor="username"
                        className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400"
                      >
                        <UserIcon size={12} weight="bold" />
                        Username
                      </label>
                      <div className="relative">
                        <input
                          id="username"
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          disabled={loading}
                          placeholder="Masukkan username"
                          className="w-full h-12 pl-4 pr-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-surface/20 focus:border-gray-400 dark:focus:border-gray-500 focus:bg-surface dark:focus:bg-gray-800 transition-all text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50"
                          required
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="password"
                          className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400"
                        >
                          <LockIcon size={12} weight="bold" />
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotPasswordMode(true);
                            setResetIdentifier(username);
                            setError("");
                          }}
                          className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                          Lupa password?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                          placeholder="Masukkan password"
                          className="w-full h-12 pl-4 pr-12 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-surface/20 focus:border-gray-400 dark:focus:border-gray-500 focus:bg-surface dark:focus:bg-gray-800 transition-all text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={
                            showPassword
                              ? "Sembunyikan password"
                              : "Tampilkan password"
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {showPassword ? (
                            <EyeSlashIcon size={18} weight="regular" />
                          ) : (
                            <EyeIcon size={18} weight="regular" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-accent hover:bg-gray-800 dark:hover:bg-gray-100 text-surface text-sm font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
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

                  {/* Explore Map */}
                  <button
                    onClick={() => setShowLoginPanel(false)}
                    className="w-full mt-3 h-11 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <MapTrifoldIcon size={16} weight="duotone" />
                    Jelajahi Peta Terlebih Dahulu
                  </button>
                  </>
                )
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0">
            {/* System Switcher Strip */}
            <div className="px-4 md:px-6 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => {
                  setSelectedSystem("bhumi-satya");
                  setShowLoginPanel(false);
                  setError("");
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/40">
                    {currentSystem?.logo ? (
                      <img
                        src={currentSystem.logo}
                        alt={currentSystem.name}
                        className="w-5 h-5 object-contain"
                      />
                    ) : (
                      currentSystem && (
                        <currentSystem.Icon
                          size={14}
                          weight="duotone"
                          className="text-blue-600 dark:text-blue-400"
                        />
                      )
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                      {currentSystem?.name}
                    </p>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500">
                      {currentSystem?.shortDesc}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-medium text-gray-400 dark:text-gray-500 group-hover:text-accent transition-colors">
                  <ArrowLeftIcon size={10} weight="bold" />
                  Kembali ke peta
                </div>
              </button>
            </div>

            {/* Copyright */}
            <div className="px-6 md:px-8 py-3 md:py-4 border-t border-gray-100 dark:border-gray-800 bg-surface dark:bg-gray-900">
              <p className="text-center text-gray-400 dark:text-gray-600 text-[10px] md:text-xs">
                Bhumi Satya
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== FLOATING BUTTONS (panel hidden) ==================== */}

      {/* Desktop - Login Button */}
      {!publicMapOnly && selectedSystem && !showLoginPanel && (
        <div className="absolute bottom-6 md:bottom-8 right-6 md:right-8 z-20 hidden sm:block">
          <button
            onClick={() => setShowLoginPanel(true)}
            className="bg-surface dark:bg-gray-900 text-gray-900 dark:text-gray-100 pl-5 pr-6 py-3 rounded-2xl font-semibold shadow-2xl hover:shadow-3xl transition-all flex items-center gap-3 group border border-gray-200 dark:border-gray-700"
          >
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <SignInIcon size={16} weight="bold" className="text-surface" />
            </div>
            <span className="text-sm">Login Internal Bhumi Satya</span>
          </button>
        </div>
      )}

      {/* Mobile - Bottom Bar */}
      {!publicMapOnly && selectedSystem && !showLoginPanel && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-linear-to-t from-gray-900 via-gray-900/95 to-transparent pt-10 sm:hidden">
          <button
            onClick={() => setShowLoginPanel(true)}
            className="w-full bg-surface dark:bg-gray-900 text-gray-900 dark:text-gray-100 py-4 rounded-2xl font-bold shadow-2xl flex items-center justify-center gap-2.5 text-base border border-gray-200 dark:border-gray-700"
          >
            <SignInIcon size={18} weight="bold" />
            Login Internal Bhumi Satya
          </button>
        </div>
      )}

      {/* Chatbot */}
      <ChatbotButton onClick={() => setChatbotOpen(true)} />
      <ChatbotModal isOpen={chatbotOpen} onClose={() => setChatbotOpen(false)} />
    </div>
  );
}
