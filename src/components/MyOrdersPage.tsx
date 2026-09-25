import { useEffect, useState } from "react"
import { Cr9b0_internalordersService } from "@/generated/services/Cr9b0_internalordersService"
import type { OrderRecord } from "@/types"
import { formatDate, getFormattedValue } from "@/types"
import Spinner from "./Spinner"
import StatusBadge from "./StatusBadge"
import shared from "@/styles/shared.module.css"

interface MyOrdersPageProps {
  currentSystemUserId: string
  refreshKey: number
}

export default function MyOrdersPage({
  currentSystemUserId,
  refreshKey,
}: MyOrdersPageProps) {
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentSystemUserId) return

    let cancelled = false

    // "Ordered By" has no dedicated column on this table; createdby is set by
    // Dataverse to the authenticated creator, so it stands in for "my orders".
    async function loadOrders() {
      try {
        const result = await Cr9b0_internalordersService.getAll({
          filter: `_createdby_value eq ${currentSystemUserId}`,
          orderBy: ["cr9b0_orderdate desc"],
        })
        if (cancelled) return
        if (result.success) {
          setOrders(result.data ?? [])
          setError(null)
        } else {
          setError(result.error?.message ?? "Failed to load your orders.")
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load your orders.",
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadOrders()

    return () => {
      cancelled = true
    }
  }, [currentSystemUserId, refreshKey])

  return (
    <section>
      <div className={shared.pageHeader}>
        <h1>My Orders</h1>
        <p className={shared.pageSubtitle}>
          Track the status of the orders you've submitted.
        </p>
      </div>

      {loading && (
        <p className={`${shared.stateMessage} ${shared.stateMessageLoading}`}>
          <Spinner /> Loading your orders…
        </p>
      )}
      {!loading && error && (
        <p className={`${shared.stateMessage} ${shared.stateError}`}>{error}</p>
      )}
      {!loading && !error && orders.length === 0 && (
        <p className={shared.stateMessage}>You haven't submitted any orders yet.</p>
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
                    <StatusBadge
                      status={getFormattedValue(order, "cr9b0_orderstatus")}
                    />
                  </td>
                  <td>
                    {getFormattedValue(order, "_ownerid_value") ?? "Unassigned"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
