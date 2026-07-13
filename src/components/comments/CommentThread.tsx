import { motion } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListSkeleton } from "@/components/common/Skeletons";
import { EmptyState } from "@/components/common/EmptyState";
import { useAdminUsers } from "@/hooks/queries";
import { CommentForm } from "./CommentForm";
import { cn } from "@/lib/utils";

export interface CommentItem {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}

export interface CommentThreadProps {
  comments: CommentItem[];
  loading?: boolean;
  onAdd: (text: string) => void;
  currentUserId?: string;
  title?: string;
  emptyMessage?: string;
  className?: string;
}

export function CommentThread({
  comments,
  loading,
  onAdd,
  currentUserId,
  title = "Comments",
  emptyMessage = "Be the first to comment.",
  className,
}: CommentThreadProps) {
  // Resolve author roles so executive comments can be visually emphasized
  // (exec views + comments only, never approves — its feedback carries weight).
  const { data: usersData } = useAdminUsers(1, 500, { status: "Active" });
  const executiveUserIds = new Set(
    (usersData?.items ?? [])
      .filter((u) => u.role === "executive")
      .map((u) => u.id),
  );

  if (loading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ListSkeleton items={3} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {comments.length === 0 ? (
          <EmptyState
            title="No comments yet"
            description={emptyMessage}
            className="min-h-[8rem]"
          />
        ) : (
          <div className="space-y-4">
            {comments.map((comment, index) => {
              const isCurrentUser = comment.userId === currentUserId;
              const isExecutive = executiveUserIds.has(comment.userId);
              return (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "flex gap-3",
                    isExecutive &&
                      "rounded-lg border border-chart-accent/40 bg-chart-accent/[0.06] p-2 pr-3",
                  )}
                >
                  <Avatar size="sm">
                    <AvatarFallback
                      className={cn(
                        "text-xs",
                        isExecutive && "bg-chart-accent text-black",
                      )}
                    >
                      {comment.userName
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        {comment.userName}
                        {isExecutive && (
                          <Badge
                            variant="outline"
                            className="border-chart-accent/60 text-chart-accent text-[9px] px-1 py-0"
                          >
                            Executive
                          </Badge>
                        )}
                        {isCurrentUser && (
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                            (You)
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {comment.content}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        <CommentForm onSubmit={onAdd} placeholder="Add a comment..." />
      </CardContent>
    </Card>
  );
}
