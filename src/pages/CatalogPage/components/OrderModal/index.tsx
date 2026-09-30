import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Cr9b0_catalogueitems } from "@/generated/models/Cr9b0_catalogueitemsModel"
import { Cr9b0_internalordersService } from "@/generated/services/Cr9b0_internalordersService"
import BaseButton from "@/components/base/BaseButton"
import BaseInput from "@/components/base/BaseInput"
import BaseTextarea from "@/components/base/BaseTextarea"
import Modal from "@/components/shared/Modal"
import shared from "@/styles/shared.module.css"
import {
  orderSchema,
  type OrderFormInput,
  type OrderFormValues,
} from "./schema"

interface OrderModalProps {
  item: Cr9b0_catalogueitems
  onClose: () => void
  onSuccess: () => void
}

export default function OrderModal({
  item,
  onClose,
  onSuccess,
}: OrderModalProps) {
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormInput, unknown, OrderFormValues>({
    resolver: zodResolver(orderSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      quantity: 1,
      neededBy: "",
      deliveryLocation: "",
      notes: "",
    },
  })

  async function onSubmit(data: OrderFormValues) {
    setError(null)

    try {
      const now = new Date()
      // ownerid/createdby are left unset: Dataverse assigns both to the calling
      // (currently authenticated) user automatically on create.
      const result = await Cr9b0_internalordersService.create({
        "cr9b0_Item@odata.bind": `/cr9b0_catalogueitems(${item.cr9b0_catalogueitemid})`,
        cr9b0_orderid: `ORD-${now.getTime()}`,
        cr9b0_deliverylocation: data.deliveryLocation.trim(),
        cr9b0_quantity: data.quantity,
        cr9b0_neededby: data.neededBy
          ? new Date(data.neededBy).toISOString()
          : undefined,
        cr9b0_notes: data.notes?.trim() || undefined,
        cr9b0_orderdate: now.toISOString(),
        cr9b0_orderstatus: 930770000,
        statecode: 0,
      })

      if (result.success) {
        onSuccess()
      } else {
        setError(
          result.error?.message ??
            "Failed to submit the order. Please try again.",
        )
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit the order. Please try again.",
      )
    }
  }

  return (
    <Modal title="New Order" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className={shared.modalBody}>
        <div className={shared.formField}>
          <BaseInput
            label="Item"
            type="text"
            value={item.cr9b0_itemname ?? ""}
            readOnly
            disabled
          />
        </div>

        <div className={shared.formField}>
          <BaseInput
            id="order-quantity"
            label="Quantity"
            type="number"
            min={1}
            errorText={errors.quantity?.message}
            {...register("quantity")}
          />
        </div>

        <div className={shared.formField}>
          <BaseInput
            id="order-needed-by"
            label="Needed By (optional)"
            type="date"
            min={new Date().toLocaleDateString("en-CA")}
            helperText="Must be today or later"
            errorText={errors.neededBy?.message}
            {...register("neededBy")}
          />
        </div>

        <div className={shared.formField}>
          <BaseInput
            id="order-delivery-location"
            label="Delivery Location"
            type="text"
            placeholder="e.g. Building 2, Floor 3"
            errorText={errors.deliveryLocation?.message}
            {...register("deliveryLocation")}
          />
        </div>

        <div className={shared.formField}>
          <BaseTextarea
            id="order-notes"
            label="Notes (optional)"
            rows={3}
            placeholder="e.g. Notes for the fulfillment team"
            {...register("notes")}
          />
        </div>

        {error && <p className={shared.formError}>{error}</p>}

        <div className={shared.modalActions}>
          <BaseButton
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </BaseButton>
          <BaseButton type="submit" variant="primary" loading={isSubmitting}>
            {isSubmitting ? "Submitting…" : "Submit Order"}
          </BaseButton>
        </div>
      </form>
    </Modal>
  )
}
