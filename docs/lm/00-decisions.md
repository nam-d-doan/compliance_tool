# LM — GĐ0 Decisions (Design Sign-off)

> Status: DRAFT. Items marked "⏳ PENDING APPROVAL" are provisional — coded with a default value so they don't block progress, but must be corrected once confirmed.

## 1. `business_unit` role ⏳ PENDING NAM'S APPROVAL

**Provisional decision:** Do NOT add a new role in GĐ1. The business unit temporarily uses the existing `owner` role, filtering cases by `ownerDepartmentId`. Reason: adding a new role touches the `Role` type, `ROLE_HIERARCHY`, `ROLE_PERMISSIONS`, `demo-users.ts`, `DashboardRedirect`, `ROUTE_PERMISSIONS` — it affects the whole app, and reverting it would be costly if Nam doesn't approve.

If Nam approves adding `business_unit`: do it on a separate branch later, it won't block GĐ1-4.

## 2. Case category (for KPI e)

Proposed, use as-is (low risk, easy to change since it's just one enum):

- Individual credit bad debt
- Corporate credit bad debt
- Credit contract dispute
- Collateral asset handling
- Civil judgment enforcement
- Other

## 3. Legal deadline types + advance notice days ⏳ PENDING LEGAL TEAM CONFIRMATION

**The numbers below must NOT be treated as legally accurate.** They are placeholders only, so `AlertRule` has a value to run the demo with. Must check with the legal department before using in production.

| Deadline type | Advance notice days (placeholder) |
| --- | --- |
| Appeal | 15 |
| Court fee payment | 7 |
| Enforcement extension | 30 |
| Other | 7 |

## 4. Required document checklist by stage — for KPI d

Proposed, easy to change (just a display list + complete/missing check):

| Stage | Required documents |
| --- | --- |
| Litigation filed | Lawsuit petition; Credit contract; Disbursement documents |
| Case accepted | Court's notice of case acceptance |
| Mediation | Mediation minutes (if mediation occurred) |
| Trial | Court judgment/decision |
| Enforcement | Enforcement decision; Enforcement minutes |

## 5. Workload calculation method

Weight by `PriorityLevel` (already in `constants/status.ts`), multiplied by the specialist's number of open cases:

```
low = 1, medium = 2, high = 3, critical = 5
workload(person) = Σ priority weight of open cases assigned to that person
```

The person with the lowest workload is suggested when assigning.

## 6. Case code format

`LM-YYYY-NNN` (e.g. `LM-2026-001`), same pattern as Obligation's `OBG-YYYY-NNN` code. Auto-generated in the handler.

## 7. Bid submission deadline / demo date

**Confirmed:** first meeting on 05/10/2026. If time is tight, cut in this order: simulated AI → KPI CSV export → simulated Core Banking integration (drop these 3 first, keep GĐ1-2 intact since that's the core business logic).
