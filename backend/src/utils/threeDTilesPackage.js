import path from "node:path";
import { unzipSync } from "fflate";

const MAX_ENTRY_COUNT = 5000;
const MAX_UNCOMPRESSED_BYTES = 500 * 1024 * 1024;
const EARTH_MIN_RADIUS_M = 5_000_000;
const EARTH_MAX_RADIUS_M = 8_000_000;
const decoder = new TextDecoder("utf-8");
const posix = path.posix;

export class ThreeDTilesPackageValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ThreeDTilesPackageValidationError";
  }
}

const normalizeEntryPath = (value) => {
  const raw = String(value || "").replaceAll("\\", "/").replace(/^\.\/+/, "");
  if (
    !raw
    || raw.includes("\0")
    || raw.startsWith("/")
    || /^[a-z]:/i.test(raw)
    || raw.split("/").includes("..")
  ) {
    throw new ThreeDTilesPackageValidationError(`Path arsip tidak aman: ${value || "(kosong)"}`);
  }
  return posix.normalize(raw);
};

const decodeContentUri = (uri) => {
  try {
    return decodeURIComponent(uri.split(/[?#]/, 1)[0]);
  } catch {
    throw new ThreeDTilesPackageValidationError(
      `URI pada tileset tidak dapat dibaca: ${uri}`,
    );
  }
};

const contentUris = (tile, output = []) => {
  if (!tile || typeof tile !== "object") return output;
  const contents = [
    ...(tile.content ? [tile.content] : []),
    ...(Array.isArray(tile.contents) ? tile.contents : []),
  ];
  contents.forEach((content) => {
    const uri = content?.uri || content?.url;
    if (uri) output.push(String(uri));
  });
  (tile.children || []).forEach((child) => contentUris(child, output));
  return output;
};

const applyTransform = (point, transform) => {
  if (!Array.isArray(transform) || transform.length !== 16) return point;
  const [x, y, z] = point;
  const w = transform[3] * x + transform[7] * y + transform[11] * z + transform[15];
  const divisor = Number.isFinite(w) && w !== 0 ? w : 1;
  return [
    (transform[0] * x + transform[4] * y + transform[8] * z + transform[12]) / divisor,
    (transform[1] * x + transform[5] * y + transform[9] * z + transform[13]) / divisor,
    (transform[2] * x + transform[6] * y + transform[10] * z + transform[14]) / divisor,
  ];
};

const applyDirectionTransform = (vector, transform) => {
  if (!Array.isArray(transform) || transform.length !== 16) return vector;
  const [x, y, z] = vector;
  return [
    transform[0] * x + transform[4] * y + transform[8] * z,
    transform[1] * x + transform[5] * y + transform[9] * z,
    transform[2] * x + transform[6] * y + transform[10] * z,
  ];
};

const resolveWorldBoundingVolume = (tile) => {
  const volume = tile?.boundingVolume;
  if (Array.isArray(volume?.region)) return { region: [...volume.region] };
  if (Array.isArray(volume?.box) && volume.box.length >= 12) {
    return {
      box: [
        ...applyTransform(volume.box.slice(0, 3).map(Number), tile.transform),
        ...applyDirectionTransform(volume.box.slice(3, 6).map(Number), tile.transform),
        ...applyDirectionTransform(volume.box.slice(6, 9).map(Number), tile.transform),
        ...applyDirectionTransform(volume.box.slice(9, 12).map(Number), tile.transform),
      ],
    };
  }
  if (Array.isArray(volume?.sphere) && volume.sphere.length >= 4) {
    const scales = [0, 4, 8].map((offset) => Math.hypot(
      Number(tile.transform?.[offset] ?? (offset === 0 ? 1 : 0)),
      Number(tile.transform?.[offset + 1] ?? (offset === 4 ? 1 : 0)),
      Number(tile.transform?.[offset + 2] ?? (offset === 8 ? 1 : 0)),
    ));
    return {
      sphere: [
        ...applyTransform(volume.sphere.slice(0, 3).map(Number), tile.transform),
        Number(volume.sphere[3]) * Math.max(...scales),
      ],
    };
  }
  return null;
};

const ecefToGeodetic = ([x, y, z]) => {
  const distance = Math.hypot(x, y, z);
  if (distance < EARTH_MIN_RADIUS_M || distance > EARTH_MAX_RADIUS_M) return null;
  const semiMajor = 6378137;
  const eccentricitySquared = 6.69437999014e-3;
  const longitude = Math.atan2(y, x);
  const horizontal = Math.hypot(x, y);
  let latitude = Math.atan2(z, horizontal * (1 - eccentricitySquared));
  let altitude = 0;
  for (let index = 0; index < 6; index += 1) {
    const sinLatitude = Math.sin(latitude);
    const normalRadius = semiMajor
      / Math.sqrt(1 - eccentricitySquared * sinLatitude * sinLatitude);
    altitude = horizontal / Math.cos(latitude) - normalRadius;
    latitude = Math.atan2(
      z,
      horizontal * (1 - (eccentricitySquared * normalRadius) / (normalRadius + altitude)),
    );
  }
  return {
    latitude: latitude * 180 / Math.PI,
    longitude: longitude * 180 / Math.PI,
    altitudeM: altitude,
  };
};

const resolveBoundingVolumeCenter = (tile) => {
  const volume = tile?.boundingVolume;
  if (Array.isArray(volume?.region) && volume.region.length >= 6) {
    const center = {
      longitude: ((Number(volume.region[0]) + Number(volume.region[2])) / 2) * 180 / Math.PI,
      latitude: ((Number(volume.region[1]) + Number(volume.region[3])) / 2) * 180 / Math.PI,
      altitudeM: (Number(volume.region[4]) + Number(volume.region[5])) / 2,
    };
    return Math.abs(center.latitude) <= 90 && Math.abs(center.longitude) <= 180
      ? center
      : null;
  }
  const center = Array.isArray(volume?.sphere) && volume.sphere.length >= 3
    ? volume.sphere.slice(0, 3).map(Number)
    : Array.isArray(volume?.box) && volume.box.length >= 3
      ? volume.box.slice(0, 3).map(Number)
      : null;
  if (!center?.every(Number.isFinite)) return null;
  return ecefToGeodetic(applyTransform(center, tile.transform));
};

const validateTilesetDocument = (document, tilesetPath, files, visited) => {
  if (!document || typeof document !== "object" || Array.isArray(document)) {
    throw new ThreeDTilesPackageValidationError(`${tilesetPath} bukan JSON object`);
  }
  if (!document.asset?.version || !document.root?.boundingVolume) {
    throw new ThreeDTilesPackageValidationError(
      `${tilesetPath} harus memiliki asset.version dan root.boundingVolume`,
    );
  }
  if (visited.has(tilesetPath)) return;
  visited.add(tilesetPath);

  const baseDirectory = posix.dirname(tilesetPath);
  for (const uri of contentUris(document.root)) {
    if (/^(?:https?:|data:|blob:|\/\/)/i.test(uri)) {
      throw new ThreeDTilesPackageValidationError(
        `Referensi eksternal tidak diizinkan dalam paket: ${uri}`,
      );
    }
    const cleanUri = decodeContentUri(uri);
    if (cleanUri.includes("{") || cleanUri.includes("}")) {
      throw new ThreeDTilesPackageValidationError(
        `Template implicit tiling belum didukung: ${uri}`,
      );
    }
    const resolved = normalizeEntryPath(posix.join(baseDirectory, cleanUri));
    if (!files.has(resolved)) {
      throw new ThreeDTilesPackageValidationError(
        `File yang dirujuk tileset tidak ditemukan: ${resolved}`,
      );
    }
    if (posix.extname(resolved).toLowerCase() === ".json") {
      let nestedTileset;
      try {
        nestedTileset = JSON.parse(decoder.decode(files.get(resolved)));
      } catch {
        throw new ThreeDTilesPackageValidationError(
          `Tileset turunan tidak berisi JSON yang valid: ${resolved}`,
        );
      }
      validateTilesetDocument(nestedTileset, resolved, files, visited);
    }
  }
};

export const contentTypeFor3dTile = (filename) => {
  const extension = posix.extname(filename).toLowerCase();
  return {
    ".json": "application/json",
    ".glb": "model/gltf-binary",
    ".gltf": "model/gltf+json",
    ".b3dm": "application/octet-stream",
    ".i3dm": "application/octet-stream",
    ".pnts": "application/octet-stream",
    ".cmpt": "application/octet-stream",
    ".bin": "application/octet-stream",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".ktx2": "image/ktx2",
  }[extension] || "application/octet-stream";
};

export const inspectThreeDTilesPackage = (buffer) => {
  if (!Buffer.isBuffer(buffer) && !(buffer instanceof Uint8Array)) {
    throw new ThreeDTilesPackageValidationError("Isi ZIP 3D Tiles tidak valid");
  }

  let entryCount = 0;
  let uncompressedBytes = 0;
  let rawEntries;
  try {
    rawEntries = unzipSync(new Uint8Array(buffer), {
      filter: (file) => {
        entryCount += 1;
        uncompressedBytes += Number(file.originalSize || 0);
        if (entryCount > MAX_ENTRY_COUNT) {
          throw new ThreeDTilesPackageValidationError(
            `Paket melebihi batas ${MAX_ENTRY_COUNT} file`,
          );
        }
        if (uncompressedBytes > MAX_UNCOMPRESSED_BYTES) {
          throw new ThreeDTilesPackageValidationError(
            "Ukuran paket setelah diekstrak melebihi 500 MB",
          );
        }
        return true;
      },
    });
  } catch (error) {
    if (error instanceof ThreeDTilesPackageValidationError) throw error;
    throw new ThreeDTilesPackageValidationError("File bukan arsip ZIP yang dapat dibaca");
  }

  const files = new Map();
  Object.entries(rawEntries).forEach(([rawName, content]) => {
    if (rawName.endsWith("/") || rawName.endsWith("\\")) return;
    const name = normalizeEntryPath(rawName);
    files.set(name, Buffer.from(content));
  });
  const names = [...files.keys()];
  const tilesetCandidates = names.filter((name) => posix.basename(name).toLowerCase() === "tileset.json");
  if (tilesetCandidates.length === 0) {
    throw new ThreeDTilesPackageValidationError("Paket tidak memiliki file tileset.json");
  }
  const rootTilesetPath = tilesetCandidates
    .sort((left, right) => left.split("/").length - right.split("/").length)[0];

  let tileset;
  try {
    tileset = JSON.parse(decoder.decode(files.get(rootTilesetPath)));
  } catch {
    throw new ThreeDTilesPackageValidationError("tileset.json tidak berisi JSON yang valid");
  }
  validateTilesetDocument(tileset, rootTilesetPath, files, new Set());
  const boundingCenter = resolveBoundingVolumeCenter(tileset.root);
  if (
    !boundingCenter
    || !Number.isFinite(boundingCenter.latitude)
    || !Number.isFinite(boundingCenter.longitude)
  ) {
    throw new ThreeDTilesPackageValidationError(
      "Paket 3D Tiles belum memiliki georeferensi bumi yang dapat dibaca. Gunakan GLB untuk model lokal atau ekspor ulang 3D Tiles dengan region/transform ECEF.",
    );
  }

  return {
    files,
    manifest: {
      format: "3DTILES",
      modelEntry: rootTilesetPath,
      modelType: "3DTILES",
      entryCount: files.size,
      uncompressedBytes,
      assetVersion: String(tileset.asset.version),
      geometricError: Number(tileset.geometricError) || 0,
      source: "direct-3d-tiles-zip",
      preGeoreferenced: true,
      rootBoundingVolume: resolveWorldBoundingVolume(tileset.root),
      sourceRootBoundingVolume: tileset.root.boundingVolume,
      sourceRootTransform: tileset.root.transform || null,
      boundingCenter,
    },
  };
};
