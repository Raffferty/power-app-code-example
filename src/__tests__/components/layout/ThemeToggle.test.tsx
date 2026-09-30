import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ThemeToggle from "@/components/layout/Header/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";

vi.mock("@/hooks/useTheme", () => ({
  useTheme: vi.fn(),
}));

const mockUseTheme = vi.mocked(useTheme);

function setup(setting: "system" | "light" | "dark" = "system") {
  const setSetting = vi.fn();
  mockUseTheme.mockReturnValue({
    setting,
    resolvedTheme: setting === "system" ? "light" : setting,
    setSetting,
  });
  return { setSetting };
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    setup();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders a trigger button with an accessible label", () => {
    render(<ThemeToggle />);

    expect(screen.getByRole("button", { name: "Change theme" })).toBeInTheDocument();
  });

  it("opens the dropdown menu on click and shows System/Light/Dark options", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Change theme" }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: "System" })).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: "Light" })).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: "Dark" })).toBeInTheDocument();
  });

  it("closes the dropdown menu when the trigger is clicked again", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const trigger = screen.getByRole("button", { name: "Change theme" });
    await user.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(trigger);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("marks the currently active option as checked", async () => {
    setup("dark");
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Change theme" }));

    expect(screen.getByRole("menuitemradio", { name: "Dark" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("menuitemradio", { name: "Light" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(screen.getByRole("menuitemradio", { name: "System" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("calls setSetting and closes the menu when an option is clicked", async () => {
    const { setSetting } = setup("system");
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Change theme" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Dark" }));

    expect(setSetting).toHaveBeenCalledWith("dark");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes the menu on outside click", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button type="button">outside</button>
        <ThemeToggle />
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Change theme" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "outside" }));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes the menu on Escape key", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Change theme" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
