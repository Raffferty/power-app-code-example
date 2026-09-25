import type { Cr9b0_internalorders } from "./generated/models/Cr9b0_internalordersModel";

export type OrderRecord = Cr9b0_internalorders;

/**
 * Dataverse doesn't return separate "name" columns for lookups/optionsets from this
 * endpoint — it returns the raw value plus a display-text annotation alongside it
 * (e.g. `_createdby_value` + `_createdby_value@OData.Community.Display.V1.FormattedValue`).
 * This reads that annotation for a given attribute.
 */
export function getFormattedValue(record: object, attribute: string): string | undefined {
  return (record as Record<string, unknown>)[`${attribute}@OData.Community.Display.V1.FormattedValue`] as
    | string
    | undefined;
}

/**
 * Owner-type lookup fields (e.g. `_ownerid_value`) are excluded from the generated
 * TS models entirely, even though Dataverse returns them at runtime. This reads
 * one back without an unsafe direct property access.
 */
export function getRawValue(record: object, attribute: string): string | undefined {
  return (record as Record<string, unknown>)[attribute] as string | undefined;
}

export const STATUS_BADGE_COLOR: Record<string, "gray" | "blue" | "yellow" | "purple" | "green" | "red"> = {
  Submitted: "gray",
  Approved: "blue",
  "In Progress": "yellow",
  Ordered: "purple",
  Delivered: "green",
  Denied: "red",
};

export function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}
