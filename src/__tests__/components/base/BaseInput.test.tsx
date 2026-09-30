import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BaseInput from "@/components/base/BaseInput";

describe("BaseInput", () => {
  it("renders a bare input with no wrapper when no label/helperText/errorText is given", () => {
    const { container } = render(
      <BaseInput aria-label="bare" defaultValue="hello" />,
    );

    expect(screen.getByLabelText("bare")).toBeInTheDocument();
    expect(container.querySelector("div")).not.toBeInTheDocument();
  });

  it("associates the label with the input via a generated id", () => {
    render(<BaseInput label="Quantity" />);

    const input = screen.getByLabelText("Quantity");
    expect(input.tagName).toBe("INPUT");
  });

  it("uses an explicit id instead of generating one when provided", () => {
    render(<BaseInput id="order-quantity" label="Quantity" />);

    expect(screen.getByLabelText("Quantity")).toHaveAttribute(
      "id",
      "order-quantity",
    );
  });

  it("shows helperText when there is no errorText", () => {
    render(<BaseInput label="Needed By" helperText="Must be today or later" />);

    expect(screen.getByText("Must be today or later")).toBeInTheDocument();
  });

  it("shows errorText instead of helperText when both are given", () => {
    render(
      <BaseInput
        label="Delivery Location"
        helperText="Must be today or later"
        errorText="This field is required"
      />,
    );

    expect(screen.getByText("This field is required")).toBeInTheDocument();
    expect(
      screen.queryByText("Must be today or later"),
    ).not.toBeInTheDocument();
  });

  it("accepts user input", async () => {
    const user = userEvent.setup();
    render(<BaseInput label="Delivery Location" />);

    const input = screen.getByLabelText("Delivery Location");
    await user.type(input, "Building 2");

    expect(input).toHaveValue("Building 2");
  });
});
