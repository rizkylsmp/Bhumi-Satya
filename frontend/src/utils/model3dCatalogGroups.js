export function groupLocationsByArea2d(locations = []) {
  const groups = new Map();

  locations.forEach((location) => {
    const code = String(location?.area2dCode || "").trim();
    const key = code || "unassigned-2d";
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        code: code || "Tanpa kode 2D",
        location:
          location?.area2dLocation
          || location?.location
          || "Lokasi bidang belum dilengkapi",
        items: [],
      });
    }
    groups.get(key).items.push(location);
  });

  return [...groups.values()].sort((left, right) =>
    left.code.localeCompare(right.code, "id", { numeric: true }));
}
