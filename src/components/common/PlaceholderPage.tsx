import { motion } from "motion/react";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center"
    >
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {description && (
        <p className="mt-2 max-w-md text-muted-foreground">{description}</p>
      )}
      <p className="mt-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Coming in next phase
      </p>
    </motion.div>
  );
}
