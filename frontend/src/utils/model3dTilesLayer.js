import { Tile3DLayer } from "@deck.gl/geo-layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { Tiles3DLoader } from "@loaders.gl/3d-tiles";

const GLOBAL_BOUNDING_SPHERE = [0, 0, 0, 12_800_000];

export const createDirectPackageTileset = (models) => {
  const packageModels = models.filter((model) => (
    String(model?.format || model?.model_type || "").toUpperCase() === "3DTILES"
    && model?.converted_public_url
  ));
  if (packageModels.length === 0) return null;

  const leaves = packageModels.map((model) => ({
    boundingVolume: model.manifest?.rootBoundingVolume
      || { sphere: GLOBAL_BOUNDING_SPHERE },
    geometricError: Math.max(0, Number(model.manifest?.geometricError) || 0),
    refine: "REPLACE",
    content: { uri: model.converted_public_url },
    extras: {
      assetId: model.assetId || model.id_aset,
      modelId: model.id_model_3d,
      version: model.version,
      format: "3DTILES",
    },
  }));
  const root = leaves.length === 1
    ? leaves[0]
    : {
        boundingVolume: { sphere: GLOBAL_BOUNDING_SPHERE },
        geometricError: Math.max(...leaves.map((leaf) => leaf.geometricError)),
        refine: "ADD",
        children: leaves,
      };

  return {
    asset: { version: "1.1", generator: "Bhumi Satya direct preview" },
    geometricError: root.geometricError,
    root,
  };
};

export const createModel3dTilesOverlay = ({ tileset, onStatus }) => {
  const tilesetUrl = URL.createObjectURL(new Blob(
    [JSON.stringify(tileset)],
    { type: "application/json" },
  ));
  let loadedTiles = 0;
  let failedTiles = 0;
  const layer = new Tile3DLayer({
    id: "bhumi-satya-models-3d-tiles",
    data: tilesetUrl,
    loader: Tiles3DLoader,
    pickable: true,
    autoHighlight: true,
    highlightColor: [34, 211, 238, 56],
    onTilesetLoad: () => {
      onStatus?.({ state: "ready", loaded: loadedTiles, failed: failedTiles });
    },
    onTileLoad: () => {
      loadedTiles += 1;
      onStatus?.({ state: "ready", loaded: loadedTiles, failed: failedTiles });
    },
    onTileError: (error) => {
      failedTiles += 1;
      onStatus?.({
        state: failedTiles > 0 && loadedTiles === 0 ? "error" : "ready",
        loaded: loadedTiles,
        failed: failedTiles,
        message: error?.message,
      });
    },
  });
  const overlay = new MapboxOverlay({
    interleaved: false,
    layers: [layer],
  });
  return {
    overlay,
    dispose: () => URL.revokeObjectURL(tilesetUrl),
  };
};
