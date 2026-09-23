import type { Confirmando, ConfirmandoStatus } from "@/integrations/supabase/types";

export interface ChartCategory {
  key: string;
  label: string;
  value: number;
  /** Optional CSS color (e.g. `var(--chart-3)`). Callers own the palette. */
  color?: string;
}

type RequirementConfirmando = Pick<
  Confirmando,
  | "status"
  | "has_baptism"
  | "has_communion"
  | "padrino_id"
  | "dni"
  | "direccion"
  | "contacto_padres"
>;

const REQUIREMENT_CATEGORIES = [
  { key: "baptism", label: "Bautismo pendiente" },
  { key: "communion", label: "Comunión pendiente" },
  { key: "padrino", label: "Padrino pendiente" },
  { key: "documentation", label: "Datos incompletos" },
] as const;

function isBlank(value: string | null | undefined): boolean {
  return value == null || value.trim() === "";
}

export function buildPendingRequirements(
  confirmandos: readonly RequirementConfirmando[],
): ChartCategory[] {
  const counts = [0, 0, 0, 0];

  for (const confirmando of confirmandos) {
    if (confirmando.status === "baja") continue;

    if (!confirmando.has_baptism) counts[0] += 1;
    if (!confirmando.has_communion) counts[1] += 1;
    if (!confirmando.padrino_id) counts[2] += 1;
    if (
      isBlank(confirmando.dni) ||
      isBlank(confirmando.direccion) ||
      isBlank(confirmando.contacto_padres)
    ) {
      counts[3] += 1;
    }
  }

  return REQUIREMENT_CATEGORIES.map((category, index) => ({
    ...category,
    value: counts[index],
  }));
}

type StatusConfirmando = Pick<Confirmando, "status">;

const STATUS_CATEGORIES: readonly { key: ConfirmandoStatus; label: string }[] = [
  { key: "activo", label: "Activo" },
  { key: "apto", label: "Apto" },
  { key: "confirmado", label: "Confirmado" },
  { key: "baja", label: "Baja" },
];

export function buildConfirmandoStatusCounts(
  confirmandos: readonly StatusConfirmando[],
): ChartCategory[] {
  const counts: Record<ConfirmandoStatus, number> = {
    activo: 0,
    apto: 0,
    confirmado: 0,
    baja: 0,
  };

  for (const confirmando of confirmandos) {
    counts[confirmando.status] += 1;
  }

  return STATUS_CATEGORIES.map((category) => ({
    ...category,
    value: counts[category.key],
  }));
}

export interface AttendanceTrendPoint {
  key: string;
  date: string;
  label: string;
  title: string;
  present: number;
  absent: number;
  total: number;
  attendancePercentage: number;
}

interface AttendanceMeeting {
  id: string;
  fecha: string;
  titulo: string;
}

interface AttendanceRecord {
  charla_id: string;
  presente: boolean;
}

const SHORT_MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sept",
  "oct",
  "nov",
  "dic",
] as const;

function formatMeetingLabel(date: Date): string {
  return `${date.getUTCDate()} ${SHORT_MONTHS[date.getUTCMonth()]}`;
}

export function buildAttendanceTrend(
  meetings: readonly AttendanceMeeting[],
  attendance: readonly AttendanceRecord[],
  now: Date = new Date(),
): AttendanceTrendPoint[] {
  const attendanceByMeeting = new Map<string, { present: number; total: number }>();

  for (const record of attendance) {
    const counts = attendanceByMeeting.get(record.charla_id) ?? { present: 0, total: 0 };
    counts.total += 1;
    if (record.presente) counts.present += 1;
    attendanceByMeeting.set(record.charla_id, counts);
  }

  return meetings
    .flatMap((meeting) => {
      const meetingDate = new Date(meeting.fecha);
      const counts = attendanceByMeeting.get(meeting.id);

      if (!counts || counts.total === 0 || Number.isNaN(meetingDate.getTime())) return [];
      if (meetingDate.getTime() > now.getTime()) return [];

      return [
        {
          meeting,
          meetingDate,
          point: {
            key: meeting.id,
            date: meeting.fecha,
            label: formatMeetingLabel(meetingDate),
            title: meeting.titulo,
            present: counts.present,
            absent: counts.total - counts.present,
            total: counts.total,
            attendancePercentage: Math.round((counts.present / counts.total) * 100),
          },
        },
      ];
    })
    .sort(
      (left, right) =>
        left.meetingDate.getTime() - right.meetingDate.getTime() ||
        left.meeting.id.localeCompare(right.meeting.id),
    )
    .slice(-8)
    .map(({ point }) => point);
}

export interface AttendanceResumenPoint {
  charla_id: string;
  titulo: string;
  fecha: string;
  total_confirmandos: number;
  presentes: number;
  ausentes: number;
}

export interface ConfirmandoAttendanceItem {
  charla_id: string;
  titulo: string;
  fecha: string;
  presente: boolean;
}

export function buildConfirmandoAttendanceTrend(
  items: readonly ConfirmandoAttendanceItem[],
  now: Date = new Date(),
): AttendanceTrendPoint[] {
  return items
    .flatMap((item) => {
      const meetingDate = new Date(item.fecha);
      if (Number.isNaN(meetingDate.getTime())) return [];
      if (meetingDate.getTime() > now.getTime()) return [];
      return [
        {
          meetingDate,
          point: {
            key: item.charla_id,
            date: item.fecha,
            label: formatMeetingLabel(meetingDate),
            title: item.titulo,
            present: item.presente ? 1 : 0,
            absent: item.presente ? 0 : 1,
            total: 1,
            attendancePercentage: item.presente ? 100 : 0,
          },
        },
      ];
    })
    .sort(
      (left, right) =>
        left.meetingDate.getTime() - right.meetingDate.getTime() ||
        left.point.key.localeCompare(right.point.key),
    )
    .map(({ point }) => point);
}

export function buildAttendanceTrendFromResumen(
  resumen: readonly AttendanceResumenPoint[],
  now: Date = new Date(),
): AttendanceTrendPoint[] {
  return resumen
    .flatMap((item) => {
      const meetingDate = new Date(item.fecha);

      if (Number.isNaN(meetingDate.getTime())) return [];
      if (meetingDate.getTime() > now.getTime()) return [];
      if (item.total_confirmandos <= 0) return [];

      return [
        {
          meetingDate,
          point: {
            key: item.charla_id,
            date: item.fecha,
            label: formatMeetingLabel(meetingDate),
            title: item.titulo,
            present: item.presentes,
            absent: item.ausentes,
            total: item.total_confirmandos,
            attendancePercentage:
              item.total_confirmandos > 0
                ? Math.round((item.presentes / item.total_confirmandos) * 100)
                : 0,
          },
        },
      ];
    })
    .sort(
      (left, right) =>
        left.meetingDate.getTime() - right.meetingDate.getTime() ||
        left.point.key.localeCompare(right.point.key),
    )
    .map(({ point }) => point);
}
