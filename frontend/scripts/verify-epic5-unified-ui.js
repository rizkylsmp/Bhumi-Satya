import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const readSource = (relativePath) => readFile(path.join(rootDir, relativePath), "utf8");

try {
  const [
    sidebar,
    dashboard,
    router,
    assetPage,
    mapPage,
    assetSearch,
    assetForm,
    landingPage,
    masyarakatAuth,
    asetTersedia,
    sewaDisetujui,
  ] = await Promise.all([
    readSource("src/layouts/Sidebar.jsx"),
    readSource("src/pages/DashboardPage.jsx"),
    readSource("src/router/index.jsx"),
    readSource("src/pages/aset/AssetPage.jsx"),
    readSource("src/pages/MapPage.jsx"),
    readSource("src/components/asset/AssetSearch.jsx"),
    readSource("src/components/asset/AssetFormModal.jsx"),
    readSource("src/pages/LandingPage.jsx"),
    readSource("src/pages/masyarakat/MasyarakatAuthPage.jsx"),
    readSource("src/pages/masyarakat/AsetTersediaPage.jsx"),
    readSource("src/pages/masyarakat/SewaDisetujuiPage.jsx"),
  ]);

  assert(!/isBPKARole/.test(sidebar), "Sidebar masih bercabang berdasarkan instansi");
  assert(
    /label: "Kelola Aset"/.test(sidebar) &&
      /label: "Pusat Data Aset",\s*path: "\/aset"/.test(sidebar) &&
      /label: "Data Legal",\s*path: "\/aset\/legal"/.test(sidebar) &&
      /label: "Data Fisik",\s*path: "\/aset\/fisik"/.test(sidebar) &&
      /label: "Data Administratif",\s*path: "\/aset\/administratif"/.test(sidebar) &&
      /label: "Data Spasial",\s*path: "\/aset\/spasial"/.test(sidebar),
    "Sidebar harus menempatkan pusat data dan seluruh substansi di bawah Kelola Aset",
  );
  assert(
    /id: "aktivitas-sistem"/.test(sidebar) &&
      /label: "Aktivitas & Sistem"/.test(sidebar) &&
      /label: "Riwayat",\s*path: "\/riwayat"/.test(sidebar) &&
      /label: "Notifikasi",\s*path: "\/notifikasi"/.test(sidebar) &&
      /label: "Backup",\s*path: "\/backup"/.test(sidebar),
    "Riwayat, notifikasi, dan backup harus berada dalam dropdown Aktivitas & Sistem",
  );

  assert(
    /DashboardIntegratedPanel/.test(dashboard),
    "Dashboard harus memakai panel terpadu",
  );
  assert(
    !/DashboardBPKAPanel|isBPKARole/.test(dashboard),
    "Dashboard masih memilih panel berdasarkan instansi",
  );

  assert(
    !/PusatDataPage/.test(router) && /Navigate to="\/aset" replace/.test(router),
    "Route pusat-data harus menjadi redirect kompatibilitas ke aset",
  );
  assert(
    /path: "\/login",\s*element: \(\s*<LazyPage>\s*<LandingPage/.test(router),
    "Route login harus memakai landing page Bhumi Satya terpadu",
  );
  assert(
    /path: "\/peta-publik",\s*element: \(\s*<LazyPage>\s*<PublicMapPage/.test(router) &&
      /peta-publik/.test(landingPage) &&
      /Buka Peta Layar Penuh/.test(landingPage),
    "Landing page harus menyediakan tautan ke peta publik layar penuh",
  );
  assert(
    !/isBPKARole|instansi\?\.toLowerCase/.test(assetPage),
    "AssetPage masih menentukan workspace dari instansi pengguna",
  );
  assert(
    /AssetMapDisplay/.test(mapPage) &&
      !/isBPKARole|isBPKAMode|instansi\?\.toLowerCase/.test(mapPage),
    "MapPage masih memilih peta berdasarkan instansi pengguna",
  );
  assert(
    !/isBPKAMode/.test(assetSearch),
    "Filter aset tidak boleh menyembunyikan filter berdasarkan mode instansi",
  );
  assert(
    /sumber: sourceFilter/.test(assetSearch) &&
      /reconciliation_status: reconciliationFilter/.test(assetSearch),
    "Asal data dan status rekonsiliasi harus tersedia sebagai filter metadata",
  );
  assert(
    !/isBPKAMode|\bBPN\b|\bBPKA\b/.test(assetForm),
    "Form aset tidak boleh memiliki mode atau label institusi",
  );
  assert(
    /Aset pilihan yang siap disewa/.test(landingPage) &&
      /Masuk ke akun Anda untuk melanjutkan/.test(landingPage) &&
      !/Login Masyarakat|Login Internal/.test(landingPage) &&
      !/\bBPN\b|\bBPKA\b/.test(landingPage),
    "Landing page harus menggunakan satu alur login Bhumi Satya",
  );
  assert(
    !/\bBPKA\b|\bBPN\b/.test(`${masyarakatAuth}${asetTersedia}${sewaDisetujui}`),
    "Portal masyarakat tidak boleh merujuk ke sistem BPN/BPKA terpisah",
  );
  assert(
    /title="Identitas Aset"/.test(assetForm) &&
      /title="Data Legal"/.test(assetForm) &&
      /title="Data Fisik"/.test(assetForm) &&
      /title="Data Spasial"/.test(assetForm),
    "Form master aset harus menampilkan section data terpadu",
  );

  console.log(
    JSON.stringify(
      {
        success: true,
        sidebar: "asset-master-with-substansi",
        activitySystem: "grouped-dropdown",
        dashboard: "integrated",
        pusatDataRoute: "redirect-to-aset",
        assetWorkspace: "not-institution-scoped",
        mapWorkspace: "not-institution-scoped",
        assetFilters: "integrated",
        provenanceAndReconciliation: "visible-metadata-filters",
        assetForm: "institution-neutral",
        login: "single-bhumi-satya-entry",
        publicRental: "institution-neutral",
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
