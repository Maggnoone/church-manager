import { act, render, screen } from "@testing-library/react";
import { useEffect, type ComponentType, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route } from "@/routes/app";

const state = vi.hoisted(() => ({ page: "Dashboard", outletMounts: 0, outletUnmounts: 0 }));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: { id: "user-1" } }) }));
vi.mock("@/components/ui/sidebar", () => ({ SidebarProvider: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("@/components/AppSidebar", () => ({ AppSidebar: () => null }));
vi.mock("@/components/app-topbar", () => ({ AppTopbar: () => null }));
vi.mock("@/components/command-palette", () => ({ CommandPalette: () => null }));
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  function Outlet() {
    useEffect(() => {
      state.outletMounts += 1;
      return () => { state.outletUnmounts += 1; };
    }, []);
    return <div>{state.page}</div>;
  }
  return { ...actual, Outlet };
});
const Page = (Route as unknown as { options: { component: ComponentType } }).options.component;

beforeEach(() => {
  state.page = "Dashboard";
  state.outletMounts = 0;
  state.outletUnmounts = 0;
});

describe("/app route transitions", () => {
  it("updates the route immediately without remounting its layout subtree or retaining the outgoing route", async () => {
    const view = render(<Page />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    const initialOutletMounts = state.outletMounts;

    state.page = "Students";
    await act(async () => view.rerender(<Page />));

    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.getByText("Students")).toBeInTheDocument();
    expect(state.outletMounts).toBe(initialOutletMounts);
    expect(state.outletUnmounts).toBe(0);
  });
});
