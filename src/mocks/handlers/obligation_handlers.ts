import { http } from "msw";
import { getDb, findById } from "@/mocks/db";
import {
  getDelay,
  jsonResponse,
  badRequest,
  type MockResolverContext,
} from "./utils";
import type {
  BulkCreateObligationsInput,
  Obligation,
  ObligationRiskLevel,
  Assignment,
} from "@/types";

const RISK_LEVELS: ObligationRiskLevel[] = [
  "low",
  "medium",
  "high",
  "critical",
];

function normalizeRisk(value: unknown): ObligationRiskLevel {
  return RISK_LEVELS.includes(value as ObligationRiskLevel)
    ? (value as ObligationRiskLevel)
    : "medium";
}

/**
 * Build a single Obligation record from a bulk input item, resolving the
 * denormalized assignment/department titles from the mock DB.
 */
function buildObligation(
  item: BulkCreateObligationsInput["obligations"][number],
  status: "draft" | "submitted",
  assignment?: Assignment,
): Obligation {
  const now = new Date().toISOString();

  return {
    id: `obg-${crypto.randomUUID()}`,
    assignmentId: item.assignmentId ?? assignment?.id ?? "",
    assignmentTitle: assignment?.title,
    articleRef: item.articleRef,
    title: item.title,
    description: item.description ?? "",
    ownerDepartmentId: item.ownerDepartmentId,
    ownerDepartmentName: item.ownerDepartmentName ?? item.ownerDepartmentId,
    dueDate: item.dueDate,
    riskLevel: normalizeRisk(item.riskLevel),
    status,
    createdDate: now,
    updatedDate: now,
  };
}

export async function handleBulkCreateObligations({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const body = (await request.json()) as BulkCreateObligationsInput;

  if (!body.obligations || !Array.isArray(body.obligations))
    return badRequest("obligations array is required");
  if (body.obligations.length === 0)
    return badRequest("At least one obligation is required");
  if (body.status !== "draft" && body.status !== "submitted")
    return badRequest("status must be 'draft' or 'submitted'");

  // Pre-validate each row: articleRef + title are required.
  for (let i = 0; i < body.obligations.length; i++) {
    const row = body.obligations[i];
    if (!row.articleRef || !row.articleRef.trim())
      return badRequest(`Row ${i + 1}: Article Ref is required`);
    if (!row.title || !row.title.trim())
      return badRequest(`Row ${i + 1}: Title is required`);
    if (!row.dueDate) return badRequest(`Row ${i + 1}: Due date is required`);
  }

  const db = getDb();
  const items: Obligation[] = body.obligations.map((item) => {
    const assignment = item.assignmentId
      ? findById(db.assignments, item.assignmentId)
      : undefined;
    return buildObligation(item, body.status, assignment);
  });

  db.obligations.unshift(...items);

  return jsonResponse({ success: true, created: items.length, items }, 201);
}

export const obligationHandlers = [
  http.post("/api/obligations/bulk", handleBulkCreateObligations),
];

// Re-export the context type for the direct API bridge.
export type { MockResolverContext };
