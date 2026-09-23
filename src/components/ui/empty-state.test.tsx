import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { EmptyState } from "@/components/ui/empty-state";

describe("EmptyState", () => {
  it("should render the title and description", () => {
    render(<EmptyState title="No results" description="Try a different search" />);

    expect(screen.getByRole("heading", { name: "No results" })).toBeInTheDocument();
    expect(screen.getByText("Try a different search")).toBeInTheDocument();
  });

  it("should render the action node", () => {
    render(<EmptyState title="No results" action={<button type="button">Create</button>} />);

    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  it("should render without icon, description or action", () => {
    render(<EmptyState title="Nothing here" />);

    expect(screen.getByRole("heading", { name: "Nothing here" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
