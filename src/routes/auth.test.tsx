import { render, screen } from "@testing-library/react";
import type { ComponentType, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route } from "@/routes/auth";

const auth = vi.hoisted(() => ({ user: null as { id: string } | null, loading: false }));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => auth }));
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return { ...actual, useNavigate: () => vi.fn(), Navigate: () => <div>Redirecting</div>, Link: ({ children }: { children: ReactNode }) => <a>{children}</a> };
});
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { signInWithPassword: vi.fn(), signUp: vi.fn() } } }));

const Page = (Route as unknown as { options: { component: ComponentType } }).options.component;

beforeEach(() => {
  auth.user = null;
  auth.loading = false;
});

describe("/auth", () => {
  it("keeps hook order when auth state becomes signed in while mounted", () => {
    const view = render(<Page />);
    expect(screen.getByRole("button", { name: "Ingresar" })).toBeVisible();

    auth.user = { id: "user-1" };
    expect(() => view.rerender(<Page />)).not.toThrow();
    expect(screen.getByText("Redirecting")).toBeVisible();
  });
});
