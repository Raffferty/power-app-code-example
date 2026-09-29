import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import type { Cr9b0_catalogueitems } from "@/generated/models/Cr9b0_catalogueitemsModel"
import { Cr9b0_catalogueitemscr9b0_category } from "@/generated/models/Cr9b0_catalogueitemsModel"
import { Cr9b0_catalogueitemsService } from "@/generated/services/Cr9b0_catalogueitemsService"
import { SendnotificationService } from "@/generated/services/SendnotificationService"
import CatalogItemCard from "@/components/CatalogItemCard"
import CatalogItemModal from "@/components/CatalogItemModal"
import OrderModal from "@/components/OrderModal"
import Spinner from "@/components/Spinner"
import styles from "./CatalogPage.module.css"
import shared from "@/styles/shared.module.css"

interface CatalogPageProps {
  onOrderSubmitted: () => void
  isOrderAdmin: boolean
  currentUserEmail: string
  onNotify: (message: string) => void
}

export default function CatalogPage({
  onOrderSubmitted,
  isOrderAdmin,
  currentUserEmail,
  onNotify,
}: CatalogPageProps) {
  const [items, setItems] = useState<Cr9b0_catalogueitems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orderingItem, setOrderingItem] = useState<Cr9b0_catalogueitems | null>(
    null,
  )
  const [editingItem, setEditingItem] = useState<Cr9b0_catalogueitems | null>(
    null,
  )
  const [creatingItem, setCreatingItem] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get("q") ?? ""
  const category = searchParams.get("category") ?? "all"
  const manageMode = searchParams.get("manage") === "1"

  function updateParams(updates: Record<string, string | null>) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(updates)) {
          if (value === null || value === "") {
            next.delete(key)
          } else {
            next.set(key, value)
          }
        }
        return next
      },
      { replace: true },
    )
  }

  /*
  Converting loadItems to async/await trips the project's
  react-hooks/set-state-in-effect lint rule: it
  treats a setState sitting directly in a called
  function's body (even after an await) as a
  synchronous effect call, but specifically
  allowlists setState inside a
  .then()/.catch()/.finally() callback as the
  legitimate deferred case. Converting them would
  fail npm run lint
  */
  const loadItems = useCallback(() => {
    return Cr9b0_catalogueitemsService.getAll({
      filter: manageMode ? undefined : "statecode eq 0",
      orderBy: ["cr9b0_itemname asc"],
    })
      .then((result) => {
        if (result.success) {
          setItems(result.data ?? [])
          setError(null)
        } else {
          setError(result.error?.message ?? "Failed to load catalog items.")
        }
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "Failed to load catalog items.",
        )
      })
      .finally(() => setLoading(false))
  }, [manageMode])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    return items.filter((item) => {
      const matchesTerm =
        !term || (item.cr9b0_itemname ?? "").toLowerCase().includes(term)
      const matchesCategory =
        category === "all" || String(item.cr9b0_category) === category
      return matchesTerm && matchesCategory
    })
  }, [items, search, category])

  // The catalog item update has already succeeded by the time this runs, so a
  // failed notification shouldn't be reported as a failed item update.
  async function notifyToggle(item: Cr9b0_catalogueitems, activating: boolean) {
    try {
      const notifyResult = await SendnotificationService.Run({
        text: currentUserEmail,
        text_1: `"${item.cr9b0_itemname}" Item in Catalog was ${activating ? "activated" : "deactivated"}.`,
      })
      if (notifyResult.success && notifyResult.data?.message) {
        onNotify(notifyResult.data.message)
      }
    } catch {
      // Ignore notification failures.
    }
  }

  async function handleToggleActive(item: Cr9b0_catalogueitems) {
    const activating = item.statecode !== 0
    setTogglingId(item.cr9b0_catalogueitemid)
    try {
      const result = await Cr9b0_catalogueitemsService.update(
        item.cr9b0_catalogueitemid,
        {
          statecode: activating ? 0 : 1,
          statuscode: activating ? 1 : 2,
        },
      )
      if (result.success) {
        await loadItems()
        await notifyToggle(item, activating)
      } else {
        setError(result.error?.message ?? "Failed to update the catalog item.")
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update the catalog item.",
      )
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <section>
      <div className={`${shared.pageHeader} ${shared.pageHeaderRow}`}>
        <div>
          <h1>Catalog</h1>
          <p className={shared.pageSubtitle}>
            {manageMode
              ? "Create, edit, and deactivate catalog items."
              : "Browse available items and submit a new order."}
          </p>
        </div>
        {isOrderAdmin && (
          <div className={shared.pageHeaderActions}>
            {manageMode && (
              <button
                type="button"
                className={`${shared.btn} ${shared.btnPrimary}`}
                onClick={() => setCreatingItem(true)}
              >
                + Add Item
              </button>
            )}
            <button
              type="button"
              className={`${shared.btn} ${manageMode ? shared.btnPrimary : shared.btnSecondary}`}
              onClick={() => updateParams({ manage: manageMode ? null : "1" })}
            >
              {manageMode ? "Done Managing" : "Manage"}
            </button>
          </div>
        )}
      </div>

      <div className={shared.filterBar}>
        <input
          type="search"
          className={shared.filterSearch}
          placeholder="Search by item name…"
          value={search}
          onChange={(e) => updateParams({ q: e.target.value || null })}
          aria-label="Search catalog by item name"
        />
        <select
          className={shared.filterSelect}
          value={category}
          onChange={(e) =>
            updateParams({
              category: e.target.value === "all" ? null : e.target.value,
            })
          }
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {Object.entries(Cr9b0_catalogueitemscr9b0_category).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ),
          )}
        </select>
      </div>

      {loading && (
        <p className={`${shared.stateMessage} ${shared.stateMessageLoading}`}>
          <Spinner /> Loading catalog…
        </p>
      )}
      {!loading && error && (
        <p className={`${shared.stateMessage} ${shared.stateError}`}>{error}</p>
      )}
      {!loading && !error && filteredItems.length === 0 && (
        <p className={shared.stateMessage}>
          No catalog items match your filters.
        </p>
      )}

      {!loading && !error && filteredItems.length > 0 && (
        <div className={styles.catalogGrid}>
          {filteredItems.map((item) => (
            <CatalogItemCard
              key={item.cr9b0_catalogueitemid}
              item={item}
              onOrder={() => setOrderingItem(item)}
              manageMode={manageMode}
              onEdit={() => setEditingItem(item)}
              onToggleActive={() => handleToggleActive(item)}
              isToggling={togglingId === item.cr9b0_catalogueitemid}
            />
          ))}
        </div>
      )}

      {orderingItem && (
        <OrderModal
          item={orderingItem}
          onClose={() => setOrderingItem(null)}
          onSuccess={() => {
            setOrderingItem(null)
            onOrderSubmitted()
          }}
        />
      )}

      {(creatingItem || editingItem) && (
        <CatalogItemModal
          item={editingItem}
          onClose={() => {
            setCreatingItem(false)
            setEditingItem(null)
          }}
          onSuccess={() => {
            setCreatingItem(false)
            setEditingItem(null)
            loadItems()
          }}
        />
      )}
    </section>
  )
}
