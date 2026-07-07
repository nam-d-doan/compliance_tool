import { authHandlers } from "./auth_handlers";
import { complianceHandlers } from "./compliance_handlers";
import { capHandlers } from "./cap_handlers";
import { regulationHandlers } from "./regulation_handlers";
import { reportHandlers } from "./report_handlers";
import { adminHandlers } from "./admin_handlers";
import { dashboardHandlers } from "./dashboard_handlers";
import { notificationHandlers } from "./notification_handlers";
import { activityHandlers } from "./activity_handlers";
import { aiHandlers } from "./ai_handlers";
import { commentHandlers } from "./comment_handlers";
import { assignmentHandlers } from "./assignment_handlers";
import { obligationHandlers } from "./obligation_handlers";
import { fileHandlers } from "./file_handlers";

export const handlers = [
  ...authHandlers,
  ...complianceHandlers,
  ...capHandlers,
  ...regulationHandlers,
  ...reportHandlers,
  ...adminHandlers,
  ...dashboardHandlers,
  ...notificationHandlers,
  ...activityHandlers,
  ...aiHandlers,
  ...commentHandlers,
  ...assignmentHandlers,
  ...obligationHandlers,
  ...fileHandlers,
];
