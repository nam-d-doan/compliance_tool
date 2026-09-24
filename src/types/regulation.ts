import type { Article } from "./article";
import type { PriorityLevel } from "@/constants/status";
import type { RegulationStatus } from "@/constants/status";

export interface Regulation {
  id: string;
  title: string;
  description: string;
  category: string;
  regulatoryBody: string;
  issueDate?: string;
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
  // Richer metadata drawn from the VietLex search result. Optional so the
  // legacy seeded stub keeps working; populated for live-API hits.
  loai?: string; // Loại văn bản (Thông tư, Luật, ...)
  nganh?: string; // Ngành (Ngân hàng, ...)
  linhVuc?: string; // Lĩnh vực
  capBanHanh?: string; // Cơ quan ban hành (cạnh issuer)
  pdfUrl?: string; // direct PDF / internal pdf endpoint
  url?: string; // official source link
  nguon?: string; // data source label (vanban.chinhphu.vn, ...)
}

export interface VietLexDocDetail extends VietLexDoc {
  body: string;
  articles: { id: string; title: string; content: string }[];
}
