import { authHandlers } from "./auth_handlers";
import { complianceHandlers } from "./compliance_handlers";
import { evidenceHandlers } from "./evidence_handlers";
import { capHandlers } from "./cap_handlers";
import { licenseHandlers } from "./license_handlers";
import { regulationHandlers } from "./regulation_handlers";
import { reportHandlers } from "./report_handlers";
import { adminHandlers } from "./admin_handlers";
import { dashboardHandlers } from "./dashboard_handlers";
import { notificationHandlers } from "./notification_handlers";
import { activityHandlers } from "./activity_handlers";
import { aiHandlers } from "./ai_handlers";
import { commentHandlers } from "./comment_handlers";

export const handlers = [
  ...authHandlers,
  ...complianceHandlers,
  ...evidenceHandlers,
  ...capHandlers,
  ...licenseHandlers,
  ...regulationHandlers,
  ...reportHandlers,
  ...adminHandlers,
  ...dashboardHandlers,
  ...notificationHandlers,
  ...activityHandlers,
  ...aiHandlers,
  ...commentHandlers,
];
