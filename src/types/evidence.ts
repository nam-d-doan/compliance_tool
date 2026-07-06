import type { BaseEntity } from "./base";
import type { EvidenceStatus } from "@/constants/status";

export interface EvidenceValidation {
  status:
    | "suitable"
    | "questionable"
    | "insufficient"
    | "wrong_document"
    | "pending"
    | "completed";
  score: number;
  issues: string[];
  missingItems: string[];
  confidence: number;
  recommendations: string[];
  extractedMetadata?: Record<string, string>;
}

export interface Evidence extends BaseEntity {
  name: string;
  fileName: string;
  category: string;
  complianceId?: string;
  complianceTitle?: string;
  ownerId: string;
  ownerName: string;
  department?: string;
  businessUnit?: string;
  uploadDate: string;
  version: number;
  status: EvidenceStatus;
  aiValidation: EvidenceValidation;
  fileSize: number;
  fileType: string;
  checksum: string;
  tags: string[];
  ocrText?: string;
  url: string;
}

export interface EvidenceFilter {
  category?: string;
  owner?: string;
  department?: string;
  businessUnit?: string;
  compliance?: string;
  status?: EvidenceStatus | EvidenceStatus[];
  dateFrom?: string;
  dateTo?: string;
  aiScoreMin?: number;
  aiScoreMax?: number;
  search?: string;
  tags?: string[];
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

export interface EvidenceComment {
  id: string;
  evidenceId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}
