import type { BaseEntity } from "./base";
import type { PriorityLevel } from "@/constants/status";

/**
 * Types for the CMS modules added for the Nam A Bank RFQ (Phụ lục 1):
 * Legal Update Workflow, Internal Regulation (QĐNB) tracking, ICIS intake,
 * Risk Rating Matrix + escalation, periodic reports and demo controls.
 */

/** The bank's 3-level compliance risk scale (Thấp – Trung bình – Cao). */
export type RiskLevel = PriorityLevel;

// ---------------------------------------------------------------------------
// Group 1 — Legal Update Workflow
// ---------------------------------------------------------------------------

export type LegalDocType =
  "Luật" | "Nghị định" | "Thông tư" | "Quyết định" | "Công văn";

/** Who issued the document — drives the issuer chip and filters. */
export type LegalIssuer = "Quốc hội" | "Chính phủ" | "NHNN" | "Bộ Tài chính";

/** How the document entered the system. */
export type LegalIntakeChannel = "auto_feed" | "manual" | "ocr";

/**
 * Lifecycle of a legal update in the Compliance department's inbox.
 * new → under_review → applicable / not_applicable → mapped → assigned → completed
 */
export type LegalUpdateStatus =
  | "new"
  | "under_review"
  | "applicable"
  | "not_applicable"
  | "mapped"
  | "assigned"
  | "completed";

export interface LegalArticle {
  id: string;
  /** e.g. "Điều 12" */
  number: string;
  title: string;
  content: string;
}

/** Family-tree relation of a legal document ("Lược đồ văn bản"). */
export interface LegalRelation {
  type: "amends" | "replaces" | "guides" | "repeals" | "guided_by";
  docNumber: string;
  title: string;
}

export interface LegalAISummary {
  keyChanges: string[];
  affectedUnits: string[];
  affectedProducts: string[];
  /** Suggested internal deadline (ISO) — effective date minus a buffer. */
  suggestedDeadline: string;
  /** 0–100 */
  confidence: number;
  impactNote: string;
}

/** Action to take on an internal regulation because of a new law. */
export type MappingAction =
  "amend" | "supplement" | "replace" | "repeal" | "new";

export interface LegalMapping {
  id: string;
  /** Internal regulation affected. Undefined when action === "new". */
  qdnbId?: string;
  qdnbCode: string;
  qdnbTitle: string;
  /** Articles of the new law that drive this mapping, e.g. ["Điều 5", "Điều 12"]. */
  lawArticles: string[];
  /** Articles of the internal regulation affected, free text. */
  qdnbArticles?: string;
  action: MappingAction;
  origin: "ai" | "manual";
  /** 0–100, only for AI suggestions. */
  confidence?: number;
  reason?: string;
  status: "suggested" | "accepted" | "rejected";
  /** Suggested lead unit (from the QĐNB owner). */
  leadUnitId?: string;
}

export interface ApplicabilityDecision {
  decision: "applicable" | "not_applicable";
  reason: string;
  decidedBy: string;
  decidedAt: string;
}

export interface LegalUpdate extends BaseEntity {
  /** Internal tracking code, e.g. LU-2026-014 */
  code: string;
  /** Official number, e.g. "12/2026/TT-NHNN" */
  docNumber: string;
  title: string;
  docType: LegalDocType;
  issuer: LegalIssuer;
  issueDate: string;
  effectiveDate: string;
  receivedAt: string;
  channel: LegalIntakeChannel;
  /** Feed / source name, e.g. "vbpl.vn", "Công báo", "VietLex". */
  sourceName: string;
  /** AI-classified field (lĩnh vực). */
  field: string;
  /** AI relevance to Nam A Bank. */
  relevance: RiskLevel;
  /** 0–100 */
  relevanceScore: number;
  relevanceReason: string;
  summary: string;
  aiSummary: LegalAISummary;
  articles: LegalArticle[];
  relations: LegalRelation[];
  status: LegalUpdateStatus;
  read: boolean;
  applicability?: ApplicabilityDecision;
  mappings: LegalMapping[];
  /** Revision tasks created from this update. */
  revisionTaskIds: string[];
  /** Regulation Library record, once imported. */
  regulationId?: string;
}

// ---------------------------------------------------------------------------
// Group 2 — Internal Regulations (QĐNB) and their revision tracking
// ---------------------------------------------------------------------------

export type QdnbDocType = "Quy chế" | "Quy định" | "Quy trình" | "Hướng dẫn";

/** Level that signs the internal regulation. */
export type QdnbIssuingLevel = "HĐQT" | "TGĐ";

export interface QdnbVersion {
  version: number;
  decisionNo: string;
  issuedAt: string;
  effectiveAt: string;
  changeSummary: string;
  /** Article texts of this version, used for the diff check. */
  articles: { number: string; title: string; content: string }[];
}

export interface InternalRegulation extends BaseEntity {
  /** e.g. "QĐ 0125/2025/QĐ-TGĐ" */
  code: string;
  title: string;
  docType: QdnbDocType;
  issuingLevel: QdnbIssuingLevel;
  field: string;
  ownerUnitId: string;
  ownerUnitName: string;
  currentVersion: number;
  versions: QdnbVersion[];
  /** Laws this regulation implements (doc numbers). */
  basedOn: string[];
  /** Active revision task, if a revision is in progress. */
  activeRevisionId?: string;
  /** Draft text of the revision in progress (becomes the next version). */
  draftArticles?: QdnbVersion["articles"];
}

/**
 * Status of a QĐNB revision (Chưa điều chỉnh → Đang điều chỉnh → Chờ phê duyệt
 * → Đã ban hành). "Overdue" (Quá hạn) is never stored: it is computed from the
 * committed date, see `getRevisionHealth` in `lib/cms-rules.ts`.
 */
export type RevisionStatus =
  "not_started" | "in_revision" | "pending_approval" | "issued";

export interface RevisionApprovalStep {
  key: "draft" | "compliance_review" | "approval" | "issued";
  label: string;
  by?: string;
  at?: string;
  comment?: string;
  state: "done" | "current" | "pending" | "returned";
}

export interface IssuanceEvidence {
  decisionNo: string;
  issueDate: string;
  effectiveDate: string;
  fileName: string;
  note?: string;
  recordedBy: string;
  recordedAt: string;
}

export interface ReminderRecord {
  id: string;
  at: string;
  /** e.g. "T-30", "T-7", "Overdue +3" */
  kind: string;
  to: string;
  channels: NotifyChannel[];
}

export interface EscalationRecord {
  id: string;
  /** 1 = unit head, 2 = Head of Compliance / Khối head, 3 = BĐH & BKS */
  level: 1 | 2 | 3;
  to: string;
  reason: "high_risk" | "overdue" | "late_issuance" | "manual";
  detail: string;
  at: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface RevisionTask extends BaseEntity {
  code: string;
  qdnbId?: string;
  qdnbCode: string;
  qdnbTitle: string;
  action: MappingAction;
  /** Laws driving this revision. */
  sources: {
    legalUpdateId?: string;
    docNumber: string;
    title: string;
    effectiveDate: string;
  }[];
  /** Earliest effective date among sources. */
  lawEffectiveDate: string;
  leadUnitId: string;
  leadUnitName: string;
  supportUnitIds: string[];
  supportUnitNames: string[];
  ownerName: string;
  /** Deadline committed to by the lead unit. */
  committedDate: string;
  /** Forecast issue date, updated by the lead unit. */
  expectedIssueDate: string;
  status: RevisionStatus;
  progress: number;
  approvalSteps: RevisionApprovalStep[];
  evidence?: IssuanceEvidence;
  reminders: ReminderRecord[];
  escalations: EscalationRecord[];
  issuedAt?: string;
}

// ---------------------------------------------------------------------------
// Group 3 — Compliance issue sources and ICIS intake
// ---------------------------------------------------------------------------

export type IssueSource =
  | "icis"
  | "sbv_inspection"
  | "state_audit"
  | "independent_audit"
  | "internal_audit"
  | "self_check"
  | "compliance_monitoring"
  | "complaint";

export type IcisFindingStatus = "pending" | "accepted" | "merged" | "rejected";

export interface IcisFinding extends BaseEntity {
  /** e.g. "ICIS-KT-2026-031" */
  code: string;
  auditRound: string;
  unitId: string;
  unitName: string;
  region?: string;
  category: string;
  description: string;
  recommendation: string;
  severityHint: RiskLevel;
  /** Potential administrative fine in VND, if known. */
  finePotential?: number;
  /** Inspector's view of the scope (1–5), when the cause is wider than the unit. */
  scopeHint?: 1 | 2 | 3 | 4 | 5;
  detectedAt: string;
  inspector: string;
  receivedAt: string;
  status: IcisFindingStatus;
  issueId?: string;
  resolutionNote?: string;
}

// ---------------------------------------------------------------------------
// Group 4 — Risk Rating Matrix and escalation rules
// ---------------------------------------------------------------------------

export type RiskCriterionKey = "fine" | "reputation" | "scope" | "recurrence";

export interface RiskScaleStep {
  score: 1 | 2 | 3 | 4 | 5;
  label: string;
  description: string;
}

export interface RiskCriterion {
  key: RiskCriterionKey;
  label: string;
  labelVi: string;
  /** Weight in percent; all weights sum to 100. */
  weight: number;
  scale: RiskScaleStep[];
}

export interface RiskMatrix extends BaseEntity {
  version: number;
  status: "active" | "draft" | "retired";
  effectiveFrom: string;
  approvedBy?: string;
  approvedAt?: string;
  note?: string;
  criteria: RiskCriterion[];
  /** Weighted score (1–5) at or above which an issue is Medium / High. */
  thresholds: { medium: number; high: number };
}

export type RiskScores = Record<RiskCriterionKey, number>;

export interface RiskAssessment {
  scores: RiskScores;
  weightedScore: number;
  suggestedLevel: RiskLevel;
  finalLevel: RiskLevel;
  overridden: boolean;
  overrideReason?: string;
  matrixVersion: number;
  ratedBy: string;
  ratedAt: string;
}

export type NotifyChannel = "in_app" | "email" | "teams" | "sms";

export interface EscalationRule extends BaseEntity {
  name: string;
  trigger: "risk_level" | "overdue";
  /** For trigger === "risk_level". */
  riskLevel?: RiskLevel;
  /** For trigger === "overdue": days past due. */
  overdueDays?: number;
  level: 1 | 2 | 3;
  escalateTo: string;
  channels: NotifyChannel[];
  requireAck: boolean;
  /** Hours within which the recipient must be informed. */
  slaHours: number;
  appliesTo: ("issue" | "revision")[];
  active: boolean;
}

// ---------------------------------------------------------------------------
// Group 3.3 — Evidence submission & approval workflow on issues
// ---------------------------------------------------------------------------

export type IssueStage =
  "check" | "evidence" | "review" | "approval" | "closed";

export interface EvidenceRound {
  id: string;
  round: number;
  submittedBy: string;
  submittedAt: string;
  fileNames: string[];
  note: string;
  decision?: "accepted" | "returned";
  reviewer?: string;
  reviewedAt?: string;
  reviewComment?: string;
}

export interface IssueWorkflow {
  stage: IssueStage;
  checkNote?: string;
  checkedBy?: string;
  checkedAt?: string;
  rounds: EvidenceRound[];
  approvedBy?: string;
  approvedAt?: string;
}

// ---------------------------------------------------------------------------
// Group 5 — Periodic reports
// ---------------------------------------------------------------------------

export type ReportRecipient = "BĐH" | "HĐQT" | "BKS" | "NHNN";
export type ReportFrequency = "monthly" | "quarterly" | "yearly" | "ad_hoc";

export interface ReportTemplate {
  id: string;
  code: string;
  name: string;
  recipient: ReportRecipient;
  frequency: ReportFrequency;
  legalBasis: string;
  description: string;
  sections: string[];
}

export interface ScheduledReport {
  id: string;
  templateId: string;
  period: string;
  dueDate: string;
  status: "upcoming" | "draft" | "submitted";
  submittedAt?: string;
  submittedBy?: string;
}

// ---------------------------------------------------------------------------
// Demo controls
// ---------------------------------------------------------------------------

export interface SchedulerEvent {
  kind: "reminder" | "escalation" | "overdue" | "late_risk";
  entityType: "revision" | "issue";
  entityId: string;
  entityLabel: string;
  message: string;
}

export interface SchedulerResult {
  now: string;
  offsetDays: number;
  events: SchedulerEvent[];
}

export interface CmsOverview {
  legalUpdates: { unread: number; awaitingReview: number; total: number };
  revisions: {
    notStarted: number;
    inRevision: number;
    pendingApproval: number;
    issued: number;
    overdue: number;
    lateRisk: number;
  };
  issues: {
    open: number;
    high: number;
    medium: number;
    low: number;
    escalationsAwaitingAck: number;
    awaitingReview: number;
  };
  icis: { pending: number };
}
