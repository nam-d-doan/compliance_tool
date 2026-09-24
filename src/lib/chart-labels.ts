import {
  getStatusStyle,
  getPriorityStyle,
  type PriorityLevel,
} from "@/constants/status";

/**
 * Canonical display label for a raw status string. Charts aggregate on the
 * stored enum value (e.g. "in_progress", "cap_in_progress", "pending_approval"),
 * which would otherwise render the raw var name on the axis/slice. This maps
 * it back to the human label that the data-table badges already show
 * ("In Progress", "CAP In Progress", "Pending Approval", …).
 */
export function statusLabel(raw: string): string {
  return getStatusStyle(raw).label;
}

/**
 * Canonical display label for a raw priority / risk-level / severity string
 * (e.g. "low" → "Low", "critical" → "Critical"). Severity reuses the
 * PriorityLevel scale, so one helper covers riskLevel, priority, and severity.
 */
export function priorityLabel(raw: string): string {
  return getPriorityStyle(raw as PriorityLevel).label;
}

/** Capitalize the first letter — used for lowercase role values in charts ("admin" → "Admin"). */
export function capitalizeLabel(raw: string): string {
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}
