/**
 * Asset-related utility functions
 * Shared across LandingPage, LoginPage, and other asset-related components
 */

export const CERTIFICATE_COLORS = {
  certified: { color: "#0ea5e9", stroke: "#0369a1" },
  uncertified: { color: "#ef4444", stroke: "#b91c1c" },
  unknown: { color: "#9ca3af", stroke: "#6b7280" },
};

/**
 * Check if asset is certified based on certificate status
 * @param {Object} asset - Asset object
 * @returns {boolean|null} true if certified, false if uncertified, null if unknown
 */
export function isAssetCertified(asset) {
  if (!asset) return null;

  const status = (
    asset.status_sertifikat ||
    asset.statusSertifikat ||
    asset["STATUS SERTIFIKAT"] ||
    ""
  )
    .toString()
    .toLowerCase();

  if (status.includes("belum") || status.includes("tidak")) {
    return false;
  }

  if (
    status.includes("sudah") ||
    status.includes("telah") ||
    status.includes("bersertifikat")
  ) {
    return true;
  }

  // Fallback: check certificate number length
  const certNumber = (
    asset.nomor_sertifikat ||
    asset.nomorSertifikat ||
    asset["NOMOR HAK"] ||
    ""
  ).trim();

  return certNumber.length > 10 ? true : null;
}

/**
 * Get certificate configuration (colors, styles) based on asset certification status
 * @param {Object} asset - Asset object
 * @returns {Object} Certificate config with color and stroke
 */
export function getCertificateConfig(asset) {
  const certified = isAssetCertified(asset);

  if (certified === true) return CERTIFICATE_COLORS.certified;
  if (certified === false) return CERTIFICATE_COLORS.uncertified;
  return CERTIFICATE_COLORS.unknown;
}

/**
 * Get asset latitude and longitude
 * @param {Object} asset - Asset object
 * @returns {Array|null} [lat, lng] array or null if invalid
 */
export function getAssetLatLng(asset = {}) {
  if (!asset) return null;

  const lat = Number(asset.latitude ?? asset.lat);
  const lng = Number(asset.longitude ?? asset.lng);

  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
}

/**
 * Get certificate label text
 * @param {Object} asset - Asset object
 * @returns {string} Certificate status label
 */
export function getCertificateLabel(asset) {
  const certified = isAssetCertified(asset);

  if (certified === true) return "Bersertifikat";
  if (certified === false) return "Belum Bersertifikat";
  return "Status Tidak Diketahui";
}

/**
 * Get badge class for certificate status
 * @param {Object} asset - Asset object
 * @returns {string} Tailwind CSS classes for badge
 */
export function getCertificateBadgeClass(asset) {
  const certified = isAssetCertified(asset);

  if (certified === true) {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
  }
  if (certified === false) {
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  }
  return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
}
