import { useEffect, useMemo, useState } from "react"
import { Cr9b0_internalordersService } from "@/generated/services/Cr9b0_internalordersService"
import { Cr9b0_catalogueitemsService } from "@/generated/services/Cr9b0_catalogueitemsService"
import { Cr9b0_catalogueitemscr9b0_category } from "@/generated/models/Cr9b0_catalogueitemsModel"
import type { Cr9b0_catalogueitems } from "@/generated/models/Cr9b0_catalogueitemsModel"
import type { OrderRecord } from "@/types"
import { getFormattedValue } from "@/types"
import Spinner from "./Spinner"
import BarChart from "./charts/BarChart"
import DonutChart from "./charts/DonutChart"
import LineChart from "./charts/LineChart"
import TopItemsList from "./charts/TopItemsList"
import styles from "./ReportsPage.module.css"
import shared from "@/styles/shared.module.css"

const ORDER_STATUS_OPTIONS = [
  "Submitted",
  "Approved",
  "In Progress",
  "Ordered",
  "Delivered",
  "Denied",
] as const

const TIMELINE_DAYS = 30

export default function ReportsPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [catalogItems, setCatalogItems] = useState<Cr9b0_catalogueitems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadReportData() {
      try {
        const [ordersResult, itemsResult] = await Promise.all([
          Cr9b0_internalordersService.getAll({
            select: [
              "cr9b0_internalorderid",
              "cr9b0_orderstatus",
              "cr9b0_orderdate",
              "cr9b0_quantity",
              "_cr9b0_item_value",
            ],
          }),
          Cr9b0_catalogueitemsService.getAll({
            select: ["cr9b0_catalogueitemid", "cr9b0_category"],
          }),
        ])
        if (cancelled) return
        if (!ordersResult.success) {
          setError(ordersResult.error?.message ?? "Failed to load orders.")
          return
        }
        if (!itemsResult.success) {
          setError(
            itemsResult.error?.message ?? "Failed to load catalog items.",
          )
          return
        }
        setOrders(ordersResult.data ?? [])
        setCatalogItems(itemsResult.data ?? [])
        setError(null)
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load report data.",
          )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadReportData()

    return () => {
      cancelled = true
    }
  }, [])

  const statusData = useMemo(() => {
    const counts = new Map<string, number>(
      ORDER_STATUS_OPTIONS.map((s) => [s, 0]),
    )
    for (const order of orders) {
      const label = getFormattedValue(order, "cr9b0_orderstatus")
      if (label && counts.has(label)) {
        counts.set(label, (counts.get(label) ?? 0) + 1)
      }
    }
    return ORDER_STATUS_OPTIONS.map((label) => ({
      label,
      value: counts.get(label) ?? 0,
    }))
  }, [orders])

  const categoryData = useMemo(() => {
    const categoryById = new Map<string, string>()
    for (const item of catalogItems) {
      const label =
        item.cr9b0_category !== undefined
          ? Cr9b0_catalogueitemscr9b0_category[item.cr9b0_category]
          : undefined
      if (label) categoryById.set(item.cr9b0_catalogueitemid, label)
    }
    const counts = new Map<string, number>()
    for (const order of orders) {
      const itemId = order._cr9b0_item_value
      const label = itemId ? categoryById.get(itemId) : undefined
      if (!label) continue
      counts.set(label, (counts.get(label) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
  }, [orders, catalogItems])

  const timelineData = useMemo(() => {
    const days: Array<{ key: string; label: string; value: number }> = []
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    for (let i = TIMELINE_DAYS - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      days.push({
        key: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        value: 0,
      })
    }
    const byKey = new Map(days.map((d) => [d.key, d]))
    for (const order of orders) {
      if (!order.cr9b0_orderdate) continue
      const key = order.cr9b0_orderdate.slice(0, 10)
      const bucket = byKey.get(key)
      if (bucket) bucket.value += 1
    }
    return days
  }, [orders])

  const topItems = useMemo(() => {
    const totals = new Map<string, { label: string; value: number }>()
    for (const order of orders) {
      const itemId = order._cr9b0_item_value
      if (!itemId) continue
      const label =
        getFormattedValue(order, "_cr9b0_item_value") ?? "Unknown item"
      const quantity = order.cr9b0_quantity ?? 0
      const existing = totals.get(itemId)
      if (existing) {
        existing.value += quantity
      } else {
        totals.set(itemId, { label, value: quantity })
      }
    }
    return Array.from(totals.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [orders])

  return (
    <section>
      <div className={shared.pageHeader}>
        <h1>Reports</h1>
        <p className={shared.pageSubtitle}>
          A snapshot of order activity across the organisation.
        </p>
      </div>

      {loading && (
        <p className={`${shared.stateMessage} ${shared.stateMessageLoading}`}>
          <Spinner /> Loading reports…
        </p>
      )}
      {!loading && error && (
        <p className={`${shared.stateMessage} ${shared.stateError}`}>{error}</p>
      )}

      {!loading && !error && (
        <div className={styles.reportsGrid}>
          <div className={styles.reportCard}>
            <h2 className={styles.reportCardTitle}>Total orders by status</h2>
            <BarChart data={statusData} ariaLabel="Total orders by status" />
          </div>

          <div className={styles.reportCard}>
            <h2 className={styles.reportCardTitle}>Orders by category</h2>
            <DonutChart data={categoryData} ariaLabel="Orders by category" />
          </div>

          <div className={`${styles.reportCard} ${styles.reportCardWide}`}>
            <h2 className={styles.reportCardTitle}>
              Orders over time (last 30 days)
            </h2>
            <LineChart
              data={timelineData}
              ariaLabel="Orders over time, last 30 days"
            />
          </div>

          <div className={styles.reportCard}>
            <h2 className={styles.reportCardTitle}>Top 5 most-ordered items</h2>
            <TopItemsList data={topItems} />
          </div>
        </div>
      )}
    </section>
  )
}
