import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";
import { Route } from "@/routes/app.reportes";

vi.mock("@/hooks/use-data", () => ({
  useAsistenciaResumen: () => ({ data: [], isLoading: false }),
  useAsistenciaPorConfirmando: () => ({
    data: [
      {
        confirmando_id: "confirmando-1",
        full_name: "Alex Example",
        grupo: "Group A",
        asistidas: 2,
        ausencias: 1,
        total_sesiones: 3,
        pct: 67,
      },
    ],
    isLoading: false,
  }),
  useGruposSimple: () => ({ data: [] }),
}));

vi.mock("@/components/dashboard/attendance-trend-chart", () => ({
  AttendanceTrendChart: ({ className }: { className?: string }) => (
    <div data-testid="attendance-trend" className={className} />
  ),
}));

vi.mock("@/components/dashboard/confirmando-attendance-detail", () => ({
  ConfirmandoAttendanceDetail: () => null,
}));

const Page = (Route as unknown as { options: { component: ComponentType } }).options.component;

describe("/app/reportes attendance chart visibility", () => {
  it("removes the desktop chart in confirmando mode and restores it in charla mode", () => {
    render(<Page />);

    expect(screen.getByTestId("attendance-trend")).toHaveClass("hidden", "md:block");

    fireEvent.click(screen.getByRole("button", { name: "Por confirmando" }));
    expect(screen.queryByTestId("attendance-trend")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Por charla" }));
    expect(screen.getByTestId("attendance-trend")).toHaveClass("hidden", "md:block");
  });

  it("preserves the mobile confirmando cards in confirmando mode", () => {
    render(<Page />);

    fireEvent.click(screen.getByRole("button", { name: "Por confirmando" }));

    const mobileCard = screen.getByRole("button", {
      name: "Ver detalle de asistencia de Alex Example",
    });
    expect(mobileCard.parentElement).toHaveClass("md:hidden");
    expect(mobileCard).toHaveTextContent("Alex Example");
    expect(mobileCard).toHaveTextContent("2 / 1 / 3");
  });
});
