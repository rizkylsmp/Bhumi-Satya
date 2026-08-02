import { Outlet, useLocation } from "react-router-dom";
import PublicNavbar from "../components/layout/PublicNavbar";
import PublicFooter from "../components/layout/PublicFooter";

/** Menjaga navbar publik tetap terpasang ketika konten rute berubah. */
export default function PublicLayout() {
  const location = useLocation();
  const showFooter = location.pathname !== "/peta-publik";

  return (
    <div className="flex min-h-screen flex-col bg-surface-secondary">
      <PublicNavbar />
      <div key={location.pathname} className="route-content-enter flex-1">
        <Outlet />
      </div>
      {showFooter && <PublicFooter />}
    </div>
  );
}
