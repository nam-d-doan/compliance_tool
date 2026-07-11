import { useState } from "react";
import { Lightbulb, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIExplanation } from "./AIExplanation";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import type { AIInsight, AIExplanation as AIExplanationType } from "@/types";

export interface AIInsightCardProps {
  insight: AIInsight;
  explanation?: AIExplanationType;
  className?: string;
}

export function AIInsightCard({
  insight,
  explanation,
  className,
}: AIInsightCardProps) {
  const [open, setOpen] = useState(false);

  const derivedExplanation: AIExplanationType = explanation ?? {
    recommendation: insight.recommendation,
    confidence: insight.confidence,
    reasoning: insight.reasoning,
    references: insight.references,
    relatedDocuments: [],
    timestamp: insight.createdAt,
    modelVersion: "compliance-ai-v1",
  };

  const typeIcon =
    insight.type === "risk" ? (
      <span className="text-danger" aria-hidden="true">
        ●
      </span>
    ) : insight.type === "opportunity" ? (
      <span className="text-success" aria-hidden="true">
        ●
      </span>
    ) : insight.type === "anomaly" ? (
      <span className="text-warning" aria-hidden="true">
        ●
      </span>
    ) : (
      <span className="text-info" aria-hidden="true">
        ●
      </span>
    );

  return (
    <>
      <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
        <Card
          className={
            "group relative overflow-hidden border-primary/10 bg-gradient-to-br from-primary/5 via-card to-card dark:border-primary/20 dark:from-primary/10"
          }
        >
          <div className={className}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="size-4" aria-hidden="true" />
                </div>
                <CardTitle className="text-sm font-medium">
                  {insight.title}
                </CardTitle>
              </div>
              {typeIcon}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {insight.description}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <ConfidenceIndicator
                  confidence={insight.confidence}
                  size="sm"
                />
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setOpen(true)}
                  className="gap-1 text-primary"
                >
                  <Lightbulb className="size-3.5" aria-hidden="true" />
                  Why?
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>

      <AIExplanation
        explanation={derivedExplanation}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
