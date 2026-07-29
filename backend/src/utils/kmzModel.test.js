import assert from "node:assert/strict";
import test from "node:test";
import { strToU8, zipSync } from "fflate";
import {
  assessKmzModelLocation,
  inspectKmzModel,
  KmzValidationError,
} from "./kmzModel.js";

const createKmz = (href = "models/building.dae") => zipSync({
  "doc.kml": strToU8(`<?xml version="1.0"?><kml><Placemark><Model>
    <altitudeMode>relativeToGround</altitudeMode>
    <Location><latitude>-7.783186</latitude><longitude>110.343751</longitude><altitude>2</altitude></Location>
    <Orientation><heading>12.5</heading><tilt>0</tilt><roll>0</roll></Orientation>
    <Scale><x>1</x><y>1</y><z>1</z></Scale><Link><href>${href}</href></Link>
  </Model></Placemark></kml>`),
  "models/building.dae": strToU8("<COLLADA />"),
});

const createSketchUpKmz = () => zipSync({
  "doc.kml": strToU8(`<?xml version="1.0"?><kml><Placemark><Model>
    <altitudeMode>relativeToGround</altitudeMode>
    <Location><latitude>-7.783186</latitude><longitude>110.343751</longitude><altitude>0</altitude></Location>
    <Orientation><heading>0.088781721880252462</heading><tilt>0</tilt><roll>0</roll></Orientation>
    <Scale><x>1</x><y>1</y><z>1</z></Scale><Link><href>models/building.dae</href></Link>
  </Model></Placemark></kml>`),
  "models/building.dae": strToU8(`<?xml version="1.0"?><COLLADA>
    <asset>
      <contributor><authoring_tool>SketchUp 23.1.315</authoring_tool></contributor>
      <up_axis>Z_UP</up_axis>
    </asset>
  </COLLADA>`),
});

test("inspects georeferenced SketchUp-style KMZ metadata", () => {
  const result = inspectKmzModel(Buffer.from(createKmz()));
  assert.equal(result.modelType, "DAE");
  assert.equal(result.modelEntry, "models/building.dae");
  assert.equal(result.latitude, -7.783186);
  assert.equal(result.longitude, 110.343751);
  assert.equal(result.heading, 12.5);
  assert.equal(result.entryCount, 2);
});

test("automatically aligns a SketchUp Z_UP model for Cesium", () => {
  const result = inspectKmzModel(Buffer.from(createSketchUpKmz()));
  assert.equal(result.sourceHeading, 0.08878172188025246);
  assert.ok(Math.abs(result.heading - 90.08878172188025) < 1e-10);
  assert.equal(result.sourceUpAxis, "Z_UP");
  assert.equal(result.sourceAuthoringTool, "SketchUp 23.1.315");
  assert.equal(result.orientationCorrectionDeg, 90);
  assert.equal(result.orientationCorrectionReason, "sketchup-z-up-to-cesium");
});

test("rejects a KML link whose model is absent", () => {
  assert.throws(
    () => inspectKmzModel(Buffer.from(createKmz("models/missing.dae"))),
    KmzValidationError,
  );
});

test("warns when a KMZ model is far from the asset", () => {
  const result = assessKmzModelLocation({
    assetLat: -7.645,
    assetLng: 112.907,
    modelLat: -7.783186,
    modelLng: 110.343751,
  });
  assert.equal(result.status, "warning");
  assert.ok(result.distanceM > 250000);
});
