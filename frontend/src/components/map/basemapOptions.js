export const DEFAULT_BASEMAP_ID = "satellite";

export const BASEMAP_OPTIONS = [
  {
    id: "satellite",
    label: "Satelit Esri",
    kind: "imagery",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    cesiumUrl:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    tileSize: 256,
    maxzoom: 19,
    attribution:
      "Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  },
  {
    id: "orthophoto",
    label: "Orthophoto",
    kind: "imagery",
    tiles: [
      "https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    cesiumUrl:
      "https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    tileSize: 256,
    maxzoom: 20,
    attribution:
      "Esri, Vantor, Earthstar Geographics, and the GIS User Community",
  },
  {
    id: "light",
    label: "Peta Terang",
    tiles: ["https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"],
    cesiumUrl: "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    tileSize: 256,
    maxzoom: 20,
    attribution: "OpenStreetMap contributors © CARTO",
  },
  {
    id: "dark",
    label: "Peta Gelap",
    tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"],
    cesiumUrl: "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
    tileSize: 256,
    maxzoom: 20,
    attribution: "OpenStreetMap contributors © CARTO",
  },
  {
    id: "osm",
    label: "OpenStreetMap",
    tiles: ["https://tile.openstreetmap.de/{z}/{x}/{y}.png"],
    cesiumUrl: "https://tile.openstreetmap.de/{z}/{x}/{y}.png",
    tileSize: 256,
    maxzoom: 19,
    attribution: "OpenStreetMap contributors",
  },
  {
    id: "none",
    label: "Tanpa Basemap",
    tiles: [],
    cesiumUrl: null,
    backgroundColor: "#cbd5e1",
  },
];

export const getBasemapOption = (basemapId) =>
  BASEMAP_OPTIONS.find((option) => option.id === basemapId)
  || BASEMAP_OPTIONS.find((option) => option.id === DEFAULT_BASEMAP_ID);

export const createMapLibreBasemapStyle = (option) => {
  const backgroundColor = option?.backgroundColor || "#cbd5e1";
  const style = {
    version: 8,
    sources: {},
    layers: [
      {
        id: "basemap-background",
        type: "background",
        paint: { "background-color": backgroundColor },
      },
    ],
  };

  if (!option || option.id === "none") return style;

  if (option.kind === "single-image" && option.imageUrl && option.bounds) {
    style.sources.basemap = {
      type: "image",
      url: option.imageUrl,
      coordinates: [
        [option.bounds.west, option.bounds.north],
        [option.bounds.east, option.bounds.north],
        [option.bounds.east, option.bounds.south],
        [option.bounds.west, option.bounds.south],
      ],
    };
  } else if (option.tiles?.length) {
    style.sources.basemap = {
      type: "raster",
      tiles: option.tiles,
      tileSize: option.tileSize || 256,
      maxzoom: option.maxzoom || 22,
      attribution: option.attribution,
    };
  } else {
    return style;
  }

  style.layers.push({
    id: "basemap-raster",
    type: "raster",
    source: "basemap",
    paint: { "raster-opacity": option.opacity ?? 1 },
  });
  return style;
};
