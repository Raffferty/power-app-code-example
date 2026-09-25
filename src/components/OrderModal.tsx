import { useState } from "react"
import type { SubmitEvent } from "react"
import type { Cr9b0_catalogueitems } from "@/generated/models/Cr9b0_catalogueitemsModel"
import { Cr9b0_internalordersService } from "@/generated/services/Cr9b0_internalordersService"
import Modal from "./Modal"
import Spinner from "./Spinner"
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

    setSubmitting(false)

    if (result.success) {
      onSuccess()
    } else {
      setError(
        result.error?.message ??
          "Failed to submit the order. Please try again.",
      )
    }
  }

  return (
    <Modal title="New Order" onClose={onClose}>
      <form onSubmit={handleSubmit} className={shared.modalBody}>
        <div className={shared.formField}>
          <label>Item</label>
          <input
            type="text"
            value={item.cr9b0_itemname ?? ""}
            readOnly
            disabled
          />
        </div>

        <div className={shared.formField}>
          <label htmlFor="order-quantity">Quantity</label>
          <input
            id="order-quantity"
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
          <label htmlFor="order-needed-by">Needed By</label>
          <input
            id="order-needed-by"
            type="date"
            value={neededBy}
            onChange={(e) => setNeededBy(e.target.value)}
          />
        </div>

        <div className={shared.formField}>
          <label htmlFor="order-delivery-location">Delivery Location</label>
          <input
            id="order-delivery-location"
            type="text"
            value={deliveryLocation}
            onChange={(e) => setDeliveryLocation(e.target.value)}
            placeholder="e.g. Building 2, Floor 3"
            required
          />
        </div>

        <div className={shared.formField}>
          <label htmlFor="order-notes">Notes</label>
          <textarea
            id="order-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Optional notes for the fulfillment team"
          />
        </div>

        {error && <p className={shared.formError}>{error}</p>}

        <div className={shared.modalActions}>
          <button
            type="button"
            className={`${shared.btn} ${shared.btnSecondary}`}
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`${shared.btn} ${shared.btnPrimary}`}
            disabled={submitting}
          >
            {submitting && <Spinner size="sm" variant="light" />}
            {submitting ? "Submitting…" : "Submit Order"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
