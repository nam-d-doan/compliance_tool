import { useMemo } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Gavel, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, PriorityBadge } from "@/components/common";
import type { Regulation } from "@/types";

const UPCOMING_WINDOW_DAYS = 90;

interface DashboardUpcomingRegulationsProps {
  regulations: Regulation[];
  now: Date;
  maxItems?: number;
  delay?: number;
}

export function DashboardUpcomingRegulations({
  regulations,
  now,
  maxItems = 6,
  delay = 0,
}: DashboardUpcomingRegulationsProps) {
  const items = useMemo(() => {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() + UPCOMING_WINDOW_DAYS);
    return regulations
      .filter((r) => {
        const effective = new Date(r.effectiveDate);
        return (
          r.status === "Effective" && effective >= now && effective <= cutoff
        );
      })
      .sort(
        (a, b) =>
          new Date(a.effectiveDate).getTime() -
          new Date(b.effectiveDate).getTime(),
      )
      .slice(0, maxItems);
  }, [regulations, now, maxItems]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="h-full"
    >
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Gavel className="size-5 text-amber-500" aria-hidden="true" />
            <CardTitle>Upcoming Regulatory Impact</CardTitle>
          </div>
          <Badge variant="secondary" className="h-5">
            {items.length}
          </Badge>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <EmptyState
              title="No regulatory changes in the next 90 days"
              description="Newly effective regulations will appear here as they approach."
              className="border-0 bg-transparent"
            />
          ) : (
            <ul className="space-y-2">
              {items.map((reg) => (
                <li
                  key={reg.id}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {reg.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <PriorityBadge priority={reg.priority} size="sm" />
                      <span className="text-xs text-muted-foreground">
                        Effective{" "}
                        {format(new Date(reg.effectiveDate), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    asChild
                    className="shrink-0 opacity-0 group-hover:opacity-100"
                  >
                    <Link to={`/regulation/${reg.id}/impact`}>
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
