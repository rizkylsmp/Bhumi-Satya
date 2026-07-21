import test from "node:test";
import assert from "node:assert/strict";
import chatbotService from "./chatbot.service.js";

test("chatbot explains access through functional roles", () => {
  const response = chatbotService.findResponse("cara login akun saya");

  assert.equal(response.kategori, "akun");
  assert.match(response.jawaban, /pengelola aset/i);
  assert.match(response.jawaban, /verifikator aset/i);
  assert.doesNotMatch(response.jawaban, /admin\s+(bpn|bpka)/i);
});

test("chatbot describes Bhumi Satya as one integrated asset master", () => {
  const response = chatbotService.findResponse("informasi aset tanah");

  assert.equal(response.kategori, "aset");
  assert.match(response.jawaban, /satu master aset/i);
  assert.doesNotMatch(response.jawaban, /admin\s+(bpn|bpka)/i);
});

test("chatbot contact response uses one Bhumi Satya administrator channel", () => {
  const response = chatbotService.findResponse("kontak admin");

  assert.equal(response.kategori, "kontak");
  assert.match(response.jawaban, /admin@bhumisatya\.com/i);
  assert.doesNotMatch(response.jawaban, /admin_(bpn|bpka)/i);
});
