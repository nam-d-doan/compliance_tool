import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowRight,
  BookMarked,
  ChevronDown,
  Network,
  Newspaper,
  ShieldAlert,
  ShieldHalf,
  Sparkles,
  Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCmsOverview } from "@/hooks/queries";
import { isRouteAllowed } from "@/constants/routes";
import { useAuthStore } from "@/stores";
import { useLanguageStore } from "@/i18n";
import { cn } from "@/lib/utils";

interface Feature {
  code: string;
  label: string;
  /** Page to open; `search` opens the Ctrl+K search instead. */
  to: string | "search";
  highlight?: boolean;
}

interface Group {
  number: number;
  title: string;
  titleVi: string;
  icon: LucideIcon;
  to: string;
  stat: (d: NonNullable<ReturnType<typeof useCmsOverview>["data"]>) => {
    value: number | string;
    caption: string;
  };
  features: Feature[];
}

/** The 5 feature groups of RFQ 2698/2026/TB-NHNA-P.11, Phụ lục 1. */
const GROUPS: Group[] = [
  {
    number: 1,
    title: "Legal Update Workflow",
    titleVi: "Quy trình cập nhật & rà soát văn bản QPPL",
    icon: Newspaper,
    to: "/legal-updates",
    stat: (d) => ({
      value: d.legalUpdates.awaitingReview,
      caption: "documents awaiting review",
    }),
    features: [
      {
        code: "1.1",
        label: "Intake, AI classification & alerts",
        to: "/legal-updates",
      },
      {
        code: "1.2",
        label: "Legal Mapping (Bản đồ mối quan hệ)",
        to: "/legal-mapping",
        highlight: true,
      },
      { code: "1.3", label: "Assign units & reminders", to: "/assignment" },
    ],
  },
  {
    number: 2,
    title: "Internal Regulation Tracking",
    titleVi: "Theo dõi cập nhật & ban hành văn bản nội bộ",
    icon: BookMarked,
    to: "/qdnb",
    stat: (d) => ({ value: d.revisions.overdue, caption: "QĐNB overdue" }),
    features: [
      { code: "2.1", label: "Real-time QĐNB tracker", to: "/qdnb" },
      {
        code: "2.2",
        label: "Approval flow & proof of completion",
        to: "/qdnb?view=table",
      },
      {
        code: "2.3",
        label: "Late-issuance alerts",
        to: "/reports/late-issuance",
      },
    ],
  },
  {
    number: 3,
    title: "Compliance Issues Tracker",
    titleVi: "Giám sát & khắc phục vấn đề tuân thủ",
    icon: ShieldAlert,
    to: "/ncc/list",
    stat: (d) => ({ value: d.issues.open, caption: "open issues" }),
    features: [
      { code: "3.1", label: "Central issue register", to: "/ncc/list" },
      { code: "3.2", label: "ICIS inbox", to: "/ncc/list?tab=icis" },
      {
        code: "3.2",
        label: "Violation trends & unit profile",
        to: "/ncc/list?tab=trends",
      },
      { code: "3.3", label: "Action plans (CAP) & evidence", to: "/cap" },
    ],
  },
  {
    number: 4,
    title: "Risk Rating & Escalation",
    titleVi: "Phân loại & ma trận cấp độ rủi ro",
    icon: ShieldHalf,
    to: "/ncc/escalations",
    stat: (d) => ({
      value: d.issues.escalationsAwaitingAck,
      caption: "escalations waiting",
    }),
    features: [
      { code: "4.1", label: "3-level risk matrix", to: "/admin/risk-matrix" },
      {
        code: "4.2",
        label: "Automatic risk rating on issues",
        to: "/ncc/list",
      },
      { code: "4.3", label: "Escalation to BĐH / BKS", to: "/ncc/escalations" },
    ],
  },
  {
    number: 5,
    title: "Advanced Features",
    titleVi: "Các tính năng mở rộng/nâng cao",
    icon: Sparkles,
    to: "/reports/periodic",
    stat: () => ({ value: "AI", caption: "built into every group" }),
    features: [
      { code: "5.1", label: "Smart search (Ctrl+K)", to: "search" },
      { code: "5.1", label: "Version compare", to: "/regulation/compare" },
      {
        code: "5.2",
        label: "AI / OCR document reading",
        to: "/legal-updates?ocr=1",
      },
      {
        code: "5.3",
        label: "Periodic & management reports",
        to: "/reports/periodic",
      },
      { code: "5.4", label: "Audit trail", to: "/reports/audit-trail" },
    ],
  },
];

const STORAGE_KEY = "cms-feature-map-collapsed";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function openSearch() {
  // TopNav listens for Ctrl/Cmd + K on window.
  window.dispatchEvent(
    new KeyboardEvent("keydown", { key: "k", ctrlKey: true }),
  );
}

/**
 * Dashboard map of everything the CMS covers, laid out like the RFQ's
 * Phụ lục 1 so evaluators can tick off each requirement and jump to it.
 */
export function CmsFeatureMap({ delay = 0 }: { delay?: number }) {
  const { data } = useCmsOverview();
  const role = useAuthStore((s) => s.role);
  const language = useLanguageStore((s) => s.language);
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(STORAGE_KEY, c ? "0" : "1");
      } catch {
        // Preference only — ignore storage errors.
      }
      return !c;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="size-4" /> CMS feature map
          </CardTitle>
          <CardDescription>
            Hệ thống Quản lý Tuân thủ — 05 nhóm tính năng theo Phụ lục 1. Click
            any feature to see it.
          </CardDescription>
          <CardAction>
            <Button size="sm" variant="ghost" onClick={toggle}>
              {collapsed ? "Show" : "Hide"}
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform",
                  !collapsed && "rotate-180",
                )}
              />
            </Button>
          </CardAction>
        </CardHeader>
        {!collapsed && (
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {GROUPS.map((g) => {
                const stat = data ? g.stat(data) : null;
                return (
                  <div
                    key={g.number}
                    className="flex flex-col rounded-xl border border-border bg-muted/30 p-3"
                  >
                    <div className="flex items-start gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#0c3767] text-[11px] font-black text-white">
                        {g.number}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm leading-tight font-semibold">
                          {g.title}
                        </p>
                        {/* In Vietnamese the title already is the RFQ wording. */}
                        {language === "en" && (
                          <p className="text-[11px] leading-tight text-muted-foreground">
                            {g.titleVi}
                          </p>
                        )}
                      </div>
                    </div>

                    {stat && (
                      <p className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-xl font-black tabular-nums">
                          {stat.value}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {stat.caption}
                        </span>
                      </p>
                    )}

                    <ul className="mt-2 flex-1 space-y-0.5">
                      {g.features.map((f) => {
                        const body = (
                          <>
                            <span className="w-7 shrink-0 font-mono text-[10px] text-muted-foreground">
                              {f.code}
                            </span>
                            <span className="min-w-0 flex-1">{f.label}</span>
                            {f.highlight && (
                              <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />
                            )}
                          </>
                        );
                        const cls = cn(
                          "flex w-full items-start gap-1 rounded-md px-1.5 py-1 text-left text-xs",
                          f.highlight &&
                            "bg-violet-500/10 font-semibold text-violet-700 ring-1 ring-violet-500/30 dark:text-violet-300",
                        );
                        const allowed =
                          f.to === "search" ||
                          isRouteAllowed(f.to.split("?")[0], role);
                        return (
                          <li key={f.label}>
                            {f.to === "search" ? (
                              <button
                                type="button"
                                onClick={openSearch}
                                className={cn(cls, "hover:bg-muted")}
                              >
                                {body}
                              </button>
                            ) : allowed ? (
                              <Link
                                to={f.to}
                                className={cn(cls, "hover:bg-muted")}
                              >
                                {body}
                              </Link>
                            ) : (
                              <span
                                className={cn(cls, "text-muted-foreground")}
                                title="Configured by the administrator"
                              >
                                {body}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    <Link
                      to={g.to}
                      className="mt-2 inline-flex items-center gap-1 self-start text-xs font-semibold text-primary hover:underline"
                    >
                      Show me <ArrowRight className="size-3" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}
