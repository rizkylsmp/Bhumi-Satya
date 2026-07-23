export const createKode3dBase = (kodeAset) => {
  const normalized = String(kodeAset || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!normalized) {
    throw new Error("Kode aset diperlukan untuk membuat kode 3D");
  }

  return `3D-${normalized}`.slice(0, 36).replace(/-+$/g, "");
};

export const createKode3dCandidate = (kodeAset, sequence = 1) => {
  const base = createKode3dBase(kodeAset);
  if (sequence <= 1) return base;
  const suffix = `-${sequence}`;
  return `${base.slice(0, 40 - suffix.length)}${suffix}`;
};
