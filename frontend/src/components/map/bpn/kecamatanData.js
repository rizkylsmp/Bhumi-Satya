/**
 * Simplified boundary data for Kecamatan & Kelurahan in Kota Pasuruan.
 * Coordinates are approximate bounding polygons.
 */

export const KECAMATAN_COLORS = {
  bugul_kidul: "#6366f1", // indigo
  gadingrejo: "#14b8a6", // teal
  panggungrejo: "#f97316", // orange
  purworejo: "#8b5cf6", // violet
};

export const kecamatanData = [
  {
    id: "bugul_kidul",
    nama: "Bugul Kidul",
    color: KECAMATAN_COLORS.bugul_kidul,
    boundary: [
      [-7.655, 112.92],
      [-7.655, 112.94],
      [-7.665, 112.94],
      [-7.67, 112.935],
      [-7.67, 112.92],
      [-7.665, 112.915],
    ],
    kelurahan: [
      {
        id: "bugul_kidul_bakalan",
        nama: "Bakalan",
        boundary: [
          [-7.655, 112.92],
          [-7.655, 112.93],
          [-7.66, 112.93],
          [-7.66, 112.92],
        ],
      },
      {
        id: "bugul_kidul_blandongan",
        nama: "Blandongan",
        boundary: [
          [-7.655, 112.93],
          [-7.655, 112.94],
          [-7.66, 112.94],
          [-7.66, 112.93],
        ],
      },
      {
        id: "bugul_kidul_bugul_kidul",
        nama: "Bugul Kidul",
        boundary: [
          [-7.66, 112.92],
          [-7.66, 112.93],
          [-7.665, 112.93],
          [-7.665, 112.92],
        ],
      },
      {
        id: "bugul_kidul_kepel",
        nama: "Kepel",
        boundary: [
          [-7.66, 112.93],
          [-7.66, 112.94],
          [-7.665, 112.94],
          [-7.665, 112.93],
        ],
      },
      {
        id: "bugul_kidul_krampyangan",
        nama: "Krampyangan",
        boundary: [
          [-7.665, 112.92],
          [-7.665, 112.93],
          [-7.67, 112.93],
          [-7.67, 112.92],
        ],
      },
      {
        id: "bugul_kidul_tapaan",
        nama: "Tapaan",
        boundary: [
          [-7.665, 112.93],
          [-7.665, 112.94],
          [-7.67, 112.94],
          [-7.67, 112.93],
        ],
      },
    ],
  },
  {
    id: "gadingrejo",
    nama: "Gadingrejo",
    color: KECAMATAN_COLORS.gadingrejo,
    boundary: [
      [-7.63, 112.895],
      [-7.63, 112.915],
      [-7.645, 112.915],
      [-7.65, 112.91],
      [-7.65, 112.895],
      [-7.645, 112.89],
    ],
    kelurahan: [
      {
        id: "gadingrejo_gadingrejo",
        nama: "Gadingrejo",
        boundary: [
          [-7.63, 112.895],
          [-7.63, 112.905],
          [-7.637, 112.905],
          [-7.637, 112.895],
        ],
      },
      {
        id: "gadingrejo_gentong",
        nama: "Gentong",
        boundary: [
          [-7.63, 112.905],
          [-7.63, 112.915],
          [-7.637, 112.915],
          [-7.637, 112.905],
        ],
      },
      {
        id: "gadingrejo_karangketug",
        nama: "Karangketug",
        boundary: [
          [-7.637, 112.895],
          [-7.637, 112.905],
          [-7.643, 112.905],
          [-7.643, 112.895],
        ],
      },
      {
        id: "gadingrejo_petahunan",
        nama: "Petahunan",
        boundary: [
          [-7.637, 112.905],
          [-7.637, 112.915],
          [-7.643, 112.915],
          [-7.643, 112.905],
        ],
      },
      {
        id: "gadingrejo_randusari",
        nama: "Randusari",
        boundary: [
          [-7.643, 112.895],
          [-7.643, 112.905],
          [-7.65, 112.905],
          [-7.65, 112.895],
        ],
      },
      {
        id: "gadingrejo_sebani",
        nama: "Sebani",
        boundary: [
          [-7.643, 112.905],
          [-7.643, 112.915],
          [-7.65, 112.915],
          [-7.65, 112.905],
        ],
      },
      {
        id: "gadingrejo_krapyakrejo",
        nama: "Krapyakrejo",
        boundary: [
          [-7.636, 112.89],
          [-7.636, 112.895],
          [-7.643, 112.895],
          [-7.643, 112.89],
        ],
      },
    ],
  },
  {
    id: "panggungrejo",
    nama: "Panggungrejo",
    color: KECAMATAN_COLORS.panggungrejo,
    boundary: [
      [-7.635, 112.905],
      [-7.635, 112.925],
      [-7.65, 112.925],
      [-7.655, 112.92],
      [-7.655, 112.905],
      [-7.65, 112.9],
    ],
    kelurahan: [
      {
        id: "panggungrejo_panggungrejo",
        nama: "Panggungrejo",
        boundary: [
          [-7.635, 112.905],
          [-7.635, 112.915],
          [-7.642, 112.915],
          [-7.642, 112.905],
        ],
      },
      {
        id: "panggungrejo_pekuncen",
        nama: "Pekuncen",
        boundary: [
          [-7.635, 112.915],
          [-7.635, 112.925],
          [-7.642, 112.925],
          [-7.642, 112.915],
        ],
      },
      {
        id: "panggungrejo_mandaranrejo",
        nama: "Mandaranrejo",
        boundary: [
          [-7.642, 112.905],
          [-7.642, 112.915],
          [-7.648, 112.915],
          [-7.648, 112.905],
        ],
      },
      {
        id: "panggungrejo_karanganyar",
        nama: "Karanganyar",
        boundary: [
          [-7.642, 112.915],
          [-7.642, 112.925],
          [-7.648, 112.925],
          [-7.648, 112.915],
        ],
      },
      {
        id: "panggungrejo_kandangsapi",
        nama: "Kandangsapi",
        boundary: [
          [-7.648, 112.905],
          [-7.648, 112.915],
          [-7.655, 112.915],
          [-7.655, 112.905],
        ],
      },
      {
        id: "panggungrejo_trajeng",
        nama: "Trajeng",
        boundary: [
          [-7.648, 112.915],
          [-7.648, 112.925],
          [-7.655, 112.925],
          [-7.655, 112.915],
        ],
      },
      {
        id: "panggungrejo_bangilan",
        nama: "Bangilan",
        boundary: [
          [-7.638, 112.9],
          [-7.638, 112.905],
          [-7.645, 112.905],
          [-7.645, 112.9],
        ],
      },
    ],
  },
  {
    id: "purworejo",
    nama: "Purworejo",
    color: KECAMATAN_COLORS.purworejo,
    boundary: [
      [-7.64, 112.88],
      [-7.64, 112.895],
      [-7.655, 112.895],
      [-7.66, 112.89],
      [-7.66, 112.88],
      [-7.655, 112.875],
    ],
    kelurahan: [
      {
        id: "purworejo_purworejo",
        nama: "Purworejo",
        boundary: [
          [-7.64, 112.88],
          [-7.64, 112.887],
          [-7.647, 112.887],
          [-7.647, 112.88],
        ],
      },
      {
        id: "purworejo_sekargadung",
        nama: "Sekargadung",
        boundary: [
          [-7.64, 112.887],
          [-7.64, 112.895],
          [-7.647, 112.895],
          [-7.647, 112.887],
        ],
      },
      {
        id: "purworejo_tembokrejo",
        nama: "Tembokrejo",
        boundary: [
          [-7.647, 112.88],
          [-7.647, 112.887],
          [-7.653, 112.887],
          [-7.653, 112.88],
        ],
      },
      {
        id: "purworejo_wirogunan",
        nama: "Wirogunan",
        boundary: [
          [-7.647, 112.887],
          [-7.647, 112.895],
          [-7.653, 112.895],
          [-7.653, 112.887],
        ],
      },
      {
        id: "purworejo_pohjentrek",
        nama: "Pohjentrek",
        boundary: [
          [-7.653, 112.88],
          [-7.653, 112.887],
          [-7.66, 112.887],
          [-7.66, 112.88],
        ],
      },
      {
        id: "purworejo_purutrejo",
        nama: "Purutrejo",
        boundary: [
          [-7.653, 112.887],
          [-7.653, 112.895],
          [-7.66, 112.895],
          [-7.66, 112.887],
        ],
      },
      {
        id: "purworejo_kebonagung",
        nama: "Kebonagung",
        boundary: [
          [-7.655, 112.875],
          [-7.655, 112.88],
          [-7.66, 112.88],
          [-7.66, 112.875],
        ],
      },
      {
        id: "purworejo_kebonsari",
        nama: "Kebonsari",
        boundary: [
          [-7.645, 112.875],
          [-7.645, 112.88],
          [-7.653, 112.88],
          [-7.653, 112.875],
        ],
      },
    ],
  },
];
