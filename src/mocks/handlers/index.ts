import { authHandlers } from "./auth_handlers";
import { capHandlers } from "./cap_handlers";
import { nccHandlers } from "./ncc_handlers";
import { regulationHandlers } from "./regulation_handlers";
import { reportHandlers } from "./report_handlers";
import { ewsHandlers } from "./ews_handlers";
import { adminHandlers } from "./admin_handlers";
import { dashboardHandlers } from "./dashboard_handlers";
import { notificationHandlers } from "./notification_handlers";
import { activityHandlers } from "./activity_handlers";
import { aiHandlers } from "./ai_handlers";
import { commentHandlers } from "./comment_handlers";
import { assignmentHandlers } from "./assignment_handlers";
import { obligationHandlers } from "./obligation_handlers";
import { fileHandlers } from "./file_handlers";
import { lmHandlers } from "./lm_handlers";

export const handlers = [
  ...authHandlers,
  ...capHandlers,
  ...nccHandlers,
  ...regulationHandlers,
  ...ewsHandlers,
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
  ...lmHandlers,
];
