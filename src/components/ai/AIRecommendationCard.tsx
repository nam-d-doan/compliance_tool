import { useState } from "react";
import { Check, Lightbulb, Sparkles, X } from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIExplanation } from "./AIExplanation";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import type { AIRecommendation } from "@/types";
import type { PriorityLevel } from "@/constants/status";

export interface AIRecommendationCardProps {
  recommendation: AIRecommendation;
  priority?: PriorityLevel;
  className?: string;
}

export function AIRecommendationCard({
  recommendation,
  priority,
  className,
}: AIRecommendationCardProps) {
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState<"accepted" | "dismissed" | null>(
    null,
  );

  const actions = recommendation.explanation.reasoning.slice(0, 4);

  return (
    <>
      <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
        <Card
          className={
            "overflow-hidden border-primary/10 bg-gradient-to-br from-primary/[0.03] to-card dark:border-primary/20"
          }
        >
          <div className={className}>
            <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="size-4" aria-hidden="true" />
                </div>
                <CardTitle className="text-sm font-medium">
                  {recommendation.type}
                </CardTitle>
              </div>
              {priority && <PriorityBadge priority={priority} size="sm" />}
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground">
                {recommendation.recommendation}
              </p>

              {actions.length > 0 && (
                <ul className="space-y-1.5">
                  {actions.map((action, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <span
                        className="mt-0.5 size-1.5 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                      {action}
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-center justify-between">
                <ConfidenceIndicator
                  confidence={recommendation.confidence}
                  size="sm"
                />
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setOpen(true)}
                  className="gap-1 text-primary"
                >
                  <Lightbulb className="size-3.5" aria-hidden="true" />
                  View reasoning
                </Button>
              </div>

              {decision === null ? (
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setDecision("dismissed")}
                  >
                    <X className="size-3.5" aria-hidden="true" />
                    Dismiss
                  </Button>
                  <Button
                    variant="default"
                    size="xs"
                    onClick={() => setDecision("accepted")}
                  >
                    <Check className="size-3.5" aria-hidden="true" />
                    Accept
                  </Button>
                </div>
              ) : (
                <div
                  className={
                    "flex items-center justify-end gap-1.5 text-xs font-medium"
                  }
                >
                  {decision === "accepted" ? (
                    <>
                      <Check
                        className="size-3.5 text-emerald-500"
                        aria-hidden="true"
                      />
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Accepted
                      </span>
                    </>
                  ) : (
                    <>
                      <X className="size-3.5 text-red-500" aria-hidden="true" />
                      <span className="text-red-600 dark:text-red-400">
                        Dismissed
                      </span>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      </motion.div>

      <AIExplanation
        explanation={recommendation.explanation}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
