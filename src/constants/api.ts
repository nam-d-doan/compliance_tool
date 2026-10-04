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

  // AI endpoints
  AI_COPILOT_MESSAGE: "/api/ai/copilot/message",
  AI_CAP_GENERATE: "/api/ai/cap/generate",
  AI_COMPLIANCE_RISK_SCORE: "/api/ai/compliance/risk-score",
  AI_REGULATION_IMPACT: "/api/ai/regulation/impact",
  AI_EXECUTIVE_SUMMARY: "/api/ai/executive-summary",

  // CMS modules (Nam A Bank RFQ Phụ lục 1)
  CMS_OVERVIEW: "/api/cms/overview",
  CMS_SCHEDULER_RUN: "/api/cms/scheduler/run",
  CMS_LEGAL_UPDATES: "/api/cms/legal-updates",
  CMS_LEGAL_SYNC: "/api/cms/legal-updates/sync",
  CMS_LEGAL_OCR: "/api/cms/legal-updates/ocr",
  CMS_LEGAL_UPDATE: (id: string) => `/api/cms/legal-updates/${id}`,
  CMS_LEGAL_READ: (id: string) => `/api/cms/legal-updates/${id}/read`,
  CMS_LEGAL_APPLICABILITY: (id: string) =>
    `/api/cms/legal-updates/${id}/applicability`,
  CMS_LEGAL_MAPPINGS: (id: string) => `/api/cms/legal-updates/${id}/mappings`,
  CMS_LEGAL_ASSIGN: (id: string) => `/api/cms/legal-updates/${id}/assign`,
  CMS_LEGAL_IMPORT: (id: string) => `/api/cms/legal-updates/${id}/import`,
  CMS_QDNB_LIST: "/api/cms/qdnb",
  CMS_QDNB: (id: string) => `/api/cms/qdnb/${id}`,
  CMS_REVISIONS: "/api/cms/revisions",
  CMS_REVISION: (id: string) => `/api/cms/revisions/${id}`,
  CMS_REVISION_ADVANCE: (id: string) => `/api/cms/revisions/${id}/advance`,
  CMS_REVISION_ISSUE: (id: string) => `/api/cms/revisions/${id}/issue`,
  CMS_ESCALATION_ACK: "/api/cms/escalations/ack",
  CMS_ICIS: "/api/cms/icis",
  CMS_ICIS_SYNC: "/api/cms/icis/sync",
  CMS_ICIS_SUGGESTION: (id: string) => `/api/cms/icis/${id}/suggestion`,
  CMS_ICIS_ACCEPT: (id: string) => `/api/cms/icis/${id}/accept`,
  CMS_ICIS_MERGE: (id: string) => `/api/cms/icis/${id}/merge`,
  CMS_ICIS_REJECT: (id: string) => `/api/cms/icis/${id}/reject`,
  CMS_ISSUE_RATE: (id: string) => `/api/cms/issues/${id}/rate`,
  CMS_ISSUE_WORKFLOW: (id: string) => `/api/cms/issues/${id}/workflow`,
  CMS_RISK_MATRICES: "/api/cms/risk-matrices",
  CMS_ESCALATION_RULES: "/api/cms/escalation-rules",
  CMS_ESCALATION_RULE: (id: string) => `/api/cms/escalation-rules/${id}`,
  CMS_REPORTS: "/api/cms/reports",
  CMS_REPORT_SUBMIT: (id: string) => `/api/cms/reports/schedule/${id}/submit`,
  CMS_AUDIT: "/api/cms/audit",
  CMS_SEARCH: "/api/cms/search",
} as const;
