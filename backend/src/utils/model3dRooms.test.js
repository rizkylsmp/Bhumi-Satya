import test from "node:test";
import assert from "node:assert/strict";
import { normalizeModel3dRooms } from "./model3dRooms.js";

test("normalizes model 3D room metadata", () => {
  const [room] = normalizeModel3dRooms([{
    id: "ruang-1",
    nama: "Ruang Rapat",
    lantai: "2",
    luas: "45.5",
    penggunaan: "Rapat",
  }]);

  assert.deepEqual(room, {
    id: "ruang-1",
    name: "Ruang Rapat",
    floor: "2",
    area_m2: 45.5,
    usage: "Rapat",
    unit_code: null,
    notes: null,
  });
});

test("rejects invalid model 3D room data", () => {
  assert.throws(() => normalizeModel3dRooms({}), /array/);
  assert.throws(() => normalizeModel3dRooms([{ name: "" }]), /wajib/);
  assert.throws(() => normalizeModel3dRooms([{ name: "Gudang", area_m2: -1 }]), /Luas/);
});
