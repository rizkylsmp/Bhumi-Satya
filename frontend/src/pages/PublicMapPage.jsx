import MapPage from "./MapPage";

/**
 * Peta publik layar penuh menggunakan halaman peta admin yang sama dalam mode
 * read-only, sehingga kontrol dan fitur peta tidak diduplikasi.
 */
export default function PublicMapPage() {
  return (
    <div className="h-[calc(100vh-4rem)] w-full overflow-hidden">
      <MapPage publicMode />
    </div>
  );
}
