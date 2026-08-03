export function isMasyarakatLoginOtpEnabled(
  value = process.env.MASYARAKAT_LOGIN_OTP_ENABLED,
) {
  return String(value || "false").toLowerCase().trim() === "true";
}

export function shouldBypassMasyarakatOtp(
  role,
  otpEnabled = process.env.MASYARAKAT_LOGIN_OTP_ENABLED,
) {
  return (
    String(role || "").toLowerCase().trim() === "masyarakat" &&
    !isMasyarakatLoginOtpEnabled(otpEnabled)
  );
}
