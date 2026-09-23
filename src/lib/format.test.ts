import { describe, it, expect } from "vitest";
import { formatDate, formatDateTime } from "@/lib/format";

describe("formatDate", () => {
  it("should parse date-only strings as local dates", () => {
    expect(formatDate("2025-01-15")).toBe("15/01/2025");
  });

  it("should keep the year boundary on the correct day", () => {
    expect(formatDate("2025-12-31")).toBe("31/12/2025");
  });

  it("should format full ISO datetime strings to the same calendar day", () => {
    expect(formatDate("2025-06-15T12:00:00")).toBe("15/06/2025");
  });

  it("should format Date instances as before", () => {
    expect(formatDate(new Date(2025, 0, 15))).toBe("15/01/2025");
  });
});

describe("formatDateTime", () => {
  it("should treat date-only strings as local midnight", () => {
    expect(formatDateTime("2025-01-15")).toBe(formatDateTime(new Date(2025, 0, 15)));
  });
});
