const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const START_Y = 716;
const BOTTOM_Y = 50;
const SECTION_HEADER_HEIGHT = 20;
const TABLE_HALF_WIDTH = CONTENT_WIDTH / 2;
const TABLE_LABEL_WIDTH = 78;

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
  return formatRupiah(number);
}

function formatNumber(value, suffix = "") {
  if (value === null || value === undefined || value === "") return "-";
  const number = Number(value);
  if (!Number.isFinite(number)) return sanitizeText(value);
  return `${formatNumeric(number)}${suffix}`;
}

function makeFilename(prefix, value) {
  const key = sanitizeText(value || "dokumen")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${prefix}-${key || "dokumen"}.pdf`;
}

function wrapText(
  text,
  fontSize,
  maxWidth = PAGE_WIDTH - MARGIN_X * 2,
  minChars = 24,
) {
  const clean = sanitizeText(text);
  const maxChars = Math.max(minChars, Math.floor(maxWidth / (fontSize * 0.52)));
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

function addText(
  content,
  x,
  y,
  text,
  { font = "F1", size = 10, color = null } = {},
) {
  const command = `BT /${font} ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`;
  content.push(color ? `q ${color.join(" ")} rg ${command} Q` : command);
}

function addCenteredText(content, x, width, y, text, options = {}) {
  const size = options.size || 10;
  const estimatedWidth = sanitizeText(text).length * size * 0.51;
  addText(content, x + Math.max(4, (width - estimatedWidth) / 2), y, text, options);
}

function addRectangle(
  content,
  x,
  y,
  width,
  height,
  { fill = null, stroke = true, lineWidth = 0.7 } = {},
) {
  content.push("q");
  content.push(`${lineWidth} w 0 0 0 RG`);
  if (fill) content.push(`${fill.join(" ")} rg`);
  content.push(`${x} ${y} ${width} ${height} re ${fill ? (stroke ? "B" : "f") : "S"}`);
  content.push("Q");
}

function addLine(content, x1, y1, x2, y2, lineWidth = 0.7) {
  content.push(`q ${lineWidth} w 0 0 0 RG ${x1} ${y1} m ${x2} ${y2} l S Q`);
}

function addImage(content, name, x, y, width, height) {
  content.push(`q ${width} 0 0 ${height} ${x} ${y} cm /${name} Do Q`);
}

function binaryStringToBytes(value) {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index) & 0xff;
  }
  return bytes;
}

function dataUrlToBinary(dataUrl) {
  const encoded = String(dataUrl).split(",")[1] || "";
  return window.atob(encoded);
}

function loadImage(url) {
  return fetch(url, { mode: "cors" })
    .then((response) => {
      if (!response.ok) throw new Error(`Gambar gagal dimuat (${response.status})`);
      return response.blob();
    })
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          const objectUrl = URL.createObjectURL(blob);
          const image = new Image();
          image.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(image);
          };
          image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Format gambar tidak dapat dibaca"));
          };
          image.src = objectUrl;
        }),
    );
}

function drawCoverImage(context, image, width, height) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    width,
    height,
  );
}

async function createJpegFromUrl(url, width = 720, height = 420) {
  if (!url || typeof document === "undefined") return null;
  const image = await loadImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#eef2f3";
  context.fillRect(0, 0, width, height);
  drawCoverImage(context, image, width, height);
  return {
    data: dataUrlToBinary(canvas.toDataURL("image/jpeg", 0.86)),
    width,
    height,
  };
}

async function createBrandLogo() {
  if (typeof document === "undefined") return null;
  const image = await loadImage("/bhumi-satya-logo.png");
  const width = 256;
  const height = 256;
  const padding = 18;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  const scale = Math.min(
    (width - padding * 2) / image.naturalWidth,
    (height - padding * 2) / image.naturalHeight,
  );
  const logoWidth = image.naturalWidth * scale;
  const logoHeight = image.naturalHeight * scale;
  context.drawImage(
    image,
    (width - logoWidth) / 2,
    (height - logoHeight) / 2,
    logoWidth,
    logoHeight,
  );
  return {
    data: dataUrlToBinary(canvas.toDataURL("image/jpeg", 0.94)),
    width,
    height,
  };
}

async function createMapSketch(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const width = 720;
  const height = 420;
  const latitudeSpan = 0.0032;
  const longitudeSpan =
    (latitudeSpan * (width / height)) / Math.max(0.25, Math.cos((lat * Math.PI) / 180));
  const bbox = [
    lng - longitudeSpan,
    lat - latitudeSpan,
    lng + longitudeSpan,
    lat + latitudeSpan,
  ].join(",");
  const mapUrl =
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export"
    + `?bbox=${encodeURIComponent(bbox)}`
    + "&bboxSR=4326&imageSR=4326"
    + `&size=${width},${height}&format=jpg&f=image`;
  const image = await loadImage(mapUrl);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  drawCoverImage(context, image, width, height);

  const markerX = width / 2;
  const markerY = height / 2;
  context.save();
  context.shadowColor = "rgba(0, 0, 0, 0.35)";
  context.shadowBlur = 8;
  context.shadowOffsetY = 3;
  context.beginPath();
  context.moveTo(markerX, markerY + 22);
  context.bezierCurveTo(
    markerX - 5,
    markerY + 12,
    markerX - 17,
    markerY + 2,
    markerX - 17,
    markerY - 10,
  );
  context.arc(markerX, markerY - 10, 17, Math.PI, 0, false);
  context.bezierCurveTo(
    markerX + 17,
    markerY + 2,
    markerX + 5,
    markerY + 12,
    markerX,
    markerY + 22,
  );
  context.closePath();
  context.fillStyle = "#dc2626";
  context.fill();
  context.lineWidth = 4;
  context.strokeStyle = "#ffffff";
  context.stroke();
  context.shadowColor = "transparent";
  context.beginPath();
  context.arc(markerX, markerY - 10, 5, 0, Math.PI * 2);
  context.fillStyle = "#ffffff";
  context.fill();
  context.restore();

  const coordinateLines = [
    `Latitude  : ${lat.toFixed(6)}`,
    `Longitude : ${lng.toFixed(6)}`,
  ];
  const tooltipWidth = 244;
  const tooltipHeight = 62;
  const tooltipX = Math.min(width - tooltipWidth - 18, markerX + 28);
  const tooltipY = markerY - tooltipHeight - 42;
  const tooltipRadius = 10;
  context.save();
  context.shadowColor = "rgba(15, 23, 42, 0.28)";
  context.shadowBlur = 12;
  context.shadowOffsetY = 4;
  context.fillStyle = "rgba(15, 23, 42, 0.92)";
  context.beginPath();
  context.roundRect(
    tooltipX,
    tooltipY,
    tooltipWidth,
    tooltipHeight,
    tooltipRadius,
  );
  context.fill();
  context.shadowColor = "transparent";
  context.beginPath();
  context.moveTo(tooltipX + 18, tooltipY + tooltipHeight);
  context.lineTo(markerX + 7, markerY - 25);
  context.lineTo(tooltipX + 40, tooltipY + tooltipHeight);
  context.closePath();
  context.fill();
  context.fillStyle = "#ffffff";
  context.font = "600 18px Arial, sans-serif";
  context.textBaseline = "middle";
  coordinateLines.forEach((line, index) => {
    context.fillText(line, tooltipX + 16, tooltipY + 20 + index * 24);
  });
  context.restore();

  return {
    data: dataUrlToBinary(canvas.toDataURL("image/jpeg", 0.88)),
    width,
    height,
  };
}

async function prepareDocumentMedia({ photoUrl, latitude, longitude }) {
  const [photoResult, mapResult] = await Promise.allSettled([
    createJpegFromUrl(photoUrl),
    createMapSketch(latitude, longitude),
  ]);
  return [
    {
      label: "Foto Kondisi Eksisting",
      image: photoResult.status === "fulfilled" ? photoResult.value : null,
      emptyText: photoUrl ? "Foto tidak dapat dimuat" : "Foto belum tersedia",
    },
    {
      label: "Sketsa Lokasi",
      image: mapResult.status === "fulfilled" ? mapResult.value : null,
      emptyText:
        Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))
          ? "Peta tidak dapat dimuat"
          : "Koordinat belum tersedia",
    },
  ];
}

export function buildPdf({ title, subtitle, sections, media = [], brandLogo = null }) {
  const pages = [];
  let imageCounter = 0;
  const preparedMedia = media.slice(0, 2).map((item) => ({
    ...item,
    imageName: item.image ? `Im${(imageCounter += 1)}` : null,
  }));
  const brandLogoName = brandLogo ? "BrandLogo" : null;
  const embeddedImages = [
    ...(brandLogoName
      ? [{ image: brandLogo, imageName: brandLogoName }]
      : []),
    ...preparedMedia.filter((item) => item.imageName),
  ];
  let content = [];
  let y;

  const addDocumentHeader = () => {
    const headerBottom = 730;
    const headerHeight = 78;
    const brandWidth = 106;
    const codeWidth = 116;
    const centerWidth = CONTENT_WIDTH - brandWidth - codeWidth;

    addRectangle(content, MARGIN_X, headerBottom, CONTENT_WIDTH, headerHeight, {
      fill: [1, 1, 1],
      lineWidth: 0.9,
    });
    addLine(
      content,
      MARGIN_X + brandWidth,
      headerBottom,
      MARGIN_X + brandWidth,
      headerBottom + headerHeight,
      0.9,
    );
    addLine(
      content,
      MARGIN_X + brandWidth + centerWidth,
      headerBottom,
      MARGIN_X + brandWidth + centerWidth,
      headerBottom + headerHeight,
      0.9,
    );

    if (brandLogoName) {
      addImage(
        content,
        brandLogoName,
        MARGIN_X + 31,
        headerBottom + 25,
        44,
        44,
      );
    }
    addCenteredText(content, MARGIN_X, brandWidth, headerBottom + 14, "BHUMI SATYA", {
      font: "F2",
      size: 8,
    });

    const centerX = MARGIN_X + brandWidth;
    addCenteredText(content, centerX, centerWidth, headerBottom + 53, "BHUMI SATYA", {
      font: "F2",
      size: 15,
    });
    addCenteredText(content, centerX, centerWidth, headerBottom + 37, "DIGITAL TWIN PERTANAHAN", {
      font: "F2",
      size: 9,
    });
    addCenteredText(content, centerX, centerWidth, headerBottom + 23, "Informasi bidang, bangunan, dan penyewaan", {
      size: 8,
    });
    addCenteredText(content, centerX, centerWidth, headerBottom + 11, "bhumisatya.web.id", {
      size: 8,
    });

    const codeX = centerX + centerWidth;
    addCenteredText(content, codeX, codeWidth, headerBottom + 52, "DOKUMEN DATA", {
      font: "F2",
      size: 9,
    });
    addRectangle(content, codeX + 21, headerBottom + 21, codeWidth - 42, 24, {
      fill: [0.83, 0.92, 0.94],
      lineWidth: 0.6,
    });
    addCenteredText(content, codeX + 21, codeWidth - 42, headerBottom + 29, "DIGITAL TWIN", {
      font: "F2",
      size: 8,
    });
    addCenteredText(content, codeX, codeWidth, headerBottom + 10, "Bhumi Satya", {
      size: 7,
    });

    y = START_Y;
  };

  const newPage = () => {
    if (content.length) pages.push(content);
    content = [];
    addDocumentHeader();
  };

  const ensureSpace = (height = 18) => {
    if (y - height < BOTTOM_Y) newPage();
  };

  addDocumentHeader();
  addRectangle(content, MARGIN_X, y - 24, CONTENT_WIDTH, 24, {
    fill: [0.68, 0.84, 0.88],
    lineWidth: 0.9,
  });
  addCenteredText(content, MARGIN_X, CONTENT_WIDTH, y - 16, title.toUpperCase(), {
    font: "F2",
    size: 11,
  });
  y -= 31;
  if (subtitle) {
    const subtitleLines = wrapText(subtitle, 9, CONTENT_WIDTH - 20);
    const subtitleHeight = Math.max(24, subtitleLines.length * 12 + 10);
    addRectangle(content, MARGIN_X, y - subtitleHeight, CONTENT_WIDTH, subtitleHeight, {
      fill: [0.97, 0.98, 0.98],
      lineWidth: 0.7,
    });
    subtitleLines.forEach((line, index) => {
      addCenteredText(content, MARGIN_X, CONTENT_WIDTH, y - 15 - index * 12, line, {
        font: index === 0 ? "F2" : "F1",
        size: 9,
      });
    });
    y -= subtitleHeight;
  } else {
    y -= 4;
  }

  for (const section of sections) {
    if (!section.rows.length) continue;
    ensureSpace(SECTION_HEADER_HEIGHT + 22);
    addRectangle(content, MARGIN_X, y - SECTION_HEADER_HEIGHT, CONTENT_WIDTH, SECTION_HEADER_HEIGHT, {
      fill: [0.68, 0.84, 0.88],
      lineWidth: 0.8,
    });
    addCenteredText(
      content,
      MARGIN_X,
      CONTENT_WIDTH,
      y - 14,
      section.heading.toUpperCase(),
      { font: "F2", size: 10 },
    );
    y -= SECTION_HEADER_HEIGHT;

    for (let index = 0; index < section.rows.length; index += 2) {
      const pairs = [section.rows[index], section.rows[index + 1]].filter(Boolean);
      const prepared = pairs.map(([label, value]) => ({
        labelLines: wrapText(label, 8, TABLE_LABEL_WIDTH - 10, 1),
        valueLines: wrapText(
          value,
          8,
          TABLE_HALF_WIDTH - TABLE_LABEL_WIDTH - 12,
        ),
      }));
      const lineCount = Math.max(
        1,
        ...prepared.flatMap((pair) => [pair.labelLines.length, pair.valueLines.length]),
      );
      const rowHeight = Math.max(20, lineCount * 10 + 8);
      ensureSpace(rowHeight);

      const rowBottom = y - rowHeight;
      addRectangle(content, MARGIN_X, rowBottom, CONTENT_WIDTH, rowHeight, {
        fill: [1, 1, 1],
        lineWidth: 0.65,
      });
      pairs.forEach((pair, pairIndex) => {
        const pairX = MARGIN_X + pairIndex * TABLE_HALF_WIDTH;
        const valueX = pairX + TABLE_LABEL_WIDTH;
        addRectangle(content, pairX, rowBottom, TABLE_LABEL_WIDTH, rowHeight, {
          fill: [0.95, 0.96, 0.96],
          lineWidth: 0.4,
        });
        addLine(content, valueX, rowBottom, valueX, y, 0.65);
        if (pairIndex === 1) {
          addLine(content, pairX, rowBottom, pairX, y, 0.65);
        }

        prepared[pairIndex].labelLines.forEach((line, lineIndex) => {
          addText(content, pairX + 6, y - 13 - lineIndex * 10, line, {
            font: "F2",
            size: 7.6,
          });
        });
        prepared[pairIndex].valueLines.forEach((line, lineIndex) => {
          addText(content, valueX + 6, y - 13 - lineIndex * 10, line, {
            size: 7.8,
          });
        });
      });
      y -= rowHeight;
    }
  }

  if (preparedMedia.length) {
    const labelHeight = 20;
    const imageAreaHeight = 154;
    ensureSpace(SECTION_HEADER_HEIGHT + labelHeight + imageAreaHeight);
    addRectangle(content, MARGIN_X, y - SECTION_HEADER_HEIGHT, CONTENT_WIDTH, SECTION_HEADER_HEIGHT, {
      fill: [0.68, 0.84, 0.88],
      lineWidth: 0.8,
    });
    addCenteredText(content, MARGIN_X, CONTENT_WIDTH, y - 14, "FOTO DAN SKETSA", {
      font: "F2",
      size: 10,
    });
    y -= SECTION_HEADER_HEIGHT;

    addRectangle(content, MARGIN_X, y - labelHeight, CONTENT_WIDTH, labelHeight, {
      fill: [1, 1, 1],
      lineWidth: 0.65,
    });
    addLine(content, MARGIN_X + TABLE_HALF_WIDTH, y - labelHeight, MARGIN_X + TABLE_HALF_WIDTH, y, 0.65);
    preparedMedia.forEach((item, index) => {
      addCenteredText(
        content,
        MARGIN_X + index * TABLE_HALF_WIDTH,
        TABLE_HALF_WIDTH,
        y - 14,
        item.label,
        { font: "F2", size: 8 },
      );
    });
    y -= labelHeight;

    addRectangle(content, MARGIN_X, y - imageAreaHeight, CONTENT_WIDTH, imageAreaHeight, {
      fill: [0.98, 0.98, 0.98],
      lineWidth: 0.65,
    });
    addLine(
      content,
      MARGIN_X + TABLE_HALF_WIDTH,
      y - imageAreaHeight,
      MARGIN_X + TABLE_HALF_WIDTH,
      y,
      0.65,
    );
    preparedMedia.forEach((item, index) => {
      const slotX = MARGIN_X + index * TABLE_HALF_WIDTH;
      if (!item.image || !item.imageName) {
        addCenteredText(
          content,
          slotX,
          TABLE_HALF_WIDTH,
          y - imageAreaHeight / 2,
          item.emptyText || "Belum tersedia",
          { size: 8 },
        );
        return;
      }

      const maxWidth = TABLE_HALF_WIDTH - 16;
      const maxHeight = imageAreaHeight - 16;
      const scale = Math.min(
        maxWidth / item.image.width,
        maxHeight / item.image.height,
      );
      const imageWidth = item.image.width * scale;
      const imageHeight = item.image.height * scale;
      addImage(
        content,
        item.imageName,
        slotX + (TABLE_HALF_WIDTH - imageWidth) / 2,
        y - imageAreaHeight + (imageAreaHeight - imageHeight) / 2,
        imageWidth,
        imageHeight,
      );
    });
    y -= imageAreaHeight;
  }

  ensureSpace(40);
  const noteHeight = 34;
  addRectangle(content, MARGIN_X, y - noteHeight, CONTENT_WIDTH, noteHeight, {
    fill: [0.97, 0.98, 0.98],
    lineWidth: 0.65,
  });
  addText(content, MARGIN_X + 6, y - 13, `Tanggal dokumen: ${formatDate(new Date())}`, {
    font: "F2",
    size: 7.5,
  });
  addText(
    content,
    MARGIN_X + 6,
    y - 26,
    "Dokumen ini dihasilkan otomatis dari sistem Bhumi Satya.",
    { size: 7.5 },
  );
  pages.push(content);

  pages.forEach((page, index) => {
    addLine(page, MARGIN_X, 35, PAGE_WIDTH - MARGIN_X, 35, 0.5);
    addText(page, MARGIN_X, 22, "Bhumi Satya - Digital Twin Pertanahan", {
      size: 7,
    });
    addText(page, PAGE_WIDTH - MARGIN_X - 48, 22, `Halaman ${index + 1}/${pages.length}`, {
      size: 7,
    });
  });

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pages.map((_, idx) => `${5 + idx * 2} 0 R`).join(" ")}] /Count ${pages.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];

  const imageObjectStart = 5 + pages.length * 2;
  const xObjects = embeddedImages.length
    ? `/XObject << ${embeddedImages
        .map((item, index) => `/${item.imageName} ${imageObjectStart + index} 0 R`)
        .join(" ")} >>`
    : "";

  pages.forEach((pageContent, idx) => {
    const contentObj = 6 + idx * 2;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> ${xObjects} >> /Contents ${contentObj} 0 R >>`,
    );
    const stream = pageContent.join("\n");
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });

  embeddedImages.forEach((item) => {
    objects.push(
      `<< /Type /XObject /Subtype /Image /Width ${item.image.width} /Height ${item.image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${item.image.data.length} >>\nstream\n${item.image.data}\nendstream`,
    );
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
  const blob = new Blob([binaryStringToBytes(pdfContent)], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function firstPhoto(...sources) {
  for (const source of sources) {
    if (Array.isArray(source)) {
      const photo = source.find((item) => typeof item === "string" && item);
      if (photo) return photo;
    } else if (typeof source === "string" && source) {
      return source;
    }
  }
  return null;
}

function getAssetCoordinates(asset) {
  return {
    latitude: asset?.koordinat_lat ?? asset?.latitude ?? asset?.lat,
    longitude: asset?.koordinat_long ?? asset?.longitude ?? asset?.lng,
  };
}

export function getPdfBuildingIdentity(asset) {
  const catalog = asset?.catalogs3d?.[0] || asset?.catalog3d || {};

  return {
    id: asset?.id_aset ?? asset?.id ?? asset?.id_asset ?? null,
    code:
      asset?.kode_bangunan
      || asset?.kode_aset
      || asset?.kode_3d
      || catalog?.kode_3d
      || null,
    name:
      asset?.nama_bangunan
      || asset?.nama_aset
      || asset?.building_name_3d
      || asset?.nama_bangunan_3d
      || catalog?.building_name
      || null,
  };
}

const humanizeValue = (value) => {
  if (!value) return null;
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export function buildBuildingPdfDocument(catalog) {
  const asset = catalog?.asset || catalog?.aset || {};
  const activeModel = catalog?.active_model || catalog?.activeModel || {};
  const buildingCode = catalog?.kode_3d || "-";
  const buildingName = catalog?.building_name || buildingCode;
  const latitude = catalog?.center_y ?? activeModel?.location_lat ?? asset?.koordinat_lat;
  const longitude = catalog?.center_x ?? activeModel?.location_long ?? asset?.koordinat_long;

  return {
    title: "Laporan Data Bangunan",
    subtitle: `${buildingName} - ${buildingCode}`,
    coordinates: { latitude, longitude },
    photoUrl: firstPhoto(asset?.foto_aset),
    filenameKey: buildingCode,
    sections: [
      {
        heading: "Identitas Bangunan",
        rows: buildRows([
          ["ID Primary Key", asset?.id_aset ?? asset?.id],
          ["Kode Bangunan", buildingCode],
          ["Nama Bangunan", buildingName],
          ["Kode Bidang 2D", catalog?.kode_2d],
          ["Kode Tanah", asset?.kode_aset],
          ["Nama Tanah", asset?.nama_aset],
          ["Status Katalog", humanizeValue(catalog?.status)],
        ]),
      },
      {
        heading: "Informasi Model 3D",
        rows: buildRows([
          ["Status Model", humanizeValue(catalog?.model_status)],
          ["Jumlah Versi", catalog?.model_count],
          ["LOD Aktif", activeModel?.lod],
          ["Versi Aktif", activeModel?.version],
          ["Format", catalog?.model_format || activeModel?.format || activeModel?.model_type],
          ["Nama File", activeModel?.original_name],
          ["Diperbarui", formatDate(catalog?.model_updated_at || catalog?.updated_at)],
        ]),
      },
      {
        heading: "Dimensi dan Posisi",
        rows: buildRows([
          ["Tinggi Bangunan", formatNumber(asset?.building_height_m, " m")],
          ["Jumlah Lantai", asset?.building_floors],
          ["Elevasi Dasar", formatNumber(asset?.building_base_elevation_m, " m")],
          ["Latitude", latitude],
          ["Longitude", longitude],
          ["CRS Model", asset?.model_3d_source_crs],
        ]),
      },
      {
        heading: "Lokasi Tanah",
        rows: buildRows([
          ["Lokasi", asset?.lokasi],
          ["Kecamatan", asset?.kecamatan],
          ["Desa/Kelurahan", asset?.desa_kelurahan],
          ["OPD Pengguna", asset?.opd_pengguna],
          ["Luas Tanah", formatNumber(asset?.luas, " m2")],
          ["Penggunaan", asset?.penggunaan_saat_ini],
        ]),
      },
    ],
  };
}

export async function downloadBuildingPdf(catalog) {
  const document = buildBuildingPdfDocument(catalog);
  const [media, brandLogo] = await Promise.all([
    prepareDocumentMedia({
      photoUrl: document.photoUrl,
      ...document.coordinates,
    }),
    createBrandLogo().catch(() => null),
  ]);

  triggerPdfDownload(
    makeFilename("bangunan", document.filenameKey),
    buildPdf({
      title: document.title,
      subtitle: document.subtitle,
      sections: document.sections,
      media,
      brandLogo,
    }),
  );
}

export function buildLandPdfDocument(asset) {
  const identity = {
    id: asset?.id_aset ?? asset?.id ?? asset?.id_asset ?? null,
    code: asset?.kode_tanah || asset?.kode_aset || null,
    name: asset?.nama_tanah || asset?.nama_aset || null,
  };

  return {
    title: "Laporan Data Tanah",
    subtitle: identity.name || identity.code || asset?.nibar || "Data Tanah",
    coordinates: getAssetCoordinates(asset),
    photoUrl: firstPhoto(asset?.foto_aset),
    filenameKey: identity.code || asset?.nibar,
    sections: [
      {
        heading: "Identitas Tanah",
        rows: buildRows([
          ["ID Primary Key", identity.id],
          ["Kode Tanah", identity.code],
          ["Nama Tanah", identity.name],
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
    ],
  };
}

export async function downloadAssetPdf(asset) {
  const document = buildLandPdfDocument(asset);
  const [media, brandLogo] = await Promise.all([
    prepareDocumentMedia({
      photoUrl: document.photoUrl,
      ...document.coordinates,
    }),
    createBrandLogo().catch(() => null),
  ]);

  triggerPdfDownload(
    makeFilename("tanah", document.filenameKey || document.subtitle),
    buildPdf({
      title: document.title,
      subtitle: document.subtitle,
      sections: document.sections,
      media,
      brandLogo,
    }),
  );
}

export async function downloadSewaPdf(sewa) {
  const aset = sewa?.aset || {};
  const identity = getPdfBuildingIdentity(aset);
  const buildingCode = sewa?.kode_3d || sewa?.kode_bangunan || identity.code;
  const buildingName = sewa?.building_name_3d
    || sewa?.nama_bangunan
    || identity.name
    || sewa?.nama_aset;
  const title = "Laporan Penyewaan Bangunan";
  const subtitle = buildingName || buildingCode || "Data Penyewaan";
  const coordinates = getAssetCoordinates(aset);
  const [media, brandLogo] = await Promise.all([
    prepareDocumentMedia({
      photoUrl: firstPhoto(aset?.foto_aset, sewa?.foto_sewa),
      ...coordinates,
    }),
    createBrandLogo().catch(() => null),
  ]);
  const sections = [
    {
      heading: "Identitas Penyewaan",
      rows: buildRows([
        ["ID Primary Key", identity.id],
        ["Nama Bangunan", buildingName],
        ["Kode Bangunan", buildingCode],
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

  triggerPdfDownload(
    makeFilename("penyewaan", sewa?.no_lot || sewa?.id_sewa || subtitle),
    buildPdf({ title, subtitle, sections, media, brandLogo }),
  );
}
import {
  formatCurrency as formatRupiah,
  formatNumber as formatNumeric,
} from "./format";
