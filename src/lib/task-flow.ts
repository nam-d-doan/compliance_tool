import type { Tone } from "@/components/cms";
import type { RevisionTask, TaskStepOwner, TaskWorkflowStep } from "@/types";

/**
 * Task workflow helpers (CMS module 2). A task walks through the steps of the
 * workflow template in order; built-in steps are read from the task's own
 * fields, custom steps from `customSteps`.
 */

export type TaskStepState = "done" | "current" | "returned" | "pending";

export interface TaskFlowStep {
  step: TaskWorkflowStep;
  state: TaskStepState;
  by?: string;
  at?: string;
  comment?: string;
}

export const STEP_OWNER_LABELS: Record<TaskStepOwner, string> = {
  compliance: "Compliance",
  department: "Lead department",
  approver: "Approver (TGĐ / HĐQT)",
};

function builtInDone(
  task: RevisionTask,
  key: string,
): { done: boolean; by?: string; at?: string; comment?: string } | null {
  const ap = (k: string) => task.approvalSteps.find((s) => s.key === k);
  switch (key) {
    case "assign":
      return { done: true, by: task.assignedBy, at: task.assignedAt };
    case "accept":
      return {
        done: !!task.acceptedAt || task.status !== "not_started",
        by: task.acceptedBy,
        at: task.acceptedAt,
      };
    case "draft": {
      const s = ap("draft");
      return {
        done: s?.state === "done",
        by: s?.by,
        at: s?.at,
        comment: s?.comment,
      };
    }
    case "review": {
      const s = ap("compliance_review");
      return {
        done: s?.state === "done",
        by: s?.by,
        at: s?.at,
        comment: s?.comment,
      };
    }
    case "approve": {
      const s = ap("approval");
      return {
        done: s?.state === "done",
        by: s?.by,
        at: s?.at,
        comment: s?.comment,
      };
    }
    case "issue":
      return {
        done: task.status === "issued",
        by: task.evidence?.recordedBy,
        at: task.evidence?.recordedAt ?? task.issuedAt,
      };
    case "complete":
      return {
        done: !!task.completedAt,
        by: task.completedBy,
        at: task.completedAt,
      };
    default:
      return null;
  }
}

export function taskFlow(
  task: RevisionTask,
  template: TaskWorkflowStep[],
): TaskFlowStep[] {
  const returned =
    task.approvalSteps.find((s) => s.key === "draft")?.state === "returned";
  const raw = template.map((step) => {
    const b = builtInDone(task, step.key);
    const custom = task.customSteps?.[step.key];
    return { step, b, custom, done: b ? b.done : !!custom };
  });
  // A custom step added before steps the task has already passed counts as
  // done, so the flow never goes backwards.
  const lastBuiltInDone = raw.reduce(
    (acc, r, i) => (r.b && r.done ? i : acc),
    -1,
  );
  let currentFound = false;
  return raw.map((r, i) => {
    const done = r.done || (!r.b && i < lastBuiltInDone);
    let state: TaskStepState;
    if (done) state = "done";
    else if (!currentFound) {
      currentFound = true;
      state = r.step.key === "draft" && returned ? "returned" : "current";
    } else state = "pending";
    return {
      step: r.step,
      state,
      by: r.b?.by ?? r.custom?.by,
      at: r.b?.at ?? r.custom?.at,
      comment: r.b?.comment,
    };
  });
}

export function currentTaskStep(
  task: RevisionTask,
  template: TaskWorkflowStep[],
): TaskFlowStep | undefined {
  return taskFlow(task, template).find((s) => s.state !== "done");
}

export type TaskStatusKey =
  | "not_started"
  | "in_progress"
  | "pending_approval"
  | "to_complete"
  | "completed";

export const TASK_STATUS_LABELS: Record<TaskStatusKey, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  pending_approval: "Review & approval",
  to_complete: "Issued — to complete",
  completed: "Completed",
};

export const TASK_STATUS_VI: Record<TaskStatusKey, string> = {
  not_started: "Chưa thực hiện",
  in_progress: "Đang thực hiện",
  pending_approval: "Rà soát & phê duyệt",
  to_complete: "Đã ban hành — chờ hoàn tất",
  completed: "Hoàn thành",
};

export const TASK_STATUS_TONE: Record<TaskStatusKey, Tone> = {
  not_started: "neutral",
  in_progress: "info",
  pending_approval: "ai",
  to_complete: "warning",
  completed: "success",
};

export const TASK_STATUSES: TaskStatusKey[] = [
  "not_started",
  "in_progress",
  "pending_approval",
  "to_complete",
  "completed",
];

export function taskStatus(task: RevisionTask): TaskStatusKey {
  if (task.completedAt) return "completed";
  if (task.status === "issued") return "to_complete";
  if (task.status === "pending_approval") return "pending_approval";
  if (task.status === "in_revision") return "in_progress";
  return "not_started";
}

export function pendingDeadlineChange(task: RevisionTask) {
  return task.deadlineChanges?.find((c) => c.status === "pending");
}
