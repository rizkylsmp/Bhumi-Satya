import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createAset3dSchemaInitializer } from "./aset3dSchema.service.js";

describe("aset3d schema initializer", () => {
  it("menjalankan schema bootstrap satu kali per instance", async () => {
    let queryCount = 0;
    const initialize = createAset3dSchemaInitializer({
      query: async (sql) => {
        queryCount += 1;
        assert.match(sql, /CREATE TABLE IF NOT EXISTS "aset_3d_catalog"/);
      },
    });

    await Promise.all([initialize(), initialize(), initialize()]);
    assert.equal(queryCount, 1);
  });

  it("dapat dicoba kembali setelah query gagal", async () => {
    let queryCount = 0;
    const initialize = createAset3dSchemaInitializer({
      query: async () => {
        queryCount += 1;
        if (queryCount === 1) throw new Error("database unavailable");
      },
    });

    await assert.rejects(initialize(), /database unavailable/);
    await initialize();
    assert.equal(queryCount, 2);
  });
});
