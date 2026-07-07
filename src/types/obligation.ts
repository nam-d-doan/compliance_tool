export type ObligationStatus =
  | "draft"
  | "submitted"
  | "review_required"
  | "cap_in_progress"
  | "completed";

export type ObligationRiskLevel = "low" | "medium" | "high" | "critical";

export interface Obligation {
  id: string;
  assignmentId: string;
  assignmentTitle?: string; // denormalized
  articleRef: string; // e.g., "Điều 3", "Article 12"
  title: string;
  description: string;
  ownerDepartmentId: string;
  ownerDepartmentName?: string;
  dueDate: string; // ISO
  riskLevel: ObligationRiskLevel;
  status: ObligationStatus;
  createdDate: string;
  updatedDate: string;
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
  dueDate: string; // ISO
  riskLevel: ObligationRiskLevel;
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
  riskLevel?: ObligationRiskLevel;
  ownerDepartment?: string;
  assignmentId?: string;
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
  Omit<
    Obligation,
    "id" | "createdDate" | "updatedDate" | "assignmentId" | "assignmentTitle"
  >
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
    | "status_changed";
  title: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
