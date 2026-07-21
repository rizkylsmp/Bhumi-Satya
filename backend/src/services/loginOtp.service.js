import crypto from "crypto";
import nodemailer from "nodemailer";

const OTP_LENGTH = 6;

function getMailConfig() {
  return {
    host: process.env.SMTP_HOST || process.env.MAIL_HOST,
    port: process.env.SMTP_PORT || process.env.MAIL_PORT || 587,
    secure: process.env.SMTP_SECURE || process.env.MAIL_SECURE,
    user: process.env.SMTP_USER || process.env.MAIL_USER,
    pass: process.env.SMTP_PASS || process.env.MAIL_PASS,
    from:
      process.env.SMTP_FROM ||
      process.env.MAIL_FROM ||
      process.env.SMTP_USER ||
      process.env.MAIL_USER,
  };
}

function getSmtpTransporter() {
  const config = getMailConfig();
  if (!config.host) return null;

  return nodemailer.createTransport({
    host: config.host,
    port: Number(config.port),
    secure: config.secure === "true",
    auth:
      config.user && config.pass
        ? {
            user: config.user,
            pass: config.pass,
          }
        : undefined,
  });
}

function normalizeWhatsAppNumber(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

function maskEmail(email) {
  if (!email) return null;
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const visible = name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(2, name.length - 2))}@${domain}`;
}

function maskPhone(phone) {
  const normalized = normalizeWhatsAppNumber(phone);
  if (!normalized) return null;
  return `${normalized.slice(0, 4)}****${normalized.slice(-3)}`;
}

class LoginOtpService {
  static generateCode() {
    const max = 10 ** OTP_LENGTH;
    return crypto.randomInt(0, max).toString().padStart(OTP_LENGTH, "0");
  }

  static hashCode(code) {
    return crypto
      .createHmac("sha256", process.env.JWT_SECRET)
      .update(String(code))
      .digest("hex");
  }

  static getRecipient(user, channel) {
    if (channel === "whatsapp") return maskPhone(user.no_telepon);
    return maskEmail(user.email);
  }

  static async send({ user, channel, code }) {
    if (channel === "whatsapp") {
      return this.sendWhatsApp({ user, code });
    }
    return this.sendEmail({ user, code });
  }

  static async sendEmail({ user, code }) {
    if (!user.email) {
      throw new Error("Email belum terdaftar untuk akun ini");
    }

    const subject = "Kode OTP Login Bhumi Satya";
    const text = `Kode OTP login Bhumi Satya Anda: ${code}. Kode berlaku 5 menit. Abaikan pesan ini jika Anda tidak sedang login.`;
    const mailConfig = getMailConfig();
    const transporter = getSmtpTransporter();

    if (!transporter) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("SMTP belum dikonfigurasi");
      }
      console.log(`[DEV OTP EMAIL] ${user.email}: ${code}`);
      return;
    }

    await transporter.sendMail({
      from: mailConfig.from,
      to: user.email,
      subject,
      text,
    });
  }

  static async sendPasswordResetEmail({ user, code }) {
    if (!user.email) {
      throw new Error("Email belum terdaftar untuk akun ini");
    }

    const subject = "Kode Reset Password Bhumi Satya";
    const text = `Kode reset password Bhumi Satya Anda: ${code}. Kode berlaku 10 menit. Abaikan pesan ini jika Anda tidak meminta reset password.`;
    const mailConfig = getMailConfig();
    const transporter = getSmtpTransporter();

    if (!transporter) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("SMTP belum dikonfigurasi");
      }
      console.log(`[DEV RESET PASSWORD EMAIL] ${user.email}: ${code}`);
      return;
    }

    await transporter.sendMail({
      from: mailConfig.from,
      to: user.email,
      subject,
      text,
    });
  }

  static async sendWhatsApp({ user, code }) {
    const to = normalizeWhatsAppNumber(user.no_telepon);
    if (!to) {
      throw new Error("Nomor WhatsApp belum terdaftar untuk akun ini");
    }

    const message = `Kode OTP login Bhumi Satya Anda: ${code}. Kode berlaku 5 menit. Abaikan pesan ini jika Anda tidak sedang login.`;

    if (!process.env.WHATSAPP_API_URL) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("Provider WhatsApp belum dikonfigurasi");
      }
      console.log(`[DEV OTP WHATSAPP] ${to}: ${code}`);
      return;
    }

    const response = await fetch(process.env.WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.WHATSAPP_API_TOKEN
          ? { Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({ to, message }),
    });

    if (!response.ok) {
      throw new Error("Gagal mengirim OTP WhatsApp");
    }
  }
}

export default LoginOtpService;
