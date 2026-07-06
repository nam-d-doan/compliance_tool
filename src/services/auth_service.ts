import { apiPost } from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";
import type { AuthUser } from "@/types";

export interface LoginResult {
  user: AuthUser;
  token: string;
  requiresMfa: boolean;
}

export interface MfaResult {
  success: boolean;
}

export interface ForgotPasswordResult {
  success: boolean;
}

export const AuthService = {
  async login(email: string, password: string): Promise<LoginResult> {
    return apiPost<LoginResult>(API_ENDPOINTS.AUTH_LOGIN, { email, password });
  },

  async verifyMfa(code: string): Promise<MfaResult> {
    return apiPost<MfaResult>(API_ENDPOINTS.AUTH_MFA, { code });
  },

  async forgotPassword(email: string): Promise<ForgotPasswordResult> {
    return apiPost<ForgotPasswordResult>(API_ENDPOINTS.AUTH_FORGOT_PASSWORD, {
      email,
    });
  },

  async logout(): Promise<void> {
    await apiPost<{ success: boolean }>(API_ENDPOINTS.AUTH_LOGOUT, {});
  },
};
