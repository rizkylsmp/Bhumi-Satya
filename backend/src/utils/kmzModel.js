import { unzipSync } from "fflate";

const MAX_ENTRY_COUNT = 500;
const MAX_UNCOMPRESSED_BYTES = 80 * 1024 * 1024;
const textDecoder = new TextDecoder("utf-8");

export class KmzValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "KmzValidationError";
  }
}

const decodeXmlEntities = (value = "") =>
  value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");

const getTagValue = (xml, tag) => {
  const match = xml.match(new RegExp(`<(?:[a-z]+:)?${tag}\\b[^>]*>([\\s\\S]*?)<\\/(?:[a-z]+:)?${tag}>`, "i"));
  return match ? decodeXmlEntities(match[1].trim()) : null;
};

const getSection = (xml, tag) => {
  const match = xml.match(new RegExp(`<(?:[a-z]+:)?${tag}\\b[^>]*>([\\s\\S]*?)<\\/(?:[a-z]+:)?${tag}>`, "i"));
  return match?.[1] || "";
};

const optionalNumber = (value) => {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeEntryName = (value) =>
  String(value || "")
    .replaceAll("\\", "/")
    .replace(/^\.\//, "")
    .replace(/^\//, "");

export const assessKmzModelLocation = ({ assetLat, assetLng, modelLat, modelLng }) => {
  const rawValues = [assetLat, assetLng, modelLat, modelLng];
  if (rawValues.some((value) => value === null || value === undefined || String(value).trim() === "")) {
    return { status: "unverified", message: "Lokasi aset belum tersedia untuk pemeriksaan jarak model" };
  }
  const values = rawValues.map(Number);
  if (!values.every(Number.isFinite)) {
    return { status: "unverified", message: "Lokasi aset belum tersedia untuk pemeriksaan jarak model" };
  }
  const [aLat, aLng, bLat, bLng] = values.map((value) => value * Math.PI / 180);
  const deltaLat = bLat - aLat;
  const deltaLng = bLng - aLng;
  const haversine = Math.sin(deltaLat / 2) ** 2
    + Math.cos(aLat) * Math.cos(bLat) * Math.sin(deltaLng / 2) ** 2;
  const distanceM = 6371000 * 2
    * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return distanceM > 500
    ? {
        status: "warning",
        distanceM: Math.round(distanceM),
        message: `Lokasi model berjarak ${(distanceM / 1000).toFixed(2)} km dari titik aset`,
      }
    : {
        status: "ok",
        distanceM: Math.round(distanceM),
        message: `Lokasi model berada ${Math.round(distanceM)} m dari titik aset`,
      };
};

export const inspectKmzModel = (buffer) => {
  if (!Buffer.isBuffer(buffer) && !(buffer instanceof Uint8Array)) {
    throw new KmzValidationError("Isi file KMZ tidak valid");
  }

  let entryCount = 0;
  let uncompressedBytes = 0;
  let entries;
  try {
    entries = unzipSync(new Uint8Array(buffer), {
      filter: (file) => {
        entryCount += 1;
        uncompressedBytes += Number(file.originalSize || 0);
        if (entryCount > MAX_ENTRY_COUNT) {
          throw new KmzValidationError(`KMZ melebihi batas ${MAX_ENTRY_COUNT} entri`);
        }
        if (uncompressedBytes > MAX_UNCOMPRESSED_BYTES) {
          throw new KmzValidationError("Ukuran isi KMZ setelah diekstrak melebihi 80 MB");
        }
        return true;
      },
    });
  } catch (error) {
    if (error instanceof KmzValidationError) throw error;
    throw new KmzValidationError("File bukan arsip KMZ/ZIP yang dapat dibaca");
  }

  const names = Object.keys(entries).map(normalizeEntryName);
  const kmlEntry = names.find((name) => name.toLowerCase() === "doc.kml")
    || names.find((name) => name.toLowerCase().endsWith(".kml"));
  if (!kmlEntry) throw new KmzValidationError("KMZ tidak memiliki file KML");

  const rawKmlEntry = Object.keys(entries).find(
    (name) => normalizeEntryName(name) === kmlEntry,
  );
  const kml = textDecoder.decode(entries[rawKmlEntry]);
  const modelSection = getSection(kml, "Model");
  if (!modelSection) throw new KmzValidationError("KML tidak memiliki elemen Model");

  const location = getSection(modelSection, "Location");
  const orientation = getSection(modelSection, "Orientation");
  const scale = getSection(modelSection, "Scale");
  const link = getSection(modelSection, "Link");
  const modelEntry = normalizeEntryName(getTagValue(link, "href"));
  if (!modelEntry || !names.includes(modelEntry)) {
    throw new KmzValidationError("Model yang dirujuk KML tidak ditemukan di dalam KMZ");
  }

  const extension = modelEntry.split(".").pop()?.toLowerCase();
  const supportedModelTypes = new Set(["dae", "glb", "gltf"]);
  if (!supportedModelTypes.has(extension)) {
    throw new KmzValidationError(`Format model .${extension || "?"} di dalam KMZ belum didukung`);
  }

  const latitude = optionalNumber(getTagValue(location, "latitude"));
  const longitude = optionalNumber(getTagValue(location, "longitude"));
  if (latitude === null || longitude === null || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    throw new KmzValidationError("Lokasi latitude/longitude model pada KML tidak valid");
  }

  return {
    format: "KMZ",
    kmlEntry,
    modelEntry,
    modelType: extension.toUpperCase(),
    latitude,
    longitude,
    altitudeM: optionalNumber(getTagValue(location, "altitude")) || 0,
    altitudeMode: getTagValue(modelSection, "altitudeMode") || "relativeToGround",
    heading: optionalNumber(getTagValue(orientation, "heading")) || 0,
    tilt: optionalNumber(getTagValue(orientation, "tilt")) || 0,
    roll: optionalNumber(getTagValue(orientation, "roll")) || 0,
    scaleX: optionalNumber(getTagValue(scale, "x")) ?? 1,
    scaleY: optionalNumber(getTagValue(scale, "y")) ?? 1,
    scaleZ: optionalNumber(getTagValue(scale, "z")) ?? 1,
    entryCount: names.length,
    uncompressedBytes,
    entries: names.map((name) => ({
      name,
      size: entries[Object.keys(entries).find((rawName) => normalizeEntryName(rawName) === name)]?.length || 0,
    })),
  };
};
