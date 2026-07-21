import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import LoginOtpService from "./loginOtp.service.js";

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret";
});

test("generateCode returns a six-digit OTP string", () => {
  assert.match(LoginOtpService.generateCode(), /^\d{6}$/);
});

test("hashCode is deterministic for the same secret and changes with different codes", () => {
  const firstHash = LoginOtpService.hashCode("123456");
  const secondHash = LoginOtpService.hashCode("123456");
  const differentHash = LoginOtpService.hashCode("654321");

  assert.equal(firstHash, secondHash);
  assert.notEqual(firstHash, differentHash);
});

test("getRecipient masks email addresses and normalizes WhatsApp numbers", () => {
  const user = {
    email: "operator@bhumisatya.local",
    no_telepon: "0812-3456-7890",
  };

  assert.equal(LoginOtpService.getRecipient(user, "email"), "op******@bhumisatya.local");
  assert.equal(LoginOtpService.getRecipient(user, "whatsapp"), "6281****890");
});
