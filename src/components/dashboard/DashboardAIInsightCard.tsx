import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { TypewriterText } from "@/components/ai/TypewriterText";
import { cn } from "@/lib/utils";
import type { AIExplanation } from "@/types";

interface DashboardAIInsightCardProps {
  summary: string;
  explanation?: AIExplanation;
  isLoading?: boolean;
  delay?: number;
}

export function DashboardAIInsightCard({
  summary,
  explanation,
  isLoading,
  delay = 0,
}: DashboardAIInsightCardProps) {
  const [showReasoning, setShowReasoning] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="h-full"
    >
      <Card
        className={cn(
          "h-full border-violet-200 bg-gradient-to-br from-violet-50/50 to-background dark:border-violet-900/30 dark:from-violet-950/20",
          isLoading && "opacity-80",
        )}
      >
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
              <Sparkles className="size-4" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>AI Executive Summary</CardTitle>
              <p className="text-xs text-muted-foreground">
                Generated from current data
              </p>
            </div>
          </div>
          {explanation?.confidence && (
            <Badge variant="secondary">
              {Math.round(explanation.confidence * 100)}% confidence
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            <TypewriterText text={summary} />
          </p>

          {explanation && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs font-medium text-violet-700 dark:text-violet-400"
                onClick={() => setShowReasoning((prev) => !prev)}
              >
                {showReasoning ? (
                  <>
                    <ChevronUp className="size-3.5" aria-hidden="true" /> Hide
                    reasoning
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-3.5" aria-hidden="true" /> View
                    reasoning
                  </>
                )}
              </Button>

              <AnimatePresence initial={false}>
                {showReasoning && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 rounded-lg border bg-background/80 p-3 text-xs">
                      {explanation.reasoning?.length > 0 && (
                        <ul className="space-y-1.5">
                          {explanation.reasoning.map((reason, index) => (
                            <li key={index} className="flex gap-2">
                              <span className="text-violet-600 dark:text-violet-400">
                                •
                              </span>
                              <span className="text-muted-foreground">
                                {reason}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {explanation.references?.length > 0 && (
                        <div className="space-y-1.5 border-t pt-2">
                          <p className="flex items-center gap-1 font-medium text-foreground">
                            <BookOpen className="size-3" aria-hidden="true" />{" "}
                            References
                          </p>
                          <ul className="space-y-1">
                            {explanation.references.map((ref, index) => (
                              <li key={index}>
                                <a
                                  href={ref.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-violet-700 hover:underline dark:text-violet-400"
                                >
                                  {ref.title}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <p className="text-[10px] text-muted-foreground">
                        Model: {explanation.modelVersion}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
