import assert from "node:assert/strict";
import test from "node:test";
import { Accessor, Document, NodeIO, Primitive } from "@gltf-transform/core";
import { analyzeGlb, createGlbLods } from "./glbOptimization.js";

const createGridGlb = async (size = 20, includeLine = false) => {
  const document = new Document();
  const buffer = document.createBuffer();
  const positions = [];
  const indices = [];
  for (let y = 0; y <= size; y += 1) {
    for (let x = 0; x <= size; x += 1) positions.push(x, y, 0);
  }
  const rowSize = size + 1;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const topLeft = y * rowSize + x;
      const bottomLeft = (y + 1) * rowSize + x;
      indices.push(topLeft, bottomLeft, topLeft + 1, topLeft + 1, bottomLeft, bottomLeft + 1);
    }
  }
  const positionAccessor = document.createAccessor("positions")
    .setType(Accessor.Type.VEC3)
    .setArray(new Float32Array(positions))
    .setBuffer(buffer);
  const indexAccessor = document.createAccessor("indices")
    .setType(Accessor.Type.SCALAR)
    .setArray(new Uint32Array(indices))
    .setBuffer(buffer);
  const primitive = document.createPrimitive()
    .setAttribute("POSITION", positionAccessor)
    .setIndices(indexAccessor);
  const mesh = document.createMesh("grid").addPrimitive(primitive);
  if (includeLine) {
    const lineIndices = document.createAccessor("line-indices")
      .setType(Accessor.Type.SCALAR)
      .setArray(new Uint32Array([0, 1]))
      .setBuffer(buffer);
    mesh.addPrimitive(document.createPrimitive()
      .setAttribute("POSITION", positionAccessor)
      .setIndices(lineIndices)
      .setMode(Primitive.Mode.LINES));
  }
  const node = document.createNode("grid").setMesh(mesh);
  document.createScene("scene").addChild(node);
  const binary = await new NodeIO().writeBinary(document);
  return Buffer.from(binary.buffer, binary.byteOffset, binary.byteLength);
};

test("analyzeGlb calculates mesh bounds and triangle count", async () => {
  const glb = await createGridGlb(20);
  const analysis = await analyzeGlb(glb);

  assert.equal(analysis.triangleCount, 800);
  assert.deepEqual(analysis.bounds.min, [0, 0, 0]);
  assert.deepEqual(analysis.bounds.max, [20, 20, 0]);
  assert.ok(Math.abs(analysis.bounds.radius - Math.sqrt(200)) < 0.0001);
});

test("analyzeGlb excludes line and point primitives from triangle count", async () => {
  const glb = await createGridGlb(1, true);
  const analysis = await analyzeGlb(glb);

  assert.equal(analysis.triangleCount, 2);
});

test("createGlbLods produces lighter triangle meshes", async () => {
  const glb = await createGridGlb(20);
  const lods = await createGlbLods(glb, {
    minTriangles: 100,
    medium: { ratio: 0.5, error: 0.05 },
    low: { ratio: 0.2, error: 0.1 },
  });

  assert.equal(lods.skipped, false);
  assert.ok(lods.medium.triangleCount < lods.high.triangleCount);
  assert.ok(lods.low.triangleCount < lods.medium.triangleCount);
  assert.equal(lods.medium.buffer.toString("ascii", 0, 4), "glTF");
  assert.equal(lods.low.buffer.toString("ascii", 0, 4), "glTF");
});

test("createGlbLods skips small models", async () => {
  const glb = await createGridGlb(1);
  const lods = await createGlbLods(glb, { minTriangles: 100 });

  assert.equal(lods.skipped, true);
  assert.equal(lods.medium, null);
  assert.equal(lods.low, null);
});
