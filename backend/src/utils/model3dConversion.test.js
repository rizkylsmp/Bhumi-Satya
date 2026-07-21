import assert from "node:assert/strict";
import test from "node:test";
import { strToU8, zipSync } from "fflate";
import {
  convertKmzToGlb,
  Model3dConversionError,
} from "./model3dConversion.js";

const MINIMAL_COLLADA = `<?xml version="1.0" encoding="utf-8"?>
<COLLADA xmlns="http://www.collada.org/2005/11/COLLADASchema" version="1.4.1">
  <asset>
    <created>2026-07-18T00:00:00Z</created>
    <modified>2026-07-18T00:00:00Z</modified>
    <unit name="meter" meter="1"/>
    <up_axis>Z_UP</up_axis>
  </asset>
  <library_effects>
    <effect id="effect"><profile_COMMON><technique sid="common"><lambert>
      <diffuse><color>0.4 0.6 0.8 1</color></diffuse>
    </lambert></technique></profile_COMMON></effect>
  </library_effects>
  <library_materials>
    <material id="material"><instance_effect url="#effect"/></material>
  </library_materials>
  <library_geometries>
    <geometry id="geometry"><mesh>
      <source id="positions">
        <float_array id="positions-array" count="9">0 0 0 1 0 0 0 1 0</float_array>
        <technique_common><accessor source="#positions-array" count="3" stride="3">
          <param name="X" type="float"/><param name="Y" type="float"/><param name="Z" type="float"/>
        </accessor></technique_common>
      </source>
      <vertices id="vertices"><input semantic="POSITION" source="#positions"/></vertices>
      <triangles count="1" material="material-symbol">
        <input semantic="VERTEX" source="#vertices" offset="0"/><p>0 1 2</p>
      </triangles>
    </mesh></geometry>
  </library_geometries>
  <library_visual_scenes>
    <visual_scene id="Scene"><node id="node"><instance_geometry url="#geometry">
      <bind_material><technique_common>
        <instance_material symbol="material-symbol" target="#material"/>
      </technique_common></bind_material>
    </instance_geometry></node></visual_scene>
  </library_visual_scenes>
  <scene><instance_visual_scene url="#Scene"/></scene>
</COLLADA>`;

test("convertKmzToGlb converts a COLLADA model into binary glTF", async () => {
  const kmz = zipSync({
    "models/triangle.dae": strToU8(MINIMAL_COLLADA),
  });

  const result = await convertKmzToGlb(
    Buffer.from(kmz.buffer, kmz.byteOffset, kmz.byteLength),
    "models/triangle.dae",
  );

  assert.equal(result.buffer.toString("ascii", 0, 4), "glTF");
  assert.ok(result.buffer.length > 12);
});

test("convertKmzToGlb rejects a missing main model", async () => {
  const kmz = zipSync({ "doc.kml": strToU8("<kml />") });

  await assert.rejects(
    () => convertKmzToGlb(Buffer.from(kmz), "models/missing.dae"),
    (error) => error instanceof Model3dConversionError
      && error.message === "File model utama tidak ditemukan di dalam KMZ",
  );
});
