import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { cloneElement } from "react";
import "@testing-library/jest-dom/vitest";
import { AttendanceTrendChart } from "./attendance-trend-chart";

vi.mock("recharts", () => ({
  Area: () => null,
  AreaChart: ({ children, margin }: { children: React.ReactNode; margin: { top: number } }) => (
    <div data-testid="area-chart" data-top-margin={margin.top}>{children}</div>
  ),
  CartesianGrid: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: ({ content }: { content: React.ReactElement<{ active: boolean; payload: { payload: Record<string, unknown> }[] }> }) =>
    cloneElement(content, {
      active: true,
      payload: [{ payload: {
        key: "talk-1",
        date: "2026-03-04T19:30:00.000Z",
        title: "Talk",
        label: "4 mar",
        present: 1,
        absent: 0,
        total: 1,
        attendancePercentage: 100,
      } }],
    }),
  XAxis: () => null,
  YAxis: () => null,
}));

vi.mock("./dashboard-chart-card", () => ({
  DashboardChartCard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ChartTooltipFrame: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("AttendanceTrendChart", () => {
  it("shows the scheduled talk time in the tooltip using local time", () => {
    render(<AttendanceTrendChart data={[{
      key: "talk-1",
      date: "2026-03-04T19:30:00.000Z",
      title: "Talk",
      label: "4 mar",
      present: 1,
      absent: 0,
      total: 1,
      attendancePercentage: 100,
    }]} isLoading={false} />);

    const localTime = new Intl.DateTimeFormat("es-AR", { hour: "numeric", minute: "2-digit" }).format(
      new Date("2026-03-04T19:30:00.000Z"),
    );
    expect(screen.getByText(`Horario: ${localTime}`)).toBeInTheDocument();
  });

  it("does not render year indicators above the plot", () => {
    render(<AttendanceTrendChart data={[{
      key: "2024-01-01",
      date: "2024-01-01",
      title: "Talk",
      label: "01/01",
      present: 1,
      absent: 0,
      total: 1,
      attendancePercentage: 100,
    }]} isLoading={false} />);

    expect(screen.queryByTestId("year-label")).toBeNull();
  });
});
