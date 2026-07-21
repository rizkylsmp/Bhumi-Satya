import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { canAccessMenu, normalizeRole } from "../utils/permissions";

/**
 * RoleGuard - Guards routes based on user role permissions
 * Silently redirects to dashboard if user doesn't have access
 */
export default function RoleGuard({ menuId, children }) {
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || "";
  const fallbackPath =
    normalizeRole(userRole) === "masyarakat"
      ? "/sewa/aset-tersedia"
      : "/dashboard";

  // If user doesn't have access to this menu, redirect to dashboard
  if (!canAccessMenu(userRole, menuId)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}
