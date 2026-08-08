const COMPACT_CODE_LENGTH = 20;

export const createKode3dBase = (kodeAset, assetId = null) => {
  const numericAssetId = Number(assetId);
  if (Number.isSafeInteger(numericAssetId) && numericAssetId > 0) {
    return `3D-${String(numericAssetId).padStart(6, "0")}`;
  }

  const normalized = String(kodeAset || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!normalized) {
    throw new Error("Kode bangunan diperlukan untuk membuat kode 3D");
  }

  return `3D-${normalized}`.slice(0, COMPACT_CODE_LENGTH).replace(/-+$/g, "");
};

export const createKode3dCandidate = (kodeAset, sequence = 1, assetId = null) => {
  const base = createKode3dBase(kodeAset, assetId);
  if (sequence <= 1) return base;
  const suffix = `-${sequence}`;
  return `${base.slice(0, 40 - suffix.length)}${suffix}`;
};
