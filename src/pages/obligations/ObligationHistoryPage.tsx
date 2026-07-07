import { motion } from "motion/react";
import { PageHero } from "@/components/common";

export default function ObligationHistoryPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHero
        title="Obligation History"
        subtitle="Submission history will be rebuilt in a later phase."
        className="py-5"
      />
    </motion.div>
  );
}
