import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { isRouteAllowed } from "@/constants/routes";

export function ProtectedRoute() {
  const { isAuthenticated, role } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isRouteAllowed(location.pathname, role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
