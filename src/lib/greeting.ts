/** Time-of-day-aware, first-name greeting for dashboard headers. */
export function getGreeting(name: string, now: Date = new Date()): string {
  const hour = now.getHours();
  const firstName = name.trim().split(" ")[0] || name;

  if (hour >= 5 && hour < 12) return `Good morning, ${firstName}`;
  if (hour >= 12 && hour < 17) return `Good afternoon, ${firstName}`;
  if (hour >= 17 && hour < 21) return `Good evening, ${firstName}`;
  return `Working late, ${firstName}?`;
}
