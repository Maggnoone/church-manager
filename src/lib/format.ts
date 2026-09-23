const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parses date-only strings (`YYYY-MM-DD`) as LOCAL dates.
 *
 * `new Date("2025-01-15")` is parsed as UTC midnight, which renders the previous
 * day in negative-offset timezones (e.g. Argentina, UTC-3). Full ISO datetime
 * strings and `Date` instances keep their existing behavior.
 */
function toDate(value: string | Date): Date {
  if (typeof value !== "string") return value;
  if (DATE_ONLY_PATTERN.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
}

export function formatCurrency(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const d = toDate(value);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const d = toDate(value);
  return d.toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" });
}
