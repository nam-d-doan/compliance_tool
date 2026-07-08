import { http } from "msw";
import { getDb, paginate, filterByText } from "@/mocks/db";
import {
  getDelay,
  jsonResponse,
  notFound,
  parseQuery,
  parseNumber,
  type MockResolverContext,
} from "./utils";
import type {
  UserProfile,
  RoleEntity,
  AIConfig,
  OrganizationSettings,
} from "@/types";

export async function handleGetUsers({ request }: { request: Request }) {
  await getDelay();
  const url = new URL(request.url);
  const q = parseQuery(url);
  const db = getDb();
  let items = [...db.users];

  if (q.role) {
    items = items.filter((u) => u.role === q.role);
  }
  if (q.status) {
    items = items.filter((u) => u.status === q.status);
  }
  if (q.department) {
    items = items.filter((u) =>
      (u.department ?? "").toLowerCase().includes(q.department.toLowerCase()),
    );
  }
  if (q.search) {
    items = filterByText(items, q.search, [
      "name",
      "email",
      "role",
      "department",
    ]);
  }

  const page = parseNumber(q.page, 1);
  const pageSize = parseNumber(q.pageSize, 20);
  return jsonResponse(paginate(items, page, pageSize));
}

export async function handleCreateUser({ request }: { request: Request }) {
  await getDelay();
  const body = (await request.json()) as Partial<UserProfile>;
  const db = getDb();
  const now = new Date().toISOString();
  const newUser: UserProfile = {
    id: `usr-${crypto.randomUUID()}`,
    email: body.email ?? "",
    name: body.name ?? "",
    role: body.role ?? "owner",
    status: body.status ?? "Active",
    isActive: body.isActive ?? true,
    department: body.department,
    businessUnit: body.businessUnit,
    location: body.location,
    phone: body.phone,
    createdAt: now,
    updatedAt: now,
  };
  db.users.unshift(newUser);
  return jsonResponse(newUser, 201);
}

export async function handleUpdateUser({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.users.findIndex((u) => u.id === params.id);
  if (index === -1) return notFound("User not found");
  const body = (await request.json()) as Partial<UserProfile>;
  db.users[index] = {
    ...db.users[index],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  return jsonResponse(db.users[index]);
}

export async function handleDeleteUser({ params }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.users.findIndex((u) => u.id === params.id);
  if (index === -1) return notFound("User not found");
  db.users.splice(index, 1);
  return jsonResponse({ success: true });
}

export async function handleGetRoles() {
  await getDelay();
  const db = getDb();
  return jsonResponse(db.roles);
}

export async function handleCreateRole({ request }: { request: Request }) {
  await getDelay();
  const body = (await request.json()) as Partial<RoleEntity>;
  const now = new Date().toISOString();
  const newRole: RoleEntity = {
    id: `role-${crypto.randomUUID()}`,
    name: body.name ?? "New Role",
    description: body.description ?? "",
    permissions: body.permissions ?? [],
    isSystem: false,
    userCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  getDb().roles.unshift(newRole);
  return jsonResponse(newRole, 201);
}

export async function handleUpdateRole({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.roles.findIndex((r) => r.id === params.id);
  if (index === -1) return notFound("Role not found");
  const body = (await request.json()) as Partial<RoleEntity>;
  db.roles[index] = {
    ...db.roles[index],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  return jsonResponse(db.roles[index]);
}

export async function handleDeleteRole({ params }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.roles.findIndex((r) => r.id === params.id);
  if (index === -1) return notFound("Role not found");
  db.roles.splice(index, 1);
  return jsonResponse({ success: true });
}

export async function handleGetOrganization() {
  await getDelay();
  const db = getDb();
  return jsonResponse({
    organizations: db.organizations,
    settings: db.organizationSettings,
  });
}

export async function handleUpdateOrganization({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const body = (await request.json()) as Partial<OrganizationSettings>;
  const db = getDb();
  db.organizationSettings = {
    ...db.organizationSettings,
    ...body,
    updatedAt: new Date().toISOString(),
  };
  return jsonResponse(db.organizationSettings);
}

export async function handleGetAuditLogs({ request }: { request: Request }) {
  await getDelay();
  const url = new URL(request.url);
  const q = parseQuery(url);
  const db = getDb();
  let items = [...db.auditLogs];
  if (q.action) items = items.filter((l) => l.action === q.action);
  if (q.module) items = items.filter((l) => l.module === q.module);
  if (q.user)
    items = items.filter(
      (l) =>
        l.userId === q.user ||
        l.userName.toLowerCase().includes(q.user.toLowerCase()),
    );
  const page = parseNumber(q.page, 1);
  const pageSize = parseNumber(q.pageSize, 20);
  return jsonResponse(paginate(items, page, pageSize));
}

export async function handleGetAiConfig() {
  await getDelay();
  return jsonResponse(getDb().aiConfig);
}

export async function handleUpdateAiConfig({ request }: { request: Request }) {
  await getDelay();
  const body = (await request.json()) as Partial<AIConfig>;
  const db = getDb();
  db.aiConfig = {
    ...db.aiConfig,
    ...body,
    updatedAt: new Date().toISOString(),
  };
  return jsonResponse(db.aiConfig);
}

export const adminHandlers = [
  http.get("/api/admin/users", handleGetUsers),
  http.post("/api/admin/users", handleCreateUser),
  http.put("/api/admin/users/:id", handleUpdateUser),
  http.delete("/api/admin/users/:id", handleDeleteUser),
  http.get("/api/admin/roles", handleGetRoles),
  http.post("/api/admin/roles", handleCreateRole),
  http.put("/api/admin/roles/:id", handleUpdateRole),
  http.delete("/api/admin/roles/:id", handleDeleteRole),
  http.get("/api/admin/organization", handleGetOrganization),
  http.put("/api/admin/organization", handleUpdateOrganization),
  http.get("/api/admin/audit-logs", handleGetAuditLogs),
  http.get("/api/admin/ai-config", handleGetAiConfig),
  http.put("/api/admin/ai-config", handleUpdateAiConfig),
];
