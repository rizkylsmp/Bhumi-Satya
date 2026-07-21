import { Tile3DLayer } from "@deck.gl/geo-layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { Tiles3DLoader } from "@loaders.gl/3d-tiles";

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
