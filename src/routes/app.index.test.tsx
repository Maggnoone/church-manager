import { act, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route } from "@/routes/app.index";

const state = vi.hoisted(() => ({
  resumen: [] as Array<{
    fecha: string;
    titulo: string;
    presentes: number;
    total_confirmandos: number;
  }>,
  loadingResumen: true,
}));
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: { email: "test@example.com" }, roles: [], canSeePagos: false }),
}));
vi.mock("@/hooks/use-data", () => ({
  useAsistenciaResumen: () => ({ data: state.resumen, isLoading: state.loadingResumen }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        then: (resolve: (value: unknown) => void) => resolve({ data: [], count: 0, error: null }),
        eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
      }),
    }),
  },
}));
vi.mock("@/components/dashboard/attendance-trend-chart", () => ({
  AttendanceTrendChart: ({
    data,
    isLoading,
  }: {
    data: Array<{ label: string }>;
    isLoading: boolean;
  }) => (
    <div data-testid="trend">
      {isLoading ? "Loading" : data.map((point) => point.label).join(",")}
    </div>
  ),
}));
vi.mock("@/components/dashboard/confirmando-status-chart", () => ({
  ConfirmandoStatusChart: () => null,
}));
vi.mock("@/components/dashboard/pending-requirements-chart", () => ({
  PendingRequirementsChart: () => null,
}));
vi.mock("@/components/StatCard", () => ({ StatCard: () => null }));

const Dashboard = (Route as unknown as { options: { component: ComponentType } }).options.component;

describe("dashboard attendance trend", () => {
  beforeEach(() => {
    state.resumen = [];
    state.loadingResumen = true;
  });

  it("updates when attendance summaries resolve after dashboard stats", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const view = render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>,
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(screen.getByTestId("trend")).toHaveTextContent("Loading");

    state.resumen = [
      { fecha: "2026-01-10", titulo: "Encuentro", presentes: 8, total_confirmandos: 10 },
    ];
    state.loadingResumen = false;
    await act(async () =>
      view.rerender(
        <QueryClientProvider client={queryClient}>
          <Dashboard />
        </QueryClientProvider>,
      ),
    );

    expect(screen.getByTestId("trend")).not.toHaveTextContent("Loading");
    expect(screen.getByTestId("trend")).not.toHaveTextContent(/^$/);
    queryClient.clear();
  });
});
