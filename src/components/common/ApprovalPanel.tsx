import { useState } from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type ApproverStatus = "pending" | "approved" | "rejected";

export interface ApprovalApprover {
  user: {
    id: string;
    name: string;
  };
  status: ApproverStatus;
  date?: string;
  comment?: string;
}

export interface ApprovalPanelProps {
  approvers: ApprovalApprover[];
  currentUserId?: string;
  canApprove?: boolean;
  onApprove?: (comment: string) => void;
  onReject?: (comment: string) => void;
  className?: string;
}

const statusConfig: Record<
  ApproverStatus,
  { label: string; icon: typeof CheckCircle2; color: string; bg: string }
> = {
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
  },
};

export function ApprovalPanel({
  approvers,
  currentUserId,
  canApprove = false,
  onApprove,
  onReject,
  className,
}: ApprovalPanelProps) {
  const [comment, setComment] = useState("");
  const currentApprover = approvers.find(
    (a) => a.user.id === currentUserId && a.status === "pending",
  );

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle>Approval Workflow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative space-y-4 pl-4">
          <div className="absolute top-2 bottom-2 left-[1.125rem] w-px bg-border" />
          {approvers.map((approver, index) => {
            const config = statusConfig[approver.status];
            const Icon = config.icon;
            const isCurrent = approver.user.id === currentUserId;

            return (
              <motion.div
                key={approver.user.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative flex items-start gap-3"
              >
                <div
                  className={cn(
                    "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-background",
                    config.bg,
                    config.color,
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarFallback className="text-xs">
                          {approver.user.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">
                        {approver.user.name}
                        {isCurrent && (
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                            (You)
                          </span>
                        )}
                      </span>
                    </div>
                    <span className={cn("text-xs font-medium", config.color)}>
                      {config.label}
                    </span>
                  </div>
                  {approver.comment && (
                    <p className="text-sm text-muted-foreground">
                      {approver.comment}
                    </p>
                  )}
                  {approver.date && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(approver.date), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {currentApprover && canApprove && (
          <div className="space-y-3 pt-2">
            <Textarea
              placeholder="Add an approval comment (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[5rem] resize-none"
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject?.(comment)}
              >
                <XCircle className="size-4" aria-hidden="true" />
                Reject
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => onApprove?.(comment)}
              >
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Approve
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
