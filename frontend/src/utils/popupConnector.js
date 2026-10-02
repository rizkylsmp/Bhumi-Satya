const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const collectCoordinatePairs = (value, pairs) => {
  if (!Array.isArray(value)) return;
  const longitude = Number(value[0]);
  const latitude = Number(value[1]);
  if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
    pairs.push([longitude, latitude]);
    return;
  }
  value.forEach((item) => collectCoordinatePairs(item, pairs));
};

export function getGeometryBoundsCenter(geometry) {
  const pairs = [];
  collectCoordinatePairs(
    Array.isArray(geometry) ? geometry : geometry?.coordinates,
    pairs,
  );
  if (pairs.length === 0) return null;

  const bounds = pairs.reduce(
    (result, [longitude, latitude]) => ({
      minLongitude: Math.min(result.minLongitude, longitude),
      maxLongitude: Math.max(result.maxLongitude, longitude),
      minLatitude: Math.min(result.minLatitude, latitude),
      maxLatitude: Math.max(result.maxLatitude, latitude),
    }),
    {
      minLongitude: Number.POSITIVE_INFINITY,
      maxLongitude: Number.NEGATIVE_INFINITY,
      minLatitude: Number.POSITIVE_INFINITY,
      maxLatitude: Number.NEGATIVE_INFINITY,
    },
  );

  return [
    (bounds.minLongitude + bounds.maxLongitude) / 2,
    (bounds.minLatitude + bounds.maxLatitude) / 2,
  ];
}

export function buildPopupConnectorGeometry(panelRect, boundaryRect, anchor) {
  if (!panelRect || !boundaryRect || !anchor) return null;
  const width = Number(boundaryRect.width);
  const height = Number(boundaryRect.height);
  const anchorX = Number(anchor.x);
  const anchorY = Number(anchor.y);
  if (![width, height, anchorX, anchorY].every(Number.isFinite)) return null;

  const left = panelRect.left - boundaryRect.left;
  const top = panelRect.top - boundaryRect.top;
  const right = panelRect.right - boundaryRect.left;
  const bottom = panelRect.bottom - boundaryRect.top;
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;
  const halfWidth = Math.max((right - left) / 2, 1);
  const halfHeight = Math.max((bottom - top) / 2, 1);
  const dx = anchorX - centerX;
  const dy = anchorY - centerY;
  const scale = 1 / Math.max(Math.abs(dx) / halfWidth, Math.abs(dy) / halfHeight, 1);
  const startX = clamp(centerX + dx * scale, left + 12, right - 12);
  const startY = clamp(centerY + dy * scale, top + 12, bottom - 12);
  const deltaX = anchorX - startX;
  const deltaY = anchorY - startY;
  const control1X = startX + deltaX * 0.18;
  const control1Y = startY + deltaY * 0.42;
  const control2X = anchorX - deltaX * 0.22;
  const control2Y = anchorY - deltaY * 0.16;

  return {
    width,
    height,
    anchorX,
    anchorY,
    path: `M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${control1X.toFixed(1)} ${control1Y.toFixed(1)}, ${control2X.toFixed(1)} ${control2Y.toFixed(1)}, ${anchorX.toFixed(1)} ${anchorY.toFixed(1)}`,
  };
}
