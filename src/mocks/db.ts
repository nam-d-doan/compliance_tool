import { faker } from "@faker-js/faker";
import { addDays, subDays, formatISO, startOfDay } from "date-fns";
import { DEMO_USERS } from "@/constants/demo-users";
import { CAP_STATUSES, USER_STATUSES } from "@/constants/status";
import type {
  UserProfile,
  RoleEntity,
  Organization,
  AuditLog,
  AIConfig,
  OrganizationSettings,
  Regulation,
  Article,
  CAP,
  CAPAction,
  Notification,
  ObligationTimelineEvent,
  CAPTimelineEvent,
  ObligationComment,
  CAPComment,
  RegulationDependency,
  Assignment,
  AssignmentTimelineEvent,
  Obligation,
  FileAttachment,
  NonComplianceCase,
  LegalUpdate,
  InternalRegulation,
  RevisionTask,
  IcisFinding,
  RiskMatrix,
  EscalationRule,
  ReportTemplate,
  ScheduledReport,
} from "@/types";
import {
  generateRiskMatrices,
  generateEscalationRules,
  generateInternalRegulations,
  generateLegalUpdates,
  generateIncomingLegalQueue,
  generateRevisionTasks,
  generateIcisFindings,
  generateIssues,
  generateReportTemplates,
  generateScheduledReports,
} from "@/mocks/cms-seed";
import {
  generateCmsAuditLogs,
  generateCmsNotifications,
} from "@/mocks/cms-engine";
import {
  CURATED_REGULATIONS,
  CURATED_DEPENDENCIES,
  CURATED_ASSIGNMENTS,
  CURATED_OBLIGATIONS,
  CURATED_CAPS,
} from "@/mocks/curated-data";

faker.seed(42);

// Reference date for the seed data: the start of the real current day, so
// due dates and "days remaining" look the same whenever the demo is
// presented (the UI compares against the real date + demo clock offset).
// Data is still deterministic within a day. Other mock handlers that compute
// overdue/derived stats against seed data should import this rather than
// calling `new Date()` directly, to stay consistent with it.
export const DEMO_TODAY = startOfDay(new Date());
const today = DEMO_TODAY;

const DEPARTMENTS = [
  "Risk Management",
  "Compliance",
  "AML Compliance",
  "Internal Audit",
  "Internal Control",
  "Treasury & ALM",
  "Finance",
  "Credit Risk",
  "Information Technology",
  "Operations",
  "Legal",
  "Retail Banking",
  "Corporate Banking",
  "Board Office",
] as const;

const BUSINESS_UNITS = [
  "Retail Banking",
  "Corporate Banking",
  "Wealth Management",
  "Investment Banking",
  "Insurance",
  "Operations",
  "Technology",
] as const;

const LOCATIONS = [
  "New York",
  "London",
  "Singapore",
  "Hong Kong",
  "Tokyo",
  "Sydney",
  "Dubai",
  "Frankfurt",
] as const;

const REGULATORS = [
  "Ngân hàng Nhà nước Việt Nam (SBV)",
  "Quốc hội Việt Nam (National Assembly)",
  "Ủy ban Chứng khoán Nhà nước (UBCKNN)",
  "Basel Committee on Banking Supervision",
] as const;

const CATEGORIES = [
  "An toàn vốn",
  "Quản lý rủi ro tín dụng",
  "Rửa tiền",
  "Bảo vệ người tiêu dùng",
  "Quản lý rủi ro hoạt động",
  "Báo cáo tài chính",
  "Quản trị nội bộ",
  "Dịch vụ chứng khoán",
  "Phòng chống khủng bố tài chính",
  "Bảo mật thông tin",
  "Quản lý rủi ro thanh khoản",
  "Quản lý rủi ro gian lận",
] as const;

const FREQUENCIES = [
  "once",
  "monthly",
  "quarterly",
  "biannually",
  "annually",
] as const;

function iso(date: Date | number): string {
  return formatISO(typeof date === "number" ? new Date(date) : date);
}

function randomDate(start: Date, end: Date): Date {
  return faker.date.between({ from: start, to: end });
}

function pick<T>(arr: readonly T[]): T {
  return faker.helpers.arrayElement(arr);
}

function uid(prefix: string): string {
  return `${prefix}-${faker.string.alphanumeric({ length: 12, casing: "lower" })}`;
}

function pad(num: number, len = 3): string {
  return num.toString().padStart(len, "0");
}

function generateStaffUsers(count = 15): UserProfile[] {
  // Vietnamese person-name pools (the rest of the mock data is already in
  // Vietnamese; faker's default locale yields English names, so we draw from
  // curated Vietnamese pools instead).
  const FIRST_NAMES = [
    "Nam",
    "Hùng",
    "Dũng",
    "Tuấn",
    "Minh",
    "Long",
    "Trung",
    "Huy",
    "Quân",
    "Bảo",
    "Giang",
    "Lan",
    "Hoa",
    "Mai",
    "Linh",
    "Ngọc",
    "Trang",
    "Hằng",
    "Thảo",
    "Quỳnh",
    "Phương",
    "Dung",
    "Hà",
    "Nhung",
    "Yến",
    "Khoa",
    "Thắng",
    "Phúc",
    "Tâm",
    "Vy",
  ];
  const LAST_NAMES = [
    "Nguyễn",
    "Trần",
    "Lê",
    "Phạm",
    "Hoàng",
    "Phan",
    "Vũ",
    "Võ",
    "Đặng",
    "Bùi",
    "Đỗ",
    "Hồ",
    "Ngô",
    "Dương",
    "Lý",
    "Đinh",
    "Lương",
    "Mai",
    "Trịnh",
    "Đoàn",
  ];
  const toHandle = (last: string, first: string) =>
    `${last}${first}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  return Array.from({ length: count }, (_, i) => {
    const firstName = faker.helpers.arrayElement(FIRST_NAMES);
    const lastName = faker.helpers.arrayElement(LAST_NAMES);
    // Vietnamese ordering: family name first.
    const fullName = `${lastName} ${firstName}`;
    const role = faker.helpers.weightedArrayElement([
      { weight: 5, value: "owner" },
      { weight: 3, value: "approver" },
      { weight: 1, value: "executive" },
    ]);
    const createdAt = randomDate(subDays(today, 400), subDays(today, 60));
    return {
      id: uid("usr"),
      email: `${toHandle(lastName, firstName)}@demo.com`,
      name: fullName,
      role,
      status: pick(USER_STATUSES),
      isActive: true,
      department: pick(DEPARTMENTS),
      businessUnit: pick(BUSINESS_UNITS),
      location: pick(LOCATIONS),
      phone: faker.phone.number(),
      lastLogin: iso(randomDate(subDays(today, 30), today)),
      avatarUrl: faker.image.avatar(),
      createdAt: iso(createdAt),
      updatedAt: iso(randomDate(createdAt, today)),
    };
  });
}

function generateDemoUserProfiles(): UserProfile[] {
  return DEMO_USERS.map((u) => ({
    ...u,
    status: "Active" as const,
    department: pick(DEPARTMENTS),
    businessUnit: pick(BUSINESS_UNITS),
    location: pick(LOCATIONS),
    phone: faker.phone.number(),
    lastLogin: iso(subDays(today, faker.number.int({ min: 0, max: 5 }))),
    avatarUrl: faker.image.avatar(),
  }));
}

function generateRegulations(): Regulation[] {
  return CURATED_REGULATIONS.map((spec) => {
    const effectiveAt = new Date(spec.effectiveDate);
    const publishedAt = subDays(
      effectiveAt,
      faker.number.int({ min: 60, max: 180 }),
    );
    const articles: Article[] = spec.articles.map((a, j) => ({
      id: `${spec.id}-art-${j + 1}`,
      number: a.number,
      title: a.title,
      summary: a.summary,
      effectiveDate: spec.effectiveDate,
      status: "active" as const,
    }));
    return {
      id: spec.id,
      title: spec.title,
      description: spec.description,
      category: spec.category,
      regulatoryBody: spec.regulatoryBody,
      effectiveDate: spec.effectiveDate,
      expirationDate: spec.expirationDate,
      status: spec.status as Regulation["status"],
      priority: spec.priority as Regulation["priority"],
      source: spec.source,
      articles,
      createdDate: iso(publishedAt),
      updatedDate: iso(randomDate(publishedAt, today)),
    };
  });
}

/**
 * Build regulation dependencies from curated data. Each dependency links
 * two regulations by stable ID (supersedes, amends, references, repeals).
 */
function generateRegulationDependencies(
  regulations: Regulation[],
): RegulationDependency[] {
  const byId = new Map(regulations.map((r) => [r.id, r]));
  return CURATED_DEPENDENCIES.filter(
    (d) => byId.has(d.from) && byId.has(d.to),
  ).map((d, i) => ({
    id: uid("dep"),
    fromRegulationId: d.from,
    toRegulationId: d.to,
    type: d.type,
    description: d.description,
    notes: d.notes,
    createdDate: iso(subDays(today, 30 + i * 5)),
  }));
}

/**
 * Build a reverse-lookup map: regulationId → set of related regulation IDs
 * appearing as either endpoint of a dependency. Used to enrich
 * `Obligation.regulationIds` and `CAP.regulationIds` with superseded /
 * amendment-related regs.
 */
function buildRegulationRelatedIndex(
  dependencies: RegulationDependency[],
): Map<string, string[]> {
  const idx = new Map<string, Set<string>>();
  for (const d of dependencies) {
    if (!idx.has(d.fromRegulationId)) idx.set(d.fromRegulationId, new Set());
    if (!idx.has(d.toRegulationId)) idx.set(d.toRegulationId, new Set());
    idx.get(d.fromRegulationId)!.add(d.toRegulationId);
    idx.get(d.toRegulationId)!.add(d.fromRegulationId);
  }
  const out = new Map<string, string[]>();
  idx.forEach((set, key) => out.set(key, Array.from(set)));
  return out;
}

/**
 * Resolve a list of regulation IDs (1..n, with optional primary) into a
 * de-duplicated array of regulation IDs expanded with dependency-related
 * entries. Accepts either a single primary ID or an array of primaries.
 * Always returns at least the primary ID(s) (so the array is never empty
 * for any obligation/cap that had a valid link in the seed).
 */
function dedupeRegIds(
  primaries: string | string[],
  related: Map<string, string[]>,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const queue = Array.isArray(primaries) ? primaries : [primaries];
  for (const id of queue) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    for (const r of related.get(id) ?? []) {
      if (!seen.has(r)) {
        seen.add(r);
        out.push(r);
      }
    }
  }
  return out;
}

/**
 * Generate the unified Obligation dataset. Every obligation links to an
 * Assignment (the real intended flow entry point: Regulation → Assignment →
 * Obligation); regulation fields are denormalized from the assignment's
 * regulation. Richer fields (approver/frequency/penalty/tags/
 * progress) come from the curated spec when present, otherwise a reasonable
 * seed default is generated so every row still reads as real data.
 */
function generateObligations(
  regulations: Regulation[],
  assignments: Assignment[],
  users: UserProfile[],
  relatedRegs: Map<string, string[]>,
): Obligation[] {
  const regById = new Map(regulations.map((r) => [r.id, r]));
  // Owner pool: prefer real owner-role users. The demo owner ("demo-owner")
  // is weighted heavily so the owner dashboard is always populated when
  // logging in as Sarah Mitchell.
  const ownerUsers = users.filter((u) => u.role === "owner");
  const demoOwner = users.find((u) => u.id === "demo-owner") ?? ownerUsers[0];
  const pickOwner = (): UserProfile =>
    demoOwner && faker.datatype.boolean(0.45)
      ? demoOwner
      : ownerUsers.length
        ? pick(ownerUsers)
        : pick(users);
  const approverUsers = users.filter(
    (u) => u.role === "approver" || u.role === "admin",
  );

  return CURATED_OBLIGATIONS.map((spec, i) => {
    const assignment = assignments[spec.assignmentIndex] ?? assignments[0];
    const regulation = regById.get(assignment.regulationId) ?? regulations[0];
    const owner = pickOwner();
    const approver = pick(approverUsers.length ? approverUsers : users);
    const dueDate = addDays(today, spec.dueOffset);
    const createdAt = subDays(today, faker.number.int({ min: 30, max: 90 }));
    const updatedAt = randomDate(createdAt, today);

    return {
      id: uid("obg"),
      code: `OBG-${today.getFullYear()}-${pad(i + 1)}`,
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      articleRef: spec.articleRef,
      title: spec.title,
      description: spec.description,
      regulationId: regulation.id,
      regulationName: regulation.title,
      regulationIds: dedupeRegIds(regulation.id, relatedRegs),
      ownerDepartmentId: assignment.assignedDepartmentIds[0] ?? "",
      ownerDepartmentName: assignment.assignedDepartmentNames?.[0],
      ownerId: owner.id,
      ownerName: owner.name,
      approverId: approver.id,
      approverName: approver.name,
      businessUnit: pick(BUSINESS_UNITS),
      department: assignment.assignedDepartmentNames?.[0] ?? pick(DEPARTMENTS),
      location: pick(LOCATIONS),
      frequency: spec.frequency ?? pick(FREQUENCIES),
      dueDate: iso(dueDate),
      riskLevel: spec.riskLevel,
      status: spec.status as Obligation["status"],
      penalty: spec.penalty ?? "Khiển trách, yêu cầu khắc phục",
      aiRiskScore: faker.number.int({ min: 15, max: 98 }),
      aiRecommendation: faker.datatype.boolean(0.4)
        ? faker.lorem.sentence()
        : undefined,
      tags: spec.tags ?? [],
      progress:
        spec.progress ??
        (spec.status === "completed"
          ? 100
          : faker.number.int({ min: 0, max: 90 })),
      createdAt: iso(createdAt),
      updatedAt: iso(updatedAt),
    };
  });
}

function generateCAPs(
  obligations: Obligation[],
  users: UserProfile[],
  relatedRegs: Map<string, string[]>,
): CAP[] {
  const ownerUsers = users.filter((u) => u.role === "owner");
  const approverUsers = users.filter(
    (u) => u.role === "approver" || u.role === "admin",
  );

  return CURATED_CAPS.map((spec, i) => {
    // `complianceIndex` is indexed modulo the unified obligations array —
    // seed CAPs no longer reference a separate legacy dataset, so this just
    // picks a stable, varied primary obligation per CAP.
    const item =
      obligations[spec.complianceIndex % obligations.length] ?? obligations[0];
    const owner = pick(ownerUsers.length ? ownerUsers : users);
    const approver = pick(approverUsers.length ? approverUsers : users);
    // Link 1-3 obligations per CAP: `item` is the primary, plus 0-2 extras.
    const extras = faker.helpers.arrayElements(
      obligations.filter((o) => o.id !== item.id),
      faker.number.int({ min: 0, max: 2 }),
    );
    const obligationIds = [item.id, ...extras.map((e) => e.id)];
    const createdAt = randomDate(subDays(today, 180), subDays(today, 14));
    const dueDate = addDays(today, spec.dueOffset);
    const status = spec.status as CAP["status"];
    const progress =
      status === "Closed" ? 100 : faker.number.int({ min: 10, max: 90 });
    const actionCount = spec.actionTitles.length;
    const actions: CAPAction[] = spec.actionTitles.map((actionTitle, j) => ({
      id: uid("act"),
      capId: "",
      title: actionTitle,
      ownerId: owner.id,
      ownerName: owner.name,
      deadline: iso(
        addDays(
          createdAt,
          ((j + 1) / actionCount) * faker.number.int({ min: 20, max: 120 }),
        ),
      ),
      status: pick(CAP_STATUSES),
      progress: faker.number.int({ min: 0, max: 100 }),
      attachments: [],
      comments: [],
      order: j,
      createdAt: iso(createdAt),
      updatedAt: iso(randomDate(createdAt, today)),
    }));
    return {
      id: uid("cap"),
      capId: `CAP-${today.getFullYear()}-${pad(i + 1)}`,
      title: spec.title,
      description: spec.description,
      priority: spec.priority,
      risk: item.riskLevel,
      ownerId: owner.id,
      ownerName: owner.name,
      approverId: approver.id,
      approverName: approver.name,
      department: item.department,
      businessUnit: item.businessUnit,
      location: item.location,
      dueDate: iso(dueDate),
      status,
      estimatedCost: spec.estimatedCost,
      actualCost: faker.number.int({ min: 0, max: spec.estimatedCost }),
      rootCause: spec.rootCause,
      obligationIds,
      // CAP regulations = union of all linked obligations' regulationIds,
      // each expanded with dependency-related IDs. Always non-empty + unique.
      regulationIds: dedupeRegIds(
        obligationIds
          .map((id) => obligations.find((o) => o.id === id)?.regulationId)
          .filter((x): x is string => Boolean(x)),
        relatedRegs,
      ),
      complianceTitle: item.title,
      actions,
      aiSuggestions: [
        {
          rootCause: spec.rootCause,
          recommendedActions: spec.actionTitles.slice(0, 3),
          timeline: `${faker.number.int({ min: 2, max: 12 })} weeks`,
          priority: spec.priority,
          estimatedEffort: `${faker.number.int({ min: 20, max: 200 })} hours`,
          confidence: faker.number.float({ min: 0.72, max: 0.94 }),
          rationale: faker.lorem.sentence(),
        },
      ],
      progress,
      tags: item.tags,
      fileIds: [],
      createdAt: iso(createdAt),
      updatedAt: iso(randomDate(createdAt, today)),
    };
  });
}

/**
 * Generate 0-2 mock file attachments per CAP. Returns the files and patches
 * each CAP's `fileIds` in place so the two collections stay linked.
 * Seeded files only carry metadata (no real binary); the `url` is a mock
 * placeholder that the UI renders as a disabled/best-effort download.
 */
const MOCK_FILE_PRESETS: {
  name: string;
  type: string;
  size: number;
}[] = [
  { name: "Root-Cause-Analysis.pdf", type: "application/pdf", size: 482_000 },
  {
    name: "Remediation-Plan.docx",
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: 76_500,
  },
  { name: "Evidence-Screenshots.png", type: "image/png", size: 1_240_000 },
  { name: "Audit-Findings.pdf", type: "application/pdf", size: 905_000 },
  {
    name: "Training-Records.docx",
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: 152_000,
  },
  { name: "Policy-Update.doc", type: "application/msword", size: 88_000 },
  { name: "Incident-Report.pdf", type: "application/pdf", size: 318_000 },
  { name: "Sign-off-Photo.jpg", type: "image/jpeg", size: 642_000 },
];

function generateFiles(caps: CAP[]): FileAttachment[] {
  const files: FileAttachment[] = [];
  for (const cap of caps) {
    const count = faker.number.int({ min: 0, max: 2 });
    if (count === 0) continue;
    const chosen = faker.helpers.arrayElements(MOCK_FILE_PRESETS, {
      min: 1,
      max: count,
    });
    const uploader = faker.helpers.arrayElement(DEMO_USERS);
    const uploadedAt = randomDate(subDays(today, 30), today);
    const capFileIds: string[] = [];
    for (const preset of chosen) {
      const id = uid("file");
      capFileIds.push(id);
      files.push({
        id,
        name: preset.name,
        size: preset.size,
        type: preset.type,
        url: `https://mock-files.example.com/caps/${cap.id}/${preset.name}`,
        uploadedAt: iso(uploadedAt),
        uploadedBy: uploader.name,
        uploadedById: uploader.id,
        capId: cap.id,
        createdAt: iso(uploadedAt),
        updatedAt: iso(uploadedAt),
      });
    }
    cap.fileIds = capFileIds;
  }
  return files;
}

/**
 * Session (login/logout) history. Business actions are generated from the
 * CMS seed in `generateCmsAuditLogs` and recorded live by the handlers.
 */
function generateSessionLogs(users: UserProfile[], count = 60): AuditLog[] {
  const now = new Date();
  return Array.from({ length: count }, () => {
    const user = pick(users);
    const timestamp = randomDate(subDays(now, 60), now);
    const action = faker.datatype.boolean(0.6) ? "login" : "logout";
    const failed = action === "login" && faker.datatype.boolean(0.04);
    return {
      id: uid("aud"),
      timestamp: iso(timestamp),
      userId: user.id,
      userName: user.name,
      action,
      object: "Session",
      module: "auth",
      ip: faker.internet.ip(),
      result: failed ? "failure" : "success",
      details: failed
        ? "Login failed — wrong MFA code"
        : action === "login"
          ? "Signed in with SSO + MFA"
          : "Signed out",
      createdAt: iso(timestamp),
      updatedAt: iso(timestamp),
    } satisfies AuditLog;
  });
}

function generateRoles(): RoleEntity[] {
  const roles: { name: string; permissions: string[] }[] = [
    {
      name: "Administrator",
      permissions: [
        "view",
        "create",
        "update",
        "delete",
        "approve",
        "export",
        "manage_users",
        "manage_ai",
        "system_config",
      ],
    },
    { name: "Owner", permissions: ["view", "create", "update", "export"] },
    { name: "Approver", permissions: ["view", "approve", "update", "export"] },
    { name: "Executive", permissions: ["view", "export"] },
  ];
  return roles.map((r, i) => ({
    id: `role-${i + 1}`,
    name: r.name,
    description: `Default ${r.name.toLowerCase()} role`,
    permissions: r.permissions as RoleEntity["permissions"],
    isSystem: true,
    userCount: DEMO_USERS.filter((u) => u.role === r.name.toLowerCase()).length,
    createdAt: iso(subDays(today, 365)),
    updatedAt: iso(subDays(today, 30)),
  }));
}

function generateOrganizations(): Organization[] {
  const orgs: { name: string; type: Organization["type"] }[] = [
    { name: "North America", type: "region" },
    { name: "EMEA", type: "region" },
    { name: "APAC", type: "region" },
    { name: "United States", type: "country" },
    { name: "United Kingdom", type: "country" },
    { name: "Singapore", type: "country" },
    { name: "Retail Banking", type: "business_unit" },
    { name: "Corporate Banking", type: "business_unit" },
    { name: "Risk & Compliance", type: "department" },
    { name: "Legal", type: "department" },
    { name: "New York Office", type: "location" },
    { name: "London Office", type: "location" },
  ];
  return orgs.map((o, i) => ({
    id: `org-${i + 1}`,
    name: o.name,
    type: o.type,
    createdAt: iso(subDays(today, 400)),
    updatedAt: iso(subDays(today, 60)),
  }));
}

function generateAIConfig(): AIConfig {
  return {
    id: "ai-config-1",
    preferredModel: "GPT-4o",
    confidenceThreshold: 0.75,
    citationDisplay: true,
    suggestionLevel: "medium",
    autoRecommendation: true,
    explainableAI: true,
    conversationRetentionDays: 90,
    createdAt: iso(subDays(today, 100)),
    updatedAt: iso(subDays(today, 10)),
  };
}

function generateOrganizationSettings(): OrganizationSettings {
  return {
    id: "org-settings-1",
    name: "Ngân hàng ACME Việt Nam",
    industry: "Dịch vụ Tài chính",
    jurisdictions: [
      "Vietnam",
      "Laos",
      "Cambodia",
      "Singapore",
      "Malaysia",
      "Indonesia",
      "China",
      "Hong Kong",
      "Taiwan",
      "South Korea",
      "Japan",
    ],
    hoDepartments: [
      { id: "dept-board", name: "Hội đồng Quản trị" },
      { id: "dept-risk", name: "Khối Quản lý Rủi ro" },
      { id: "dept-compliance", name: "Khối Tuân thủ" },
      { id: "dept-aml", name: "Khối Phòng chống Rửa tiền" },
      { id: "dept-credit", name: "Khối Quản lý Tín dụng" },
      { id: "dept-treasury", name: "Khối Kho bạc & ALM" },
      { id: "dept-finance", name: "Khối Tài chính" },
      { id: "dept-operations", name: "Khối Vận hành" },
      { id: "dept-it", name: "Khối Công nghệ thông tin" },
      { id: "dept-legal", name: "Khối Pháp chế" },
      { id: "dept-audit", name: "Khối Kiểm toán nội bộ" },
      { id: "dept-internal-control", name: "Khối Kiểm soát nội bộ" },
      { id: "dept-retail", name: "Khối Ngân hàng Bán lẻ" },
      { id: "dept-corporate", name: "Khối Ngân hàng Doanh nghiệp" },
    ],
    branches: [
      { id: "branch-hn", name: "Chi nhánh Hà Nội", region: "Miền Bắc" },
      { id: "branch-hcm", name: "Chi nhánh TP.HCM", region: "Miền Nam" },
      { id: "branch-dn", name: "Chi nhánh Đà Nẵng", region: "Miền Trung" },
      { id: "branch-cantho", name: "Chi nhánh Cần Thơ", region: "Miền Nam" },
      {
        id: "branch-haiphong",
        name: "Chi nhánh Hải Phòng",
        region: "Miền Bắc",
      },
      {
        id: "branch-nhatrang",
        name: "Chi nhánh Nha Trang",
        region: "Miền Trung",
      },
      { id: "branch-vungtau", name: "Chi nhánh Vũng Tàu", region: "Miền Nam" },
      { id: "branch-hue", name: "Chi nhánh Huế", region: "Miền Trung" },
    ],
    createdAt: iso(subDays(today, 400)),
    updatedAt: iso(subDays(today, 60)),
  };
}

export interface TimelineEvent {
  id: string;
  entityId: string;
  entityType: string;
  type: string;
  title: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Comment {
  id: string;
  entityId: string;
  entityType: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}

function generateTimelineFor(
  entityId: string,
  entityType: "obligation",
): ObligationTimelineEvent[];
function generateTimelineFor(
  entityId: string,
  entityType: "cap",
): CAPTimelineEvent[];
function generateTimelineFor(
  entityId: string,
  entityType: "regulation",
): TimelineEvent[];
function generateTimelineFor(
  entityId: string,
  entityType: "assignment",
): AssignmentTimelineEvent[];
function generateTimelineFor(entityId: string, entityType: string): unknown[] {
  const eventTypes: Record<string, string[]> = {
    obligation: [
      "created",
      "updated",
      "submitted",
      "review_required",
      "cap_in_progress",
      "approved",
      "rejected",
      "cap_created",
      "closed",
      "commented",
    ],
    cap: [
      "created",
      "assigned",
      "updated",
      "completed",
      "approved",
      "rejected",
      "commented",
    ],
    regulation: ["published", "updated"],
    assignment: [
      "created",
      "published",
      "acknowledged",
      "in_progress",
      "completed",
      "cancelled",
      "updated",
    ],
  };
  const types = eventTypes[entityType];
  const count = faker.number.int({ min: 5, max: 12 });
  return Array.from({ length: count }, (_, i) => {
    const timestamp = subDays(
      today,
      (count - i) * faker.number.int({ min: 2, max: 14 }),
    );
    const type = types[i % types.length];
    const user = pick(DEMO_USERS);
    const event: Record<string, unknown> = {
      id: uid("evt"),
      type,
      title: `${type.replace(/_/g, " ")} event`,
      description: faker.lorem.sentence(),
      userId: user.id,
      userName: user.name,
      timestamp: iso(timestamp),
      metadata: {},
    };
    if (entityType === "obligation") event.obligationId = entityId;
    else if (entityType === "cap") event.capId = entityId;
    else if (entityType === "assignment") event.assignmentId = entityId;
    else {
      event.entityId = entityId;
      event.entityType = entityType;
    }
    return event;
  });
}

function generateCommentsFor(
  entityId: string,
  entityType: "obligation",
): ObligationComment[];
function generateCommentsFor(entityId: string, entityType: "cap"): CAPComment[];
function generateCommentsFor(entityId: string, entityType: string): Comment[];
function generateCommentsFor(entityId: string, entityType: string): unknown[] {
  const count = faker.number.int({ min: 3, max: 8 });
  return Array.from({ length: count }, (_, i) => {
    const user = pick(DEMO_USERS);
    const timestamp = subDays(
      today,
      (count - i) * faker.number.int({ min: 1, max: 7 }),
    );
    const comment: Record<string, unknown> = {
      id: uid("cmt"),
      userId: user.id,
      userName: user.name,
      content: faker.lorem.paragraph(),
      timestamp: iso(timestamp),
    };
    if (entityType === "obligation") comment.obligationId = entityId;
    else if (entityType === "cap") comment.capId = entityId;
    else {
      comment.entityId = entityId;
      comment.entityType = entityType;
    }
    return comment;
  });
}

function generateAssignments(
  regulations: Regulation[],
  users: UserProfile[],
  hoDepartments: { id: string; name: string }[],
): Assignment[] {
  const regById = new Map(regulations.map((r) => [r.id, r]));
  const deptById = new Map(hoDepartments.map((d) => [d.id, d.name]));
  const assignors = users.filter((u) =>
    ["admin", "owner", "approver"].includes(u.role),
  );

  return CURATED_ASSIGNMENTS.map((spec) => {
    const regulation = regById.get(spec.regulationId) ?? regulations[0];
    const assignor = assignors.length ? pick(assignors) : pick(users);
    const departments = spec.departmentIds
      .map((id) => ({ id, name: deptById.get(id) ?? id }))
      .filter((d) => d.name !== d.id);
    const createdAt = subDays(today, faker.number.int({ min: 14, max: 120 }));
    const dueDate = addDays(today, spec.dueOffset);
    const updatedAt = randomDate(createdAt, today);
    return {
      id: uid("asn"),
      title: spec.title,
      description: spec.description,
      regulationId: regulation.id,
      regulationTitle: regulation.title,
      assignorId: assignor.id,
      assignorName: assignor.name,
      assignedDepartmentIds: departments.map((d) => d.id),
      assignedDepartmentNames: departments.map((d) => d.name),
      status: spec.status as Assignment["status"],
      priority: spec.priority,
      dueDate: iso(dueDate),
      createdDate: iso(createdAt),
      updatedDate: iso(updatedAt),
      notes: spec.notes,
    };
  });
}

export interface MockDb {
  users: UserProfile[];
  regulations: Regulation[];
  regulationDependencies: RegulationDependency[];
  obligations: Obligation[];
  caps: CAP[];
  nccs: NonComplianceCase[];
  assignments: Assignment[];
  files: FileAttachment[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  roles: RoleEntity[];
  organizations: Organization[];
  aiConfig: AIConfig;
  organizationSettings: OrganizationSettings;
  // CMS (RFQ Phụ lục 1)
  legalUpdates: LegalUpdate[];
  /** Documents waiting in the simulated feed; "Sync now" pulls them in. */
  incomingLegalQueue: LegalUpdate[];
  internalRegulations: InternalRegulation[];
  revisionTasks: RevisionTask[];
  icisFindings: IcisFinding[];
  /** ICIS findings waiting upstream; "Sync now" pulls them in. */
  incomingIcisQueue: IcisFinding[];
  riskMatrices: RiskMatrix[];
  escalationRules: EscalationRule[];
  reportTemplates: ReportTemplate[];
  scheduledReports: ScheduledReport[];
  generateTimelineFor: typeof generateTimelineFor;
  generateCommentsFor: typeof generateCommentsFor;
}

let dbInstance: MockDb | null = null;

export function getDb(): MockDb {
  if (dbInstance) return dbInstance;

  const users = [...generateDemoUserProfiles(), ...generateStaffUsers()];
  const regulations = generateRegulations();
  const regulationDependencies = generateRegulationDependencies(regulations);
  const relatedRegs = buildRegulationRelatedIndex(regulationDependencies);
  const organizationSettings = generateOrganizationSettings();
  const riskMatrices = generateRiskMatrices();
  const escalationRules = generateEscalationRules();
  const activeMatrix = riskMatrices.find((m) => m.status === "active")!;
  const nccs = generateIssues(
    organizationSettings,
    users,
    activeMatrix,
    escalationRules,
  );
  const internalRegulations = generateInternalRegulations(organizationSettings);
  const legalUpdates = generateLegalUpdates();
  const incomingLegalQueue = generateIncomingLegalQueue();
  const revisionTasks = generateRevisionTasks(
    internalRegulations,
    legalUpdates,
    organizationSettings,
  );
  revisionTasks
    .filter((t) => t.status !== "issued" && t.qdnbId)
    .forEach((t) => {
      const q = internalRegulations.find((r) => r.id === t.qdnbId);
      if (q) q.activeRevisionId = t.id;
    });
  const allIcis = generateIcisFindings(organizationSettings);
  const incomingIcisQueue = allIcis
    .filter((f) => f.status === "pending")
    .slice(4);
  const icisFindings = allIcis.filter((f) => !incomingIcisQueue.includes(f));
  const assignments = generateAssignments(
    regulations,
    users,
    organizationSettings.hoDepartments,
  );
  const obligations = generateObligations(
    regulations,
    assignments,
    users,
    relatedRegs,
  );
  const caps = generateCAPs(obligations, users, relatedRegs);
  const files = generateFiles(caps);
  const notifications = generateCmsNotifications(
    legalUpdates,
    revisionTasks,
    nccs,
  );
  const auditLogs = [
    ...generateSessionLogs(users),
    ...generateCmsAuditLogs(users, legalUpdates, revisionTasks, nccs),
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const reportTemplates = generateReportTemplates();
  const scheduledReports = generateScheduledReports();
  const roles = generateRoles();
  const organizations = generateOrganizations();
  const aiConfig = generateAIConfig();

  dbInstance = {
    users,
    regulations,
    regulationDependencies,
    obligations,
    caps,
    nccs,
    assignments,
    files,
    notifications,
    auditLogs,
    roles,
    organizations,
    aiConfig,
    organizationSettings,
    legalUpdates,
    incomingLegalQueue,
    internalRegulations,
    revisionTasks,
    icisFindings,
    incomingIcisQueue,
    riskMatrices,
    escalationRules,
    reportTemplates,
    scheduledReports,
    generateTimelineFor,
    generateCommentsFor,
  };

  if (import.meta.env.DEV) {
    console.log("[MockDB] Generated", {
      users: users.length,
      regulations: regulations.length,
      regulationDependencies: regulationDependencies.length,
      obligations: obligations.length,
      caps: caps.length,
      nccs: nccs.length,
      assignments: assignments.length,
      files: files.length,
      notifications: notifications.length,
      auditLogs: auditLogs.length,
      roles: roles.length,
      organizations: organizations.length,
    });
  }

  return dbInstance;
}

export function resetDb(): MockDb {
  dbInstance = null;
  faker.seed(42);
  return getDb();
}

export function findById<T extends { id: string }>(
  items: T[],
  id: string,
): T | undefined {
  return items.find((item) => item.id === id);
}

export function paginate<T>(
  items: T[],
  page = 1,
  pageSize = 20,
): { items: T[]; total: number; page: number; pageSize: number } {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

export function filterByText<T>(
  items: T[],
  search: string,
  fields: (keyof T)[],
): T[] {
  const term = search.toLowerCase();
  return items.filter((item) =>
    fields.some((field) => {
      const value = item[field] as unknown;
      if (typeof value === "string") return value.toLowerCase().includes(term);
      if (Array.isArray(value))
        return value.some((v) => String(v).toLowerCase().includes(term));
      return false;
    }),
  );
}
