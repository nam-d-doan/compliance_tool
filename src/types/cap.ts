import type { BaseEntity } from "./base";
import type { PriorityLevel, CAPStatus } from "@/constants/status";

export interface CAPAction extends BaseEntity {
  capId: string;
  title: string;
  ownerId: string;
  ownerName: string;
  deadline: string;
  status: CAPStatus;
  progress: number;
  attachments: string[];
  comments: string[];
  order: number;
}

export interface CAPAISuggestion {
  rootCause: string;
  recommendedActions: string[];
  timeline: string;
  priority: PriorityLevel;
  estimatedEffort: string;
  confidence: number;
  rationale: string;
}

export interface CAP extends BaseEntity {
  capId: string;
  title: string;
  description: string;
  priority: PriorityLevel;
  risk: PriorityLevel;
  ownerId: string;
  ownerName: string;
  approverId: string;
  approverName: string;
  department: string;
  businessUnit: string;
  location?: string;
  dueDate: string;
  status: CAPStatus;
  estimatedCost: number;
  actualCost: number;
  rootCause: string;
  /** Linked ComplianceObligation IDs (1..n). Replaces the legacy single `complianceId`. */
  obligationIds: string[];
  /** Denormalized title of the primary (first) linked obligation. Backward-compat convenience. */
  complianceTitle?: string;
  actions: CAPAction[];
  aiSuggestions: CAPAISuggestion[];
  progress: number;
  tags: string[];
  /** IDs of FileAttachments linked to this CAP (Phase 5). */
  fileIds: string[];
}

export interface CAPFilter {
  status?: CAPStatus | CAPStatus[];
  priority?: PriorityLevel | PriorityLevel[];
  owner?: string;
  department?: string;
  businessUnit?: string;
  location?: string;
  compliance?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
  tags?: string[];
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

export interface CAPTimelineEvent {
  id: string;
  capId: string;
  type:
    | "created"
    | "assigned"
    | "updated"
    | "completed"
    | "approved"
    | "rejected"
    | "commented";
  title: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface CAPComment {
  id: string;
  capId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}
