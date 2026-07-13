No staged files. All changes are unstaged (working tree only). The new file `src/hooks/useTabActionCounts.ts` is untracked.

📚 5 preferences · 💾 —

<summary>
Implemented Wave 1 (Lanes A/B/C) of the compliance tool feature set.

**Lane A — Branding & visual (TopNav + LoginPage):**

- Brand chip "CA" → "EY"; brand name "ComplianceAI" → "Compliance Tool" in both TopNav and LoginPage (3 occurrences each, all updated).
- Active nav pill: switched from `bg-card font-bold text-foreground shadow-sm` to `font-bold text-foreground` with a small rounded yellow `bg-chart-accent` underline (built via Tailwind `after:` pseudo).
- Search box: icon button is now pure "open" (no toggle), and `onBlur` on the input closes it. The button's `onMouseDown` is `preventDefault`-ed so clicking the icon doesn't dismiss the input's focus before the click handler fires (no race condition).

**Lane B — Many-to-many regulation linking:**

- `Obligation.regulationIds: string[]` (new) and `ObligationFilter.regulationIds?: string[]` (new filter). Existing `regulationId` / `regulationName` preserved as the primary link.
- `CAP.regulationIds: string[]` (new direct link) and `CAPFilter.regulation?: string` (new filter).
- `mock db.ts`: added a `buildRegulationRelatedIndex` helper (regulation → set of dependency-related IDs) and a `dedupeRegIds` helper. Every generated Obligation now carries `regulationIds` (primary + all dependency-related regs). Every generated CAP derives `regulationIds` from its linked obligations.
- `mocks/handlers/obligation_handlers.ts`: bulk-create builds `regulationIds`; list handler supports the new `regulationIds` query param (comma-separated; matches if any ID is in the array).
- `mocks/handlers/cap_handlers.ts`: list handler supports the new `regulation` query param; create handler computes `regulationIds` from linked obligations.
- Services/hooks pass filters through unchanged (existing `buildQuery` already serializes arbitrary filter fields).

**Lane C — `useTabActionCounts` hook:**

- New `src/hooks/useTabActionCounts.ts` returning `{ regulations, assignments, obligations, caps, nccs }`.
- Uses `useAuthStore` for role/user id, and the five existing list query hooks (pageSize 500) to derive counts.
- Role rules per spec: owner sees their own work + overdue; approver sees items awaiting their review; admin sees broad backlogs; executive sees oversight-only (overdue, high-risk) and never "awaiting my approval".
- All reducers wrapped in try/catch, missing/loading queries return 0. Permission-checked via `hasPermission`. Re-exported from `src/hooks/queries/index.ts`.

**Verification:**

- `pnpm lint` → 72 warnings (all pre-existing), 0 errors.
- `pnpm build` → tsc -b clean, vite build succeeded (no TS errors).

**Not done (per scope):** summary cards on list pages, executive-comment emphasis (both deferred to Wave 2). No git commit performed.
</summary>
<changes>
- src/components/layout/TopNav.tsx: Replaced "CA" → "EY", "ComplianceAI" → "Compliance Tool", active-pill styling now uses bg-chart-accent underline accent, search input closes on blur and icon button only opens
- src/pages/auth/LoginPage.tsx: Replaced all 3 "ComplianceAI" → "Compliance Tool" and all 2 "CA" → "EY" occurrences
- src/types/obligation.ts: Added `regulationIds: string[]` on Obligation and `regulationIds?: string[]` on ObligationFilter
- src/types/cap.ts: Added `regulationIds: string[]` on CAP and `regulation?: string` on CAPFilter
- src/mocks/db.ts: Added `buildRegulationRelatedIndex` + `dedupeRegIds` helpers; wired them through `generateObligations` and `generateCAPs`; expanded the singleton `dbInstance` caller to pass the new args
- src/mocks/handlers/obligation_handlers.ts: bulk-create now builds `regulationIds`; list handler supports `regulationIds` filter
- src/mocks/handlers/cap_handlers.ts: list handler supports `regulation` filter; create handler computes `regulationIds` from linked obligations
- src/hooks/useTabActionCounts.ts: New hook (role-aware action counts for 5 tabs)
- src/hooks/queries/index.ts: Re-exports `useTabActionCounts` + `TabActionCounts` type
</changes>
<verification>
- Tests passed: skip — no test files exist in the project; no tests added per scope
- Validation: passed — `pnpm build` (tsc -b + vite build) succeeded with 0 TS errors; `pnpm lint` (oxlint) passed with 0 errors (72 pre-existing warnings)
- prek: skipped (parent's responsibility per task instructions)
- git commit: skipped (per task instructions)
</verification>

```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "Implemented only the 3 specified lanes (A/B/C). Lane A: branding text + active-pill style + search blur-close in TopNav/LoginPage. Lane B: regulationIds types, mock DB enrichment, and handler filter support for obligations + CAPs. Lane C: new useTabActionCounts hook with role-aware rules. No summary cards, no exec-comment emphasis (deferred to Wave 2 as instructed)."
    },
    {
      "id": "criterion-2",
      "status": "satisfied",
      "evidence": "8 files modified, 1 new file (useTabActionCounts.ts). Build + lint both pass. No git commit performed. Detailed diff stats and verification output above."
    }
  ],
  "changedFiles": [
    "src/components/layout/TopNav.tsx",
    "src/pages/auth/LoginPage.tsx",
    "src/types/obligation.ts",
    "src/types/cap.ts",
    "src/mocks/db.ts",
    "src/mocks/handlers/obligation_handlers.ts",
    "src/mocks/handlers/cap_handlers.ts",
    "src/hooks/queries/index.ts"
  ],
  "testsAddedOrUpdated": [],
  "commandsRun": [
    {
      "command": "pnpm lint",
      "result": "passed",
      "summary": "oxlint: 72 pre-existing warnings, 0 errors"
    },
    {
      "command": "pnpm build",
      "result": "passed",
      "summary": "tsc -b + vite build succeeded with 0 TS errors"
    },
    {
      "command": "git status",
      "result": "passed",
      "summary": "8 modified, 1 untracked new file, 0 staged"
    }
  ],
  "validationOutput": [
    "tsc -b: no errors",
    "vite build: built in 607ms, bundle produced",
    "oxlint: 72 warnings, 0 errors (warnings are pre-existing — REGULATORS, CATEGORIES, unused params, etc., not introduced by this change)"
  ],
  "residualRisks": [
    "Lane C 'regulations' count is a heuristic: it returns max(activeLinkedRegs, effectiveRegulationsCount) so the tab is non-zero in fresh demo state. Could over-count for exec role in a fully-populated scenario. Acceptable per task spec ('pragmatic count; accuracy within reason is fine since this is a prototype').",
    "Lane B: regulationIds on bulk-created obligations/CAPs is computed at create-time using a freshly-built related-regs index. The seeded (curated) data uses the centralized helper. Slight code duplication between db.ts and the create handler — acceptable for a mock layer.",
    "The active-pill yellow underline uses Tailwind's `after:` pseudo + `bg-chart-accent` so it inherits the design token and should work in both light and dark modes, but was not visually smoke-tested in a browser — review should verify the underline reads correctly in both themes."
  ],
  "noStagedFiles": true,
  "diffSummary": "8 files modified, 1 new file. Lane A: 2 brand-text replacements + active-pill restyle + search blur-close (TopNav/LoginPage). Lane B: new regulationIds field on Obligation+CAP types, mock DB enrichment via dependency graph, handler filter support. Lane C: new useTabActionCounts hook with role-aware rules and 0-fallback on errors. Net +162/-13 lines across modified files + 207 LOC new hook.",
  "reviewFindings": [
    "no blockers",
    "suggestion: A4 search-onBlur — verify in browser that clicking outside the input reliably closes it (e.g., not blocked by overlay elements with higher z-index that would intercept focus)",
    "suggestion: C 'regulations' count heuristic — confirm with PM whether max(activeLinked, effectiveCount) is the desired semantics, or if a different baseline is preferred"
  ],
  "manualNotes": "No git commit performed (per task instructions). prek not run (parent's responsibility). All my changes are unstaged; the new useTabActionCounts.ts file is untracked. Build and lint are clean. Two minor code-style notes: (1) the related-regs index is built once in db.ts via buildRegulationRelatedIndex but the bulk-create handlers rebuild it locally on each create — for the prototype this is fine (1 small array, no perf concern); (2) the hook imports from '@/hooks/queries' which is the established barrel pattern in the codebase."
}
```

📚 5 preferences · 💾 preferences
