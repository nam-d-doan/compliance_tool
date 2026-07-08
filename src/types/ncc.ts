import type { BaseEntity } from "./base";
import type { PriorityLevel } from "@/constants/status";

/**
 * Non-Compliance Case status. Only two stored values — "Overdue" is NEVER a
 * status; it is COMPUTED from the due date (past due + status !== "Closed")
 * and rendered as a red highlight via the shared DueDateCell.
 */
export type NCCStatus = "Open" | "Closed";

/** Severity of a non-compliance case (reuses the shared PriorityLevel scale). */
export type NCCSeverity = PriorityLevel;

export interface NonComplianceCase extends BaseEntity {
  /** Human-readable case identifier, e.g. `NCC-2026-001`. */
  nccId: string;
  title: string;
  description: string;
  /** Severity of the non-compliance. */
  severity: NCCSeverity;
  /**
   * The org unit that failed to comply. References the master table
   * (OrganizationSettings.hoDepartments or .branches). Can be a HO department
   * (no region) or a branch (has a region).
   */
  ownerUnitId: string;
  /** Denormalized name of the owner unit for display. */
  ownerUnitName: string;
  /** "ho_department" | "branch" — distinguishes the owner unit type. */
  ownerUnitType: "ho_department" | "branch";
  /** Region of the owner unit (only for branches; undefined for HO departments). */
  ownerUnitRegion?: string;
  /** User who is responsible for the corrective action. */
  ownerId: string;
  ownerName: string;
  /** Due date for corrective action. Overdue = past due && status !== "Closed". */
  dueDate: string;
  status: NCCStatus;
  /** Resolution notes, filled when the case is closed. */
  resolution?: string;
  /** IDs of FileAttachments linked as evidence (reuses the CAP file system). */
  fileIds: string[];
  /** Free-text references to linked documents/reports (URLs or descriptions). */
  linkedDocs?: string;
  /** ISO timestamp when the case was closed (if status === "Closed"). */
  closedAt?: string;
  /** Tags for categorization. */
  tags: string[];
}

export interface NCCFilter {
  status?: NCCStatus | NCCStatus[];
  severity?: NCCSeverity | NCCSeverity[];
  ownerUnitId?: string;
  ownerUnitType?: "ho_department" | "branch";
  ownerUnitRegion?: string;
  ownerId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
  tags?: string[];
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

/** Input payload for creating a new NCC. */
export interface CreateNCCInput {
  title: string;
  description: string;
  severity: NCCSeverity;
  ownerUnitId: string;
  ownerId: string;
  ownerName: string;
  dueDate: string;
  linkedDocs?: string;
  fileIds?: string[];
  tags?: string[];
}

/** Input payload for updating an NCC (e.g. closing with resolution). */
export interface UpdateNCCInput {
  title?: string;
  description?: string;
  severity?: NCCSeverity;
  ownerUnitId?: string;
  ownerId?: string;
  ownerName?: string;
  dueDate?: string;
  status?: NCCStatus;
  resolution?: string;
  linkedDocs?: string;
  fileIds?: string[];
  tags?: string[];
}
