const SKIPPED_NESTED_KEYS = new Set([
  "polygon",
  "polygon_bidang",
  "geometry",
  "coordinates",
  "converted_public_url",
  "public_url",
  "original_public_url",
  "signed_url",
]);

const FIELD_LABELS = {
  id: "ID",
  id_aset: "ID Aset",
  id_model_3d: "ID Model 3D",
  kode_aset: "Kode Aset",
  kode_2d: "Kode 2D",
  kode_3d: "Kode 3D",
  nama_aset: "Nama Aset",
  building_name: "Nama Bangunan",
  building_name_3d: "Nama Bangunan 3D",
  jenis_aset: "Jenis Aset",
  status: "Status",
  status_sertifikat: "Status Sertifikat",
  nomor_sertifikat: "Nomor Sertifikat",
  jenis_hak: "Jenis Hak",
  lokasi: "Lokasi",
  kecamatan: "Kecamatan",
  desa_kelurahan: "Kelurahan",
  opd_pengguna: "OPD Pengguna",
  penggunaan_saat_ini: "Penggunaan",
  nibar: "NIBAR",
  nib: "NIB",
  nop: "NOP",
  latitude: "Latitude",
  longitude: "Longitude",
  location_lat: "Latitude Model",
  location_long: "Longitude Model",
  lod: "LOD",
  model_type: "Jenis Model",
  format: "Format Model",
  conversion_status: "Status Konversi",
  review_status: "Status Verifikasi",
  sumber: "Sumber Data",
  tahun: "Tahun",
  tahun_perolehan: "Tahun Perolehan",
};

export function normalizeMapSearchText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("id")
    .trim();
}

function humanizeFieldName(key) {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return String(key || "Data")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function buildMapSearchEntries(record, maxEntries = 250) {
  const entries = [];
  const seenObjects = new WeakSet();
  const seenValues = new Set();

  const visit = (value, key = "data", depth = 0) => {
    if (entries.length >= maxEntries || value === null || value === undefined) return;
    if (depth > 5) return;

    if (["string", "number", "boolean"].includes(typeof value)) {
      const displayValue = String(value).trim();
      if (!displayValue) return;
      const label = humanizeFieldName(key);
      const signature = `${label}:${displayValue}`;
      if (seenValues.has(signature)) return;
      seenValues.add(signature);
      entries.push({
        key,
        label,
        value: displayValue,
        normalizedValue: normalizeMapSearchText(displayValue),
      });
      return;
    }

    if (typeof value !== "object" || seenObjects.has(value)) return;
    seenObjects.add(value);

    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, key, depth + 1));
      return;
    }

    Object.entries(value).forEach(([childKey, childValue]) => {
      if (SKIPPED_NESTED_KEYS.has(childKey)) return;
      visit(childValue, childKey, depth + 1);
    });
  };

  visit(record);
  return entries;
}

export function searchMapRecords(records = [], query = "") {
  const normalizedQuery = normalizeMapSearchText(query);
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);

  return records.reduce((results, record) => {
    const entries = buildMapSearchEntries(record);
    const haystack = entries
      .map((entry) => `${normalizeMapSearchText(entry.label)} ${entry.normalizedValue}`)
      .join(" ");
    if (terms.length > 0 && !terms.every((term) => haystack.includes(term))) {
      return results;
    }

    const matches = terms.length === 0
      ? []
      : entries
          .filter((entry) => terms.some((term) =>
            entry.normalizedValue.includes(term)
            || normalizeMapSearchText(entry.label).includes(term)))
          .sort((left, right) => {
            const leftExact = left.normalizedValue === normalizedQuery ? 1 : 0;
            const rightExact = right.normalizedValue === normalizedQuery ? 1 : 0;
            return rightExact - leftExact;
          })
          .slice(0, 4);

    results.push({ record, matches });
    return results;
  }, []);
}

export function splitMapSearchHighlight(text, query) {
  const source = String(text ?? "");
  const terms = normalizeMapSearchText(query).split(/\s+/).filter(Boolean);
  if (!source || terms.length === 0) return [{ text: source, highlighted: false }];

  const escapedTerms = terms
    .sort((left, right) => right.length - left.length)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escapedTerms.join("|")})`, "gi");
  return source.split(pattern).filter(Boolean).map((part) => ({
    text: part,
    highlighted: terms.includes(normalizeMapSearchText(part)),
  }));
}
