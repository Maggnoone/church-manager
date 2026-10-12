import { describe, expect, it } from "vitest";
import { buildEsperanzaAttendancePdfPresentation } from "@/lib/esperanza-attendance-pdf";

describe("Asistencia Esperanza PDF presentation", () => {
  it("provides branded date context, accurate member totals, and shared status styling", () => {
    const presentation = buildEsperanzaAttendancePdfPresentation({
      selectedDate: new Date(2026, 9, 12),
      present: 2,
      total: 3,
    });

    expect(presentation.subtitle).toContain("12");
    expect(presentation.subtitle).toContain("2/3 presentes");
    expect(presentation.options.brandedAttendance.summary).toBe(
      "3 miembros · 2 presentes · 1 ausente · 67% de asistencia",
    );
    const presentCell: {
      fontStyle?: string;
      textColor?: [number, number, number];
    } = { fontStyle: "normal" };
    const absentCell = { ...presentCell };
    presentation.didParseCell({
      column: { index: 2 },
      cell: { text: ["Presente"], styles: presentCell },
    });
    presentation.didParseCell({
      column: { index: 2 },
      cell: { text: ["Ausente"], styles: absentCell },
    });
    expect(presentCell.fontStyle).toBe("bold");
    expect(absentCell).toEqual({ fontStyle: "bold", textColor: [220, 38, 38] });
  });
});
