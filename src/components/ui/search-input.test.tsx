import { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { SearchInput } from "@/components/ui/search-input";

describe("SearchInput", () => {
  it("should render an input with the given placeholder", () => {
    render(<SearchInput placeholder="Search confirmandos" />);

    expect(screen.getByPlaceholderText("Search confirmandos")).toBeInTheDocument();
  });

  it("should fire onChange when typing", () => {
    const onChange = vi.fn();
    render(<SearchInput placeholder="Search" onChange={onChange} />);

    const input = screen.getByPlaceholderText("Search");
    fireEvent.change(input, { target: { value: "ana" } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue("ana");
  });

  it("should forward the ref to the inner input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<SearchInput ref={ref} placeholder="Search" />);

    expect(ref.current).toBe(screen.getByPlaceholderText("Search"));
  });

  it("should render leftIcon and rightSlot content when provided", () => {
    render(
      <SearchInput
        placeholder="Search"
        leftIcon={<span data-testid="left-icon">L</span>}
        rightSlot={<button type="button">Clear</button>}
      />,
    );

    expect(screen.getByTestId("left-icon")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
  });
});
