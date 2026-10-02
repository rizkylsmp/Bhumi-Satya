import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = new URL(".", import.meta.url).pathname.replace(/^\/(.:)/, "$1");
const workbook = Workbook.create();
const sheet = workbook.worksheets.add("Whitebox Test");
sheet.showGridLines = false;

const tests = [
  ["WT-001", "Hak Akses", "Uji normalizeRole dengan nilai ' ADMIN ' dan kosong", "Role menjadi admin; nilai kosong menjadi string kosong", null, "Not Tested", null],
  ["WT-002", "Hak Akses", "Uji canAccessMenu untuk role admin", "Admin dapat mengakses seluruh menu pengelolaan", null, "Not Tested", null],
  ["WT-003", "Hak Akses", "Uji canAccessMenu masyarakat ke menu internal", "Akses dashboard dan menu pengelolaan ditolak", null, "Not Tested", null],
  ["WT-004", "Router", "Uji HomeRedirect untuk masyarakat dan admin", "Masyarakat ke halaman penyewaan; admin ke dashboard", null, "Not Tested", null],
  ["WT-005", "Registrasi", "Panggil register dengan field wajib kosong", "Status 400 dan pesan validasi dikembalikan", null, "Not Tested", null],
  ["WT-006", "Registrasi", "Panggil register dengan username atau email duplikat", "Status 400 dan data duplikat tidak disimpan", null, "Not Tested", null],
  ["WT-007", "Registrasi", "Panggil register dengan seluruh data valid", "Pengguna tersimpan dengan role masyarakat", null, "Not Tested", null],
  ["WT-008", "Login", "Panggil login menggunakan password yang salah", "Login ditolak dan token tidak dibuat", null, "Not Tested", null],
  ["WT-009", "Login", "Panggil login masyarakat dengan kredensial valid", "Token dan data pengguna dikembalikan tanpa OTP", null, "Not Tested", null],
  ["WT-010", "Autentikasi", "Jalankan authMiddleware tanpa Bearer token", "Status 401 dan next tidak dipanggil", null, "Not Tested", null],
  ["WT-011", "Autentikasi", "Jalankan authMiddleware menggunakan JWT valid", "req.user terisi dan next dipanggil", null, "Not Tested", null],
  ["WT-012", "Otorisasi", "Jalankan roleMiddleware masyarakat pada API admin", "Status 403 dan controller tidak dijalankan", null, "Not Tested", null],
  ["WT-013", "Polygon", "Hitung centroid polygon WGS84 yang valid", "Longitude dan latitude centroid dihitung benar", null, "Not Tested", null],
  ["WT-014", "Polygon", "Proses JSON rusak dan koordinat di luar batas", "Fungsi tidak crash dan mengembalikan nilai aman", null, "Not Tested", null],
  ["WT-015", "Upload", "Validasi foto kondisi JPG dan WebP", "Kedua format diterima", null, "Not Tested", null],
  ["WT-016", "Upload", "Validasi file berbahaya atau MIME tidak cocok", "File ditolak oleh validator", null, "Not Tested", null],
  ["WT-017", "API Client", "Simulasikan respons 401 pada interceptor API", "Sesi dibersihkan dan pengguna diarahkan ke login", null, "Not Tested", null],
  ["WT-018", "Panel Login", "Simulasikan registrasi berhasil dari tab Daftar", "Tab berpindah ke Masuk dan kredensial terisi", null, "Not Tested", null],
];

sheet.mergeCells("A1:G1");
sheet.getRange("A1").values = [["WHITEBOX TESTING — BHUMI SATYA"]];
sheet.getRange("A1:G1").format = {
  fill: "#123F46",
  font: { bold: true, color: "#FFFFFF", size: 17 },
  horizontalAlignment: "left",
  verticalAlignment: "center",
};
sheet.getRange("A1:G1").format.rowHeight = 34;

sheet.getRange("A3:E3").values = [["Total", "Passed", "Failed", "Blocked", "Not Tested"]];
sheet.getRange("A4").formulas = [["=COUNTA(A8:A25)"]];
sheet.getRange("B4").formulas = [["=COUNTIF(F8:F25,\"Passed\")"]];
sheet.getRange("C4").formulas = [["=COUNTIF(F8:F25,\"Failed\")"]];
sheet.getRange("D4").formulas = [["=COUNTIF(F8:F25,\"Blocked\")"]];
sheet.getRange("E4").formulas = [["=COUNTIF(F8:F25,\"Not Tested\")"]];
sheet.getRange("A3:E3").format = {
  fill: "#17877D",
  font: { bold: true, color: "#FFFFFF" },
  horizontalAlignment: "center",
};
sheet.getRange("A4:E4").format = {
  fill: "#E2F3F0",
  font: { bold: true, color: "#17324D" },
  horizontalAlignment: "center",
};

sheet.mergeCells("A6:G6");
sheet.getRange("A6").values = [["Isi Hasil Aktual, pilih Status, lalu tambahkan Catatan bila diperlukan."]];
sheet.getRange("A6:G6").format = {
  fill: "#FFF4CC",
  font: { italic: true, color: "#9A6700" },
  verticalAlignment: "center",
};

sheet.getRange("A7:G7").values = [["ID", "Modul", "Skenario Pengujian", "Hasil Diharapkan", "Hasil Aktual", "Status", "Catatan"]];
sheet.getRange("A8:G25").values = tests;

const table = sheet.tables.add("A7:G25", true, "WhiteboxTests");
table.style = "TableStyleMedium2";
table.showFilterButton = true;

sheet.getRange("A7:G7").format = {
  fill: "#0B5F7D",
  font: { bold: true, color: "#FFFFFF" },
  horizontalAlignment: "left",
  verticalAlignment: "center",
  borders: { preset: "all", style: "thin", color: "#B6D7E5" },
};

sheet.getRange("A8:G25").format = {
  font: { color: "#243B53", size: 10 },
  wrapText: true,
  verticalAlignment: "top",
  borders: { insideHorizontal: { style: "thin", color: "#CBDDE5" } },
};

for (let row = 8; row <= 25; row += 1) {
  if (row % 2 === 0) {
    sheet.getRange(`A${row}:D${row}`).format.fill = "#C9EAF5";
  } else {
    sheet.getRange(`A${row}:D${row}`).format.fill = "#FFFFFF";
  }
  sheet.getRange(`E${row}`).format.fill = "#FFF9E5";
  sheet.getRange(`F${row}`).format.fill = "#DCEAF6";
  sheet.getRange(`G${row}`).format.fill = "#FFF9E5";
}

sheet.getRange("F8:F25").dataValidation = {
  rule: { type: "list", values: ["Not Tested", "Passed", "Failed", "Blocked"] },
};
sheet.getRange("F8:F25").conditionalFormats.add("containsText", {
  text: "Passed",
  format: { fill: "#DCFCE7", font: { bold: true, color: "#166534" } },
});
sheet.getRange("F8:F25").conditionalFormats.add("containsText", {
  text: "Failed",
  format: { fill: "#FEE2E2", font: { bold: true, color: "#991B1B" } },
});
sheet.getRange("F8:F25").conditionalFormats.add("containsText", {
  text: "Blocked",
  format: { fill: "#FEF3C7", font: { bold: true, color: "#92400E" } },
});

const widths = [11, 18, 42, 42, 38, 15, 28];
widths.forEach((width, index) => {
  sheet.getRangeByIndexes(0, index, 25, 1).format.columnWidth = width;
});
sheet.getRange("A7:G7").format.rowHeight = 28;
sheet.getRange("A8:G25").format.rowHeight = 36;
sheet.freezePanes.freezeRows(7);

const keyRange = await workbook.inspect({
  kind: "table",
  sheetId: "Whitebox Test",
  range: "A1:G25",
  include: "values,formulas",
  tableMaxRows: 25,
  tableMaxCols: 7,
});
console.log(keyRange.ndjson);

const formulaErrors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
console.log(formulaErrors.ndjson);

await fs.mkdir(outputDir, { recursive: true });
const preview = await workbook.render({
  sheetName: "Whitebox Test",
  autoCrop: "all",
  scale: 1.2,
  format: "png",
});
await fs.writeFile(`${outputDir}/preview-whitebox-simple.png`, new Uint8Array(await preview.arrayBuffer()));

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(`${outputDir}/Whitebox_Testing_Bhumi_Satya.xlsx`);
