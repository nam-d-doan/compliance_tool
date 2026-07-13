# Task for fixer

You are reviving a previous subagent conversation.

Original run: 47503a14-cd5f-408d-b70e-f84148a8ac5b
Original agent: fixer
Original session file: /Users/namdoan/.pi/agent/sessions/--Users-namdoan-Documents-Projects.nosync-compliance_tool--/2026-07-13T01-59-29-756Z_019f5933-6adc-770f-8cce-2841e61b161e/6751ab25/run-0/session.jsonl

Use the stored session context as background. Answer the orchestrator's follow-up below. Do not assume the original child process is still alive.

Follow-up:
PROJECT: /Users/namdoan/Documents/Projects.nosync/compliance_tool (React 19 + Vite + TS + MSW mock API, pnpm). Read DOX.md and src/DOX.md first. Path alias @/ → ./src/. Do NOT edit components/ui/ (shadcn). Do NOT git commit/commit.

This is WAVE 1 of a larger feature set. Implement exactly these 3 lanes (A/B/C). Do NOT do summary cards on list pages or exec-comment emphasis — those are Wave 2 (separate).

== LANE A: Branding & visual (simple, do first) ==
A1. src/components/layout/TopNav.tsx — the top-left brand block currently renders a dark chip with bold "CA" in `--chart-accent` yellow, followed by text "ComplianceAI". Change:

- Chip: render bold "EY" instead of "CA" (keep the same ink-chip background and `text-chart-accent`).
- Name text: "ComplianceAI" → "Compliance Tool".
  A2. src/pages/auth/LoginPage.tsx — there are 3 occurrences of "ComplianceAI" (brand-panel heading, footer copyright line, mobile brand row) and 2 occurrences of the "CA" mark (brand-panel mark, mobile mark). Replace all "ComplianceAI" → "Compliance Tool" and all "CA" → "EY" (keep the same styling/chip).
  A3. TopNav active nav pill highlight: currently active pill uses `bg-card font-bold text-foreground shadow-sm`. Change the active treatment to use EY primary yellow (`var(--chart-accent)` = #ffe600): give the active pill a bold text in a color that reads on the nav surface AND a subtle yellow accent. Recommended: active = `font-bold text-foreground` with a short rounded yellow underline bar or a `bg-chart-accent` tint pill. Keep it tasteful, readable in both light/dark. Inactive stays `font-semibold text-muted-foreground hover:text-foreground`. (Tailwind maps `--chart-accent` to `chart-accent`, e.g. `text-chart-accent`, `bg-chart-accent`.)
  A4. Search box collapse behavior: currently the search box toggles open/closed only when clicking the search icon button (onClick toggles searchOpen). Change so that it ALSO closes when the input loses focus (clicking elsewhere). Keep the icon-click-to-open behavior; implement onBlur on the Input to setSearchOpen(false). Ensure the icon button still opens it. Avoid race conditions (e.g. onBlur firing before icon click) — simplest: keep icon button as pure "open" (only open if closed) and let onBlur close it; or use a small timeout. Your call, keep it smooth.

== LANE B: Many-to-many regulation linking ==
B1. Types (src/types/obligation.ts): Add `regulationIds: string[]` to the `Obligation` interface (array of all linked regulation IDs incl. superseded). KEEP the existing `regulationId: string` + `regulationName` as the primary/first link (backward-compat; set it to regulationIds[0]). Add optional `regulationIds?: string[]` to `ObligationFilter` as a filter field.
B2. Types (src/types/cap.ts): Add `regulationIds: string[]` to the `CAP` interface (NEW direct many-to-many link to regulations, independent of obligation links). Add optional `regulation?: string` filter to `CAPFilter` if not present (filter by a regulation ID matching any in regulationIds).
B3. Mock DB (src/mocks/db.ts and/or src/mocks/curated-data.ts): For EVERY existing Obligation, set `regulationIds` = [its current regulationId, plus any superseded/amendment-related regulation IDs derived from RegulationDependency entries where the regulation is the `toRegulationId` or `fromRegulationId`]. If no related regs, the array is just [regulationId]. For EVERY existing CAP, set `regulationIds` = the set of regulation IDs from its linked obligations (cap.obligationIds → their obligation.regulationId → plus each regulation's dependency-related superseded regs). Ensure arrays are non-empty and unique. Do NOT break existing fields. If you add new "superseded" regulation records to enrich the examples, that's fine but optional.
B4. MSW handlers: In the obligations handler (src/mocks/handlers/) and CAP handler, support the new `regulation`/`regulationIds` query filter: match items where the item's regulationIds array INCLUDES the requested regulation ID. Find the existing filter logic and extend it minimally.
B5. Services/hooks: Pass the new filter field through the service functions and query hooks (obligations + CAP). Find the existing query/filter plumbing and add the param. Minimal touch.

== LANE C: Shared role-aware "needs action" counts hook ==
Create src/hooks/useTabActionCounts.ts (and export from the hooks barrel if there is one). Signature: useTabActionCounts(): { regulations, assignments, obligations, caps, nccs } where each value is a number = "items needing the current user's action" for that tab.
Implementation:

- Read role + user id from useAuthStore() (src/stores/authStore.ts).
- Use the existing list query hooks (e.g. useObligationList, useAssignmentList/useAssignmentQueries, useCAPList, useNCCList, useRegulationList/useRegulationQueries) with a large pageSize to fetch data (or reuse whatever pattern the dashboards use — check src/components/dashboard/MyObligationsWidget.tsx, DashboardApprovalQueue.tsx, DashboardNeedsAttentionList.tsx for the established pattern). Disable pagination effects; fetch once.
- Role rules (roles are admin, executive, owner, approver):
  - regulations: count => for admin/approver/executive/owner => regulations (effective) that have at least one Assignment in draft/published-not-yet-acknowledged OR an obligation in pending review that links to that regulation. Simpler acceptable approach: count of assignments with status 'published' not yet acknowledged (assignee action) OR obligations in 'review_required'/'submitted' that need approval, that reference that regulation. Use a pragmatic count you can compute from fetched data; accuracy within reason is fine since this is a prototype.
  - assignments: owner => assignments where status in ('published' [need acknowledgment]) or assigned to the user awaiting their work; approver => assignments needing review; admin => all 'published'-not-acked; executive => 0 (exec only views/comments).
  - obligations: owner => my obligations in draft/submitted/returned needing my work, OR overdue; approver => obligations in 'review_required'/'submitted' awaiting my approval; admin => all overdue + pending review; executive => count of overdue obligations (oversight).
  - caps: owner => my open CAPs ('Open'/'In Progress') or overdue; approver => CAPs 'Pending Approval' awaiting my approval; admin => all open+overdue; executive => count overdue CAPs (oversight).
  - nccs: owner => my open NCCs ('Open') or overdue; approver/admin/executive => high/critical severity open NCCs (oversight).
- Return 0 for any tab the role can't see (permission check via hasPermission from @/constants/rbac).
- Wrap each computation defensively in try/catch; if a query is still loading or errors, return 0 for that tab.
- Export the hook from src/hooks barrel (index.ts or wherever queries are re-exported).
  NOTE on executive: exec does NOT approve — only views + comments. So exec counts = oversight (overdue / high-risk / pending-other's-action) only, never "awaiting my approval". (Exec-comment emphasis is Wave 2, do not implement it here.)

== VERIFICATION (run before reporting done) ==

- pnpm lint (oxlint) must pass.
- pnpm build (tsc -b && vite build) must pass with NO TS errors. This is the hard gate.
- Do NOT run prek (that's my job at the end).
  Report a concise diff summary + the build/lint result. Do not git commit.

## Acceptance Contract

Acceptance level: reviewed
Completion is not accepted from prose alone. End with a structured acceptance report.

Criteria:

- criterion-1: Implement the requested change without widening scope
- criterion-2: Return evidence sufficient for an independent acceptance review

Required evidence: changed-files, tests-added, commands-run, validation-output, residual-risks, no-staged-files

Review gate: required by reviewer.

Finish with a fenced JSON block tagged `acceptance-report` in this shape:
Use empty arrays when no items apply; array fields contain strings unless object entries are shown.

```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "specific proof"
    }
  ],
  "changedFiles": [
    "src/file.ts"
  ],
  "testsAddedOrUpdated": [
    "test/file.test.ts"
  ],
  "commandsRun": [
    {
      "command": "command",
      "result": "passed",
      "summary": "short result"
    }
  ],
  "validationOutput": [
    "validation output or concise summary"
  ],
  "residualRisks": [
    "none"
  ],
  "noStagedFiles": true,
  "diffSummary": "short description of the diff",
  "reviewFindings": [
    "blocker: file.ts:12 - issue found, or no blockers"
  ],
  "manualNotes": "anything else the parent should know"
}
```
