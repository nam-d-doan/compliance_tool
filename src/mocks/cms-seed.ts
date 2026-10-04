import { addDays, formatISO, setHours, startOfDay, subDays } from "date-fns";
import type {
  EscalationRecord,
  EscalationRule,
  IcisFinding,
  InternalRegulation,
  IssueSource,
  IssueWorkflow,
  LegalArticle,
  LegalMapping,
  LegalUpdate,
  NonComplianceCase,
  OrganizationSettings,
  QdnbVersion,
  ReminderRecord,
  ReportTemplate,
  RevisionApprovalStep,
  RevisionTask,
  RiskAssessment,
  RiskMatrix,
  RiskScores,
  ScheduledReport,
  UserProfile,
} from "@/types";
import { computeWeightedScore, levelForScore } from "@/lib/cms-rules";

/**
 * Curated, deterministic sample data for the Nam A Bank CMS modules
 * (RFQ Phụ lục 1). Dates are relative to the real current day so the demo
 * always looks current. All documents, numbers and people are illustrative.
 */

const base = startOfDay(new Date());
const d = (offsetDays: number, hour = 9) =>
  formatISO(setHours(addDays(base, offsetDays), hour));
const iso = (date: Date) => formatISO(date);

export const ESCALATION_TARGETS = {
  1: "Unit head (Trưởng đơn vị)",
  2: "Head of Compliance (GĐ Khối Tuân thủ)",
  3: "Ban Điều hành & Ban Kiểm soát",
} as const;

// ---------------------------------------------------------------------------
// Risk Rating Matrix
// ---------------------------------------------------------------------------

const CRITERIA_V2: RiskMatrix["criteria"] = [
  {
    key: "fine",
    label: "Fine amount",
    labelVi: "Mức phạt tiền",
    weight: 35,
    scale: [
      {
        score: 1,
        label: "< 20 triệu",
        description: "Nhắc nhở hoặc phạt dưới 20 triệu đồng",
      },
      {
        score: 2,
        label: "20–100 triệu",
        description: "Phạt từ 20 đến dưới 100 triệu đồng",
      },
      {
        score: 3,
        label: "100–500 triệu",
        description: "Phạt từ 100 đến dưới 500 triệu đồng",
      },
      {
        score: 4,
        label: "500 triệu – 2 tỷ",
        description: "Phạt từ 500 triệu đến dưới 2 tỷ đồng",
      },
      {
        score: 5,
        label: "> 2 tỷ / đình chỉ",
        description: "Phạt từ 2 tỷ đồng hoặc bị đình chỉ, hạn chế hoạt động",
      },
    ],
  },
  {
    key: "reputation",
    label: "Reputational impact",
    labelVi: "Ảnh hưởng uy tín",
    weight: 25,
    scale: [
      {
        score: 1,
        label: "Negligible",
        description: "Chỉ ảnh hưởng nội bộ, không có khách hàng biết",
      },
      {
        score: 2,
        label: "Limited",
        description: "Một số khách hàng bị ảnh hưởng, xử lý được tại đơn vị",
      },
      {
        score: 3,
        label: "Moderate",
        description: "Khiếu nại tập trung hoặc báo chí địa phương đưa tin",
      },
      {
        score: 4,
        label: "Major",
        description: "Truyền thông toàn quốc, NHNN yêu cầu giải trình",
      },
      {
        score: 5,
        label: "Severe",
        description: "Mất niềm tin diện rộng, NHNN can thiệp trực tiếp",
      },
    ],
  },
  {
    key: "scope",
    label: "Scope of impact",
    labelVi: "Phạm vi tác động",
    weight: 20,
    scale: [
      {
        score: 1,
        label: "Single case",
        description: "Một giao dịch / một cá nhân",
      },
      {
        score: 2,
        label: "One unit",
        description: "Trong phạm vi một chi nhánh / phòng ban",
      },
      {
        score: 3,
        label: "Several units",
        description: "Nhiều đơn vị hoặc một vùng",
      },
      { score: 4, label: "Bank-wide", description: "Toàn hệ thống Nam A Bank" },
      {
        score: 5,
        label: "Bank-wide + customers",
        description: "Toàn hệ thống và khách hàng / đối tác bên ngoài",
      },
    ],
  },
  {
    key: "recurrence",
    label: "Recurrence",
    labelVi: "Tần suất lặp lại",
    weight: 20,
    scale: [
      {
        score: 1,
        label: "First time",
        description: "Lần đầu phát hiện trong 12 tháng",
      },
      {
        score: 2,
        label: "2nd time",
        description: "Lặp lại lần 2 trong 12 tháng",
      },
      {
        score: 3,
        label: "3rd time",
        description: "Lặp lại lần 3 trong 12 tháng",
      },
      {
        score: 4,
        label: "4–5 times",
        description: "Lặp lại 4–5 lần trong 12 tháng",
      },
      {
        score: 5,
        label: "Systemic",
        description: "Trên 5 lần hoặc mang tính hệ thống",
      },
    ],
  },
];

export function generateRiskMatrices(): RiskMatrix[] {
  const v1Criteria = CRITERIA_V2.map((c) => ({ ...c, weight: 25 }));
  return [
    {
      id: "rm-v2",
      version: 2,
      status: "active",
      effectiveFrom: d(-120),
      approvedBy: "Nguyễn Văn Hùng (Tổng Giám đốc)",
      approvedAt: d(-125),
      note: "Tăng trọng số Mức phạt tiền theo khung xử phạt mới; hạ ngưỡng mức Cao.",
      criteria: CRITERIA_V2,
      thresholds: { medium: 2.2, high: 3.4 },
      createdAt: d(-130),
      updatedAt: d(-125),
    },
    {
      id: "rm-v1",
      version: 1,
      status: "retired",
      effectiveFrom: d(-480),
      approvedBy: "Nguyễn Văn Hùng (Tổng Giám đốc)",
      approvedAt: d(-485),
      note: "Phiên bản ban đầu — trọng số bằng nhau.",
      criteria: v1Criteria,
      thresholds: { medium: 2.5, high: 3.5 },
      createdAt: d(-490),
      updatedAt: d(-120),
    },
  ];
}

export function generateEscalationRules(): EscalationRule[] {
  const rule = (r: Omit<EscalationRule, "createdAt" | "updatedAt">) => ({
    ...r,
    createdAt: d(-120),
    updatedAt: d(-120),
  });
  return [
    rule({
      id: "esc-high",
      name: "High risk → Executive Board & Supervisory Board",
      trigger: "risk_level",
      riskLevel: "high",
      level: 3,
      escalateTo: ESCALATION_TARGETS[3],
      channels: ["in_app", "email", "teams"],
      requireAck: true,
      slaHours: 4,
      appliesTo: ["issue"],
      active: true,
    }),
    rule({
      id: "esc-medium",
      name: "Medium risk → Head of Compliance",
      trigger: "risk_level",
      riskLevel: "medium",
      level: 2,
      escalateTo: ESCALATION_TARGETS[2],
      channels: ["in_app", "email"],
      requireAck: false,
      slaHours: 24,
      appliesTo: ["issue"],
      active: true,
    }),
    rule({
      id: "esc-low",
      name: "Low risk → handled by the unit",
      trigger: "risk_level",
      riskLevel: "low",
      level: 1,
      escalateTo: ESCALATION_TARGETS[1],
      channels: ["in_app"],
      requireAck: false,
      slaHours: 72,
      appliesTo: ["issue"],
      active: true,
    }),
    rule({
      id: "esc-od1",
      name: "1 day overdue → Unit head",
      trigger: "overdue",
      overdueDays: 1,
      level: 1,
      escalateTo: ESCALATION_TARGETS[1],
      channels: ["in_app", "email"],
      requireAck: false,
      slaHours: 24,
      appliesTo: ["issue", "revision"],
      active: true,
    }),
    rule({
      id: "esc-od7",
      name: "7 days overdue → Head of Compliance",
      trigger: "overdue",
      overdueDays: 7,
      level: 2,
      escalateTo: ESCALATION_TARGETS[2],
      channels: ["in_app", "email", "teams"],
      requireAck: true,
      slaHours: 24,
      appliesTo: ["issue", "revision"],
      active: true,
    }),
    rule({
      id: "esc-od15",
      name: "15 days overdue → Executive Board & Supervisory Board",
      trigger: "overdue",
      overdueDays: 15,
      level: 3,
      escalateTo: ESCALATION_TARGETS[3],
      channels: ["in_app", "email", "teams", "sms"],
      requireAck: true,
      slaHours: 4,
      appliesTo: ["issue", "revision"],
      active: true,
    }),
  ];
}

export function assessRisk(
  scores: RiskScores,
  matrix: RiskMatrix,
  ratedBy: string,
  ratedAt: string,
  override?: { level: RiskAssessment["finalLevel"]; reason: string },
): RiskAssessment {
  const weightedScore = computeWeightedScore(scores, matrix);
  const suggestedLevel = levelForScore(weightedScore, matrix.thresholds);
  return {
    scores,
    weightedScore,
    suggestedLevel,
    finalLevel: override?.level ?? suggestedLevel,
    overridden: Boolean(override && override.level !== suggestedLevel),
    overrideReason: override?.reason,
    matrixVersion: matrix.version,
    ratedBy,
    ratedAt,
  };
}

// ---------------------------------------------------------------------------
// Internal Regulations (QĐNB)
// ---------------------------------------------------------------------------

interface QdnbSpec {
  id: string;
  code: string;
  title: string;
  docType: InternalRegulation["docType"];
  issuingLevel: InternalRegulation["issuingLevel"];
  field: string;
  ownerUnitId: string;
  basedOn: string[];
  /** Days ago of the current version. */
  issuedDaysAgo: number;
  versions?: number;
}

const QDNB_SPECS: QdnbSpec[] = [
  {
    id: "qd-credit-reg",
    code: "QĐ 0215/2024/QĐ-HĐQT",
    title: "Quy chế cấp tín dụng",
    docType: "Quy chế",
    issuingLevel: "HĐQT",
    field: "Tín dụng",
    ownerUnitId: "dept-credit",
    basedOn: ["32/2024/QH15", "96/2025/QH15", "39/2016/TT-NHNN"],
    issuedDaysAgo: 330,
    versions: 3,
  },
  {
    id: "qd-retail-loan",
    code: "QĐ 1120/2024/QĐ-TGĐ",
    title: "Quy định cho vay đối với khách hàng cá nhân",
    docType: "Quy định",
    issuingLevel: "TGĐ",
    field: "Tín dụng",
    ownerUnitId: "dept-retail",
    basedOn: ["39/2016/TT-NHNN", "06/2023/TT-NHNN"],
    issuedDaysAgo: 410,
    versions: 2,
  },
  {
    id: "qd-corp-loan",
    code: "QĐ 1121/2024/QĐ-TGĐ",
    title: "Quy định cho vay đối với khách hàng doanh nghiệp",
    docType: "Quy định",
    issuingLevel: "TGĐ",
    field: "Tín dụng",
    ownerUnitId: "dept-corporate",
    basedOn: ["39/2016/TT-NHNN"],
    issuedDaysAgo: 408,
    versions: 2,
  },
  {
    id: "qd-collateral",
    code: "QĐ 0890/2023/QĐ-TGĐ",
    title: "Quy định nhận và quản lý tài sản bảo đảm",
    docType: "Quy định",
    issuingLevel: "TGĐ",
    field: "Tài sản bảo đảm",
    ownerUnitId: "dept-credit",
    basedOn: ["21/2021/NĐ-CP"],
    issuedDaysAgo: 620,
    versions: 2,
  },
  {
    id: "qd-valuation",
    code: "QĐ 0455/2025/QĐ-TGĐ",
    title: "Quy trình thẩm định giá tài sản bảo đảm",
    docType: "Quy trình",
    issuingLevel: "TGĐ",
    field: "Tài sản bảo đảm",
    ownerUnitId: "dept-credit",
    basedOn: ["21/2021/NĐ-CP"],
    issuedDaysAgo: 250,
  },
  {
    id: "qd-ic",
    code: "QĐ 0118/2025/QĐ-HĐQT",
    title: "Quy chế kiểm soát nội bộ",
    docType: "Quy chế",
    issuingLevel: "HĐQT",
    field: "Kiểm soát nội bộ",
    ownerUnitId: "dept-internal-control",
    basedOn: ["83/2025/TT-NHNN", "32/2024/QH15"],
    issuedDaysAgo: 60,
    versions: 3,
  },
  {
    id: "qd-risk",
    code: "QĐ 0119/2025/QĐ-HĐQT",
    title: "Quy chế quản lý rủi ro",
    docType: "Quy chế",
    issuingLevel: "HĐQT",
    field: "Quản lý rủi ro",
    ownerUnitId: "dept-risk",
    basedOn: ["83/2025/TT-NHNN"],
    issuedDaysAgo: 75,
    versions: 2,
  },
  {
    id: "qd-audit",
    code: "QĐ 0120/2025/QĐ-HĐQT",
    title: "Quy chế kiểm toán nội bộ",
    docType: "Quy chế",
    issuingLevel: "HĐQT",
    field: "Kiểm toán nội bộ",
    ownerUnitId: "dept-audit",
    basedOn: ["83/2025/TT-NHNN"],
    issuedDaysAgo: 520,
    versions: 2,
  },
  {
    id: "qd-compliance",
    code: "QĐ 0732/2024/QĐ-TGĐ",
    title: "Quy định về chức năng tuân thủ",
    docType: "Quy định",
    issuingLevel: "TGĐ",
    field: "Tuân thủ",
    ownerUnitId: "dept-compliance",
    basedOn: ["13/2018/TT-NHNN"],
    issuedDaysAgo: 560,
    versions: 2,
  },
  {
    id: "qd-aml",
    code: "QĐ 0306/2024/QĐ-HĐQT",
    title: "Quy định nội bộ về phòng, chống rửa tiền",
    docType: "Quy định",
    issuingLevel: "HĐQT",
    field: "Phòng chống rửa tiền",
    ownerUnitId: "dept-aml",
    basedOn: ["14/2022/QH15", "09/2023/TT-NHNN"],
    issuedDaysAgo: 480,
    versions: 2,
  },
  {
    id: "qd-kyc",
    code: "QĐ 0950/2024/QĐ-TGĐ",
    title: "Quy trình nhận biết và cập nhật thông tin khách hàng (KYC)",
    docType: "Quy trình",
    issuingLevel: "TGĐ",
    field: "Phòng chống rửa tiền",
    ownerUnitId: "dept-aml",
    basedOn: ["09/2023/TT-NHNN"],
    issuedDaysAgo: 450,
  },
  {
    id: "qd-accounts",
    code: "QĐ 1305/2024/QĐ-TGĐ",
    title: "Quy định mở và sử dụng tài khoản thanh toán",
    docType: "Quy định",
    issuingLevel: "TGĐ",
    field: "Thanh toán",
    ownerUnitId: "dept-operations",
    basedOn: ["17/2024/TT-NHNN"],
    issuedDaysAgo: 360,
    versions: 2,
  },
  {
    id: "qd-biometric",
    code: "QĐ 1410/2025/QĐ-TGĐ",
    title: "Quy trình xác thực sinh trắc học trong giao dịch điện tử",
    docType: "Quy trình",
    issuingLevel: "TGĐ",
    field: "Ngân hàng số",
    ownerUnitId: "dept-it",
    basedOn: ["2345/QĐ-NHNN"],
    issuedDaysAgo: 300,
  },
  {
    id: "qd-infosec",
    code: "QĐ 0601/2024/QĐ-TGĐ",
    title: "Quy chế an toàn hệ thống thông tin",
    docType: "Quy chế",
    issuingLevel: "TGĐ",
    field: "Công nghệ thông tin",
    ownerUnitId: "dept-it",
    basedOn: ["09/2020/TT-NHNN"],
    issuedDaysAgo: 700,
    versions: 2,
  },
  {
    id: "qd-pdp",
    code: "QĐ 0602/2024/QĐ-TGĐ",
    title: "Quy định bảo vệ dữ liệu cá nhân khách hàng",
    docType: "Quy định",
    issuingLevel: "TGĐ",
    field: "Pháp chế",
    ownerUnitId: "dept-legal",
    basedOn: ["13/2023/NĐ-CP"],
    issuedDaysAgo: 690,
  },
  {
    id: "qd-prudential",
    code: "QĐ 0270/2025/QĐ-HĐQT",
    title: "Quy định về các giới hạn, tỷ lệ bảo đảm an toàn",
    docType: "Quy định",
    issuingLevel: "HĐQT",
    field: "An toàn vốn",
    ownerUnitId: "dept-risk",
    basedOn: ["22/2019/TT-NHNN"],
    issuedDaysAgo: 280,
    versions: 2,
  },
  {
    id: "qd-liquidity",
    code: "QĐ 0275/2025/QĐ-TGĐ",
    title: "Quy trình quản lý rủi ro thanh khoản",
    docType: "Quy trình",
    issuingLevel: "TGĐ",
    field: "An toàn vốn",
    ownerUnitId: "dept-treasury",
    basedOn: ["22/2019/TT-NHNN"],
    issuedDaysAgo: 275,
  },
  {
    id: "qd-rates",
    code: "QĐ 0812/2024/QĐ-TGĐ",
    title: "Quy định về lãi suất và phí dịch vụ",
    docType: "Quy định",
    issuingLevel: "TGĐ",
    field: "Tài chính",
    ownerUnitId: "dept-finance",
    basedOn: ["39/2016/TT-NHNN"],
    issuedDaysAgo: 390,
  },
  {
    id: "qd-complaints",
    code: "QĐ 0333/2023/QĐ-TGĐ",
    title: "Quy trình tiếp nhận và xử lý khiếu nại khách hàng",
    docType: "Quy trình",
    issuingLevel: "TGĐ",
    field: "Bảo vệ người tiêu dùng",
    ownerUnitId: "dept-retail",
    basedOn: ["Luật BVQLNTD 2023"],
    issuedDaysAgo: 640,
  },
  {
    id: "qd-provisioning",
    code: "QĐ 0927/2024/QĐ-TGĐ",
    title: "Quy định phân loại nợ và trích lập dự phòng rủi ro",
    docType: "Quy định",
    issuingLevel: "TGĐ",
    field: "Tín dụng",
    ownerUnitId: "dept-credit",
    basedOn: ["31/2024/TT-NHNN", "96/2025/QH15"],
    issuedDaysAgo: 340,
    versions: 2,
  },
  {
    id: "qd-violations",
    code: "QĐ 1502/2025/QĐ-TGĐ",
    title: "Quy trình báo cáo vi phạm và xử lý trách nhiệm",
    docType: "Quy trình",
    issuingLevel: "TGĐ",
    field: "Tuân thủ",
    ownerUnitId: "dept-legal",
    basedOn: ["32/2024/QH15"],
    issuedDaysAgo: 210,
  },
  {
    id: "qd-delegation",
    code: "QĐ 0150/2025/QĐ-HĐQT",
    title: "Quy chế ủy quyền và phân cấp phê duyệt",
    docType: "Quy chế",
    issuingLevel: "HĐQT",
    field: "Quản trị",
    ownerUnitId: "dept-board",
    basedOn: ["32/2024/QH15", "96/2025/QH15"],
    issuedDaysAgo: 335,
    versions: 2,
  },
  {
    id: "qd-vault",
    code: "QĐ 0711/2024/QĐ-TGĐ",
    title: "Quy trình quản lý ngân quỹ, kho quỹ",
    docType: "Quy trình",
    issuingLevel: "TGĐ",
    field: "Vận hành",
    ownerUnitId: "dept-operations",
    basedOn: ["13/2023/TT-NHNN"],
    issuedDaysAgo: 470,
  },
  {
    id: "qd-cards",
    code: "QĐ 0480/2025/QĐ-TGĐ",
    title: "Quy định về phát hành và sử dụng thẻ ngân hàng",
    docType: "Quy định",
    issuingLevel: "TGĐ",
    field: "Ngân hàng bán lẻ",
    ownerUnitId: "dept-retail",
    basedOn: ["18/2024/TT-NHNN"],
    issuedDaysAgo: 230,
  },
];

/** Hand-written articles for regulations shown in the diff demo. */
const RICH_ARTICLES: Record<
  string,
  { number: string; title: string; content: string }[][]
> = {
  // Versions oldest → newest
  "qd-retail-loan": [
    [
      {
        number: "Điều 5",
        title: "Đối tượng cho vay",
        content:
          "Khách hàng cá nhân có năng lực hành vi dân sự đầy đủ, có nơi cư trú hợp pháp tại địa bàn có chi nhánh của Nam A Bank.",
      },
      {
        number: "Điều 8",
        title: "Tỷ lệ cho vay trên giá trị tài sản bảo đảm",
        content:
          "Mức cho vay tối đa không vượt quá 80% giá trị tài sản bảo đảm là bất động sản đã được thẩm định.",
      },
      {
        number: "Điều 11",
        title: "Thời hạn cho vay",
        content:
          "Thời hạn cho vay tiêu dùng tối đa 60 tháng; cho vay mua nhà ở tối đa 240 tháng.",
      },
      {
        number: "Điều 14",
        title: "Hồ sơ đề nghị vay vốn",
        content:
          "Khách hàng nộp bản sao giấy tờ tùy thân, chứng minh thu nhập và phương án sử dụng vốn.",
      },
    ],
    [
      {
        number: "Điều 5",
        title: "Đối tượng cho vay",
        content:
          "Khách hàng cá nhân có năng lực hành vi dân sự đầy đủ, có nơi cư trú hợp pháp tại địa bàn có chi nhánh của Nam A Bank.",
      },
      {
        number: "Điều 8",
        title: "Tỷ lệ cho vay trên giá trị tài sản bảo đảm",
        content:
          "Mức cho vay tối đa không vượt quá 80% giá trị tài sản bảo đảm là bất động sản đã được thẩm định.",
      },
      {
        number: "Điều 11",
        title: "Thời hạn cho vay",
        content:
          "Thời hạn cho vay tiêu dùng tối đa 60 tháng; cho vay mua nhà ở tối đa 300 tháng.",
      },
      {
        number: "Điều 14",
        title: "Hồ sơ đề nghị vay vốn",
        content:
          "Khách hàng nộp bản sao CCCD gắn chip, chứng minh thu nhập và phương án sử dụng vốn tại quầy giao dịch.",
      },
    ],
  ],
  "qd-ic": [
    [
      {
        number: "Điều 3",
        title: "Nguyên tắc kiểm soát nội bộ",
        content:
          "Hệ thống kiểm soát nội bộ được tổ chức theo nguyên tắc phân công, phân nhiệm rõ ràng.",
      },
      {
        number: "Điều 6",
        title: "Ba tuyến bảo vệ",
        content:
          "Tuyến 1 là các đơn vị kinh doanh; tuyến 2 là bộ phận quản lý rủi ro; tuyến 3 là kiểm toán nội bộ.",
      },
      {
        number: "Điều 9",
        title: "Báo cáo",
        content:
          "Định kỳ hằng năm, Tổng Giám đốc báo cáo Hội đồng Quản trị về hệ thống kiểm soát nội bộ.",
      },
    ],
    [
      {
        number: "Điều 3",
        title: "Nguyên tắc kiểm soát nội bộ",
        content:
          "Hệ thống kiểm soát nội bộ được tổ chức theo nguyên tắc phân công, phân nhiệm rõ ràng, kiểm soát xung đột lợi ích.",
      },
      {
        number: "Điều 6",
        title: "Ba tuyến bảo vệ",
        content:
          "Tuyến 1 là các đơn vị kinh doanh; tuyến 2 gồm tối thiểu Bộ phận tuân thủ và Bộ phận quản lý rủi ro; tuyến 3 là kiểm toán nội bộ.",
      },
      {
        number: "Điều 9",
        title: "Báo cáo",
        content:
          "Định kỳ hằng năm, Tổng Giám đốc báo cáo Hội đồng Quản trị và Ngân hàng Nhà nước về hệ thống kiểm soát nội bộ.",
      },
    ],
    [
      {
        number: "Điều 3",
        title: "Nguyên tắc kiểm soát nội bộ",
        content:
          "Hệ thống kiểm soát nội bộ được tổ chức theo nguyên tắc phân công, phân nhiệm rõ ràng, kiểm soát xung đột lợi ích, bảo đảm minh bạch và trách nhiệm giải trình.",
      },
      {
        number: "Điều 6",
        title: "Ba tuyến bảo vệ",
        content:
          "Tuyến 1 là các đơn vị kinh doanh; tuyến 2 gồm tối thiểu Bộ phận tuân thủ và Bộ phận quản lý rủi ro hoạt động độc lập; tuyến 3 là kiểm toán nội bộ.",
      },
      {
        number: "Điều 9",
        title: "Báo cáo",
        content:
          "Định kỳ hằng năm và đột xuất, Tổng Giám đốc báo cáo Hội đồng Quản trị, Ban Kiểm soát và Ngân hàng Nhà nước theo biểu mẫu tại Thông tư 83/2025/TT-NHNN.",
      },
      {
        number: "Điều 12",
        title: "Nguồn dữ liệu duy nhất",
        content:
          "Dữ liệu kiểm tra, giám sát được quản lý tập trung trên hệ thống ICIS và chia sẻ cho hệ thống CMS của tuyến 2.",
      },
    ],
  ],
};

/**
 * Draft text prepared by the lead unit for an upcoming revision. When the
 * revision is issued, the draft becomes the new version (shown in the diff).
 */
const DRAFT_ARTICLES: Record<
  string,
  { number: string; title: string; content: string }[]
> = {
  "qd-retail-loan": [
    {
      number: "Điều 5",
      title: "Đối tượng cho vay",
      content:
        "Khách hàng cá nhân có năng lực hành vi dân sự đầy đủ, có nơi cư trú hợp pháp tại địa bàn có chi nhánh của Nam A Bank.",
    },
    {
      number: "Điều 7a",
      title: "Khách hàng có nợ quá hạn tại tổ chức khác",
      content:
        "Việc cho vay đối với khách hàng đang có nợ quá hạn tại tổ chức tín dụng khác phải được Hội sở phê duyệt.",
    },
    {
      number: "Điều 8",
      title: "Tỷ lệ cho vay trên giá trị tài sản bảo đảm",
      content:
        "Mức cho vay tối đa không vượt quá 75% giá trị tài sản bảo đảm là bất động sản; 70% đối với nhà ở hình thành trong tương lai.",
    },
    {
      number: "Điều 11",
      title: "Thời hạn cho vay",
      content:
        "Thời hạn cho vay tiêu dùng tối đa 60 tháng; cho vay mua nhà ở tối đa 300 tháng.",
    },
    {
      number: "Điều 14",
      title: "Hồ sơ đề nghị vay vốn",
      content:
        "Khách hàng nộp hồ sơ điện tử qua ứng dụng Nam A Bank sau khi xác thực sinh trắc học khớp CCCD gắn chip, hoặc nộp bản giấy tại quầy giao dịch.",
    },
    {
      number: "Điều 15",
      title: "Kiểm tra sau cho vay",
      content:
        "Đơn vị kinh doanh kiểm tra mục đích sử dụng vốn trong vòng 30 ngày kể từ ngày giải ngân và lưu bằng chứng trên hệ thống.",
    },
  ],
  "qd-compliance": [
    {
      number: "Điều 1",
      title: "Phạm vi điều chỉnh",
      content:
        "Văn bản này quy định về chức năng tuân thủ tại Nam A Bank theo Thông tư 83/2025/TT-NHNN.",
    },
    {
      number: "Điều 2",
      title: "Đối tượng áp dụng",
      content:
        "Áp dụng đối với Hội sở, các chi nhánh, phòng giao dịch và đơn vị trực thuộc Nam A Bank.",
    },
    {
      number: "Điều 3",
      title: "Trách nhiệm thực hiện",
      content:
        "Bộ phận tuân thủ hoạt động độc lập thuộc tuyến bảo vệ thứ hai, báo cáo trực tiếp Tổng Giám đốc và Ban Kiểm soát.",
    },
    {
      number: "Điều 4",
      title: "Hệ thống quản lý tuân thủ (CMS)",
      content:
        "Mọi văn bản pháp luật mới, vấn đề tuân thủ và kết quả khắc phục được quản lý tập trung trên hệ thống CMS, liên thông dữ liệu với ICIS.",
    },
  ],
};

function genericArticles(title: string, version: number) {
  return [
    {
      number: "Điều 1",
      title: "Phạm vi điều chỉnh",
      content: `Văn bản này quy định về ${title.toLowerCase()} tại Nam A Bank.`,
    },
    {
      number: "Điều 2",
      title: "Đối tượng áp dụng",
      content:
        version > 1
          ? "Áp dụng đối với Hội sở, các chi nhánh, phòng giao dịch và đơn vị trực thuộc Nam A Bank."
          : "Áp dụng đối với Hội sở và các chi nhánh của Nam A Bank.",
    },
    {
      number: "Điều 3",
      title: "Trách nhiệm thực hiện",
      content:
        version > 1
          ? "Thủ trưởng đơn vị chịu trách nhiệm tổ chức thực hiện; Khối Tuân thủ giám sát việc tuân thủ."
          : "Thủ trưởng đơn vị chịu trách nhiệm tổ chức thực hiện.",
    },
  ];
}

export function generateInternalRegulations(
  org: OrganizationSettings,
): InternalRegulation[] {
  const unitName = (id: string) =>
    org.hoDepartments.find((u) => u.id === id)?.name ?? id;
  return QDNB_SPECS.map((spec) => {
    const count = spec.versions ?? 1;
    const versions: QdnbVersion[] = Array.from({ length: count }, (_, i) => {
      const vNo = i + 1;
      const ageDays = spec.issuedDaysAgo + (count - vNo) * 380;
      const year = subDays(base, ageDays).getFullYear();
      const num = spec.code.split(" ")[1].split("/")[0];
      return {
        version: vNo,
        decisionNo:
          vNo === count
            ? spec.code
            : `QĐ ${num}/${year}/${spec.code.split("/").pop()}`,
        issuedAt: d(-ageDays),
        effectiveAt: d(-ageDays + 10),
        changeSummary:
          vNo === 1
            ? "Ban hành lần đầu"
            : `Sửa đổi theo ${spec.basedOn[spec.basedOn.length - 1]}`,
        articles:
          RICH_ARTICLES[spec.id]?.[i] ?? genericArticles(spec.title, vNo),
      };
    });
    return {
      id: spec.id,
      code: spec.code,
      title: spec.title,
      docType: spec.docType,
      issuingLevel: spec.issuingLevel,
      field: spec.field,
      ownerUnitId: spec.ownerUnitId,
      ownerUnitName: unitName(spec.ownerUnitId),
      currentVersion: count,
      versions,
      basedOn: spec.basedOn,
      draftArticles: DRAFT_ARTICLES[spec.id],
      createdAt: versions[0].issuedAt,
      updatedAt: versions[count - 1].issuedAt,
    };
  });
}

// ---------------------------------------------------------------------------
// Legal updates
// ---------------------------------------------------------------------------

const art = (number: string, title: string, content: string): LegalArticle => ({
  id: `${number}-${title}`.replace(/\s+/g, "-").toLowerCase(),
  number,
  title,
  content,
});

/**
 * Documents waiting in the simulated vbpl.vn feed. "Sync now" pulls them in
 * one at a time, so the presenter can show automatic intake live.
 */
export function generateIncomingLegalQueue(): LegalUpdate[] {
  return [
    legalUpdate({
      id: "lu-tt12-2026",
      code: "",
      docNumber: "12/2026/TT-NHNN",
      title:
        "Thông tư sửa đổi, bổ sung một số điều của Thông tư 39/2016/TT-NHNN quy định về hoạt động cho vay của tổ chức tín dụng đối với khách hàng",
      docType: "Thông tư",
      issuer: "NHNN",
      issueDate: d(-2),
      effectiveDate: d(75),
      receivedAt: d(0),
      channel: "auto_feed",
      sourceName: "vbpl.vn – Cơ sở dữ liệu quốc gia về VBPL",
      field: "Tín dụng",
      relevance: "high",
      relevanceScore: 94,
      relevanceReason:
        "Directly amends lending rules that Nam A Bank applies to retail and corporate loans (LTV limits, post-disbursement checks, digital loan files).",
      summary:
        "Hạ tỷ lệ cho vay tối đa trên giá trị TSBĐ là bất động sản, bắt buộc kiểm tra sau giải ngân trong 30 ngày, cho phép hồ sơ vay điện tử có xác thực sinh trắc học.",
      aiSummary: {
        keyChanges: [
          "LTV for real-estate collateral capped at 75% (70% for off-plan property) — Điều 1.3",
          "Post-disbursement purpose check within 30 days, evidence kept on file — Điều 1.5",
          "Digital loan applications allowed when the customer is verified by biometrics — Điều 1.7",
          "Lending to customers with overdue debt at other institutions requires Head Office approval — Điều 1.9",
        ],
        affectedUnits: [
          "Khối Ngân hàng Bán lẻ",
          "Khối Ngân hàng Doanh nghiệp",
          "Khối Quản lý Tín dụng",
          "Khối Công nghệ thông tin",
        ],
        affectedProducts: [
          "Vay mua nhà",
          "Vay tiêu dùng có TSBĐ",
          "Vay SXKD doanh nghiệp",
          "Vay online trên app",
        ],
        suggestedDeadline: d(60),
        confidence: 91,
        impactNote:
          "4 internal regulations need amendment before the effective date. Highest impact is on retail mortgage lending (LTV).",
      },
      articles: [
        art(
          "Điều 1.3",
          "Sửa đổi Điều 8 – Mức cho vay",
          "Mức cho vay có bảo đảm bằng bất động sản không vượt quá 75% giá trị tài sản bảo đảm; đối với nhà ở hình thành trong tương lai không vượt quá 70%.",
        ),
        art(
          "Điều 1.5",
          "Bổ sung Điều 15a – Kiểm tra sau cho vay",
          "Tổ chức tín dụng phải kiểm tra mục đích sử dụng vốn trong thời hạn 30 ngày kể từ ngày giải ngân và lưu giữ bằng chứng.",
        ),
        art(
          "Điều 1.7",
          "Sửa đổi Điều 31 – Hồ sơ vay điện tử",
          "Khách hàng được nộp hồ sơ vay vốn bằng phương tiện điện tử khi đã được xác thực bằng sinh trắc học khớp với dữ liệu CCCD gắn chip.",
        ),
        art(
          "Điều 1.9",
          "Bổ sung Điều 7a – Khách hàng có nợ quá hạn",
          "Việc cho vay đối với khách hàng đang có nợ quá hạn tại tổ chức tín dụng khác phải được Hội sở chính phê duyệt.",
        ),
        art(
          "Điều 2",
          "Hiệu lực thi hành",
          "Thông tư có hiệu lực kể từ ngày thứ 75 kể từ ngày ký.",
        ),
      ],
      relations: [
        {
          type: "amends",
          docNumber: "39/2016/TT-NHNN",
          title: "Quy định về hoạt động cho vay của TCTD",
        },
        {
          type: "amends",
          docNumber: "06/2023/TT-NHNN",
          title: "Sửa đổi Thông tư 39/2016/TT-NHNN",
        },
        {
          type: "guided_by",
          docNumber: "32/2024/QH15",
          title: "Luật Các tổ chức tín dụng 2024",
        },
      ],
      status: "new",
      read: false,
      mappings: [
        mapping(
          "m-12-1",
          "qd-retail-loan",
          "QĐ 1120/2024/QĐ-TGĐ",
          "Quy định cho vay đối với khách hàng cá nhân",
          ["Điều 1.3", "Điều 1.5", "Điều 1.7"],
          "Điều 8, Điều 14, bổ sung Điều 15",
          "amend",
          96,
          "Điều 8 of the QĐNB sets LTV at 80% — the new cap is 75%/70%. Điều 14 must allow e-files with biometrics.",
          "dept-retail",
        ),
        mapping(
          "m-12-2",
          "qd-corp-loan",
          "QĐ 1121/2024/QĐ-TGĐ",
          "Quy định cho vay đối với khách hàng doanh nghiệp",
          ["Điều 1.5", "Điều 1.9"],
          "Điều 10, Điều 21",
          "amend",
          88,
          "Post-disbursement checks and approval for borrowers with overdue debt elsewhere are not covered today.",
          "dept-corporate",
        ),
        mapping(
          "m-12-3",
          "qd-valuation",
          "QĐ 0455/2025/QĐ-TGĐ",
          "Quy trình thẩm định giá tài sản bảo đảm",
          ["Điều 1.3"],
          "Bước 4 – Xác định mức cho vay",
          "supplement",
          81,
          "The valuation workflow computes the maximum loan amount using the old LTV table.",
          "dept-credit",
        ),
        mapping(
          "m-12-4",
          "qd-biometric",
          "QĐ 1410/2025/QĐ-TGĐ",
          "Quy trình xác thực sinh trắc học trong giao dịch điện tử",
          ["Điều 1.7"],
          "Mục 3 – Phạm vi áp dụng",
          "supplement",
          64,
          "Biometric verification must now also cover digital loan applications.",
          "dept-it",
        ),
        mapping(
          "m-12-5",
          "qd-cards",
          "QĐ 0480/2025/QĐ-TGĐ",
          "Quy định về phát hành và sử dụng thẻ ngân hàng",
          ["Điều 1.9"],
          undefined,
          "amend",
          32,
          "Weak match: credit cards are a form of lending but Điều 1.9 targets secured loans.",
          "dept-retail",
        ),
      ],
      revisionTaskIds: [],
    }),
    legalUpdate({
      id: "lu-cv8123-2026",
      code: "",
      docNumber: "8123/NHNN-TTGSNH",
      title:
        "Công văn về việc tăng cường kiểm soát rủi ro tín dụng đối với lĩnh vực bất động sản",
      docType: "Công văn",
      issuer: "NHNN",
      issueDate: d(-1),
      effectiveDate: d(0),
      receivedAt: d(0),
      channel: "auto_feed",
      sourceName: "Cổng TTĐT NHNN",
      field: "Tín dụng",
      relevance: "medium",
      relevanceScore: 72,
      relevanceReason:
        "Supervisory letter — no new legal obligation, but asks banks to report real-estate credit exposure monthly.",
      summary:
        "NHNN yêu cầu các TCTD rà soát danh mục cho vay bất động sản và báo cáo hằng tháng dư nợ theo phân khúc.",
      aiSummary: {
        keyChanges: [
          "Monthly report of real-estate credit by segment, starting next month",
          "Review of large real-estate exposures above 5% of equity",
        ],
        affectedUnits: ["Khối Quản lý Rủi ro", "Khối Quản lý Tín dụng"],
        affectedProducts: ["Vay mua nhà", "Vay kinh doanh BĐS"],
        suggestedDeadline: d(25),
        confidence: 78,
        impactNote:
          "No QĐNB has to change; a reporting task is enough. Consider adding the report to the monthly BĐH pack.",
      },
      articles: [
        art(
          "Mục 1",
          "Rà soát danh mục",
          "Rà soát toàn bộ dư nợ cho vay kinh doanh bất động sản, đánh giá khả năng trả nợ của khách hàng.",
        ),
        art(
          "Mục 2",
          "Chế độ báo cáo",
          "Báo cáo NHNN (Cơ quan TTGSNH) trước ngày 10 hằng tháng.",
        ),
      ],
      relations: [],
      status: "new",
      read: false,
      mappings: [
        mapping(
          "m-cv-1",
          "qd-prudential",
          "QĐ 0270/2025/QĐ-HĐQT",
          "Quy định về các giới hạn, tỷ lệ bảo đảm an toàn",
          ["Mục 2"],
          undefined,
          "supplement",
          45,
          "Possible addition of a real-estate exposure report; low confidence.",
          "dept-risk",
        ),
      ],
      revisionTaskIds: [],
    }),
  ];
}

function mapping(
  id: string,
  qdnbId: string | undefined,
  qdnbCode: string,
  qdnbTitle: string,
  lawArticles: string[],
  qdnbArticles: string | undefined,
  action: LegalMapping["action"],
  confidence: number,
  reason: string,
  leadUnitId: string,
  status: LegalMapping["status"] = "suggested",
  origin: LegalMapping["origin"] = "ai",
): LegalMapping {
  return {
    id,
    qdnbId,
    qdnbCode,
    qdnbTitle,
    lawArticles,
    qdnbArticles,
    action,
    origin,
    confidence: origin === "ai" ? confidence : undefined,
    reason,
    status,
    leadUnitId,
  };
}

function legalUpdate(
  u: Omit<LegalUpdate, "createdAt" | "updatedAt">,
): LegalUpdate {
  return { ...u, createdAt: u.receivedAt, updatedAt: u.receivedAt };
}

export function generateLegalUpdates(): LegalUpdate[] {
  return [
    legalUpdate({
      id: "lu-tt09-2026",
      code: "LU-2026-031",
      docNumber: "09/2026/TT-NHNN",
      title:
        "Thông tư quy định về bảo đảm an toàn hệ thống thông tin trong hoạt động ngân hàng",
      docType: "Thông tư",
      issuer: "NHNN",
      issueDate: d(-6),
      effectiveDate: d(120),
      receivedAt: d(-5, 8),
      channel: "auto_feed",
      sourceName: "vbpl.vn – Cơ sở dữ liệu quốc gia về VBPL",
      field: "Công nghệ thông tin",
      relevance: "high",
      relevanceScore: 89,
      relevanceReason:
        "Replaces the IT security circular that Nam A Bank's information-security policy is based on.",
      summary:
        "Thay thế Thông tư 09/2020/TT-NHNN; bổ sung yêu cầu về an toàn dịch vụ đám mây, quản lý bên thứ ba và báo cáo sự cố trong 4 giờ.",
      aiSummary: {
        keyChanges: [
          "Cloud services must be risk-assessed and approved by the Board — Điều 18",
          "Incidents reported to NHNN within 4 hours — Điều 34",
          "Annual penetration test of internet-facing systems — Điều 40",
        ],
        affectedUnits: ["Khối Công nghệ thông tin", "Khối Quản lý Rủi ro"],
        affectedProducts: ["Ứng dụng Nam A Bank", "Internet Banking"],
        suggestedDeadline: d(100),
        confidence: 86,
        impactNote:
          "The information-security policy needs a rewrite (replace). The biometric workflow also references the old circular.",
      },
      articles: [
        art(
          "Điều 18",
          "Sử dụng dịch vụ điện toán đám mây",
          "Tổ chức phải đánh giá rủi ro và được HĐQT phê duyệt trước khi sử dụng dịch vụ đám mây cho hệ thống thông tin cấp độ 3 trở lên.",
        ),
        art(
          "Điều 34",
          "Báo cáo sự cố",
          "Sự cố an toàn thông tin nghiêm trọng phải được báo cáo NHNN trong vòng 4 giờ kể từ khi phát hiện.",
        ),
        art(
          "Điều 40",
          "Kiểm tra, đánh giá",
          "Kiểm tra xâm nhập tối thiểu một lần mỗi năm đối với hệ thống kết nối Internet.",
        ),
      ],
      relations: [
        {
          type: "replaces",
          docNumber: "09/2020/TT-NHNN",
          title: "Thông tư về an toàn HTTT trong hoạt động ngân hàng",
        },
      ],
      status: "new",
      read: false,
      mappings: [
        mapping(
          "m-09-1",
          "qd-infosec",
          "QĐ 0601/2024/QĐ-TGĐ",
          "Quy chế an toàn hệ thống thông tin",
          ["Điều 18", "Điều 34", "Điều 40"],
          "Toàn văn",
          "replace",
          93,
          "The policy is built on the replaced circular 09/2020 — a full replacement is cleaner than amending.",
          "dept-it",
        ),
        mapping(
          "m-09-2",
          "qd-biometric",
          "QĐ 1410/2025/QĐ-TGĐ",
          "Quy trình xác thực sinh trắc học trong giao dịch điện tử",
          ["Điều 34"],
          "Mục 6 – Xử lý sự cố",
          "amend",
          58,
          "Incident escalation timeline (24h) conflicts with the new 4-hour rule.",
          "dept-it",
        ),
      ],
      revisionTaskIds: [],
    }),
    legalUpdate({
      id: "lu-nd52-2026",
      code: "LU-2026-030",
      docNumber: "52/2026/NĐ-CP",
      title:
        "Nghị định quy định xử phạt vi phạm hành chính trong lĩnh vực tiền tệ và ngân hàng",
      docType: "Nghị định",
      issuer: "Chính phủ",
      issueDate: d(-12),
      effectiveDate: d(40),
      receivedAt: d(-11, 10),
      channel: "auto_feed",
      sourceName: "Công báo Chính phủ",
      field: "Xử lý vi phạm",
      relevance: "high",
      relevanceScore: 90,
      relevanceReason:
        "Sets the fine levels used in Nam A Bank's Risk Rating Matrix (criterion 'Fine amount').",
      summary:
        "Thay thế Nghị định 88/2019/NĐ-CP; nâng mức phạt tối đa đối với tổ chức lên 2 tỷ đồng, bổ sung hành vi vi phạm về ngân hàng số.",
      aiSummary: {
        keyChanges: [
          "Maximum fine for institutions raised to 2 billion VND — Điều 3",
          "New violations for digital onboarding without biometric checks — Điều 27",
          "Late reporting to NHNN fined 40–80 million VND — Điều 42",
        ],
        affectedUnits: ["Khối Tuân thủ", "Khối Pháp chế", "Khối Vận hành"],
        affectedProducts: ["Toàn bộ sản phẩm"],
        suggestedDeadline: d(30),
        confidence: 88,
        impactNote:
          "Update the fine bands of the Risk Rating Matrix and the violation-handling procedure.",
      },
      articles: [
        art(
          "Điều 3",
          "Mức phạt tiền tối đa",
          "Mức phạt tiền tối đa đối với tổ chức là 2.000.000.000 đồng.",
        ),
        art(
          "Điều 27",
          "Vi phạm về mở tài khoản",
          "Phạt từ 100 đến 150 triệu đồng đối với hành vi mở tài khoản thanh toán không đối chiếu sinh trắc học.",
        ),
        art(
          "Điều 42",
          "Vi phạm chế độ báo cáo",
          "Phạt từ 40 đến 80 triệu đồng đối với hành vi báo cáo không đúng hạn.",
        ),
      ],
      relations: [
        {
          type: "replaces",
          docNumber: "88/2019/NĐ-CP",
          title: "Xử phạt VPHC lĩnh vực tiền tệ, ngân hàng",
        },
        {
          type: "replaces",
          docNumber: "143/2021/NĐ-CP",
          title: "Sửa đổi Nghị định 88/2019/NĐ-CP",
        },
      ],
      status: "under_review",
      read: true,
      mappings: [
        mapping(
          "m-52-1",
          "qd-violations",
          "QĐ 1502/2025/QĐ-TGĐ",
          "Quy trình báo cáo vi phạm và xử lý trách nhiệm",
          ["Điều 3", "Điều 42"],
          "Phụ lục 2 – Khung xử lý",
          "amend",
          84,
          "The internal penalty grid refers to the replaced decree.",
          "dept-legal",
        ),
        mapping(
          "m-52-2",
          "qd-accounts",
          "QĐ 1305/2024/QĐ-TGĐ",
          "Quy định mở và sử dụng tài khoản thanh toán",
          ["Điều 27"],
          "Điều 6",
          "supplement",
          77,
          "Add an explicit control: no account opening without biometric matching.",
          "dept-operations",
        ),
      ],
      revisionTaskIds: [],
    }),
    legalUpdate({
      id: "lu-nd25-2026",
      code: "LU-2026-028",
      docNumber: "25/2026/NĐ-CP",
      title:
        "Nghị định quy định chi tiết một số điều của Luật Bảo vệ dữ liệu cá nhân",
      docType: "Nghị định",
      issuer: "Chính phủ",
      issueDate: d(-20),
      effectiveDate: d(90),
      receivedAt: d(-19, 9),
      channel: "manual",
      sourceName: "VietLex",
      field: "Pháp chế",
      relevance: "high",
      relevanceScore: 83,
      relevanceReason:
        "Banks process large volumes of personal data; the decree adds consent and impact-assessment duties.",
      summary:
        "Hướng dẫn Luật BVDLCN: đánh giá tác động xử lý dữ liệu, thông báo vi phạm trong 72 giờ, quy định về chuyển dữ liệu ra nước ngoài.",
      aiSummary: {
        keyChanges: [
          "Data-processing impact assessment filed with the Ministry of Public Security — Điều 9",
          "Breach notification within 72 hours — Điều 15",
          "Cross-border transfer requires a transfer impact assessment — Điều 21",
        ],
        affectedUnits: [
          "Khối Pháp chế",
          "Khối Công nghệ thông tin",
          "Khối Ngân hàng Bán lẻ",
        ],
        affectedProducts: [
          "Ứng dụng Nam A Bank",
          "Thẻ",
          "Tài khoản thanh toán",
        ],
        suggestedDeadline: d(70),
        confidence: 84,
        impactNote:
          "Personal-data policy must be amended; consent wording in account opening forms too.",
      },
      articles: [
        art(
          "Điều 9",
          "Đánh giá tác động",
          "Bên kiểm soát dữ liệu lập hồ sơ đánh giá tác động xử lý dữ liệu cá nhân.",
        ),
        art(
          "Điều 15",
          "Thông báo vi phạm",
          "Thông báo vi phạm quy định về bảo vệ dữ liệu cá nhân trong vòng 72 giờ.",
        ),
        art(
          "Điều 21",
          "Chuyển dữ liệu ra nước ngoài",
          "Lập hồ sơ đánh giá tác động chuyển dữ liệu cá nhân ra nước ngoài.",
        ),
      ],
      relations: [
        {
          type: "guides",
          docNumber: "91/2025/QH15",
          title: "Luật Bảo vệ dữ liệu cá nhân",
        },
        {
          type: "replaces",
          docNumber: "13/2023/NĐ-CP",
          title: "Nghị định về bảo vệ dữ liệu cá nhân",
        },
      ],
      status: "applicable",
      read: true,
      applicability: {
        decision: "applicable",
        reason:
          "Nam A Bank is a personal-data controller for all retail customers.",
        decidedBy: "Lê Thị Hoa",
        decidedAt: d(-15, 14),
      },
      mappings: [
        mapping(
          "m-25-1",
          "qd-pdp",
          "QĐ 0602/2024/QĐ-TGĐ",
          "Quy định bảo vệ dữ liệu cá nhân khách hàng",
          ["Điều 9", "Điều 15", "Điều 21"],
          "Toàn văn",
          "replace",
          90,
          "The policy implements the replaced decree 13/2023 — replace it.",
          "dept-legal",
        ),
        mapping(
          "m-25-2",
          "qd-accounts",
          "QĐ 1305/2024/QĐ-TGĐ",
          "Quy định mở và sử dụng tài khoản thanh toán",
          ["Điều 9"],
          "Mẫu biểu 01 – Đồng ý xử lý dữ liệu",
          "supplement",
          71,
          "Consent wording in the account-opening form must be updated.",
          "dept-operations",
        ),
      ],
      revisionTaskIds: [],
    }),
    legalUpdate({
      id: "lu-tt50-2026",
      code: "LU-2026-024",
      docNumber: "50/2026/TT-NHNN",
      title:
        "Thông tư quy định các giới hạn, tỷ lệ bảo đảm an toàn trong hoạt động của ngân hàng thương mại",
      docType: "Thông tư",
      issuer: "NHNN",
      issueDate: d(-35),
      effectiveDate: d(60),
      receivedAt: d(-34, 9),
      channel: "auto_feed",
      sourceName: "vbpl.vn – Cơ sở dữ liệu quốc gia về VBPL",
      field: "An toàn vốn",
      relevance: "high",
      relevanceScore: 92,
      relevanceReason:
        "Replaces Thông tư 22/2019 — the basis of Nam A Bank's prudential limits and liquidity procedure.",
      summary:
        "Thay thế Thông tư 22/2019/TT-NHNN; điều chỉnh tỷ lệ LDR, tỷ lệ vốn ngắn hạn cho vay trung dài hạn và giới hạn góp vốn.",
      aiSummary: {
        keyChanges: [
          "Loan-to-deposit ratio (LDR) formula changed — Điều 20",
          "Short-term funding for medium/long-term loans capped at 30% — Điều 22",
          "Liquidity reserve ratio reporting becomes daily — Điều 15",
        ],
        affectedUnits: [
          "Khối Quản lý Rủi ro",
          "Khối Kho bạc & ALM",
          "Khối Tài chính",
        ],
        affectedProducts: ["Quản lý thanh khoản", "Cho vay trung dài hạn"],
        suggestedDeadline: d(45),
        confidence: 92,
        impactNote:
          "Two internal regulations must be revised; the ALM reporting templates too.",
      },
      articles: [
        art(
          "Điều 15",
          "Tỷ lệ dự trữ thanh khoản",
          "Ngân hàng tính toán và báo cáo tỷ lệ dự trữ thanh khoản hằng ngày.",
        ),
        art(
          "Điều 20",
          "Tỷ lệ dư nợ cho vay so với tổng tiền gửi",
          "Tỷ lệ LDR tối đa 85%, được tính theo công thức tại Phụ lục 3.",
        ),
        art(
          "Điều 22",
          "Tỷ lệ vốn ngắn hạn cho vay trung hạn, dài hạn",
          "Tỷ lệ tối đa 30% kể từ ngày Thông tư có hiệu lực.",
        ),
      ],
      relations: [
        {
          type: "replaces",
          docNumber: "22/2019/TT-NHNN",
          title: "Giới hạn, tỷ lệ bảo đảm an toàn",
        },
        {
          type: "guided_by",
          docNumber: "32/2024/QH15",
          title: "Luật Các tổ chức tín dụng 2024",
        },
      ],
      status: "mapped",
      read: true,
      applicability: {
        decision: "applicable",
        reason: "Applies to all commercial banks.",
        decidedBy: "Lê Thị Hoa",
        decidedAt: d(-30, 10),
      },
      mappings: [
        mapping(
          "m-50-1",
          "qd-prudential",
          "QĐ 0270/2025/QĐ-HĐQT",
          "Quy định về các giới hạn, tỷ lệ bảo đảm an toàn",
          ["Điều 20", "Điều 22"],
          "Điều 4 – Điều 9",
          "amend",
          95,
          "Limits and formulas in Điều 4–9 follow the replaced circular.",
          "dept-risk",
          "accepted",
        ),
        mapping(
          "m-50-2",
          "qd-liquidity",
          "QĐ 0275/2025/QĐ-TGĐ",
          "Quy trình quản lý rủi ro thanh khoản",
          ["Điều 15"],
          "Bước 2 – Đo lường",
          "amend",
          87,
          "Liquidity reserve reporting must become daily.",
          "dept-treasury",
          "accepted",
        ),
        mapping(
          "m-50-3",
          "qd-rates",
          "QĐ 0812/2024/QĐ-TGĐ",
          "Quy định về lãi suất và phí dịch vụ",
          ["Điều 22"],
          undefined,
          "amend",
          38,
          "Weak link — funding mix may affect pricing but no rule changes.",
          "dept-finance",
          "rejected",
        ),
      ],
      revisionTaskIds: [],
    }),
    legalUpdate({
      id: "lu-tt17-2026",
      code: "LU-2026-019",
      docNumber: "17/2026/TT-NHNN",
      title:
        "Thông tư sửa đổi, bổ sung Thông tư 17/2024/TT-NHNN quy định việc mở và sử dụng tài khoản thanh toán",
      docType: "Thông tư",
      issuer: "NHNN",
      issueDate: d(-55),
      effectiveDate: d(20),
      receivedAt: d(-54, 9),
      channel: "auto_feed",
      sourceName: "vbpl.vn – Cơ sở dữ liệu quốc gia về VBPL",
      field: "Thanh toán",
      relevance: "high",
      relevanceScore: 95,
      relevanceReason:
        "Account opening and card issuance at every branch and on the app must follow the new biometric rules.",
      summary:
        "Bắt buộc đối chiếu sinh trắc học khi mở tài khoản, phát hành thẻ và giao dịch trực tuyến lần đầu trên thiết bị mới.",
      aiSummary: {
        keyChanges: [
          "Biometric matching required for every new payment account — Điều 1.2",
          "Card issuance requires biometric matching — Điều 1.4",
          "Accounts without biometric data are suspended from online payments — Điều 1.6",
        ],
        affectedUnits: [
          "Khối Vận hành",
          "Khối Công nghệ thông tin",
          "Khối Ngân hàng Bán lẻ",
          "Khối Phòng chống Rửa tiền",
        ],
        affectedProducts: [
          "Tài khoản thanh toán",
          "Thẻ ghi nợ",
          "Thẻ tín dụng",
          "Ứng dụng Nam A Bank",
        ],
        suggestedDeadline: d(10),
        confidence: 93,
        impactNote:
          "Four regulations to revise with a short deadline — high risk of late issuance.",
      },
      articles: [
        art(
          "Điều 1.2",
          "Sửa đổi Điều 14 – Mở tài khoản",
          "Ngân hàng đối chiếu thông tin sinh trắc học của khách hàng với dữ liệu trong CCCD gắn chip trước khi mở tài khoản.",
        ),
        art(
          "Điều 1.4",
          "Phát hành thẻ",
          "Việc phát hành thẻ phải đối chiếu sinh trắc học đối với chủ thẻ chính.",
        ),
        art(
          "Điều 1.6",
          "Tạm dừng giao dịch trực tuyến",
          "Tài khoản chưa có dữ liệu sinh trắc học bị tạm dừng giao dịch trực tuyến.",
        ),
      ],
      relations: [
        {
          type: "amends",
          docNumber: "17/2024/TT-NHNN",
          title: "Mở và sử dụng tài khoản thanh toán",
        },
      ],
      status: "assigned",
      read: true,
      applicability: {
        decision: "applicable",
        reason: "Applies to all account-opening and card channels.",
        decidedBy: "Lê Thị Hoa",
        decidedAt: d(-52, 11),
      },
      mappings: [
        mapping(
          "m-17-1",
          "qd-accounts",
          "QĐ 1305/2024/QĐ-TGĐ",
          "Quy định mở và sử dụng tài khoản thanh toán",
          ["Điều 1.2", "Điều 1.6"],
          "Điều 6, Điều 14",
          "amend",
          97,
          "Account opening steps must include biometric matching.",
          "dept-operations",
          "accepted",
        ),
        mapping(
          "m-17-2",
          "qd-biometric",
          "QĐ 1410/2025/QĐ-TGĐ",
          "Quy trình xác thực sinh trắc học trong giao dịch điện tử",
          ["Điều 1.2", "Điều 1.6"],
          "Mục 3",
          "amend",
          90,
          "Scope extends to account opening.",
          "dept-it",
          "accepted",
        ),
        mapping(
          "m-17-3",
          "qd-kyc",
          "QĐ 0950/2024/QĐ-TGĐ",
          "Quy trình nhận biết và cập nhật thông tin khách hàng (KYC)",
          ["Điều 1.2"],
          "Bước 2 – Xác minh",
          "supplement",
          82,
          "KYC verification step must record the biometric match result.",
          "dept-aml",
          "accepted",
        ),
        mapping(
          "m-17-4",
          "qd-cards",
          "QĐ 0480/2025/QĐ-TGĐ",
          "Quy định về phát hành và sử dụng thẻ ngân hàng",
          ["Điều 1.4"],
          "Điều 9",
          "amend",
          89,
          "Card issuance needs biometric matching.",
          "dept-retail",
          "accepted",
        ),
      ],
      revisionTaskIds: ["rv-17-1", "rv-17-2", "rv-17-3", "rv-17-4"],
    }),
    legalUpdate({
      id: "lu-tt83-2025",
      code: "LU-2026-002",
      docNumber: "83/2025/TT-NHNN",
      title:
        "Thông tư quy định về hệ thống kiểm soát nội bộ của ngân hàng thương mại, chi nhánh ngân hàng nước ngoài",
      docType: "Thông tư",
      issuer: "NHNN",
      issueDate: "2025-12-31T09:00:00+07:00",
      effectiveDate: "2026-07-01T00:00:00+07:00",
      receivedAt: "2026-01-05T09:00:00+07:00",
      channel: "auto_feed",
      sourceName: "vbpl.vn – Cơ sở dữ liệu quốc gia về VBPL",
      field: "Kiểm soát nội bộ",
      relevance: "high",
      relevanceScore: 98,
      relevanceReason:
        "Core regulation for the internal control system and the 3 lines of defence.",
      summary:
        "Quy định mô hình 3 tuyến bảo vệ, yêu cầu Bộ phận tuân thủ độc lập, báo cáo hệ thống KSNB định kỳ cho NHNN.",
      aiSummary: {
        keyChanges: [
          "3 lines of defence with an independent Compliance function in line 2",
          "Single source of truth for control data (Điều 8)",
          "Annual internal-control report to NHNN",
        ],
        affectedUnits: [
          "Khối Kiểm soát nội bộ",
          "Khối Tuân thủ",
          "Khối Quản lý Rủi ro",
          "Khối Kiểm toán nội bộ",
        ],
        affectedProducts: ["Toàn hệ thống"],
        suggestedDeadline: "2026-06-15T00:00:00+07:00",
        confidence: 95,
        impactNote: "Five governance regulations to revise before 01/07/2026.",
      },
      articles: [
        art(
          "Điều 6",
          "Mô hình ba tuyến bảo vệ",
          "Ngân hàng tổ chức hệ thống kiểm soát nội bộ theo mô hình 3 tuyến bảo vệ độc lập.",
        ),
        art(
          "Điều 8",
          "Hệ thống thông tin quản lý",
          "Bảo đảm nguồn dữ liệu duy nhất, đầy đủ, chính xác phục vụ kiểm soát nội bộ.",
        ),
        art(
          "Điều 21",
          "Bộ phận tuân thủ",
          "Bộ phận tuân thủ hoạt động độc lập, báo cáo trực tiếp Tổng Giám đốc.",
        ),
        art(
          "Điều 45",
          "Báo cáo",
          "Báo cáo NHNN về hệ thống kiểm soát nội bộ định kỳ hằng năm.",
        ),
      ],
      relations: [
        {
          type: "replaces",
          docNumber: "13/2018/TT-NHNN",
          title: "Hệ thống kiểm soát nội bộ của NHTM",
        },
        {
          type: "guided_by",
          docNumber: "32/2024/QH15",
          title: "Luật Các tổ chức tín dụng 2024",
        },
      ],
      status: "assigned",
      read: true,
      applicability: {
        decision: "applicable",
        reason: "Core governance regulation.",
        decidedBy: "Lê Thị Hoa",
        decidedAt: "2026-01-06T10:00:00+07:00",
      },
      mappings: [
        mapping(
          "m-83-1",
          "qd-ic",
          "QĐ 0118/2025/QĐ-HĐQT",
          "Quy chế kiểm soát nội bộ",
          ["Điều 6", "Điều 8"],
          "Điều 3, 6, 9",
          "amend",
          97,
          "",
          "dept-internal-control",
          "accepted",
        ),
        mapping(
          "m-83-2",
          "qd-risk",
          "QĐ 0119/2025/QĐ-HĐQT",
          "Quy chế quản lý rủi ro",
          ["Điều 6"],
          "Chương II",
          "amend",
          92,
          "",
          "dept-risk",
          "accepted",
        ),
        mapping(
          "m-83-3",
          "qd-audit",
          "QĐ 0120/2025/QĐ-HĐQT",
          "Quy chế kiểm toán nội bộ",
          ["Điều 6", "Điều 45"],
          "Chương III",
          "amend",
          90,
          "",
          "dept-audit",
          "accepted",
        ),
        mapping(
          "m-83-4",
          "qd-compliance",
          "QĐ 0732/2024/QĐ-TGĐ",
          "Quy định về chức năng tuân thủ",
          ["Điều 21"],
          "Toàn văn",
          "replace",
          94,
          "",
          "dept-compliance",
          "accepted",
        ),
        mapping(
          "m-83-5",
          "qd-violations",
          "QĐ 1502/2025/QĐ-TGĐ",
          "Quy trình báo cáo vi phạm và xử lý trách nhiệm",
          ["Điều 8"],
          "Bước 3",
          "supplement",
          76,
          "",
          "dept-legal",
          "accepted",
        ),
      ],
      revisionTaskIds: ["rv-83-1", "rv-83-2", "rv-83-3", "rv-83-4", "rv-83-5"],
    }),
    legalUpdate({
      id: "lu-tt21-btc",
      code: "LU-2026-027",
      docNumber: "21/2026/TT-BTC",
      title: "Thông tư hướng dẫn chế độ kế toán đối với doanh nghiệp bảo hiểm",
      docType: "Thông tư",
      issuer: "Bộ Tài chính",
      issueDate: d(-25),
      effectiveDate: d(70),
      receivedAt: d(-24, 9),
      channel: "auto_feed",
      sourceName: "Công báo Chính phủ",
      field: "Kế toán",
      relevance: "low",
      relevanceScore: 12,
      relevanceReason:
        "Applies to insurance companies, not credit institutions.",
      summary: "Hướng dẫn chế độ kế toán cho doanh nghiệp bảo hiểm.",
      aiSummary: {
        keyChanges: ["Accounting rules for insurers"],
        affectedUnits: [],
        affectedProducts: [],
        suggestedDeadline: d(70),
        confidence: 95,
        impactNote: "No impact expected on Nam A Bank.",
      },
      articles: [
        art(
          "Điều 1",
          "Phạm vi điều chỉnh",
          "Áp dụng đối với doanh nghiệp bảo hiểm, chi nhánh doanh nghiệp bảo hiểm nước ngoài.",
        ),
      ],
      relations: [],
      status: "not_applicable",
      read: true,
      applicability: {
        decision: "not_applicable",
        reason:
          "Scope limited to insurance companies; bancassurance rules unchanged.",
        decidedBy: "Lê Thị Hoa",
        decidedAt: d(-22, 15),
      },
      mappings: [],
      revisionTaskIds: [],
    }),
    legalUpdate({
      id: "lu-law96-2025",
      code: "LU-2025-044",
      docNumber: "96/2025/QH15",
      title: "Luật sửa đổi, bổ sung một số điều của Luật Các tổ chức tín dụng",
      docType: "Luật",
      issuer: "Quốc hội",
      issueDate: d(-470),
      effectiveDate: d(-352),
      receivedAt: d(-468),
      channel: "auto_feed",
      sourceName: "vbpl.vn – Cơ sở dữ liệu quốc gia về VBPL",
      field: "Quản trị",
      relevance: "high",
      relevanceScore: 97,
      relevanceReason: "Amends the Law on Credit Institutions.",
      summary:
        "Bổ sung quy định về xử lý nợ xấu, quyền thu giữ tài sản bảo đảm và phân cấp phê duyệt.",
      aiSummary: {
        keyChanges: [
          "Collateral seizure rights restored",
          "Approval delegation updated",
        ],
        affectedUnits: ["Khối Quản lý Tín dụng", "Hội đồng Quản trị"],
        affectedProducts: ["Cho vay"],
        suggestedDeadline: d(-370),
        confidence: 96,
        impactNote: "Three regulations revised and issued.",
      },
      articles: [
        art(
          "Điều 1",
          "Sửa đổi Luật TCTD",
          "Sửa đổi, bổ sung các Điều 198a, 200a của Luật Các tổ chức tín dụng.",
        ),
      ],
      relations: [
        {
          type: "amends",
          docNumber: "32/2024/QH15",
          title: "Luật Các tổ chức tín dụng 2024",
        },
      ],
      status: "completed",
      read: true,
      applicability: {
        decision: "applicable",
        reason: "Law on Credit Institutions.",
        decidedBy: "Lê Thị Hoa",
        decidedAt: d(-466),
      },
      mappings: [
        mapping(
          "m-96-1",
          "qd-credit-reg",
          "QĐ 0215/2024/QĐ-HĐQT",
          "Quy chế cấp tín dụng",
          ["Điều 1"],
          "Chương IV",
          "amend",
          92,
          "",
          "dept-credit",
          "accepted",
        ),
        mapping(
          "m-96-2",
          "qd-delegation",
          "QĐ 0150/2025/QĐ-HĐQT",
          "Quy chế ủy quyền và phân cấp phê duyệt",
          ["Điều 1"],
          "Phụ lục 1",
          "amend",
          85,
          "",
          "dept-board",
          "accepted",
        ),
        mapping(
          "m-96-3",
          "qd-provisioning",
          "QĐ 0927/2024/QĐ-TGĐ",
          "Quy định phân loại nợ và trích lập dự phòng rủi ro",
          ["Điều 1"],
          "Điều 12",
          "amend",
          80,
          "",
          "dept-credit",
          "accepted",
        ),
      ],
      revisionTaskIds: ["rv-96-1", "rv-96-2", "rv-96-3"],
    }),
  ];
}

// ---------------------------------------------------------------------------
// Revision tasks
// ---------------------------------------------------------------------------

function approvalSteps(
  status: RevisionTask["status"],
  leadUnitName: string,
  level: "HĐQT" | "TGĐ",
  at: { draft?: string; review?: string; approval?: string; issued?: string },
): RevisionApprovalStep[] {
  const order: RevisionTask["status"][] = [
    "not_started",
    "in_revision",
    "pending_approval",
    "issued",
  ];
  const idx = order.indexOf(status);
  const approver = level === "HĐQT" ? "Hội đồng Quản trị" : "Tổng Giám đốc";
  return [
    {
      key: "draft",
      label: `Draft by lead unit (${leadUnitName})`,
      state: idx >= 2 ? "done" : idx === 1 ? "current" : "pending",
      by: idx >= 2 ? leadUnitName : undefined,
      at: idx >= 2 ? at.draft : undefined,
    },
    {
      key: "compliance_review",
      label: "Compliance review (Khối Tuân thủ)",
      state: idx >= 3 ? "done" : idx === 2 ? "current" : "pending",
      by: idx >= 2 ? "Lê Thị Hoa" : undefined,
      at: idx >= 3 ? at.review : undefined,
    },
    {
      key: "approval",
      label: `Approval (${approver})`,
      state: idx >= 3 ? "done" : "pending",
      by: idx >= 3 ? approver : undefined,
      at: idx >= 3 ? at.approval : undefined,
    },
    {
      key: "issued",
      label: "Issued with proof",
      state: idx >= 3 ? "done" : "pending",
      at: idx >= 3 ? at.issued : undefined,
    },
  ];
}

interface RevisionSpec {
  id: string;
  code: string;
  qdnbId: string;
  legalUpdateId: string;
  action: RevisionTask["action"];
  supportUnitIds: string[];
  ownerName: string;
  committed: string;
  expected: string;
  status: RevisionTask["status"];
  progress: number;
  issued?: { decisionNo: string; at: string };
  reminders?: { at: string; kind: string }[];
  escalations?: EscalationRecord[];
}

export function generateRevisionTasks(
  qdnbs: InternalRegulation[],
  legalUpdates: LegalUpdate[],
  org: OrganizationSettings,
): RevisionTask[] {
  const unitName = (id: string) =>
    org.hoDepartments.find((u) => u.id === id)?.name ??
    org.branches.find((b) => b.id === id)?.name ??
    id;
  const specs: RevisionSpec[] = [
    // Thông tư 83/2025 — effective 01/07/2026, mostly late.
    {
      id: "rv-83-1",
      code: "RV-2026-001",
      qdnbId: "qd-ic",
      legalUpdateId: "lu-tt83-2025",
      action: "amend",
      supportUnitIds: ["dept-compliance", "dept-risk"],
      ownerName: "Đỗ Quang Huy",
      committed: "2026-06-15T00:00:00+07:00",
      expected: "2026-06-12T00:00:00+07:00",
      status: "issued",
      progress: 100,
      issued: {
        decisionNo: "QĐ 0118/2026/QĐ-HĐQT",
        at: "2026-06-12T15:00:00+07:00",
      },
    },
    {
      id: "rv-83-2",
      code: "RV-2026-002",
      qdnbId: "qd-risk",
      legalUpdateId: "lu-tt83-2025",
      action: "amend",
      supportUnitIds: ["dept-compliance"],
      ownerName: "Vũ Thị Lan",
      committed: "2026-06-20T00:00:00+07:00",
      expected: "2026-06-26T00:00:00+07:00",
      status: "issued",
      progress: 100,
      issued: {
        decisionNo: "QĐ 0119/2026/QĐ-HĐQT",
        at: "2026-06-26T10:00:00+07:00",
      },
    },
    {
      id: "rv-83-3",
      code: "RV-2026-003",
      qdnbId: "qd-audit",
      legalUpdateId: "lu-tt83-2025",
      action: "amend",
      supportUnitIds: ["dept-internal-control"],
      ownerName: "Hoàng Minh Tuấn",
      committed: d(-10),
      expected: d(4),
      status: "pending_approval",
      progress: 90,
      reminders: [
        { at: d(-40), kind: "T-30" },
        { at: d(-24), kind: "T-14" },
        { at: d(-17), kind: "T-7" },
        { at: d(-11), kind: "T-1" },
        { at: d(-9), kind: "Overdue +1" },
      ],
      escalations: [
        {
          id: "esc-rv833-1",
          level: 1,
          to: ESCALATION_TARGETS[1],
          reason: "overdue",
          detail: "1 day past the committed date",
          at: d(-9, 8),
        },
      ],
    },
    {
      id: "rv-83-4",
      code: "RV-2026-004",
      qdnbId: "qd-compliance",
      legalUpdateId: "lu-tt83-2025",
      action: "replace",
      supportUnitIds: ["dept-legal", "dept-internal-control"],
      ownerName: "Lê Thị Hoa",
      committed: d(-25),
      expected: d(12),
      status: "in_revision",
      progress: 65,
      reminders: [
        { at: d(-55), kind: "T-30" },
        { at: d(-39), kind: "T-14" },
        { at: d(-32), kind: "T-7" },
        { at: d(-26), kind: "T-1" },
        { at: d(-24), kind: "Overdue +1" },
        { at: d(-18), kind: "Overdue +7" },
      ],
      escalations: [
        {
          id: "esc-rv834-1",
          level: 1,
          to: ESCALATION_TARGETS[1],
          reason: "overdue",
          detail: "1 day past the committed date",
          at: d(-24, 8),
        },
        {
          id: "esc-rv834-2",
          level: 2,
          to: ESCALATION_TARGETS[2],
          reason: "overdue",
          detail: "7 days past the committed date",
          at: d(-18, 8),
          acknowledgedBy: "Lê Thị Hoa",
          acknowledgedAt: d(-18, 11),
        },
        {
          id: "esc-rv834-3",
          level: 3,
          to: ESCALATION_TARGETS[3],
          reason: "overdue",
          detail: "15 days past the committed date",
          at: d(-10, 8),
        },
      ],
    },
    {
      id: "rv-83-5",
      code: "RV-2026-005",
      qdnbId: "qd-violations",
      legalUpdateId: "lu-tt83-2025",
      action: "supplement",
      supportUnitIds: ["dept-compliance"],
      ownerName: "Ngô Thanh Trang",
      committed: d(10),
      expected: d(35),
      status: "not_started",
      progress: 0,
      reminders: [{ at: d(-20), kind: "T-30" }],
    },
    // Thông tư 17/2026 — effective in 20 days.
    {
      id: "rv-17-1",
      code: "RV-2026-011",
      qdnbId: "qd-accounts",
      legalUpdateId: "lu-tt17-2026",
      action: "amend",
      supportUnitIds: ["dept-it", "dept-aml"],
      ownerName: "Trần Ngọc Mai",
      committed: d(12),
      expected: d(18),
      status: "in_revision",
      progress: 55,
      reminders: [
        { at: d(-18), kind: "T-30" },
        { at: d(-2), kind: "T-14" },
      ],
    },
    {
      id: "rv-17-2",
      code: "RV-2026-012",
      qdnbId: "qd-biometric",
      legalUpdateId: "lu-tt17-2026",
      action: "amend",
      supportUnitIds: ["dept-operations"],
      ownerName: "Phan Đức Long",
      committed: d(15),
      expected: d(9),
      status: "pending_approval",
      progress: 90,
      reminders: [
        { at: d(-15), kind: "T-30" },
        { at: d(1), kind: "T-14" },
      ],
    },
    {
      id: "rv-17-3",
      code: "RV-2026-013",
      qdnbId: "qd-kyc",
      legalUpdateId: "lu-tt17-2026",
      action: "supplement",
      supportUnitIds: ["dept-operations"],
      ownerName: "Bùi Thị Thảo",
      committed: d(16),
      expected: d(25),
      status: "in_revision",
      progress: 40,
      reminders: [{ at: d(-14), kind: "T-30" }],
    },
    {
      id: "rv-17-4",
      code: "RV-2026-014",
      qdnbId: "qd-cards",
      legalUpdateId: "lu-tt17-2026",
      action: "amend",
      supportUnitIds: ["dept-it"],
      ownerName: "Đặng Văn Khoa",
      committed: d(14),
      expected: d(19),
      status: "not_started",
      progress: 0,
      reminders: [
        { at: d(-16), kind: "T-30" },
        { at: d(0), kind: "T-14" },
      ],
    },
    // Luật 96/2025/QH15 — done.
    {
      id: "rv-96-1",
      code: "RV-2025-061",
      qdnbId: "qd-credit-reg",
      legalUpdateId: "lu-law96-2025",
      action: "amend",
      supportUnitIds: ["dept-legal"],
      ownerName: "Đỗ Quang Huy",
      committed: d(-365),
      expected: d(-368),
      status: "issued",
      progress: 100,
      issued: { decisionNo: "QĐ 0215/2024/QĐ-HĐQT", at: d(-330) },
    },
    {
      id: "rv-96-2",
      code: "RV-2025-062",
      qdnbId: "qd-delegation",
      legalUpdateId: "lu-law96-2025",
      action: "amend",
      supportUnitIds: ["dept-legal"],
      ownerName: "Nguyễn Hải Yến",
      committed: d(-340),
      expected: d(-336),
      status: "issued",
      progress: 100,
      issued: { decisionNo: "QĐ 0150/2025/QĐ-HĐQT", at: d(-335) },
    },
    {
      id: "rv-96-3",
      code: "RV-2025-063",
      qdnbId: "qd-provisioning",
      legalUpdateId: "lu-law96-2025",
      action: "amend",
      supportUnitIds: ["dept-risk"],
      ownerName: "Vũ Thị Lan",
      committed: d(-345),
      expected: d(-342),
      status: "issued",
      progress: 100,
      issued: { decisionNo: "QĐ 0927/2024/QĐ-TGĐ", at: d(-340) },
    },
  ];

  return specs.map((s) => {
    const q = qdnbs.find((x) => x.id === s.qdnbId)!;
    const lu = legalUpdates.find((x) => x.id === s.legalUpdateId)!;
    const leadUnitName = unitName(q.ownerUnitId);
    const issuedAt = s.issued?.at;
    const reminders: ReminderRecord[] = (s.reminders ?? []).map((r, i) => ({
      id: `${s.id}-rem-${i}`,
      at: r.at,
      kind: r.kind,
      to: `${leadUnitName}; ${s.ownerName}`,
      channels: ["in_app", "email"],
    }));
    return {
      id: s.id,
      code: s.code,
      qdnbId: q.id,
      qdnbCode: q.code,
      qdnbTitle: q.title,
      action: s.action,
      sources: [
        {
          legalUpdateId: lu.id,
          docNumber: lu.docNumber,
          title: lu.title,
          effectiveDate: lu.effectiveDate,
        },
      ],
      lawEffectiveDate: lu.effectiveDate,
      leadUnitId: q.ownerUnitId,
      leadUnitName,
      supportUnitIds: s.supportUnitIds,
      supportUnitNames: s.supportUnitIds.map(unitName),
      ownerName: s.ownerName,
      committedDate: s.committed,
      expectedIssueDate: s.expected,
      status: s.status,
      progress: s.progress,
      approvalSteps: approvalSteps(s.status, leadUnitName, q.issuingLevel, {
        draft: issuedAt ? iso(subDays(new Date(issuedAt), 20)) : undefined,
        review: issuedAt ? iso(subDays(new Date(issuedAt), 10)) : undefined,
        approval: issuedAt ? iso(subDays(new Date(issuedAt), 2)) : undefined,
        issued: issuedAt,
      }),
      evidence: s.issued
        ? {
            decisionNo: s.issued.decisionNo,
            issueDate: s.issued.at,
            effectiveDate: iso(addDays(new Date(s.issued.at), 5)),
            fileName: `${s.issued.decisionNo.replace(/[ /]/g, "_")}_signed.pdf`,
            recordedBy: s.ownerName,
            recordedAt: s.issued.at,
          }
        : undefined,
      reminders,
      escalations: s.escalations ?? [],
      issuedAt,
      createdAt: lu.applicability?.decidedAt ?? lu.receivedAt,
      updatedAt: issuedAt ?? d(-1),
    };
  });
}

// ---------------------------------------------------------------------------
// ICIS findings
// ---------------------------------------------------------------------------

export function generateIcisFindings(org: OrganizationSettings): IcisFinding[] {
  const unit = (id: string) => {
    const b = org.branches.find((x) => x.id === id);
    if (b) return { unitId: b.id, unitName: b.name, region: b.region };
    const h = org.hoDepartments.find((x) => x.id === id)!;
    return { unitId: h.id, unitName: h.name, region: undefined };
  };
  const f = (
    o: Omit<IcisFinding, "createdAt" | "updatedAt" | "unitName" | "region"> & {
      unitId: string;
    },
  ): IcisFinding => ({
    ...o,
    ...unit(o.unitId),
    createdAt: o.receivedAt,
    updatedAt: o.receivedAt,
  });
  return [
    f({
      id: "icis-031",
      code: "ICIS-KT-2026-031",
      auditRound: "Kiểm tra định kỳ Q3/2026 – Chi nhánh Cần Thơ",
      unitId: "branch-cantho",
      category: "KYC / customer identification",
      description:
        "12/40 hồ sơ mở tài khoản cá nhân được kiểm tra chưa đối chiếu sinh trắc học với CCCD gắn chip. Nguyên nhân: cấu hình ứng dụng cho phép bỏ qua bước đối chiếu khi dịch vụ C06 gián đoạn — có thể xảy ra tại tất cả chi nhánh.",
      recommendation:
        "Rà soát toàn bộ tài khoản mở từ 01/07/2026 trên toàn hàng; khóa cấu hình bỏ qua đối chiếu; bổ sung đối chiếu sinh trắc học trước ngày 30 của tháng.",
      severityHint: "high",
      finePotential: 600_000_000,
      scopeHint: 4,
      detectedAt: d(-4),
      inspector: "Phạm Thu Hà – P.KTKSNB",
      receivedAt: d(-1, 16),
      status: "pending",
    }),
    f({
      id: "icis-032",
      code: "ICIS-KT-2026-032",
      auditRound: "Kiểm tra định kỳ Q3/2026 – Chi nhánh Cần Thơ",
      unitId: "branch-cantho",
      category: "Credit granting procedure",
      description:
        "3 khoản vay tiêu dùng giải ngân trước khi hoàn tất phê duyệt của cấp có thẩm quyền.",
      recommendation:
        "Thu hồi hoặc bổ sung phê duyệt; xem xét trách nhiệm cán bộ tín dụng.",
      severityHint: "medium",
      finePotential: 60_000_000,
      detectedAt: d(-4),
      inspector: "Phạm Thu Hà – P.KTKSNB",
      receivedAt: d(-1, 16),
      status: "pending",
    }),
    f({
      id: "icis-033",
      code: "ICIS-KT-2026-033",
      auditRound: "Kiểm tra chuyên đề AML – Chi nhánh TP.HCM",
      unitId: "branch-hcm",
      category: "AML / suspicious transaction reporting",
      description:
        "02 giao dịch đáng ngờ (chuyển tiền nhiều lần dưới ngưỡng) không được báo cáo Cục PCRT trong thời hạn quy định.",
      recommendation:
        "Báo cáo bổ sung ngay; đào tạo lại nhân viên giao dịch về dấu hiệu chia nhỏ giao dịch.",
      severityHint: "high",
      finePotential: 300_000_000,
      detectedAt: d(-6),
      inspector: "Lý Quốc Bảo – P.KTKSNB",
      receivedAt: d(-2, 10),
      status: "pending",
    }),
    f({
      id: "icis-034",
      code: "ICIS-KT-2026-034",
      auditRound: "Kiểm tra chuyên đề AML – Chi nhánh TP.HCM",
      unitId: "branch-hcm",
      category: "KYC / customer identification",
      description:
        "Hồ sơ KYC của 5 khách hàng doanh nghiệp chưa cập nhật thông tin chủ sở hữu hưởng lợi.",
      recommendation: "Cập nhật thông tin chủ sở hữu hưởng lợi trong 15 ngày.",
      severityHint: "medium",
      finePotential: 50_000_000,
      detectedAt: d(-6),
      inspector: "Lý Quốc Bảo – P.KTKSNB",
      receivedAt: d(-2, 10),
      status: "pending",
    }),
    f({
      id: "icis-035",
      code: "ICIS-KT-2026-035",
      auditRound: "Kiểm tra off-site – Khối Vận hành",
      unitId: "dept-operations",
      category: "Cash & vault operations",
      description:
        "Biên bản kiểm kê quỹ cuối ngày tại 2 phòng giao dịch thiếu chữ ký của kiểm soát viên.",
      recommendation:
        "Nhắc nhở và bổ sung chữ ký; cấu hình chốt chặn không cho đóng quỹ khi thiếu phê duyệt.",
      severityHint: "low",
      finePotential: 0,
      detectedAt: d(-8),
      inspector: "Trịnh Văn Nam – P.KTKSNB",
      receivedAt: d(-3, 9),
      status: "pending",
    }),
    f({
      id: "icis-036",
      code: "ICIS-KT-2026-036",
      auditRound: "Kiểm tra định kỳ Q3/2026 – Chi nhánh Đà Nẵng",
      unitId: "branch-dn",
      category: "Collateral & valuation",
      description:
        "Giá trị định giá 2 tài sản bảo đảm cao hơn giá tham chiếu 25% nhưng không có giải trình.",
      recommendation: "Định giá lại bởi đơn vị độc lập; rà soát mức cho vay.",
      severityHint: "medium",
      finePotential: 80_000_000,
      detectedAt: d(-9),
      inspector: "Phạm Thu Hà – P.KTKSNB",
      receivedAt: d(-3, 15),
      status: "pending",
    }),
    // Already processed
    f({
      id: "icis-021",
      code: "ICIS-KT-2026-021",
      auditRound: "Kiểm tra định kỳ Q2/2026 – Chi nhánh Hà Nội",
      unitId: "branch-hn",
      category: "KYC / customer identification",
      description:
        "Hồ sơ mở tài khoản không lưu bản sao giấy tờ tùy thân hợp lệ.",
      recommendation: "Bổ sung hồ sơ; đào tạo giao dịch viên.",
      severityHint: "medium",
      finePotential: 40_000_000,
      detectedAt: d(-70),
      inspector: "Lý Quốc Bảo – P.KTKSNB",
      receivedAt: d(-68),
      status: "accepted",
      issueId: "iss-01",
    }),
    f({
      id: "icis-022",
      code: "ICIS-KT-2026-022",
      auditRound: "Kiểm tra định kỳ Q2/2026 – Chi nhánh Hà Nội",
      unitId: "branch-hn",
      category: "Credit granting procedure",
      description:
        "Thiếu biên bản kiểm tra sử dụng vốn sau giải ngân đối với 7 khoản vay.",
      recommendation: "Thực hiện kiểm tra bổ sung trong 30 ngày.",
      severityHint: "medium",
      finePotential: 60_000_000,
      detectedAt: d(-70),
      inspector: "Lý Quốc Bảo – P.KTKSNB",
      receivedAt: d(-68),
      status: "accepted",
      issueId: "iss-02",
    }),
    f({
      id: "icis-023",
      code: "ICIS-KT-2026-023",
      auditRound: "Kiểm tra chuyên đề thẻ – Khối Ngân hàng Bán lẻ",
      unitId: "dept-retail",
      category: "Consumer protection",
      description:
        "Biểu phí thẻ niêm yết trên website khác với biểu phí áp dụng thực tế.",
      recommendation: "Cập nhật biểu phí; hoàn phí thu sai cho khách hàng.",
      severityHint: "high",
      finePotential: 120_000_000,
      detectedAt: d(-55),
      inspector: "Trịnh Văn Nam – P.KTKSNB",
      receivedAt: d(-54),
      status: "accepted",
      issueId: "iss-03",
    }),
    f({
      id: "icis-024",
      code: "ICIS-KT-2026-024",
      auditRound: "Kiểm tra định kỳ Q2/2026 – Chi nhánh Hải Phòng",
      unitId: "branch-haiphong",
      category: "AML / suspicious transaction reporting",
      description:
        "Không rà soát danh sách cấm vận khi thực hiện chuyển tiền quốc tế cho 3 giao dịch.",
      recommendation: "Bổ sung bước rà soát tự động; báo cáo Khối PCRT.",
      severityHint: "high",
      finePotential: 200_000_000,
      detectedAt: d(-40),
      inspector: "Lý Quốc Bảo – P.KTKSNB",
      receivedAt: d(-39),
      status: "accepted",
      issueId: "iss-04",
    }),
    f({
      id: "icis-025",
      code: "ICIS-KT-2026-025",
      auditRound: "Kiểm tra định kỳ Q2/2026 – Chi nhánh Nha Trang",
      unitId: "branch-nhatrang",
      category: "Interest rate & fees",
      description:
        "Áp dụng lãi suất ưu đãi cho 4 khoản vay không đúng điều kiện chương trình.",
      recommendation: "Điều chỉnh lãi suất; truy thu chênh lệch.",
      severityHint: "low",
      finePotential: 20_000_000,
      detectedAt: d(-35),
      inspector: "Phạm Thu Hà – P.KTKSNB",
      receivedAt: d(-34),
      status: "accepted",
      issueId: "iss-05",
    }),
    f({
      id: "icis-026",
      code: "ICIS-KT-2026-026",
      auditRound: "Kiểm tra định kỳ Q2/2026 – Chi nhánh Hà Nội",
      unitId: "branch-hn",
      category: "KYC / customer identification",
      description:
        "Hồ sơ KYC thiếu thông tin nghề nghiệp của khách hàng (lặp lại phát hiện ICIS-KT-2026-021).",
      recommendation: "Gộp xử lý với vấn đề đang mở.",
      severityHint: "medium",
      finePotential: 20_000_000,
      detectedAt: d(-66),
      inspector: "Lý Quốc Bảo – P.KTKSNB",
      receivedAt: d(-66),
      status: "merged",
      issueId: "iss-01",
      resolutionNote: "Merged into the open KYC issue at Chi nhánh Hà Nội.",
    }),
    f({
      id: "icis-027",
      code: "ICIS-KT-2026-027",
      auditRound: "Kiểm tra off-site – Khối CNTT",
      unitId: "dept-it",
      category: "Information security",
      description:
        "Tài khoản quản trị của nhân viên đã nghỉ việc chưa bị vô hiệu hóa trên 1 hệ thống phụ trợ.",
      recommendation: "Gộp với vấn đề quản lý tài khoản đặc quyền.",
      severityHint: "medium",
      detectedAt: d(-30),
      inspector: "Trịnh Văn Nam – P.KTKSNB",
      receivedAt: d(-29),
      status: "merged",
      issueId: "iss-09",
      resolutionNote: "Same root cause as the privileged-account issue.",
    }),
    f({
      id: "icis-028",
      code: "ICIS-KT-2026-028",
      auditRound: "Kiểm tra định kỳ Q2/2026 – Chi nhánh Vũng Tàu",
      unitId: "branch-vungtau",
      category: "Payment & accounts",
      description: "Đề nghị kiểm tra lại số dư tài khoản treo.",
      recommendation: "Đối chiếu số dư.",
      severityHint: "low",
      detectedAt: d(-25),
      inspector: "Phạm Thu Hà – P.KTKSNB",
      receivedAt: d(-24),
      status: "rejected",
      resolutionNote:
        "Not a compliance issue — operational reconciliation already closed by Finance.",
    }),
  ];
}

// ---------------------------------------------------------------------------
// Compliance issues (replaces the generic NCC seed)
// ---------------------------------------------------------------------------

interface IssueSpec {
  id: string;
  title: string;
  description: string;
  category: string;
  source: IssueSource;
  sourceRef?: string;
  unitId: string;
  ownerName: string;
  createdDaysAgo: number;
  dueInDays: number;
  status: "Open" | "Closed";
  scores: RiskScores;
  override?: { level: "low" | "medium" | "high"; reason: string };
  repeatCount: number;
  stage: IssueWorkflow["stage"];
  rounds?: {
    submittedDaysAgo: number;
    decision?: "accepted" | "returned";
    comment?: string;
    files: string[];
    note: string;
  }[];
  regulationRef?: string;
  icisFindingId?: string;
  tags: string[];
  resolution?: string;
}

const ISSUE_SPECS: IssueSpec[] = [
  {
    id: "iss-01",
    title: "Hồ sơ KYC không đầy đủ tại Chi nhánh Hà Nội",
    description:
      "Hồ sơ mở tài khoản thiếu bản sao giấy tờ tùy thân và thông tin nghề nghiệp (gộp 2 phát hiện ICIS).",
    category: "KYC / customer identification",
    source: "icis",
    sourceRef: "ICIS-KT-2026-021",
    unitId: "branch-hn",
    ownerName: "Trần Ngọc Mai",
    createdDaysAgo: 68,
    dueInDays: -8,
    status: "Open",
    scores: { fine: 2, reputation: 2, scope: 2, recurrence: 3 },
    repeatCount: 3,
    stage: "review",
    rounds: [
      {
        submittedDaysAgo: 20,
        decision: "returned",
        comment: "Thiếu danh sách đối chiếu cho 12 hồ sơ còn lại.",
        files: ["Danh_sach_bo_sung_KYC_dot1.xlsx"],
        note: "Đã bổ sung 28/40 hồ sơ.",
      },
      {
        submittedDaysAgo: 3,
        files: ["Danh_sach_bo_sung_KYC_dot2.xlsx", "Bien_ban_dao_tao_GDV.pdf"],
        note: "Đã bổ sung đủ 40/40 hồ sơ, đào tạo lại giao dịch viên.",
      },
    ],
    regulationRef: "QĐ 0950/2024/QĐ-TGĐ – Bước 2",
    icisFindingId: "icis-021",
    tags: ["KYC", "Q2/2026"],
  },
  {
    id: "iss-02",
    title: "Thiếu kiểm tra sử dụng vốn sau giải ngân – CN Hà Nội",
    description:
      "7 khoản vay không có biên bản kiểm tra mục đích sử dụng vốn sau giải ngân.",
    category: "Credit granting procedure",
    source: "icis",
    sourceRef: "ICIS-KT-2026-022",
    unitId: "branch-hn",
    ownerName: "Đỗ Quang Huy",
    createdDaysAgo: 68,
    dueInDays: 6,
    status: "Open",
    scores: { fine: 2, reputation: 2, scope: 2, recurrence: 2 },
    repeatCount: 2,
    stage: "evidence",
    regulationRef: "QĐ 1120/2024/QĐ-TGĐ – Điều 15",
    icisFindingId: "icis-022",
    tags: ["Tín dụng"],
  },
  {
    id: "iss-03",
    title: "Biểu phí thẻ niêm yết sai lệch với thực tế",
    description:
      "Biểu phí thẻ trên website khác với phí thu thực tế; một số khách hàng bị thu phí cao hơn niêm yết.",
    category: "Consumer protection",
    source: "icis",
    sourceRef: "ICIS-KT-2026-023",
    unitId: "dept-retail",
    ownerName: "Bùi Thị Thảo",
    createdDaysAgo: 54,
    dueInDays: -3,
    status: "Open",
    scores: { fine: 3, reputation: 4, scope: 4, recurrence: 1 },
    repeatCount: 1,
    stage: "approval",
    rounds: [
      {
        submittedDaysAgo: 6,
        decision: "accepted",
        comment: "Bằng chứng hoàn phí đầy đủ.",
        files: ["Bang_hoan_phi_KH.xlsx", "Bieu_phi_cap_nhat.pdf"],
        note: "Đã hoàn phí cho 1.284 khách hàng và cập nhật website.",
      },
    ],
    regulationRef: "QĐ 0480/2025/QĐ-TGĐ – Điều 22",
    icisFindingId: "icis-023",
    tags: ["Thẻ", "Bảo vệ NTD"],
  },
  {
    id: "iss-04",
    title: "Không rà soát danh sách cấm vận khi chuyển tiền quốc tế",
    description:
      "3 giao dịch chuyển tiền quốc tế không được rà soát danh sách cấm vận trước khi xử lý.",
    category: "AML / suspicious transaction reporting",
    source: "icis",
    sourceRef: "ICIS-KT-2026-024",
    unitId: "branch-haiphong",
    ownerName: "Phan Đức Long",
    createdDaysAgo: 39,
    dueInDays: -18,
    status: "Open",
    scores: { fine: 3, reputation: 4, scope: 3, recurrence: 2 },
    repeatCount: 2,
    stage: "evidence",
    regulationRef: "QĐ 0306/2024/QĐ-HĐQT – Điều 18",
    icisFindingId: "icis-024",
    tags: ["AML", "Cấm vận"],
  },
  {
    id: "iss-05",
    title: "Áp dụng sai lãi suất ưu đãi – CN Nha Trang",
    description:
      "4 khoản vay hưởng lãi suất ưu đãi không đúng điều kiện chương trình.",
    category: "Interest rate & fees",
    source: "icis",
    sourceRef: "ICIS-KT-2026-025",
    unitId: "branch-nhatrang",
    ownerName: "Nguyễn Hải Yến",
    createdDaysAgo: 34,
    dueInDays: -2,
    status: "Closed",
    scores: { fine: 1, reputation: 1, scope: 2, recurrence: 1 },
    repeatCount: 1,
    stage: "closed",
    rounds: [
      {
        submittedDaysAgo: 10,
        decision: "accepted",
        comment: "Đã truy thu đủ.",
        files: ["Bien_ban_dieu_chinh_lai_suat.pdf"],
        note: "Điều chỉnh lãi suất và truy thu chênh lệch.",
      },
    ],
    regulationRef: "QĐ 0812/2024/QĐ-TGĐ",
    icisFindingId: "icis-025",
    tags: ["Lãi suất"],
    resolution: "Interest corrected and difference recovered from 4 borrowers.",
  },
  {
    id: "iss-06",
    title:
      "Kết luận thanh tra NHNN: vượt giới hạn cấp tín dụng nhóm khách hàng liên quan",
    description:
      "Thanh tra NHNN kết luận dư nợ của 01 nhóm khách hàng liên quan vượt giới hạn 25% vốn tự có trong 2 tháng.",
    category: "Prudential ratios reporting",
    source: "sbv_inspection",
    sourceRef: "KL 145/KL-TTGSNH",
    unitId: "dept-credit",
    ownerName: "Đỗ Quang Huy",
    createdDaysAgo: 90,
    dueInDays: -16,
    status: "Open",
    scores: { fine: 4, reputation: 4, scope: 4, recurrence: 1 },
    repeatCount: 1,
    stage: "evidence",
    regulationRef: "QĐ 0270/2025/QĐ-HĐQT – Điều 5",
    tags: ["Thanh tra NHNN", "Giới hạn tín dụng"],
  },
  {
    id: "iss-07",
    title: "Báo cáo tỷ lệ an toàn vốn nộp NHNN chậm hạn",
    description: "Báo cáo tỷ lệ an toàn vốn tháng 8 nộp chậm 3 ngày làm việc.",
    category: "Prudential ratios reporting",
    source: "compliance_monitoring",
    unitId: "dept-risk",
    ownerName: "Vũ Thị Lan",
    createdDaysAgo: 30,
    dueInDays: 5,
    status: "Open",
    scores: { fine: 2, reputation: 2, scope: 1, recurrence: 2 },
    repeatCount: 2,
    stage: "check",
    regulationRef: "Thông tư 14/2025/TT-NHNN – Điều 29",
    tags: ["Báo cáo NHNN"],
  },
  {
    id: "iss-08",
    title: "Kiểm toán Nhà nước: trích lập dự phòng chưa đầy đủ",
    description:
      "KTNN phát hiện 3 khoản nợ chưa được phân loại đúng nhóm, dẫn đến trích lập dự phòng thiếu.",
    category: "Credit granting procedure",
    source: "state_audit",
    sourceRef: "BB KTNN 2026/KV-IV",
    unitId: "dept-credit",
    ownerName: "Đỗ Quang Huy",
    createdDaysAgo: 120,
    dueInDays: -40,
    status: "Closed",
    scores: { fine: 3, reputation: 3, scope: 3, recurrence: 1 },
    repeatCount: 1,
    stage: "closed",
    rounds: [
      {
        submittedDaysAgo: 45,
        decision: "accepted",
        comment: "Đủ bằng chứng.",
        files: ["Bang_phan_loai_no_dieu_chinh.xlsx"],
        note: "Phân loại lại và trích lập bổ sung.",
      },
    ],
    regulationRef: "QĐ 0927/2024/QĐ-TGĐ",
    tags: ["KTNN"],
    resolution: "Reclassified 3 loans and booked additional provisions.",
  },
  {
    id: "iss-09",
    title: "Quản lý tài khoản đặc quyền chưa chặt chẽ",
    description:
      "Tài khoản quản trị chưa được rà soát định kỳ; một số tài khoản của nhân sự nghỉ việc vẫn hoạt động.",
    category: "Information security",
    source: "internal_audit",
    sourceRef: "BC KTNB 22/2026",
    unitId: "dept-it",
    ownerName: "Phan Đức Long",
    createdDaysAgo: 45,
    dueInDays: 9,
    status: "Open",
    scores: { fine: 2, reputation: 3, scope: 4, recurrence: 2 },
    repeatCount: 2,
    stage: "evidence",
    regulationRef: "QĐ 0601/2024/QĐ-TGĐ – Điều 21",
    tags: ["ATTT"],
  },
  {
    id: "iss-10",
    title: "Kiểm toán độc lập: đối chiếu công nợ nội bộ chưa kịp thời",
    description:
      "Kiểm toán độc lập ghi nhận chênh lệch đối chiếu tài khoản nội bộ giữa Hội sở và chi nhánh chưa xử lý quá 30 ngày.",
    category: "Payment & accounts",
    source: "independent_audit",
    sourceRef: "Thư quản lý 2025",
    unitId: "dept-finance",
    ownerName: "Nguyễn Hải Yến",
    createdDaysAgo: 150,
    dueInDays: -60,
    status: "Closed",
    scores: { fine: 1, reputation: 2, scope: 3, recurrence: 1 },
    repeatCount: 1,
    stage: "closed",
    rounds: [
      {
        submittedDaysAgo: 70,
        decision: "accepted",
        comment: "OK.",
        files: ["Doi_chieu_cong_no.xlsx"],
        note: "Đã xử lý chênh lệch.",
      },
    ],
    tags: ["Kiểm toán độc lập"],
    resolution: "Reconciliation breaks cleared; weekly control added.",
  },
  {
    id: "iss-11",
    title: "Tự kiểm tra: hồ sơ vay chưa có đánh giá khả năng trả nợ",
    description:
      "Tự kiểm tra quý III phát hiện 6 hồ sơ vay tiêu dùng chưa có đánh giá khả năng trả nợ theo mẫu.",
    category: "Credit granting procedure",
    source: "self_check",
    sourceRef: "TKT-Q3-2026-CT",
    unitId: "branch-cantho",
    ownerName: "Ngô Thanh Trang",
    createdDaysAgo: 20,
    dueInDays: 12,
    status: "Open",
    scores: { fine: 2, reputation: 1, scope: 2, recurrence: 3 },
    repeatCount: 3,
    stage: "evidence",
    regulationRef: "QĐ 1120/2024/QĐ-TGĐ – Điều 14",
    tags: ["Tự kiểm tra"],
  },
  {
    id: "iss-12",
    title: "Khiếu nại về thu phí SMS Banking không thông báo",
    description:
      "Tiếp nhận 37 khiếu nại về việc thu phí SMS Banking không thông báo trước.",
    category: "Consumer protection",
    source: "complaint",
    sourceRef: "KN-2026-0912",
    unitId: "dept-retail",
    ownerName: "Bùi Thị Thảo",
    createdDaysAgo: 15,
    dueInDays: 15,
    status: "Open",
    scores: { fine: 2, reputation: 3, scope: 3, recurrence: 1 },
    repeatCount: 1,
    stage: "check",
    regulationRef: "QĐ 0333/2023/QĐ-TGĐ",
    tags: ["Khiếu nại"],
  },
  {
    id: "iss-13",
    title: "Giao dịch đáng ngờ chưa báo cáo – CN TP.HCM (lần 2)",
    description:
      "Giám sát tuân thủ phát hiện 1 giao dịch chuyển tiền chia nhỏ chưa được báo cáo đúng hạn.",
    category: "AML / suspicious transaction reporting",
    source: "compliance_monitoring",
    unitId: "branch-hcm",
    ownerName: "Trần Ngọc Mai",
    createdDaysAgo: 60,
    dueInDays: -22,
    status: "Open",
    scores: { fine: 3, reputation: 3, scope: 2, recurrence: 2 },
    repeatCount: 2,
    stage: "evidence",
    regulationRef: "QĐ 0306/2024/QĐ-HĐQT – Điều 24",
    tags: ["AML"],
  },
  {
    id: "iss-14",
    title: "Quy chế kiểm toán nội bộ chưa cập nhật theo Thông tư 83/2025",
    description:
      "Quy chế kiểm toán nội bộ chưa được sửa đổi dù Thông tư 83/2025/TT-NHNN đã có hiệu lực từ 01/07/2026.",
    category: "Internal regulation not updated",
    source: "compliance_monitoring",
    unitId: "dept-audit",
    ownerName: "Hoàng Minh Tuấn",
    createdDaysAgo: 9,
    dueInDays: 4,
    status: "Open",
    scores: { fine: 2, reputation: 2, scope: 4, recurrence: 1 },
    repeatCount: 1,
    stage: "check",
    regulationRef: "QĐ 0120/2025/QĐ-HĐQT",
    tags: ["QĐNB", "TT 83/2025"],
  },
  {
    id: "iss-15",
    title: "Thiếu chữ ký kiểm soát viên trên biên bản kiểm kê quỹ",
    description:
      "Biên bản kiểm kê quỹ cuối ngày tại PGD Bến Thành thiếu chữ ký kiểm soát viên trong 4 ngày.",
    category: "Cash & vault operations",
    source: "self_check",
    unitId: "branch-hcm",
    ownerName: "Lý Văn Bảo",
    createdDaysAgo: 28,
    dueInDays: -12,
    status: "Closed",
    scores: { fine: 1, reputation: 1, scope: 1, recurrence: 2 },
    repeatCount: 2,
    stage: "closed",
    rounds: [
      {
        submittedDaysAgo: 14,
        decision: "accepted",
        comment: "Đã bổ sung.",
        files: ["Bien_ban_kiem_ke_bo_sung.pdf"],
        note: "Bổ sung chữ ký và nhắc nhở.",
      },
    ],
    tags: ["Kho quỹ"],
    resolution: "Signatures added; reminder issued to vault staff.",
  },
  {
    id: "iss-16",
    title: "Định giá tài sản bảo đảm vượt giá tham chiếu – CN Đà Nẵng",
    description:
      "Một số tài sản bảo đảm có giá định giá cao hơn giá tham chiếu nhưng thiếu giải trình.",
    category: "Collateral & valuation",
    source: "internal_audit",
    sourceRef: "BC KTNB 19/2026",
    unitId: "branch-dn",
    ownerName: "Hà Minh Quân",
    createdDaysAgo: 75,
    dueInDays: -30,
    status: "Open",
    scores: { fine: 2, reputation: 2, scope: 2, recurrence: 2 },
    repeatCount: 2,
    stage: "review",
    rounds: [
      {
        submittedDaysAgo: 2,
        files: ["Bao_cao_dinh_gia_lai.pdf"],
        note: "Định giá lại bởi công ty thẩm định độc lập.",
      },
    ],
    regulationRef: "QĐ 0455/2025/QĐ-TGĐ",
    tags: ["TSBĐ"],
  },
  {
    id: "iss-17",
    title: "Hệ thống core chưa chặn giao dịch khi thiếu phê duyệt cấp 2",
    description:
      "Giao dịch chi tiền mặt trên hạn mức có thể hoàn tất khi chưa có phê duyệt cấp 2.",
    category: "Cash & vault operations",
    source: "compliance_monitoring",
    unitId: "dept-operations",
    ownerName: "Trịnh Văn Nam",
    createdDaysAgo: 40,
    dueInDays: 20,
    status: "Open",
    scores: { fine: 2, reputation: 2, scope: 4, recurrence: 1 },
    repeatCount: 1,
    stage: "evidence",
    tags: ["Chốt chặn"],
  },
  {
    id: "iss-18",
    title: "Tỷ lệ vốn ngắn hạn cho vay trung dài hạn tiệm cận ngưỡng",
    description:
      "Giám sát tuân thủ: tỷ lệ đạt 33,5% so với ngưỡng 34%; cần kế hoạch giảm trước khi Thông tư 50/2026 hạ ngưỡng xuống 30%.",
    category: "Prudential ratios reporting",
    source: "compliance_monitoring",
    unitId: "dept-treasury",
    ownerName: "Vũ Thị Lan",
    createdDaysAgo: 12,
    dueInDays: 45,
    status: "Open",
    scores: { fine: 4, reputation: 3, scope: 4, recurrence: 1 },
    override: {
      level: "medium",
      reason:
        "Ratio still within the current limit; risk is forward-looking until 50/2026 takes effect.",
    },
    repeatCount: 1,
    stage: "check",
    regulationRef: "Thông tư 50/2026/TT-NHNN – Điều 22",
    tags: ["Thanh khoản"],
  },
  {
    id: "iss-19",
    title: "Thanh tra NHNN: báo cáo giao dịch giá trị lớn không đầy đủ",
    description:
      "Kết luận thanh tra: 1,2% giao dịch tiền mặt giá trị lớn chưa được báo cáo.",
    category: "AML / suspicious transaction reporting",
    source: "sbv_inspection",
    sourceRef: "KL 145/KL-TTGSNH",
    unitId: "dept-aml",
    ownerName: "Trần Ngọc Mai",
    createdDaysAgo: 90,
    dueInDays: -45,
    status: "Closed",
    scores: { fine: 3, reputation: 3, scope: 4, recurrence: 1 },
    repeatCount: 1,
    stage: "closed",
    rounds: [
      {
        submittedDaysAgo: 50,
        decision: "accepted",
        comment: "Đầy đủ.",
        files: ["Bao_cao_bo_sung_GDGTL.xlsx", "Cau_hinh_bao_cao_tu_dong.pdf"],
        note: "Đã báo cáo bổ sung và tự động hóa.",
      },
    ],
    regulationRef: "QĐ 0306/2024/QĐ-HĐQT",
    tags: ["Thanh tra NHNN", "AML"],
    resolution: "Missing reports filed; automated reporting rule deployed.",
  },
  {
    id: "iss-20",
    title: "Mở tài khoản trực tuyến không đối chiếu sinh trắc học",
    description:
      "Ứng dụng cho phép mở tài khoản khi dịch vụ đối chiếu C06 gián đoạn, không chặn giao dịch.",
    category: "KYC / customer identification",
    source: "compliance_monitoring",
    unitId: "dept-it",
    ownerName: "Phan Đức Long",
    createdDaysAgo: 7,
    dueInDays: 7,
    status: "Open",
    scores: { fine: 3, reputation: 4, scope: 5, recurrence: 1 },
    repeatCount: 1,
    stage: "check",
    regulationRef: "Thông tư 17/2026/TT-NHNN – Điều 1.2",
    tags: ["Sinh trắc học", "Ngân hàng số"],
  },
  {
    id: "iss-21",
    title: "Tự kiểm tra: hồ sơ thẻ tín dụng thiếu xác nhận thu nhập",
    description:
      "8 hồ sơ phát hành thẻ tín dụng thiếu chứng từ xác nhận thu nhập.",
    category: "Credit granting procedure",
    source: "self_check",
    unitId: "branch-vungtau",
    ownerName: "Đặng Văn Khoa",
    createdDaysAgo: 18,
    dueInDays: 10,
    status: "Open",
    scores: { fine: 1, reputation: 1, scope: 2, recurrence: 1 },
    repeatCount: 1,
    stage: "evidence",
    tags: ["Thẻ"],
  },
  {
    id: "iss-22",
    title: "Kiểm toán nội bộ: hồ sơ KYC khách hàng doanh nghiệp chưa cập nhật",
    description:
      "Thông tin chủ sở hữu hưởng lợi của khách hàng doanh nghiệp chưa được cập nhật định kỳ.",
    category: "KYC / customer identification",
    source: "internal_audit",
    sourceRef: "BC KTNB 15/2026",
    unitId: "dept-corporate",
    ownerName: "Hà Minh Quân",
    createdDaysAgo: 100,
    dueInDays: -50,
    status: "Closed",
    scores: { fine: 2, reputation: 2, scope: 3, recurrence: 2 },
    repeatCount: 2,
    stage: "closed",
    rounds: [
      {
        submittedDaysAgo: 60,
        decision: "returned",
        comment: "Chưa đủ 100% khách hàng.",
        files: ["Cap_nhat_UBO_dot1.xlsx"],
        note: "Cập nhật 70%.",
      },
      {
        submittedDaysAgo: 52,
        decision: "accepted",
        comment: "Đủ.",
        files: ["Cap_nhat_UBO_dot2.xlsx"],
        note: "Cập nhật 100%.",
      },
    ],
    regulationRef: "QĐ 0950/2024/QĐ-TGĐ",
    tags: ["KYC", "UBO"],
    resolution: "UBO data updated for all corporate customers.",
  },
  {
    id: "iss-23",
    title: "Chậm cập nhật hạn mức giao dịch theo quy định mới",
    description:
      "Hạn mức giao dịch trực tuyến chưa điều chỉnh theo Quyết định 2345/QĐ-NHNN trong 5 ngày đầu hiệu lực.",
    category: "Payment & accounts",
    source: "compliance_monitoring",
    unitId: "dept-operations",
    ownerName: "Trịnh Văn Nam",
    createdDaysAgo: 200,
    dueInDays: -170,
    status: "Closed",
    scores: { fine: 2, reputation: 3, scope: 4, recurrence: 1 },
    repeatCount: 1,
    stage: "closed",
    rounds: [
      {
        submittedDaysAgo: 175,
        decision: "accepted",
        comment: "OK.",
        files: ["Cau_hinh_han_muc.pdf"],
        note: "Đã cấu hình.",
      },
    ],
    tags: ["Thanh toán"],
    resolution: "Limits configured; change-management checklist updated.",
  },
  {
    id: "iss-24",
    title: "Giải ngân trước phê duyệt – CN Cần Thơ (lặp lại)",
    description:
      "Giám sát tuân thủ ghi nhận giải ngân trước khi có phê duyệt cấp thẩm quyền.",
    category: "Credit granting procedure",
    source: "compliance_monitoring",
    unitId: "branch-cantho",
    ownerName: "Ngô Thanh Trang",
    createdDaysAgo: 140,
    dueInDays: -100,
    status: "Closed",
    scores: { fine: 2, reputation: 2, scope: 2, recurrence: 2 },
    repeatCount: 2,
    stage: "closed",
    rounds: [
      {
        submittedDaysAgo: 105,
        decision: "accepted",
        comment: "OK.",
        files: ["Bien_ban_xu_ly_trach_nhiem.pdf"],
        note: "Xử lý trách nhiệm cán bộ.",
      },
    ],
    tags: ["Tín dụng"],
    resolution: "Staff disciplined; workflow lock added.",
  },
];

export function generateIssues(
  org: OrganizationSettings,
  users: UserProfile[],
  matrix: RiskMatrix,
  rules: EscalationRule[],
): NonComplianceCase[] {
  const resolveUnit = (id: string) => {
    const b = org.branches.find((x) => x.id === id);
    if (b)
      return {
        ownerUnitName: b.name,
        ownerUnitType: "branch" as const,
        ownerUnitRegion: b.region,
      };
    const h = org.hoDepartments.find((x) => x.id === id)!;
    return {
      ownerUnitName: h.name,
      ownerUnitType: "ho_department" as const,
      ownerUnitRegion: undefined,
    };
  };
  const year = base.getFullYear();
  return ISSUE_SPECS.map((s, i) => {
    const createdAt = d(-s.createdDaysAgo);
    const ratedAt = d(-s.createdDaysAgo, 11);
    const risk = assessRisk(
      s.scores,
      matrix,
      "Lê Thị Hoa",
      ratedAt,
      s.override,
    );
    const owner = users.find((u) => u.name === s.ownerName);
    const dueDate = d(s.dueInDays, 17);

    const escalations: EscalationRecord[] = [];
    const levelRule = rules.find(
      (r) => r.trigger === "risk_level" && r.riskLevel === risk.finalLevel,
    );
    if (levelRule && levelRule.level >= 2) {
      escalations.push({
        id: `${s.id}-esc-risk`,
        level: levelRule.level,
        to: levelRule.escalateTo,
        reason: "high_risk",
        detail: `Rated ${risk.finalLevel.toUpperCase()} (score ${risk.weightedScore})`,
        at: d(-s.createdDaysAgo, 12),
        ...(s.status === "Closed" || i % 3 !== 0
          ? {
              acknowledgedBy:
                levelRule.level === 3 ? "Nguyễn Văn Hùng" : "Lê Thị Hoa",
              acknowledgedAt: d(-s.createdDaysAgo + 1, 9),
            }
          : {}),
      });
    }
    if (s.status === "Open" && s.dueInDays < 0) {
      for (const r of rules
        .filter((r) => r.trigger === "overdue" && r.appliesTo.includes("issue"))
        .sort((a, b) => (a.overdueDays ?? 0) - (b.overdueDays ?? 0))) {
        if (-s.dueInDays >= (r.overdueDays ?? 0)) {
          escalations.push({
            id: `${s.id}-esc-od${r.overdueDays}`,
            level: r.level,
            to: r.escalateTo,
            reason: "overdue",
            detail: `${r.overdueDays} day(s) past the due date`,
            at: d(s.dueInDays + (r.overdueDays ?? 0), 8),
            // Older escalations have already been acknowledged.
            ...(-s.dueInDays - (r.overdueDays ?? 0) > 4
              ? {
                  acknowledgedBy:
                    r.level === 3 ? "Nguyễn Văn Hùng" : "Lê Thị Hoa",
                  acknowledgedAt: d(s.dueInDays + (r.overdueDays ?? 0) + 1, 10),
                }
              : {}),
          });
        }
      }
    }

    const reminders: ReminderRecord[] = [7, 1]
      .filter((off) => s.dueInDays - off <= 0 && s.createdDaysAgo > off)
      .map((off) => ({
        id: `${s.id}-rem-${off}`,
        at: d(s.dueInDays - off, 8),
        kind: `T-${off}`,
        to: `${resolveUnit(s.unitId).ownerUnitName}; ${s.ownerName}`,
        channels: ["in_app", "email"],
      }));
    if (s.status === "Open" && s.dueInDays < 0) {
      reminders.push({
        id: `${s.id}-rem-od`,
        at: d(s.dueInDays + 1, 8),
        kind: "Overdue +1",
        to: `${resolveUnit(s.unitId).ownerUnitName}; ${s.ownerName}`,
        channels: ["in_app", "email"],
      });
    }

    const rounds = (s.rounds ?? []).map((r, idx) => ({
      id: `${s.id}-round-${idx + 1}`,
      round: idx + 1,
      submittedBy: s.ownerName,
      submittedAt: d(-r.submittedDaysAgo, 15),
      fileNames: r.files,
      note: r.note,
      decision: r.decision,
      reviewer: r.decision ? "Lê Thị Hoa" : undefined,
      reviewedAt: r.decision ? d(-r.submittedDaysAgo + 1, 10) : undefined,
      reviewComment: r.comment,
    }));
    const workflow: IssueWorkflow = {
      stage: s.stage,
      checkNote:
        s.stage === "check"
          ? undefined
          : "Đã xác minh phát hiện với đơn vị và thống nhất nguyên nhân.",
      checkedBy: s.stage === "check" ? undefined : "Lê Thị Hoa",
      checkedAt: s.stage === "check" ? undefined : d(-s.createdDaysAgo + 2, 10),
      rounds,
      approvedBy: s.status === "Closed" ? "Phạm Minh Dũng" : undefined,
      approvedAt:
        s.status === "Closed"
          ? d(-(s.rounds?.[s.rounds.length - 1]?.submittedDaysAgo ?? 1) + 2, 16)
          : undefined,
    };

    return {
      id: s.id,
      nccId: `NCC-${year}-${String(i + 1).padStart(3, "0")}`,
      title: s.title,
      description: s.description,
      severity: risk.finalLevel,
      ownerUnitId: s.unitId,
      ...resolveUnit(s.unitId),
      ownerId: owner?.id ?? "demo-owner",
      ownerName: s.ownerName,
      dueDate,
      status: s.status,
      resolution: s.resolution,
      fileIds: [],
      linkedDocs: s.sourceRef,
      closedAt: s.status === "Closed" ? workflow.approvedAt : undefined,
      tags: s.tags,
      source: s.source,
      sourceRef: s.sourceRef,
      category: s.category,
      regulationRef: s.regulationRef,
      icisFindingId: s.icisFindingId,
      repeatCount: s.repeatCount,
      risk,
      escalations,
      reminders,
      workflow,
      createdAt,
      updatedAt: rounds.length
        ? rounds[rounds.length - 1].submittedAt
        : createdAt,
    };
  });
}

// ---------------------------------------------------------------------------
// Periodic reports
// ---------------------------------------------------------------------------

export function generateReportTemplates(): ReportTemplate[] {
  return [
    {
      id: "rpt-monthly-bdh",
      code: "BC-TT-01",
      name: "Báo cáo tình hình tuân thủ hằng tháng",
      recipient: "BĐH",
      frequency: "monthly",
      legalBasis: "QĐ 0732/2024/QĐ-TGĐ – Điều 14",
      description:
        "Monthly compliance status for the Executive Board: new laws, QĐNB progress, open issues and escalations.",
      sections: [
        "Tóm tắt điều hành",
        "Văn bản pháp luật mới",
        "Tiến độ cập nhật QĐNB",
        "Vấn đề tuân thủ & mức độ rủi ro",
        "Các trường hợp leo thang",
        "Đề xuất, kiến nghị",
      ],
    },
    {
      id: "rpt-quarterly-hdqt",
      code: "BC-TT-02",
      name: "Báo cáo tuân thủ quý gửi Hội đồng Quản trị",
      recipient: "HĐQT",
      frequency: "quarterly",
      legalBasis: "Thông tư 83/2025/TT-NHNN – Điều 21",
      description: "Quarterly compliance report to the Board of Directors.",
      sections: [
        "Tóm tắt điều hành",
        "Đánh giá rủi ro tuân thủ",
        "Kết quả khắc phục",
        "Xu hướng vi phạm",
        "Tiến độ cập nhật QĐNB",
        "Đề xuất, kiến nghị",
      ],
    },
    {
      id: "rpt-quarterly-bks",
      code: "BC-TT-03",
      name: "Báo cáo kết quả giám sát tuân thủ gửi Ban Kiểm soát",
      recipient: "BKS",
      frequency: "quarterly",
      legalBasis: "Thông tư 83/2025/TT-NHNN",
      description:
        "Quarterly report to the Supervisory Board on compliance monitoring and escalations.",
      sections: [
        "Tóm tắt",
        "Các trường hợp leo thang",
        "Vấn đề rủi ro cao",
        "Kết quả khắc phục từ ICIS",
      ],
    },
    {
      id: "rpt-yearly-nhnn",
      code: "BC-NHNN-01",
      name: "Báo cáo hệ thống kiểm soát nội bộ năm gửi NHNN",
      recipient: "NHNN",
      frequency: "yearly",
      legalBasis: "Thông tư 83/2025/TT-NHNN – Điều 45",
      description:
        "Annual internal-control report to the State Bank, compliance section.",
      sections: [
        "Thông tin chung",
        "Đánh giá chức năng tuân thủ",
        "Vi phạm và khắc phục",
        "Cập nhật quy định nội bộ",
        "Kế hoạch năm tới",
      ],
    },
    {
      id: "rpt-adhoc-nhnn",
      code: "BC-NHNN-02",
      name: "Báo cáo đột xuất về vi phạm nghiêm trọng",
      recipient: "NHNN",
      frequency: "ad_hoc",
      legalBasis: "Thông tư 83/2025/TT-NHNN",
      description:
        "Ad-hoc report on a serious violation, prepared from High-risk issues.",
      sections: [
        "Mô tả sự việc",
        "Đánh giá mức độ",
        "Biện pháp đã thực hiện",
        "Kiến nghị",
      ],
    },
    {
      id: "rpt-monthly-legal",
      code: "BC-TT-04",
      name: "Báo cáo cập nhật văn bản pháp luật & QĐNB",
      recipient: "BĐH",
      frequency: "monthly",
      legalBasis: "QĐ 0732/2024/QĐ-TGĐ – Điều 9",
      description:
        "Monthly update of new legal documents and the status of internal regulation revisions.",
      sections: [
        "Văn bản mới tiếp nhận",
        "Kết quả rà soát áp dụng",
        "Mapping QĐNB",
        "Tiến độ & cảnh báo chậm ban hành",
      ],
    },
  ];
}

export function generateScheduledReports(): ScheduledReport[] {
  const m = base.getMonth() + 1;
  const y = base.getFullYear();
  const prevMonth = m === 1 ? 12 : m - 1;
  const q = Math.ceil(m / 3);
  const prevQ = q === 1 ? 4 : q - 1;
  return [
    {
      id: "sch-1",
      templateId: "rpt-monthly-bdh",
      period: `Tháng ${prevMonth}/${y}`,
      dueDate: d(-20),
      status: "submitted",
      submittedAt: d(-21, 16),
      submittedBy: "Lê Thị Hoa",
    },
    {
      id: "sch-2",
      templateId: "rpt-monthly-legal",
      period: `Tháng ${prevMonth}/${y}`,
      dueDate: d(-18),
      status: "submitted",
      submittedAt: d(-19, 10),
      submittedBy: "Lê Thị Hoa",
    },
    {
      id: "sch-3",
      templateId: "rpt-quarterly-hdqt",
      period: `Quý ${prevQ}/${y}`,
      dueDate: d(8),
      status: "draft",
    },
    {
      id: "sch-4",
      templateId: "rpt-quarterly-bks",
      period: `Quý ${prevQ}/${y}`,
      dueDate: d(13),
      status: "upcoming",
    },
    {
      id: "sch-5",
      templateId: "rpt-monthly-bdh",
      period: `Tháng ${m}/${y}`,
      dueDate: d(29),
      status: "upcoming",
    },
    {
      id: "sch-6",
      templateId: "rpt-monthly-legal",
      period: `Tháng ${m}/${y}`,
      dueDate: d(31),
      status: "upcoming",
    },
    {
      id: "sch-7",
      templateId: "rpt-yearly-nhnn",
      period: `Năm ${y}`,
      dueDate: iso(new Date(y + 1, 0, 31)),
      status: "upcoming",
    },
  ];
}
