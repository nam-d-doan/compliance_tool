import type { Lang } from "@/stores";

/** Time-of-day-aware greeting for dashboard headers. */
export function getGreeting(name: string, lang: Lang = "en", now: Date = new Date()): string {
  const hour = now.getHours();
  const parts = name.trim().split(" ");

  if (lang === "vi") {
    // Tên gọi tiếng Việt là từ CUỐI (Trần Thị Hoa → Hoa), khác tiếng Anh.
    const given = parts[parts.length - 1] || name;
    if (hour >= 5 && hour < 12) return `Chào buổi sáng, ${given}`;
    if (hour >= 12 && hour < 18) return `Chào buổi chiều, ${given}`;
    if (hour >= 18 && hour < 22) return `Chào buổi tối, ${given}`;
    return `Vẫn đang làm việc à, ${given}?`;
  }

  const firstName = parts[0] || name;
  if (hour >= 5 && hour < 12) return `Good morning, ${firstName}`;
  if (hour >= 12 && hour < 17) return `Good afternoon, ${firstName}`;
  if (hour >= 17 && hour < 21) return `Good evening, ${firstName}`;
  return `Working late, ${firstName}?`;
}
