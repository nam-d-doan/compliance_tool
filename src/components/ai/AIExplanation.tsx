import { ExternalLink, FileText, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import { cn } from "@/lib/utils";
import type { AIExplanation as AIExplanationType } from "@/types";

export interface AIExplanationProps {
  explanation: AIExplanationType;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function AIExplanation({
  explanation,
  children,
  open,
  onOpenChange,
  className,
}: AIExplanationProps) {
  const hasReferences = explanation.references.length > 0;
  const hasRelated = explanation.relatedDocuments.length > 0;
  const hasReasoning = explanation.reasoning.length > 0;

  const content = (
    <ScrollArea className="h-full">
      <div className={cn("space-y-6 px-6 pb-10 pt-2", className)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-medium text-foreground">
              {explanation.recommendation}
            </h3>
            <p className="text-xs text-muted-foreground">
              {new Date(explanation.timestamp).toLocaleString()}
            </p>
          </div>
          <ConfidenceIndicator confidence={explanation.confidence} size="md" />
        </div>

        {hasReasoning && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Reasoning</h4>
            <ol className="space-y-3">
              {explanation.reasoning.map((step, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-3 text-sm text-muted-foreground"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </motion.li>
              ))}
            </ol>
          </div>
        )}

        {hasReferences && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              References
            </h4>
            <ul className="space-y-2">
              {explanation.references.map((ref, index) => (
                <li key={index}>
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 rounded-md border border-border bg-card p-2 text-sm text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5"
                  >
                    <FileText
                      className="size-4 text-muted-foreground group-hover:text-primary"
                      aria-hidden="true"
                    />
                    <span className="flex-1 truncate">{ref.title}</span>
                    <ExternalLink
                      className="size-3.5 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasRelated && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              Related documents
            </h4>
            <div className="flex flex-wrap gap-2">
              {explanation.relatedDocuments.map((doc, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                >
                  <FileText className="size-3" aria-hidden="true" />
                  {doc}
                </span>
              ))}
            </div>
          </div>
        )}

        {typeof explanation.historicalSimilarity === "number" && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <span className="font-medium text-foreground">
              Historical similarity:{" "}
            </span>
            <span className="text-muted-foreground">
              {Math.round(explanation.historicalSimilarity * 100)}% match with
              similar past cases.
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
          <Sparkles className="size-3.5" aria-hidden="true" />
          <span>Powered by {explanation.modelVersion} · Explainable AI</span>
        </div>
      </div>
    </ScrollArea>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}
      <SheetContent
        side="right"
        className="w-full border-primary/10 bg-gradient-to-br from-primary/5 via-card to-card sm:max-w-md dark:border-primary/20 dark:from-primary/10"
      >
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            AI Explanation
          </SheetTitle>
          <SheetDescription>
            Understand how the AI reached this conclusion.
          </SheetDescription>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}
