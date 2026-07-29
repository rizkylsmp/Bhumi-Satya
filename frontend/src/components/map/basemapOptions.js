export const DEFAULT_BASEMAP_ID = "light";

export const BASEMAP_OPTIONS = [
  {
    id: "satellite",
    label: "Satelit Esri",
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
    id: DEFAULT_BASEMAP_ID,
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
