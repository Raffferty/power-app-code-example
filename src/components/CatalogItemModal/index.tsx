import { useState } from "react"
import type { SubmitEvent } from "react"
import type {
  Cr9b0_catalogueitems,
  Cr9b0_catalogueitemscr9b0_category,
} from "@/generated/models/Cr9b0_catalogueitemsModel"
import { Cr9b0_catalogueitemscr9b0_category as CATEGORY_LABELS } from "@/generated/models/Cr9b0_catalogueitemsModel"
import { Cr9b0_catalogueitemsService } from "@/generated/services/Cr9b0_catalogueitemsService"
import Modal from "../Modal"
import Spinner from "../Spinner"
import shared from "@/styles/shared.module.css"

interface CatalogItemModalProps {
  item: Cr9b0_catalogueitems | null
  onClose: () => void
  onSuccess: () => void
}

export default function CatalogItemModal({
  item,
  onClose,
  onSuccess,
}: CatalogItemModalProps) {
  const [itemName, setItemName] = useState(item?.cr9b0_itemname ?? "")
  const [category, setCategory] = useState(
    item?.cr9b0_category !== undefined
      ? String(item.cr9b0_category)
      : "930770000",
  )
  const [available, setAvailable] = useState(item?.cr9b0_available ?? true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!itemName.trim()) {
      setError("Item name is required.")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const payload = {
        cr9b0_itemname: itemName.trim(),
        cr9b0_category: Number(category) as Cr9b0_catalogueitemscr9b0_category,
        cr9b0_available: available,
      }

      const result = item
        ? await Cr9b0_catalogueitemsService.update(
            item.cr9b0_catalogueitemid,
            payload,
          )
        : await Cr9b0_catalogueitemsService.create({
            ...payload,
            statecode: 0,
            statuscode: 1,
          })

      if (result.success) {
        onSuccess()
      } else {
        setError(result.error?.message ?? "Failed to save the catalog item.")
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save the catalog item.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title={item ? "Edit Item" : "New Item"} onClose={onClose}>
      <form onSubmit={handleSubmit} className={shared.modalBody}>
        <div className={shared.formField}>
          <label htmlFor="item-name">Item Name</label>
          <input
            id="item-name"
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            required
          />
        </div>

        <div className={shared.formField}>
          <label htmlFor="item-category">Category</label>
          <select
            id="item-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className={shared.formFieldCheckbox}>
          <label>
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
            />
            Available for ordering
          </label>
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
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
