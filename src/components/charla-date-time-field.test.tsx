import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CharlaDateTimeField } from "@/components/charla-date-time-field";

describe("CharlaDateTimeField", () => {
  it("keeps date selection above the drawer and preserves compact time controls", () => {
    const onDateChange = vi.fn();
    const onHourChange = vi.fn();
    const onMinuteChange = vi.fn();
    const onPeriodChange = vi.fn();

    render(
      <div data-testid="drawer" className="z-50">
        <CharlaDateTimeField
          date="2025-06-10"
          hour="9"
          minute="30"
          period="PM"
          onDateChange={onDateChange}
          onHourChange={onHourChange}
          onMinuteChange={onMinuteChange}
          onPeriodChange={onPeriodChange}
        />
      </div>,
    );

    const dateTrigger = screen.getByRole("button", { name: "Fecha" });
    const timeRow = screen.getByTestId("charla-time-controls");
    const controlRow = dateTrigger.parentElement;
    expect(controlRow).toHaveClass("grid", "min-w-0");
    expect(controlRow).toHaveClass("grid-cols-[minmax(0,2fr)_repeat(3,minmax(2.75rem,1fr))]");
    expect(dateTrigger).toHaveClass("min-w-0", "w-full");
    expect(dateTrigger.querySelector("span")).toHaveClass("min-w-0", "truncate");
    expect(dateTrigger.querySelector("span")).toHaveTextContent("2025");
    expect(controlRow).toContainElement(timeRow);
    expect(timeRow).toHaveClass("min-w-0");
    expect(fireEvent.click(dateTrigger)).toBeTruthy();

    const calendar = screen.getByRole("grid");
    const popover = calendar.closest("[data-slot='calendar']")?.parentElement;
    expect(popover).toHaveClass("z-[60]");
    expect(within(calendar).getByRole("button", { name: "Sunday, June 15th, 2025" })).toBeVisible();

    expect(timeRow).toHaveClass("contents");
    const hourControl = within(timeRow).getByRole("combobox", { name: "Hora" });
    const minuteControl = within(timeRow).getByRole("combobox", { name: "Minuto" });
    const periodControl = within(timeRow).getByRole("combobox", { name: "AM o PM" });
    for (const control of [hourControl, minuteControl, periodControl]) {
      expect(control).toBeVisible();
      expect(control).toHaveClass("min-w-0", "w-full");
    }
    expect(within(timeRow).getByRole("combobox", { name: "Minuto" }).querySelectorAll("option")).toHaveLength(60);

    fireEvent.click(within(calendar).getByRole("button", { name: "Sunday, June 15th, 2025" }));
    expect(onDateChange).toHaveBeenCalledWith("2025-06-15");
    expect(timeRow).toBeVisible();
    expect(within(timeRow).getByRole("combobox", { name: "Hora" })).toHaveValue("9");
    expect(within(timeRow).getByRole("combobox", { name: "Minuto" })).toHaveValue("30");
    expect(within(timeRow).getByRole("combobox", { name: "AM o PM" })).toHaveValue("PM");
    expect(onHourChange).not.toHaveBeenCalled();
    expect(onMinuteChange).not.toHaveBeenCalled();
    expect(onPeriodChange).not.toHaveBeenCalled();
  });
});
