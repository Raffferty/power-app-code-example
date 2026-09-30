import { useState } from "react"
import type { SubmitEvent } from "react"
import Select from "react-select"
import type {
  Cr9b0_catalogueitems,
  Cr9b0_catalogueitemscr9b0_category,
} from "@/generated/models/Cr9b0_catalogueitemsModel"
import { Cr9b0_catalogueitemscr9b0_category as CATEGORY_LABELS } from "@/generated/models/Cr9b0_catalogueitemsModel"
import { Cr9b0_catalogueitemsService } from "@/generated/services/Cr9b0_catalogueitemsService"
import BaseButton from "@/components/base/BaseButton"
import BaseInput from "@/components/base/BaseInput"
import Modal from "@/components/shared/Modal"
import { selectStyles, type SelectOption } from "@/styles/reactSelectStyles"
import shared from "@/styles/shared.module.css"

const CATEGORY_OPTIONS: SelectOption[] = Object.entries(CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label: String(label) }),
)

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
          <BaseInput
            id="item-name"
            label="Item Name"
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            required
          />
        </div>

        <div className={shared.formField}>
          <label htmlFor="item-category">Category</label>
          <Select<SelectOption>
            inputId="item-category"
            classNamePrefix="rs"
            styles={selectStyles}
            menuPortalTarget={document.body}
            isSearchable={false}
            options={CATEGORY_OPTIONS}
            value={
              CATEGORY_OPTIONS.find((opt) => opt.value === category) ?? null
            }
            onChange={(option) => setCategory(option?.value ?? "")}
          />
        </div>

        <div className={shared.formFieldCheckbox}>
          <label>
            <BaseInput
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
            />
            Available for ordering
          </label>
        </div>

        {error && <p className={shared.formError}>{error}</p>}

        <div className={shared.modalActions}>
          <BaseButton variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </BaseButton>
          <BaseButton type="submit" variant="primary" loading={submitting}>
            {submitting ? "Saving…" : "Save"}
          </BaseButton>
        </div>
      </form>
    </Modal>
  )
}
