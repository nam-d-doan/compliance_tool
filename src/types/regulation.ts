import type { BaseEntity } from "./base";
import type { RegulationStatus } from "@/constants/status";

export interface Regulation extends BaseEntity {
  reference: string;
  title: string;
  regulator: string;
  publicationDate: string;
  effectiveDate: string;
  supersedes?: string;
  status: RegulationStatus;
  category: string;
  jurisdiction: string;
  industry: string;
  affectedDepartments: string[];
  affectedBusinessUnits: string[];
  summary: string;
  requirements: string[];
  aiImpactScore: number;
  version: string;
  tags: string[];
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
  affectedLicenseIds: string[];
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
  regulationId: string;
  dependsOnRegulationId: string;
  type: "amends" | "repeals" | "supersedes" | "references";
}
