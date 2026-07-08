import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from "react-router-dom";
import { lazy } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/navigation/ProtectedRoute";
import {
  AuthRouteGuard,
  MFARouteGuard,
} from "@/components/navigation/AuthRouteGuards";

// Auth pages
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const ForgotPasswordPage = lazy(
  () => import("@/pages/auth/ForgotPasswordPage"),
);
const MFAPage = lazy(() => import("@/pages/auth/MFAPage"));

// Dashboard pages
const DashboardRedirect = lazy(
  () => import("@/pages/dashboard/DashboardRedirect"),
);
const ExecutiveDashboardPage = lazy(
  () => import("@/pages/dashboard/ExecutiveDashboardPage"),
);
const OwnerDashboardPage = lazy(
  () => import("@/pages/dashboard/OwnerDashboardPage"),
);
const ApproverDashboardPage = lazy(
  () => import("@/pages/dashboard/ApproverDashboardPage"),
);
const ReviewerDashboardPage = lazy(
  () => import("@/pages/dashboard/ReviewerDashboardPage"),
);
const AdminDashboardPage = lazy(
  () => import("@/pages/dashboard/AdminDashboardPage"),
);

// Module placeholder pages
const ObligationListPage = lazy(
  () => import("@/pages/obligations/ObligationListPage"),
);
const ObligationDetailPage = lazy(
  () => import("@/pages/obligations/ObligationDetailPage"),
);
const ObligationCreatePage = lazy(
  () => import("@/pages/obligations/ObligationCreatePage"),
);
const CAPDashboardPage = lazy(() => import("@/pages/cap/CAPDashboardPage"));
const CAPListPage = lazy(() => import("@/pages/cap/CAPListPage"));
const CAPDetailPage = lazy(() => import("@/pages/cap/CAPDetailPage"));
const CAPCreatePage = lazy(() => import("@/pages/cap/CAPCreatePage"));
const NCCListPage = lazy(() => import("@/pages/ncc/NCCListPage"));
const NCCDetailPage = lazy(() => import("@/pages/ncc/NCCDetailPage"));
const NCCCreatePage = lazy(() => import("@/pages/ncc/NCCCreatePage"));
const RegulationLibraryPage = lazy(
  () => import("@/pages/regulation/RegulationLibraryPage"),
);
const RegulationDetailPage = lazy(
  () => import("@/pages/regulation/RegulationDetailPage"),
);
const RegulationComparisonPage = lazy(
  () => import("@/pages/regulation/RegulationComparisonPage"),
);
const RegulationImpactPage = lazy(
  () => import("@/pages/regulation/RegulationImpactPage"),
);
const RegulationCreatePage = lazy(
  () => import("@/pages/regulation/RegulationCreatePage"),
);
const RegulationEditPage = lazy(
  () => import("@/pages/regulation/RegulationEditPage"),
);
const AssignmentListPage = lazy(
  () => import("@/pages/assignment/AssignmentListPage"),
);
const AssignmentCreatePage = lazy(
  () => import("@/pages/assignment/AssignmentCreatePage"),
);
const AssignmentDetailPage = lazy(
  () => import("@/pages/assignment/AssignmentDetailPage"),
);
const ReportsIndexPage = lazy(() => import("@/pages/reports/ReportsIndexPage"));
const ReportsStatusPage = lazy(
  () => import("@/pages/reports/ReportsStatusPage"),
);
const ReportsCalendarPage = lazy(
  () => import("@/pages/reports/ReportsCalendarPage"),
);
const ReportsCAPPage = lazy(() => import("@/pages/reports/ReportsCAPPage"));
const ReportsExecutivePage = lazy(
  () => import("@/pages/reports/ReportsExecutivePage"),
);
const EWSReportPage = lazy(() => import("@/pages/reports/EWSReportPage"));
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"));
const AdminRolesPage = lazy(() => import("@/pages/admin/AdminRolesPage"));
const AdminOrganizationPage = lazy(
  () => import("@/pages/admin/AdminOrganizationPage"),
);
const AdminAuditLogsPage = lazy(
  () => import("@/pages/admin/AdminAuditLogsPage"),
);
const AdminAIConfigPage = lazy(() => import("@/pages/admin/AdminAIConfigPage"));
const SettingsPage = lazy(() => import("@/pages/settings/SettingsPage"));
const ProfilePage = lazy(() => import("@/pages/profile/ProfilePage"));
const UnauthorizedPage = lazy(
  () => import("@/pages/unauthorized/UnauthorizedPage"),
);
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

const route = (
  path: string,
  element: React.ReactNode,
  crumb?: string,
): RouteObject => ({
  path,
  element,
  handle: crumb ? { crumb } : undefined,
});

export const router = createBrowserRouter([
  // Public routes
  {
    element: <AuthRouteGuard />,
    children: [
      route("/login", <LoginPage />, "Login"),
      route("/forgot-password", <ForgotPasswordPage />, "Forgot Password"),
    ],
  },
  {
    element: <MFARouteGuard />,
    children: [route("/mfa", <MFAPage />, "MFA")],
  },

  // Protected routes with layout
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          route("/dashboard", <DashboardRedirect />, "Dashboard"),
          route(
            "/dashboard/executive",
            <ExecutiveDashboardPage />,
            "Executive",
          ),
          route("/dashboard/owner", <OwnerDashboardPage />, "Owner"),
          route("/dashboard/approver", <ApproverDashboardPage />, "Approver"),
          route("/dashboard/reviewer", <ReviewerDashboardPage />, "Reviewer"),
          route("/dashboard/admin", <AdminDashboardPage />, "Admin"),

          route("/obligations", <ObligationListPage />, "Obligations"),
          route("/obligations/create", <ObligationCreatePage />, "Create"),
          route("/obligations/:id", <ObligationDetailPage />, "Detail"),

          route("/cap", <CAPDashboardPage />, "Corrective Actions"),
          route("/cap/list", <CAPListPage />, "All CAPs"),
          route("/cap/create", <CAPCreatePage />, "Create CAP"),
          route("/cap/:id", <CAPDetailPage />, "Detail"),

          route("/ncc/list", <NCCListPage />, "All NCCs"),
          route("/ncc/create", <NCCCreatePage />, "Create NCC"),
          route("/ncc/:id", <NCCDetailPage />, "NCC Detail"),

          route("/regulation", <RegulationLibraryPage />, "Regulations"),
          route("/regulation/create", <RegulationCreatePage />, "Create"),
          route("/regulation/:id/edit", <RegulationEditPage />, "Edit"),
          route("/regulation/compare", <RegulationComparisonPage />, "Compare"),
          route("/regulation/:id/impact", <RegulationImpactPage />, "Impact"),
          route("/regulation/:id", <RegulationDetailPage />, "Detail"),

          route("/assignment", <AssignmentListPage />, "Assignments"),
          route(
            "/assignment/create",
            <AssignmentCreatePage />,
            "Create Assignment",
          ),
          route("/assignment/:id", <AssignmentDetailPage />, "Detail"),

          route("/reports", <ReportsIndexPage />, "Reports"),
          route("/reports/status", <ReportsStatusPage />, "Status"),
          route("/reports/calendar", <ReportsCalendarPage />, "Calendar"),
          route("/reports/cap", <ReportsCAPPage />, "CAP Reports"),
          route(
            "/reports/executive",
            <ReportsExecutivePage />,
            "Executive Reports",
          ),
          route("/reports/ews", <EWSReportPage />, "Early Warning System"),

          route("/admin/users", <AdminUsersPage />, "Users"),
          route("/admin/roles", <AdminRolesPage />, "Roles"),
          route(
            "/admin/organization",
            <AdminOrganizationPage />,
            "Organization",
          ),
          route("/admin/audit-logs", <AdminAuditLogsPage />, "Audit Logs"),
          route("/admin/ai-config", <AdminAIConfigPage />, "AI Config"),

          route("/profile", <ProfilePage />, "Profile"),
          route("/settings", <SettingsPage />, "Settings"),
        ],
      },
    ],
  },

  route("/unauthorized", <UnauthorizedPage />),
  route("/404", <NotFoundPage />),
  route("*", <Navigate to="/404" replace />),
]);
