import test from "node:test";
import assert from "node:assert/strict";
import { register } from "./auth.controller.js";
import { sequelize } from "../models/index.js";

test("public registration cannot create an admin", async () => {
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  await register({ body: { username: "public", password: "example", role: "admin" } }, res);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.success, false);
});

test.after(async () => { await sequelize.close(); });
