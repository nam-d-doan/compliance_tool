import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DueDateCell } from "@/components/common";
import { EmptyState } from "@/components/common/EmptyState";
import type { Obligation } from "@/types";

interface UpcomingCardProps {
  obligations: Obligation[];
  /** Max rows shown before truncating with a "view all" link. */
  limit?: number;
}

/** Sidebar card: nearest-due obligations, newest-due first. */
export function UpcomingCard({ obligations, limit = 5 }: UpcomingCardProps) {
  const navigate = useNavigate();
  const visible = obligations.slice(0, limit);
  const overflow = obligations.length - visible.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <CalendarClock className="size-4" aria-hidden="true" />
          Upcoming
        </CardTitle>
      </CardHeader>
      <CardContent>
        {visible.length === 0 ? (
          <EmptyState
            title="Nothing due soon"
            description="Obligations due in the next two weeks show up here."
            className="border-0 bg-transparent py-6"
          />
        ) : (
          <ul className="space-y-1">
            {visible.map((obg, idx) => (
              <motion.li
                key={obg.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.05, 0.3) }}
              >
                <button
                  type="button"
                  onClick={() => navigate(`/obligations/${obg.id}`)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {obg.title}
                    </p>
                    <Badge
                      variant="outline"
                      className="mt-1 border-border bg-muted/50 font-mono text-[10px] font-medium text-muted-foreground"
                    >
                      {obg.articleRef}
                    </Badge>
                  </div>
                  <DueDateCell dueDate={obg.dueDate} className="shrink-0" />
                </button>
              </motion.li>
            ))}
          </ul>
        )}

        {overflow > 0 && (
          <Button
            variant="ghost"
            size="xs"
            className="mt-1 w-full justify-center text-muted-foreground"
            onClick={() => navigate("/obligations")}
          >
            {overflow} more due soon
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
