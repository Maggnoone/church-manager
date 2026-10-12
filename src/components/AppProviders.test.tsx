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
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("warms only the two light catalogs after authenticated roles resolve without blocking", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const pendingCatalog = new Promise<{ data: unknown[]; error: null }>(() => undefined);
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: {
        session: {
          user: {
            id: "user-1",
            email: "test@test.com",
            app_metadata: {},
            user_metadata: {},
            aud: "authenticated",
            created_at: "",
          },
        } as never,
      },
      error: null,
    });
    vi.mocked(supabase.from).mockImplementation((table) => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnValue(pendingCatalog),
        then: vi.fn((resolve: (value: unknown) => unknown) =>
          Promise.resolve(resolve({ data: [{ role: "admin" }], error: null })),
        ),
      };
      if (table === "user_roles") {
        chain.then = vi.fn((resolve: (value: unknown) => unknown) =>
          Promise.resolve(resolve({ data: [{ role: "admin" }], error: null })),
        );
      }
      return chain as never;
    });

    render(
      <AppProviders>
        <div data-testid="application-tree">Application</div>
      </AppProviders>,
    );

    await waitFor(() => expect(screen.getByTestId("application-tree")).toBeInTheDocument());
    await waitFor(() => expect(supabase.from).toHaveBeenCalledWith("user_roles"));
    await waitFor(() => {
      const tables = vi.mocked(supabase.from).mock.calls.map(([table]) => table);
      expect(tables).toContain("charlas");
      expect(tables).toContain("grupos");
    });
    expect(vi.mocked(supabase.from).mock.calls.map(([table]) => table)).toEqual([
      "user_roles",
      "charlas",
      "grupos",
    ]);
  });
});
