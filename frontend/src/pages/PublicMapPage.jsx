import MapPage from "./MapPage";
import { useNavigate } from "react-router-dom";
import { HouseIcon, MapTrifoldIcon } from "@phosphor-icons/react";
import PublicNavbar from "../components/layout/PublicNavbar";

/**
 * Peta publik layar penuh menggunakan halaman peta admin yang sama dalam mode
 * read-only, sehingga kontrol dan fitur peta tidak diduplikasi.
 */
export default function PublicMapPage() {
  const navigate = useNavigate();

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className="absolute inset-x-0 top-16 bottom-0">
        <MapPage publicMode />
      </div>
      <PublicNavbar
        fixed
        links={[
          {
            label: "Beranda",
            icon: HouseIcon,
            onClick: () => navigate("/sewa-tersedia"),
          },
          {
            label: "Peta",
            icon: MapTrifoldIcon,
            onClick: () => navigate("/peta-publik"),
          },
        ]}
        onLogin={() => navigate("/login")}
      />
    </div>
  );
}
