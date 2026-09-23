import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { CountUp } from "@/components/ui/count-up";

describe("CountUp", () => {
  it("should render the final formatted value", () => {
    render(<CountUp value={1234} />);

    expect(screen.getByText("1.234")).toBeInTheDocument();
  });

  it("should render a custom format", () => {
    render(<CountUp value={1234} format={(value) => `$${Math.round(value)}`} />);

    expect(screen.getByText("$1234")).toBeInTheDocument();
  });

  it("should render 0 for non-finite values", () => {
    render(
      <>
        <CountUp value={NaN} />
        <CountUp value={Infinity} />
      </>,
    );

    expect(screen.getAllByText("0")).toHaveLength(2);
  });
});
