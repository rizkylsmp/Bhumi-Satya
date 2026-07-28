import { Outlet } from "react-router-dom";
import PublicNavbar from "../components/layout/PublicNavbar";

/** Menjaga navbar publik tetap terpasang ketika konten rute berubah. */
export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-surface-secondary">
      <PublicNavbar />
      <Outlet />
    </div>
  );
}
