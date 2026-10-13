import { addDays, formatISO, parseISO, subDays } from "date-fns";
import { MAPPING_ACTION_SHORT } from "@/lib/cms-rules";
import type {
  NonComplianceCase,
  InternalRegulation,
  RevisionTask,
  TaskWorkflowStep,
} from "@/types";

/**
 * Task workflow (CMS module 2): the default step template and the seed data
 * for each task's workflow fields (brief, acceptance, drafts, deadline
 * changes, linked QĐNB).
 */

export const COMPLIANCE_ASSIGNER = "Lê Thị Hoa (Khối Tuân thủ)";

export function defaultTaskWorkflow(): TaskWorkflowStep[] {
  return [
    {
      key: "assign",
      name: "Compliance assigns the task",
      owner: "compliance",
      days: 0,
      evidenceRequired: false,
      builtIn: true,
      description:
        "Source law(s), the QĐNB to change, what to do, lead and support units, deadlines.",
    },
    {
      key: "accept",
      name: "Department accepts",
      owner: "department",
      days: 3,
      evidenceRequired: false,
      builtIn: true,
      description:
        "The lead unit confirms the task or asks to change the deadline.",
    },
    {
      key: "draft",
      name: "Draft the new text",
      owner: "department",
      days: 20,
      evidenceRequired: true,
      builtIn: true,
      description: "Draft 1, 2… are uploaded and kept.",
    },
    {
      key: "review",
      name: "Compliance review",
      owner: "compliance",
      days: 5,
      evidenceRequired: false,
      builtIn: true,
      description:
        "Compliance checks the draft against the law, or returns it.",
    },
    {
      key: "approve",
      name: "Approval (TGĐ / HĐQT)",
      owner: "approver",
      days: 5,
      evidenceRequired: false,
      builtIn: true,
      description: "The signing level approves the final draft.",
    },
    {
      key: "issue",
      name: "Issue & record evidence",
      owner: "department",
      days: 3,
      evidenceRequired: true,
      builtIn: true,
      description:
        "Decision number, dates and the signed file; the QĐNB gets a new version.",
    },
    {
      key: "complete",
      name: "Complete — link issued QĐNB",
      owner: "compliance",
      days: 2,
      evidenceRequired: false,
      builtIn: true,
      description:
        "The task is linked to one or more issued QĐNB in the Library before it can be completed.",
    },
  ];
}

const iso = (d: Date) => formatISO(d);

/** Three remediation actions per issue, done in order as the issue moves on. */
export function seedIssueActionPlans(issues: NonComplianceCase[]) {
  for (const n of issues) {
    if (n.actionPlan) continue;
    const due = parseISO(n.dueDate);
    const created = parseISO(n.createdAt);
    const doneCount =
      n.status === "Closed"
        ? 3
        : n.workflow.stage === "review" || n.workflow.stage === "approval"
          ? 2
          : n.workflow.stage === "evidence"
            ? 1
            : 0;
    const items = [
      `Xác định nguyên nhân gốc rễ và phạm vi ảnh hưởng (${n.category})`,
      "Khắc phục các hồ sơ / giao dịch bị ảnh hưởng",
      "Cập nhật quy trình, đào tạo lại cán bộ và kiểm tra lại",
    ];
    n.actionPlan = items.map((action, i) => ({
      id: `${n.id}-ap-${i + 1}`,
      action,
      owner: n.ownerName,
      dueDate: iso(subDays(due, (2 - i) * 7)),
      done: i < doneCount,
      doneAt: i < doneCount ? iso(addDays(created, (i + 1) * 5)) : undefined,
    }));
  }
}

/** Fills the workflow fields of the seeded tasks from their status. */
export function enrichTaskWorkflow(
  tasks: RevisionTask[],
  qdnbs: InternalRegulation[],
  now: Date,
) {
  const issued = tasks
    .filter((t) => t.status === "issued")
    .sort((a, b) => (b.issuedAt ?? "").localeCompare(a.issuedAt ?? ""));
  // Leave the most recent issued task one click from completion for the demo.
  const demoToComplete = issued[0]?.id;
  let requestOpen = false;

  for (const t of tasks) {
    const created = parseISO(t.createdAt);
    const q = qdnbs.find((x) => x.id === t.qdnbId);
    const laws = t.sources.map((s) => s.docNumber).join(", ");
    t.brief ??= `${MAPPING_ACTION_SHORT[t.action]} ${t.qdnbCode} “${t.qdnbTitle}” để phù hợp với ${laws}. Rà soát các điều khoản liên quan, lập dự thảo, lấy ý kiến đơn vị phối hợp và trình ban hành trước ngày ${parseISO(t.committedDate).toLocaleDateString("vi-VN")}.`;
    t.assignedBy ??= COMPLIANCE_ASSIGNER;
    t.assignedAt ??= t.createdAt;
    t.responseDeadline ??= iso(addDays(created, 3));
    if (t.status !== "not_started" && !t.acceptedAt) {
      t.acceptedAt = iso(addDays(created, 1));
      t.acceptedBy = `${t.ownerName} (${t.leadUnitName})`;
    }

    if (!t.drafts) {
      const draftCount =
        t.status === "issued" || t.status === "pending_approval"
          ? 2
          : t.status === "in_revision" && t.progress >= 40
            ? 1
            : 0;
      const firstAt = addDays(created, 8);
      t.drafts = Array.from({ length: draftCount }, (_, i) => ({
        id: `${t.id}-draft-${i + 1}`,
        version: i + 1,
        fileName: `${t.code}_Du_thao_${i + 1}.docx`,
        note:
          i === 0
            ? "Dự thảo lần 1 — đã lấy ý kiến đơn vị phối hợp"
            : "Dự thảo lần 2 — tiếp thu ý kiến rà soát của Khối Tuân thủ",
        by: t.ownerName,
        at: iso(addDays(firstAt, i * 7)),
      }));
    }

    if (!t.deadlineChanges) {
      t.deadlineChanges = [];
      const late = t.status !== "issued" && parseISO(t.committedDate) < now;
      if (late || t.escalations.length > 0) {
        const from = subDays(parseISO(t.committedDate), 14);
        t.deadlineChanges.push({
          id: `${t.id}-dc-1`,
          requestedBy: t.ownerName,
          requestedByUnit: t.leadUnitName,
          requestedAt: iso(subDays(from, 5)),
          from: iso(from),
          to: t.committedDate,
          reason:
            "Cần thêm thời gian lấy ý kiến các đơn vị phối hợp và Khối Pháp chế.",
          status: "approved",
          decidedBy: COMPLIANCE_ASSIGNER,
          decidedAt: iso(subDays(from, 3)),
          decisionNote: "Đồng ý gia hạn 14 ngày — không vượt ngày hiệu lực.",
        });
      }
      if (!requestOpen && t.status === "in_revision" && !late) {
        requestOpen = true;
        t.deadlineChanges.push({
          id: `${t.id}-dc-2`,
          requestedBy: t.ownerName,
          requestedByUnit: t.leadUnitName,
          requestedAt: iso(subDays(now, 1)),
          from: t.committedDate,
          to: iso(addDays(parseISO(t.committedDate), 10)),
          reason:
            "Chờ ý kiến chính thức của Khối Quản lý Rủi ro về ngưỡng giới hạn mới.",
          status: "pending",
        });
      }
    }

    if (t.status === "issued" && t.id !== demoToComplete && !t.completedAt) {
      t.linkedQdnbIds = q ? [q.id] : [];
      t.completedAt = t.issuedAt;
      t.completedBy = COMPLIANCE_ASSIGNER;
    }
    t.linkedQdnbIds ??= [];
  }
}
