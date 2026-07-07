import {
  handleLogin,
  handleMfa,
  handleForgotPassword,
  handleLogout,
} from "./handlers/auth_handlers";
import { handleDashboard } from "./handlers/dashboard_handlers";
import {
  handleGetComplianceList,
  handleGetComplianceDetail,
  handleGetComplianceHistory,
  handleCreateCompliance,
  handleUpdateCompliance,
  handleDeleteCompliance,
  handleGetComplianceTimeline,
  handleGetComplianceComments,
  handleCreateComplianceComment,
} from "./handlers/compliance_handlers";
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
} from "./handlers/regulation_handlers";
import { handleGetReport } from "./handlers/report_handlers";
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
  handleGetTemplates,
  handleCreateTemplate,
  handleUpdateTemplate,
  handleDeleteTemplate,
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

  // Compliance
  {
    methods: ["GET"],
    pattern: "/api/compliance",
    handler: handleGetComplianceList,
  },
  {
    methods: ["GET"],
    pattern: "/api/compliance/history",
    handler: handleGetComplianceHistory,
  },
  {
    methods: ["POST"],
    pattern: "/api/compliance",
    handler: handleCreateCompliance,
  },
  {
    methods: ["GET"],
    pattern: "/api/compliance/:id/timeline",
    handler: handleGetComplianceTimeline,
  },
  {
    methods: ["GET"],
    pattern: "/api/compliance/:id/comments",
    handler: handleGetComplianceComments,
  },
  {
    methods: ["POST"],
    pattern: "/api/compliance/:id/comments",
    handler: handleCreateComplianceComment,
  },
  {
    methods: ["GET"],
    pattern: "/api/compliance/:id",
    handler: handleGetComplianceDetail,
  },
  {
    methods: ["PUT"],
    pattern: "/api/compliance/:id",
    handler: handleUpdateCompliance,
  },
  {
    methods: ["DELETE"],
    pattern: "/api/compliance/:id",
    handler: handleDeleteCompliance,
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

  // Regulation
  {
    methods: ["GET"],
    pattern: "/api/regulation",
    handler: handleGetRegulationList,
  },
  {
    methods: ["POST"],
    pattern: "/api/regulation",
    handler: handleCreateRegulation,
  },
  {
    methods: ["POST"],
    pattern: "/api/regulation/compare",
    handler: handleCompareRegulations,
  },
  {
    methods: ["POST"],
    pattern: "/api/regulation/impact",
    handler: handleRegulationImpact,
  },
  {
    methods: ["GET"],
    pattern: "/api/regulation/:id/timeline",
    handler: handleGetRegulationTimeline,
  },
  {
    methods: ["GET"],
    pattern: "/api/regulation/:id/comments",
    handler: handleGetRegulationComments,
  },
  {
    methods: ["POST"],
    pattern: "/api/regulation/:id/comments",
    handler: handleCreateRegulationComment,
  },
  {
    methods: ["GET"],
    pattern: "/api/regulation/:id",
    handler: handleGetRegulationDetail,
  },
  {
    methods: ["PUT"],
    pattern: "/api/regulation/:id",
    handler: handleUpdateRegulation,
  },
  {
    methods: ["DELETE"],
    pattern: "/api/regulation/:id",
    handler: handleDeleteRegulation,
  },

  // Reports
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
    pattern: "/api/admin/templates",
    handler: handleGetTemplates,
  },
  {
    methods: ["POST"],
    pattern: "/api/admin/templates",
    handler: handleCreateTemplate,
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
    pattern: "/api/admin/templates/:id",
    handler: handleUpdateTemplate,
  },
  {
    methods: ["DELETE"],
    pattern: "/api/admin/templates/:id",
    handler: handleDeleteTemplate,
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
