import { beforeEach, describe, expect, it, vi } from "vitest";

const { pdf, table } = vi.hoisted(() => ({
  pdf: {
    setFillColor: vi.fn(),
    rect: vi.fn(),
    roundedRect: vi.fn(),
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    text: vi.fn(),
    setDrawColor: vi.fn(),
    line: vi.fn(),
    setPage: vi.fn(),
    getNumberOfPages: vi.fn(() => 2),
    save: vi.fn(),
  },
  table: vi.fn(),
}));

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
