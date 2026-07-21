import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let server;
let baseUrl;
let sequelize;

const createToken = (role) =>
  jwt.sign(
    {
      id_user: 1,
      username: "integration-test",
      role,
      instansi: "BPKA",
    },
    process.env.JWT_SECRET,
    { expiresIn: "5m" },
  );

const request = async (pathName, { role = "admin", ...options } = {}) => {
  const response = await fetch(`${baseUrl}${pathName}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${createToken(role)}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  return {
    response,
    body: await response.json(),
  };
};

before(async () => {
  dotenv.config({ path: path.resolve(__dirname, "../.env"), override: false });
  process.env.NODE_ENV = "test";
  process.env.DB_POOL_MAX = "12";
  process.env.VERCEL = "1";
  process.env.JWT_SECRET = "integration-test-secret";

  const [{ default: app }, database] = await Promise.all([
    import("../src/server.js"),
    import("../src/config/database.js"),
  ]);
  sequelize = database.default;

  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}/api`;
});

after(async () => {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  await sequelize.close();
});

test("integrated asset API serves one dataset and protects mutations", async () => {
  const list = await request("/aset?limit=1");
  assert.equal(list.response.status, 200);
  assert.equal(list.body.success, true);
  assert.ok(list.body.pagination.totalItems > 0);
  assert.equal(list.body.data.length, 1);

  const assetId = list.body.data[0].id_aset;
  const [detail, stats, mapStats] = await Promise.all([
    request(`/aset/${assetId}`),
    request("/aset/stats"),
    request("/peta/stats"),
  ]);
  assert.equal(detail.response.status, 200);
  assert.equal(detail.body.data.id_aset, assetId);
  assert.equal(stats.response.status, 200);
  assert.ok(stats.body.data.totalAset > 0);
  assert.equal(mapStats.response.status, 200);
  assert.ok(mapStats.body.data.totalMapped >= 0);

  const legacyRead = await request("/pusat-data?limit=1");
  assert.equal(legacyRead.response.status, 200);
  assert.equal(legacyRead.response.headers.get("deprecation"), "true");
  assert.equal(legacyRead.body.deprecated, true);
  assert.equal(legacyRead.body.data[0].id_pusat_data, assetId);

  const preview = await request("/aset/import-webgis", {
    method: "POST",
    body: JSON.stringify({ sumber: "BPN", mode: "preview" }),
  });
  assert.equal(preview.response.status, 200);
  assert.equal(preview.body.data.sumber, "BPN");
  assert.ok(preview.body.data.featureCount > 0);

  const invalidMutation = await request("/aset", {
    method: "POST",
    role: "admin",
    body: JSON.stringify({}),
  });
  assert.equal(invalidMutation.response.status, 400);

  const forbiddenMutation = await request(`/aset/${assetId}`, {
    method: "PUT",
    role: "viewer",
    body: JSON.stringify({ nama_aset: "Tidak boleh berubah" }),
  });
  assert.equal(forbiddenMutation.response.status, 403);
});
