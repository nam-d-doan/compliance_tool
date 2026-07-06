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

export interface Template extends BaseEntity {
  title: string;
  description: string;
  category: string;
  frequency: string;
  ownerId: string;
  ownerName: string;
  approverId: string;
  approverName: string;
  criticality: string;
  applicableRegulationIds: string[];
  status: "draft" | "published" | "archived";
  tags: string[];
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

export interface PenaltyThreshold {
  label: string;
  value: number;
}

export interface OrganizationSettings extends BaseEntity {
  name: string;
  industry: string;
  jurisdictions: string[];
  businessUnits: string[];
  departments: string[];
  locations: string[];
  defaultFrequency: string;
  criticalityLevels: string[];
  penaltyThresholds: PenaltyThreshold[];
}
