import { createUseT } from "@/lib/i18n";

/** Chuỗi dùng chung: thanh menu, thông báo, trạng thái trống/lỗi, chart. */
export const COMMON_I18N = {
  appName: { en: "Compliance Tool", vi: "Compliance Tool" },
  search: { en: "Search", vi: "Tìm kiếm" },
  searchPlaceholder: {
    en: "Search obligations, regulations…",
    vi: "Tìm nghĩa vụ, văn bản…",
  },
  notifications: { en: "Notifications", vi: "Thông báo" },
  toggleTheme: { en: "Toggle theme", vi: "Đổi giao diện sáng/tối" },
  administration: { en: "Administration", vi: "Quản trị hệ thống" },
  profile: { en: "Profile", vi: "Hồ sơ cá nhân" },
  settings: { en: "Settings", vi: "Cài đặt" },
  switchRole: { en: "Switch Role", vi: "Đổi vai trò" },
  logout: { en: "Log out", vi: "Đăng xuất" },
  guest: { en: "Guest", vi: "Khách" },
  langToggle: { en: "VI", vi: "EN" },
  langToggleAria: { en: "Switch to Vietnamese", vi: "Chuyển sang tiếng Anh" },
  needsAttention: { en: "need attention", vi: "cần xử lý" },

  errorTitle: { en: "Something went wrong", vi: "Đã xảy ra lỗi" },
  errorMessage: {
    en: "We could not load the requested data. Please try again.",
    vi: "Không tải được dữ liệu. Vui lòng thử lại.",
  },
  retry: { en: "Retry", vi: "Thử lại" },
  noChartData: { en: "No chart data", vi: "Chưa có dữ liệu biểu đồ" },
  noChartDataDesc: {
    en: "There is not enough data to display this chart.",
    vi: "Chưa đủ dữ liệu để hiển thị biểu đồ này.",
  },
  viewAll: { en: "View all", vi: "Xem tất cả" },

  notifSubtitle: {
    en: "Stay updated on approvals, deadlines, and AI insights.",
    vi: "Cập nhật phê duyệt, hạn xử lý và gợi ý từ AI.",
  },
  notifFilter: { en: "Filter notifications", vi: "Lọc thông báo" },
  notifAll: { en: "All", vi: "Tất cả" },
  notifUnread: { en: "Unread", vi: "Chưa đọc" },
  notifMarkAll: { en: "Mark all as read", vi: "Đánh dấu đã đọc tất cả" },
  notifCaughtUp: { en: "You're all caught up", vi: "Bạn đã xem hết" },
  notifNone: { en: "No notifications", vi: "Không có thông báo" },
  notifNoUnread: { en: "No unread items right now.", vi: "Hiện không có mục chưa đọc." },
  notifEmptyHint: {
    en: "New activity will show up here.",
    vi: "Hoạt động mới sẽ hiện ở đây.",
  },
  notifTypeApproval: { en: "Approval", vi: "Phê duyệt" },
  notifTypeCompliance: { en: "Compliance", vi: "Tuân thủ" },
  notifTypeCap: { en: "CAP", vi: "CAP" },
  notifTypeAi: { en: "AI", vi: "AI" },
  notifTypeSystem: { en: "System", vi: "Hệ thống" },
  loading: { en: "Loading…", vi: "Đang tải…" },
} as const;

export const useCommonT = createUseT(COMMON_I18N);
