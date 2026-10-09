import { createUseT } from "@/lib/i18n";

/** Login / MFA / Quên mật khẩu. Key validate zod (emailRequired...) dùng làm message rồi dịch lúc render. */
export const AUTH_I18N = {
  // Brand panel
  heroTitle: {
    en: "AI-powered compliance management for modern enterprises",
    vi: "Quản lý tuân thủ ứng dụng AI cho doanh nghiệp hiện đại",
  },
  heroSubtitle: {
    en: "Streamline obligations, corrective actions and regulatory reporting in one intelligent platform.",
    vi: "Quản lý nghĩa vụ, hành động khắc phục và báo cáo tuân thủ trên một nền tảng thông minh.",
  },
  chainRegulation: { en: "Regulation", vi: "Văn bản" },
  chainAssignment: { en: "Assignment", vi: "Phân giao" },
  chainObligation: { en: "Obligation", vi: "Nghĩa vụ" },
  chainCap: { en: "CAP", vi: "Khắc phục" },
  copilotTitle: { en: "AI Copilot", vi: "Trợ lý AI" },
  copilotDesc: {
    en: "Recommendations, summaries and risk insights on demand.",
    vi: "Gợi ý, tóm tắt và phân tích rủi ro theo yêu cầu.",
  },
  securityTitle: { en: "Enterprise-grade security", vi: "Bảo mật cấp doanh nghiệp" },
  securityDesc: {
    en: "Role-based access, audit trails and MFA.",
    vi: "Phân quyền theo vai trò, nhật ký kiểm toán và xác thực 2 lớp.",
  },
  copyright: {
    en: "Compliance Tool Demo. All rights reserved.",
    vi: "Compliance Tool Demo. Bảo lưu mọi quyền.",
  },

  // Login form
  welcome: { en: "Welcome back", vi: "Chào mừng trở lại" },
  signInSubtitle: {
    en: "Sign in to the AI Compliance Management System",
    vi: "Đăng nhập Hệ thống Quản lý Tuân thủ ứng dụng AI",
  },
  email: { en: "Email", vi: "Email" },
  password: { en: "Password", vi: "Mật khẩu" },
  showPassword: { en: "Show password", vi: "Hiện mật khẩu" },
  hidePassword: { en: "Hide password", vi: "Ẩn mật khẩu" },
  rememberMe: { en: "Remember me", vi: "Ghi nhớ đăng nhập" },
  forgotPasswordLink: { en: "Forgot password?", vi: "Quên mật khẩu?" },
  signingIn: { en: "Signing in…", vi: "Đang đăng nhập…" },
  signIn: { en: "Sign in", vi: "Đăng nhập" },
  demoAccounts: { en: "Demo accounts", vi: "Tài khoản demo" },
  demoPassword: { en: "Password for all accounts:", vi: "Mật khẩu chung cho mọi tài khoản:" },
  termsNote: {
    en: "By signing in, you agree to the demo terms of use.",
    vi: "Khi đăng nhập, bạn đồng ý với điều khoản sử dụng bản demo.",
  },
  genericError: {
    en: "Something went wrong. Please try again.",
    vi: "Đã xảy ra lỗi. Vui lòng thử lại.",
  },
  emailRequired: { en: "Email is required", vi: "Vui lòng nhập email" },
  emailInvalid: { en: "Enter a valid email address", vi: "Email không hợp lệ" },
  passwordRequired: { en: "Password is required", vi: "Vui lòng nhập mật khẩu" },
  passwordMin: {
    en: "Password must be at least 8 characters",
    vi: "Mật khẩu phải có ít nhất 8 ký tự",
  },

  // MFA
  verifyTitle: { en: "Verify your identity", vi: "Xác minh danh tính" },
  verifySentTo: {
    en: "Enter the 6-digit verification code sent to",
    vi: "Nhập mã xác minh 6 số đã gửi tới",
  },
  verificationCode: { en: "Verification code", vi: "Mã xác minh" },
  codeLength: { en: "Enter the 6-digit code", vi: "Nhập đủ 6 chữ số" },
  digitOf: { en: "Digit", vi: "Chữ số" },
  verifying: { en: "Verifying…", vi: "Đang xác minh…" },
  verify: { en: "Verify", vi: "Xác minh" },
  resendCode: { en: "Resend code", vi: "Gửi lại mã" },
  resendIn: { en: "Resend code in", vi: "Gửi lại mã sau" },
  codeResent: { en: "Code resent", vi: "Đã gửi lại mã" },
  codeResentDesc: {
    en: "A new verification code has been sent to your email.",
    vi: "Mã xác minh mới đã được gửi tới email của bạn.",
  },
  signedIn: { en: "Signed in successfully", vi: "Đăng nhập thành công" },
  verifyFailed: {
    en: "Verification failed. Please try again.",
    vi: "Xác minh thất bại. Vui lòng thử lại.",
  },
  backToSignIn: { en: "Back to sign in", vi: "Quay lại đăng nhập" },

  // Forgot password
  forgotTitle: { en: "Forgot password", vi: "Quên mật khẩu" },
  forgotSubtitle: {
    en: "Enter your email and we'll send you a reset link.",
    vi: "Nhập email, chúng tôi sẽ gửi đường dẫn đặt lại mật khẩu.",
  },
  checkEmail: { en: "Check your email", vi: "Kiểm tra email" },
  resetSent: {
    en: "If an account exists, a reset link has been sent.",
    vi: "Nếu tài khoản tồn tại, đường dẫn đặt lại đã được gửi.",
  },
  sending: { en: "Sending…", vi: "Đang gửi…" },
  sendResetLink: { en: "Send reset link", vi: "Gửi đường dẫn đặt lại" },
} as const;

export type AuthI18nKey = keyof typeof AUTH_I18N;

export const useAuthT = createUseT(AUTH_I18N);

/** Message zod là key của AUTH_I18N → dịch; message khác (lỗi server) giữ nguyên. */
export function isAuthKey(message: string | undefined): message is AuthI18nKey {
  return !!message && message in AUTH_I18N;
}
