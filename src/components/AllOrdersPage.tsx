import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Cr9b0_internalordersService } from "@/generated/services/Cr9b0_internalordersService"
import type { Cr9b0_internalorderscr9b0_orderstatus } from "@/generated/models/Cr9b0_internalordersModel"
import { SystemusersService } from "@/generated/services/SystemusersService"
import type { Systemusers } from "@/generated/models/SystemusersModel"
import type { OrderRecord } from "@/types"
import { formatDate, getFormattedValue, getRawValue } from "@/types"
import Spinner from "./Spinner"
import styles from "./AllOrdersPage.module.css"
import shared from "@/styles/shared.module.css"

interface AllOrdersPageProps {
  refreshKey: number
}

const ORDER_STATUS_OPTIONS: Array<{
  value: Cr9b0_internalorderscr9b0_orderstatus
  label: string
}> = [
  { value: 930770000, label: "Submitted" },
  { value: 930770001, label: "Approved" },
  { value: 930770002, label: "In Progress" },
  { value: 930770003, label: "Ordered" },
  { value: 930770004, label: "Delivered" },
  { value: 930770005, label: "Denied" },
]

// The ownerid lookup bind is omitted from the generated Base type (Owner-type
// fields are excluded from Base entirely), so it has to be passed through a cast.
type OwnerBindPayload = { "ownerid@odata.bind": string }

export default function AllOrdersPage({ refreshKey }: AllOrdersPageProps) {
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [users, setUsers] = useState<Systemusers[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const [searchParams, setSearchParams] = useSearchParams()
  const statusFilter = searchParams.get("status") ?? "all"
  const assignedToFilter = searchParams.get("assignedTo") ?? "all"
  const dateFrom = searchParams.get("from") ?? ""
  const dateTo = searchParams.get("to") ?? ""

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
  Converting loadOrders to async/await trips the project's
  react-hooks/set-state-in-effect lint rule: it
  treats a setState sitting directly in a called
  function's body (even after an await) as a
  synchronous effect call, but specifically
  allowlists setState inside a
  .then()/.catch()/.finally() callback as the
  legitimate deferred case. Converting them would
  fail npm run lint
  */
  const loadOrders = useCallback(() => {
    const filterParts: string[] = []
    if (statusFilter !== "all")
      filterParts.push(`cr9b0_orderstatus eq ${statusFilter}`)
    if (assignedToFilter !== "all")
      filterParts.push(`_ownerid_value eq ${assignedToFilter}`)
    if (dateFrom)
      filterParts.push(`cr9b0_orderdate ge ${new Date(dateFrom).toISOString()}`)
    if (dateTo)
      filterParts.push(`cr9b0_orderdate le ${new Date(dateTo).toISOString()}`)

    return Cr9b0_internalordersService.getAll({
      filter: filterParts.length ? filterParts.join(" and ") : undefined,
      orderBy: ["cr9b0_orderdate desc"],
    })
      .then((result) => {
        if (result.success) {
          setOrders(result.data ?? [])
          setError(null)
        } else {
          setError(result.error?.message ?? "Failed to load orders.")
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load orders.")
      })
      .finally(() => setLoading(false))
  }, [statusFilter, assignedToFilter, dateFrom, dateTo])

  useEffect(() => {
    loadOrders()
  }, [loadOrders, refreshKey])

  useEffect(() => {
    let cancelled = false

    async function loadUsers() {
      try {
        const result = await SystemusersService.getAll({
          filter: "isdisabled eq false",
          orderBy: ["fullname asc"],
          select: ["systemuserid", "fullname"],
        })
        if (!cancelled && result.success) {
          setUsers(result.data ?? [])
        }
      } catch {
        // Assignee dropdown just stays empty; not critical enough to surface as a page error.
      }
    }

    loadUsers()

    return () => {
      cancelled = true
    }
  }, [])

  const userOptions = useMemo(
    () => users.filter((u) => u.systemuserid && u.fullname),
    [users],
  )

  async function handleStatusChange(order: OrderRecord, next: string) {
    setSavingId(order.cr9b0_internalorderid)
    try {
      const result = await Cr9b0_internalordersService.update(
        order.cr9b0_internalorderid,
        {
          cr9b0_orderstatus: Number(
            next,
          ) as Cr9b0_internalorderscr9b0_orderstatus,
        },
      )
      if (result.success) {
        await loadOrders()
      } else {
        setError(result.error?.message ?? "Failed to update order status.")
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update order status.",
      )
    } finally {
      setSavingId(null)
    }
  }

  async function handleAssignedToChange(
    order: OrderRecord,
    nextUserId: string,
  ) {
    setSavingId(order.cr9b0_internalorderid)
    try {
      const payload: OwnerBindPayload = {
        "ownerid@odata.bind": `/systemusers(${nextUserId})`,
      }
      const result = await Cr9b0_internalordersService.update(
        order.cr9b0_internalorderid,
        payload as never,
      )
      if (result.success) {
        await loadOrders()
      } else {
        setError(result.error?.message ?? "Failed to reassign order.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reassign order.")
    } finally {
      setSavingId(null)
    }
  }

  function clearFilters() {
    updateParams({ status: null, assignedTo: null, from: null, to: null })
  }

  return (
    <section>
      <div className={shared.pageHeader}>
        <h1>All Orders</h1>
        <p className={shared.pageSubtitle}>Every order across all requesters.</p>
      </div>

      <div className={shared.filterBar}>
        <select
          className={shared.filterSelect}
          value={statusFilter}
          onChange={(e) =>
            updateParams({
              status: e.target.value === "all" ? null : e.target.value,
            })
          }
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {ORDER_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className={shared.filterSelect}
          value={assignedToFilter}
          onChange={(e) =>
            updateParams({
              assignedTo: e.target.value === "all" ? null : e.target.value,
            })
          }
          aria-label="Filter by assigned to"
        >
          <option value="all">All assignees</option>
          {userOptions.map((u) => (
            <option key={u.systemuserid} value={u.systemuserid}>
              {u.fullname}
            </option>
          ))}
        </select>
        <input
          type="date"
          className={shared.filterSelect}
          value={dateFrom}
          onChange={(e) => updateParams({ from: e.target.value || null })}
          aria-label="Order date from"
        />
        <input
          type="date"
          className={shared.filterSelect}
          value={dateTo}
          onChange={(e) => updateParams({ to: e.target.value || null })}
          aria-label="Order date to"
        />
        {(statusFilter !== "all" ||
          assignedToFilter !== "all" ||
          dateFrom ||
          dateTo) && (
          <button
            type="button"
            className={`${shared.btn} ${shared.btnSecondary}`}
            onClick={clearFilters}
          >
            Clear filters
          </button>
        )}
      </div>

      {loading && (
        <p className={`${shared.stateMessage} ${shared.stateMessageLoading}`}>
          <Spinner /> Loading orders…
        </p>
      )}
      {!loading && error && (
        <p className={`${shared.stateMessage} ${shared.stateError}`}>{error}</p>
      )}
      {!loading && !error && orders.length === 0 && (
        <p className={shared.stateMessage}>No orders match your filters.</p>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className={shared.tableWrapper}>
          <table className={shared.ordersTable}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Order Date</th>
                <th>Needed By</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Ordered By</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.cr9b0_internalorderid}>
                  <td>
                    {order.cr9b0_orderid ||
                      order.cr9b0_internalorderid.slice(0, 8)}
                  </td>
                  <td>
                    {getFormattedValue(order, "_cr9b0_item_value") ?? "—"}
                  </td>
                  <td>{order.cr9b0_quantity ?? "—"}</td>
                  <td>{formatDate(order.cr9b0_orderdate)}</td>
                  <td>{formatDate(order.cr9b0_neededby)}</td>
                  <td>
                    <span className={styles.fieldLoading}>
                      <select
                        className={shared.filterSelect}
                        value={order.cr9b0_orderstatus ?? ""}
                        disabled={savingId === order.cr9b0_internalorderid}
                        onChange={(e) =>
                          handleStatusChange(order, e.target.value)
                        }
                        aria-label={`Status for order ${order.cr9b0_orderid ?? order.cr9b0_internalorderid}`}
                      >
                        {ORDER_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {savingId === order.cr9b0_internalorderid && (
                        <span className={styles.fieldSpinner}>
                          <Spinner size="sm" />
                        </span>
                      )}
                    </span>
                  </td>
                  <td>
                    <span className={styles.fieldLoading}>
                      <select
                        className={shared.filterSelect}
                        value={getRawValue(order, "_ownerid_value") ?? ""}
                        disabled={savingId === order.cr9b0_internalorderid}
                        onChange={(e) =>
                          handleAssignedToChange(order, e.target.value)
                        }
                        aria-label={`Assignee for order ${order.cr9b0_orderid ?? order.cr9b0_internalorderid}`}
                      >
                        {!getRawValue(order, "_ownerid_value") && (
                          <option value="">Unassigned</option>
                        )}
                        {userOptions.map((u) => (
                          <option key={u.systemuserid} value={u.systemuserid}>
                            {u.fullname}
                          </option>
                        ))}
                      </select>
                      {savingId === order.cr9b0_internalorderid && (
                        <span className={styles.fieldSpinner}>
                          <Spinner size="sm" />
                        </span>
                      )}
                    </span>
                  </td>
                  <td>{getFormattedValue(order, "_createdby_value") ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
