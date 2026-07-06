import { http } from "msw";
import { DEMO_PASSWORD } from "@/constants/demo-users";
import { getDb } from "@/mocks/db";
import { getDelay, jsonResponse, badRequest } from "./utils";
import type { AuthUser } from "@/types";

function generateToken(user: AuthUser): string {
  return `fake-jwt-${user.id}-${Date.now()}`;
}

function toAuthUser(user: AuthUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function handleLogin({ request }: { request: Request }) {
  await getDelay();
  const body = (await request.json()) as { email?: string; password?: string };
  const { email, password } = body;

  if (!email || !password) {
    return badRequest("Email and password are required.");
  }

  const db = getDb();
  const user = db.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );

  if (!user || password !== DEMO_PASSWORD) {
    return badRequest("Invalid email or password.");
  }

  return jsonResponse({
    success: true,
    user: toAuthUser(user),
    token: generateToken(user),
    requiresMfa: true,
  });
}

export async function handleMfa({ request }: { request: Request }) {
  await getDelay();
  const body = (await request.json()) as { code?: string };
  const { code } = body;

  if (!/^\d{6}$/.test(code ?? "")) {
    return badRequest("Please enter a valid 6-digit code.");
  }

  return jsonResponse({ success: true });
}

export async function handleForgotPassword({ request }: { request: Request }) {
  await getDelay();
  const body = (await request.json()) as { email?: string };
  if (!body.email) {
    return badRequest("Email is required.");
  }
  return jsonResponse({
    success: true,
    message: "Password reset instructions sent.",
  });
}

export async function handleLogout() {
  await getDelay();
  return jsonResponse({ success: true });
}

export const authHandlers = [
  http.post("/api/auth/login", handleLogin),
  http.post("/api/auth/mfa", handleMfa),
  http.post("/api/auth/forgot-password", handleForgotPassword),
  http.post("/api/auth/logout", handleLogout),
];
