import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { TypewriterText } from "@/components/ai/TypewriterText";
import { cn } from "@/lib/utils";
import type { AIExplanation } from "@/types";
import { useL } from "@/lib/i18n";

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
  const L = useL();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="h-full"
    >
      <Card
        className={cn(
          "h-full overflow-hidden border-primary/10 bg-gradient-to-br from-primary/5 via-card to-card dark:border-primary/20 dark:from-primary/10",
          isLoading && "opacity-80",
        )}
      >
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>{L("AI Executive Summary", "Tóm tắt điều hành từ AI")}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {L("Generated from current data", "Tạo từ dữ liệu hiện tại")}
              </p>
            </div>
          </div>
          {explanation?.confidence && (
            <Badge variant="secondary">
              {Math.round(explanation.confidence * 100)}% {L("confidence", "độ tin cậy")}
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
                className="h-auto p-0 text-xs font-medium text-primary"
                onClick={() => setShowReasoning((prev) => !prev)}
              >
                {showReasoning ? (
                  <>
                    <ChevronUp className="size-3.5" aria-hidden="true" />{" "}
                    {L("Hide reasoning", "Ẩn lập luận")}
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-3.5" aria-hidden="true" />{" "}
                    {L("View reasoning", "Xem lập luận")}
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
                    <div className="space-y-3 rounded-lg border bg-background/80 p-4 text-xs">
                      {explanation.reasoning?.length > 0 && (
                        <ul className="space-y-1.5">
                          {explanation.reasoning.map((reason, index) => (
                            <li key={index} className="flex gap-2">
                              <span className="text-primary">•</span>
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
                            {L("References", "Tham chiếu")}
                          </p>
                          <ul className="space-y-1">
                            {explanation.references.map((ref, index) => (
                              <li key={index}>
                                <a
                                  href={ref.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
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
