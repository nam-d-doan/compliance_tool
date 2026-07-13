# User Flow — Ground Truth

This is the ground-truth description of what the app actually does today, derived from reading the code (not from `docs/specs/`, see [Relationship to specs](#relationship-to-specs) below). Written for devs and agents who need to orient quickly before making changes.

## What the tool is for

A demo-first regulatory compliance tracker for a bank-like organization operating under Vietnamese banking regulations (SBV/NHNN circulars, Basel III, AML/KYC, etc.). It tracks the lifecycle of a regulatory obligation from "a regulation exists" through "a department is assigned to comply" to "the specific compliance obligations are logged and evidenced" to "if something's not compliant, a corrective action plan (CAP) fixes it." Dashboards and reports give each role a view of what's outstanding, overdue, or at risk.

There is no real backend. `src/mocks/` (MSW handlers + an in-memory `db.ts` singleton, seeded with faker + curated fixtures) simulates the API. Every "create"/"update" mutates that in-memory store for the lifetime of the page — a full browser reload reseeds it from scratch. AI features (risk scoring, CAP drafting, explanations) are also simulated, not real model calls.

## Roles

Demo accounts (`src/constants/demo-users.ts`, password `demo1234` for all — note there is no generic `demo@demo.com`, only role-scoped accounts):

| Role | Email | What they do |
|---|---|---|
| Admin | `admin@demo.com` | Org/user/role setup, AI config, audit logs |
| Executive | `executive@demo.com` | Org-wide oversight dashboard, executive reports |
| Owner | `owner@demo.com` | Creates/owns obligations, drives CAPs to completion |
| Approver | `approver@demo.com` | Reviews and approves/rejects obligations and CAPs |

Role → permission mapping lives in `src/constants/rbac.ts`; role → route access and the sidebar nav tree are built in `src/constants/routes.ts`.

## The lifecycle (Regulation → Assignment → Obligation → CAP)

This is the single, unified chain as of the obligation-model unification (see [History](#history-the-obligation-model-unification) below):

1. **Regulation library** (`/regulation`, `src/pages/regulation/RegulationLibraryPage.tsx`) — Admin/Owner/Executive adds or reviews a regulation, either by hand or via a simulated "VietLex" search-and-import flow (`src/pages/regulation/RegulationCreatePage.tsx`, `VietLexDoc` types). Each regulation has `articles: Article[]`, a status (Draft/Effective/Superseded/…), and supports comparison (`/regulation/compare`) and impact analysis (`/regulation/:id/impact`).
2. **Assignment** (`/assignment`, `src/pages/assignment/*`) — an Owner/Executive/Admin routes a specific regulation to one or more departments with a due date and priority. This is the real kickoff of the compliance lifecycle — a regulation sitting in the library does nothing until it's assigned.
3. **Obligation creation** (`/obligations/create?assignmentId=...`, `src/pages/obligations/ObligationCreatePage.tsx`) — from the Assignment detail page, the assigned department bulk-creates one or more `Obligation` records (one per relevant article/requirement), optionally AI-suggested from the regulation's text. Saved as draft or submitted.
4. **Obligation tracking** (`/obligations`, `/obligations/:id`) — every obligation (regardless of how it was created) now lives in one dataset and is visible here: code, title, owner, approver, due date, frequency, penalty, AI risk score, tags, progress, status, comments, and an approvals workflow (Approve/Reject). The Owner Dashboard's "My Obligations" widget (`src/components/dashboard/MyObligationsWidget.tsx`) classifies an owner's obligations into needs-CAP / overdue / in-progress / done.
5. **Corrective Action Plan (CAP)** (`/cap/create?obligations=id1,id2`, `src/pages/cap/CAPCreatePage.tsx`) — created against one or more obligations, either AI-drafted (root cause, recommended actions, timeline, priority) from the obligation's description or filled in manually. Routes through owner → approver review; tracked on `/cap` (KPI dashboard) and `/cap/:id` (tasks, timeline, approvals, evidence attachments). Creating/closing a CAP updates the linked obligations' status (e.g. to `cap_in_progress`) and the obligation detail page shows the CAP back-link under "Linked Corrective Actions."
6. **Reports & dashboards** (`/reports/*`, role dashboards) — aggregate across regulations, assignments, obligations, and CAPs for oversight. The Early Warning System report (`/reports/ews`) trends non-compliance data specifically.

## Non-Compliance Cases (NCC) — a separate, unlinked track

`/ncc/*` (`src/pages/ncc/*`, `src/types/ncc.ts`) tracks standalone non-compliance incidents: severity, owning unit, evidence attachments, resolution text, status (`Open`/`Closed`). **This is intentionally not wired into the CAP flow** — there is no `capId` field on `NonComplianceCase` and no "Create CAP from this case" action, even though it conceptually feels like it should feed into one. This is a known gap, not a bug to silently work around — if you're asked to connect NCC → CAP, that's new scope, not a fix to something that broke.

## Sidebar nav order vs. dependency order

The sidebar (`src/components/layout/Sidebar.tsx`, `buildNavTree` in `src/constants/routes.ts`) groups items as: **Main** (Dashboard) → **Compliance** (Obligations, Corrective Actions, Non-Compliance, Regulations with Assignments as a sub-item) → **Management** (Reports) → **Admin** → **Preferences**.

This order does **not** match the real dependency order (Regulation → Assignment → Obligation → CAP) — "Obligations" appears above "Regulations"/"Assignments" in the nav. A new user reading top-to-bottom hits Obligations before ever seeing a regulation or assignment to attach one to. This wasn't fixed as part of the data-model unification (that was a data-layer change) — reordering the nav to match the dependency chain is a reasonable follow-up UX task when the frontend overhaul happens.

## History: the obligation-model unification

Until mid-2026, the app had **two parallel, incompatible obligation entities** sharing the same routes:

- A legacy `ComplianceObligation` type (richer: approver/reviewers, frequency, penalty, AI risk score, tags, progress, comments) linked directly to a Regulation, powering `/obligations` list/detail, all role dashboards, and the CAP obligation-picker.
- A newer `Obligation` type linked to an Assignment (the intended flow entry point), powering only `/obligations/create` and the Owner Dashboard widget.

Because these were separate mock datasets with separate id prefixes (`cmp-*` vs `obg-*`), obligations created via the real intended flow (Assignment → bulk-create) never appeared on the `/obligations` list, and `CAP.obligationIds` silently mixed both id namespaces — CAPs linked to the newer type resolved as "not found" stubs on the CAP detail page.

This was fixed by collapsing both into one canonical `Obligation` entity (superset of both field sets, `src/types/obligation.ts`) with one mock dataset (`db.obligations`), one service/hook/handler stack, and every consumer repointed to it. See git history around the "unify ComplianceObligation and Obligation" commit for the full diff. **If you encounter references to `ComplianceObligation`, `useComplianceList`, `compliance_service`, or `db.compliance` anywhere, that's dead/stale — they were removed.**

## Relationship to specs

`docs/specs/P1_Foundation_Setup.md` through `P5_Reporting_Admin_Analytics.md` describe a **larger, partially different product** than what's built: they mention License Management, a standalone Evidence Library, an Enterprise Knowledge Center, and Compliance Templates, none of which exist in `src/pages`. Conversely, the Assignment and NCC modules exist in code but aren't mentioned in the specs at all. **Treat `docs/specs/*` as historical/aspirational, not as ground truth for current behavior.** This file (`docs/USER_FLOW.md`) and `docs/DOX.md` reflect what's actually built.

## Key files by step

| Step | Types | Service/hooks | Mock handlers | Pages |
|---|---|---|---|---|
| Regulation | `src/types/regulation.ts` | `regulation_service.ts`, `useRegulationQueries.ts` | `regulation_handlers.ts` | `src/pages/regulation/*` |
| Assignment | `src/types/assignment.ts` | `assignment_service.ts`, `useAssignmentQueries.ts` | `assignment_handlers.ts` | `src/pages/assignment/*` |
| Obligation | `src/types/obligation.ts` | `obligation_service.ts`, `useObligationQueries.ts`, `useObligationMutations.ts` | `obligation_handlers.ts` | `src/pages/obligations/*` |
| CAP | `src/types/cap.ts` | `cap_service.ts` (or equivalent), `useCAPQueries.ts`, `useCAPMutations.ts` | `cap_handlers.ts` | `src/pages/cap/*` |
| NCC | `src/types/ncc.ts` | `ncc_service.ts` | `ncc_handlers.ts` | `src/pages/ncc/*` |
| RBAC/nav | `src/constants/rbac.ts`, `src/constants/routes.ts` | — | — | `src/components/layout/Sidebar.tsx` |
| Mock DB | — | — | `src/mocks/db.ts`, `src/mocks/curated-data.ts` | — |
