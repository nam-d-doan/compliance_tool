import type { BaseEntity } from "./base";

export type AIAssistantMode =
  "compliance" | "cap" | "regulation" | "policy" | "executive" | "system";

export interface AIReference {
  title: string;
  url: string;
}

export interface AIExplanation {
  recommendation: string;
  confidence: number;
  reasoning: string[];
  references: AIReference[];
  relatedDocuments: string[];
  historicalSimilarity?: number;
  timestamp: string;
  modelVersion: string;
}

export interface AIInsight extends BaseEntity {
  title: string;
  description: string;
  type: "risk" | "opportunity" | "action" | "anomaly";
  confidence: number;
  recommendation: string;
  reasoning: string[];
  references: AIReference[];
  entityType?: string;
  entityId?: string;
}

export interface AIRecommendation extends BaseEntity {
  type: string;
  entityType: string;
  entityId: string;
  recommendation: string;
  reason: string;
  confidence: number;
  historicalSimilarity: number;
  explanation: AIExplanation;
}

export interface AICopilotMessage {
  id: string;
  threadId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  mode: AIAssistantMode;
  explanation?: AIExplanation;
  suggestedActions?: {
    label: string;
    action: string;
    params?: Record<string, unknown>;
  }[];
  references?: AIReference[];
}

export interface AICopilotThread extends BaseEntity {
  userId: string;
  title: string;
  mode: AIAssistantMode;
  messages: AICopilotMessage[];
}

export interface AISuggestedCAP {
  title: string;
  description: string;
  rootCause: string;
  recommendedActions: string[];
  timeline: string;
  priority: "low" | "medium" | "high" | "critical";
  estimatedEffort: string;
  estimatedCost: number;
  explanation: AIExplanation;
}

export interface AIRiskScoreResult {
  score: number;
  factors: { label: string; impact: number }[];
  explanation: AIExplanation;
}
