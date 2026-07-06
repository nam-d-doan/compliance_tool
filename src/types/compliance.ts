import type { BaseEntity } from "./base";
import type { PriorityLevel } from "@/constants/status";
import type {
  ComplianceStatus,
  ComplianceSubmissionStatus,
} from "@/constants/status";

export interface ComplianceObligation extends BaseEntity {
  complianceId: string;
  title: string;
  description: string;
  businessUnit: string;
  department: string;
  location: string;
  regulationId: string;
  regulationName: string;
  ownerId: string;
  ownerName: string;
  approverId: string;
  approverName: string;
  reviewerIds: string[];
  frequency: "once" | "monthly" | "quarterly" | "biannually" | "annually";
  criticality: PriorityLevel;
  dueDate: string;
  penalty: string;
  status: ComplianceStatus;
  aiRiskScore: number;
  tags: string[];
  aiRecommendation?: string;
  lastSubmissionId?: string;
  lastSubmissionStatus?: ComplianceSubmissionStatus;
  progress: number;
}

export interface ComplianceSubmission extends BaseEntity {
  complianceId: string;
  complianceTitle: string;
  ownerId: string;
  ownerName: string;
  performedDate: string;
  status: ComplianceSubmissionStatus;
  comments: string;
  additionalNotes: string;
  capRequired: boolean;
  riskRating: PriorityLevel;
  aiSuggestion?: string;
}

export interface ComplianceFilter {
  status?: ComplianceStatus | ComplianceStatus[];
  priority?: PriorityLevel | PriorityLevel[];
  owner?: string;
  department?: string;
  businessUnit?: string;
  location?: string;
  regulation?: string;
  approver?: string;
  reviewer?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  tags?: string[];
  frequency?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

export interface ComplianceTimelineEvent {
  id: string;
  complianceId: string;
  type:
    | "created"
    | "assigned"
    | "updated"
    | "submitted"
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

export interface ComplianceComment {
  id: string;
  complianceId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
  attachments?: string[];
}
