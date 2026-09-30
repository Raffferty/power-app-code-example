import { useState } from "react"
import type { SubmitEvent } from "react"
import type { Cr9b0_catalogueitems } from "@/generated/models/Cr9b0_catalogueitemsModel"
import { Cr9b0_internalordersService } from "@/generated/services/Cr9b0_internalordersService"
import BaseButton from "@/components/base/BaseButton"
import BaseInput from "@/components/base/BaseInput"
import BaseTextarea from "@/components/base/BaseTextarea"
import Modal from "@/components/shared/Modal"
import shared from "@/styles/shared.module.css"

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
  const [quantity, setQuantity] = useState(1)
  const [neededBy, setNeededBy] = useState("")
  const [deliveryLocation, setDeliveryLocation] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!deliveryLocation.trim()) {
      setError("Delivery location is required.")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const now = new Date()
      // ownerid/createdby are left unset: Dataverse assigns both to the calling
      // (currently authenticated) user automatically on create.
      const result = await Cr9b0_internalordersService.create({
        "cr9b0_Item@odata.bind": `/cr9b0_catalogueitems(${item.cr9b0_catalogueitemid})`,
        cr9b0_orderid: `ORD-${now.getTime()}`,
        cr9b0_deliverylocation: deliveryLocation.trim(),
        cr9b0_quantity: quantity,
        cr9b0_neededby: neededBy ? new Date(neededBy).toISOString() : undefined,
        cr9b0_notes: notes.trim() || undefined,
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
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="New Order" onClose={onClose}>
      <form onSubmit={handleSubmit} className={shared.modalBody}>
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
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.max(1, Number(e.target.value) || 1))
            }
            required
          />
        </div>

        <div className={shared.formField}>
          <BaseInput
            id="order-needed-by"
            label="Needed By"
            type="date"
            value={neededBy}
            onChange={(e) => setNeededBy(e.target.value)}
          />
        </div>

        <div className={shared.formField}>
          <BaseInput
            id="order-delivery-location"
            label="Delivery Location"
            type="text"
            value={deliveryLocation}
            onChange={(e) => setDeliveryLocation(e.target.value)}
            placeholder="e.g. Building 2, Floor 3"
            required
          />
        </div>

        <div className={shared.formField}>
          <BaseTextarea
            id="order-notes"
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Optional notes for the fulfillment team"
          />
        </div>

        {error && <p className={shared.formError}>{error}</p>}

        <div className={shared.modalActions}>
          <BaseButton variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </BaseButton>
          <BaseButton type="submit" variant="primary" loading={submitting}>
            {submitting ? "Submitting…" : "Submit Order"}
          </BaseButton>
        </div>
      </form>
    </Modal>
  )
}
