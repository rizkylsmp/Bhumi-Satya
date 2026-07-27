const EARTH_RADIUS_METERS = 6378137;
const toRadians = (degrees) => Number(degrees) * Math.PI / 180;
const toDegrees = (radians) => Number(radians) * 180 / Math.PI;

export const resolveModelOffsetLocation = (model = {}) => {
  const latitude = Number(model.location_lat);
  const longitude = Number(model.location_long);
  const eastOffset = Number(model.offset_x_m) || 0;
  const northOffset = Number(model.offset_y_m) || 0;
  const verticalOffset = Number(model.offset_z_m) || 0;

  return {
    longitude: longitude + toDegrees(
      eastOffset / (
        EARTH_RADIUS_METERS
        * Math.max(0.1, Math.cos(toRadians(latitude)))
      ),
    ),
    latitude: latitude + toDegrees(northOffset / EARTH_RADIUS_METERS),
    altitude: (Number(model.altitude_m) || 0) + verticalOffset,
  };
};

export const getModelFocusZoom = (model = {}) => {
  const radius = Number(
    model.converted_bounds?.radius ?? model.manifest?.bounds?.radius,
  );
  if (!Number.isFinite(radius) || radius <= 0) return 18;
  if (radius > 150) return 15.5;
  if (radius > 60) return 16.5;
  return 18;
};
