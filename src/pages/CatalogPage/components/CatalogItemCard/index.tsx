import type { Cr9b0_catalogueitems } from "@/generated/models/Cr9b0_catalogueitemsModel"
import { Cr9b0_catalogueitemscr9b0_category } from "@/generated/models/Cr9b0_catalogueitemsModel"
import { getFormattedValue } from "@/types"
import BaseButton from "@/components/base/BaseButton"
import styles from "./CatalogItemCard.module.css"

interface CatalogItemCardProps {
  item: Cr9b0_catalogueitems
  onOrder: () => void
  manageMode?: boolean
  onEdit?: () => void
  onToggleActive?: () => void
  isToggling?: boolean
}

export default function CatalogItemCard({
  item,
  onOrder,
  manageMode,
  onEdit,
  onToggleActive,
  isToggling,
}: CatalogItemCardProps) {
  const available = item.cr9b0_available ?? false
  const isActive = item.statecode === 0
  const categoryLabel =
    getFormattedValue(item, "cr9b0_category") ??
    (item.cr9b0_category !== undefined
      ? Cr9b0_catalogueitemscr9b0_category[item.cr9b0_category]
      : "Uncategorized")

  return (
    <div className={styles.catalogCard}>
      <div className={styles.catalogCardBody}>
        <span
          className={`${styles.availabilityPill} ${available && isActive ? styles.isAvailable : styles.isUnavailable}`}
        >
          {isActive ? (available ? "Available" : "Unavailable") : "Deactivated"}
        </span>
        <h3 className={styles.catalogCardTitle}>
          {item.cr9b0_itemname ?? "Untitled item"}
        </h3>
        <p className={styles.catalogCardCategory}>{categoryLabel}</p>
      </div>
      {manageMode ? (
        <div className={styles.catalogCardActions}>
          <BaseButton
            variant="secondary"
            size="sm"
            onClick={onEdit}
            disabled={isToggling}
          >
            Edit
          </BaseButton>
          <BaseButton
            variant="secondary"
            size="sm"
            onClick={onToggleActive}
            loading={isToggling}
          >
            {isToggling
              ? isActive
                ? "Deactivating…"
                : "Activating…"
              : isActive
                ? "Deactivate"
                : "Activate"}
          </BaseButton>
        </div>
      ) : (
        <BaseButton variant="primary" disabled={!available} onClick={onOrder}>
          Order
        </BaseButton>
      )}
    </div>
  )
}
