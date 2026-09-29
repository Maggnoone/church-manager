import { act, render, screen } from "@testing-library/react";
import type { ComponentType, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route } from "@/routes/app";

const state = vi.hoisted(() => ({ pathname: "/app", page: "Dashboard" }));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: { id: "user-1" } }) }));
vi.mock("@/components/ui/sidebar", () => ({ SidebarProvider: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("@/components/AppSidebar", () => ({ AppSidebar: () => null }));
vi.mock("@/components/app-topbar", () => ({ AppTopbar: () => null }));
vi.mock("@/components/command-palette", () => ({ CommandPalette: () => null }));
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return { ...actual, useRouterState: () => state.pathname, Outlet: () => <div>{state.page}</div> };
});
vi.mock("framer-motion", () => ({
  motion: { div: ({ children }: { children: ReactNode }) => <div>{children}</div> },
  useReducedMotion: () => false,
}));

const Page = (Route as unknown as { options: { component: ComponentType } }).options.component;

beforeEach(() => {
  state.pathname = "/app";
  state.page = "Dashboard";
});

describe("/app route transitions", () => {
  it("unmounts the outgoing route immediately when pathname changes", async () => {
    const view = render(<Page />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();

    state.pathname = "/app/students";
    state.page = "Students";
    await act(async () => view.rerender(<Page />));

    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.getByText("Students")).toBeInTheDocument();
  });
});
