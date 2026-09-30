import { describe, it, expect } from "vitest";
import {
  getFormattedValue,
  getRawValue,
  formatDate,
  getInitials,
} from "@/types";

describe("getFormattedValue", () => {
  it("reads the FormattedValue annotation for the given attribute", () => {
    const record = {
      _createdby_value: "00000000-0000-0000-0000-000000000000",
      "_createdby_value@OData.Community.Display.V1.FormattedValue": "Jane Doe",
    };

    expect(getFormattedValue(record, "_createdby_value")).toBe("Jane Doe");
  });

  it("returns undefined when no annotation is present", () => {
    const record = { _createdby_value: "00000000-0000-0000-0000-000000000000" };

    expect(getFormattedValue(record, "_createdby_value")).toBeUndefined();
  });
});

describe("getRawValue", () => {
  it("reads the raw attribute value", () => {
    const record = { _ownerid_value: "00000000-0000-0000-0000-000000000000" };

    expect(getRawValue(record, "_ownerid_value")).toBe(
      "00000000-0000-0000-0000-000000000000",
    );
  });

  it("returns undefined when the attribute is missing", () => {
    expect(getRawValue({}, "_ownerid_value")).toBeUndefined();
  });
});

describe("formatDate", () => {
  it("formats a valid ISO date string using the system locale", () => {
    const iso = "2026-03-05T00:00:00Z";
    const expected = new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    expect(formatDate(iso)).toBe(expected);
  });

  it("returns an em dash for an undefined value", () => {
    expect(formatDate(undefined)).toBe("—");
  });

  it("returns an em dash for an unparseable value", () => {
    expect(formatDate("not-a-date")).toBe("—");
  });
});

describe("getInitials", () => {
  it("returns the first two characters uppercased for a single-word name", () => {
    expect(getInitials("madonna")).toBe("MA");
  });

  it("returns first-and-last initials for a multi-word name", () => {
    expect(getInitials("Jane Doe")).toBe("JD");
  });

  it("collapses extra whitespace between name parts", () => {
    expect(getInitials("  Jane   Middle   Doe  ")).toBe("JD");
  });

  it("returns a question mark for an empty/whitespace-only name", () => {
    expect(getInitials("   ")).toBe("?");
  });
});
