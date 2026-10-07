# LM R1 — Dashboard role split + reorder + KPI a

> Implementation tasks for `docs/lm/02-review-changes.md` §3 (R1). No test framework in this repo — each task's "verify" step is `pnpm build` (type-check) + a manual check in the browser (login as `owner@demo.com` and `executive@demo.com`, `demo1234`).

## Task 1: Add `onTimeCompletionRate` to the dashboard summary type

**File:** `src/types/lm.ts` (inside `LMDashboardSummary`, after `documentCompletionRate`)

```ts
  /** % completed milestones where actualDate <= currentPlannedDate — KPI a
   * (Appendix 2 §3.2.a, "on-time completion rate"). Was missing entirely;
   * added per Nam's review (docs/lm/02-review-changes.md §0). */
  onTimeCompletionRate: number;
```

- [ ] Add the field.
- [ ] Verify: `pnpm build` — will fail until Task 2 also populates it in the handler (expected, both land together).

## Task 2: Compute KPI a + accept `ownerId` scoping in the handler

**File:** `src/mocks/handlers/lm_handlers.ts`

Current signature (line 676):
```ts
export async function handleGetLMDashboard() {
```

Change to accept the request (same shape `handleGetLMCaseList` already uses at line 156):
```ts
export async function handleGetLMDashboard({ request }: { request: Request }) {
  await getDelay();
  const url = new URL(request.url);
  const ownerId = url.searchParams.get("ownerId") ?? undefined;
  const db = getDb();
  evaluateDeadlines(db);

  const scopedCases = ownerId
    ? db.litigationCases.filter((c) => c.ownerId === ownerId)
    : db.litigationCases;
  const scopedCaseIds = new Set(scopedCases.map((c) => c.id));
```

Then replace every `db.litigationCases` reference in the rest of the function body with `scopedCases`, and every place that reads `db.caseMilestones` / `db.legalDeadlines` / `db.caseEvents` by `caseId`, filter through `scopedCaseIds.has(...caseId)` first. Concretely:

```ts
  const openCases = scopedCases.filter((c) => c.status === "Open");
  const closedCases = scopedCases.filter((c) => c.status === "Closed");
  const scopedDeadlines = db.legalDeadlines.filter((d) => scopedCaseIds.has(d.caseId));
  const redFlagCaseIds = new Set(
    scopedDeadlines.filter((d) => d.status === "flagged").map((d) => d.caseId),
  );

  const scopedMilestones = db.caseMilestones.filter((m) => scopedCaseIds.has(m.caseId));
  const completedMilestones = scopedMilestones.filter((m) => m.actualDate);
  const completedWithEvent = completedMilestones.filter((m) => {
    const label = STAGE_STYLES[m.stage].label;
    return db.caseEvents.some(
      (e) =>
        e.caseId === m.caseId &&
        e.type === "milestone_completed" &&
        e.description === `Completed milestone "${label}"`,
    );
  });
  const milestoneUpdateRate =
    completedMilestones.length > 0
      ? Math.round((completedWithEvent.length / completedMilestones.length) * 100)
      : 0;

  // KPI a — new.
  const onTimeCompleted = completedMilestones.filter(
    (m) => m.actualDate! <= m.currentPlannedDate,
  );
  const onTimeCompletionRate =
    completedMilestones.length > 0
      ? Math.round((onTimeCompleted.length / completedMilestones.length) * 100)
      : 0;

  const everFlagged = scopedDeadlines.filter((d) => d.status !== "pending");
  const resolved = scopedDeadlines.filter((d) => d.status === "resolved");
  const alertResolutionRate =
    everFlagged.length > 0
      ? Math.round((resolved.length / everFlagged.length) * 100)
      : 0;

  const sufficientDocCases = scopedCases.filter(
    (c) => c.fileIds.length >= REQUIRED_DOCS_BY_STAGE[c.stage].length,
  );
  const documentCompletionRate =
    scopedCases.length > 0
      ? Math.round((sufficientDocCases.length / scopedCases.length) * 100)
      : 0;

  const stageDistribution = CASE_STAGES.map((stage) => ({
    stage,
    count: scopedCases.filter((c) => c.stage === stage).length,
  }));
  const categoryDistribution = CASE_CATEGORIES.map((category) => ({
    category,
    count: scopedCases.filter((c) => c.category === category).length,
  }));

  const unitCounts = new Map<string, number>();
  scopedCases.forEach((c) => {
    unitCounts.set(c.ownerUnitName, (unitCounts.get(c.ownerUnitName) ?? 0) + 1);
  });
  const unitDistribution = Array.from(unitCounts.entries())
    .map(([unitName, count]) => ({ unitName, count }))
    .sort((a, b) => b.count - a.count);

  const topRedFlagCases = scopedCases
    .filter((c) => redFlagCaseIds.has(c.id))
    .map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      ownerName: c.ownerName,
      redFlagCount: countRedFlags(db, c.id),
    }))
    .sort((a, b) => b.redFlagCount - a.redFlagCount)
    .slice(0, 5);

  const summary: LMDashboardSummary = {
    totalOpen: openCases.length,
    totalClosed: closedCases.length,
    totalRedFlagCases: redFlagCaseIds.size,
    milestoneUpdateRate,
    onTimeCompletionRate,
    alertResolutionRate,
    documentCompletionRate,
    stageDistribution,
    categoryDistribution,
    unitDistribution,
    ownerWorkload: ownerId ? [] : computeOwnerWorkload(db),
    topRedFlagCases,
  };
```

Note: `ownerWorkload` is a bank-wide "who has how much work" breakdown — not meaningful when scoped to a single specialist, so it returns `[]` in the scoped (`ownerId` present) case. The page (Task 5) won't render that chart in specialist view.

- [ ] Apply the changes above.
- [ ] No change needed to `src/mocks/handlers/index.ts` or `src/mocks/directApi.ts` — both already call this handler as `handler({ request, params })` (MSW `http.get` and the dev dispatcher both pass `request`), so the new signature works in both run modes without touching the registration lines.
- [ ] Verify: `pnpm build` passes.

## Task 3: Pass `ownerId` through the service layer

**File:** `src/services/lm_service.ts`

Current (line 73):
```ts
  dashboard() {
    return apiGet<LMDashboardSummary>(API_ENDPOINTS.LM_DASHBOARD);
  },
```

Change to:
```ts
  dashboard(ownerId?: string) {
    const query = ownerId ? `?ownerId=${encodeURIComponent(ownerId)}` : "";
    return apiGet<LMDashboardSummary>(`${API_ENDPOINTS.LM_DASHBOARD}${query}`);
  },
```

- [ ] Apply the change.
- [ ] Verify: `pnpm build` passes.

## Task 4: Scope the query key by `ownerId`

**File:** `src/hooks/query-keys.ts`

Current (around line 92):
```ts
  dashboard: () => [...lmKeys.all, "dashboard"] as const,
```

Change to:
```ts
  dashboard: (ownerId?: string) => [...lmKeys.all, "dashboard", ownerId ?? "all"] as const,
```

**File:** `src/hooks/queries/useLMQueries.ts`

Current (line 72):
```ts
export function useLMDashboard() {
  return useQuery({
    queryKey: lmKeys.dashboard(),
    queryFn: () => LMService.dashboard(),
    staleTime: 60 * 1000,
  });
}
```

Change to:
```ts
export function useLMDashboard(ownerId?: string) {
  return useQuery({
    queryKey: lmKeys.dashboard(ownerId),
    queryFn: () => LMService.dashboard(ownerId),
    staleTime: 60 * 1000,
  });
}
```

- [ ] Apply both changes.
- [ ] Verify: `pnpm build` passes. Without this task, the "My Cases" view and the bank-wide view would share one cache entry and show stale/wrong data when switching roles in the same session.

## Task 5: Role-aware page — information hierarchy, not just reorder

Reordering isn't just "list first" — the KPI cards and charts themselves are in an arbitrary order today (creation order, not importance). New hierarchy, same for both roles unless noted, ranked by "how actionable / time-sensitive is this":

1. **Needs Attention list** (was `TopRedFlagCard`) — most urgent, names specific cases to act on now.
2. **KPI cards**, reordered by urgency instead of today's `totalOpen, totalRedFlagCases, totalClosed, milestoneUpdateRate, alertResolutionRate, documentCompletionRate`:
   1. Cases with Alerts (red — needs action today)
   2. Open Cases (what's in flight)
   3. On-Time Completion — KPI a (new)
   4. Alert Resolution — KPI c
   5. Progress Updates — KPI b
   6. Document Completeness — KPI d
   7. Closed Cases (least actionable — just a record)
3. **Charts**, reordered by decision-usefulness:
   1. By Stage (pie) — "where is the pipeline" always matters, both roles.
   2. Owner Workload (bar) — **manager-only.** Actively used to decide reassignment, so it outranks the breakdown charts below.
   3. By Case Category (bar) — context, not a decision input day-to-day.
   4. By Business Unit (bar) — **manager-only**, lowest priority, pure reference. **Also hide for specialist view** — scoped to one person's cases, a 1-2-bar unit chart tells them nothing they don't already know.

**File:** `src/pages/lm/LMDashboardPage.tsx`

- [ ] Change `const { role } = useAuthStore();` to `const { role, user } = useAuthStore();`
- [ ] Change the dashboard call:
  ```ts
  const isSpecialistView = role === "owner";
  const dashboard = useLMDashboard(isSpecialistView ? user?.id : undefined);
  ```
- [ ] Update the `PageHero` title/subtitle to branch on `isSpecialistView`:
  ```tsx
  <PageHero
    title={isSpecialistView ? "My Cases" : "Litigation & Enforcement"}
    subtitle={isSpecialistView ? "Your assigned cases & KPIs." : "Overview & KPIs."}
  >
  ```
  (apply to all 3 places `PageHero` appears — pending, error, and loaded states — so the heading is consistent across loading states too.)
- [ ] Move `<TopRedFlagCard items={data.topRedFlagCases} />` to immediately after `<PageHero>`, before the KPI card grid. Rename its heading from "Most Flagged Cases" to "Needs Attention" — change the `<h3>` text at line ~197.
- [ ] Reorder the 6 existing `KPICard`s + insert the new one, per the ranking above:
  ```tsx
  <KPICard label="Cases with Alerts" value={data.totalRedFlagCases} icon={AlertTriangle} iconClassName="bg-destructive/10 text-destructive" />
  <KPICard label="Open Cases" value={data.totalOpen} icon={Briefcase} />
  <KPICard label="On-Time Completion" value={`${data.onTimeCompletionRate}%`} icon={Gavel} subtitle="Milestones completed by their planned date" />
  <KPICard label="Alert Resolution" value={`${data.alertResolutionRate}%`} icon={Gavel} subtitle="Flagged deadlines already resolved" />
  <KPICard label="Progress Updates" value={`${data.milestoneUpdateRate}%`} icon={ClipboardCheck} subtitle="Completed milestones with a logged event" />
  <KPICard label="Document Completeness" value={`${data.documentCompletionRate}%`} icon={FileCheck2} subtitle="By required count per stage" />
  <KPICard label="Closed Cases" value={data.totalClosed} icon={CheckCircle2} />
  ```
  (adjust the grid's `xl:grid-cols-6` to `xl:grid-cols-7`, or wrap to a 2nd row at `xl:grid-cols-4` — pick whichever reads better once rendered; not load-bearing.)
- [ ] Reorder the 4 chart cards to: By Stage → Owner Workload → By Case Category → By Business Unit (currently: Stage, Category, Workload, Unit — only Workload and Category swap).
- [ ] Wrap both `Owner Workload` and `By Business Unit` in `{!isSpecialistView && (...)}` — Workload is `[]` in scoped mode per Task 2 anyway, and Unit is non-informative for a single specialist.
- [ ] Verify: `pnpm build` + `pnpm lint` pass. Manually log in as `owner@demo.com` (`demo1234`) — confirm "My Cases" heading, Needs Attention first, KPI cards in the new order, only 2 charts (Stage + Category). Log in as `executive@demo.com` — confirm all 4 charts present in the new order (Stage, Workload, Category, Unit) and the new On-Time Completion card.

## Task 6: Commit

```bash
git add src/types/lm.ts src/mocks/handlers/lm_handlers.ts src/services/lm_service.ts src/hooks/query-keys.ts src/hooks/queries/useLMQueries.ts src/pages/lm/LMDashboardPage.tsx
git commit -m "feat(lm): split dashboard by role, add on-time completion KPI"
```
