import type { Cr9b0_catalogueitems } from "@/generated/models/Cr9b0_catalogueitemsModel"
import { Cr9b0_catalogueitemscr9b0_category } from "@/generated/models/Cr9b0_catalogueitemsModel"
import { getFormattedValue } from "@/types"
import Spinner from "./Spinner"
import styles from "./CatalogItemCard.module.css"
import shared from "@/styles/shared.module.css"

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
          <button
            type="button"
            className={`${shared.btn} ${shared.btnSecondary} ${styles.actionBtn}`}
            onClick={onEdit}
            disabled={isToggling}
          >
            Edit
          </button>
          <button
            type="button"
            className={`${shared.btn} ${shared.btnSecondary} ${styles.actionBtn}`}
            onClick={onToggleActive}
            disabled={isToggling}
          >
            {isToggling && <Spinner size="sm" />}
            {isToggling
              ? isActive
                ? "Deactivating…"
                : "Activating…"
              : isActive
                ? "Deactivate"
                : "Activate"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={`${shared.btn} ${shared.btnPrimary}`}
          disabled={!available}
          onClick={onOrder}
        >
          Order
        </button>
      )}
    </div>
  )
}
