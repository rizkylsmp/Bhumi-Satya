const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const safeParseJson = (value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

const isSamePoint = (a, b) =>
  Array.isArray(a) &&
  Array.isArray(b) &&
  Math.abs(Number(a[0]) - Number(b[0])) < 1e-9 &&
  Math.abs(Number(a[1]) - Number(b[1])) < 1e-9;

const ensureClosedRing = (ring) => {
  if (!Array.isArray(ring) || ring.length < 3) return null;
  const closed = [...ring];
  if (!isSamePoint(closed[0], closed[closed.length - 1])) {
    closed.push([...closed[0]]);
  }
  return closed;
};

const createCoordinateError = () => {
  const error = new Error(
    "Koordinat GeoJSON harus menggunakan CRS WGS84 (EPSG:4326)",
  );
  error.code = "INVALID_GEOJSON_COORDINATES";
  return error;
};

const getEpsgCode = (geojson) => {
  const crsName =
    geojson?.crs?.properties?.name ||
    geojson?.crs?.name ||
    geojson?.properties?.crs;
  const match = String(crsName || "").match(/EPSG(?::|::)(\d+)/i);
  return match ? Number(match[1]) : 4326;
};

const createCoordinateTransformer = async (geojson) => {
  const epsgCode = getEpsgCode(geojson);
  if (epsgCode === 4326) return null;

  const isNorthernUtm = epsgCode >= 32601 && epsgCode <= 32660;
  const isSouthernUtm = epsgCode >= 32701 && epsgCode <= 32760;
  if (!isNorthernUtm && !isSouthernUtm && epsgCode !== 3857) {
    const error = new Error(`CRS EPSG:${epsgCode} belum didukung`);
    error.code = "UNSUPPORTED_GEOJSON_CRS";
    throw error;
  }

  const sourceCrs =
    epsgCode === 3857
      ? "EPSG:3857"
      : [
          "+proj=utm",
          `+zone=${epsgCode % 100}`,
          isSouthernUtm ? "+south" : "",
          "+datum=WGS84",
          "+units=m",
          "+no_defs",
        ]
          .filter(Boolean)
          .join(" ");

  const { default: proj4 } = await import("proj4");
  return (coordinate) => proj4(sourceCrs, "EPSG:4326", coordinate);
};

const normalizeLngLatPoint = (point, transformCoordinate = null) => {
  if (Array.isArray(point) && point.length >= 2) {
    const first = toNumber(point[0]);
    const second = toNumber(point[1]);
    if (first === null || second === null) return null;

    if (transformCoordinate) {
      const [lng, lat] = transformCoordinate([first, second]);
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        Math.abs(lat) > 90 ||
        Math.abs(lng) > 180
      ) {
        throw createCoordinateError();
      }
      return [lng, lat];
    }

    // Bhumi Satya form polygons are stored as [lat, lng]. GeoJSON uses [lng, lat].
    const isGeojsonOrder = Math.abs(first) <= 180 && Math.abs(second) <= 90;
    const isFormOrder = Math.abs(first) <= 90 && Math.abs(second) <= 180;

    if (isGeojsonOrder && !isFormOrder) return [first, second];
    if (isFormOrder && !isGeojsonOrder) return [second, first];
    if (isGeojsonOrder) return [first, second];

    throw createCoordinateError();
  }

  const lat = toNumber(point?.lat ?? point?.latitude);
  const lng = toNumber(point?.lng ?? point?.longitude);
  if (lat === null || lng === null) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    throw createCoordinateError();
  }
  return [lng, lat];
};

const extractPolygonPoints = (data, transformCoordinate) => {
  if (!data) return null;

  if (data.type === "FeatureCollection") {
    const polygonFeature = data.features?.find((feature) =>
      ["Polygon", "MultiPolygon"].includes(feature?.geometry?.type),
    );
    return extractPolygonPoints(polygonFeature, transformCoordinate);
  }

  if (data.type === "Feature") {
    return extractPolygonPoints(data.geometry, transformCoordinate);
  }

  let ring = null;
  if (data.type === "Polygon") {
    ring = data.coordinates?.[0];
  } else if (data.type === "MultiPolygon") {
    ring = data.coordinates?.[0]?.[0];
  } else if (Array.isArray(data.coordinates)) {
    ring = data.coordinates?.[0];
  } else if (Array.isArray(data)) {
    ring = Array.isArray(data[0]?.[0]) ? data[0] : data;
  }

  const points = (ring || [])
    .map((coord) => {
      const normalized = normalizeLngLatPoint(coord, transformCoordinate);
      if (!normalized) return null;
      return [normalized[1], normalized[0]];
    })
    .filter(Boolean);

  if (points.length > 1 && isSamePoint(points[0], points[points.length - 1])) {
    points.pop();
  }
  return points.length >= 3 ? points : null;
};

export const extractGeojsonPolygonPoints = async (geojson) => {
  const data = safeParseJson(geojson);
  const transformCoordinate = await createCoordinateTransformer(data);
  return extractPolygonPoints(data, transformCoordinate);
};

export const normalizePolygonToGeometry = (polygon) => {
  const data = safeParseJson(polygon);
  if (!data) return null;

  if (data.type === "FeatureCollection") {
    const polygonFeature = data.features?.find((feature) =>
      ["Polygon", "MultiPolygon"].includes(feature?.geometry?.type),
    );
    return normalizePolygonToGeometry(polygonFeature);
  }

  if (data.type === "Feature") {
    return normalizePolygonToGeometry(data.geometry);
  }

  if (data.type === "Polygon" && Array.isArray(data.coordinates?.[0])) {
    const ring = ensureClosedRing(data.coordinates[0]);
    if (!ring) return null;
    return {
      type: "Polygon",
      coordinates: [ring],
    };
  }

  if (data.type === "MultiPolygon" && Array.isArray(data.coordinates)) {
    return data;
  }

  const rawRing = Array.isArray(data?.coordinates?.[0])
    ? data.coordinates[0]
    : Array.isArray(data?.[0]?.[0])
      ? data[0]
      : Array.isArray(data)
        ? data
        : null;

  const ring = (rawRing || []).map(normalizeLngLatPoint).filter(Boolean);
  const closedRing = ensureClosedRing(ring);
  return closedRing ? { type: "Polygon", coordinates: [closedRing] } : null;
};

export const buildAssetGeojsonFeature = (asset) => {
  const geometry = normalizePolygonToGeometry(
    asset?.polygon_bidang || asset?.polygon || asset?.polygon_sewa,
  );
  if (!geometry) return null;

  const properties = {
    id_aset: asset?.id_aset || asset?.id || null,
    kode_aset: asset?.kode_aset || null,
    nama_aset: asset?.nama_aset || asset?.nama || null,
    lokasi: asset?.lokasi || asset?.alamat || null,
    kecamatan: asset?.kecamatan || null,
    desa_kelurahan: asset?.desa_kelurahan || asset?.kelurahan || null,
    luas: asset?.luas || null,
    status_sertifikat: asset?.status_sertifikat || null,
    nomor_sertifikat: asset?.nomor_sertifikat || asset?.nomor_hak || null,
    jenis_hak: asset?.jenis_hak || null,
    opd_pengguna: asset?.opd_pengguna || asset?.opd || null,
  };

  return {
    type: "Feature",
    properties,
    geometry,
  };
};

const sanitizeFilename = (value) =>
  String(value || "aset")
    .trim()
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

export const downloadGeojson = (filename, geojson) => {
  const blob = new Blob([JSON.stringify(geojson, null, 2)], {
    type: "application/geo+json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".geojson") ? filename : `${filename}.geojson`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadAssetGeojson = (asset) => {
  const feature = buildAssetGeojsonFeature(asset);
  if (!feature) return false;

  const key =
    asset?.kode_aset || asset?.nibar || asset?.id_aset || asset?.id || "aset";
  downloadGeojson(`aset-${sanitizeFilename(key)}`, feature);
  return true;
};
