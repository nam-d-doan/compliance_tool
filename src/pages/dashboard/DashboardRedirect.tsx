import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores";

export default function DashboardRedirect() {
  const { role } = useAuthStore();

  switch (role) {
    case "executive":
      return <Navigate to="/dashboard/executive" replace />;
    case "owner":
      return <Navigate to="/dashboard/owner" replace />;
    case "approver":
      return <Navigate to="/dashboard/approver" replace />;
    case "admin":
      return <Navigate to="/dashboard/admin" replace />;
    default:
      return <Navigate to="/dashboard/executive" replace />;
  }
}
