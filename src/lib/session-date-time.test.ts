import { describe, expect, it } from "vitest";
import { calendarDateToFormDate, localDateTimeFields, localDateTimeToISOString, timestampToLocalDateTimeFields } from "./session-date-time";

describe("session date and time helpers", () => {
  it.each([
    ["2024-02-03", "12", "07", "AM", 0],
    ["2024-02-03", "12", "07", "PM", 12],
    ["2024-02-03", "1", "09", "PM", 13],
  ] as const)("converts %s %s:%s %s as local wall time", (date, hour, minute, period, expectedHour) => {
    const actual = localDateTimeToISOString({ date, hour, minute, period });
    const parsed = new Date(actual);
    expect(parsed.getFullYear()).toBe(2024);
    expect(parsed.getMonth()).toBe(1);
    expect(parsed.getDate()).toBe(3);
    expect(parsed.getHours()).toBe(expectedHour);
    expect(parsed.getMinutes()).toBe(Number(minute));
  });

  it("round-trips an ISO timestamp through local fields", () => {
    const date = new Date(2024, 5, 7, 13, 42);
    const fields = timestampToLocalDateTimeFields(date.toISOString());
    expect(fields).toEqual({ date: "2024-06-07", hour: "1", minute: "42", period: "PM" });
  });

  it("formats a calendar-selected local date without shifting its day", () => {
    expect(calendarDateToFormDate(new Date(2024, 1, 3))).toBe("2024-02-03");
  });

  it("creates defaults from local wall-clock components", () => {
    const fields = localDateTimeFields(new Date(2024, 0, 2, 0, 5));
    expect(fields).toEqual({ date: "2024-01-02", hour: "12", minute: "05", period: "AM" });
  });
});
