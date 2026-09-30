import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useTheme } from "@/hooks/useTheme";
import { THEME_STORAGE_KEY } from "@/contexts/theme";

function setMatchMedia(matches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mql = {
    matches,
    media: "(prefers-color-scheme: dark)",
    addEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
  };

  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia;

  return {
    fire: (nextMatches: boolean) => {
      mql.matches = nextMatches;
      listeners.forEach((listener) => listener({ matches: nextMatches } as MediaQueryListEvent));
    },
  };
}

function Consumer() {
  const { setting, resolvedTheme, setSetting } = useTheme();
  return (
    <div>
      <span data-testid="setting">{setting}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button type="button" onClick={() => setSetting("dark")}>
        set dark
      </button>
      <button type="button" onClick={() => setSetting("light")}>
        set light
      </button>
      <button type="button" onClick={() => setSetting("system")}>
        set system
      </button>
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.removeAttribute("data-theme");
  });

  it("defaults to system preference via matchMedia when no localStorage value is stored", () => {
    setMatchMedia(true);

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("setting")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
  });

  it("reads a valid stored setting from localStorage on init", () => {
    setMatchMedia(false);
    localStorage.setItem(THEME_STORAGE_KEY, "dark");

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("setting")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
  });

  it("ignores an invalid stored value and falls back to system", () => {
    setMatchMedia(true);
    localStorage.setItem(THEME_STORAGE_KEY, "not-a-real-theme");

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("setting")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
  });

  it("setSetting('dark') sets data-theme on the document element and persists to localStorage", async () => {
    setMatchMedia(false);
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: "set dark" }));

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("setSetting('system') removes the data-theme attribute", async () => {
    setMatchMedia(false);
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: "set dark" }));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    await user.click(screen.getByRole("button", { name: "set system" }));

    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
  });

  it("does not crash when localStorage throws (quota/private mode) and still applies the theme for the session", async () => {
    setMatchMedia(false);
    const getItemSpy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("quota exceeded");
      });
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("quota exceeded");
      });
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );

    // Falls back to "system" when reading storage throws.
    expect(screen.getByTestId("setting")).toHaveTextContent("system");

    await user.click(screen.getByRole("button", { name: "set dark" }));

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(screen.getByTestId("setting")).toHaveTextContent("dark");

    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });

  it("updates resolvedTheme when the system preference changes while setting is 'system'", () => {
    const { fire } = setMatchMedia(false);

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("resolved")).toHaveTextContent("light");

    act(() => {
      fire(true);
    });

    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
  });
});
