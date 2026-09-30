import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BaseButton from "@/components/base/BaseButton";

describe("BaseButton", () => {
  it("defaults to type=button so it never implicitly submits a form", () => {
    render(<BaseButton>Click me</BaseButton>);

    expect(screen.getByRole("button", { name: "Click me" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("allows overriding the type to submit", () => {
    render(<BaseButton type="submit">Submit</BaseButton>);

    expect(screen.getByRole("button", { name: "Submit" })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  it("fires onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<BaseButton onClick={onClick}>Click me</BaseButton>);

    await user.click(screen.getByRole("button", { name: "Click me" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disables the button and marks it aria-busy while loading", () => {
    render(<BaseButton loading>Saving</BaseButton>);

    const button = screen.getByRole("button", { name: "LoadingSaving" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("does not fire onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <BaseButton onClick={onClick} disabled>
        Click me
      </BaseButton>,
    );

    await user.click(screen.getByRole("button", { name: "Click me" }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("warns in dev when an icon-only button has no accessible label", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(<BaseButton iconOnly>×</BaseButton>);

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("aria-label"));
    warnSpy.mockRestore();
  });

  it("does not warn when an icon-only button has an aria-label", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(
      <BaseButton iconOnly aria-label="Close">
        ×
      </BaseButton>,
    );

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
