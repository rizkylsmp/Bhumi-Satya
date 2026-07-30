const toFiniteNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const isValidCoordinate = (lat, lng) =>
  lat !== null &&
  lng !== null &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180;

const normalizeCoordinate = (value) => Number(value.toFixed(12));

const averagePoints = (points) => {
  if (!points.length) return { lat: null, lng: null };

  const totals = points.reduce(
    (sum, point) => ({
      lat: sum.lat + point.lat,
      lng: sum.lng + point.lng,
    }),
    { lat: 0, lng: 0 },
  );

  return {
    lat: normalizeCoordinate(totals.lat / points.length),
    lng: normalizeCoordinate(totals.lng / points.length),
  };
};

const collectLatLngPoints = (value, points = []) => {
  if (Array.isArray(value)) {
    const lat = toFiniteNumber(value[0]);
    const lng = toFiniteNumber(value[1]);
    if (isValidCoordinate(lat, lng)) {
      points.push({ lat, lng });
      return points;
    }

    value.forEach((item) => collectLatLngPoints(item, points));
    return points;
  }

  if (value && typeof value === "object") {
    const lat = toFiniteNumber(value.lat ?? value.latitude);
    const lng = toFiniteNumber(
      value.lng ?? value.lon ?? value.longitude,
    );
    if (isValidCoordinate(lat, lng)) points.push({ lat, lng });
  }

  return points;
};

const getGeometryPoints = (input) => {
  const geometry = input?.type === "Feature" ? input.geometry : input;
  if (!geometry?.type || !geometry?.coordinates) return [];

  if (geometry.type === "Point") return [geometry.coordinates];
  if (geometry.type === "Polygon") return geometry.coordinates?.[0] || [];
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates?.[0]?.[0] || [];
  }
  return [];
};

const getCentroidFromGeometry = (geometry) => {
  const points = getGeometryPoints(geometry)
    .map((point) => {
      const lng = toFiniteNumber(point?.[0]);
      const lat = toFiniteNumber(point?.[1]);
      return isValidCoordinate(lat, lng) ? { lat, lng } : null;
    })
    .filter(Boolean);

  return averagePoints(points);
};

export const getCentroidFromPolygonField = (polygon) => {
  if (!polygon) return { lat: null, lng: null };

  if (typeof polygon === "string") {
    try {
      return getCentroidFromPolygonField(JSON.parse(polygon));
    } catch {
      return { lat: null, lng: null };
    }
  }

  if (Array.isArray(polygon)) {
    return averagePoints(collectLatLngPoints(polygon));
  }

  if (polygon?.type || polygon?.coordinates) {
    return getCentroidFromGeometry(polygon);
  }

  return { lat: null, lng: null };
};
