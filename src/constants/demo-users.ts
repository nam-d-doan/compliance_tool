import type { Role, UserProfile } from "@/types";

export const DEMO_PASSWORD = "demo1234";

export const DEMO_USERS: UserProfile[] = [
  {
    id: "demo-admin",
    email: "admin@demo.com",
    name: "Alexandra Chen",
    role: "admin" as Role,
    status: "Active",
    isActive: true,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z",
  },
  {
    id: "demo-executive",
    email: "executive@demo.com",
    name: "Marcus Reynolds",
    role: "executive" as Role,
    status: "Active",
    isActive: true,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z",
  },
  {
    id: "demo-owner",
    email: "owner@demo.com",
    name: "Sarah Mitchell",
    role: "owner" as Role,
    status: "Active",
    isActive: true,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z",
  },
  {
    id: "demo-approver",
    email: "approver@demo.com",
    name: "David Okonkwo",
    role: "approver" as Role,
    status: "Active",
    isActive: true,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z",
  },
];
