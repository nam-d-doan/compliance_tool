# LM — Sample Data Spec (30 cases)

Used to generate data in `mocks/db.ts` at GĐ1. Dates are offsets from `DEMO_TODAY` (2026-07-11, an existing constant in `mocks/db.ts`), not `new Date()`, so the demo stays stable over time — following the existing `curated-data.ts` convention.

## Distribution by stage (6 cases per stage = 30)

| Stage | # cases | Milestone status |
| --- | --- | --- |
| Litigation filed | 6 | 4 on schedule, 1 behind plan (date pushed back), 1 created today |
| Case accepted | 6 | 4 on schedule, 2 behind plan |
| Mediation | 6 | 5 on schedule, 1 approaching mediation deadline |
| Trial | 6 | 4 on schedule, 2 with rescheduled trial date |
| Enforcement | 6 | 3 in progress, 3 near completion (enforcement milestone nearly done) |

## Red Flag — must cover all 3 statuses for testing

- **5 overdue cases** (deadline passed, not yet handled) — spread across deadline types: appeal, court fee, enforcement extension
- **5 cases approaching deadline** (1-3 days left, within the placeholder warning threshold in `00-decisions.md`)
- **5 cases with resolved alerts** (have acknowledgment + resolution history, to test KPI c)
- Remaining: no upcoming legal deadlines (clean baseline, no noise)

## Priority distribution (to test workload weighting)

- critical: 3 cases
- high: 8 cases
- medium: 14 cases
- low: 5 cases

## Specialist / unit distribution (for KPI e — per-person/unit efficiency)

- 5 specialists (`owner` role), clearly uneven workload: person A 10 cases, B 8, C 6, D 4, E 2 — so the assignment dialog shows a clear difference when suggesting the least-loaded person
- Department/unit: reuse the existing list in `mocks/db.ts` — prioritize `Legal`, `Retail Banking`, `Corporate Banking`, `Credit Risk`, `Operations`
- Case category: spread evenly across the 6 categories in `00-decisions.md` section 2 (~5 cases/category)

## Attached documents (for KPI d)

- 20 cases: have all required documents for their current stage (per the checklist in `00-decisions.md` section 4)
- 10 cases: missing at least 1 required document — so KPI d doesn't show a fake 100%

## Activity history (CaseEvent) — for audit trail + KPI b

- Every case: at least 1 "created" event
- Cases that have passed ≥ 2 milestones: a "progress update" event for each milestone passed
- 3 cases INTENTIONALLY missing an update event for 1 passed milestone — so KPI b (complete progress updates) doesn't show 100%

## Outstanding debt and collateral (display only, not used in KPI calc)

- Outstanding debt: random 500 million to 15 billion VND, skewed by case category (corporate higher than individual)
- Collateral: short descriptions in the style already used in `curated-data.ts` (real estate, cars, savings books...)

## Seeding tasks (GĐ1)

- [ ] Write a function to generate 30 `LitigationCase` records per the table above in `mocks/db.ts`, seeded with `faker.seed(42)` like other entities
- [ ] Generate child `CaseMilestone` records for each case based on its current stage
- [ ] Generate `LegalDeadline` records per the "Red Flag" section above
- [ ] Generate `CaseEvent` records per the "Activity history" section
- [ ] Attach `fileIds` for the 20 fully-documented cases, leave empty/partial for the remaining 10
