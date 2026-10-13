import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from "react-router-dom";
import { lazy } from "react";
import { ROUTES } from "@/constants/routes";
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

// CMS modules (Nam A Bank RFQ Phụ lục 1)
const LegalUpdateDetailPage = lazy(
  () => import("@/pages/legal/LegalUpdateDetailPage"),
);
const QdnbDetailPage = lazy(() => import("@/pages/qdnb/QdnbDetailPage"));
const AdminRiskMatrixPage = lazy(
  () => import("@/pages/admin/AdminRiskMatrixPage"),
);
const AdminEscalationRulesPage = lazy(
  () => import("@/pages/admin/AdminEscalationRulesPage"),
);
const PeriodicReportsPage = lazy(
  () => import("@/pages/reports/PeriodicReportsPage"),
);
const InternalControlDashboardPage = lazy(
  () => import("@/pages/reports/InternalControlDashboardPage"),
);
const LateIssuancePage = lazy(() => import("@/pages/reports/LateIssuancePage"));
const EscalationsPage = lazy(() => import("@/pages/ncc/EscalationsPage"));
// CMS modules after the 3-module restructure (09/10/2026)
const LibraryPage = lazy(() => import("@/pages/library/LibraryPage"));
const TaskListPage = lazy(() => import("@/pages/tasks/TaskListPage"));
const TaskDetailPage = lazy(() => import("@/pages/tasks/TaskDetailPage"));
const AdminTaskWorkflowPage = lazy(
  () => import("@/pages/admin/AdminTaskWorkflowPage"),
);

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
      { index: true, element: <Navigate to={ROUTES.DASHBOARD.ROOT} replace /> },
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
          route("/dashboard/admin", <AdminDashboardPage />, "Admin"),

          // Module 1 — Document Library (laws + internal regulations)
          route("/library", <LibraryPage />, "Document Library"),
          route("/legal-updates/:id", <LegalUpdateDetailPage />, "Detail"),
          route("/qdnb/:id", <QdnbDetailPage />, "Detail"),
          route("/obligations", <ObligationListPage />, "Obligations"),
          route("/obligations/create", <ObligationCreatePage />, "Create"),
          route("/obligations/:id", <ObligationDetailPage />, "Detail"),
          route("/regulation/compare", <RegulationComparisonPage />, "Compare"),
          route("/regulation/create", <RegulationCreatePage />, "Create"),
          route("/regulation/:id/edit", <RegulationEditPage />, "Edit"),
          route("/regulation/:id/impact", <RegulationImpactPage />, "Impact"),
          route("/regulation/:id", <RegulationDetailPage />, "Detail"),
          // Old list addresses now open the library.
          {
            path: "/legal-updates",
            element: <Navigate to="/library?type=law" replace />,
          },
          {
            path: "/qdnb",
            element: <Navigate to="/library?type=qdnb" replace />,
          },
          { path: "/regulation", element: <Navigate to="/library" replace /> },
          {
            path: "/legal-mapping",
            element: <Navigate to="/library" replace />,
          },
          // Module 2 — Task Management
          route("/tasks", <TaskListPage />, "Task Management"),
          route("/tasks/:id", <TaskDetailPage />, "Task"),
          route(
            "/reports/late-issuance",
            <LateIssuancePage />,
            "Late Issuance Alerts",
          ),
          { path: "/assignment", element: <Navigate to="/tasks" replace /> },
          route(
            "/assignment/create",
            <AssignmentCreatePage />,
            "Create Assignment",
          ),
          route("/assignment/:id", <AssignmentDetailPage />, "Detail"),
          // Module 3 — Compliance Issues
          route("/ncc/list", <NCCListPage />, "Compliance Issues"),
          route("/ncc/escalations", <EscalationsPage />, "Escalations"),
          route("/ncc/create", <NCCCreatePage />, "Create Issue"),
          route("/ncc/:id", <NCCDetailPage />, "Issue Detail"),
          route("/cap", <CAPDashboardPage />, "Corrective Actions"),
          route("/cap/list", <CAPListPage />, "All CAPs"),
          route("/cap/create", <CAPCreatePage />, "Create CAP"),
          route("/cap/:id", <CAPDetailPage />, "Detail"),
          // Reports
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
          route(
            "/reports/periodic",
            <PeriodicReportsPage />,
            "Periodic Reports",
          ),
          route(
            "/reports/internal-control",
            <InternalControlDashboardPage />,
            "Internal Control Issues",
          ),
          route("/reports/audit-trail", <AdminAuditLogsPage />, "Audit Trail"),
          route("/admin/users", <AdminUsersPage />, "Users"),
          route("/admin/roles", <AdminRolesPage />, "Roles"),
          route(
            "/admin/organization",
            <AdminOrganizationPage />,
            "Organization",
          ),
          route("/admin/audit-logs", <AdminAuditLogsPage />, "Audit Logs"),
          route("/admin/ai-config", <AdminAIConfigPage />, "AI Config"),
          route("/admin/risk-matrix", <AdminRiskMatrixPage />, "Risk Matrix"),
          route(
            "/admin/escalation-rules",
            <AdminEscalationRulesPage />,
            "Escalation Rules",
          ),
          route(
            "/admin/task-workflow",
            <AdminTaskWorkflowPage />,
            "Task Workflow",
          ),

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
