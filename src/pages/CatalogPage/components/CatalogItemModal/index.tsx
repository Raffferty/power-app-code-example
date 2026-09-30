import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Select from "react-select"
import type { Cr9b0_catalogueitems } from "@/generated/models/Cr9b0_catalogueitemsModel"
import { Cr9b0_catalogueitemscr9b0_category as CATEGORY_LABELS } from "@/generated/models/Cr9b0_catalogueitemsModel"
import { Cr9b0_catalogueitemsService } from "@/generated/services/Cr9b0_catalogueitemsService"
import BaseButton from "@/components/base/BaseButton"
import BaseInput from "@/components/base/BaseInput"
import Modal from "@/components/shared/Modal"
import { selectStyles, type SelectOption } from "@/styles/reactSelectStyles"
import shared from "@/styles/shared.module.css"
import { catalogItemSchema, type CatalogItemFormValues } from "./schema"

const CATEGORY_OPTIONS: SelectOption[] = Object.entries(CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label: String(label) }),
)

const ITEM_NAME_MAX_LENGTH = catalogItemSchema.shape.itemName.maxLength ?? undefined

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
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CatalogItemFormValues>({
    resolver: zodResolver(catalogItemSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      itemName: item?.cr9b0_itemname ?? "",
      category:
        item?.cr9b0_category !== undefined
          ? String(item.cr9b0_category)
          : "930770000",
      available: item?.cr9b0_available ?? true,
    },
  })

  const itemName = useWatch({ control, name: "itemName" })
  const itemNameLength = itemName?.length ?? 0

  async function onSubmit(data: CatalogItemFormValues) {
    setError(null)

    try {
      const payload = {
        cr9b0_itemname: data.itemName.trim(),
        cr9b0_category: Number(data.category) as Cr9b0_catalogueitems["cr9b0_category"],
        cr9b0_available: data.available,
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
    }
  }

  return (
    <Modal title={item ? "Edit Item" : "New Item"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className={shared.modalBody}>
        <div className={shared.formField}>
          <BaseInput
            id="item-name"
            label="Item Name"
            type="text"
            helperText={`${itemNameLength}/${ITEM_NAME_MAX_LENGTH}`}
            errorText={errors.itemName?.message}
            maxLength={ITEM_NAME_MAX_LENGTH}
            {...register("itemName")}
          />
        </div>

        <div className={shared.formField}>
          <label htmlFor="item-category">Category</label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select<SelectOption>
                inputId="item-category"
                classNamePrefix="rs"
                styles={selectStyles}
                menuPortalTarget={document.body}
                isSearchable={false}
                options={CATEGORY_OPTIONS}
                value={
                  CATEGORY_OPTIONS.find((opt) => opt.value === field.value) ??
                  null
                }
                onChange={(option) => field.onChange(option?.value ?? "")}
                onBlur={field.onBlur}
              />
            )}
          />
          {errors.category && (
            <p className={shared.formError}>{errors.category.message}</p>
          )}
        </div>

        <div className={shared.formFieldCheckbox}>
          <label>
            <BaseInput type="checkbox" {...register("available")} />
            Available for ordering
          </label>
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
            {isSubmitting ? "Saving…" : "Save"}
          </BaseButton>
        </div>
      </form>
    </Modal>
  )
}
