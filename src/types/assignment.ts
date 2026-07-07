import type { AssignmentStatus, PriorityLevel } from "@/constants/status";

export interface Assignment {
  id: string;
  title: string;
  description: string;
  regulationId: string;
  regulationTitle?: string;
  assignorId: string;
  assignorName?: string;
  assignedDepartmentId: string;
  assignedDepartmentName?: string;
  assignedOfficeId?: string;
  assignedOfficeName?: string;
  status: AssignmentStatus;
  priority: PriorityLevel;
  dueDate: string;
  createdDate: string;
  updatedDate: string;
  notes?: string;
}

/** Payload accepted by POST /api/assignments. The server resolves the
 * assignor from the auth token; everything else is caller-supplied. */
export interface CreateAssignmentInput {
  title: string;
  description?: string;
  regulationId: string;
  regulationTitle?: string;
  assignedDepartmentId: string;
  assignedDepartmentName?: string;
  assignedOfficeId?: string;
  assignedOfficeName?: string;
  priority: PriorityLevel;
  dueDate: string;
  status: AssignmentStatus;
  notes?: string;
}

export interface AssignmentFilter {
  status?: AssignmentStatus | AssignmentStatus[];
  priority?: PriorityLevel | PriorityLevel[];
  department?: string;
  office?: string;
  assignor?: string;
  regulation?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

/** Partial update payload for PUT /api/assignments/:id. */
export type UpdateAssignmentInput = Partial<
  Omit<Assignment, "id" | "createdDate" | "updatedDate">
>;

/** Bulk action payload for POST /api/assignments/bulk. */
export interface BulkAssignmentInput {
  ids: string[];
  action: "cancel" | "setPriority";
  priority?: PriorityLevel;
}

export interface AssignmentTimelineEvent {
  id: string;
  assignmentId: string;
  type:
    | "created"
    | "published"
    | "acknowledged"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "updated";
  title: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
