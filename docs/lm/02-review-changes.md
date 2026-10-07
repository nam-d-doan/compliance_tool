# LM — Revision Plan from Nam's Review

> Status: DRAFT. Source: `Downloads/CMS_Litigation_LAW_Comments.md` section "2. Litigation" (+ shared open questions in section 4). This covers the LM part only — LAW revisions are a separate plan, done after this one.

## 0. Gap analysis

What Nam asked for vs. what's actually in the code today (checked against `types/lm.ts`, `pages/lm/LMDashboardPage.tsx`, `pages/lm/LMDetailPage.tsx`, `mocks/handlers/lm_handlers.ts`):

| Nam's comment | Current state | Gap |
| --- | --- | --- |
| Dashboard: show work list first, before charts | `LMDashboardPage.tsx` renders 6 KPI cards → 4 charts → "Most Flagged Cases" list, in that order | List is last, not first. Reorder. |
| Dashboard: split by Specialist view vs Manager view | One dashboard, same for everyone | `handleGetLMDashboard()` (`lm_handlers.ts:676`) takes no params — never filters by `ownerId`. Needs a role/user-aware query. |
| Specialist should only see their own cases | List page (`LMListPage`) already filters via `ownerId` query param (`lm_handlers.ts:184`) | Dashboard does NOT apply the same filter — confirmed gap, dashboard is fully global today. |
| Dashboard missing KPI + SLA charts | `LMDashboardSummary` has `milestoneUpdateRate` (KPI b), `alertResolutionRate` (KPI c), `documentCompletionRate` (KPI d), `ownerWorkload` (KPI e) | **KPI a — "on-time completion rate" is missing entirely.** Appendix 2 §3.2.a ("Tỷ lệ hoàn thành đúng hạn") has no field in `LMDashboardSummary` and no chart. This is the literal "SLA" gap Nam is pointing at. |
| Case detail: 4 sub-tabs (Case Profile / Work Calendar / Document / History), Case Profile as a workflow with per-step content + document links | 5 tabs today: Overview, Progress, Deadlines & Alerts, Documents, History (`LMDetailPage.tsx:238-242`) | Need to merge Overview+Progress into one workflow-styled "Case Profile" tab, and add per-milestone document links (not in `CaseMilestone` today). |
| Work Calendar: create/manage tasks, set alerts, track deadlines, set priority; nice-to-have table+calendar toggle | Only `LegalDeadline` exists — tied to the 4 fixed deadline types (Appeal/Court fee/Enforcement extension/Other), not general tasks | No generic task entity. `LegalDeadline` can't hold an arbitrary task title/description or a specialist-set priority — new entity needed. |
| Document: folder organization + link to add file from Case Profile | `FileAttachment` (`types/file.ts`) is a flat list, no folder field | Need `folderPath`/`folderId` on `FileAttachment`. |
| History / Audit Trail | `CaseEvent`, immutable, already covers this | No gap — keep as-is. |

## 1. Entities to add or change

| Entity | Change | Reason |
| --- | --- | --- |
| `LMTask` (new, `types/lm.ts`) | `caseId`, `title`, `description?`, `dueDate`, `priority: PriorityLevel`, `status: "open"\|"done"`, `reminderChannels?: NotificationChannel[]`, `createdById` | New — "Work Calendar" needs general tasks, not just the 4 fixed legal deadline types. Keeps `LegalDeadline` untouched (still the Appendix-2-mandated red flag mechanism); `LMTask` is a separate, lighter-weight list that the calendar view reads alongside `LegalDeadline`. |
| `FileAttachment` (`types/file.ts`) | Add `folderPath?: string` (e.g. `"Contracts/Collateral"`) | Folder organization for Document tab. Optional field — existing files without it render in a flat "Unfiled" bucket, no migration needed for current mock data. |
| `CaseMilestone` (`types/lm.ts`) | Add `linkedFileIds?: string[]` | "Case Profile" workflow view needs each step to show "link to related documents" — reuses `FileAttachment` IDs already uploaded to the case, just tags which ones belong to which step. |
| `LMDashboardSummary` (`types/lm.ts`) | Add `onTimeCompletionRate: number` (KPI a) + `scope: "mine" \| "all"` marker in the response (or split into two hook calls — see §3) | Closes the literal KPI/SLA gap Nam flagged. |

No new role. Dashboard scoping reuses the existing `ownerId` filter pattern already proven on `LMListPage` — not a new permission model.

## 2. Case Profile workflow (merged Overview + Progress)

Each of the 5 `CaseStage` steps (Litigation filed → Case accepted → Mediation → Trial → Enforcement) renders as one workflow row, in order, each showing:
- Status (done / current / upcoming) — derived the same way `stage` already derives from the latest completed `CaseMilestone`, no new logic.
- Planned date (`currentPlannedDate`), actual date if done, notes — all already on `CaseMilestone`, just re-laid-out as a workflow instead of today's flat "Progress" tab.
- **New:** files tagged to that step via `CaseMilestone.linkedFileIds`, rendered as inline links; clicking one jumps to the Document tab filtered to that file's folder.

Case-level fields currently in the "Overview" tab (title, customer, outstanding debt, collateral, court, owner/manager) move to a header/summary block above the workflow — not a separate tab anymore.

## 3. Dashboard: role split + reorder + KPI a

- `handleGetLMDashboard` (`lm_handlers.ts:676`) takes a new optional `ownerId` query param. When present (specialist view), every count/rate/chart is computed only over cases where `ownerId` matches — same filter `LMListPage` already uses at `lm_handlers.ts:184`, just applied to the dashboard aggregation instead of the list.
- `LMDashboardPage.tsx`: read `useAuthStore().role`. If `role === "owner"`, call `useLMDashboard({ ownerId: user.id })` and render a "My Cases" heading; otherwise call it with no `ownerId` (Manager/Admin view, bank-wide) and render "Litigation & Enforcement" as today.
- Layout order changes to: work list first (promote `TopRedFlagCard` — rename to a general "My Open Cases" / "Needs Attention" list for the specialist view) → KPI cards → charts. Manager view keeps a bank-wide list in the same top slot instead (e.g. cases with no activity in N days, reusing `topRedFlagCases` shape).
- Add KPI a chart: on-time completion rate, computed as completed `CaseMilestone` records where `actualDate <= currentPlannedDate`, aggregated same way as `milestoneUpdateRate`. New `KPICard` + inclusion in `LMDashboardSummary.onTimeCompletionRate`.

## 4. Work Calendar (new tab, replaces "Deadlines & Alerts")

- Lists both `LegalDeadline` (existing red-flag mechanism, unchanged logic) and the new `LMTask` in one combined view, sorted by due date.
- Table view (default, reuse existing deadline table styling) + calendar view toggle (nice-to-have per Nam's comment — can ship table-only first, add calendar view if time allows; flag this explicitly as cuttable in §6).
- "New Task" button opens a small form: title, description, due date, priority — writes an `LMTask`, not a `LegalDeadline` (the 4 fixed deadline types stay a closed enum, per Appendix 2's own wording; `LMTask` is the free-form complement Nam is asking for).

## 5. Document folders

- `FileAttachment.folderPath` optional field. Upload form gets a folder picker/text input (free-text path, no folder-tree backend needed for the demo — same "no real search engine" philosophy already used for LAW's Knowledge Base).
- Document tab groups files by `folderPath`, "Unfiled" bucket for files without one (covers all current mock data with no migration).
- "Add to Case Profile step" action on a file: sets that file's ID into the chosen `CaseMilestone.linkedFileIds`.

## 6. Phasing

| Rev | Content | Demoable result | Estimate |
| --- | --- | --- | --- |
| R1 | Dashboard role split + reorder + KPI a | Specialist sees "My Cases" dashboard scoped to their own cases; Manager sees bank-wide view; on-time completion chart present | 1.5–2 days |
| R2 | Case Profile retab (merge Overview+Progress, per-step document links) | Detail page shows 1 workflow tab instead of 2 flat tabs; each step shows linked docs | 1–1.5 days |
| R3 | Work Calendar (`LMTask` + combined table view) | Create/edit free-form tasks with priority + due date, alongside existing red-flag deadlines, in 1 tab | 1.5–2 days |
| R3b (optional) | Calendar view toggle on Work Calendar | Same tab, switch to month/week calendar layout | 1 day — cut first if demo date is tight |
| R4 | Document folders | Files grouped by folder, link-to-step action | 1 day |

**Total R1-R4 (without R3b): ~5–6.5 days.**

## 7. Open questions for Nam (from his own section 4, LM-scoped subset) ⏳

- [ ] Exact KPI/SLA list to show on the Litigation dashboard — this plan assumes Appendix 2 §3.2's 5 KPIs (a-e) are the full list; confirm nothing else is expected.
- [ ] Permission scope rule, precisely: does "Manager" mean role `executive` sees ALL cases bank-wide with no unit restriction, or only their own department's units? Current RBAC (`rbac.ts`) gives `executive` bank-wide `lm:read` with no unit filter — confirm this is correct before building the Manager dashboard view.
- [ ] Calendar view (R3b) — nice-to-have per his note; confirm whether it's in scope for the bid demo or can be dropped to meet the 05/10/2026 date.
