import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  CircleNotchIcon,
  EnvelopeSimpleIcon,
  EyeIcon,
  EyeSlashIcon,
  LockIcon,
  ShieldCheckIcon,
  SignInIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { authService } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";
import { useSessionStore } from "../../stores/sessionStore";
import BrandMark from "../../components/shared/BrandMark";
import ChatbotButton from "../../components/chatbot/ChatbotButton";
import ChatbotModal from "../../components/chatbot/ChatbotModal";

const initialRegisterForm = {
  nama_lengkap: "",
  username: "",
  email: "",
  no_telepon: "",
  nik: "",
  alamat: "",
  password: "",
};

export default function MasyarakatAuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);
  const startSession = useSessionStore((state) => state.startSession);
  const [mode, setMode] = useState(
    searchParams.get("mode") === "register" ? "register" : "login",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [otpStep, setOtpStep] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpRecipient, setOtpRecipient] = useState("");
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetRecipient, setResetRecipient] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await authService.login(
        loginForm.username,
        loginForm.password,
        "email",
      );
      if (response.data.otpRequired) {
        setOtpStep(true);
        setOtpToken(response.data.otpToken);
        setOtpRecipient(response.data.recipient || "");
        setOtpCode("");
        toast.success("Kode OTP telah dikirim ke email");
        return;
      }
      setToken(response.data.token);
      setUser(response.data.user);
      startSession(response.data.sessionDuration);
      toast.success("Login masyarakat berhasil");
      navigate("/sewa/aset-tersedia");
    } catch (error) {
      toast.error(error.response?.data?.error || "Login gagal");
      setLoginForm({ username: "", password: "" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    if (otpCode.length !== 6) {
      toast.error("Masukkan 6 digit kode OTP");
      return;
    }
    setLoading(true);
    try {
      const response = await authService.verifyLoginOtp(otpToken, otpCode);
      setToken(response.data.token);
      setUser(response.data.user);
      startSession(response.data.sessionDuration);
      toast.success("Login masyarakat berhasil");
      navigate("/sewa/aset-tersedia");
    } catch (error) {
      toast.error(error.response?.data?.error || "Verifikasi OTP gagal");
    } finally {
      setLoading(false);
    }
  };

  const resetOtpStep = () => {
    setOtpStep(false);
    setOtpToken("");
    setOtpCode("");
    setOtpRecipient("");
  };

  const resetPasswordState = () => {
    setForgotPasswordMode(false);
    setResetToken("");
    setResetRecipient("");
    setResetCode("");
    setResetNewPassword("");
    setResetConfirmPassword("");
  };

  const handlePasswordResetRequest = async (event) => {
    event.preventDefault();

    if (!resetIdentifier.trim()) {
      toast.error("Masukkan username atau email akun");
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
      toast.error(
        error.response?.data?.error || "Gagal mengirim kode reset password",
      );
    } finally {
      setResetLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (event) => {
    event.preventDefault();

    if (resetCode.length !== 6) {
      toast.error("Masukkan 6 digit kode OTP");
      return;
    }
    if (resetNewPassword.length < 8) {
      toast.error("Password baru minimal 8 karakter");
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      toast.error("Konfirmasi password tidak sama");
      return;
    }

    setResetLoading(true);
    try {
      await authService.resetPasswordWithOtp({
        resetToken,
        code: resetCode,
        newPassword: resetNewPassword,
      });
      toast.success("Password berhasil direset, silakan login");
      setLoginForm((prev) => ({
        ...prev,
        username: resetIdentifier || prev.username,
        password: "",
      }));
      resetPasswordState();
      resetOtpStep();
      setMode("login");
    } catch (error) {
      toast.error(error.response?.data?.error || "Reset password gagal");
    } finally {
      setResetLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await authService.register(registerForm);
      toast.success("Registrasi berhasil, silakan login");
      setLoginForm({
        username: registerForm.username,
        password: registerForm.password,
      });
      setRegisterForm(initialRegisterForm);
      setMode("login");
    } catch (error) {
      toast.error(error.response?.data?.error || "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  };

  const updateRegister = (key, value) => {
    setRegisterForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl grid lg:grid-cols-[0.95fr_1.05fr] bg-surface border border-border rounded-2xl overflow-hidden shadow-xl">
        <section className="bg-accent text-surface p-8 md:p-10 flex flex-col justify-between gap-10">
          <div>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 text-sm text-surface/70 hover:text-surface transition-colors"
            >
              <ArrowLeftIcon size={16} weight="bold" />
              Kembali
            </button>
            <div className="mt-10">
              <BrandMark className="mb-5 h-16 w-16 text-lg" />
              <p className="text-surface/60 text-sm font-medium">
                Bhumi Satya Kota Pasuruan
              </p>
              <h1 className="text-3xl md:text-4xl font-black mt-2 leading-tight">
                Akses Masyarakat
              </h1>
              <p className="text-surface/70 text-sm md:text-base mt-4 leading-relaxed max-w-sm">
                Masuk untuk melihat daftar sewa aset yang sudah disetujui oleh
                pengelola aset.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-surface/10 bg-surface/8 p-4">
              <p className="font-bold">Terverifikasi</p>
              <p className="text-surface/60 text-xs mt-1">Akun masyarakat</p>
            </div>
            <div className="rounded-xl border border-surface/10 bg-surface/8 p-4">
              <p className="font-bold">Sewa Disetujui</p>
              <p className="text-surface/60 text-xs mt-1">Data sewa aktif</p>
            </div>
          </div>
        </section>

        <section className="p-6 md:p-10">
          <div className="inline-flex rounded-xl bg-surface-secondary p-1 border border-border mb-7">
            {[
              { key: "login", label: "Login" },
              { key: "register", label: "Daftar" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setMode(item.key);
                  resetOtpStep();
                  resetPasswordState();
                }}
                className={`h-10 px-5 rounded-lg text-sm font-semibold transition-colors ${
                  mode === item.key
                    ? "bg-surface text-text-primary shadow-sm"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {mode === "login" ? (
            otpStep ? (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">
                    Verifikasi Email
                  </h2>
                  <p className="text-sm text-text-muted mt-1">
                    Masukkan 6 digit kode OTP yang dikirim ke email
                    {otpRecipient ? ` ${otpRecipient}` : ""}.
                  </p>
                </div>
                <Field
                  label="Kode OTP"
                  value={otpCode}
                  onChange={(value) =>
                    setOtpCode(value.replace(/\D/g, "").slice(0, 6))
                  }
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                />
                <SubmitButton
                  loading={loading}
                  label="Verifikasi OTP"
                  icon={SignInIcon}
                />
                <button
                  type="button"
                  onClick={resetOtpStep}
                  className="w-full h-11 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                >
                  Ganti username atau password
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
                <div>
                  <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4">
                    <EnvelopeSimpleIcon size={24} weight="duotone" />
                  </div>
                  <h2 className="text-2xl font-bold text-text-primary">
                    Lupa Kata Sandi
                  </h2>
                  <p className="text-sm text-text-muted mt-1">
                    {resetToken
                      ? `Masukkan kode OTP yang dikirim ke email${resetRecipient ? ` ${resetRecipient}` : ""}.`
                      : "Masukkan username atau email akun masyarakat untuk menerima kode reset."}
                  </p>
                </div>

                {!resetToken ? (
                  <Field
                    label="Username atau Email"
                    icon={UserIcon}
                    value={resetIdentifier}
                    onChange={setResetIdentifier}
                    autoComplete="username"
                    required
                  />
                ) : (
                  <>
                    <Field
                      label="Kode OTP"
                      icon={ShieldCheckIcon}
                      value={resetCode}
                      onChange={(value) =>
                        setResetCode(value.replace(/\D/g, "").slice(0, 6))
                      }
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                    />
                    <Field
                      label="Password Baru"
                      icon={LockIcon}
                      type="password"
                      value={resetNewPassword}
                      onChange={setResetNewPassword}
                      autoComplete="new-password"
                      required
                    />
                    <Field
                      label="Konfirmasi Password"
                      icon={LockIcon}
                      type="password"
                      value={resetConfirmPassword}
                      onChange={setResetConfirmPassword}
                      autoComplete="new-password"
                      required
                    />
                  </>
                )}

                <SubmitButton
                  loading={resetLoading}
                  label={resetToken ? "Reset Password" : "Kirim Kode Reset"}
                  icon={resetToken ? ShieldCheckIcon : EnvelopeSimpleIcon}
                />
                <button
                  type="button"
                  onClick={() => {
                    resetPasswordState();
                    resetOtpStep();
                  }}
                  className="w-full h-11 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeftIcon size={16} weight="bold" />
                  Kembali ke Login
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-text-primary">
                  Masuk Masyarakat
                </h2>
                <p className="text-sm text-text-muted mt-1">
                  Gunakan username dan password, lalu verifikasi OTP email.
                </p>
              </div>
              <Field
                label="Username"
                icon={UserIcon}
                value={loginForm.username}
                onChange={(value) =>
                  setLoginForm((prev) => ({ ...prev, username: value }))
                }
                autoComplete="username"
                required
              />
              <PasswordField
                label="Password"
                value={loginForm.password}
                showPassword={showPassword}
                onToggle={() => setShowPassword((prev) => !prev)}
                onChange={(value) =>
                  setLoginForm((prev) => ({ ...prev, password: value }))
                }
              />
              <button
                type="button"
                onClick={() => {
                  setForgotPasswordMode(true);
                  setResetIdentifier(loginForm.username);
                  resetOtpStep();
                }}
                className="text-sm font-semibold text-accent hover:text-accent/80 transition-colors"
              >
                Lupa password?
              </button>
              <SubmitButton loading={loading} label="Masuk" icon={SignInIcon} />
              </form>
            )
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-text-primary">
                  Daftar Akun
                </h2>
                <p className="text-sm text-text-muted mt-1">
                  Email wajib diisi untuk menerima OTP saat login.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="Nama Lengkap"
                  value={registerForm.nama_lengkap}
                  onChange={(value) => updateRegister("nama_lengkap", value)}
                  required
                />
                <Field
                  label="Username"
                  value={registerForm.username}
                  onChange={(value) => updateRegister("username", value)}
                  autoComplete="username"
                  required
                />
                <Field
                  label="Email"
                  type="email"
                  value={registerForm.email}
                  onChange={(value) => updateRegister("email", value)}
                  autoComplete="email"
                  required
                />
                <Field
                  label="No. WhatsApp"
                  value={registerForm.no_telepon}
                  onChange={(value) => updateRegister("no_telepon", value)}
                  autoComplete="tel"
                  inputMode="tel"
                  required
                />
                <Field
                  label="NIK"
                  value={registerForm.nik}
                  onChange={(value) => updateRegister("nik", value)}
                />
                <PasswordField
                  label="Password"
                  value={registerForm.password}
                  showPassword={showPassword}
                  onToggle={() => setShowPassword((prev) => !prev)}
                  onChange={(value) => updateRegister("password", value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary">
                  Alamat
                </label>
                <textarea
                  value={registerForm.alamat}
                  onChange={(event) =>
                    updateRegister("alamat", event.target.value)
                  }
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-border bg-surface-secondary px-4 py-3 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
                />
              </div>
              <SubmitButton loading={loading} label="Daftar" icon={UserIcon} />
            </form>
          )}
        </section>
      </div>

      {/* Chatbot */}
      <ChatbotButton onClick={() => setChatbotOpen(true)} />
      <ChatbotModal isOpen={chatbotOpen} onClose={() => setChatbotOpen(false)} />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  icon: Icon,
  type = "text",
  required = false,
  autoComplete,
  inputMode,
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-text-secondary">
        {label}
      </label>
      <div className="mt-2 relative">
        {Icon && (
          <Icon
            size={18}
            weight="bold"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
        )}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          autoComplete={autoComplete}
          inputMode={inputMode}
          className={`w-full h-12 rounded-xl border border-border bg-surface-secondary px-4 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 ${
            Icon ? "pl-10" : ""
          }`}
        />
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  showPassword,
  onToggle,
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-text-secondary">
        {label}
      </label>
      <div className="mt-2 relative">
        <LockIcon
          size={18}
          weight="bold"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          minLength={6}
          autoComplete="current-password"
          className="w-full h-12 rounded-xl border border-border bg-surface-secondary pl-10 pr-11 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface hover:text-text-primary transition-colors"
          title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
        >
          {showPassword ? (
            <EyeSlashIcon size={18} weight="bold" />
          ) : (
            <EyeIcon size={18} weight="bold" />
          )}
        </button>
      </div>
    </div>
  );
}

function SubmitButton({ loading, label, icon: Icon }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full h-12 rounded-xl bg-accent text-surface text-sm font-bold flex items-center justify-center gap-2 hover:bg-accent/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <CircleNotchIcon size={18} weight="bold" className="animate-spin" />
      ) : Icon ? (
        <Icon size={18} weight="bold" />
      ) : null}
      {loading ? "Memproses..." : label}
    </button>
  );
}
