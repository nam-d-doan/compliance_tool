import {
  AlarmClock,
  BarChart3,
  BookOpen,
  Calendar,
  ClipboardCheck,
  ClipboardList,
  FileStack,
  GitCompare,
  Gauge,
  Inbox,
  Network,
  Radar,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import type { SubNavItem } from "@/components/layout/SubNav";

/**
 * Sub-menus for the grouped top-menu tabs. Each list follows the RFQ
 * Phụ lục 1 feature group it belongs to; tooltips carry the RFQ wording.
 */

/** Legal Updates tab — RFQ group 1 (1.1–1.3). */
export const LEGAL_SUBNAV: SubNavItem[] = [
  {
    label: "Inbox & Alerts",
    icon: Inbox,
    path: ROUTES.LEGAL.LIST,
    title: "1.1 — Tiếp nhận, phân loại và cảnh báo văn bản mới",
  },
  {
    label: "Legal Mapping",
    icon: Network,
    path: ROUTES.LEGAL.MAPPING,
    highlight: true,
    title: "1.2 — Bản đồ mối quan hệ: văn bản pháp luật ↔ quy định nội bộ",
  },
  {
    label: "Assignments",
    icon: ClipboardCheck,
    path: ROUTES.ASSIGNMENTS.LIST,
    title: "1.3 — Giao việc đơn vị chủ trì/phối hợp, nhắc hạn",
  },
];

/** Regulations tab — the regulation library and the obligations it creates. */
export const REGULATION_SUBNAV: SubNavItem[] = [
  {
    label: "Library",
    icon: BookOpen,
    path: ROUTES.REGULATION.LIBRARY,
    end: true,
  },
  { label: "Obligations", icon: ShieldCheck, path: ROUTES.OBLIGATIONS.LIST },
  {
    label: "Compare",
    icon: GitCompare,
    path: ROUTES.REGULATION.COMPARISON,
    title: "5.1 — So sánh phiên bản (diff check)",
  },
];

/** Internal Regs (QĐNB) tab — RFQ group 2 (2.1–2.3). */
export const QDNB_SUBNAV: SubNavItem[] = [
  {
    label: "Real-time Tracker",
    icon: Gauge,
    path: ROUTES.QDNB.LIST,
    title: "2.1–2.2 — Dashboard thời gian thực, luồng phê duyệt & trạng thái",
  },
  {
    label: "Late-issuance Alerts",
    icon: AlarmClock,
    path: ROUTES.REPORTS.LATE_ISSUANCE,
    title: "2.3 — Cảnh báo rủi ro chậm ban hành",
  },
];

/** Issues & CAPs tab — RFQ group 3 and the escalations of group 4. */
export const ISSUES_SUBNAV: SubNavItem[] = [
  {
    label: "Issues (NCC)",
    icon: ShieldAlert,
    path: ROUTES.NCC.LIST,
    title: "3.1–3.2 — Kho vấn đề tuân thủ, ICIS Inbox, xu hướng vi phạm",
  },
  {
    label: "CAPs",
    icon: ClipboardList,
    path: ROUTES.CAP.DASHBOARD,
    title: "3.3 — Kế hoạch hành động khắc phục, minh chứng, nhắc hạn",
  },
  {
    label: "Escalations",
    icon: Siren,
    path: ROUTES.NCC.ESCALATIONS,
    title: "4.3 — Leo thang theo cấp độ rủi ro",
  },
];

/** Reports tab — RFQ group 5 (5.3–5.4) plus the original reports. */
export const REPORTS_SUBNAV: SubNavItem[] = [
  {
    label: "Executive Summary",
    icon: Sparkles,
    path: ROUTES.REPORTS.EXECUTIVE,
  },
  {
    label: "Periodic Reports",
    icon: FileStack,
    path: ROUTES.REPORTS.PERIODIC,
    title: "5.3 — Báo cáo định kỳ/đột xuất cho BĐH, HĐQT, NHNN",
  },
  {
    label: "Internal Control Issues",
    icon: ShieldCheck,
    path: ROUTES.REPORTS.INTERNAL_CONTROL,
    title: "5.3 — Dashboard vấn đề tuân thủ từ P.KTKSNB",
  },
  { label: "Early Warning", icon: Radar, path: ROUTES.REPORTS.EWS },
  { label: "Status", icon: BarChart3, path: ROUTES.REPORTS.STATUS },
  { label: "CAP", icon: ClipboardList, path: ROUTES.REPORTS.CAP },
  { label: "Calendar", icon: Calendar, path: ROUTES.REPORTS.CALENDAR },
  {
    label: "Audit Trail",
    icon: ScrollText,
    path: ROUTES.REPORTS.AUDIT_TRAIL,
    title: "5.4 — Ghi vết và lưu nhật ký vĩnh viễn",
  },
];
