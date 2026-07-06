import type { ComponentType } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  FileEdit,
  Globe,
  HelpCircle,
  Hourglass,
  Mail,
  Minus,
  MinusCircle,
  PlayCircle,
  RefreshCw,
  ShieldAlert,
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

const slate = {
  default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  outline:
    "border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300",
  dot: "text-slate-600 dark:text-slate-400",
};

const zinc = {
  default: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  outline:
    "border-zinc-300 text-zinc-700 dark:border-zinc-600 dark:text-zinc-300",
  dot: "text-zinc-600 dark:text-zinc-400",
};

const blue = {
  default: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  outline:
    "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400",
  dot: "text-blue-600 dark:text-blue-400",
};

const violet = {
  default:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  outline:
    "border-violet-300 text-violet-700 dark:border-violet-700 dark:text-violet-400",
  dot: "text-violet-600 dark:text-violet-400",
};

const purple = {
  default:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  outline:
    "border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-400",
  dot: "text-purple-600 dark:text-purple-400",
};

const emerald = {
  default:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  outline:
    "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400",
  dot: "text-emerald-600 dark:text-emerald-400",
};

const teal = {
  default: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  outline:
    "border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-400",
  dot: "text-teal-600 dark:text-teal-400",
};

const amber = {
  default:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  outline:
    "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400",
  dot: "text-amber-600 dark:text-amber-400",
};

const orange = {
  default:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  outline:
    "border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-400",
  dot: "text-orange-600 dark:text-orange-400",
};

const red = {
  default: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  outline: "border-red-300 text-red-700 dark:border-red-700 dark:text-red-400",
  dot: "text-red-600 dark:text-red-400",
};

const rose = {
  default: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  outline:
    "border-rose-300 text-rose-700 dark:border-rose-700 dark:text-rose-400",
  dot: "text-rose-600 dark:text-rose-400",
};

const neutral = {
  default:
    "bg-muted text-muted-foreground dark:bg-muted/60 dark:text-muted-foreground",
  outline:
    "border-border text-muted-foreground dark:border-border/60 dark:text-muted-foreground",
  dot: "text-muted-foreground dark:text-muted-foreground",
};

export const STATUS_STYLES: Record<string, StatusStyle> = {
  // Compliance lifecycle
  draft: { label: "Draft", icon: FileEdit, ...slate },
  "pending review": { label: "Pending Review", icon: Eye, ...blue },
  approved: { label: "Approved", icon: CheckCircle, ...emerald },
  rejected: { label: "Rejected", icon: XCircle, ...red },
  overdue: { label: "Overdue", icon: AlertCircle, ...red },
  due: { label: "Due", icon: Clock, ...amber },
  completed: { label: "Completed", icon: CheckCircle2, ...emerald },
  assigned: { label: "Assigned", icon: UserCheck, ...purple },
  submitted: { label: "Submitted", icon: UploadCloud, ...blue },
  returned: { label: "Returned", icon: RefreshCw, ...orange },
  archived: { label: "Archived", icon: Archive, ...slate },

  // Compliance submission outcomes
  complied: { label: "Complied", icon: CheckCircle, ...emerald },
  "complied with exception": {
    label: "Complied with Exception",
    icon: AlertTriangle,
    ...amber,
  },
  "not complied": { label: "Not Complied", icon: XCircle, ...red },
  "not applicable": { label: "Not Applicable", icon: MinusCircle, ...slate },
  "pending information": {
    label: "Pending Information",
    icon: HelpCircle,
    ...blue,
  },

  // CAP
  open: { label: "Open", icon: Circle, ...blue },
  "in progress": { label: "In Progress", icon: PlayCircle, ...amber },
  "pending approval": {
    label: "Pending Approval",
    icon: Hourglass,
    ...violet,
  },
  closed: { label: "Closed", icon: CheckCircle2, ...emerald },

  // Regulation / content
  published: { label: "Published", icon: Globe, ...emerald },
  updated: { label: "Updated", icon: RefreshCw, ...blue },

  // User / admin
  inactive: { label: "Inactive", icon: UserX, ...slate },
  invited: { label: "Invited", icon: Mail, ...blue },
  deactivated: { label: "Deactivated", icon: UserMinus, ...zinc },

  // Generic
  pending: { label: "Pending", icon: Clock, ...amber },
  success: { label: "Success", icon: CheckCircle, ...emerald },
  failure: { label: "Failure", icon: XCircle, ...red },
};

export const PRIORITY_STYLES: Record<PriorityLevel, StatusStyle> = {
  low: { label: "Low", icon: ArrowDown, ...slate },
  medium: { label: "Medium", icon: Minus, ...blue },
  high: { label: "High", icon: ArrowUp, ...amber },
  critical: { label: "Critical", icon: ShieldAlert, ...red },
};

export function getStatusStyle(status: string): StatusStyle {
  const key = status.trim().toLowerCase();
  return (
    STATUS_STYLES[key] ?? {
      ...neutral,
      label: status.trim() || "Unknown",
      icon: Circle,
    }
  );
}

export function getPriorityStyle(priority: PriorityLevel): StatusStyle {
  return PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.medium;
}

export const COMPLIANCE_STATUSES = [
  "Draft",
  "Pending Review",
  "Approved",
  "Rejected",
  "Overdue",
  "Due",
  "Completed",
  "Assigned",
  "Submitted",
  "Returned",
  "Archived",
] as const;

export const COMPLIANCE_SUBMISSION_STATUSES = [
  "Complied",
  "Complied with Exception",
  "Not Complied",
  "Not Applicable",
  "Pending Information",
] as const;

export const CAP_STATUSES = [
  "Draft",
  "Open",
  "In Progress",
  "Pending Approval",
  "Closed",
  "Rejected",
  "Overdue",
] as const;

export const REGULATION_STATUSES = [
  "Published",
  "Updated",
  "Archived",
] as const;

export const USER_STATUSES = [
  "Active",
  "Inactive",
  "Invited",
  "Deactivated",
] as const;

export const PRIORITY_LEVELS = ["low", "medium", "high", "critical"] as const;

export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];
export type ComplianceSubmissionStatus =
  (typeof COMPLIANCE_SUBMISSION_STATUSES)[number];
export type CAPStatus = (typeof CAP_STATUSES)[number];
export type RegulationStatus = (typeof REGULATION_STATUSES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];
