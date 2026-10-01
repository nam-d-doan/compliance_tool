import {
  handleLogin,
  handleMfa,
  handleForgotPassword,
  handleLogout,
} from "./handlers/auth_handlers";
import { handleDashboard } from "./handlers/dashboard_handlers";
import {
  handleGetCapList,
  handleGetCapDetail,
  handleCreateCap,
  handleUpdateCap,
  handleDeleteCap,
  handleGetCapTimeline,
  handleGetCapComments,
  handleCreateCapComment,
} from "./handlers/cap_handlers";
import {
  handleGetNCCList,
  handleGetNCCDetail,
  handleCreateNCC,
  handleUpdateNCC,
  handleDeleteNCC,
} from "./handlers/ncc_handlers";
import {
  handleGetRegulationList,
  handleGetRegulationDetail,
  handleCreateRegulation,
  handleUpdateRegulation,
  handleDeleteRegulation,
  handleGetRegulationTimeline,
  handleGetRegulationComments,
  handleCreateRegulationComment,
  handleCompareRegulations,
  handleRegulationImpact,
  handleSearchVietLex,
  handleArchiveRegulationToggle,
  handleBulkArchiveRegulations,
  handleGetRegulationDependencies,
  handleCreateRegulationDependency,
  handleUpdateRegulationDependency,
  handleDeleteRegulationDependency,
} from "./handlers/regulation_handlers";
import { handleGetReport } from "./handlers/report_handlers";
import { handleGetEWSReport } from "./handlers/ews_handlers";
import {
  handleGetNotifications,
  handleMarkNotificationRead,
  handleMarkAllNotificationsRead,
} from "./handlers/notification_handlers";
import { handleGetActivity } from "./handlers/activity_handlers";
import {
  handleGetUsers,
  handleCreateUser,
  handleUpdateUser,
  handleDeleteUser,
  handleGetRoles,
  handleCreateRole,
  handleUpdateRole,
  handleDeleteRole,
  handleGetOrganization,
  handleUpdateOrganization,
  handleGetAuditLogs,
  handleGetAiConfig,
  handleUpdateAiConfig,
} from "./handlers/admin_handlers";
import {
  handleAiCopilotMessage,
  handleAiCapGenerate,
  handleAiComplianceRiskScore,
  handleAiRegulationImpact,
  handleAiExecutiveSummary,
} from "./handlers/ai_handlers";
import { handleGetComments } from "./handlers/comment_handlers";
import {
  handleGetAssignmentList,
  handleGetAssignmentDetail,
  handleCreateAssignment,
  handleUpdateAssignment,
  handleAcknowledgeAssignment,
  handleCancelAssignment,
  handleGetAssignmentTimeline,
  handleBulkUpdateAssignments,
} from "./handlers/assignment_handlers";
import {
  handleBulkCreateObligations,
  handleGetObligationList,
  handleGetObligationDetail,
  handleUpdateObligation,
  handleDeleteObligation,
  handleBulkUpdateObligations,
  handleGetObligationTimeline,
  handleGetObligationComments,
  handleCreateObligationComment,
} from "./handlers/obligation_handlers";
import {
  handleGetFileList,
  handleUploadFile,
  handleDeleteFile,
  handleUpdateFile,
} from "./handlers/file_handlers";
import {
  handleGetLMCaseList,
  handleCreateLMCase,
  handleGetLMCaseDetail,
  handleUpdateLMCase,
  handleDeleteLMCase,
  handleGetLMCaseMilestones,
  handleGetLMCaseDeadlines,
  handleGetLMCaseEvents,
  handleGetLMCaseTasks,
  handleCreateLMTask,
  handleUpdateLMTask,
  handleDeleteLMTask,
  handleGetLMAlertRules,
  handleUpdateLMMilestone,
  handleUpdateLMDeadline,
  handleGetLMWorkload,
  handleRemindLMCase,
  handleGetLMDashboard,
} from "./handlers/lm_handlers";
import {
  handleGetLawRequestList,
  handleCreateLawRequest,
  handleGetLawRequestDetail,
  handleUpdateLawRequest,
  handleDeleteLawRequest,
  handleGetLawRequestEvents,
} from "./handlers/law_handlers";
import type { MockResolverContext } from "./handlers/utils";

type Route = {
  methods: string[];
  pattern: string;
  handler: (ctx: MockResolverContext) => Response | Promise<Response>;
};

const routes: Route[] = [
  // Auth
  { methods: ["POST"], pattern: "/api/auth/login", handler: handleLogin },
  { methods: ["POST"], pattern: "/api/auth/logout", handler: handleLogout },
  { methods: ["POST"], pattern: "/api/auth/mfa", handler: handleMfa },
  {
    methods: ["POST"],
    pattern: "/api/auth/forgot-password",
    handler: handleForgotPassword,
  },

  // Dashboard
  {
    methods: ["GET"],
    pattern: "/api/dashboard/:role",
    handler: handleDashboard,
  },

  // CAP
  { methods: ["GET"], pattern: "/api/cap", handler: handleGetCapList },
  { methods: ["POST"], pattern: "/api/cap", handler: handleCreateCap },
  {
    methods: ["GET"],
    pattern: "/api/cap/:id/timeline",
    handler: handleGetCapTimeline,
  },
  {
    methods: ["GET"],
    pattern: "/api/cap/:id/comments",
    handler: handleGetCapComments,
  },
  {
    methods: ["POST"],
    pattern: "/api/cap/:id/comments",
    handler: handleCreateCapComment,
  },
  { methods: ["GET"], pattern: "/api/cap/:id", handler: handleGetCapDetail },
  { methods: ["PUT"], pattern: "/api/cap/:id", handler: handleUpdateCap },
  { methods: ["DELETE"], pattern: "/api/cap/:id", handler: handleDeleteCap },

  // NCC
  { methods: ["GET"], pattern: "/api/ncc", handler: handleGetNCCList },
  { methods: ["POST"], pattern: "/api/ncc", handler: handleCreateNCC },
  { methods: ["GET"], pattern: "/api/ncc/:id", handler: handleGetNCCDetail },
  { methods: ["PUT"], pattern: "/api/ncc/:id", handler: handleUpdateNCC },
  { methods: ["DELETE"], pattern: "/api/ncc/:id", handler: handleDeleteNCC },

  // LM (Litigation Management)
  { methods: ["GET"], pattern: "/api/lm/cases", handler: handleGetLMCaseList },
  { methods: ["POST"], pattern: "/api/lm/cases", handler: handleCreateLMCase },
  {
    methods: ["GET"],
    pattern: "/api/lm/cases/:id/milestones",
    handler: handleGetLMCaseMilestones,
  },
  {
    methods: ["GET"],
    pattern: "/api/lm/cases/:id/deadlines",
    handler: handleGetLMCaseDeadlines,
  },
  {
    methods: ["PUT"],
    pattern: "/api/lm/deadlines/:id",
    handler: handleUpdateLMDeadline,
  },
  {
    methods: ["GET"],
    pattern: "/api/lm/cases/:id/events",
    handler: handleGetLMCaseEvents,
  },
  {
    methods: ["GET"],
    pattern: "/api/lm/cases/:id/tasks",
    handler: handleGetLMCaseTasks,
  },
  { methods: ["POST"], pattern: "/api/lm/tasks", handler: handleCreateLMTask },
  {
    methods: ["PUT"],
    pattern: "/api/lm/tasks/:id",
    handler: handleUpdateLMTask,
  },
  {
    methods: ["DELETE"],
    pattern: "/api/lm/tasks/:id",
    handler: handleDeleteLMTask,
  },
  {
    methods: ["GET"],
    pattern: "/api/lm/cases/:id",
    handler: handleGetLMCaseDetail,
  },
  {
    methods: ["PUT"],
    pattern: "/api/lm/cases/:id",
    handler: handleUpdateLMCase,
  },
  {
    methods: ["DELETE"],
    pattern: "/api/lm/cases/:id",
    handler: handleDeleteLMCase,
  },
  {
    methods: ["GET"],
    pattern: "/api/lm/alert-rules",
    handler: handleGetLMAlertRules,
  },
  {
    methods: ["PUT"],
    pattern: "/api/lm/milestones/:id",
    handler: handleUpdateLMMilestone,
  },
  { methods: ["GET"], pattern: "/api/lm/workload", handler: handleGetLMWorkload },
  {
    methods: ["GET"],
    pattern: "/api/lm/dashboard",
    handler: handleGetLMDashboard,
  },
  {
    methods: ["POST"],
    pattern: "/api/lm/cases/:id/remind",
    handler: handleRemindLMCase,
  },

  // LAW (Legal Advisory Workflow)
  {
    methods: ["GET"],
    pattern: "/api/law/requests",
    handler: handleGetLawRequestList,
  },
  {
    methods: ["POST"],
    pattern: "/api/law/requests",
    handler: handleCreateLawRequest,
  },
  {
    methods: ["GET"],
    pattern: "/api/law/requests/:id/events",
    handler: handleGetLawRequestEvents,
  },
  {
    methods: ["GET"],
    pattern: "/api/law/requests/:id",
    handler: handleGetLawRequestDetail,
  },
  {
    methods: ["PUT"],
    pattern: "/api/law/requests/:id",
    handler: handleUpdateLawRequest,
  },
  {
    methods: ["DELETE"],
    pattern: "/api/law/requests/:id",
    handler: handleDeleteLawRequest,
  },

  // Regulation
  {
    methods: ["GET"],
    pattern: "/api/regulations",
    handler: handleGetRegulationList,
  },
  {
    methods: ["POST"],
    pattern: "/api/regulations",
    handler: handleCreateRegulation,
  },
  {
    methods: ["POST"],
    pattern: "/api/regulations/compare",
    handler: handleCompareRegulations,
  },
  {
    methods: ["POST"],
    pattern: "/api/regulations/impact",
    handler: handleRegulationImpact,
  },
  {
    methods: ["GET"],
    pattern: "/api/vietlex/search",
    handler: handleSearchVietLex,
  },
  {
    methods: ["GET"],
    pattern: "/api/regulations/:id/timeline",
    handler: handleGetRegulationTimeline,
  },
  {
    methods: ["GET"],
    pattern: "/api/regulations/:id/comments",
    handler: handleGetRegulationComments,
  },
  {
    methods: ["POST"],
    pattern: "/api/regulations/:id/comments",
    handler: handleCreateRegulationComment,
  },
  {
    methods: ["GET"],
    pattern: "/api/regulations/:id",
    handler: handleGetRegulationDetail,
  },
  {
    methods: ["PUT"],
    pattern: "/api/regulations/:id",
    handler: handleUpdateRegulation,
  },
  {
    methods: ["PATCH"],
    pattern: "/api/regulations/:id/archive",
    handler: handleArchiveRegulationToggle,
  },
  {
    methods: ["PATCH"],
    pattern: "/api/regulations/bulk-archive",
    handler: handleBulkArchiveRegulations,
  },
  {
    methods: ["DELETE"],
    pattern: "/api/regulations/:id",
    handler: handleDeleteRegulation,
  },
  {
    methods: ["GET"],
    pattern: "/api/regulations/:id/dependencies",
    handler: handleGetRegulationDependencies,
  },
  {
    methods: ["POST"],
    pattern: "/api/regulation-dependencies",
    handler: handleCreateRegulationDependency,
  },
  {
    methods: ["PATCH"],
    pattern: "/api/regulation-dependencies/:id",
    handler: handleUpdateRegulationDependency,
  },
  {
    methods: ["DELETE"],
    pattern: "/api/regulation-dependencies/:id",
    handler: handleDeleteRegulationDependency,
  },

  // Assignments
  {
    methods: ["GET"],
    pattern: "/api/assignments",
    handler: handleGetAssignmentList,
  },
  {
    methods: ["POST"],
    pattern: "/api/assignments",
    handler: handleCreateAssignment,
  },
  {
    methods: ["POST"],
    pattern: "/api/assignments/bulk",
    handler: handleBulkUpdateAssignments,
  },
  {
    methods: ["GET"],
    pattern: "/api/assignments/:id/timeline",
    handler: handleGetAssignmentTimeline,
  },
  {
    methods: ["POST"],
    pattern: "/api/assignments/:id/acknowledge",
    handler: handleAcknowledgeAssignment,
  },
  {
    methods: ["POST"],
    pattern: "/api/assignments/:id/cancel",
    handler: handleCancelAssignment,
  },
  {
    methods: ["GET"],
    pattern: "/api/assignments/:id",
    handler: handleGetAssignmentDetail,
  },
  {
    methods: ["PUT"],
    pattern: "/api/assignments/:id",
    handler: handleUpdateAssignment,
  },

  // Obligations — literal paths (list, bulk) must precede :id.
  {
    methods: ["GET"],
    pattern: "/api/obligations/list",
    handler: handleGetObligationList,
  },
  {
    methods: ["POST"],
    pattern: "/api/obligations/bulk",
    handler: handleBulkCreateObligations,
  },
  {
    methods: ["PATCH"],
    pattern: "/api/obligations/bulk",
    handler: handleBulkUpdateObligations,
  },
  {
    methods: ["GET"],
    pattern: "/api/obligations/:id/timeline",
    handler: handleGetObligationTimeline,
  },
  {
    methods: ["GET"],
    pattern: "/api/obligations/:id/comments",
    handler: handleGetObligationComments,
  },
  {
    methods: ["POST"],
    pattern: "/api/obligations/:id/comments",
    handler: handleCreateObligationComment,
  },
  {
    methods: ["GET"],
    pattern: "/api/obligations/:id",
    handler: handleGetObligationDetail,
  },
  {
    methods: ["PUT", "PATCH"],
    pattern: "/api/obligations/:id",
    handler: handleUpdateObligation,
  },
  {
    methods: ["DELETE"],
    pattern: "/api/obligations/:id",
    handler: handleDeleteObligation,
  },

  // File attachments (Phase 5)
  { methods: ["GET"], pattern: "/api/files", handler: handleGetFileList },
  { methods: ["POST"], pattern: "/api/files", handler: handleUploadFile },
  {
    methods: ["PUT"],
    pattern: "/api/files/:id",
    handler: handleUpdateFile,
  },
  {
    methods: ["DELETE"],
    pattern: "/api/files/:id",
    handler: handleDeleteFile,
  },

  // Reports — literal ews path must precede :type.
  {
    methods: ["GET"],
    pattern: "/api/reports/ews",
    handler: handleGetEWSReport,
  },
  { methods: ["GET"], pattern: "/api/reports/:type", handler: handleGetReport },

  // Notifications
  {
    methods: ["GET"],
    pattern: "/api/notifications",
    handler: handleGetNotifications,
  },
  {
    methods: ["PUT", "POST"],
    pattern: "/api/notifications/:id/read",
    handler: handleMarkNotificationRead,
  },
  {
    methods: ["PUT", "POST"],
    pattern: "/api/notifications/read-all",
    handler: handleMarkAllNotificationsRead,
  },

  // Activity
  { methods: ["GET"], pattern: "/api/activity", handler: handleGetActivity },

  // Admin
  { methods: ["GET"], pattern: "/api/admin/users", handler: handleGetUsers },
  { methods: ["POST"], pattern: "/api/admin/users", handler: handleCreateUser },
  { methods: ["GET"], pattern: "/api/admin/roles", handler: handleGetRoles },
  { methods: ["POST"], pattern: "/api/admin/roles", handler: handleCreateRole },
  {
    methods: ["GET"],
    pattern: "/api/admin/organization",
    handler: handleGetOrganization,
  },
  {
    methods: ["GET"],
    pattern: "/api/admin/audit-logs",
    handler: handleGetAuditLogs,
  },
  {
    methods: ["GET"],
    pattern: "/api/admin/ai-config",
    handler: handleGetAiConfig,
  },
  {
    methods: ["PUT"],
    pattern: "/api/admin/users/:id",
    handler: handleUpdateUser,
  },
  {
    methods: ["DELETE"],
    pattern: "/api/admin/users/:id",
    handler: handleDeleteUser,
  },
  {
    methods: ["PUT"],
    pattern: "/api/admin/roles/:id",
    handler: handleUpdateRole,
  },
  {
    methods: ["DELETE"],
    pattern: "/api/admin/roles/:id",
    handler: handleDeleteRole,
  },
  {
    methods: ["PUT"],
    pattern: "/api/admin/organization",
    handler: handleUpdateOrganization,
  },
  {
    methods: ["PUT"],
    pattern: "/api/admin/ai-config",
    handler: handleUpdateAiConfig,
  },

  // AI
  {
    methods: ["POST"],
    pattern: "/api/ai/copilot/message",
    handler: handleAiCopilotMessage,
  },
  {
    methods: ["POST"],
    pattern: "/api/ai/copilot",
    handler: handleAiCopilotMessage,
  },
  {
    methods: ["POST"],
    pattern: "/api/ai/cap/generate",
    handler: handleAiCapGenerate,
  },
  {
    methods: ["POST"],
    pattern: "/api/ai/compliance/risk-score",
    handler: handleAiComplianceRiskScore,
  },
  {
    methods: ["POST"],
    pattern: "/api/ai/regulation/impact",
    handler: handleAiRegulationImpact,
  },
  {
    methods: ["POST"],
    pattern: "/api/ai/executive-summary",
    handler: handleAiExecutiveSummary,
  },

  // Generic comments
  {
    methods: ["GET"],
    pattern: "/api/comments/:entityType/:entityId",
    handler: handleGetComments,
  },
];

function errorResponse(message: string, status = 500): Response {
  return Response.json({ success: false, message }, { status });
}

function delay(min: number, max: number): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function matchRoute(
  path: string,
  pattern: string,
): Record<string, string> | null {
  const keys: string[] = [];
  const regexPattern =
    "^" +
    pattern.replace(/:([^/]+)/g, (_, key) => {
      keys.push(key);
      return "([^/]+)";
    }) +
    "$";
  const match = path.match(new RegExp(regexPattern));
  if (!match) return null;

  const params: Record<string, string> = {};
  keys.forEach((key, index) => {
    params[key] = decodeURIComponent(match[index + 1]);
  });
  return params;
}

function resolveUrl(input: RequestInfo | URL): URL {
  if (input instanceof URL) return input;
  if (input instanceof Request) return new URL(input.url);
  return new URL(input, window.location.href);
}

function buildRequest(input: RequestInfo | URL, init?: RequestInit): Request {
  if (input instanceof Request && !init) return input.clone();
  return new Request(input, init);
}

export async function enableDirectMocking(): Promise<void> {
  const originalFetch = window.fetch;

  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    try {
      const url = resolveUrl(input);

      if (
        url.origin !== window.location.origin ||
        !url.pathname.startsWith("/api/")
      ) {
        return originalFetch(input as RequestInfo, init);
      }

      const request = buildRequest(input, init);
      const method = request.method.toUpperCase();
      const pathname = url.pathname;

      for (const route of routes) {
        if (!route.methods.includes(method)) continue;
        const params = matchRoute(pathname, route.pattern);
        if (!params) continue;

        await delay(100, 300);
        const response = await route.handler({ request, params });
        return response;
      }

      return originalFetch(input as RequestInfo, init);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Mock API error";
      console.error("[DirectMock] Error handling request:", error);
      return errorResponse(message, 500);
    }
  };
}
