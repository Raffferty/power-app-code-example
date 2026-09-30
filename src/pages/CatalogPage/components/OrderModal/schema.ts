import { z } from "zod"

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

export const orderSchema = z.object({
  quantity: z.coerce
    .number({ error: "Quantity is required." })
    .int("Quantity must be a whole number.")
    .positive("Quantity must be at least 1."),
  neededBy: z
    .string()
    .optional()
    .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
      message: "Enter a valid date.",
    })
    .refine((value) => !value || new Date(value) >= startOfToday(), {
      message: "Needed By must be today or later.",
    }),
  deliveryLocation: z
    .string()
    .trim()
    .min(1, "Delivery location is required."),
  notes: z.string().optional(),
})

export type OrderFormInput = z.input<typeof orderSchema>
export type OrderFormValues = z.output<typeof orderSchema>
