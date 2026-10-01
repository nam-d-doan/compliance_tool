// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH_LOGIN: "/api/auth/login",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_PROFILE: "/api/auth/profile",
  AUTH_REFRESH: "/api/auth/refresh",
  AUTH_MFA: "/api/auth/mfa",
  AUTH_FORGOT_PASSWORD: "/api/auth/forgot-password",

  // CAP (Corrective Action Plan) endpoints
  CAP_LIST: "/api/cap",
  CAP_CREATE: "/api/cap",
  CAP_GET: (id: string) => `/api/cap/${id}`,
  CAP_UPDATE: (id: string) => `/api/cap/${id}`,
  CAP_DELETE: (id: string) => `/api/cap/${id}`,
  CAP_DASHBOARD: "/api/cap/dashboard",
  CAP_TIMELINE: (id: string) => `/api/cap/${id}/timeline`,
  CAP_COMMENTS: (id: string) => `/api/cap/${id}/comments`,

  // NCC (Non-Compliance Case) endpoints
  NCC_LIST: "/api/ncc",
  NCC_CREATE: "/api/ncc",
  NCC_GET: (id: string) => `/api/ncc/${id}`,
  NCC_UPDATE: (id: string) => `/api/ncc/${id}`,
  NCC_DELETE: (id: string) => `/api/ncc/${id}`,

  // Regulation endpoints
  REGULATION_LIST: "/api/regulations",
  REGULATION_CREATE: "/api/regulations",
  REGULATIONS_CREATE: "/api/regulations",
  VIETLEX_SEARCH: "/api/vietlex/search",
  REGULATION_GET: (id: string) => `/api/regulations/${id}`,
  REGULATION_UPDATE: (id: string) => `/api/regulations/${id}`,
  REGULATION_DELETE: (id: string) => `/api/regulations/${id}`,
  REGULATION_COMPARE: "/api/regulations/compare",
  REGULATION_IMPACT: "/api/regulations/impact",
  REGULATION_TIMELINE: (id: string) => `/api/regulations/${id}/timeline`,
  REGULATION_COMMENTS: (id: string) => `/api/regulations/${id}/comments`,
  REGULATION_ARCHIVE: (id: string) => `/api/regulations/${id}/archive`,
  REGULATIONS_BULK_ARCHIVE: "/api/regulations/bulk-archive",
  REGULATIONS_DEPENDENCIES: (id: string) =>
    `/api/regulations/${id}/dependencies`,
  REGULATION_DEPENDENCIES: "/api/regulation-dependencies",
  VIETLEX_DETAIL: (docNumber: string) => `/api/vietlex/${docNumber}`,

  // Report endpoints
  REPORT_STATUS: "/api/reports/status",
  REPORT_CALENDAR: "/api/reports/calendar",
  REPORT_CAP: "/api/reports/cap",
  REPORT_EXECUTIVE: "/api/reports/executive",
  REPORT_CREATE: "/api/reports",
  REPORT_GET: (id: string) => `/api/reports/${id}`,
  REPORT_UPDATE: (id: string) => `/api/reports/${id}`,
  REPORT_DELETE: (id: string) => `/api/reports/${id}`,
  REPORT_BY_TYPE: (type: string) => `/api/reports/${type}`,
  EWS_REPORT: "/api/reports/ews",

  // Dashboard endpoints
  DASHBOARD: (role: string) => `/api/dashboard/${role}`,

  // Notification endpoints
  NOTIFICATIONS: "/api/notifications",
  NOTIFICATION_READ: (id: string) => `/api/notifications/${id}/read`,
  NOTIFICATIONS_READ_ALL: "/api/notifications/read-all",

  // Activity endpoints
  ACTIVITY_FEED: "/api/activity",

  // Admin endpoints
  ADMIN_USERS: "/api/admin/users",
  ADMIN_USER: (id: string) => `/api/admin/users/${id}`,
  ADMIN_ROLES: "/api/admin/roles",
  ADMIN_ROLE: (id: string) => `/api/admin/roles/${id}`,
  ADMIN_ORG: "/api/admin/organization",
  ADMIN_AUDIT_LOGS: "/api/admin/audit-logs",
  ADMIN_AI_CONFIG: "/api/admin/ai-config",

  // Assignment endpoints
  ASSIGNMENT_LIST: "/api/assignments",
  ASSIGNMENT_CREATE: "/api/assignments",
  ASSIGNMENT_BULK: "/api/assignments/bulk",
  ASSIGNMENT_GET: (id: string) => `/api/assignments/${id}`,
  ASSIGNMENT_UPDATE: (id: string) => `/api/assignments/${id}`,
  ASSIGNMENT_ACKNOWLEDGE: (id: string) => `/api/assignments/${id}/acknowledge`,
  ASSIGNMENT_CANCEL: (id: string) => `/api/assignments/${id}/cancel`,
  ASSIGNMENT_TIMELINE: (id: string) => `/api/assignments/${id}/timeline`,

  // Obligation endpoints
  OBLIGATION_LIST: "/api/obligations/list",
  OBLIGATION_BULK: "/api/obligations/bulk",
  OBLIGATION_BULK_UPDATE: "/api/obligations/bulk",
  OBLIGATION_GET: (id: string) => `/api/obligations/${id}`,
  OBLIGATION_UPDATE: (id: string) => `/api/obligations/${id}`,
  OBLIGATION_DELETE: (id: string) => `/api/obligations/${id}`,
  OBLIGATION_TIMELINE: (id: string) => `/api/obligations/${id}/timeline`,
  OBLIGATION_COMMENTS: (id: string) => `/api/obligations/${id}/comments`,

  // File attachment endpoints (Phase 5)
  FILE_LIST: "/api/files",
  FILE_UPLOAD: "/api/files",
  FILE_GET: (id: string) => `/api/files/${id}`,
  FILE_DELETE: (id: string) => `/api/files/${id}`,
  FILE_UPDATE: (id: string) => `/api/files/${id}`,

  // LM (Litigation Management) endpoints
  LM_CASE_LIST: "/api/lm/cases",
  LM_CASE_CREATE: "/api/lm/cases",
  LM_CASE_GET: (id: string) => `/api/lm/cases/${id}`,
  LM_CASE_UPDATE: (id: string) => `/api/lm/cases/${id}`,
  LM_CASE_DELETE: (id: string) => `/api/lm/cases/${id}`,
  LM_CASE_MILESTONES: (id: string) => `/api/lm/cases/${id}/milestones`,
  LM_MILESTONE_UPDATE: (id: string) => `/api/lm/milestones/${id}`,
  LM_CASE_DEADLINES: (id: string) => `/api/lm/cases/${id}/deadlines`,
  LM_DEADLINE_CREATE: (caseId: string) =>
    `/api/lm/cases/${caseId}/deadlines`,
  LM_DEADLINE_UPDATE: (id: string) => `/api/lm/deadlines/${id}`,
  LM_CASE_EVENTS: (id: string) => `/api/lm/cases/${id}/events`,
  LM_CASE_TASKS: (id: string) => `/api/lm/cases/${id}/tasks`,
  LM_TASK_CREATE: "/api/lm/tasks",
  LM_TASK_UPDATE: (id: string) => `/api/lm/tasks/${id}`,
  LM_ALERT_RULES: "/api/lm/alert-rules",
  LM_WORKLOAD: "/api/lm/workload",
  LM_CASE_REMIND: (id: string) => `/api/lm/cases/${id}/remind`,
  LM_DASHBOARD: "/api/lm/dashboard",

  // LAW (Legal Advisory Workflow) endpoints
  LAW_REQUEST_LIST: "/api/law/requests",
  LAW_REQUEST_CREATE: "/api/law/requests",
  LAW_REQUEST_GET: (id: string) => `/api/law/requests/${id}`,
  LAW_REQUEST_UPDATE: (id: string) => `/api/law/requests/${id}`,
  LAW_REQUEST_DELETE: (id: string) => `/api/law/requests/${id}`,
  LAW_REQUEST_EVENTS: (id: string) => `/api/law/requests/${id}/events`,

  // AI endpoints
  AI_COPILOT_MESSAGE: "/api/ai/copilot/message",
  AI_CAP_GENERATE: "/api/ai/cap/generate",
  AI_COMPLIANCE_RISK_SCORE: "/api/ai/compliance/risk-score",
  AI_REGULATION_IMPACT: "/api/ai/regulation/impact",
  AI_EXECUTIVE_SUMMARY: "/api/ai/executive-summary",
} as const;
