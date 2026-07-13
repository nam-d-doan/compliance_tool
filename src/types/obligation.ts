import type { BaseEntity } from "./base";
import type { ObligationStatus, PriorityLevel } from "@/constants/status";

export type { ObligationStatus };
/** @deprecated use `PriorityLevel` — kept as an alias to minimize churn. */
export type ObligationRiskLevel = PriorityLevel;

/**
 * Canonical obligation entity. Unifies the legacy `ComplianceObligation`
 * (business-unit/department/regulation-centric, richer approval workflow)
 * with the assignment-linked `Obligation` (the real intended flow entry
 * point: Regulation → Assignment → Obligation). Every obligation is linked
 * to an Assignment; regulation fields are denormalized for direct display.
 */
export interface Obligation extends BaseEntity {
  /** Display code, e.g. "OBG-2026-001". */
  code: string;
  assignmentId: string;
  assignmentTitle?: string; // denormalized
  articleRef: string; // e.g., "Điều 3", "Article 12"
  title: string;
  description: string;

  /** Denormalized from the linked Assignment's regulation. */
  regulationId: string;
  regulationName: string;

  ownerDepartmentId: string;
  ownerDepartmentName?: string;
  /** Owning user id — the person accountable for fulfilling the obligation.
   * Drives the owner-role dashboard ("My Obligations"). */
  ownerId: string;
  /** Denormalized owner display name. */
  ownerName: string;

  approverId: string;
  approverName: string;

  /** Business unit / department / location groupings, retained from the
   * legacy entity for reporting and filtering parity. */
  businessUnit: string;
  department: string;
  location: string;

  frequency: "once" | "monthly" | "quarterly" | "biannually" | "annually";

  dueDate: string; // ISO
  riskLevel: PriorityLevel;
  status: ObligationStatus;

  penalty: string;

  aiRiskScore: number;
  aiRecommendation?: string;

  tags: string[];
  /** 0-100 completion percentage. */
  progress: number;
}

/** Single obligation row in a bulk submission. `assignmentId` is optional to
 * support the legacy regulation-only flow; `regulationId` is carried so the
 * backend can denormalize titles when no assignment is present. */
export interface BulkObligationInputItem {
  assignmentId?: string;
  regulationId?: string;
  articleRef: string;
  title: string;
  description: string;
  ownerDepartmentId: string;
  ownerDepartmentName?: string;
  /** Optional owner user. Defaults to the requesting user when omitted. */
  ownerId?: string;
  ownerName?: string;
  dueDate: string; // ISO
  riskLevel: PriorityLevel;
}

/** Payload accepted by POST /api/obligations/bulk. */
export interface BulkCreateObligationsInput {
  obligations: BulkObligationInputItem[];
  status: "draft" | "submitted";
}

/** Response returned by POST /api/obligations/bulk. */
export interface BulkCreateObligationsResult {
  success: boolean;
  created: number;
  items: Obligation[];
}

/** Query filters accepted by GET /api/obligations/list. */
export interface ObligationFilter {
  status?: ObligationStatus | ObligationStatus[];
  riskLevel?: PriorityLevel | PriorityLevel[];
  priority?: PriorityLevel | PriorityLevel[];
  owner?: string;
  ownerName?: string;
  ownerDepartment?: string;
  businessUnit?: string;
  department?: string;
  location?: string;
  regulationId?: string;
  approver?: string;
  tags?: string[];
  assignmentId?: string;
  /** Filter to obligations that are overdue (dueDate < now, not completed). */
  overdue?: boolean;
  /** Filter to obligations linked to a given CAP id. */
  capId?: string;
  /** Filter to obligations NOT linked to any CAP (needs-CAP candidates). */
  withoutCap?: boolean;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

/** Partial update payload for PATCH /api/obligations/:id. */
export type UpdateObligationInput = Partial<
  Omit<Obligation, "id" | "createdAt" | "updatedAt" | "assignmentId" | "assignmentTitle">
>;

/** Bulk update payload for PATCH /api/obligations/bulk. Either a new status
 * or a common due date (or both) may be applied to the selected rows. */
export interface BulkUpdateObligationsInput {
  ids: string[];
  status?: ObligationStatus;
  dueDate?: string;
}

/** Result returned by PATCH /api/obligations/bulk. */
export interface BulkUpdateObligationsResult {
  success: boolean;
  updated: number;
  items: Obligation[];
}

/** Timeline event for an obligation. */
export interface ObligationTimelineEvent {
  id: string;
  obligationId: string;
  type:
    | "created"
    | "updated"
    | "submitted"
    | "review_required"
    | "cap_in_progress"
    | "completed"
    | "status_changed"
    | "approved"
    | "rejected"
    | "cap_created"
    | "closed"
    | "commented";
  title: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ObligationComment {
  id: string;
  obligationId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
  attachments?: string[];
}
