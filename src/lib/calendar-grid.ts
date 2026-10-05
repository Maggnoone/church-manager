/** Helpers compartidos para las grillas de calendario mensual (lunes a domingo). */

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getMonthGridDays(month: Date): Date[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstOfMonth = new Date(year, monthIndex, 1);
  const dayOfWeek = firstOfMonth.getDay(); // 0=Sun
  const daysFromPrev = (dayOfWeek + 6) % 7;
  const start = new Date(year, monthIndex, 1 - daysFromPrev);
  const lastOfMonth = new Date(year, monthIndex + 1, 0);
  const lastDayOfWeek = lastOfMonth.getDay();
  const daysFromNext = (7 - lastDayOfWeek) % 7;
  const end = new Date(year, monthIndex + 1, daysFromNext);
  const days: Date[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
