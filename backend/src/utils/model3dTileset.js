const EARTH_RADIUS_M = 6378137;
const WGS84_E2 = 6.69437999014e-3;

const toRadians = (degrees) => Number(degrees) * Math.PI / 180;

const multiplyMatrix4 = (left, right) => {
  const output = new Array(16).fill(0);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      for (let index = 0; index < 4; index += 1) {
        output[column * 4 + row] += left[index * 4 + row] * right[column * 4 + index];
      }
    }
  }
  return output;
};

const scaleMatrix = (x, y, z) => [
  x, 0, 0, 0,
  0, y, 0, 0,
  0, 0, z, 0,
  0, 0, 0, 1,
];

const rotationX = (angle) => {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return [1, 0, 0, 0, 0, cosine, sine, 0, 0, -sine, cosine, 0, 0, 0, 0, 1];
};

const rotationY = (angle) => {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return [cosine, 0, -sine, 0, 0, 1, 0, 0, sine, 0, cosine, 0, 0, 0, 0, 1];
};

const rotationZ = (angle) => {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return [cosine, sine, 0, 0, -sine, cosine, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
};

export const createEcefModelTransform = (model) => {
  const longitude = toRadians(model.location_long);
  const latitude = toRadians(model.location_lat);
  const altitude = Number(model.altitude_m) || 0;
  const sinLongitude = Math.sin(longitude);
  const cosLongitude = Math.cos(longitude);
  const sinLatitude = Math.sin(latitude);
  const cosLatitude = Math.cos(latitude);
  const normal = EARTH_RADIUS_M / Math.sqrt(1 - WGS84_E2 * sinLatitude ** 2);
  const x = (normal + altitude) * cosLatitude * cosLongitude;
  const y = (normal + altitude) * cosLatitude * sinLongitude;
  const z = (normal * (1 - WGS84_E2) + altitude) * sinLatitude;

  const eastUpSouth = [
    -sinLongitude, cosLongitude, 0, 0,
    cosLatitude * cosLongitude, cosLatitude * sinLongitude, sinLatitude, 0,
    sinLatitude * cosLongitude, sinLatitude * sinLongitude, -cosLatitude, 0,
    x, y, z, 1,
  ];
  const orientation = multiplyMatrix4(
    multiplyMatrix4(
      rotationY(-toRadians(model.heading || 0)),
      rotationX(toRadians(model.tilt || 0)),
    ),
    rotationZ(toRadians(model.roll || 0)),
  );
  const scale = scaleMatrix(
    Number(model.scale_x) || 1,
    Number(model.scale_y) || 1,
    Number(model.scale_z) || 1,
  );
  return multiplyMatrix4(eastUpSouth, multiplyMatrix4(orientation, scale));
};

const collectCoordinates = (value, output = []) => {
  if (!Array.isArray(value)) return output;
  if (value.length >= 2 && Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1]))) {
    output.push([Number(value[0]), Number(value[1])]);
    return output;
  }
  value.forEach((item) => collectCoordinates(item, output));
  return output;
};

const footprintCoordinates = (footprint) => {
  if (!footprint) return [];
  let parsed = footprint;
  if (typeof parsed === "string") {
    try { parsed = JSON.parse(parsed); } catch { return []; }
  }
  return collectCoordinates(parsed.geometry?.coordinates || parsed.coordinates || parsed);
};

const distanceMeters = (longitudeA, latitudeA, longitudeB, latitudeB) => {
  const latitudeDelta = toRadians(latitudeB - latitudeA);
  const longitudeDelta = toRadians(longitudeB - longitudeA);
  const latitudeARadians = toRadians(latitudeA);
  const latitudeBRadians = toRadians(latitudeB);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitudeARadians) * Math.cos(latitudeBRadians) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(haversine));
};

const getModelBounds = (model) => {
  const longitude = Number(model.location_long);
  const latitude = Number(model.location_lat);
  const altitude = Number(model.altitude_m) || Number(model.aset?.building_base_elevation_m) || 0;
  const footprint = footprintCoordinates(model.aset?.building_footprint);
  const footprintRadius = footprint.reduce((maximum, coordinate) => Math.max(
    maximum,
    distanceMeters(longitude, latitude, coordinate[0], coordinate[1]),
  ), 0);
  const scale = Math.max(Number(model.scale_x) || 1, Number(model.scale_y) || 1, 1);
  const meshRadius = Number(model.converted_bounds?.radius) || 0;
  const radius = Math.min(5000, Math.max(10, footprintRadius, meshRadius * scale, 35 * scale));
  const meshHeight = Number(model.converted_bounds?.size?.[1]) || 0;
  const height = Math.min(1000, Math.max(
    10,
    Number(model.aset?.building_height_m) || 0,
    meshHeight * (Number(model.scale_y) || 1),
    50 * (Number(model.scale_z) || 1),
  ));
  const latitudeDelta = radius / EARTH_RADIUS_M;
  const longitudeDelta = radius / (EARTH_RADIUS_M * Math.max(0.1, Math.cos(toRadians(latitude))));
  return [
    toRadians(longitude) - longitudeDelta,
    toRadians(latitude) - latitudeDelta,
    toRadians(longitude) + longitudeDelta,
    toRadians(latitude) + latitudeDelta,
    altitude - 5,
    altitude + height,
  ];
};

const unionRegions = (regions) => [
  Math.min(...regions.map((region) => region[0])),
  Math.min(...regions.map((region) => region[1])),
  Math.max(...regions.map((region) => region[2])),
  Math.max(...regions.map((region) => region[3])),
  Math.min(...regions.map((region) => region[4])),
  Math.max(...regions.map((region) => region[5])),
];

const regionDiagonal = (region) => {
  const latitude = (region[1] + region[3]) / 2;
  const width = (region[2] - region[0]) * EARTH_RADIUS_M * Math.cos(latitude);
  const height = (region[3] - region[1]) * EARTH_RADIUS_M;
  return Math.max(1, Math.hypot(width, height));
};

const createLeaf = (entry) => {
  const model = entry.model;
  const radius = Math.max(1, Number(model.converted_bounds?.radius) || 25);
  const metadata = {
    assetId: model.id_aset,
    modelId: model.id_model_3d,
    version: model.version,
  };
  const high = {
    boundingVolume: { region: entry.region },
    geometricError: 0,
    content: { uri: model.converted_public_url },
    extras: { ...metadata, lod: "high", triangleCount: Number(model.converted_triangle_count) || null },
  };
  const medium = model.lod_medium_public_url ? {
    boundingVolume: { region: entry.region },
    geometricError: Math.max(0.5, radius * 0.08),
    refine: "REPLACE",
    content: { uri: model.lod_medium_public_url },
    children: [high],
    extras: { ...metadata, lod: "medium", triangleCount: Number(model.lod_medium_triangle_count) || null },
  } : high;
  const low = model.lod_low_public_url ? {
    boundingVolume: { region: entry.region },
    geometricError: Math.max(1, radius * 0.25),
    refine: "REPLACE",
    content: { uri: model.lod_low_public_url },
    children: [medium],
    extras: { ...metadata, lod: "low", triangleCount: Number(model.lod_low_triangle_count) || null },
  } : medium;
  low.transform = createEcefModelTransform(model);
  return low;
};

const splitEntries = (entries) => {
  const longitudeSpan = Math.max(...entries.map((entry) => Number(entry.model.location_long)))
    - Math.min(...entries.map((entry) => Number(entry.model.location_long)));
  const latitudeSpan = Math.max(...entries.map((entry) => Number(entry.model.location_lat)))
    - Math.min(...entries.map((entry) => Number(entry.model.location_lat)));
  const key = longitudeSpan >= latitudeSpan ? "location_long" : "location_lat";
  const sorted = [...entries].sort((left, right) => Number(left.model[key]) - Number(right.model[key]));
  const midpoint = Math.ceil(sorted.length / 2);
  return [sorted.slice(0, midpoint), sorted.slice(midpoint)];
};

const createBranch = (entries, maxChildren) => {
  const region = unionRegions(entries.map((entry) => entry.region));
  const groups = entries.length <= maxChildren
    ? entries.map((entry) => [entry])
    : splitEntries(entries);
  return {
    boundingVolume: { region },
    geometricError: regionDiagonal(region),
    refine: "ADD",
    children: groups.map((group) => group.length === 1
      ? createLeaf(group[0])
      : createBranch(group, maxChildren)),
  };
};

export const createModel3dTileset = (models, { maxChildren = 8 } = {}) => {
  const validModels = models.filter((model) => (
    model.converted_public_url
    && Number.isFinite(Number(model.location_long))
    && Number.isFinite(Number(model.location_lat))
  ));
  if (validModels.length === 0) return null;
  const entries = validModels.map((model) => ({ model, region: getModelBounds(model) }));
  const root = entries.length === 1 ? createLeaf(entries[0]) : createBranch(entries, maxChildren);
  return {
    asset: { version: "1.1", generator: "Bhumi Satya" },
    geometricError: root.geometricError,
    root,
    extras: { modelCount: entries.length, generatedAt: new Date().toISOString() },
  };
};
