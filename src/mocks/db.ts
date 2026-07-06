import { faker } from "@faker-js/faker";
import { addDays, subDays, formatISO, isBefore, isAfter } from "date-fns";
import { DEMO_USERS } from "@/constants/demo-users";
import {
  COMPLIANCE_STATUSES,
  COMPLIANCE_SUBMISSION_STATUSES,
  CAP_STATUSES,
  USER_STATUSES,
  PRIORITY_LEVELS,
} from "@/constants/status";
import type {
  UserProfile,
  RoleEntity,
  Organization,
  Template,
  AuditLog,
  AIConfig,
  OrganizationSettings,
  Regulation,
  ComplianceObligation,
  ComplianceSubmission,
  Evidence,
  CAP,
  CAPAction,
  License,
  Notification,
  ComplianceTimelineEvent,
  CAPTimelineEvent,
  ComplianceComment,
  CAPComment,
  EvidenceComment,
} from "@/types";

faker.seed(42);

const today = new Date();

const DEPARTMENTS = [
  "Risk & Compliance",
  "Legal",
  "Operations",
  "Finance",
  "Treasury",
  "Retail Banking",
  "Corporate Banking",
  "IT Security",
  "Human Resources",
  "Internal Audit",
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
  "SEC",
  "FINRA",
  "FCA",
  "MAS",
  "HKMA",
  "ECB",
  "APRA",
  "Basel Committee",
  "GDPR Authority",
  "CCPA",
] as const;

const CATEGORIES = [
  "AML/KYC",
  "Data Privacy",
  "Consumer Protection",
  "Market Conduct",
  "Operational Risk",
  "Capital Adequacy",
  "Cybersecurity",
  "Financial Reporting",
] as const;

const LICENSE_CATEGORIES = [
  "Banking License",
  "Money Transmitter",
  "Broker-Dealer",
  "Insurance License",
  "Payment Institution",
  "Crypto Asset License",
] as const;

const EVIDENCE_CATEGORIES = [
  "Policy Document",
  "Audit Report",
  "License Certificate",
  "Training Record",
  "Transaction Log",
  "Risk Assessment",
  "KYC Document",
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
  const roles = ["owner", "approver", "reviewer"] as const;
  return Array.from({ length: count }, (_, i) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const role = faker.helpers.weightedArrayElement([
      { weight: 5, value: "owner" },
      { weight: 3, value: "approver" },
      { weight: 2, value: "reviewer" },
      { weight: 1, value: "executive" },
    ]);
    const createdAt = randomDate(subDays(today, 400), subDays(today, 60));
    return {
      id: uid("usr"),
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      name: `${firstName} ${lastName}`,
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

function generateRegulations(count = 80): Regulation[] {
  return Array.from({ length: count }, (_, i) => {
    const category = pick(CATEGORIES);
    const effectiveAt = randomDate(subDays(today, 365), addDays(today, 180));
    const publishedAt = subDays(
      effectiveAt,
      faker.number.int({ min: 30, max: 180 }),
    );
    const status = weightedPick<Regulation["status"]>([
      { item: "Published", weight: 70 },
      { item: "Updated", weight: 25 },
      { item: "Archived", weight: 5 },
    ]);
    return {
      id: uid("reg"),
      reference: `REG-${faker.string.alpha({ length: 3, casing: "upper" })}-${pad(i + 1)}`,
      title: `${category} ${faker.company.buzzAdjective()} ${faker.company.buzzNoun()} Standard`,
      regulator: pick(REGULATORS),
      publicationDate: iso(publishedAt),
      effectiveDate: iso(effectiveAt),
      supersedes: faker.datatype.boolean(0.2)
        ? `REG-LEGACY-${pad(faker.number.int({ min: 1, max: 99 }))}`
        : undefined,
      status,
      category,
      jurisdiction: pick([
        "US",
        "UK",
        "EU",
        "Singapore",
        "Hong Kong",
        "Japan",
        "Australia",
        "Global",
      ]),
      industry: pick([
        "Banking",
        "Insurance",
        "Investment Management",
        "Payments",
        "FinTech",
      ]),
      affectedDepartments: faker.helpers.arrayElements(DEPARTMENTS, {
        min: 1,
        max: 4,
      }),
      affectedBusinessUnits: faker.helpers.arrayElements(BUSINESS_UNITS, {
        min: 1,
        max: 3,
      }),
      summary: faker.lorem.paragraph(3),
      requirements: Array.from(
        { length: faker.number.int({ min: 3, max: 7 }) },
        () => faker.lorem.sentence(),
      ),
      aiImpactScore: faker.number.int({ min: 20, max: 98 }),
      version: `v${faker.number.int({ min: 1, max: 5 })}.${faker.number.int({ min: 0, max: 9 })}`,
      tags: faker.helpers.arrayElements(
        ["aml", "kyc", "privacy", "cyber", "reporting", "consumer", "risk"],
        { min: 1, max: 3 },
      ),
      createdAt: iso(publishedAt),
      updatedAt: iso(randomDate(publishedAt, effectiveAt)),
    };
  });
}

function generateComplianceObligations(
  regulations: Regulation[],
  users: UserProfile[],
  count = 120,
): ComplianceObligation[] {
  return Array.from({ length: count }, (_, i) => {
    const regulation = pick(regulations);
    const owner = pick(users.filter((u) => u.role === "owner"));
    const approver = pick(
      users.filter((u) => u.role === "approver" || u.role === "admin"),
    );
    const reviewers = faker.helpers.arrayElements(
      users.filter((u) => u.role === "reviewer"),
      { min: 0, max: 2 },
    );

    const dueOffset = weightedPick([
      { item: faker.number.int({ min: -120, max: -31 }), weight: 10 },
      { item: faker.number.int({ min: -30, max: 30 }), weight: 20 },
      { item: faker.number.int({ min: 31, max: 90 }), weight: 25 },
      { item: faker.number.int({ min: 91, max: 365 }), weight: 30 },
      { item: faker.number.int({ min: -730, max: -121 }), weight: 15 },
    ]);
    const dueDate = addDays(today, dueOffset);
    const createdAt = subDays(dueDate, faker.number.int({ min: 60, max: 365 }));

    let status = pick(COMPLIANCE_STATUSES);
    if (
      isBefore(dueDate, today) &&
      !["Completed", "Approved", "Archived"].includes(status)
    ) {
      status = weightedPick<ComplianceObligation["status"]>([
        { item: "Overdue", weight: 50 },
        { item: "Pending Review", weight: 20 },
        { item: "Submitted", weight: 20 },
        { item: "Rejected", weight: 10 },
      ]);
    }
    if (isAfter(dueDate, addDays(today, 14)) && faker.datatype.boolean(0.3)) {
      status = "Draft";
    }

    return {
      id: uid("cmp"),
      complianceId: `COMP-${today.getFullYear()}-${pad(i + 1)}`,
      title: `${regulation.category} ${faker.company.buzzPhrase()}`,
      description: faker.lorem.paragraph(2),
      businessUnit: pick(BUSINESS_UNITS),
      department: pick(DEPARTMENTS),
      location: pick(LOCATIONS),
      regulationId: regulation.id,
      regulationName: regulation.title,
      ownerId: owner.id,
      ownerName: owner.name,
      approverId: approver.id,
      approverName: approver.name,
      reviewerIds: reviewers.map((r) => r.id),
      frequency: pick(FREQUENCIES),
      criticality: faker.helpers.weightedArrayElement([
        { weight: 10, value: "low" },
        { weight: 30, value: "medium" },
        { weight: 40, value: "high" },
        { weight: 20, value: "critical" },
      ]),
      dueDate: iso(dueDate),
      penalty: faker.helpers.arrayElement([
        "Up to $1M fine",
        "License suspension",
        "Regulatory censure",
        "Mandatory remediation",
        "Reputational damage",
        "Up to $50K daily fine",
      ]),
      status,
      aiRiskScore: faker.number.int({ min: 15, max: 98 }),
      tags: faker.helpers.arrayElements(
        ["aml", "kyc", "privacy", "cyber", "reporting", "consumer", "risk"],
        { min: 1, max: 3 },
      ),
      aiRecommendation: faker.datatype.boolean(0.4)
        ? faker.lorem.sentence()
        : undefined,
      progress: faker.number.int({ min: 0, max: 100 }),
      evidenceRequired: Array.from(
        { length: faker.number.int({ min: 1, max: 4 }) },
        () => faker.lorem.words(2),
      ),
      createdAt: iso(createdAt),
      updatedAt: iso(randomDate(createdAt, dueDate)),
    };
  });
}

function generateSubmissions(
  compliance: ComplianceObligation[],
  users: UserProfile[],
  count = 200,
): ComplianceSubmission[] {
  return Array.from({ length: count }, () => {
    const item = pick(compliance);
    const owner = users.find((u) => u.id === item.ownerId) ?? pick(users);
    const performedDate = randomDate(subDays(today, 180), today);
    return {
      id: uid("sub"),
      complianceId: item.id,
      complianceTitle: item.title,
      ownerId: owner.id,
      ownerName: owner.name,
      performedDate: iso(performedDate),
      status: pick(COMPLIANCE_SUBMISSION_STATUSES),
      comments: faker.lorem.paragraph(),
      evidenceIds: [],
      additionalNotes: faker.lorem.sentence(),
      capRequired: faker.datatype.boolean(0.25),
      riskRating: pick(PRIORITY_LEVELS),
      aiSuggestion: faker.datatype.boolean(0.3)
        ? faker.lorem.sentence()
        : undefined,
      createdAt: iso(performedDate),
      updatedAt: iso(randomDate(performedDate, today)),
    };
  });
}

function generateEvidence(
  compliance: ComplianceObligation[],
  users: UserProfile[],
  count = 150,
): Evidence[] {
  return Array.from({ length: count }, () => {
    const item = pick(compliance);
    const owner = users.find((u) => u.id === item.ownerId) ?? pick(users);
    const category = pick(EVIDENCE_CATEGORIES);
    const uploadDate = randomDate(subDays(today, 180), today);
    const status = weightedPick<Evidence["status"]>([
      { item: "Completed", weight: 30 },
      { item: "Suitable Evidence", weight: 25 },
      { item: "AI Validation", weight: 10 },
      { item: "Questionable Evidence", weight: 10 },
      { item: "Insufficient Evidence", weight: 10 },
      { item: "Wrong Document", weight: 5 },
      { item: "Scanning", weight: 5 },
      { item: "Uploading", weight: 5 },
    ]);
    const score = faker.number.int({ min: 45, max: 99 });
    return {
      id: uid("evd"),
      name: `${category} - ${faker.system.fileName()}`,
      fileName: faker.system.fileName(),
      category,
      complianceId: item.id,
      complianceTitle: item.title,
      ownerId: owner.id,
      ownerName: owner.name,
      department: item.department,
      businessUnit: item.businessUnit,
      uploadDate: iso(uploadDate),
      version: faker.number.int({ min: 1, max: 4 }),
      status,
      aiValidation: {
        status:
          score > 85
            ? "suitable"
            : score > 70
              ? "questionable"
              : score > 50
                ? "insufficient"
                : "wrong_document",
        score,
        issues: faker.helpers.arrayElements(
          [
            "Missing signature",
            "Unreadable page",
            "Incorrect form version",
            "Page missing",
          ],
          { min: 0, max: 2 },
        ),
        missingItems: faker.helpers.arrayElements(
          ["Seal", "Date stamp", "Authorization"],
          { min: 0, max: 2 },
        ),
        confidence: faker.number.float({ min: 0.7, max: 0.96 }),
        recommendations: faker.helpers.arrayElements(
          ["Rescan document", "Upload signed version", "Add missing pages"],
          { min: 0, max: 2 },
        ),
        extractedMetadata: {
          "Document Type": category,
          "Reference Number": faker.string.alphanumeric(8).toUpperCase(),
        },
      },
      fileSize: faker.number.int({ min: 10000, max: 10000000 }),
      fileType: faker.helpers.arrayElement([
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/png",
        "text/csv",
      ]),
      checksum: faker.string.alphanumeric(64),
      tags: faker.helpers.arrayElements(["audit", "kyc", "policy", "license"], {
        min: 1,
        max: 3,
      }),
      ocrText: faker.datatype.boolean(0.5)
        ? faker.lorem.paragraphs(2)
        : undefined,
      url: faker.system.filePath(),
      createdAt: iso(uploadDate),
      updatedAt: iso(randomDate(uploadDate, today)),
    };
  });
}

function generateCAPs(
  compliance: ComplianceObligation[],
  users: UserProfile[],
  count = 60,
): CAP[] {
  return Array.from({ length: count }, (_, i) => {
    const item = pick(compliance);
    const owner = pick(users.filter((u) => u.role === "owner"));
    const approver = pick(
      users.filter((u) => u.role === "approver" || u.role === "admin"),
    );
    const createdAt = randomDate(subDays(today, 180), subDays(today, 7));
    const dueDate = addDays(createdAt, faker.number.int({ min: 30, max: 180 }));
    const status = isBefore(dueDate, today)
      ? weightedPick<CAP["status"]>([
          { item: "Closed", weight: 40 },
          { item: "Overdue", weight: 35 },
          { item: "In Progress", weight: 20 },
          { item: "Open", weight: 5 },
        ])
      : weightedPick<CAP["status"]>([
          { item: "Open", weight: 30 },
          { item: "In Progress", weight: 50 },
          { item: "Pending Approval", weight: 15 },
          { item: "Closed", weight: 5 },
        ]);
    const progress =
      status === "Closed" ? 100 : faker.number.int({ min: 10, max: 90 });
    const actionCount = faker.number.int({ min: 2, max: 6 });
    const actions: CAPAction[] = Array.from(
      { length: actionCount },
      (__, j) => ({
        id: uid("act"),
        capId: "",
        title: `Action ${j + 1}: ${faker.lorem.sentence(3)}`,
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
      }),
    );
    return {
      id: uid("cap"),
      capId: `CAP-${today.getFullYear()}-${pad(i + 1)}`,
      title: `Remediate ${item.title}`,
      description: faker.lorem.paragraph(3),
      priority: faker.helpers.weightedArrayElement([
        { weight: 10, value: "low" },
        { weight: 30, value: "medium" },
        { weight: 40, value: "high" },
        { weight: 20, value: "critical" },
      ]),
      risk: item.criticality,
      ownerId: owner.id,
      ownerName: owner.name,
      approverId: approver.id,
      approverName: approver.name,
      department: item.department,
      businessUnit: item.businessUnit,
      location: item.location,
      dueDate: iso(dueDate),
      status,
      estimatedCost: faker.number.int({ min: 5000, max: 500000 }),
      actualCost: faker.number.int({ min: 0, max: 500000 }),
      rootCause: faker.lorem.sentence(),
      complianceId: item.id,
      complianceTitle: item.title,
      evidenceIds: [],
      actions,
      aiSuggestions: [
        {
          rootCause: faker.lorem.sentence(),
          recommendedActions: Array.from({ length: 3 }, () =>
            faker.lorem.sentence(4),
          ),
          timeline: `${faker.number.int({ min: 2, max: 12 })} weeks`,
          priority: pick(PRIORITY_LEVELS),
          estimatedEffort: `${faker.number.int({ min: 20, max: 200 })} hours`,
          confidence: faker.number.float({ min: 0.72, max: 0.94 }),
          rationale: faker.lorem.sentence(),
        },
      ],
      progress,
      tags: item.tags,
      createdAt: iso(createdAt),
      updatedAt: iso(randomDate(createdAt, today)),
    };
  });
}

function generateLicenses(
  regulations: Regulation[],
  users: UserProfile[],
  count = 40,
): License[] {
  return Array.from({ length: count }, (_, i) => {
    const category = pick(LICENSE_CATEGORIES);
    const owner = pick(users.filter((u) => u.role === "owner"));
    const approver = pick(
      users.filter((u) => u.role === "approver" || u.role === "admin"),
    );
    const regulation = pick(regulations);
    const issueDate = randomDate(subDays(today, 730), subDays(today, 30));
    const expiryDate = addDays(
      issueDate,
      faker.number.int({ min: 180, max: 1095 }),
    );
    const remainingDays = Math.floor(
      (new Date(expiryDate).getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    let status: License["status"] = "Active";
    if (remainingDays < 0) status = "Expired";
    else if (remainingDays <= 60) status = "Expiring Soon";
    else if (faker.datatype.boolean(0.15)) status = "Renewed";
    else if (faker.datatype.boolean(0.05)) status = "Suspended";
    return {
      id: uid("lic"),
      licenseNumber: `LIC-${faker.string.alpha({ length: 3, casing: "upper" })}-${pad(i + 1, 4)}`,
      licenseName: `${category} - ${faker.location.country()}`,
      issuingAuthority: pick(REGULATORS),
      department: pick(DEPARTMENTS),
      businessUnit: pick(BUSINESS_UNITS),
      country: faker.location.country(),
      location: pick(LOCATIONS),
      issueDate: iso(issueDate),
      expiryDate: iso(expiryDate),
      renewalCycle: pick(["Annual", "Biennial", "Triennial", "Five-Year"]),
      ownerId: owner.id,
      ownerName: owner.name,
      approverId: approver.id,
      approverName: approver.name,
      criticality: faker.helpers.weightedArrayElement([
        { weight: 15, value: "low" },
        { weight: 35, value: "medium" },
        { weight: 35, value: "high" },
        { weight: 15, value: "critical" },
      ]),
      status,
      regulationId: regulation.id,
      regulationName: regulation.title,
      aiRiskScore: faker.number.int({ min: 10, max: 95 }),
      remainingDays,
      renewalPriority:
        remainingDays < 30
          ? "critical"
          : remainingDays < 60
            ? "high"
            : remainingDays < 120
              ? "medium"
              : "low",
      supportingDocumentIds: [],
      tags: faker.helpers.arrayElements(["license", "renewal", "regulatory"], {
        min: 1,
        max: 2,
      }),
      createdAt: iso(issueDate),
      updatedAt: iso(randomDate(issueDate, today)),
    };
  });
}

function generateNotifications(
  users: UserProfile[],
  count = 30,
): Notification[] {
  const types = [
    "approval",
    "compliance",
    "license",
    "cap",
    "ai",
    "system",
  ] as const;
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
      entityType: pick([
        "compliance",
        "evidence",
        "cap",
        "license",
        "regulation",
      ]),
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
    "evidence",
    "cap",
    "license",
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
    { name: "Reviewer", permissions: ["view", "export"] },
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

function generateTemplates(
  regulations: Regulation[],
  users: UserProfile[],
  count = 15,
): Template[] {
  return Array.from({ length: count }, (_, i) => {
    const owner = pick(users.filter((u) => u.role === "owner"));
    const approver = pick(
      users.filter((u) => u.role === "approver" || u.role === "admin"),
    );
    const regulation = pick(regulations);
    return {
      id: uid("tmpl"),
      title: `${pick(CATEGORIES)} Template ${i + 1}`,
      description: faker.lorem.paragraph(),
      category: regulation.category,
      frequency: pick(FREQUENCIES),
      ownerId: owner.id,
      ownerName: owner.name,
      approverId: approver.id,
      approverName: approver.name,
      evidenceRequirements: Array.from(
        { length: faker.number.int({ min: 1, max: 4 }) },
        () => faker.lorem.words(2),
      ),
      criticality: pick(PRIORITY_LEVELS),
      applicableRegulationIds: [regulation.id],
      status: pick(["draft", "published", "archived"]),
      tags: regulation.tags,
      createdAt: iso(subDays(today, 200)),
      updatedAt: iso(subDays(today, 20)),
    };
  });
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
    name: "Acme Financial Services",
    industry: "Financial Services",
    jurisdictions: [
      "United States",
      "United Kingdom",
      "Singapore",
      "Hong Kong",
    ],
    businessUnits: [
      "Retail Banking",
      "Corporate Banking",
      "Wealth Management",
      "Investment Banking",
      "Insurance",
      "Operations",
      "Technology",
    ],
    departments: [
      "Risk & Compliance",
      "Legal",
      "Operations",
      "Finance",
      "Treasury",
      "Retail Banking",
      "Corporate Banking",
      "IT Security",
      "Human Resources",
      "Internal Audit",
    ],
    locations: [
      "New York",
      "London",
      "Singapore",
      "Hong Kong",
      "Tokyo",
      "Sydney",
      "Dubai",
      "Frankfurt",
    ],
    defaultFrequency: "quarterly",
    criticalityLevels: ["low", "medium", "high", "critical"],
    penaltyThresholds: [
      { label: "Low", value: 10000 },
      { label: "Medium", value: 50000 },
      { label: "High", value: 250000 },
      { label: "Critical", value: 1000000 },
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
  entityType: "compliance",
): ComplianceTimelineEvent[];
function generateTimelineFor(
  entityId: string,
  entityType: "cap",
): CAPTimelineEvent[];
function generateTimelineFor(
  entityId: string,
  entityType: "license" | "regulation" | "evidence",
): TimelineEvent[];
function generateTimelineFor(entityId: string, entityType: string): unknown[] {
  const eventTypes: Record<string, string[]> = {
    compliance: [
      "created",
      "assigned",
      "updated",
      "submitted",
      "approved",
      "rejected",
      "cap_created",
      "closed",
      "commented",
      "evidence_uploaded",
    ],
    cap: [
      "created",
      "assigned",
      "updated",
      "completed",
      "approved",
      "rejected",
      "commented",
      "evidence_uploaded",
    ],
    license: ["created", "updated", "renewed", "expired", "approved"],
    regulation: ["published", "updated"],
    evidence: ["uploaded", "scanning", "ai_validation", "approved", "rejected"],
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
    if (entityType === "compliance") event.complianceId = entityId;
    else if (entityType === "cap") event.capId = entityId;
    else {
      event.entityId = entityId;
      event.entityType = entityType;
    }
    return event;
  });
}

function generateCommentsFor(
  entityId: string,
  entityType: "compliance",
): ComplianceComment[];
function generateCommentsFor(entityId: string, entityType: "cap"): CAPComment[];
function generateCommentsFor(
  entityId: string,
  entityType: "evidence",
): EvidenceComment[];
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
    if (entityType === "compliance") comment.complianceId = entityId;
    else if (entityType === "cap") comment.capId = entityId;
    else if (entityType === "evidence") comment.evidenceId = entityId;
    else {
      comment.entityId = entityId;
      comment.entityType = entityType;
    }
    return comment;
  });
}

export interface MockDb {
  users: UserProfile[];
  regulations: Regulation[];
  compliance: ComplianceObligation[];
  submissions: ComplianceSubmission[];
  evidence: Evidence[];
  caps: CAP[];
  licenses: License[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  roles: RoleEntity[];
  organizations: Organization[];
  templates: Template[];
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
  const compliance = generateComplianceObligations(regulations, users);
  const submissions = generateSubmissions(compliance, users);
  const evidence = generateEvidence(compliance, users);
  const caps = generateCAPs(compliance, users);
  const licenses = generateLicenses(regulations, users);
  const notifications = generateNotifications(users);
  const auditLogs = generateAuditLogs(users);
  const roles = generateRoles();
  const organizations = generateOrganizations();
  const templates = generateTemplates(regulations, users);
  const aiConfig = generateAIConfig();
  const organizationSettings = generateOrganizationSettings();

  dbInstance = {
    users,
    regulations,
    compliance,
    submissions,
    evidence,
    caps,
    licenses,
    notifications,
    auditLogs,
    roles,
    organizations,
    templates,
    aiConfig,
    organizationSettings,
    generateTimelineFor,
    generateCommentsFor,
  };

  if (import.meta.env.DEV) {
    console.log("[MockDB] Generated", {
      users: users.length,
      regulations: regulations.length,
      compliance: compliance.length,
      submissions: submissions.length,
      evidence: evidence.length,
      caps: caps.length,
      licenses: licenses.length,
      notifications: notifications.length,
      auditLogs: auditLogs.length,
      roles: roles.length,
      organizations: organizations.length,
      templates: templates.length,
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
