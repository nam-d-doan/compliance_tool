import { Sparkles } from "lucide-react";

/** Compact, AI-flagged 1–2 sentence summary shown under the dashboard greeting. */
export function AISummaryLine({ text }: { text: string }) {
  return (
    <div className="flex max-w-2xl items-start gap-2">
      <Sparkles
        className="text-chart-accent mt-0.5 size-4 shrink-0"
        aria-hidden="true"
      />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
