import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Lock,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHero } from "@/components/common";
import { LoadingState } from "@/components/common/LoadingState";
import { AdminSubNav } from "@/components/admin/AdminSubNav";
import { Callout, ToneBadge } from "@/components/cms";
import { useTaskWorkflow } from "@/hooks/queries";
import { useSaveTaskWorkflow } from "@/hooks/mutations";
import { STEP_OWNER_LABELS } from "@/lib/task-flow";
import { cn } from "@/lib/utils";
import type { TaskStepOwner, TaskWorkflowStep } from "@/types";

/**
 * Administration → Task workflow setup. The steps every task in "Task
 * Management" goes through, configured like a rule: name, responsible
 * party, days allowed and whether evidence is required. Built-in steps can be
 * renamed and re-timed; extra steps can be added between them.
 */
export default function AdminTaskWorkflowPage() {
  const query = useTaskWorkflow();
  const save = useSaveTaskWorkflow();
  const [steps, setSteps] = useState<TaskWorkflowStep[]>([]);

  useEffect(() => {
    if (query.data) setSteps(query.data);
  }, [query.data]);

  const dirty = JSON.stringify(steps) !== JSON.stringify(query.data ?? []);
  const total = steps.reduce((s, x) => s + (Number(x.days) || 0), 0);

  const patch = (i: number, p: Partial<TaskWorkflowStep>) =>
    setSteps(steps.map((s, j) => (j === i ? { ...s, ...p } : s)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 1 || j >= steps.length - 1) return;
    const next = [...steps];
    [next[i], next[j]] = [next[j], next[i]];
    setSteps(next);
  };
  const addAfter = (i: number) => {
    const next = [...steps];
    next.splice(i + 1, 0, {
      key: `custom-${Date.now().toString(36)}`,
      name: "New step",
      owner: "department",
      days: 3,
      evidenceRequired: false,
      builtIn: false,
      description: "",
    });
    setSteps(next);
  };

  if (query.isPending)
    return (
      <div className="space-y-6">
        <AdminSubNav />
        <LoadingState message="Loading the task workflow…" />
      </div>
    );

  return (
    <div className="space-y-6">
      <AdminSubNav />
      <PageHero
        title="Task workflow setup"
        subtitle="The steps every assigned task goes through, from Compliance's assignment to the issued internal regulation. Set each step like a rule."
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={!dirty}
            onClick={() => setSteps(query.data ?? [])}
          >
            <RotateCcw className="size-4" /> Discard
          </Button>
          <Button
            disabled={!dirty || save.isPending}
            onClick={() =>
              save.mutate(steps, {
                onSuccess: () =>
                  toast.success("Workflow saved — applies to every task"),
              })
            }
          >
            <Save className="size-4" /> Save workflow
          </Button>
        </div>
      </PageHero>

      <Callout tone="info" title="How it works">
        A task moves to the next step only when the responsible party finishes
        the current one. Built-in steps (lock icon) can be renamed and re-timed
        but not removed. Extra steps — for example “Collect opinions from
        supporting units” — can be added between them and appear on every task
        straight away.
      </Callout>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="size-4" /> Steps
          </CardTitle>
          <CardDescription>
            {steps.length} steps · {total} working days in total
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {steps.map((s, i) => (
            <div key={s.key}>
              <div
                className={cn(
                  "grid items-center gap-3 rounded-xl border p-3 md:grid-cols-[2rem_1fr_11rem_6rem_9rem_auto]",
                  s.builtIn
                    ? "border-border"
                    : "border-violet-500/40 bg-violet-500/[0.04]",
                )}
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-bold">
                  {i + 1}
                </span>
                <div className="space-y-1">
                  <Input
                    value={s.name}
                    onChange={(e) => patch(i, { name: e.target.value })}
                    className="h-9 font-medium"
                  />
                  <Input
                    value={s.description ?? ""}
                    onChange={(e) => patch(i, { description: e.target.value })}
                    placeholder="Description shown on the task"
                    className="h-8 text-xs"
                  />
                </div>
                <label className="space-y-1 text-xs">
                  <span className="text-muted-foreground">Responsible</span>
                  <select
                    value={s.owner}
                    disabled={s.key === "assign" || s.key === "approve"}
                    onChange={(e) =>
                      patch(i, { owner: e.target.value as TaskStepOwner })
                    }
                    className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm disabled:opacity-60 dark:bg-input/30"
                  >
                    {(Object.keys(STEP_OWNER_LABELS) as TaskStepOwner[]).map(
                      (o) => (
                        <option key={o} value={o}>
                          {STEP_OWNER_LABELS[o]}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label className="space-y-1 text-xs">
                  <span className="text-muted-foreground">Days</span>
                  <Input
                    type="number"
                    min={0}
                    value={s.days}
                    onChange={(e) => patch(i, { days: Number(e.target.value) })}
                    className="h-9"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={s.evidenceRequired}
                    onChange={(e) =>
                      patch(i, { evidenceRequired: e.target.checked })
                    }
                    className="accent-primary"
                  />
                  Evidence required
                </label>
                <div className="flex items-center gap-1">
                  {s.builtIn ? (
                    <ToneBadge tone="neutral" icon={Lock}>
                      Built-in
                    </ToneBadge>
                  ) : (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Move up"
                        onClick={() => move(i, -1)}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Move down"
                        onClick={() => move(i, 1)}
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Remove step"
                        onClick={() =>
                          setSteps(steps.filter((_, j) => j !== i))
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="flex justify-center py-1">
                  <button
                    type="button"
                    onClick={() => addAfter(i)}
                    className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Plus className="size-3" /> Add a step here
                  </button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
