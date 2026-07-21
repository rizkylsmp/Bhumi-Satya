import { NodeIO, Primitive, getBounds } from "@gltf-transform/core";
import {
  convertPrimitiveToTriangles,
  getGLPrimitiveCount,
  prune,
  simplify,
  weld,
} from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";

const io = new NodeIO();
const triangleModes = new Set([
  Primitive.Mode.TRIANGLES,
  Primitive.Mode.TRIANGLE_STRIP,
  Primitive.Mode.TRIANGLE_FAN,
]);

const countTriangles = (document) => document.getRoot().listMeshes()
  .flatMap((mesh) => mesh.listPrimitives())
  .filter((primitive) => triangleModes.has(primitive.getMode()))
  .reduce((total, primitive) => total + getGLPrimitiveCount(primitive), 0);

const triangulatePrimitives = (document) => document.getRoot().listMeshes()
  .flatMap((mesh) => mesh.listPrimitives())
  .filter((primitive) => [Primitive.Mode.TRIANGLE_STRIP, Primitive.Mode.TRIANGLE_FAN]
    .includes(primitive.getMode()))
  .forEach((primitive) => convertPrimitiveToTriangles(primitive));

const analyzeBounds = (document) => {
  const sceneBounds = document.getRoot().listScenes()
    .map((scene) => getBounds(scene))
    .filter(({ min, max }) => [...min, ...max].every(Number.isFinite));
  if (sceneBounds.length === 0) return null;
  const min = [0, 1, 2].map((axis) => Math.min(...sceneBounds.map((bounds) => bounds.min[axis])));
  const max = [0, 1, 2].map((axis) => Math.max(...sceneBounds.map((bounds) => bounds.max[axis])));
  const size = max.map((value, axis) => value - min[axis]);
  const center = max.map((value, axis) => (value + min[axis]) / 2);
  const radius = Math.hypot(...size) / 2;
  return { min, max, size, center, radius };
};

export const analyzeGlb = async (glbBuffer) => {
  const document = await io.readBinary(new Uint8Array(glbBuffer));
  return {
    bounds: analyzeBounds(document),
    triangleCount: countTriangles(document),
  };
};

const createVariant = async (glbBuffer, options) => {
  const document = await io.readBinary(new Uint8Array(glbBuffer));
  triangulatePrimitives(document);
  await document.transform(
    weld(),
    simplify({
      simplifier: MeshoptSimplifier,
      ratio: options.ratio,
      error: options.error,
      lockBorder: false,
    }),
    prune(),
  );
  const binary = await io.writeBinary(document);
  return {
    buffer: Buffer.from(binary.buffer, binary.byteOffset, binary.byteLength),
    triangleCount: countTriangles(document),
    bounds: analyzeBounds(document),
    ratio: options.ratio,
    error: options.error,
  };
};

export const createGlbLods = async (glbBuffer, {
  minTriangles = 1000,
  medium = { ratio: 0.5, error: 0.005 },
  low = { ratio: 0.2, error: 0.02 },
} = {}) => {
  await MeshoptSimplifier.ready;
  const high = await analyzeGlb(glbBuffer);
  if (high.triangleCount < minTriangles) {
    return { high, medium: null, low: null, skipped: true };
  }
  // Build variants sequentially so large source models do not occupy memory twice.
  const mediumResult = await createVariant(glbBuffer, medium);
  const lowResult = await createVariant(glbBuffer, low);
  return {
    high,
    medium: mediumResult.triangleCount < high.triangleCount ? mediumResult : null,
    low: lowResult.triangleCount < high.triangleCount ? lowResult : null,
    skipped: false,
  };
};
