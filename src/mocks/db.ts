import { faker } from "@faker-js/faker";
import { addDays, subDays, formatISO } from "date-fns";
import { DEMO_USERS } from "@/constants/demo-users";
import { CAP_STATUSES, USER_STATUSES } from "@/constants/status";
import type { PriorityLevel } from "@/constants/status";
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
  LitigationCase,
  CaseMilestone,
  LegalDeadline,
  CaseEvent,
  LMTask,
  LMTaskStatus,
  AlertRule,
  AdviceRequest,
  LawEvent,
  SlaRule,
  KnowledgeBaseEntry,
} from "@/types";
import {
  CASE_STAGES,
  STAGE_STYLES,
  CASE_CATEGORIES,
  CASE_CATEGORY_LABELS,
  DEADLINE_TYPES,
  DEADLINE_TYPE_DEFAULT_DAYS_BEFORE,
  DEADLINE_TYPE_LABELS,
  LM_DEFAULT_FOLDERS,
  type CaseStage,
} from "@/constants/lm";
import {
  LAW_PRIORITY_TIERS,
  LAW_REQUEST_STATUSES,
  LAW_PRIORITY_SLA_DAYS,
  LAW_PRIORITY_ALERT_DAYS_BEFORE,
} from "@/constants/law";
import {
  CURATED_REGULATIONS,
  CURATED_DEPENDENCIES,
  CURATED_ASSIGNMENTS,
  CURATED_OBLIGATIONS,
  CURATED_CAPS,
} from "@/mocks/curated-data";

faker.seed(42);

// Fixed reference date (not `new Date()`) so every reload, tab, and device
// generates byte-identical demo data — due dates and "days remaining" are
// computed relative to this, not real wall-clock time. Other mock handlers
// that compute overdue/derived stats against seed data should import this
// rather than calling `new Date()` directly, to stay consistent with it.
export const DEMO_TODAY = new Date("2026-07-11T00:00:00.000Z");
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

function weightedPick<T>(items: { item: T; weight: number }[]): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let random = faker.number.float({ min: 0, max: total });
  for (const { item, weight } of items) {
    random -= weight;
    if (random <= 0) return item;
  }
  return items[items.length - 1].item;
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

const NCC_TITLES = [
  "Failure to submit monthly AML report",
  "Incomplete KYC documentation for corporate client",
  "Delayed regulatory filing",
  "Breach of transaction monitoring thresholds",
  "Missing risk assessment for high-value transaction",
  "Non-compliance with capital adequacy reporting",
  "Failure to conduct periodic compliance training",
  "Inadequate customer due diligence records",
  "Late submission of suspicious activity report",
  "Violation of sanctions screening requirements",
  "Incomplete regulatory capital disclosure",
  "Failure to report large cash transactions",
  "Non-compliance with data retention policy",
  "Missing board-approved risk management policy",
  "Breach of lending limit regulations",
  "Inadequate internal controls over financial reporting",
  "Failure to reconcile regulatory accounts",
  "Non-compliance with foreign exchange reporting",
  "Missing anti-bribery compliance certification",
  "Delayed implementation of regulatory directive",
  "Breach of customer information confidentiality",
  "Inadequate whistleblower protection procedures",
  "Failure to maintain minimum reserve requirements",
  "Non-compliance with consumer protection regulations",
] as const;

const NCC_TAGS = [
  "audit",
  "regulatory",
  "operational",
  "procedural",
  "systemic",
] as const;

const NCC_RESOLUTIONS = [
  "Root cause identified and corrective action plan implemented. Staff retrained on reporting procedures.",
  "Process updated to include automated reminders. All missing documentation retrieved and filed.",
  "Policy revised and approved by the compliance committee. Monitoring controls strengthened.",
  "Issue remediated through system upgrade. Post-implementation review confirmed compliance.",
  "Control deficiency addressed via additional review layer. No recurrence observed in subsequent audits.",
  "Regulatory filing completed with explanatory note. Preventive controls deployed to avoid future delays.",
] as const;

function generateNCCs(
  organizationSettings: OrganizationSettings,
  users: UserProfile[],
  count = 24,
): NonComplianceCase[] {
  const { hoDepartments, branches } = organizationSettings;
  const items = Array.from({ length: count }, (_, i) => {
    // ~40% HO department, ~60% branch.
    const isHo = faker.number.float({ min: 0, max: 1 }) < 0.4;
    const unit = isHo
      ? { dept: pick(hoDepartments), branch: undefined }
      : { dept: undefined, branch: pick(branches) };
    const ownerUnitId = unit.branch?.id ?? unit.dept!.id;
    const ownerUnitName = unit.branch?.name ?? unit.dept!.name;
    const ownerUnitType: NonComplianceCase["ownerUnitType"] = unit.branch
      ? "branch"
      : "ho_department";
    const ownerUnitRegion = unit.branch?.region;

    const owner = pick(users);
    const createdAt = randomDate(subDays(today, 200), subDays(today, 3));
    const status: NonComplianceCase["status"] = weightedPick([
      { item: "Open", weight: 65 },
      { item: "Closed", weight: 35 },
    ]);

    // Due dates: for Open cases ~40% past due (overdue), rest today/future.
    // For Closed cases, due date can be anything.
    let dueDate: Date;
    if (status === "Open" && faker.number.float({ min: 0, max: 1 }) < 0.4) {
      dueDate = subDays(today, faker.number.int({ min: 1, max: 30 }));
    } else if (status === "Open") {
      dueDate = addDays(today, faker.number.int({ min: 0, max: 90 }));
    } else {
      dueDate = addDays(createdAt, faker.number.int({ min: 10, max: 120 }));
    }

    const fileIds: string[] =
      faker.number.float({ min: 0, max: 1 }) < 0.3
        ? Array.from(
            { length: faker.number.int({ min: 1, max: 2 }) },
            () => `file-${crypto.randomUUID()}`,
          )
        : [];

    const tags: string[] =
      faker.number.float({ min: 0, max: 1 }) < 0.4
        ? faker.helpers.arrayElements(
            NCC_TAGS,
            faker.number.int({ min: 1, max: 2 }),
          )
        : [];

    const linkedDocs: string | undefined =
      faker.number.float({ min: 0, max: 1 }) < 0.2
        ? `See compliance report Q${faker.number.int({ min: 1, max: 4 })}-${today.getFullYear()}`
        : undefined;

    const closedAt =
      status === "Closed" ? iso(randomDate(createdAt, today)) : undefined;
    const resolution = status === "Closed" ? pick(NCC_RESOLUTIONS) : undefined;

    return {
      id: uid("ncc"),
      nccId: `NCC-${today.getFullYear()}-${pad(i + 1)}`,
      title: pick(NCC_TITLES),
      description: faker.lorem.sentences(2),
      severity: faker.helpers.weightedArrayElement([
        { weight: 25, value: "low" },
        { weight: 35, value: "medium" },
        { weight: 30, value: "high" },
        { weight: 10, value: "critical" },
      ]),
      ownerUnitId,
      ownerUnitName,
      ownerUnitType,
      ownerUnitRegion,
      ownerId: owner.id,
      ownerName: owner.name,
      dueDate: iso(dueDate),
      status,
      resolution,
      fileIds,
      linkedDocs,
      closedAt,
      tags,
      createdAt: iso(createdAt),
      updatedAt: iso(randomDate(createdAt, today)),
    };
  });

  // Newest first.
  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return items;
}

/**
 * PSEUDO CODE (ngắn gọn)
 * 1. roundRobinSlots(caps): chia N slot theo đúng số lượng caps, xen kẽ
 *    thay vì dồn cục — dùng để rải owner/priority cho đều qua các stage.
 * 2. generateLitigationCases: 30 hồ sơ, 6/stage. Owner theo roundRobin
 *    [10,8,6,4,2], priority theo roundRobin [medium14,high8,low5,critical3].
 *    Mốc: stage < hiện tại = đã xong (actualDate); = hiện tại = đang làm;
 *    > hiện tại = tương lai. 3 hồ sơ cố ý thiếu 1 event mốc (test KPI b).
 * 3. Hạn pháp lý: chỉ 15/30 hồ sơ có (5 quá hạn, 5 sắp hạn, 5 đã xử lý),
 *    15 còn lại không có (baseline sạch).
 * 4. File: 20/30 hồ sơ có đính kèm (i % 3 !== 2).
 */
function roundRobinSlots(caps: number[]): number[] {
  const remaining = [...caps];
  const total = remaining.reduce((a, b) => a + b, 0);
  const out: number[] = [];
  while (out.length < total) {
    for (let k = 0; k < remaining.length; k++) {
      if (remaining[k] > 0) {
        out.push(k);
        remaining[k]--;
      }
    }
  }
  return out;
}

const CUSTOMER_NAMES = [
  "Nguyễn Văn An",
  "Trần Thị Bích",
  "Lê Hoàng Cường",
  "Phạm Thị Duyên",
  "Công ty TNHH Thương mại Phú Gia",
  "Công ty CP Xây dựng Đại Thành",
  "Hoàng Minh Đức",
  "Vũ Thị Hằng",
  "Công ty TNHH Xuất nhập khẩu Minh Long",
  "Đặng Văn Khoa",
  "Công ty CP Sản xuất Việt Tiến",
  "Bùi Thị Ngọc",
] as const;

const COLLATERAL_DESCRIPTIONS = [
  "Bất động sản tại Hà Nội (sổ đỏ thế chấp)",
  "Ô tô Toyota Camry 2023",
  "Sổ tiết kiệm kỳ hạn 12 tháng",
  "Bất động sản tại TP.HCM (nhà + đất)",
  "Máy móc thiết bị nhà xưởng",
  "Hàng tồn kho thế chấp",
  undefined,
] as const;

const COURTS = [
  "Tòa án nhân dân Quận Hoàn Kiếm, Hà Nội",
  "Tòa án nhân dân Quận 1, TP.HCM",
  "Tòa án nhân dân TP. Đà Nẵng",
  "Chi cục Thi hành án dân sự Quận Cầu Giấy",
  "Chi cục Thi hành án dân sự Quận 3, TP.HCM",
] as const;

/** 3 hồ sơ cố ý thiếu 1 event cập nhật mốc — test KPI b (00-decisions.md). */
const MISSING_MILESTONE_EVENT_INDICES = new Set([8, 14, 26]);
/** Vị trí trong stage-group (j=0..5) bị coi là "trễ kế hoạch / đã dời ngày". */
const DELAYED_J_BY_STAGE: Record<number, number[]> = {
  0: [4], // khởi kiện: 1 trễ
  1: [4, 5], // thụ lý: 2 trễ
  2: [5], // hòa giải: 1 sắp quá hạn
  3: [4, 5], // xét xử: 2 đã dời ngày
  4: [], // thi hành án: không trễ
};

function generateLitigationCases(
  organizationSettings: OrganizationSettings,
  users: UserProfile[],
): {
  cases: LitigationCase[];
  milestones: CaseMilestone[];
  deadlines: LegalDeadline[];
  events: CaseEvent[];
} {
  const { hoDepartments } = organizationSettings;
  const OWNER_DEPT_IDS = [
    "dept-legal",
    "dept-retail",
    "dept-corporate",
    "dept-credit",
    "dept-operations",
  ];
  const ownerDepts = OWNER_DEPT_IDS.map(
    (id) => hoDepartments.find((d) => d.id === id) ?? hoDepartments[0],
  );

  // BƯỚC (fix): phải lấy trong đúng pool role="owner" — nếu pool < 5 thì
  // LẶP LẠI trong chính pool đó (không rơi về users bất kỳ role nào), vì
  // LMForm chỉ tải danh sách chuyên viên qua useAdminUsers({role:"owner"}).
  // demo-owner (Lê Thị Hoa) luôn có sẵn nên pool không bao giờ rỗng.
  const ownerPool = users.filter((u) => u.role === "owner");
  const owners = Array.from(
    { length: 5 },
    (_, k) => ownerPool[k % ownerPool.length],
  );
  // demo-executive (Nguyễn Văn Hùng) luôn có sẵn nên pool không rỗng —
  // không fallback sang users bất kỳ role, cùng lý do như ownerPool ở trên.
  const managers = users.filter((u) => u.role === "executive");
  const pickManager = () => pick(managers);

  const ownerSlots = roundRobinSlots([10, 8, 6, 4, 2]);
  const priorityLabels: PriorityLevel[] = ["medium", "high", "low", "critical"];
  const prioritySlots = roundRobinSlots([14, 8, 5, 3]);

  const overdueIdx = new Set([0, 6, 12, 18, 24]);
  const dueSoonIdx = new Set([1, 7, 13, 19, 25]);
  const resolvedIdx = new Set([2, 8, 14, 20, 26]);
  // GĐ3 — "pending" chưa tới ngưỡng cảnh báo. idx 27 cố ý đặt dueDate đã
  // qua ngưỡng (daysBefore) nhưng status vẫn để "pending", mô phỏng hạn
  // "chưa được đánh giá lần nào" — engine evaluateDeadlines tự bật cờ đỏ
  // ngay lần load đầu tiên, demo được việc tự động hoá.
  const pendingIdx = new Set([3, 9, 15, 21, 27]);

  const cases: LitigationCase[] = [];
  const milestones: CaseMilestone[] = [];
  const deadlines: LegalDeadline[] = [];
  const events: CaseEvent[] = [];

  for (let i = 0; i < 30; i++) {
    const stageIdxCurrent = Math.floor(i / 6); // 0..4, giai đoạn hiện tại
    const j = i % 6; // vị trí trong nhóm 6 hồ sơ của stage này
    const stage = CASE_STAGES[stageIdxCurrent];
    const category = CASE_CATEGORIES[i % CASE_CATEGORIES.length];
    const owner = owners[ownerSlots[i]];
    const dept = ownerDepts[i % ownerDepts.length];
    const priority = priorityLabels[prioritySlots[i]];
    const customerName = CUSTOMER_NAMES[i % CUSTOMER_NAMES.length];
    const isCorp = category === "no_xau_doanh_nghiep";
    const outstandingDebt = isCorp
      ? faker.number.int({ min: 3_000_000_000, max: 15_000_000_000 })
      : faker.number.int({ min: 500_000_000, max: 5_000_000_000 });

    // Hồ sơ ở giai đoạn k đã hoàn thành k mốc, mốc cuối ~ createdAt + 45k (+≤10
    // ngày) — createdAt phải đủ xa để mọi mốc "đã xong" nằm TRƯỚC hôm nay,
    // không thì Lịch sử hiện ngày hoàn thành ở tương lai.
    const minAgeDays = Math.max(30, 45 * stageIdxCurrent + 15);
    const createdAt = randomDate(subDays(today, 300), subDays(today, minAgeDays));
    const caseId = uid("lm");

    cases.push({
      id: caseId,
      code: `LM-${today.getFullYear()}-${pad(i + 1)}`,
      title: `${CASE_CATEGORY_LABELS[category]} — ${customerName}`,
      category,
      customerCif: `CIF${pad(i + 1, 6)}`,
      customerName,
      outstandingDebt,
      collateralDescription:
        COLLATERAL_DESCRIPTIONS[i % COLLATERAL_DESCRIPTIONS.length],
      courtOrEnforcementAgency: COURTS[i % COURTS.length],
      judgeName: stageIdxCurrent >= 1 ? faker.person.fullName() : undefined,
      stage,
      status: "Open",
      priority,
      ownerUnitId: dept.id,
      ownerUnitName: dept.name,
      ownerUnitType: "ho_department",
      ownerId: owner.id,
      ownerName: owner.name,
      managerId: pickManager().id,
      managerName: "", // điền lại ngay dưới sau khi biết managerId
      fileIds: [],
      folders: [...LM_DEFAULT_FOLDERS],
      tags: [],
      createdAt: iso(createdAt),
      updatedAt: iso(randomDate(createdAt, today)),
    });
    // managerName phải khớp managerId vừa gán — gán lại cho đúng.
    const created = cases[cases.length - 1];
    const manager = users.find((u) => u.id === created.managerId);
    created.managerName = manager?.name ?? "";

    events.push({
      id: uid("ce"),
      caseId,
      type: "created",
      userId: owner.id,
      userName: owner.name,
      description: `Created case ${created.code}`,
      subject: created.code,
      createdAt: iso(createdAt),
      updatedAt: iso(createdAt),
    });

    // 5 mốc, cách nhau ~45 ngày kể từ createdAt.
    const isDelayed = DELAYED_J_BY_STAGE[stageIdxCurrent]?.includes(j) ?? false;
    for (let si = 0; si < CASE_STAGES.length; si++) {
      const planned = addDays(createdAt, (si + 1) * 45);
      const isPast = si < stageIdxCurrent;
      const isCurrent = si === stageIdxCurrent;
      let currentPlanned = planned;
      if (isCurrent && isDelayed) {
        currentPlanned = addDays(planned, faker.number.int({ min: 15, max: 30 }));
      }
      const actualDate = isPast
        ? addDays(planned, faker.number.int({ min: -5, max: 10 }))
        : undefined;

      milestones.push({
        id: uid("ms"),
        caseId,
        stage: CASE_STAGES[si],
        originalPlannedDate: iso(planned),
        currentPlannedDate: iso(currentPlanned),
        actualDate: actualDate ? iso(actualDate) : undefined,
        createdAt: iso(createdAt),
        updatedAt: iso(actualDate ?? currentPlanned),
      });

      if (isCurrent && isDelayed) {
        events.push({
          id: uid("ce"),
          caseId,
          type: "milestone_date_changed",
          userId: owner.id,
          userName: owner.name,
          description: `Rescheduled milestone "${STAGE_STYLES[CASE_STAGES[si]].label}"`,
          subject: CASE_STAGES[si],
          fromValue: iso(planned),
          toValue: iso(currentPlanned),
          createdAt: iso(subDays(today, faker.number.int({ min: 1, max: 20 }))),
          updatedAt: iso(subDays(today, faker.number.int({ min: 1, max: 20 }))),
        });
      }
      if (isPast && !MISSING_MILESTONE_EVENT_INDICES.has(i)) {
        events.push({
          id: uid("ce"),
          caseId,
          type: "milestone_completed",
          userId: owner.id,
          userName: owner.name,
          description: `Completed milestone "${STAGE_STYLES[CASE_STAGES[si]].label}"`,
          subject: CASE_STAGES[si],
          createdAt: iso(actualDate!),
          updatedAt: iso(actualDate!),
        });
      }
    }

    // Hạn pháp lý — chỉ 15/30 hồ sơ (xem pseudo code đầu hàm).
    const deadlineType = DEADLINE_TYPES[i % DEADLINE_TYPES.length];
    const daysBefore = DEADLINE_TYPE_DEFAULT_DAYS_BEFORE[deadlineType];
    if (overdueIdx.has(i)) {
      const dueDate = subDays(today, faker.number.int({ min: 3, max: 20 }));
      deadlines.push({
        id: uid("ld"),
        caseId,
        type: deadlineType,
        dueDate: iso(dueDate),
        status: "flagged",
        flaggedAt: iso(subDays(dueDate, daysBefore)),
        createdAt: iso(subDays(dueDate, daysBefore)),
        updatedAt: iso(subDays(dueDate, daysBefore)),
      });
    } else if (dueSoonIdx.has(i)) {
      const dueDate = addDays(today, faker.number.int({ min: 1, max: 3 }));
      deadlines.push({
        id: uid("ld"),
        caseId,
        type: deadlineType,
        dueDate: iso(dueDate),
        status: "flagged",
        flaggedAt: iso(subDays(dueDate, daysBefore)),
        createdAt: iso(subDays(dueDate, daysBefore)),
        updatedAt: iso(subDays(dueDate, daysBefore)),
      });
    } else if (resolvedIdx.has(i)) {
      const dueDate = subDays(today, faker.number.int({ min: 10, max: 40 }));
      const flaggedAt = subDays(dueDate, daysBefore);
      const acknowledgedAt = randomDate(flaggedAt, today);
      const resolvedAt = randomDate(acknowledgedAt, today);
      deadlines.push({
        id: uid("ld"),
        caseId,
        type: deadlineType,
        dueDate: iso(dueDate),
        status: "resolved",
        flaggedAt: iso(flaggedAt),
        acknowledgedAt: iso(acknowledgedAt),
        acknowledgedById: owner.id,
        resolvedAt: iso(resolvedAt),
        resolvedById: owner.id,
        createdAt: iso(flaggedAt),
        updatedAt: iso(resolvedAt),
      });
      events.push({
        id: uid("ce"),
        caseId,
        type: "deadline_resolved",
        userId: owner.id,
        userName: owner.name,
        description: `Resolved alert for deadline "${DEADLINE_TYPE_LABELS[deadlineType]}"`,
        subject: deadlineType,
        createdAt: iso(resolvedAt),
        updatedAt: iso(resolvedAt),
      });
    } else if (pendingIdx.has(i)) {
      const alreadyOverThreshold = i === 27;
      const dueDate = alreadyOverThreshold
        ? addDays(today, daysBefore - 3)
        : addDays(today, daysBefore + 20);
      deadlines.push({
        id: uid("ld"),
        caseId,
        type: deadlineType,
        dueDate: iso(dueDate),
        status: "pending",
        createdAt: iso(subDays(today, 5)),
        updatedAt: iso(subDays(today, 5)),
      });
    }
  }

  return { cases, milestones, deadlines, events };
}

/**
 * Nam review R3 (docs/lm/02-review-changes.md mục 4) — vài task tự do mẫu
 * cho tab "Work Calendar", trải đủ 2 trạng thái (open/done) và việc đã trễ,
 * để tab không trống khi demo lần đầu. KHÔNG đụng `cases` (hồ sơ dùng
 * chung với generateLitigationCases ở trên).
 */
// Xoay vòng tiêu đề task critical — tránh Dashboard đầu danh sách lặp 1 tên.
const CRITICAL_TASK_TITLES = [
  "Pay court fee before filing cut-off",
  "Submit evidence bundle to court",
  "File appeal before statutory deadline",
  "Respond to enforcement agency summons",
];

function generateLMTasks(cases: LitigationCase[]): LMTask[] {
  const specs: {
    offsetDays: number;
    priority: PriorityLevel;
    status: LMTaskStatus;
    remindDaysBefore: number;
    title: string;
  }[] = [
    { offsetDays: -3, priority: "high", status: "open", remindDaysBefore: 3, title: "Follow up with court clerk on filing receipt" },
    { offsetDays: 2, priority: "medium", status: "open", remindDaysBefore: 3, title: "Prepare collateral valuation summary" },
    { offsetDays: 10, priority: "low", status: "open", remindDaysBefore: 2, title: "Schedule client update call" },
    { offsetDays: -10, priority: "medium", status: "done", remindDaysBefore: 3, title: "Collect notarized contract copies" },
    { offsetDays: 1, priority: "critical", status: "open", remindDaysBefore: 5, title: "Submit evidence bundle to court" },
    { offsetDays: 6, priority: "high", status: "open", remindDaysBefore: 7, title: "Review draft settlement terms" },
    { offsetDays: -20, priority: "critical", status: "done", remindDaysBefore: 5, title: "File response to counterparty motion" },
    { offsetDays: 18, priority: "medium", status: "open", remindDaysBefore: 5, title: "Update debt recovery estimate" },
    { offsetDays: -7, priority: "critical", status: "open", remindDaysBefore: 3, title: "Pay court fee before filing cut-off" },
    { offsetDays: -5, priority: "medium", status: "open", remindDaysBefore: 2, title: "Chase enforcement officer on asset seizure" },
  ];

  // Mỗi hồ sơ đang mở lấy 2-3 spec xoay vòng — để task trải khắp các
  // hồ sơ, không dồn vào vài hồ sơ đầu như seed cũ.
  const tasks: LMTask[] = [];
  cases.forEach((lmCase, ci) => {
    if (lmCase.status !== "Open") return;
    const count = 2 + (ci % 2);
    for (let k = 0; k < count; k++) {
      const s = specs[(ci * 3 + k) % specs.length];
      const createdAt = iso(subDays(today, 15));
      tasks.push({
        id: uid("task"),
        caseId: lmCase.id,
        title: s.priority === "critical" ? CRITICAL_TASK_TITLES[ci % CRITICAL_TASK_TITLES.length] : s.title,
        dueDate: iso(addDays(today, s.offsetDays + (ci % 4))),
        priority: s.priority,
        status: s.status,
        remindDaysBefore: s.remindDaysBefore,
        createdById: lmCase.ownerId,
        createdByName: lmCase.ownerName,
        createdAt,
        updatedAt: createdAt,
      });
    }
  });
  return tasks;
}

/**
 * Văn bản tố tụng mẫu theo giai đoạn: hồ sơ ở giai đoạn k có văn bản của
 * mọi giai đoạn <= k, mỗi văn bản nằm đúng folder và được gắn sẵn vào mốc
 * tương ứng (Nam review: tài liệu theo folder + link vào Hồ sơ sự vụ).
 */
const LM_DOC_PRESETS: { stage: CaseStage; folder: number; name: string; size: number }[] = [
  { stage: "khoi_kien", folder: 0, name: "Don-khoi-kien.pdf", size: 412_000 },
  { stage: "khoi_kien", folder: 1, name: "Hop-dong-tin-dung.pdf", size: 860_000 },
  { stage: "khoi_kien", folder: 1, name: "Hop-dong-the-chap-TSBD.pdf", size: 640_000 },
  { stage: "thu_ly", folder: 2, name: "Thong-bao-thu-ly.pdf", size: 210_000 },
  { stage: "hoa_giai", folder: 2, name: "Bien-ban-hoa-giai.pdf", size: 330_000 },
  { stage: "xet_xu", folder: 2, name: "Ban-an-so-tham.pdf", size: 1_150_000 },
  { stage: "thi_hanh_an", folder: 3, name: "Quyet-dinh-thi-hanh-an.pdf", size: 280_000 },
];

/** 10/30 hồ sơ (i % 3 === 2) cố ý không có file — để KPI đủ tài liệu không tròn 100%. */
function generateLitigationFiles(
  cases: LitigationCase[],
  milestones: CaseMilestone[],
): FileAttachment[] {
  const files: FileAttachment[] = [];
  cases.forEach((c, i) => {
    if (i % 3 === 2) return;
    const stageIdx = CASE_STAGES.indexOf(c.stage);
    const uploader = faker.helpers.arrayElement(DEMO_USERS);
    const ids: string[] = [];
    LM_DOC_PRESETS.filter((p) => CASE_STAGES.indexOf(p.stage) <= stageIdx).forEach((p) => {
      const id = uid("file");
      const uploadedAt = randomDate(subDays(today, 60), today);
      ids.push(id);
      files.push({
        id,
        name: p.name,
        size: p.size,
        type: "application/pdf",
        url: `https://mock-files.example.com/lm/${c.id}/${p.name}`,
        uploadedAt: iso(uploadedAt),
        uploadedBy: uploader.name,
        uploadedById: uploader.id,
        caseId: c.id,
        folderPath: LM_DEFAULT_FOLDERS[p.folder],
        createdAt: iso(uploadedAt),
        updatedAt: iso(uploadedAt),
      });
      const ms = milestones.find((m) => m.caseId === c.id && m.stage === p.stage);
      if (ms) ms.linkedFileIds = [...(ms.linkedFileIds ?? []), id];
    });
    c.fileIds = ids;
  });
  return files;
}

/** Cấu hình cảnh báo mặc định — PLACEHOLDER, xem docs/lm/00-decisions.md mục 3. */
function generateDefaultAlertRules(): AlertRule[] {
  return DEADLINE_TYPES.map((type) => ({
    type,
    daysBefore: DEADLINE_TYPE_DEFAULT_DAYS_BEFORE[type],
    channels: ["app", "email"],
  }));
}

const LAW_REQUEST_TOPICS = [
  "Review standard credit contract template for corporate clients",
  "Advise on AML regulations applicable to a new product",
  "Clarify issues on real estate collateral liquidation",
  "Advise on bank guarantee contract terms",
  "Review KYC policy against amended SBV regulations",
  "Advise on handling procedure for group-3+ bad debt",
  "Clarify overdue interest rate issues in standard contract",
  "Advise on corporate bond issuance conditions",
  "Review customer data confidentiality clauses",
  "Advise on notarization procedure for mortgage contract",
  "Clarify rights and obligations of the guarantor",
  "Advise on new consumer lending regulations",
  "Review cooperation agreement with a fintech partner",
  "Advise on consumer credit contract dispute resolution",
  "Clarify issues on debt assignment/transfer",
] as const;

/**
 * PSEUDO CODE (ngắn gọn) — GĐ1 LAW: ~24 yêu cầu tư vấn, trải đều 3 mức ưu
 * tiên và 3 trạng thái. Đơn vị gửi yêu cầu lấy từ hoDepartments sẵn có
 * (không phải 5 đơn vị đã dùng cho LM — rải rộng hơn cho khác biệt demo).
 * Chuyên viên/quản lý tái dùng đúng pool role owner/executive như LM.
 */
function generateAdviceRequests(
  organizationSettings: OrganizationSettings,
  users: UserProfile[],
): { requests: AdviceRequest[]; events: LawEvent[] } {
  const REQUESTING_DEPT_IDS = [
    "dept-retail",
    "dept-corporate",
    "dept-credit",
    "dept-treasury",
    "dept-finance",
    "dept-it",
    "dept-operations",
    "dept-aml",
  ];
  const requestingDepts = REQUESTING_DEPT_IDS.map(
    (id) =>
      organizationSettings.hoDepartments.find((d) => d.id === id) ??
      organizationSettings.hoDepartments[0],
  );

  const ownerPool = users.filter((u) => u.role === "owner");
  const managers = users.filter((u) => u.role === "executive");
  const pickManager = () => pick(managers);

  const requests: AdviceRequest[] = [];
  const events: LawEvent[] = [];

  const COUNT = 24;
  for (let i = 0; i < COUNT; i++) {
    const priorityTier = LAW_PRIORITY_TIERS[i % LAW_PRIORITY_TIERS.length];
    const status = LAW_REQUEST_STATUSES[i % LAW_REQUEST_STATUSES.length];
    const dept = requestingDepts[i % requestingDepts.length];
    const owner = ownerPool[i % ownerPool.length];
    const topic = LAW_REQUEST_TOPICS[i % LAW_REQUEST_TOPICS.length];
    const submittedAt = randomDate(subDays(today, 60), subDays(today, 2));
    const requestId = uid("law");
    const dueDate = addDays(submittedAt, LAW_PRIORITY_SLA_DAYS[priorityTier]);

    const manager = pickManager();
    const completedAt =
      status === "completed"
        ? randomDate(submittedAt, today)
        : undefined;

    requests.push({
      id: requestId,
      code: `LAW-${today.getFullYear()}-${pad(i + 1)}`,
      title: topic,
      description: undefined,
      priorityTier,
      status,
      requestingUnitId: dept.id,
      requestingUnitName: dept.name,
      requestingUnitType: "ho_department",
      ownerId: owner.id,
      ownerName: owner.name,
      managerId: manager.id,
      managerName: manager.name,
      submittedAt: iso(submittedAt),
      dueDate: iso(dueDate),
      completedAt: completedAt ? iso(completedAt) : undefined,
      revisedCount: i % 5 === 0 ? 1 : 0,
      // GĐ3 — hoàn thành coi như cảnh báo (nếu có) đã xử lý xong; còn lại
      // để "pending", engine evaluateLawAlerts tự bật cờ theo SlaRule khi
      // load (đa số đã quá hạn vì submittedAt rải xa trong 60 ngày qua).
      alertStatus: status === "completed" ? "resolved" : "pending",
      resolvedAt: status === "completed" && completedAt ? iso(completedAt) : undefined,
      resolvedById: status === "completed" ? owner.id : undefined,
      fileIds: [],
      tags: [],
      createdAt: iso(submittedAt),
      updatedAt: iso(completedAt ?? submittedAt),
    });

    events.push({
      id: uid("le"),
      requestId,
      type: "created",
      userId: owner.id,
      userName: owner.name,
      description: `Created request ${`LAW-${today.getFullYear()}-${pad(i + 1)}`}`,
      createdAt: iso(submittedAt),
      updatedAt: iso(submittedAt),
    });

    if (status === "completed") {
      events.push({
        id: uid("le"),
        requestId,
        type: "status_changed",
        userId: owner.id,
        userName: owner.name,
        description: "Status changed: In Progress → Completed",
        fromValue: "in_progress",
        toValue: "completed",
        createdAt: iso(completedAt!),
        updatedAt: iso(completedAt!),
      });
    }
  }

  return { requests, events };
}

/** GĐ2 — cấu hình SLA mặc định, đọc được từ db (không hardcode ở handler),
 * giống generateDefaultAlertRules của LM. */
function generateDefaultSlaRules(): SlaRule[] {
  return LAW_PRIORITY_TIERS.map((priorityTier) => ({
    priorityTier,
    slaDays: LAW_PRIORITY_SLA_DAYS[priorityTier],
    alertDaysBefore: LAW_PRIORITY_ALERT_DAYS_BEFORE[priorityTier],
  }));
}

const KNOWLEDGE_BASE_SEED: {
  title: string;
  category: string;
  tags: string[];
  summary: string;
}[] = [
  {
    title: "Standard opinion: collateral valuation disputes",
    category: "Collateral",
    tags: ["collateral", "valuation", "dispute"],
    summary: "Template opinion for handling customer disputes over collateral valuation at disbursement time.",
  },
  {
    title: "Internal precedent: early loan termination fee waiver",
    category: "Lending",
    tags: ["lending", "fee waiver", "precedent"],
    summary: "Prior case where an early-termination fee was waived due to a documented bank-side processing error.",
  },
  {
    title: "Standard opinion: AML red-flag transaction reporting",
    category: "AML",
    tags: ["aml", "reporting", "compliance"],
    summary: "Template opinion on when a transaction pattern requires a suspicious activity report under current AML rules.",
  },
  {
    title: "Internal precedent: guarantor liability after debt restructuring",
    category: "Guarantee",
    tags: ["guarantee", "restructuring", "precedent"],
    summary: "Prior case clarifying guarantor liability scope after the underlying credit contract was restructured.",
  },
  {
    title: "Standard opinion: data retention period for closed accounts",
    category: "Data Privacy",
    tags: ["data privacy", "retention", "kyc"],
    summary: "Template opinion on minimum retention periods for customer records after account closure.",
  },
  {
    title: "Internal precedent: bond issuance disclosure gap",
    category: "Capital Markets",
    tags: ["bonds", "disclosure", "precedent"],
    summary: "Prior case on remediation steps after an incomplete risk disclosure was found in a bond prospectus.",
  },
  {
    title: "Standard opinion: third-party fintech data-sharing clauses",
    category: "Partnerships",
    tags: ["fintech", "data sharing", "contract"],
    summary: "Template opinion on required clauses when sharing customer data with a fintech partner.",
  },
  {
    title: "Internal precedent: mortgage notarization timing dispute",
    category: "Collateral",
    tags: ["mortgage", "notarization", "precedent"],
    summary: "Prior case on collateral priority when notarization was delayed past the disbursement date.",
  },
  {
    title: "Standard opinion: consumer lending cooling-off period",
    category: "Lending",
    tags: ["lending", "consumer protection", "cooling-off"],
    summary: "Template opinion on the mandatory cooling-off period for new consumer lending regulations.",
  },
  {
    title: "Internal precedent: debt assignment notice requirements",
    category: "Debt Recovery",
    tags: ["debt assignment", "notice", "precedent"],
    summary: "Prior case on the minimum notice period required before assigning a non-performing debt to a third party.",
  },
];

/** GĐ3 — kho tri thức mẫu (Phụ lục 3 mục 1.c), gắn tác giả xoay vòng qua
 * các chuyên viên role owner cho đa dạng. */
function generateKnowledgeBase(users: UserProfile[]): KnowledgeBaseEntry[] {
  const owners = users.filter((u) => u.role === "owner");
  return KNOWLEDGE_BASE_SEED.map((seed, i) => {
    const author = owners[i % owners.length];
    const createdAt = subDays(today, (KNOWLEDGE_BASE_SEED.length - i) * 5);
    return {
      id: uid("kb"),
      title: seed.title,
      category: seed.category,
      tags: seed.tags,
      summary: seed.summary,
      content: `${seed.summary} (full guidance content — demo placeholder.)`,
      authorId: author.id,
      authorName: author.name,
      createdAt: iso(createdAt),
      updatedAt: iso(createdAt),
    };
  });
}

function generateNotifications(
  users: UserProfile[],
  count = 30,
): Notification[] {
  const types = ["approval", "compliance", "cap", "ai", "system"] as const;
  return Array.from({ length: count }, () => {
    const user = pick(users);
    const type = pick(types);
    const createdAt = randomDate(subDays(today, 14), today);
    return {
      id: uid("ntf"),
      userId: user.id,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} notification`,
      description: faker.lorem.sentence(),
      type,
      read: faker.datatype.boolean(0.4),
      entityType: pick(["compliance", "cap", "regulation"]),
      entityId: uid("ent"),
      actionUrl: "#",
      createdAt: iso(createdAt),
      updatedAt: iso(createdAt),
    };
  });
}

function generateAuditLogs(users: UserProfile[], count = 200): AuditLog[] {
  const actions = [
    "login",
    "logout",
    "create",
    "update",
    "delete",
    "approve",
    "ai_usage",
    "export",
    "settings_change",
  ] as const;
  const modules = [
    "compliance",
    "cap",
    "regulation",
    "report",
    "admin",
    "auth",
    "ai",
  ] as const;
  return Array.from({ length: count }, () => {
    const user = pick(users);
    const timestamp = randomDate(subDays(today, 90), today);
    return {
      id: uid("aud"),
      timestamp: iso(timestamp),
      userId: user.id,
      userName: user.name,
      action: pick(actions),
      object: faker.lorem.words(2),
      module: pick(modules),
      ip: faker.internet.ip(),
      result: faker.datatype.boolean(0.95) ? "success" : "failure",
      details: faker.lorem.sentence(),
      createdAt: iso(timestamp),
      updatedAt: iso(timestamp),
    };
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
  litigationCases: LitigationCase[];
  caseMilestones: CaseMilestone[];
  legalDeadlines: LegalDeadline[];
  caseEvents: CaseEvent[];
  lmTasks: LMTask[];
  alertRules: AlertRule[];
  adviceRequests: AdviceRequest[];
  lawEvents: LawEvent[];
  slaRules: SlaRule[];
  knowledgeBase: KnowledgeBaseEntry[];
  roles: RoleEntity[];
  organizations: Organization[];
  aiConfig: AIConfig;
  organizationSettings: OrganizationSettings;
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
  const nccs = generateNCCs(organizationSettings, users);
  const lm = generateLitigationCases(organizationSettings, users);
  const lmTasks = generateLMTasks(lm.cases);
  const lmFiles = generateLitigationFiles(lm.cases, lm.milestones);
  const alertRules = generateDefaultAlertRules();
  const law = generateAdviceRequests(organizationSettings, users);
  const slaRules = generateDefaultSlaRules();
  const knowledgeBase = generateKnowledgeBase(users);
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
  const files = [...generateFiles(caps), ...lmFiles];
  const notifications = generateNotifications(users);
  const auditLogs = generateAuditLogs(users);
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
    litigationCases: lm.cases,
    caseMilestones: lm.milestones,
    legalDeadlines: lm.deadlines,
    caseEvents: lm.events,
    lmTasks,
    alertRules,
    adviceRequests: law.requests,
    lawEvents: law.events,
    slaRules,
    knowledgeBase,
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
      litigationCases: lm.cases.length,
      caseMilestones: lm.milestones.length,
      legalDeadlines: lm.deadlines.length,
      caseEvents: lm.events.length,
      lmTasks: lmTasks.length,
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
