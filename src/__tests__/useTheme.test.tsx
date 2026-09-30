import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { useTheme } from "@/hooks/useTheme";

describe("useTheme", () => {
  it("throws when called outside a ThemeProvider", () => {
    function Bare() {
      useTheme();
      return null;
    }

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Bare />)).toThrow(
      "useTheme must be used within a ThemeProvider",
    );

    consoleError.mockRestore();
  });
});
