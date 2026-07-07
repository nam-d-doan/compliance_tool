import type { Article } from "./article";
import type { PriorityLevel } from "@/constants/status";
import type { RegulationStatus } from "@/constants/status";

export interface Regulation {
  id: string;
  title: string;
  description: string;
  category: string;
  regulatoryBody: string;
  effectiveDate: string;
  expirationDate?: string;
  status: RegulationStatus;
  priority: PriorityLevel;
  source: "internal" | "external";
  articles: Article[];
  createdDate: string;
  updatedDate: string;
}

export interface RegulationFilter {
  country?: string;
  regulator?: string;
  industry?: string;
  category?: string;
  status?: RegulationStatus | RegulationStatus[];
  effectiveDateFrom?: string;
  effectiveDateTo?: string;
  keywords?: string;
  department?: string;
  businessUnit?: string;
  search?: string;
  tags?: string[];
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

export interface RegulationImpact {
  regulationId: string;
  regulationTitle: string;
  affectedDepartments: string[];
  affectedComplianceIds: string[];
  affectedPolicies: string[];
  affectedBusinessUnits: string[];
  affectedRisks: string[];
  affectedControls: string[];
  aiSummary: string;
  estimatedEffort: string;
}

export interface RegulationComparison {
  regulationA: Regulation;
  regulationB: Regulation;
  added: string[];
  removed: string[];
  modified: string[];
  moved: string[];
  aiSummary: string;
}

export interface RegulationDependency {
  id: string;
  fromRegulationId: string;
  toRegulationId: string;
  type: "amends" | "repeals" | "supersedes" | "references";
  description: string;
  notes?: string;
  createdDate: string;
}

export interface RegulationDependencyItem extends RegulationDependency {
  direction: "outgoing" | "incoming";
  relatedRegulationId: string;
  relatedRegulationTitle?: string;
}

export interface VietLexDoc {
  id: string;
  docNumber: string;
  title: string;
  issuer: string;
  date: string; // ISO
}

export interface VietLexDocDetail extends VietLexDoc {
  body: string;
  articles: { id: string; title: string; content: string }[];
}
