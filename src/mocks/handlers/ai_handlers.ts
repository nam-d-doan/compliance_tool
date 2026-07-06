import { http } from "msw";
import { faker } from "@faker-js/faker";
import { getDb, findById } from "@/mocks/db";
import { getDelay, jsonResponse, badRequest } from "./utils";
import type {
  AICopilotMessage,
  AISuggestedCAP,
  AIRiskScoreResult,
  AIEvidenceValidationResult,
  RegulationImpact,
  AIExplanation,
} from "@/types";

function createExplanation(recommendation: string): AIExplanation {
  return {
    recommendation,
    confidence: faker.number.float({ min: 0.72, max: 0.95 }),
    reasoning: [
      "Analyzed historical patterns and current data context.",
      "Cross-referenced related obligations, evidence, and regulatory requirements.",
      "Weighted risk factors including due date proximity and criticality.",
      "Compared against similar resolved cases in the knowledge base.",
    ],
    references: [
      {
        title: "Internal Compliance Policy v3.2",
        url: "https://docs.example.com/policy/3.2",
      },
      {
        title: "Regulatory Guidance Note",
        url: "https://regulator.example.com/guidance/aml",
      },
      {
        title: "Previous Audit Findings Q2",
        url: "https://audit.example.com/q2-findings",
      },
    ],
    relatedDocuments: ["Policy A", "Risk Assessment Q3", "Previous Submission"],
    historicalSimilarity: faker.number.float({ min: 0.6, max: 0.92 }),
    timestamp: new Date().toISOString(),
    modelVersion: "gpt-4o-mock-v1",
  };
}

const COPILOT_RESPONSES = [
  {
    keywords: ["prioritize", "week", "focus"],
    content:
      "This week, prioritize the 12 overdue AML obligations in Retail Banking and the 5 expiring licenses in APAC. These items have the highest combined risk score and regulatory visibility.",
    followups: [
      "Show me the overdue AML obligations",
      "Which licenses expire in APAC?",
    ],
  },
  {
    keywords: ["risk", "highest", "month"],
    content:
      "The highest compliance risks this month are concentrated in Treasury (3 critical overdue obligations) and Operations (2 open CAPs past due date). I recommend escalation to the regional manager.",
    followups: ["Show Treasury obligations", "Summarize open CAPs"],
  },
  {
    keywords: ["summarize", "regulation"],
    content:
      "The new regulation introduces 3 additional reporting obligations for consumer protection, removes the legacy quarterly filing, and extends data retention requirements from 5 to 7 years.",
    followups: ["Which departments are affected?", "What evidence do we need?"],
  },
  {
    keywords: ["generate", "cap"],
    content:
      "I have drafted a CAP focused on root cause remediation, including 4 actionable tasks with assigned owners and a recommended 6-week timeline.",
    followups: ["Assign the CAP owner", "Show recommended tasks"],
  },
  {
    keywords: ["status", "recommend"],
    content:
      'Based on the uploaded evidence and historical approvals, I recommend marking this obligation as "Complied". Evidence completeness is 94% and no missing documents were detected.',
    followups: ["What evidence is attached?", "Show similar approvals"],
  },
  {
    keywords: ["explain", "obligation"],
    content:
      "This obligation requires the business unit to conduct monthly transaction monitoring reviews, document findings, and retain evidence for at least 5 years for audit purposes.",
    followups: ["What evidence is required?", "Who owns this obligation?"],
  },
  {
    keywords: ["license", "expire"],
    content:
      "There are 8 licenses expiring in the next 60 days. I recommend starting renewal now for the 3 critical licenses to avoid operational disruption.",
    followups: ["Which licenses are critical?", "Show renewal calendar"],
  },
  {
    keywords: ["evidence", "missing"],
    content:
      "The evidence package is missing the signed attestation page and the latest policy version. Upload these two documents to reach a completeness score above 90%.",
    followups: ["Upload evidence", "Validate current evidence"],
  },
  {
    keywords: ["dashboard", "executive"],
    content:
      "Executive dashboard shows compliance rate at 94.2%, down 1.2% from last month. Top action: review workload allocation in Treasury and Operations.",
    followups: ["Show compliance trend", "What needs my approval?"],
  },
  {
    keywords: ["compliance", "status"],
    content:
      "Overall compliance status is 94.2% complete. 23 obligations are due this month, 7 are overdue, and 4 are pending approval. Treasury and Operations account for 65% of overdue items.",
    followups: ["Show overdue items", "What needs my approval?"],
  },
  {
    keywords: ["approval", "approve"],
    content:
      "You have 4 items awaiting approval: 2 compliance submissions, 1 CAP closure, and 1 license renewal. All submissions have evidence completeness above 90% and are ready for review.",
    followups: ["Review compliance submissions", "Review license renewal"],
  },
  {
    keywords: ["open", "cap", "caps"],
    content:
      "There are 18 open CAPs. 6 are high priority and 2 are past their target closure date. The majority relate to control gaps in Operations and IT Compliance.",
    followups: ["Show high-priority CAPs", "Which CAPs are overdue?"],
  },
  {
    keywords: ["help"],
    content:
      "I can help you summarize regulations, recommend compliance status, generate CAPs, validate evidence, or prioritize your work. What would you like to focus on?",
    followups: [
      "What's our compliance status?",
      "Which regulations expire soon?",
    ],
  },
];

export async function handleAiCopilotMessage({
  request,
}: {
  request: Request;
}) {
  await getDelay(300, 600);
  const body = (await request.json()) as {
    message?: string;
    threadId?: string;
    mode?: string;
    route?: string;
    role?: string;
  };
  const message = (body.message ?? "").toLowerCase();
  if (!body.message) return badRequest("Message is required");

  const matched =
    COPILOT_RESPONSES.find((r) =>
      r.keywords.some((k) => message.includes(k)),
    ) ?? COPILOT_RESPONSES[COPILOT_RESPONSES.length - 1];

  const explanation = createExplanation(matched.content);
  if (body.route || body.role) {
    explanation.reasoning.push(
      `Response tailored for ${body.role ?? "the current user"} viewing ${body.route ?? "the current page"}.`,
    );
  }

  const response: AICopilotMessage = {
    id: `msg-${crypto.randomUUID()}`,
    threadId: body.threadId ?? `thread-${crypto.randomUUID()}`,
    role: "assistant",
    content: matched.content,
    timestamp: new Date().toISOString(),
    mode: (body.mode as AICopilotMessage["mode"]) ?? "system",
    explanation,
    suggestedActions: [
      ...(matched.followups ?? []).map((prompt) => ({
        label: prompt,
        action: "prompt",
        params: { prompt },
      })),
      { label: "View details", action: "navigate" },
      { label: "Generate report", action: "report" },
    ],
    references: [
      { title: "Related compliance record", url: "#" },
      { title: "Regulatory reference", url: "#" },
    ],
  };
  return jsonResponse(response);
}

export async function handleAiCapGenerate({ request }: { request: Request }) {
  await getDelay(400, 700);
  const body = (await request.json()) as {
    complianceId?: string;
    description?: string;
  };
  const db = getDb();
  const compliance = body.complianceId
    ? findById(db.compliance, body.complianceId)
    : undefined;

  const cap: AISuggestedCAP = {
    title: `AI-Generated CAP: ${compliance?.title ?? "Remediation Plan"}`,
    description:
      body.description ??
      "Corrective action plan generated from non-compliance findings and historical remediation patterns.",
    rootCause:
      "Inadequate control execution and missing evidence documentation during the review period.",
    recommendedActions: [
      "Update control procedures to clarify ownership and deadlines.",
      "Collect and upload missing evidence to the evidence repository.",
      "Conduct a follow-up review with the compliance owner within 14 days.",
      "Implement a recurring reminder before the next due date.",
    ],
    timeline: "6 weeks",
    priority: "high",
    estimatedEffort: "80 hours",
    estimatedCost: 45000,
    explanation: createExplanation(
      "Create a high-priority CAP with four remediation actions over six weeks.",
    ),
  };
  return jsonResponse(cap);
}

export async function handleAiComplianceRiskScore({
  request,
}: {
  request: Request;
}) {
  await getDelay(300, 600);
  const body = (await request.json()) as { complianceId?: string };
  const db = getDb();
  const compliance = body.complianceId
    ? findById(db.compliance, body.complianceId)
    : undefined;

  const result: AIRiskScoreResult = {
    score: compliance?.aiRiskScore ?? faker.number.int({ min: 30, max: 95 }),
    factors: [
      {
        label: "Due date proximity",
        impact: faker.number.int({ min: 10, max: 30 }),
      },
      {
        label: "Evidence completeness",
        impact: faker.number.int({ min: 10, max: 25 }),
      },
      {
        label: "Historical violations",
        impact: faker.number.int({ min: 5, max: 20 }),
      },
      { label: "Criticality", impact: faker.number.int({ min: 10, max: 25 }) },
    ],
    explanation: createRecommendation(
      "Escalate this obligation for immediate review due to elevated risk factors.",
    ),
  };
  return jsonResponse(result);
}

export async function handleAiRegulationImpact({
  request,
}: {
  request: Request;
}) {
  await getDelay(400, 700);
  const body = (await request.json()) as { regulationId?: string };
  const db = getDb();
  const regulation = body.regulationId
    ? findById(db.regulations, body.regulationId)
    : undefined;
  if (!regulation) return badRequest("Regulation ID is required");

  const impact: RegulationImpact = {
    regulationId: regulation.id,
    regulationTitle: regulation.title,
    affectedDepartments: regulation.affectedDepartments,
    affectedComplianceIds: db.compliance
      .filter((c) => c.regulationId === regulation.id)
      .map((c) => c.id),
    affectedLicenseIds: db.licenses
      .filter((l) => l.regulationId === regulation.id)
      .map((l) => l.id),
    affectedPolicies: [
      "Data Retention Policy",
      "Customer Onboarding Policy",
      "Incident Response Policy",
    ],
    affectedBusinessUnits: regulation.affectedBusinessUnits,
    affectedRisks: ["Compliance Risk", "Operational Risk", "Reputational Risk"],
    affectedControls: ["Control KYC-01", "Control PRIV-04", "Control OPS-12"],
    aiSummary: `AI analysis estimates ${regulation.affectedDepartments.length} departments and ${regulation.affectedBusinessUnits.length} business units will be affected. Implementation effort is moderate-to-high.`,
    estimatedEffort: "8-12 weeks",
  };
  return jsonResponse({
    impact,
    explanation: createExplanation(
      "Review impacted compliance, licenses, and policies to plan remediation.",
    ),
  });
}

export async function handleAiExecutiveSummary() {
  await getDelay(500, 900);
  const summary = `Enterprise compliance improved 3% this month. However, Treasury and Operations continue to show the highest overdue rates. AI recommends reviewing workload allocation and escalating 5 critical items. License renewals require attention in APAC.`;
  return jsonResponse({ summary, explanation: createExplanation(summary) });
}

export async function handleAiEvidenceValidate({
  request,
}: {
  request: Request;
}) {
  await getDelay(400, 700);
  const body = (await request.json()) as { evidenceId?: string };
  const db = getDb();
  const evidence = body.evidenceId
    ? findById(db.evidence, body.evidenceId)
    : undefined;

  const result: AIEvidenceValidationResult = {
    status: evidence ? evidence.aiValidation.status : "suitable",
    score: evidence ? evidence.aiValidation.score : 92,
    issues: evidence?.aiValidation.issues ?? [],
    missingItems: evidence?.aiValidation.missingItems ?? [],
    recommendations: evidence?.aiValidation.recommendations ?? [
      "No action required",
    ],
    extractedMetadata: evidence?.aiValidation.extractedMetadata ?? {},
    explanation: createExplanation(
      evidence
        ? `Evidence validation result: ${evidence.aiValidation.status}`
        : "Evidence appears suitable.",
    ),
  };
  return jsonResponse(result);
}

function createRecommendation(recommendation: string): AIExplanation {
  return createExplanation(recommendation);
}

export const aiHandlers = [
  http.post("/api/ai/copilot/message", handleAiCopilotMessage),
  http.post("/api/ai/cap/generate", handleAiCapGenerate),
  http.post("/api/ai/compliance/risk-score", handleAiComplianceRiskScore),
  http.post("/api/ai/regulation/impact", handleAiRegulationImpact),
  http.post("/api/ai/executive-summary", handleAiExecutiveSummary),
  http.post("/api/ai/evidence/validate", handleAiEvidenceValidate),
];
