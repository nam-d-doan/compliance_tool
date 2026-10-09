import { useMemo } from "react";
import { motion } from "motion/react";
import { PageHero, ErrorState } from "@/components/common";
import { CardSkeleton, ListSkeleton } from "@/components/common/Skeletons";
import {
  ComplianceChainSummary,
  CHAIN_ICONS,
  CHAIN_COLORS,
  DeadlineCalendar,
  AISummaryLine,
  MyObligationsWidget,
  MyCAPsWidget,
  type ChainStage,
} from "@/components/dashboard";
import { useAuthStore } from "@/stores";
import {
  useObligationList,
  useCAPList,
  useAssignmentList,
  useRegulationList,
} from "@/hooks/queries";
import {
  buildCapObligationMap,
  getOrphanedAttentionObligations,
  getSummaryStats,
} from "@/lib/obligation-helpers";
import { getGreeting } from "@/lib/greeting";
import { useL } from "@/lib/i18n";
import { useLanguageStore } from "@/stores";

/** Assignment statuses that represent live work for a department. */
const ACTIVE_ASSIGNMENT_STATUSES = ["published", "acknowledged", "in_progress"];

function useOwnerData() {
  const { user } = useAuthStore();
  const ownerId = user?.id ?? "";

  // Obligations owned by this user — drives the department derivation and the
  // obligation overview. CAPs are loaded broadly (not owner-scoped) so the
  // effective-status derivation can see every plan linked to these obligations,
  // even one owned by someone else.
  const obligations = useObligationList(
    ownerId ? { owner: ownerId } : {},
    1,
    500,
  );
  const caps = useCAPList({}, 1, 500);
  const regulations = useRegulationList({}, 1, 500);

  // Department is not yet on AuthUser (separate admin work). Derive it from the
  // owner's obligations' denormalized department field — stable because every
  // user belongs to exactly one HO department.
  const deptId = useMemo(
    () =>
      obligations.data?.items.find((o) => o.ownerDepartmentId)
        ?.ownerDepartmentId,
    [obligations.data],
  );
  const assignments = useAssignmentList(
    deptId ? { department: deptId } : {},
    1,
    500,
  );

  const isLoading =
    obligations.isPending ||
    caps.isPending ||
    regulations.isPending ||
    (Boolean(deptId) && assignments.isPending);
  const error =
    obligations.error ?? caps.error ?? assignments.error ?? regulations.error;

  return {
    user,
    ownerId,
    obligations,
    caps,
    assignments,
    regulations,
    isLoading,
    error,
  };
}

export default function OwnerDashboardPage() {
  const {
    user,
    ownerId,
    obligations,
    caps,
    assignments,
    regulations,
    isLoading,
    error,
  } = useOwnerData();
  const L = useL();
  const lang = useLanguageStore((s) => s.lang);

  const obligationItems = useMemo(
    () => obligations.data?.items ?? [],
    [obligations.data],
  );
  const capItems = useMemo(() => caps.data?.items ?? [], [caps.data]);
  const assignmentItems = useMemo(
    () => assignments.data?.items ?? [],
    [assignments.data],
  );
  const regulationItems = useMemo(
    () => regulations.data?.items ?? [],
    [regulations.data],
  );

  // Owner-scoped action plans for the "My CAPs" view + KPIs.
  const myCaps = useMemo(
    () => capItems.filter((c) => c.ownerId === ownerId),
    [capItems, ownerId],
  );
  // Reverse map (obligationId -> all linked CAPs) for effective-status logic.
  const capMap = useMemo(() => buildCapObligationMap(capItems), [capItems]);
  // Orphaned obligations needing attention (no CAP yet).
  const orphaned = useMemo(
    () => getOrphanedAttentionObligations(obligationItems, capMap),
    [obligationItems, capMap],
  );
  const obligationStats = useMemo(
    () => getSummaryStats(obligationItems, capItems),
    [obligationItems, capItems],
  );
  const deptName = obligationItems.find(
    (o) => o.ownerDepartmentName,
  )?.ownerDepartmentName;

  const relevantRegulationIds = useMemo(
    () => new Set(assignmentItems.map((a) => a.regulationId)),
    [assignmentItems],
  );
  const relevantRegulations = useMemo(
    () => regulationItems.filter((r) => relevantRegulationIds.has(r.id)),
    [regulationItems, relevantRegulationIds],
  );

  const activeAssignments = assignmentItems.filter((a) =>
    ACTIVE_ASSIGNMENT_STATUSES.includes(a.status),
  );
  const notStartedAssignments = assignmentItems.filter(
    (a) => a.status === "draft",
  );
  const completedAssignments = assignmentItems.filter(
    (a) => a.status === "completed",
  );
  const capOpen = myCaps.filter((c) => c.status === "Open").length;
  const capPendingApproval = myCaps.filter(
    (c) => c.status === "Pending Approval",
  ).length;
  const capClosed = myCaps.filter((c) => c.status === "Closed").length;

  const chainStages: ChainStage[] = [
    {
      key: "regulation",
      label: L("Regulations", "Văn bản"),
      icon: CHAIN_ICONS.regulation,
      color: CHAIN_COLORS.regulation,
      value: relevantRegulations.length,
      path: "/regulation",
      breakdown: [
        {
          label: L("Effective", "Có hiệu lực"),
          value: relevantRegulations.filter((r) => r.status === "Effective")
            .length,
          color: "var(--success)",
        },
        {
          label: L("Superseded", "Bị thay thế"),
          value: relevantRegulations.filter((r) => r.status === "Superseded")
            .length,
          color: "var(--warning)",
        },
        {
          label: L("Expired", "Hết hiệu lực"),
          value: relevantRegulations.filter((r) => r.status === "Expired")
            .length,
          color: "var(--neutral)",
        },
      ],
    },
    {
      key: "assignment",
      label: L("Assignments", "Phân giao"),
      icon: CHAIN_ICONS.assignment,
      color: CHAIN_COLORS.assignment,
      value: assignmentItems.length,
      path: "/assignment",
      breakdown: [
        {
          label: L("active", "đang xử lý"),
          value: activeAssignments.length,
          color: "var(--info)",
        },
        {
          label: L("not started", "chưa bắt đầu"),
          value: notStartedAssignments.length,
          color: "var(--neutral)",
        },
        {
          label: L("completed", "hoàn thành"),
          value: completedAssignments.length,
          color: "var(--success)",
        },
      ],
    },
    {
      key: "obligation",
      label: L("Obligations", "Nghĩa vụ"),
      icon: CHAIN_ICONS.obligation,
      color: CHAIN_COLORS.obligation,
      value: obligationStats.total,
      path: "/obligations",
      breakdown: [
        {
          label: L("need attention", "cần xử lý"),
          value: obligationStats.needAttention,
          color: "var(--danger)",
        },
        {
          label: L("in progress", "đang thực hiện"),
          value: obligationStats.inProgress,
          color: "var(--warning)",
        },
        {
          label: L("upcoming", "sắp tới"),
          value: obligationStats.upcoming,
          color: "var(--info)",
        },
        {
          label: L("completed", "hoàn thành"),
          value: obligationStats.completed,
          color: "var(--success)",
        },
      ],
    },
    {
      key: "cap",
      label: L("Corrective Actions", "Hành động khắc phục"),
      icon: CHAIN_ICONS.cap,
      color: CHAIN_COLORS.cap,
      value: myCaps.length,
      path: "/cap",
      breakdown: [
        { label: L("open", "đang mở"), value: capOpen, color: "var(--info)" },
        {
          label: L("pending approval", "chờ phê duyệt"),
          value: capPendingApproval,
          color: "var(--warning)",
        },
        { label: L("closed", "đã đóng"), value: capClosed, color: "var(--success)" },
      ],
    },
  ];

  const aiSummary = lang === "vi"
    ? orphaned.length > 0
      ? `${orphaned.length} nghĩa vụ chưa có kế hoạch khắc phục. ${capOpen > 0 ? `Bạn đang có ${capOpen} kế hoạch triển khai — ưu tiên các rủi ro cao nhất tiếp theo.` : "Bắt đầu từ các rủi ro cao nhất."}`
      : capOpen > 0
        ? `${capOpen} kế hoạch khắc phục đang thực hiện. Tiếp tục đẩy để đóng.`
        : activeAssignments.length > 0
          ? `${activeAssignments.length} phân giao gửi tới ${deptName ?? "phòng của bạn"} đang chờ rà soát trước khi chuyển thành nghĩa vụ.`
          : "Bạn đã xử lý hết — hiện không có việc gì cần chú ý."
    : orphaned.length > 0
      ? `${orphaned.length} obligation${orphaned.length === 1 ? "" : "s"} still ${orphaned.length === 1 ? "needs" : "need"} a corrective action plan. ${capOpen > 0 ? `You already have ${capOpen} plan${capOpen === 1 ? "" : "s"} in motion — prioritize the highest-risk gaps next.` : "Start with the highest-risk gaps first."}`
      : capOpen > 0
        ? `${capOpen} action plan${capOpen === 1 ? "" : "s"} in progress across your obligations. Keep them moving toward close.`
        : activeAssignments.length > 0
          ? `${activeAssignments.length} assignment${activeAssignments.length === 1 ? "" : "s"} routed to ${deptName ?? "your department"} is awaiting review before it can move to obligations.`
          : "You're all caught up — nothing needs your attention right now.";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-16 w-2/3 animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <ListSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHero
          title={getGreeting(user?.name ?? "there", lang)}
          subtitle={L("Compliance workspace", "Không gian tuân thủ")}
        />
        <ErrorState
          title={L("Could not load your dashboard", "Không tải được trang tổng quan")}
          message={error.message}
          onRetry={() => {
            obligations.refetch();
            caps.refetch();
            assignments.refetch();
            regulations.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <h1 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
          {getGreeting(user?.name ?? "there", lang)}
        </h1>
        <AISummaryLine text={aiSummary} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main: the compliance lifecycle as one visual story, each stage
            expanded with its own status breakdown — not a grid of
            disconnected KPI tiles. */}
        <div className="lg:col-span-2">
          <ComplianceChainSummary stages={chainStages} />
        </div>

        {/* Side rail: what's due, and when. Direct grid item so the
            default align-items: stretch gives it the row height (= left
            panel), then the Card's h-full fills it. */}
        <DeadlineCalendar obligations={obligationItems} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <MyObligationsWidget obligations={obligationItems} caps={capItems} />
        <MyCAPsWidget caps={myCaps} />
      </div>
    </motion.div>
  );
}
