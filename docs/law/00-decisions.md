# LAW — Implementation Plan (Appendix 3)

> Status: DRAFT. Items marked "⏳ PENDING APPROVAL" are provisional — coded with a default value so they don't block progress, but must be corrected once confirmed. This file follows the same template as `docs/lm/00-decisions.md` — reusing the LM module's patterns as much as possible.

## 0. Overview

The Legal Advisory Workflow system (LAW, Appendix 3) is the 2nd module in the bid package, same batch as LM (Appendix 2). Source: Appendices 2 and 3 + Public tender notice for CMS, LM, LAW and ICIS technical solution No. 2698/2026/TB-NHNA-P.11 (14/9/2026).

**Assumption** (same as LM): the immediate goal is a demo for the bid package, built the same way `compliance_tool` already works (types → mock → service → hook → page). GĐ0-4 run on fake data for the demo; GĐ5 (SSO/Core Banking/real notification channels) only happens after winning the bid, once Nam A Bank's real infrastructure is available.

**Similarities to LM, directly reusable:**
- The 3-tier permission structure (Manager/Specialist/Requesting unit) — **identical** to the structure already built for LM (Manager/Specialist/Business unit). Reuse the decision already locked in `docs/lm/00-decisions.md` section 1: role `executive` = Manager, `owner` = Specialist, `business_unit` (pending, currently using `owner` filtered by unit) = Requesting unit.
- Audit trail, Notification, FileAttachment, AuditLog — reuse the entities as-is, only adding a linking field (`requestId` instead of `caseId`).
- Red flag alerts based on SLA — reuse LM's `evaluateDeadlines`/`AlertRule` logic (see `lib/lm-alerts.ts`), just change the input.
- Dashboard/KPI — reuse the `LMDashboardPage` template + `KPICard`/`PieChartCard`/`BarChartCard` almost as-is.

**Differences from LM, must build new:**
- No 5-step progress milestones (Filed→...→Enforcement). LAW has a single simple lifecycle: New → In progress → Completed (+ Overdue computed separately).
- LAW's priority level is tied to LEGAL BASIS (Mandatory by law / SBV regulation / Internal), not the generic severity scale of the existing `PriorityLevel` (low/medium/high/critical) — needs its own enum.
- Knowledge Base: a repository of sample advisory opinions + internal precedents, searchable by keyword. No precedent in the current code — a completely new module.
- LAW's KPI b is "case quality" (meets requirements on the first submission, minimal rework) — different from LM's KPI b (complete progress updates).

## 1. Data entities to build

Located in `src/types/law.ts`, following the exact template of `types/lm.ts`.

| Entity | Main fields | Notes |
| --- | --- | --- |
| `AdviceRequest` (advisory request) | Code (`LAW-2026-001`), title, description, requesting unit, priority level (`law_mandatory`/`sbv_regulation`/`internal`), submission date, SLA deadline (computed from priority), status (`new`/`in_progress`/`completed`/`overdue`), assigned specialist, manager, whether it was returned for revision (for KPI b) | Central entity, equivalent to `LitigationCase` |
| `AdvisoryOpinion` (advisory opinion) | Request, content, attached files, author, timestamp | Evidence that "advice was given" — non-functional requirement b |
| `LawEvent` (activity history) | Request, action type, performed by, timestamp, before/after value | Same as `CaseEvent`, immutable |
| `SlaRule` (SLA config) | Priority level, processing days, days before overdue warning | Same as LM's `AlertRule` — editable by Admin |
| `KnowledgeBaseEntry` (knowledge entry) | Title, category, keywords/tags, summary, content or attached file, author, timestamp | New module — no precedent |
| Reused as-is | `FileAttachment` (add `requestId`), `Notification`, `AuditLog`, `UserProfile` | No new types created |

## 2. Permissions

| Appendix 3 tier | App role | LAW permissions | Visible requests |
| --- | --- | --- | --- |
| Manager tier (Dept./Division Head) | `executive` (existing) | Full approval rights, bank-wide Dashboard, resource allocation | Entire system |
| Specialist tier | `owner` (existing) | Manage details of assigned requests, update progress, give advisory opinions | Assigned requests |
| Requesting unit/related unit | `business_unit` (new, same as LM) | Submit requests, track status, receive advisory results | Own unit's requests |
| System admin | `admin` (existing) | Full access, configure SLA | Entire system |

Decision: the `business_unit` role is SHARED between LM and LAW (not split into 2 separate roles) — if Nam approves adding this role for LM, LAW inherits it automatically, no need to request approval twice.

## 3. Phases

Each phase ends with something demoable. Rough one-person-day estimates — LAW is estimated lower than LM for GĐ1-2 (simpler lifecycle, no 5-milestone flow) but higher for GĐ3 (Knowledge Base is a new module).

| GĐ | Content | What's demoable when done | Estimate |
| --- | --- | --- | --- |
| 0 | Design sign-off | Decisions in section 5 locked in | 0.5 day |
| 1 | Request foundation, history, permissions | Create/view/edit advisory requests; every action has history | 2.5–3 days |
| 2 | SLA & assignment | Deadline auto-computed from priority, workload-based assignment, follow-up | 1.5–2 days |
| 3 | Red flag alerts & Knowledge Base | Red flag by SLA; Knowledge Base page to create/search by keyword | 2.5–3 days |
| 4 | Executive screen, KPI | Manager dashboard, KPI a-c report | 1.5–2 days |
| 5 | Go-live on real system | Backend, SSO, Core Banking, notification channels, UAT | Depends on Nam A Bank's infrastructure |

**Total GĐ0-4 (demo build): ~8.5–10.5 person-days.**

### GĐ 0: Design sign-off
- [ ] Create branch `feat/law` from `dev` (or from `feat/lm` if we want to inherit LM's code directly)
- [ ] Lock in the items in section 5 "Decisions needed before coding"
- [ ] Draft sample data set: ~20-25 requests spread across all 3 statuses, all 3 priority levels, with some approaching/overdue requests, plus a few sample Knowledge Base entries

### GĐ 1: Request foundation
- [ ] `types/law.ts`; priority level and status constants in `constants/law.ts`
- [ ] Sample data in `mocks/db.ts` (or a separate `mocks/law-db.ts` if `db.ts` is already too long — decide during implementation)
- [ ] `mocks/handlers/law_handlers.ts`: CRUD + history, following the `lm_handlers.ts` template (including `recordEvent`)
- [ ] Register endpoints in both `mocks/handlers/index.ts` (MSW) and `mocks/directApi.ts` (dev) — missing one means only one mode works, already hit this bug with LM
- [ ] `constants/api.ts`, `services/law_service.ts`, hooks, `lawKeys` in `hooks/query-keys.ts`
- [ ] `pages/law/`: list, detail (Overview/Advisory Opinions/History tabs), create
- [ ] Route in `routes/index.tsx`, "Legal Advisory" tab in `navPills.ts`, `law:*` permissions in `rbac.ts`

### GĐ 2: SLA & assignment
- [ ] SLA deadline auto-computed on request creation, per the priority level's `SlaRule`
- [ ] Status transitions `new` → `in_progress` → `completed`; log history on every change
- [ ] Assignment dialog: reuse LM's `computeOwnerWorkload`/`AssignList` as-is (switch the data source from case to request)
- [ ] "Follow up" button — reuse LM's `handleRemindLMCase` mechanism as-is

### GĐ 3: Red flag alerts & Knowledge Base
- [ ] Reuse LM's `evaluateDeadlines`/`deadlineSeverity` — generalize `lib/lm-alerts.ts` into
      `lib/deadline-alerts.ts` shared by both modules (avoid copying the same logic twice)
- [ ] SLA configuration page under Admin
- [ ] "Acknowledged"/"Resolved" buttons on alerts
- [ ] `KnowledgeBaseEntry`: list page + create + search by keyword/tag (client-side filter is enough for the demo, no real search engine needed)

### GĐ 4: Executive screen, KPI
- [ ] LAW Dashboard for Manager tier: requests by status/priority, red flags, per-specialist efficiency — reuse the `LMDashboardPage` template
- [ ] KPI a-c report page (see section 4)
- [ ] Test on mobile; `pnpm build`, `pnpm lint`; open PR into `dev`

### GĐ 5: Go-live on real system
- Replace mocks with a real backend, keep the `/api/law/*` endpoints unchanged
- SSO, Core Banking integration (real-time outstanding debt, customer info)
- Real notification channels (Email/SMS/Teams) — share sending infrastructure with LM if LM's GĐ5 was done first
- Audit log stored somewhere immutable; security review
- UAT, training, user guide documentation (deliverables)

## 4. KPIs: formulas and data

| KPI (Appendix 3, section 3.2) | Proposed formula | Data to record |
| --- | --- | --- |
| a. On-time completion rate | Requests completed within SLA ÷ total requests completed in the period | `submittedAt`, SLA deadline, `completedAt` |
| b. Case quality | Requests not returned for revision ÷ total requests completed | "Was it returned for revision" flag each time it's sent back (demo proxy — there's no real "review" workflow) | 
| c. Red flag resolution rate | Alerts resolved before deadline ÷ total alerts | Flag-raised time, acknowledged time, resolved time — identical to LM's KPI c |

## 5. Decisions needed before coding ⏳

- [ ] `business_unit` role: share the same decision as LM, or does LAW need different semantics? (proposal: share it)
- [ ] Default SLA days per priority level (1/2/3) — **Appendix 3 gives no numbers at all**, must ask Nam/the legal department before setting a placeholder, unlike what was done for LM's `DEADLINE_TYPE_DEFAULT_DAYS_BEFORE` (that time there was at least some contextual hint; this time Appendix 3 gives no days at all)
- [ ] Knowledge Base: where do sample entries come from (make up demo precedents, or does Nam need to provide real examples)? How "smart" does search need to be for the demo — is simple keyword/tag filtering enough, or does it need real semantic search?
- [ ] Request code format (proposed `LAW-YYYY-NNN`, same as LM)
- [ ] Build on its own `feat/law` branch, or merge into `feat/lm` (2 modules, 1 PR)? Proposal: separate branch, separate PR — easier to review.
- [ ] Demo deadline: same as LM, set for the 05/10/2026 meeting. If time is tight, cut in this order: advanced Knowledge Base search → KPI CSV export → simulated Core Banking integration (keep GĐ1-2 intact, that's the core business logic).
