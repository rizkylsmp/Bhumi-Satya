import assert from "node:assert/strict";
import test from "node:test";
import {
  isMasyarakatLoginOtpEnabled,
  shouldBypassMasyarakatOtp,
} from "./loginPolicy.js";

test("OTP login masyarakat nonaktif secara default", () => {
  assert.equal(isMasyarakatLoginOtpEnabled(undefined), false);
  assert.equal(shouldBypassMasyarakatOtp("masyarakat", undefined), true);
});

test("OTP login masyarakat dapat diaktifkan melalui environment", () => {
  assert.equal(isMasyarakatLoginOtpEnabled(" true "), true);
  assert.equal(shouldBypassMasyarakatOtp("Masyarakat", "true"), false);
});

test("bypass OTP tidak berlaku untuk role lain", () => {
  assert.equal(shouldBypassMasyarakatOtp("admin", "false"), false);
  assert.equal(shouldBypassMasyarakatOtp("operator", "false"), false);
});
