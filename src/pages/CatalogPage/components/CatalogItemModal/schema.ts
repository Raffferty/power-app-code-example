import { z } from "zod"
import { Cr9b0_catalogueitemscr9b0_category as CATEGORY_LABELS } from "@/generated/models/Cr9b0_catalogueitemsModel"

const CATEGORY_VALUES = Object.keys(CATEGORY_LABELS) as [string, ...string[]]

export const catalogItemSchema = z.object({
  itemName: z
    .string()
    .trim()
    .min(1, "Item name is required.")
    .max(32, "Item name must be 32 characters or fewer."),
  category: z.enum(CATEGORY_VALUES, {
    error: "Category is required.",
  }),
  available: z.boolean(),
})

export type CatalogItemFormValues = z.infer<typeof catalogItemSchema>
