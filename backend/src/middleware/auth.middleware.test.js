import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import jwt from "jsonwebtoken";
import {
  PERMISSIONS,
  authMiddleware,
  getRolesWithPermission,
  getPermissions,
  hasPermission,
  permissionMiddleware,
  roleMiddleware,
} from "./auth.middleware.js";

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret";
});

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function signUser(payload = {}) {
  return jwt.sign(
    { id_user: 1, username: "tester", role: "verifikator_aset", ...payload },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
}

test("authMiddleware rejects missing or malformed Bearer tokens", () => {
  const next = test.mock.fn();
  const res = createResponse();

  authMiddleware({ headers: {} }, res, next);
  assert.equal(res.statusCode, 401);
  assert.equal(next.mock.callCount(), 0);

  const validToken = signUser();
  const malformedRes = createResponse();
  authMiddleware(
    { headers: { authorization: `Basic ${validToken}` } },
    malformedRes,
    next,
  );

  assert.equal(malformedRes.statusCode, 401);
  assert.equal(next.mock.callCount(), 0);
});

test("authMiddleware attaches normalized roles and matching permissions", () => {
  const req = {
    headers: {
      authorization: `Bearer ${signUser({ role: " VERIFIKATOR_ASET " })}`,
    },
  };
  const res = createResponse();
  const next = test.mock.fn();

  authMiddleware(req, res, next);

  assert.equal(res.statusCode, 200);
  assert.equal(next.mock.callCount(), 1);
  assert.equal(req.user.normalizedRole, "verifikator_aset");
  assert.ok(req.user.permissions.includes(PERMISSIONS.ASET_READ));
});

test("roleMiddleware and permissionMiddleware protect unauthorized requests", () => {
  const req = {
    user: {
      id_user: 1,
      role: "VERIFIKATOR_ASET",
      normalizedRole: "verifikator_aset",
    },
  };

  const roleRes = createResponse();
  roleMiddleware("admin")(req, roleRes, test.mock.fn());
  assert.equal(roleRes.statusCode, 403);

  const permissionRes = createResponse();
  permissionMiddleware(PERMISSIONS.USER_MANAGE)(
    req,
    permissionRes,
    test.mock.fn(),
  );
  assert.equal(permissionRes.statusCode, 403);

  const allowedNext = test.mock.fn();
  const allowedRes = createResponse();
  permissionMiddleware(PERMISSIONS.ASET_READ)(req, allowedRes, allowedNext);
  assert.equal(allowedRes.statusCode, 200);
  assert.equal(allowedNext.mock.callCount(), 1);
});

test("hasPermission returns false for unknown roles", () => {
  assert.equal(hasPermission("unknown", PERMISSIONS.ASET_READ), false);
});

test("admin receives every website permission", () => {
  assert.deepEqual(
    new Set(getPermissions("admin")),
    new Set(Object.values(PERMISSIONS)),
  );
});

test("getRolesWithPermission resolves notification recipients by responsibility", () => {
  assert.deepEqual(getRolesWithPermission(PERMISSIONS.ASET_DELETE), [
    "admin",
    "pengelola_aset",
  ]);
  assert.deepEqual(getRolesWithPermission(PERMISSIONS.ASET_UPDATE), [
    "admin",
    "pengelola_aset",
    "verifikator_aset",
  ]);
});
