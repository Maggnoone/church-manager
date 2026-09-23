import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ThemeProvider, useTheme } from "@/components/theme-provider";

const STORAGE_KEY = "esperanza-theme";

function Probe() {
  const { theme, toggle } = useTheme();

  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button type="button" onClick={toggle}>
        Toggle theme
      </button>
    </div>
  );
}

describe("ThemeProvider", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");
    localStorage.removeItem(STORAGE_KEY);
    vi.restoreAllMocks();
  });

  it("should default to light theme without the dark class", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("should switch to dark, apply the class and persist the theme", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Toggle theme" }));

    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
  });

  it("should switch back to light, remove the class and persist the theme", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Toggle theme" }));
    fireEvent.click(screen.getByRole("button", { name: "Toggle theme" }));

    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(document.documentElement).not.toHaveClass("dark");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
  });

  it("should initialize to dark when the document already has the dark class", () => {
    document.documentElement.classList.add("dark");

    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("should throw when useTheme is used outside ThemeProvider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Probe />)).toThrow("useTheme must be used inside ThemeProvider");

    consoleError.mockRestore();
  });
});
