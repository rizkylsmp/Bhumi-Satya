import { fromArrayBuffer } from "geotiff";
import proj4 from "proj4";
import sharp from "sharp";

const WGS84 = "+proj=longlat +datum=WGS84 +no_defs";

const parseEpsg = (value) => {
  const match = String(value || "").match(/(?:EPSG\s*:\s*)?(\d{4,6})/i);
  return match ? Number(match[1]) : null;
};

const projectionDefinition = (epsg) => {
  if (epsg === 4326) return WGS84;
  if (epsg >= 32601 && epsg <= 32660) {
    return `+proj=utm +zone=${epsg - 32600} +datum=WGS84 +units=m +no_defs`;
  }
  if (epsg >= 32701 && epsg <= 32760) {
    return `+proj=utm +zone=${epsg - 32700} +south +datum=WGS84 +units=m +no_defs`;
  }
  return null;
};

export const normalizeBounds = (values) => {
  const bounds = {
    west: Number(values?.west),
    south: Number(values?.south),
    east: Number(values?.east),
    north: Number(values?.north),
  };
  if (!Object.values(bounds).every(Number.isFinite)) return null;
  if (
    bounds.west < -180 || bounds.east > 180
    || bounds.south < -90 || bounds.north > 90
    || bounds.west >= bounds.east || bounds.south >= bounds.north
  ) {
    return null;
  }
  return bounds;
};

export const transformBoundsToWgs84 = (bbox, epsg) => {
  if (!Array.isArray(bbox) || bbox.length !== 4) return null;
  const definition = projectionDefinition(Number(epsg));
  if (!definition) return null;
  const [minX, minY, maxX, maxY] = bbox.map(Number);
  if (![minX, minY, maxX, maxY].every(Number.isFinite)) return null;
  const corners = [
    [minX, minY],
    [minX, maxY],
    [maxX, minY],
    [maxX, maxY],
  ].map((point) => proj4(definition, WGS84, point));
  return normalizeBounds({
    west: Math.min(...corners.map(([longitude]) => longitude)),
    south: Math.min(...corners.map(([, latitude]) => latitude)),
    east: Math.max(...corners.map(([longitude]) => longitude)),
    north: Math.max(...corners.map(([, latitude]) => latitude)),
  });
};

export const inspectOrthophoto = async (buffer, supplied = {}) => {
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  );
  const tiff = await fromArrayBuffer(arrayBuffer);
  const image = await tiff.getImage();
  const geoKeys = image.getGeoKeys() || {};
  const detectedEpsg = Number(
    geoKeys.ProjectedCSTypeGeoKey || geoKeys.GeographicTypeGeoKey,
  ) || parseEpsg(supplied.sourceCrs);
  const manualBounds = normalizeBounds(supplied.bounds);
  const detectedBounds = transformBoundsToWgs84(
    image.getBoundingBox(),
    detectedEpsg,
  );
  const bounds = manualBounds || detectedBounds;
  if (!bounds) {
    throw new Error(
      "CRS GeoTIFF belum dapat dikenali. Isi batas barat, selatan, timur, dan utara dalam WGS84.",
    );
  }
  return {
    bounds,
    sourceCrs: supplied.sourceCrs?.trim()
      || (detectedEpsg ? `EPSG:${detectedEpsg}` : "WGS84"),
    width: image.getWidth(),
    height: image.getHeight(),
  };
};

export const createOrthophotoPreview = async (buffer) =>
  sharp(buffer, { limitInputPixels: false })
    .resize({
      width: 8192,
      height: 8192,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 88, effort: 4 })
    .toBuffer({ resolveWithObject: true });
