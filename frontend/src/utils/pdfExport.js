const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 48;
const START_Y = 792;
const BOTTOM_Y = 54;

function sanitizeText(value) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdfText(value) {
  return sanitizeText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return sanitizeText(value);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "-";
  const number = Number(value);
  if (!Number.isFinite(number)) return sanitizeText(value);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
}

function formatNumber(value, suffix = "") {
  if (value === null || value === undefined || value === "") return "-";
  const number = Number(value);
  if (!Number.isFinite(number)) return sanitizeText(value);
  return `${number.toLocaleString("id-ID")}${suffix}`;
}

function makeFilename(prefix, value) {
  const key = sanitizeText(value || "dokumen")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${prefix}-${key || "dokumen"}.pdf`;
}

function wrapText(text, fontSize, maxWidth = PAGE_WIDTH - MARGIN_X * 2) {
  const clean = sanitizeText(text);
  const maxChars = Math.max(24, Math.floor(maxWidth / (fontSize * 0.52)));
  const words = clean.split(" ");
  const lines = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (`${current} ${word}`.length <= maxChars) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : ["-"];
}

function buildRows(rows) {
  return rows.filter(([, value]) => value !== null && value !== undefined && value !== "");
}

function addText(content, x, y, text, { font = "F1", size = 10 } = {}) {
  content.push(`BT /${font} ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`);
}

function buildPdf({ title, subtitle, sections }) {
  const pages = [];
  let content = [];
  let y = START_Y;

  const newPage = () => {
    pages.push(content);
    content = [];
    y = START_Y;
  };

  const ensureSpace = (height = 18) => {
    if (y - height < BOTTOM_Y) newPage();
  };

  addText(content, MARGIN_X, y, title, { font: "F2", size: 18 });
  y -= 24;
  if (subtitle) {
    for (const line of wrapText(subtitle, 10)) {
      addText(content, MARGIN_X, y, line, { size: 10 });
      y -= 14;
    }
  }
  addText(content, MARGIN_X, y, `Dibuat: ${formatDate(new Date())}`, { size: 9 });
  y -= 26;

  for (const section of sections) {
    ensureSpace(34);
    addText(content, MARGIN_X, y, section.heading, { font: "F2", size: 12 });
    y -= 16;

    for (const [label, value] of section.rows) {
      const labelText = `${label}:`;
      const valueLines = wrapText(value, 9, PAGE_WIDTH - MARGIN_X * 2 - 155);
      ensureSpace(14 * valueLines.length + 2);
      addText(content, MARGIN_X, y, labelText, { font: "F2", size: 9 });
      addText(content, MARGIN_X + 155, y, valueLines[0], { size: 9 });
      y -= 13;

      for (const extraLine of valueLines.slice(1)) {
        addText(content, MARGIN_X + 155, y, extraLine, { size: 9 });
        y -= 13;
      }
    }

    y -= 10;
  }

  pages.push(content);

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pages.map((_, idx) => `${5 + idx * 2} 0 R`).join(" ")}] /Count ${pages.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];

  pages.forEach((pageContent, idx) => {
    const contentObj = 6 + idx * 2;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObj} 0 R >>`,
    );
    const stream = pageContent.join("\n");
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, idx) => {
    offsets.push(pdf.length);
    pdf += `${idx + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return pdf;
}

function triggerPdfDownload(filename, pdfContent) {
  const blob = new Blob([pdfContent], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadAssetPdf(asset) {
  const title = "Laporan Data Aset";
  const subtitle = asset?.nama_aset || asset?.kode_aset || asset?.nibar || "Data Aset";
  const sections = [
    {
      heading: "Identitas Aset",
      rows: buildRows([
        ["Kode Aset", asset?.kode_aset],
        ["Nama Aset", asset?.nama_aset],
        ["Jenis Aset", asset?.jenis_aset],
        ["Sumber Data", asset?.sumber],
        ["Status", asset?.status],
        ["Tahun Perolehan", asset?.tahun_perolehan],
      ]),
    },
    {
      heading: "Legalitas dan Sertifikat",
      rows: buildRows([
        ["Status Sertifikat", asset?.status_sertifikat],
        ["Nomor Sertifikat", asset?.nomor_sertifikat],
        ["Jenis Hak", asset?.jenis_hak],
        ["NIB", asset?.nib],
        ["NIBAR", asset?.nibar],
        ["KW", asset?.kw],
        ["Atas Nama", asset?.atas_nama],
        ["Status Hukum", asset?.status_hukum],
      ]),
    },
    {
      heading: "Lokasi dan Fisik",
      rows: buildRows([
        ["Lokasi", asset?.lokasi],
        ["Kecamatan", asset?.kecamatan],
        ["Desa/Kelurahan", asset?.desa_kelurahan],
        ["Penggunaan Saat Ini", asset?.penggunaan_saat_ini],
        ["Luas", formatNumber(asset?.luas, " m2")],
        ["Luas Lapangan", formatNumber(asset?.luas_lapangan, " m2")],
        ["Koordinat", asset?.koordinat_lat && asset?.koordinat_long ? `${asset.koordinat_lat}, ${asset.koordinat_long}` : "-"],
      ]),
    },
    {
      heading: "Nilai dan Pemanfaatan",
      rows: buildRows([
        ["Nilai Aset", formatCurrency(asset?.nilai_aset)],
        ["Harga Perolehan", formatCurrency(asset?.harga_perolehan)],
        ["OPD Pengguna", asset?.opd_pengguna],
        ["Status Sewa", asset?.status_sewa],
        ["Penyewa Aktif", asset?.penyewa_aktif],
        ["Sewa Berakhir", formatDate(asset?.sewa_berakhir)],
        ["Keterangan", asset?.keterangan],
      ]),
    },
  ];

  triggerPdfDownload(makeFilename("aset", asset?.kode_aset || asset?.nibar || subtitle), buildPdf({ title, subtitle, sections }));
}

export function downloadSewaPdf(sewa) {
  const aset = sewa?.aset || {};
  const title = "Laporan Penyewaan Aset";
  const subtitle = sewa?.nama_aset || aset?.nama_aset || "Data Penyewaan";
  const sections = [
    {
      heading: "Identitas Penyewaan",
      rows: buildRows([
        ["Nama Aset", sewa?.nama_aset || aset?.nama_aset],
        ["Kode Aset", aset?.kode_aset],
        ["Nomor LOT", sewa?.no_lot],
        ["Status Sewa", sewa?.status],
        ["Nomor Kontrak", sewa?.nomor_kontrak],
      ]),
    },
    {
      heading: "Data Penyewa",
      rows: buildRows([
        ["Nama Penyewa", sewa?.nama_penyewa],
        ["NIK", sewa?.nik_penyewa],
        ["Instansi", sewa?.instansi_penyewa],
        ["Telepon", sewa?.telepon_penyewa],
        ["Email", sewa?.email_penyewa],
        ["Alamat", sewa?.alamat_penyewa],
      ]),
    },
    {
      heading: "Periode dan Nilai",
      rows: buildRows([
        ["Tanggal Mulai", formatDate(sewa?.tanggal_mulai)],
        ["Tanggal Berakhir", formatDate(sewa?.tanggal_berakhir)],
        ["Periode Bayar", sewa?.periode_bayar],
        ["Nilai Sewa per Periode", formatCurrency(sewa?.nilai_sewa)],
        ["Nilai Aset", formatCurrency(aset?.nilai_aset)],
      ]),
    },
    {
      heading: "Lokasi dan Catatan",
      rows: buildRows([
        ["Lokasi Aset", sewa?.lokasi_aset || aset?.lokasi],
        ["Kecamatan", aset?.kecamatan],
        ["Desa/Kelurahan", aset?.desa_kelurahan],
        ["Luas Aset", formatNumber(aset?.luas_lapangan || aset?.luas, " m2")],
        ["Catatan", sewa?.catatan],
      ]),
    },
  ];

  triggerPdfDownload(makeFilename("penyewaan", sewa?.no_lot || sewa?.id_sewa || subtitle), buildPdf({ title, subtitle, sections }));
}
