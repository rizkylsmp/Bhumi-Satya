const EARTH_RADIUS_METERS = 6371008.8;

const toRadians = (value) => (Number(value) * Math.PI) / 180;

export const distanceMeters = (start, end) => {
  if (!Array.isArray(start) || !Array.isArray(end)) return 0;
  const [lng1, lat1] = start.map(Number);
  const [lng2, lat2] = end.map(Number);
  if (![lng1, lat1, lng2, lat2].every(Number.isFinite)) return 0;

  const latitudeDelta = toRadians(lat2 - lat1);
  const longitudeDelta = toRadians(lng2 - lng1);
  const latitude1 = toRadians(lat1);
  const latitude2 = toRadians(lat2);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitude1) *
      Math.cos(latitude2) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    EARTH_RADIUS_METERS *
    2 *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
};

export const lineDistanceMeters = (points = []) =>
  points.slice(1).reduce(
    (total, point, index) => total + distanceMeters(points[index], point),
    0,
  );

const ringAreaSquareMeters = (ring = []) => {
  if (!Array.isArray(ring) || ring.length < 3) return 0;
  const validPoints = ring
    .map((point) => [Number(point?.[0]), Number(point?.[1])])
    .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
  if (validPoints.length < 3) return 0;

  const averageLatitude =
    validPoints.reduce((sum, point) => sum + point[1], 0) / validPoints.length;
  const latitudeScale = Math.cos(toRadians(averageLatitude));
  const projected = validPoints.map(([lng, lat]) => [
    EARTH_RADIUS_METERS * toRadians(lng) * latitudeScale,
    EARTH_RADIUS_METERS * toRadians(lat),
  ]);

  return Math.abs(
    projected.reduce((sum, point, index) => {
      const next = projected[(index + 1) % projected.length];
      return sum + point[0] * next[1] - next[0] * point[1];
    }, 0) / 2,
  );
};

const polygonAreaSquareMeters = (coordinates = []) => {
  if (!coordinates.length) return 0;
  const outerArea = ringAreaSquareMeters(coordinates[0]);
  const holesArea = coordinates
    .slice(1)
    .reduce((sum, ring) => sum + ringAreaSquareMeters(ring), 0);
  return Math.max(0, outerArea - holesArea);
};

export const geometryAreaSquareMeters = (geometry) => {
  if (geometry?.type === "Polygon") {
    return polygonAreaSquareMeters(geometry.coordinates);
  }
  if (geometry?.type === "MultiPolygon") {
    return geometry.coordinates.reduce(
      (sum, polygon) => sum + polygonAreaSquareMeters(polygon),
      0,
    );
  }
  return 0;
};

export const formatMetricValue = (value, unit) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  if (unit === "m" && number >= 1000) {
    return `${(number / 1000).toLocaleString("id-ID", {
      maximumFractionDigits: 2,
    })} km`;
  }
  if (unit === "m²" && number >= 10000) {
    return `${(number / 10000).toLocaleString("id-ID", {
      maximumFractionDigits: 2,
    })} ha`;
  }
  return `${number.toLocaleString("id-ID", {
    maximumFractionDigits: number < 10 ? 2 : 1,
  })} ${unit}`;
};

export const buildAnalysisFeatureCollection = ({
  points = [],
  geometry = null,
} = {}) => {
  const features = [];

  if (geometry) {
    features.push({
      type: "Feature",
      properties: { kind: "selection" },
      geometry,
    });
  }

  if (points.length >= 2) {
    features.push({
      type: "Feature",
      properties: { kind: "line" },
      geometry: { type: "LineString", coordinates: points },
    });
  }

  points.forEach((coordinates, index) => {
    features.push({
      type: "Feature",
      properties: { kind: "point", sequence: index + 1 },
      geometry: { type: "Point", coordinates },
    });
  });

  return { type: "FeatureCollection", features };
};
