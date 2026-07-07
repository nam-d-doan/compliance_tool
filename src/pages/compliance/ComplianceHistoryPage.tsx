import { motion } from "motion/react";
import { PageHero } from "@/components/common";

export default function ComplianceHistoryPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHero
        title="Compliance History"
        subtitle="Submission history has been replaced by obligations. Phase 3B will rebuild this view."
        className="py-5"
      />
    </motion.div>
  );
}
