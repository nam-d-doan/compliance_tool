import type { ComponentType } from "react";
import {
  AlertCircle,
  Archive,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  FileEdit,
  Hourglass,
  Mail,
  Minus,
  PlayCircle,
  RefreshCw,
  Send,
  ShieldAlert,
  ThumbsUp,
  UploadCloud,
  UserCheck,
  UserMinus,
  UserX,
  XCircle,
} from "lucide-react";

export type IconType = ComponentType<{ className?: string }>;
export type StatusVariant = "default" | "outline" | "dot";
export type StatusSize = "sm" | "md";
export interface StatusStyle {
  label: string;
  icon: IconType;
  default: string;
  outline: string;
  dot: string;
}

// Five-category semantic system (success/warning/danger/info/neutral) —
// matches the badge() categorization in the ComplianceAI design prototype.
const success = {
  default: "bg-success-bg text-success",
  outline: "border-success/40 text-success",
  dot: "text-success",
};

const warning = {
  default: "bg-warning-bg text-warning",
  outline: "border-warning/40 text-warning",
  dot: "text-warning",
};

const danger = {
  default: "bg-danger-bg text-danger",
  outline: "border-danger/40 text-danger",
  dot: "text-danger",
};

const info = {
  default: "bg-info-bg text-info",
  outline: "border-info/40 text-info",
  dot: "text-info",
};

const neutral = {
  default: "bg-neutral-bg text-neutral",
  outline: "border-neutral/40 text-neutral",
  dot: "text-neutral",
};

export const STATUS_STYLES: Record<string, StatusStyle> = {
  // Compliance lifecycle
  draft: { label: "Draft", icon: FileEdit, ...neutral },
  "pending review": { label: "Pending Review", icon: Eye, ...info },
  approved: { label: "Approved", icon: CheckCircle, ...success },
  rejected: { label: "Rejected", icon: XCircle, ...danger },
  overdue: { label: "Overdue", icon: AlertCircle, ...danger },
  due: { label: "Due", icon: Clock, ...warning },
  completed: { label: "Completed", icon: CheckCircle2, ...success },
  assigned: { label: "Assigned", icon: UserCheck, ...info },
  submitted: { label: "Submitted", icon: UploadCloud, ...info },
  returned: { label: "Returned", icon: RefreshCw, ...warning },
  archived: { label: "Archived", icon: Archive, ...neutral },

  // Obligation lifecycle
  review_required: {
    label: "Review Required",
    icon: AlertCircle,
    ...warning,
  },
  cap_in_progress: {
    label: "CAP In Progress",
    icon: PlayCircle,
    ...warning,
  },

  // CAP
  open: { label: "Open", icon: Circle, ...info },
  "in progress": { label: "In Progress", icon: PlayCircle, ...warning },
  "pending approval": {
    label: "Pending Approval",
    icon: Hourglass,
    ...warning,
  },
  closed: { label: "Closed", icon: CheckCircle2, ...success },

  // Assignment lifecycle
  published: { label: "Published", icon: Send, ...info },
  acknowledged: { label: "Acknowledged", icon: ThumbsUp, ...info },
  cancelled: { label: "Cancelled", icon: XCircle, ...danger },

  // Regulation / content
  effective: { label: "Effective", icon: CheckCircle, ...success },
  expired: { label: "Expired", icon: Archive, ...neutral },
  superseded: { label: "Superseded", icon: RefreshCw, ...warning },

  // User / admin
  inactive: { label: "Inactive", icon: UserX, ...neutral },
  invited: { label: "Invited", icon: Mail, ...info },
  deactivated: { label: "Deactivated", icon: UserMinus, ...neutral },

  // Generic
  pending: { label: "Pending", icon: Clock, ...warning },
  success: { label: "Success", icon: CheckCircle, ...success },
  failure: { label: "Failure", icon: XCircle, ...danger },
};

export const PRIORITY_STYLES: Record<PriorityLevel, StatusStyle> = {
  low: { label: "Low", icon: ArrowDown, ...neutral },
  medium: { label: "Medium", icon: Minus, ...info },
  high: { label: "High", icon: ArrowUp, ...warning },
  critical: { label: "Critical", icon: ShieldAlert, ...danger },
};

/**
 * NCC "Open" carries a different meaning than CAP "Open": an open
 * non-compliance case is an active issue requiring resolution (amber =
 * attention), whereas a CAP "Open" is a freshly-started action plan (blue =
 * active). These overrides apply only when StatusBadge is given kind="ncc".
 */
const NCC_STATUS_STYLES: Record<string, StatusStyle> = {
  open: { label: "Open", icon: AlertCircle, ...warning },
  closed: { label: "Closed", icon: CheckCircle2, ...success },
};

export function getStatusStyle(status: string, kind?: "ncc"): StatusStyle {
  const key = status.trim().toLowerCase();
  const fallback: StatusStyle = {
    ...neutral,
    label: status.trim() || "Unknown",
    icon: Circle,
  };
  if (kind === "ncc") {
    return NCC_STATUS_STYLES[key] ?? STATUS_STYLES[key] ?? fallback;
  }
  return STATUS_STYLES[key] ?? fallback;
}

export function getPriorityStyle(priority: PriorityLevel): StatusStyle {
  return PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.medium;
}

export const OBLIGATION_STATUSES = [
  "draft",
  "submitted",
  "review_required",
  "approved",
  "rejected",
  "returned",
  "cap_in_progress",
  "completed",
  "archived",
] as const;

export const CAP_STATUSES = ["Open", "Pending Approval", "Closed"] as const;

export const REGULATION_STATUSES = [
  "Effective",
  "Expired",
  "Superseded",
] as const;

export const USER_STATUSES = [
  "Active",
  "Inactive",
  "Invited",
  "Deactivated",
] as const;

export const PRIORITY_LEVELS = ["low", "medium", "high", "critical"] as const;

export const ASSIGNMENT_STATUSES = [
  "draft",
  "published",
  "acknowledged",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export const NCC_STATUSES = ["Open", "Closed"] as const;

export type ObligationStatus = (typeof OBLIGATION_STATUSES)[number];
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];
export type CAPStatus = (typeof CAP_STATUSES)[number];
export type NCCStatus = (typeof NCC_STATUSES)[number];
export type RegulationStatus = (typeof REGULATION_STATUSES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];
