import { beforeEach, describe, expect, it, vi } from "vitest";

const { pdf, table, dimensions, renderedFontSizes, fontStyles, renderedFontStyles } = vi.hoisted(() => {
  const dimensions = { fontSize: 16 };
  const renderedFontSizes: number[] = [];
  const fontStyles: string[] = [];
  const renderedFontStyles: string[] = [];
  return {
    pdf: {
      setFillColor: vi.fn(),
      rect: vi.fn(),
      roundedRect: vi.fn(),
      setFont: vi.fn((_font: string, style: string) => {
        dimensions.fontStyle = style;
        fontStyles.push(style);
      }),
      setFontSize: vi.fn((size: number) => {
        dimensions.fontSize = size;
      }),
      getTextWidth: vi.fn((text: string) => text.length * dimensions.fontSize * 0.1),
      setTextColor: vi.fn(),
      text: vi.fn((text: string) => {
        if (text === "Reporte de Asistencia" || text.startsWith("— Charla:")) {
          renderedFontSizes.push(dimensions.fontSize);
          renderedFontStyles.push(dimensions.fontStyle);
        }
      }),
      setDrawColor: vi.fn(),
      line: vi.fn(),
      setPage: vi.fn(),
      getNumberOfPages: vi.fn(() => 2),
      save: vi.fn(),
    },
    table: vi.fn(),
    dimensions,
    renderedFontSizes,
    fontStyles,
    renderedFontStyles,
  };
});

vi.mock("jspdf", () => ({
  default: vi.fn(function () {
    return pdf;
  }),
}));
vi.mock("jspdf-autotable", () => ({ default: table }));

import { exportToPDF } from "@/lib/export";

describe("exportToPDF attendance presentation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dimensions.fontSize = 16;
    renderedFontSizes.length = 0;
    fontStyles.length = 0;
    renderedFontStyles.length = 0;
    pdf.getNumberOfPages.mockReturnValue(2);
  });

  it("uses branded summary, table styling, and footer only when opted in", () => {
    exportToPDF("Attendance", ["Name"], [["Ada"]], "attendance", "Session", undefined, {
      brandedAttendance: { summary: "2 present · 1 absent" },
    });

    expect(pdf.rect).toHaveBeenCalledWith(0, 0, 210, 4, "F");
    expect(pdf.roundedRect).toHaveBeenCalledWith(14, 40, 182, 13, 2, 2, "F");
    expect(table).toHaveBeenCalledWith(
      pdf,
      expect.objectContaining({
        startY: 59,
        headStyles: expect.objectContaining({ fillColor: [13, 148, 136] }),
      }),
    );
    expect(pdf.text).toHaveBeenCalledWith("Página 1 de 2", 196, 288, { align: "right" });
    expect(pdf.text).toHaveBeenCalledWith("Página 2 de 2", 196, 288, { align: "right" });
    expect(pdf.save).toHaveBeenCalledWith("attendance.pdf");
  });

  it("places the selected charla beside the report title and fits long context on the same line", () => {
    exportToPDF(
      "Reporte de Asistencia",
      ["Nombre"],
      [["Ada"]],
      "attendance",
      "Fecha | 2/3 presentes",
      undefined,
      {
        brandedAttendance: { context: "Charla: Encuentro de formación" },
      },
    );

    expect(pdf.text).toHaveBeenCalledWith("Reporte de Asistencia", 14, 22);
    expect(pdf.text).toHaveBeenCalledWith(
      "— Charla: Encuentro de formación",
      expect.any(Number),
      22,
    );
    expect(renderedFontSizes).toEqual([18, 18]);
    expect(renderedFontStyles[1]).toBe("normal");
    expect(pdf.text).not.toHaveBeenCalledWith(expect.stringContaining("Charla:"), 14, 29);

    vi.clearAllMocks();
    renderedFontSizes.length = 0;
    pdf.getNumberOfPages.mockReturnValue(2);
    exportToPDF(
      "Reporte de Asistencia",
      ["Nombre"],
      [["Ada"]],
      "attendance",
      undefined,
      undefined,
      {
        brandedAttendance: {
          context: `Charla: ${"Encuentro formativo extraordinario ".repeat(12)}`,
        },
      },
    );

    const contextCall = pdf.text.mock.calls.find(
      ([text, , y]) => typeof text === "string" && text.startsWith("— Charla:") && y === 22,
    );
    expect(contextCall).toBeDefined();
    expect(contextCall?.[1]).toBeLessThanOrEqual(196);
    expect(contextCall?.[1]).toBeGreaterThan(14);
    expect(contextCall?.[0]).toMatch(/…$/);
    expect(contextCall?.[2]).toBe(22);
    expect(renderedFontSizes).toEqual([18, 18]);
    expect(pdf.setFontSize).not.toHaveBeenCalledWith(7);
    expect(pdf.setFontSize).not.toHaveBeenCalledWith(6);
    expect(pdf.setFontSize).not.toHaveBeenCalledWith(5);
  });

  it("styles attendance statuses with bold present and bold red absent", async () => {
    const { attendanceStatusCellStyle } = await import("@/lib/export");
    const style = attendanceStatusCellStyle(3);
    const present = {
      column: { index: 3 },
      cell: { text: ["Presente"], styles: {} as Record<string, unknown> },
    };
    const absent = {
      column: { index: 3 },
      cell: { text: ["Ausente"], styles: {} as Record<string, unknown> },
    };

    style(present);
    style(absent);

    expect(present.cell.styles).toEqual({ fontStyle: "bold" });
    expect(absent.cell.styles).toEqual({ fontStyle: "bold", textColor: [220, 38, 38] });
  });

  it("keeps legacy report styling as the default", () => {
    exportToPDF("Report", ["Name"], [["Ada"]], "report");

    expect(pdf.rect).not.toHaveBeenCalled();
    expect(table).toHaveBeenCalledWith(
      pdf,
      expect.objectContaining({
        startY: 30,
        headStyles: expect.objectContaining({ fillColor: [82, 130, 95] }),
        margin: undefined,
      }),
    );
    expect(pdf.line).not.toHaveBeenCalled();
  });
});
