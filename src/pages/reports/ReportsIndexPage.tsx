import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  BarChart3,
  Calendar,
  ClipboardList,
  FileCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/common";
import { subMonths, format } from "date-fns";
import { cn } from "@/lib/utils";

interface ReportTypeCard {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}

const REPORT_TYPES: ReportTypeCard[] = [
  {
    id: "status",
    title: "Status Report",
    description:
      "Compliance obligations by status, department, and business unit with trend analysis.",
    path: "/reports/status",
    icon: BarChart3,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    id: "calendar",
    title: "Calendar Report",
    description:
      "Unified view of compliance due dates, license expiries, and CAP deadlines.",
    path: "/reports/calendar",
    icon: Calendar,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-100 dark:bg-teal-900/30",
  },
  {
    id: "cap",
    title: "CAP Report",
    description:
      "Corrective action plan performance, priorities, costs, and closure trends.",
    path: "/reports/cap",
    icon: ClipboardList,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    id: "license",
    title: "License Report",
    description:
      "License status, expiry timelines, renewal rates, and criticality breakdown.",
    path: "/reports/license",
    icon: FileCheck,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
  },
  {
    id: "executive",
    title: "Executive Summary",
    description:
      "AI-generated enterprise health summary with KPIs, risks, and recommendations.",
    path: "/reports/executive",
    icon: Sparkles,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-100 dark:bg-violet-900/30",
  },
];

export default function ReportsIndexPage() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(
    format(subMonths(new Date(), 3), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const handleOpen = (path: string) => {
    navigate(`${path}?startDate=${startDate}&endDate=${endDate}`);
  };

  return (
    <div className="space-y-6">
      <PageHero
        title="Reports & Analytics"
        subtitle="Interactive reports with filtering, visual insights, and AI-generated summaries for every stakeholder."
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-blue-100">
            Quick date range
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 rounded-lg border-0 bg-white/20 px-2.5 text-xs text-white placeholder:text-blue-100 outline-none focus:bg-white/30"
            />
            <span className="text-xs text-blue-100">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 rounded-lg border-0 bg-white/20 px-2.5 text-xs text-white placeholder:text-blue-100 outline-none focus:bg-white/30"
            />
          </div>
        </div>
      </PageHero>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_TYPES.map((report, index) => {
          const Icon = report.icon;
          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ y: -2 }}
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col gap-4 p-5">
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        "flex size-11 items-center justify-center rounded-xl",
                        report.bg,
                        report.color,
                      )}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={() => handleOpen(report.path)}
                    >
                      Open
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <h3 className="text-base font-semibold text-foreground">
                      {report.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {report.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
