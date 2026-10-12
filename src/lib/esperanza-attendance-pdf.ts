import { attendanceStatusCellStyle } from "@/lib/export";

export function buildEsperanzaAttendancePdfPresentation({
  selectedDate,
  present,
  total,
}: {
  selectedDate: Date;
  present: number;
  total: number;
}) {
  const formattedDate = selectedDate.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const absent = total - present;
  const percentage = total === 0 ? 0 : Math.round((present / total) * 100);

  return {
    subtitle: `Fecha: ${formattedDate} | ${present}/${total} presentes`,
    didParseCell: attendanceStatusCellStyle(2),
    options: {
      brandedAttendance: {
        summary: `${total} miembros · ${present} presentes · ${absent} ${absent === 1 ? "ausente" : "ausentes"} · ${percentage}% de asistencia`,
      },
    },
  };
}
