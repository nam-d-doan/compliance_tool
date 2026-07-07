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
  Article,
  ComplianceObligation,
  ComplianceSubmission,
  CAP,
  CAPAction,
  Notification,
  ComplianceTimelineEvent,
  CAPTimelineEvent,
  ComplianceComment,
  CAPComment,
  RegulationDependency,
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
  "Ngân hàng Nhà nước Việt Nam (SBV)",
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

const ARTICLE_THEMES = [
  "Phạm vi điều chỉnh",
  "Đối tượng áp dụng",
  "Giải thích từ ngữ",
  "Trách nhiệm của tổ chức tín dụng",
  "Yêu cầu báo cáo",
  "Xử lý vi phạm",
  "Hiệu lực thi hành",
  "Quy định chuyển tiếp",
  "Trách nhiệm giải trình",
  "Giám sát và thanh tra",
  "Quản lý hồ sơ",
  "Ngưỡng an toàn vốn tối thiểu",
  "Tỷ lệ an toàn vốn",
  "Quản lý rủi ro tín dụng",
  "Phân loại nợ",
  "Trích lập dự phòng",
  "Phòng chống rửa tiền",
  "Nhận diện khách hàng",
  "Giao dịch đáng ngờ",
  "Bảo mật thông tin",
  "An toàn thông tin",
  "Quản trị nội bộ",
  "Hội đồng quản trị",
  "Ban kiểm soát",
  "Công bố thông tin",
  "Minh bạch giao dịch",
  "Bảo vệ người tiêu dùng",
  "Giải quyết khiếu nại",
  "Quản lý rủi ro hoạt động",
  "Báo cáo sự cố",
  "Kế hoạch kinh doanh",
  "Kiểm toán nội bộ",
  "Kiểm soát nội bộ",
  "Tuân thủ pháp luật",
  "Đạo đức kinh doanh",
  "Xung đột lợi ích",
  "Giao dịch liên kết",
  "Cấp tín dụng",
  "Giám sát chi phí",
  "Quản lý tài sản",
  "Thanh khoản",
  "Tỷ lệ nợ xấu",
  "Tái cấp vốn",
  "Giao dịch ngoại hối",
  "Phái sinh tài chính",
  "Kinh doanh chứng khoán",
  "Quản lý danh mục",
  "Bán hàng đa cấp",
  "Thu hồi nợ",
  "Xử lý tài sản bảo đảm",
  "Tổ chức tín dụng phi ngân hàng",
  "Hợp tác xã tín dụng",
  "Công ty tài chính",
  "Cho thuê tài chính",
  "Bảo hiểm tiền gửi",
  "Giải quyết phá sản",
  "Cơ cấu lại tín dụng",
  "Miễn giảm lãi vay",
  "Gia hạn nợ",
  "Cấp tín dụng mới",
  "Giám sát đặc biệt",
  "Kiểm soát đặc biệt",
  "Đình chỉ hoạt động",
  "Thu hồi giấy phép",
  "Bắt buộc chuyển nhượng",
  "Phong tỏa tài sản",
  "Khởi tố hình sự",
  "Hợp tác quốc tế",
  "Trao đổi thông tin",
  "Thỏa thuận song phương",
  "Chuẩn mực kế toán",
  "Báo cáo tài chính",
  "Kiểm toán báo cáo tài chính",
  "Phân tích tài chính",
  "Giới hạn giao dịch",
  "Hạn mức tín dụng",
  "Tỷ lệ bảo đảm",
  "Định giá tài sản",
  "Thẩm định dự án",
  "Quản lý nợ công",
  "Rủi ro lãi suất",
  "Rủi ro tỷ giá",
  "Rủi ro thanh khoản",
  "Rủi ro tập trung",
  "Rủi ro danh mục",
];

function generateArticles(count: number, effectiveAt: Date): Article[] {
  return Array.from({ length: count }, (_, j) => {
    const theme = ARTICLE_THEMES[j % ARTICLE_THEMES.length];
    return {
      id: faker.string.uuid(),
      number: `${j + 1}`,
      title: `Điều ${j + 1}: ${theme}`,
      summary: faker.lorem.paragraph(2),
      effectiveDate: iso(effectiveAt),
      status: "active" as const,
    };
  });
}

function generateRegulations(count = 8): Regulation[] {
  // Realistic Vietnamese regulatory document numbers and titles
  const sbvPrefixes = [
    "Thông tư 19/2016/TT-NHNN",
    "Thông tư 22/2019/TT-NHNN",
    "Thông tư 03/2021/TT-NHNN",
    "Thông tư 41/2016/TT-NHNN",
    "Thông tư 39/2016/TT-NHNN",
    "Quyết định 35/2018/QĐ-NHNN",
    "Thông tư 52/2018/TT-NHNN",
    "Thông tư 07/2019/TT-NHNN",
  ];
  const ubcknnPrefixes = [
    "Thông tư 96/2020/TT-UBCK",
    "Thông tư 119/2020/TT-UBCK",
    "Thông tư 13/2017/TT-UBCK",
    "Thông tư 21/2021/TT-UBCK",
    "Quyết định 05/2021/QĐ-UBCK",
    "Quyết định 12/2020/QĐ-UBCK",
  ];
  const baselPrefixes = [
    "Basel III Framework",
    "Basel IV Standards",
    "Basel Committee Guidelines",
  ];

  const sbvDescriptions = [
    "Quy định của Ngân hàng Nhà nước về tỷ lệ an toàn vốn đối với các tổ chức tín dụng hoạt động tại Việt Nam.",
    "Hướng dẫn triển khai các biện pháp quản lý rủi ro tín dụng và phân loại nợ theo quy định mới.",
    "Yêu cầu báo cáo, lưu trữ và cung cấp thông tin phục vụ công tác giám sát ngân hàng.",
  ];
  const ubcknnDescriptions = [
    "Quy định về quản lý hoạt động đầu tư chứng khoán và bảo vệ quyền lợi nhà đầu tư.",
    "Hướng dẫn công bố thông tin, minh bạch giao dịch và xử lý vi phạm trên thị trường chứng khoán.",
    "Yêu cầu về quản trị rủi ro đối với các công ty chứng khoán và quỹ đầu tư.",
  ];
  const baselDescriptions = [
    "Khung quốc tế về tỷ lệ an toàn vốn, quản lý rủi ro và giám sát ngân hàng toàn cầu.",
    "Tiêu chuẩn nguồn vốn và cách tính toán rủi ro tín dụng thống nhất cho các nhà băng.",
  ];

  return Array.from({ length: count }, (_, i) => {
    const category = pick(CATEGORIES);
    const regulatoryBody = pick(REGULATORS);
    const effectiveAt = randomDate(subDays(today, 365), addDays(today, 180));
    const publishedAt = subDays(
      effectiveAt,
      faker.number.int({ min: 30, max: 180 }),
    );

    // Determine source: Vietnamese regulators are 'internal', Basel is 'external'
    const source: "internal" | "external" =
      regulatoryBody === "Basel Committee on Banking Supervision"
        ? "external"
        : faker.helpers.arrayElement(["internal", "external"]);

    // Build a realistic title based on regulator
    let title: string;
    if (regulatoryBody === "Ngân hàng Nhà nước Việt Nam (SBV)") {
      const prefix = sbvPrefixes[i % sbvPrefixes.length];
      title = `${prefix} - ${category}`;
    } else if (regulatoryBody === "Ủy ban Chứng khoán Nhà nước (UBCKNN)") {
      const prefix = ubcknnPrefixes[i % ubcknnPrefixes.length];
      title = `${prefix} - ${category}`;
    } else {
      const prefix = baselPrefixes[i % baselPrefixes.length];
      title = `${prefix} - ${category}`;
    }

    // Pick a regulator-specific description
    let description: string;
    if (regulatoryBody === "Ngân hàng Nhà nước Việt Nam (SBV)") {
      description = pick(sbvDescriptions);
    } else if (regulatoryBody === "Ủy ban Chứng khoán Nhà nước (UBCKNN)") {
      description = pick(ubcknnDescriptions);
    } else {
      description = pick(baselDescriptions);
    }

    // First regulation is the flagship large regulation with ~80 articles;
    // remaining regulations are still substantial (10-20 articles each).
    const isFlagship = i === 0;
    const articleCount = isFlagship
      ? faker.number.int({ min: 78, max: 84 })
      : faker.number.int({ min: 10, max: 20 });
    const articles = generateArticles(articleCount, effectiveAt);

    const expirationDate = faker.datatype.boolean(0.3)
      ? iso(addDays(effectiveAt, faker.number.int({ min: 365, max: 1825 })))
      : undefined;

    let status: Regulation["status"] = "Effective";
    if (expirationDate && isBefore(new Date(expirationDate), today)) {
      status = "Expired";
    } else if (isFlagship) {
      status = "Effective";
    } else if (faker.datatype.boolean(0.15)) {
      status = "Superseded";
    }

    return {
      id: uid("reg"),
      title,
      description,
      category,
      regulatoryBody,
      effectiveDate: iso(effectiveAt),
      expirationDate,
      status,
      priority: faker.helpers.arrayElement(PRIORITY_LEVELS),
      source,
      articles,
      createdDate: iso(publishedAt),
      updatedDate: iso(randomDate(publishedAt, effectiveAt)),
    };
  });
}

/**
 * Create realistic dependencies between generated regulations.
 * Most links are between Vietnamese regulations; a few reference
 * international Basel guidance to reflect local implementation.
 */
function generateRegulationDependencies(
  regulations: Regulation[],
): RegulationDependency[] {
  // Find a regulation matching body + category. Falls back to any regulation
  // from the same regulator so cross-references stay realistic even when the
  // exact category distribution is sparse.
  const find = (
    body: string,
    category: string,
    fallback = true,
  ): Regulation | undefined => {
    const match = regulations.find(
      (r) => r.regulatoryBody === body && r.category === category,
    );
    if (match || !fallback) return match;
    return regulations.find((r) => r.regulatoryBody === body);
  };

  // Find two distinct regulations matching the same body + category.
  // Falls back to any two regulations from the same regulator if the exact
  // category has fewer than two matches.
  const findPair = (
    body: string,
    category: string,
  ): { from: Regulation | undefined; to: Regulation | undefined } => {
    let matches = regulations.filter(
      (r) => r.regulatoryBody === body && r.category === category,
    );
    if (matches.length < 2) {
      matches = regulations.filter((r) => r.regulatoryBody === body);
    }
    return { from: matches[0], to: matches[1] };
  };

  const candidates: Array<{
    from: Regulation | undefined;
    to: Regulation | undefined;
    type: RegulationDependency["type"];
    description: string;
    notes?: string;
  }> = [
    {
      // SBV capital adequacy circular updates an older SBV decision
      ...findPair("Ngân hàng Nhà nước Việt Nam (SBV)", "An toàn vốn"),
      type: "amends",
      description:
        "Sửa đổi, bổ sung một số quy định về tỷ lệ an toàn vốn áp dụng cho tổ chức tín dụng.",
      notes: "Thay thế ngưỡng CAR tối thiểu theo khung Basel III.",
    },
    {
      // Newer SBV credit risk circular supersedes the older one
      ...findPair(
        "Ngân hàng Nhà nước Việt Nam (SBV)",
        "Quản lý rủi ro tín dụng",
      ),
      type: "supersedes",
      description:
        "Thay thế toàn bộ quy định về phân loại nợ và trích lập dự phòng rủi ro tín dụng.",
    },
    {
      // Current AML circular repeals an outdated SBV AML decision
      ...findPair("Ngân hàng Nhà nước Việt Nam (SBV)", "Rửa tiền"),
      type: "repeals",
      description:
        "Bãi bỏ quy định cũ về phòng chống rửa tiền sau khi ban hành thông tư mới.",
    },
    {
      // SBV capital rule references the Basel framework it implements
      from: find("Ngân hàng Nhà nước Việt Nam (SBV)", "An toàn vốn"),
      to: find("Basel Committee on Banking Supervision", "An toàn vốn"),
      type: "references",
      description:
        "Việt Nam áp dụng các nguyên tắc về tỷ lệ an toàn vốn theo khung Basel III.",
      notes: "Basel là cơ sở quốc tế cho quy định nội địa.",
    },
    {
      // UBCKNN consumer protection circular amends an earlier decision
      ...findPair(
        "Ủy ban Chứng khoán Nhà nước (UBCKNN)",
        "Bảo vệ người tiêu dùng",
      ),
      type: "amends",
      description:
        "Sửa đổi quy định về công bố thông tin và bảo vệ nhà đầu tư trên thị trường chứng khoán.",
    },
    {
      // UBCKNN securities services circular references SBV banking rule
      from: find("Ủy ban Chứng khoán Nhà nước (UBCKNN)", "Dịch vụ chứng khoán"),
      to: find("Ngân hàng Nhà nước Việt Nam (SBV)", "Quản trị nội bộ"),
      type: "references",
      description:
        "Tham chiếu yêu cầu quản trị nội bộ của ngân hàng khi công ty chứng khoán có giao dịch liên kết.",
    },
    {
      // New SBV operational risk circular supersedes the old one
      ...findPair(
        "Ngân hàng Nhà nước Việt Nam (SBV)",
        "Quản lý rủi ro hoạt động",
      ),
      type: "supersedes",
      description:
        "Thay thế quy định về quản lý rủi ro hoạt động và yêu cầu báo cáo sự cố.",
    },
    {
      // SBV internal governance circular references Basel guidance
      from: find("Ngân hàng Nhà nước Việt Nam (SBV)", "Quản trị nội bộ"),
      to: find("Basel Committee on Banking Supervision", "Quản trị nội bộ"),
      type: "references",
      description:
        "Áp dụng nguyên tắc quản trị ngân hàng tốt theo hướng dẫn của Basel.",
    },
    {
      // SBV financial reporting circular amends older reporting decision
      ...findPair("Ngân hàng Nhà nước Việt Nam (SBV)", "Báo cáo tài chính"),
      type: "amends",
      description:
        "Cập nhật mẫu biểu và thời hạn báo cáo tài chính định kỳ của tổ chức tín dụng.",
    },
    {
      // Basel risk standards referenced by SBV credit risk circular
      from: find(
        "Ngân hàng Nhà nước Việt Nam (SBV)",
        "Quản lý rủi ro tín dụng",
      ),
      to: find(
        "Basel Committee on Banking Supervision",
        "Quản lý rủi ro tín dụng",
      ),
      type: "references",
      description:
        "Quy định nội địa về rủi ro tín dụng dựa trên tiêu chuẩn tiếp cận nội bảng của Basel.",
    },
  ];

  // Build dependencies, skipping any candidate where a matching regulation
  // could not be found and ensuring we don't link a regulation to itself.
  return candidates
    .filter((c) => c.from && c.to && c.from.id !== c.to.id)
    .map((c, i) => ({
      id: uid("dep"),
      fromRegulationId: c.from!.id,
      toRegulationId: c.to!.id,
      type: c.type,
      description: c.description,
      notes: c.notes,
      createdDate: iso(subDays(today, 30 + i * 5)),
    }));
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
        "Operational suspension",
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
      criticality: pick(PRIORITY_LEVELS),
      applicableRegulationIds: [regulation.id],
      status: pick(["draft", "published", "archived"]),
      tags: faker.helpers.arrayElements(
        ["aml", "kyc", "privacy", "cyber", "reporting", "consumer", "risk"],
        { min: 1, max: 3 },
      ),
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
  entityType: "regulation",
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
  regulationDependencies: RegulationDependency[];
  compliance: ComplianceObligation[];
  submissions: ComplianceSubmission[];
  caps: CAP[];
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
  const regulationDependencies = generateRegulationDependencies(regulations);
  const compliance = generateComplianceObligations(regulations, users);
  const submissions = generateSubmissions(compliance, users);
  const caps = generateCAPs(compliance, users);
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
    regulationDependencies,
    compliance,
    submissions,
    caps,
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
      regulationDependencies: regulationDependencies.length,
      compliance: compliance.length,
      submissions: submissions.length,
      caps: caps.length,
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
