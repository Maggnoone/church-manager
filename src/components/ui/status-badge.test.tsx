import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { StatusBadge } from "@/components/ui/status-badge";

describe("StatusBadge", () => {
  it("should render the label text", () => {
    render(<StatusBadge label="Active" />);

    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("should apply the success tone classes", () => {
    render(<StatusBadge tone="success" label="Active" />);

    const badge = screen.getByText("Active");
    expect(badge).toHaveClass("text-success");
    expect(badge).toHaveClass("bg-success/10");
  });

  it("should apply the danger tone classes", () => {
    render(<StatusBadge tone="danger" label="Inactive" />);

    expect(screen.getByText("Inactive")).toHaveClass("text-destructive");
  });

  it("should use the neutral tone when no tone is provided", () => {
    render(<StatusBadge label="Default" />);

    expect(screen.getByText("Default")).toHaveClass("text-muted-foreground");
  });

  it("should render the decorative dot as aria-hidden", () => {
    const { container } = render(<StatusBadge label="Active" />);

    const dot = container.querySelector("span[aria-hidden='true']");
    expect(dot).not.toBeNull();
    expect(dot).toHaveClass("rounded-full");
  });
});
