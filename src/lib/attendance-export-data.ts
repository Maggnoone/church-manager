import { formatDateTime } from "@/lib/export";

type ScheduledCharla = { fecha: string } | null | undefined;
type AttendanceRecord = { created_at?: string | null } | null | undefined;

export function getAttendanceExportDate(
  charla: ScheduledCharla,
  _attendance: AttendanceRecord,
): string {
  return charla?.fecha ? formatDateTime(charla.fecha) : "—";
}
