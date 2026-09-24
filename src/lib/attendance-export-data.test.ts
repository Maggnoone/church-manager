import { describe, expect, it } from "vitest";
import { getAttendanceExportDate } from "@/lib/attendance-export-data";

describe("getAttendanceExportDate", () => {
  it("uses the selected charla schedule instead of attendance creation time", () => {
    const result = getAttendanceExportDate(
      { fecha: "2025-04-12T19:30:00.000Z" },
      { created_at: "2025-04-13T09:15:00.000Z" },
    );

    expect(result).toBe("12 abr 2025, 3:30 p. m.");
  });

  it("returns a dash when the selected charla has no scheduled date", () => {
    expect(getAttendanceExportDate(undefined, { created_at: "2025-04-13T09:15:00.000Z" })).toBe("—");
  });
});
