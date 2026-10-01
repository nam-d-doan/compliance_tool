// Type exports
export * from "./base";
export type { Article } from "./article";
export type { LoginCredentials, AuthUser, AuthState } from "./user";
export type {
  Obligation,
  ObligationStatus,
  ObligationRiskLevel,
  ObligationFilter,
  BulkObligationInputItem,
  BulkCreateObligationsInput,
  BulkCreateObligationsResult,
  UpdateObligationInput,
  BulkUpdateObligationsInput,
  BulkUpdateObligationsResult,
  ObligationTimelineEvent,
  ObligationComment,
} from "./obligation";
export type {
  CAP,
  CAPAction,
  CAPFilter,
  CAPAISuggestion,
  CAPTimelineEvent,
  CAPComment,
} from "./cap";
export type { FileAttachment, FileFilter } from "./file";
export type {
  Regulation,
  RegulationFilter,
  RegulationImpact,
  RegulationComparison,
  RegulationDependency,
  RegulationDependencyItem,
  VietLexDoc,
  VietLexDocDetail,
} from "./regulation";
export type {
  Report,
  ReportFilter,
  ReportKPI,
  ReportChart,
  ReportType,
  ExecutiveSummary,
  EWSReport,
} from "./report";
export type {
  UserProfile,
  RoleEntity,
  Organization,
  AuditLog,
  AIConfig,
  Permission,
  OrganizationSettings,
  HoDepartment,
  Branch,
} from "./admin";
export type {
  NonComplianceCase,
  NCCStatus,
  NCCSeverity,
  NCCFilter,
  CreateNCCInput,
  UpdateNCCInput,
} from "./ncc";
export type {
  LitigationCase,
  CaseMilestone,
  LegalDeadline,
  AlertRule,
  CaseEvent,
  LMCaseStatus,
  LegalDeadlineStatus,
  NotificationChannel,
  LMCaseFilter,
  CreateLMCaseInput,
  UpdateLMCaseInput,
  LMWorkloadEntry,
  UpdateLMMilestoneInput,
  UpdateLMDeadlineInput,
} from "./lm";
export type {
  Assignment,
  CreateAssignmentInput,
  AssignmentFilter,
  UpdateAssignmentInput,
  BulkAssignmentInput,
  AssignmentTimelineEvent,
} from "./assignment";
export type {
  DashboardKPI,
  DashboardWidget,
  TrendData,
  RiskHeatmapData,
  ActivityFeedItem,
  Notification,
} from "./dashboard";
export type {
  AIAssistantMode,
  AIReference,
  AIExplanation,
  AIInsight,
  AIRecommendation,
  AICopilotMessage,
  AICopilotThread,
  AISuggestedCAP,
  AIRiskScoreResult,
} from "./ai";
