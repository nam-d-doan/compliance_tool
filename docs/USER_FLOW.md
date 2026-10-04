# User Flow Guide

Comprehensive step-by-step guide to the compliance tracker's workflows, actions, and system linkages. Covers all user roles and their permission-based access patterns.

## Quick Reference: Demo Accounts

All accounts use password: `demo1234`

| Role      | Email                | Primary Actions                                        | Dashboard Access    |
| --------- | -------------------- | ------------------------------------------------------ | ------------------- |
| Admin     | `admin@demo.com`     | User/role management, AI config, org setup, audit logs | Admin Dashboard     |
| Executive | `executive@demo.com` | Org-wide oversight, executive reports, risk monitoring | Executive Dashboard |
| Owner     | `owner@demo.com`     | Creates obligations, manages CAPs, drives completion   | Owner Dashboard     |
| Approver  | `approver@demo.com`  | Reviews/approves obligations and CAPs                  | Approver Dashboard  |

Role permissions defined in `src/constants/rbac.ts`. Route access in `src/constants/routes.ts`.

---

## 1. Regulation Management

### 1.1 Regulation Library (`/regulation`)

**Who can access:** Admin, Executive, Owner

**Actions:**

- **View Regulations:** Browse full regulation catalog with status badges (Draft/Effective/Superseded)
- **Search/Filter:** By title, status, regulator, date range
- **Quick Actions:** Edit, View Details, Create New

**Key Features:**

- Regulation cards show: title, regulator, status, effective date, article count
- Status-based filtering highlights active vs. archived regulations
- Bulk actions for status updates

**Navigation Path:**

```
Sidebar → Regulation → Library
```

### 1.2 Create Regulation (`/regulation/create`)

**Who can access:** Admin, Executive, Owner

**Step-by-Step:**

1. **Basic Info:** Title, regulator, status (defaults to Draft), effective date
2. **Articles:** Add regulation articles one by one:
   - Article number
   - Article title
   - Full text content
   - Category/Topic tags
3. **VietLex Integration** (simulated): Search for external regulations to import
4. **AI Assist:** (simulated) Automatic article extraction from pasted text
5. **Save as Draft** or **Publish** (sets status to Effective)

**System Linkages:**

- Creates `Regulation` record in `src/mocks/db.ts`
- Auto-generates regulation ID (REG-YYYY-NNN format)
- Fires API: `POST /api/regulations`

### 1.3 Regulation Detail (`/regulation/:id`)

**Who can access:** All roles (view-only for non-Admin/Owner)

**Key Sections:**

- **Header:** Title, status, regulator, effective dates, status badges
- **Articles List:** Expandable article cards with full text
- **Linked Obligations:** Scrollable list of obligations derived from this regulation
- **Action Buttons:** Edit (Admin/Owner), Impact Analysis

**Navigation:**
From Library → Click regulation card OR from direct link

### 1.4 Impact Analysis (`/regulation/:id/impact`)

**Who can access:** Admin, Executive, Owner

**Analysis Areas:**

- **Department Impact:** Which departments are affected
- **Risk Score:** AI-calculated impact severity
- **Implementation Timeline:** Suggested rollout schedule
- **Resource Requirements:** Staffing and tool needs

---

## 2. Assignment Management

### 2.1 Assignment List (`/assignment`)

**Who can access:** All roles (view-only for non-Admin/Owner)

**Key Features:**

- Filter by status, department, due date, priority
- Sort by due date, priority, creation date
- Quick status updates via dropdown
- Bulk status changes

**Card Information:**

- Assignment title and regulation reference
- Assigned departments
- Due date with urgency indicators
- Status badge
- Compliance progress bar
- Quick action buttons

### 2.2 Create Assignment (`/assignment/create`)

**Who can access:** Admin, Executive, Owner

**Step-by-Step:**

1. **Select Regulation:** Search and select from regulation library
2. **Assign Departments:** Multi-select from organization departments
3. **Set Timeline:**
   - Due date (mandatory)
   - Review dates (optional)
   - Implementation milestones
4. **Priority Level:** High/Medium/Low with color coding
5. **Description:** Assignment purpose and scope
6. **Save** → Creates assignment record

**System Linkages:**

- Links Assignment to Regulation
- Triggers obligation creation workflow
- Updates dashboard counts

### 2.3 Assignment Detail (`/assignment/:id`)

**Who can access:** All roles (edit permissions for Admin/Owner)

**Key Sections:**

- **Assignment Header:** Title, regulation link, departments
- **Timeline View:** Gantt-style timeline with milestones
- **Obligations Tab:** All obligations created from this assignment
  - Create new obligations button
  - Bulk obligation creation from regulation articles
  - Status tracking for each obligation
- **Activity Feed:** Comments, status changes, approvals

**Action Buttons:**

- **Create Obligations:** Bulk create from regulation articles
- **Edit Assignment:** Update departments, dates, priority

---

## 3. Obligation Management

### 3.1 Obligation List (`/obligations`)

**Who can access:** All roles

**Filtering/Sorting:**

- Status filters: Draft/Pending/In-Review/Approved/Completed/Overdue
- Department filters
- Due date ranges
- Priority levels
- Risk score ranges

**Card Display:**

- Obligation code and title
- Regulation reference
- Owner and approver
- Due date with urgency indicator
- Progress percentage
- Status badge
- Risk score indicator
- Quick action buttons

### 3.2 Create Obligation (`/obligations/create`)

**Routes:**

- Standalone: `/obligations/create`
- From Assignment: `/obligations/create?assignmentId=...`

**Who can access:** Owner, Admin (assignment-based only)

**Creation Flow:**

1. **Source Selection:**
   - Manual entry
   - From Assignment (auto-fills regulation connection)
   - AI Assist (simulated text parsing)
2. **Obligation Details:**
   - Unique code (auto-generated)
   - Title and description
   - Regulation article reference
   - Department assignment
   - Owner assignment
   - Approver assignment
3. **Compliance Details:**
   - Due date
   - Frequency (one-time/recurring)
   - Priority level
   - Risk factors
   - Penalty amount
4. **Evidence Requirements:** What constitutes compliance
5. **Save as Draft** or **Submit for Review**

### 3.3 Obligation Detail (`/obligations/:id`)

**Who can access:** All roles (role-based actions)

**Tab Navigation:**

- **Overview Tab:** Complete obligation details, status, timeline
- **Evidence Tab:** Upload/download compliance evidence
- **Activity Tab:** Comments, status changes, approvals
- **Linked Regulations:** Reference to parent regulation

**Action Buttons (role-based):**

- **Owner:** Edit, Upload Evidence, Create CAP
- **Approver:** Approve/Reject, Request Changes
- **Executive:** View Only

**Status Workflow:**

1. **Draft** → **Pending Review** (Owner submits)
2. **Pending Review** → **Approved** OR **Rejected** (Approver decision)
3. **Approved** → **Completed** (Owner marks complete)
4. Any status can generate **CAP** if non-compliant

---

## 4. Corrective Action Plans (CAPs)

### 4.1 CAP List (`/cap/list`)

**Who can access:** All roles

**Unified View Info:**

- **Summary Cards:** Compliance Rate, CAP Status, Urgency Metrics
- **Chart Widgets:** CAP Trend, Risk Distribution, Owner Performance
- **Filters Table:** Status, assignee, due date, priority
- **Action Buttons:** Create, Bulk Actions, Export

**Key Features:**

- Role-aware view (all users see same page, different data)
- Progress indicators for each CAP
- Risk scoring and priority flags
- Linked obligations references

### 4.2 Create CAP (`/cap/create`)

**Who can access:** Owner, Admin

**Creation Routes:**

- From Obligation: `/cap/create?obligations=id1,id2`
- Standalone: `/cap/create`

**Step-by-Step:**

1. **Link Obligations:** Select obligations that need corrective action
2. **Root Cause Analysis:**
   - AI-generated causes (simulated)
   - Manual cause selection
3. **Recommended Actions:**
   - AI-suggested actions (simulated)
   - Manual action items with owner assignment
4. **Timeline Planning:**
   - Due date (auto-calculated from risk level)
   - Milestone creation
5. **Resources Required:** People, tools, budget
6. **Risk Assessment:** Implementation risk factors
7. **Save Draft** or **Submit for Approval**

### 4.3 CAP Detail (`/cap/:id`)

**Who can access:** All roles (role-based actions)

**Page Structure:**

- **Header:** CAP title, status, risk level, linked obligations
- **Progress View:** Timeline with completion status
- **Actions Tab:** Action items, owners, due dates
- **Evidence Tab:** Progress evidence and documentation
- **Comments Tab:** Discussion and status updates

**Status Workflow:**

1. **Draft** → **Pending Approval** (Owner submits)
2. **Pending Approval** → **Approved** OR **Rejected** (Approver)
3. **Approved** → **In Progress** (Owner starts implementation)
4. **In Progress** → **Completed** (All actions complete)
5. **Rejected** → **Draft** (Owner revises)

---

## 5. Non-Compliance Cases (NCCs)

### 5.1 NCC List (`/ncc/list`)

**Who can access:** All roles

**Dashboard Elements:**

- Summary cards with KPI metrics
- Trend charts for NCC creation/closure
- Severity distribution pie chart
- Filterable NCC table

**Filter Options:**

- Status: Open/Closed/Escalated
- Severity: Critical/High/Medium/Low
- Department
- Date Range

### 5.2 Create NCC (`/ncc/create`)

**Who can access:** Owner, Admin

**Required Fields:**

- Reference to regulation/obligation
- Description of non-compliance
- Severity level
- Business impact assessment
- Affected departments
- Root cause analysis
- Mitigation requirements

### 5.3 NCC Detail (`/ncc/:id`)

**Who can access:** All roles

**Tracking Elements:**

- **Case Overview:** Initial report details and status
- **Investigation Tab:** Findings and analysis
- **Actions Tab:** Remediation steps and owners
- **Timeline Tab:** Key milestones and deadlines
- **Comments Tab:** Team communication

---

## 6. Report Generation

### 6.1 Reports Index (`/reports`)

**Who can access:** Executive, Admin, Owner, Approver

**Report Types:**

- **Executive Summary** (`/reports/executive`): Org-wide health overview
- **CAP Report** (`/reports/cap`): CAP performance and trends
- **Early Warning System** (`/reports/ews`): Risk indicators and alerts
- **Status Report** (`/reports/status`): Detailed obligation status
- **Calendar Report** (`/reports/calendar`): Due dates and deadlines

**Navigation:**

```
Sidebar → Reports → [Report Type]
```

### 6.2 Executive Summary (`/reports/executive`)

**Who can access:** Executive, Admin

**Content Sections:**

- **AI Executive Summary:** Organization-wide insights and recommendations
- **Key Insights:** AI-generated compliance highlights
- **Recommended Actions:** Prioritized improvement suggestions
- **Risk Heatmap:** Department-by-department compliance risks
- **Chart Analysis:** Status trends, priority distribution

**Features:**

- Filterable date ranges
- Department-specific views
- Export to PDF
- Confidence indicators for AI content

### 6.3 CAP Report (`/reports/cap`)

**Who can access:** Executive, Admin, Owner

**Report Sections:**

- **CAP Overview KPIs:** Total, completed, overdue, effectiveness
- **Trend Analysis:** CAP creation and closure rates
- **Owner Performance:** CAP completion by department/owner
- **Risk Distribution:** High-priority and overdue CAPs
- **Detailed CAP Table:** All CAPs with status and progress

### 6.4 Early Warning System (`/reports/ews`)

**Who can access:** Executive, Admin

**Alert Categories:**

- **Risk Alerts:** Emerging compliance risks
- **Status Triggers:** Overdue obligations, failing metrics
- **Regulatory Changes:** New or updated regulations
- **Performance Indicators:** Department-level warnings

### 6.5 Status Report (`/reports/status`)

**Who can access:** Executive, Admin, Owner, Approver

**Content Areas:**

- **Overall Compliance Metrics:** Completion rates, trends
- **Department Performance:** Status by business unit
- **Regulatory Coverage:** Obligations by regulation
- **Risk Analysis:** High-risk areas and recommendations
- **Detailed Breakdown:** Individual obligation status

### 6.6 Calendar Report (`/reports/calendar`)

**Who can access:** Executive, Admin, Owner, Approver

**Calendar View:**

- **Monthly Calendar:** Due dates, reviews, deadlines
- **Color Coding:** Obligation type, priority level
- **Upcoming Deadlines:** 30-day outlook list
- **Department Filter:** View specific commitments

---

## 7. Dashboard Workflows

### 7.1 Navigation Structure

**Sidebar Menu (`src/components/layout/Sidebar.tsx`):**

```
📊 Dashboard (role-specific)
📘 Regulation
   ├─ Library
   ├─ Create
   └─ Impact Analysis
📋 Assignment
   ├─ List
   └─ Create
📝 Obligations
   ├─ List
   └─ Create
🚨 CAP
   ├─ List
   ├─ Create
   └─ [CAP Details]
⚠️ NCC
   ├─ List
   ├─ Create
   └─ [NCC Details]
📈 Reports
   ├─ Index
   ├─ Executive Summary
   ├─ CAP Report
   ├─ Early Warning
   ├─ Status Report
   └─ Calendar
⚙️ Admin (Admin only)
   ├─ Users
   ├─ Roles
   ├─ Organization
   ├─ AI Config
   └─ Audit Logs
```

### 7.2 Role-Specific Dashboards

#### Admin Dashboard (`/dashboard`)

- **System Metrics:** User counts, role distribution
- **Security Overview:** Recent logins, failed attempts
- **AI Performance:** Model usage, confidence scores
- **Recent Activities:** Audit log summary

#### Executive Dashboard (`/dashboard`)

- **Org Health Score:** Overall compliance percentage
- **Risk Heatmap:** Department-level risk visualization
- **Key Metrics:** Overdue items, upcoming deadlines
- **Trend Charts:** Status trends, risk indicators
- **AI Insights:** Executive-level recommendations

#### Owner Dashboard (`/dashboard`)

- **My Obligations:** Personal obligation status breakdown
- **CAP Summary:** Active CAPs and progress
- **Upcoming Deadlines:** 30-day calendar view
- **Risk Indicators:** High-priority items
- **Quick Actions:** Create obligation, update status

#### Approver Dashboard (`/dashboard`)

- **Pending Reviews:** Obligations requiring approval
- **CAP Approvals:** CAPs ready for review
- **Team Performance:** Compliance rates by department
- **Overdue Alerts:** Items needing attention
- **Quick Approvals:** Batch approval actions

---

## 8. Admin Operations

### 8.1 User Management (`/admin/users`)

**Who can access:** Admin

**User Operations:**

- Create new user accounts
- Edit existing user profiles
- Assign/departments and roles
- Manage user status (Active/Inactive)
- Password reset simulation

**Required Fields:**

- Name (Vietnamese format preferred)
- Email
- Role assignment
- Department assignment
- Phone number

### 8.2 Role Management (`/admin/roles`)

**Who can access:** Admin

**Role Configuration:**

- View permission matrix
- Edit role permissions
- Create custom role definitions
- Assign permissions by module

**Permission Categories:**

- Regulations (create, edit, delete, view)
- Assignments (create, edit, delete, view)
- Obligations (create, edit, delete, view)
- CAPs (create, edit, delete, approve, view)
- NCCs (create, edit, delete, view)
- Reports (view, export)

### 8.3 Organization Setup (`/admin/organization`)

**Who can access:** Admin

**Organization Structure:**

- Company name and industry
- Jurisdictions (Vietnam regions)
- HO Departments (Head Office departments)
- Branch Offices (regional branches)

**Data Validation:**

- Required fields for locations
- Unique branch selection
- Import/Export capabilities

### 8.4 AI Configuration (`/admin/ai-config`)

**Who can access:** Admin

**AI Settings:**

- Model selection (simulated options)
- Confidence thresholds
- Response templates
- Rate limiting
- Feature toggles

### 8.5 Audit Logs (`/admin/audit-logs`)

**Who can access:** Admin

**Log Categories:**

- User authentication
- Data changes (create/update/delete)
- Permission changes
- System configuration
- Data exports

**Search/Filter:**

- Date range filtering
- User-specific logs
- Action type filtering
- Export capabilities

---

## 9. Common Interaction Patterns

### 9.1 Status Badges and Color Coding

**Standard Status Colors:**

- **Green:** Complete, Approved, Low Risk
- **Yellow:** In Progress, Pending Review, Medium Risk
- **Red:** Overdue, Rejected, High Risk
- **Blue:** Draft, Active
- **Gray:** Archived, Superseded

### 9.2 Permission-Based UI

**Element Visibility:**

- **Create Buttons:** Owner, Admin, Executive (context-dependent)
- **Edit Buttons:** Owner, Admin (own items only)
- **Approve/Reject:** Approver role only
- **Delete Options:** Admin, Owner (own items only)
- **Export Options:** Executive, Admin

### 9.3 Data Persistence Flow

**Mock Data Architecture:**

- All data stored in `src/mocks/db.ts`
- Changes persist during browser session
- Page reload resets to initial/demo state
- API calls handled by MSW in `src/mocks/handlers/`

### 9.4 Search and Filter Patterns

**Common Filters:**

- Status dropdown multi-select
- Department selector
- Date range picker
- Text search by title/description
- Priority level filters

**Keyboard Shortcuts:**

- `/`: Focus search
- `Esc`: Close modals
- `Enter`: Submit forms
- `Ctrl/Cmd + K`: Global search

### 9.5 Modal and Sheet Interactions

**Common Modals:**

- **Confirmation Dialogs:** Delete actions, status changes
- **Filter Dialogs:** Advanced search options
- **Create/Edit Forms:** Standard create/edit workflows

**Sheet Components:**

- **AI Explanation:** Right-side sheet for AI insights
- **Detail Views:** Expanded information panels
- **Activity Feeds:** Comment and status update panels

---

## 10. Error Handling and Edge Cases

### 10.1 Loading States

- Skeleton loaders for data fetching
- Progress bars for long operations
- Toast notifications for quick feedback

### 10.2 Error Recovery

- Retry buttons on failed operations
- Graceful degradation for missing data
- Clear error messages with suggested actions

### 10.3 Data Validation

- Form validation with inline error messages
- Required field indicators
- Constraint validation (dates, ranges, formats)

---

## 11. Mobile and Responsive Behavior

### 11.1 Navigation

- **Mobile (<lg):** Hamburger menu, collapsible sections
- **Desktop (≥lg):** Full sidebar presented
- **Icon-only navigation:** On tablets (md screens)

### 11.2 Data Tables

- **Mobile:** Card-based view for tabular data
- **Desktop:** Full table with sortable columns
- **Tablet:** Hybrid view with pagination

### 11.3 Charts and Visualizations

- **Mobile:** Tappable legends, simplified axes
- **Desktop:** Full interactions, tooltips, zoom
- **Responsive sizing:** Chart containers adapt to screen size

---

## 12. CMS modules — Nam A Bank RFQ Phụ lục 1

The app uses the bank's **3 risk levels** (Low / Medium / High — Thấp / Trung bình / Cao) everywhere.

### 12.0 Language and navigation

- **Language:** Vietnamese by default; the round **VI / EN** button in the top bar (also on the login page) switches instantly without reloading (demo data is kept). The choice is remembered per browser. How it works: the app is written in English and `src/i18n/translator.ts` swaps every rendered English text, placeholder, tooltip and aria-label for its Vietnamese translation from `src/i18n/vi/*.ts` (exact phrases) and `src/i18n/patterns.ts` (dates, counts, messages built at runtime). New English UI text must get a dictionary entry; in dev, `window.__i18nMissing()` lists English text seen on screen without a translation. Mark an element `data-no-translate` to leave it alone, or give it `data-vi="…"` for a context-specific (e.g. shorter) Vietnamese label.

- **Top menu (6 tabs):** Dashboard · Legal Updates · Regulations · Internal Regs (QĐNB) · Issues & CAPs · Reports. Grouped tabs show the sum of their pages' badges; exactly one tab is highlighted (longest matching route prefix).
- **Sub-menus** (same frosted bar as Administration, `components/layout/SubNav.tsx`, items in `constants/subNavs.ts`) appear above the list pages of each area; detail and create pages keep their breadcrumbs only. All addresses are unchanged.
  - Legal Updates: Inbox & Alerts · **Legal Mapping ★** (`/legal-mapping`) · Assignments
  - Regulations: Library · Obligations · Compare
  - Internal Regs (QĐNB): Real-time Tracker · Late-issuance Alerts (`/reports/late-issuance`)
  - Issues & CAPs: Issues (NCC) · CAPs · Escalations (`/ncc/escalations`)
  - Reports: Executive Summary · Periodic Reports · Internal Control Issues · Early Warning · Status · CAP · Calendar · Audit Trail (`/reports/audit-trail`, executive + admin)
- **Dashboard → CMS feature map:** 5 cards, one per Phụ lục 1 group, listing each feature with its RFQ code, a live number and a link (Smart search opens Ctrl+K; AI/OCR opens `/legal-updates?ocr=1`). Can be hidden; the choice is remembered per browser.

### 12.1 Legal Updates (`/legal-updates`, `/legal-updates/:id`) — RFQ 1.1–1.3

- Inbox of new legal documents with AI field, relevance and effective-date countdown. **Sync now** pulls new documents from the simulated feed; **Upload document (OCR)** extracts a document from a file.
- Detail page step bar: Received → Applicability → Impact & AI summary → Legal mapping → Assignment → Tracking.
- Legal mapping: AI-suggested internal regulations (QĐNB) with confidence; accept/reject, choose Amend/Supplement/Replace/Repeal/Issue new, add QĐNB manually; relationship map ("Lược đồ").
- **Legal Mapping page** (`/legal-mapping`): all laws → QĐNB → lead units on one map (hover/click highlights links, dashed = AI suggestion), plus a laws × QĐNB matrix. "Open full Legal Mapping" on the detail page's mapping step links here.
- Assignment creates one revision task per QĐNB (lead + supporting units, deadline, reminder schedule) and notifies the units.

### 12.2 Internal Regulations (`/qdnb`, `/qdnb/:id`) — RFQ 2.1–2.3

- Board / table / register views; KPIs: Not yet revised, In revision, Awaiting approval, Issued, Overdue, Late-issuance risk.
- Revision workflow: Start → Submit draft → Compliance review (return possible) → Approval → Record issuance (decision number, dates and signed file are required). Issuing creates a new version; **Versions & compare** shows the diff.

### 12.3 Issues (NCC) (`/ncc/list`, tabs Register · ICIS Inbox · Trends) — RFQ 3.1–3.3

- Every issue has a **source** (ICIS, SBV inspection, audits, self-check, monitoring, complaints), category and risk rating.
- ICIS Inbox: accept a finding as an issue (with suggested rating), merge into a similar open issue, or reject.
- Issue detail: Check → Submit evidence → Compliance review (accept/return) → Approve closure; reminders and escalations shown on the page.

### 12.4 Risk Matrix & Escalation (`/admin/risk-matrix`, `/admin/escalation-rules`) — RFQ 4.1–4.3

- 4 weighted criteria (fine, reputation, scope, recurrence), thresholds, live preview, versioned approval.
- **Escalations page** (`/ncc/escalations`, under Issues & CAPs): every escalation with level/status filters and Acknowledge.
- High risk escalates immediately to the Ban Điều hành & Ban Kiểm soát; overdue items escalate at +1 / +7 / +15 days.

### 12.5 Reports, search, audit — RFQ 5.x

- Reports sub-menu: Periodic Reports (A4 preview, PDF/Excel download), Internal Control Issues Dashboard, Audit Trail, plus the existing reports. Late Issuance Alerts sits under Internal Regs (QĐNB).
- Search (Ctrl+K): Semantic (AI) or Keyword across laws, QĐNB, articles and issues.
- Audit Logs record every action; History panels on legal updates, QĐNB revisions and issues.

### 12.6 Demo controls

- Calendar-clock button in the top bar: move the demo date +1 / +7 / +30 days to trigger reminders, overdue alerts and escalations live. **Reset demo** reloads the sample data.
