import type { BaseEntity, Role } from "./base";
import type { UserStatus } from "@/constants/status";

export type Permission =
  | "view"
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "export"
  | "manage_users"
  | "manage_ai"
  | "system_config";

export interface UserProfile extends BaseEntity {
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  isActive: boolean;
  department?: string;
  businessUnit?: string;
  location?: string;
  phone?: string;
  lastLogin?: string;
  avatarUrl?: string;
}

export interface RoleEntity extends BaseEntity {
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
  userCount: number;
}

export interface Organization extends BaseEntity {
  name: string;
  type:
    | "department"
    | "business_unit"
    | "location"
    | "legal_entity"
    | "region"
    | "country";
  parentId?: string;
  children?: Organization[];
  headId?: string;
  headName?: string;
}

export interface AuditLog extends BaseEntity {
  timestamp: string;
  userId: string;
  userName: string;
  action:
    | "login"
    | "logout"
    | "create"
    | "update"
    | "delete"
    | "approve"
    | "ai_usage"
    | "export"
    | "settings_change";
  object: string;
  module: string;
  ip: string;
  result: "success" | "failure";
  details?: string;
}

export interface AIConfig extends BaseEntity {
  preferredModel: string;
  confidenceThreshold: number;
  citationDisplay: boolean;
  suggestionLevel: "low" | "medium" | "high";
  autoRecommendation: boolean;
  explainableAI: boolean;
  conversationRetentionDays: number;
}

/**
 * A Head Office department. Belongs to no region — HO departments can be
 * compared peer-to-peer with branches but are not grouped by region.
 */
export interface HoDepartment {
  id: string;
  name: string;
}

/**
 * A branch office. Always belongs to a region (used for EWS geo grouping).
 * Branches are compared peer-to-peer with HO departments and other branches.
 */
export interface Branch {
  id: string;
  name: string;
  /** Geographic region the branch belongs to (e.g. "Miền Bắc", "Miền Trung"). */
  region: string;
}

export interface OrganizationSettings extends BaseEntity {
  name: string;
  industry: string;
  jurisdictions: string[];
  /** Head Office departments (no region). */
  hoDepartments: HoDepartment[];
  /** Branch offices, each with a region. */
  branches: Branch[];
}
