/**
 * Format date ke format Indonesia
 * @param {string|Date} date - Date string atau Date object
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}) {
  if (!date) return "-";

  const defaultOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  };

  try {
    return new Intl.DateTimeFormat("id-ID", defaultOptions).format(new Date(date));
  } catch (error) {
    console.warn("Invalid date:", date);
    return "-";
  }
}

/**
 * Format currency ke format Rupiah
 * @param {number} amount - Jumlah uang
 * @param {boolean} showSymbol - Tampilkan simbol Rp (default: true)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, showSymbol = true) {
  if (amount === null || amount === undefined || isNaN(amount)) return "-";

  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return showSymbol ? `Rp ${formatted}` : formatted;
}

/**
 * Format number dengan separator ribuan Indonesia
 * @param {number} value - Nilai angka
 * @param {number} decimals - Jumlah desimal (default: 0)
 * @returns {string} Formatted number string
 */
export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || isNaN(value)) return "-";

  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format datetime lengkap (tanggal + waktu)
 * @param {string|Date} datetime - Datetime string atau Date object
 * @returns {string} Formatted datetime string
 */
export function formatDateTime(datetime) {
  return formatDate(datetime, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format relative time (berapa waktu yang lalu)
 * @param {string|Date} date - Date string atau Date object
 * @returns {string} Relative time string (e.g., "2 jam yang lalu")
 */
export function formatRelativeTime(date) {
  if (!date) return "-";

  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now - targetDate) / 1000);

  if (diffInSeconds < 60) return "baru saja";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} bulan yang lalu`;
  return `${Math.floor(diffInSeconds / 31536000)} tahun yang lalu`;
}
