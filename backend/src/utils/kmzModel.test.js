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

test("inspects georeferenced SketchUp-style KMZ metadata", () => {
  const result = inspectKmzModel(Buffer.from(createKmz()));
  assert.equal(result.modelType, "DAE");
  assert.equal(result.modelEntry, "models/building.dae");
  assert.equal(result.latitude, -7.783186);
  assert.equal(result.longitude, 110.343751);
  assert.equal(result.heading, 12.5);
  assert.equal(result.entryCount, 2);
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
