import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores";

export function AuthRouteGuard() {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

export function MFARouteGuard() {
  const { pendingUser, isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  if (!pendingUser) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
