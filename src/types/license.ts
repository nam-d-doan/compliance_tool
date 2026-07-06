import type { BaseEntity } from "./base";
import type { PriorityLevel, LicenseStatus } from "@/constants/status";

export interface License extends BaseEntity {
  licenseNumber: string;
  licenseName: string;
  issuingAuthority: string;
  department: string;
  businessUnit: string;
  country: string;
  location: string;
  issueDate: string;
  expiryDate: string;
  renewalCycle: string;
  ownerId: string;
  ownerName: string;
  approverId: string;
  approverName: string;
  criticality: PriorityLevel;
  status: LicenseStatus;
  regulationId?: string;
  regulationName?: string;
  aiRiskScore: number;
  remainingDays: number;
  renewalPriority: PriorityLevel;
  supportingDocumentIds: string[];
  tags: string[];
}

export interface LicenseFilter {
  type?: string;
  department?: string;
  businessUnit?: string;
  country?: string;
  location?: string;
  owner?: string;
  approver?: string;
  status?: LicenseStatus | LicenseStatus[];
  expiryDateFrom?: string;
  expiryDateTo?: string;
  regulation?: string;
  criticality?: PriorityLevel | PriorityLevel[];
  search?: string;
  tags?: string[];
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

export interface LicenseCalendarEvent extends BaseEntity {
  title: string;
  date: string;
  type: "issue" | "expiry" | "renewal" | "approval";
  entityId: string;
  entityType: "license";
  status: LicenseStatus;
  description: string;
}

export interface LicenseComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}
