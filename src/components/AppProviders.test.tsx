import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/components/AppProviders";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn(),
  },
}));

describe("AppProviders", () => {
  beforeEach(async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    vi.clearAllMocks();
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          id: "test-subscription",
          callback: vi.fn(),
          unsubscribe: vi.fn(),
        },
      },
    });
  });

  it("keeps the application tree behind one neutral loader while auth resolves", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    let resolveSession!: (value: { data: { session: null }; error: null }) => void;
    const pendingSession = new Promise<{ data: { session: null }; error: null }>((resolve) => {
      resolveSession = resolve;
    });
    vi.mocked(supabase.auth.getSession).mockReturnValueOnce(pendingSession);

    render(
      <AppProviders>
        <div data-testid="application-tree">Application</div>
      </AppProviders>,
    );

    expect(screen.getByRole("status", { name: "Cargando sesión" })).toBeInTheDocument();
    expect(screen.queryByTestId("application-tree")).not.toBeInTheDocument();

    resolveSession({ data: { session: null }, error: null });

    await waitFor(() => expect(screen.getByTestId("application-tree")).toBeInTheDocument());
    expect(screen.queryByRole("status", { name: "Cargando sesión" })).not.toBeInTheDocument();
  });
});
