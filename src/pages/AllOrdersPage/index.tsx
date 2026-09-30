import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import Select from "react-select"
import { Cr9b0_internalordersService } from "@/generated/services/Cr9b0_internalordersService"
import type { Cr9b0_internalorderscr9b0_orderstatus } from "@/generated/models/Cr9b0_internalordersModel"
import { SystemusersService } from "@/generated/services/SystemusersService"
import type { Systemusers } from "@/generated/models/SystemusersModel"
import type { OrderRecord } from "@/types"
import { formatDate, getFormattedValue, getRawValue } from "@/types"
import BaseButton from "@/components/base/BaseButton"
import BaseInput from "@/components/base/BaseInput"
import Spinner from "@/components/shared/Spinner"
import Pagination from "@/components/shared/Pagination"
import { scrollToTop } from "@/helpers/scrollToTop"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { selectStyles, type SelectOption } from "@/styles/reactSelectStyles"
import styles from "./AllOrdersPage.module.css"
import shared from "@/styles/shared.module.css"

interface AllOrdersPageProps {
  refreshKey: number
}

const PAGE_SIZE = 15

// Dataverse's Web API doesn't support OData $skip on entity-set queries -- paging is
// forward-only via a $skiptoken (returned as `skipToken` on the result). This map tracks,
// for each page number reached so far, the skiptoken needed to fetch it (page 1 needs none).
// It's a ref (not state) since it's only read/written from event handlers and effects, never
// rendered directly, and mutating it shouldn't itself trigger a re-render.
type PageTokenMap = Record<number, string>

const PAGE_TOKENS_STORAGE_KEY = "supplyhub:allOrdersPageTokens"

function readStoredPageTokens(): PageTokenMap {
  try {
    const raw = sessionStorage.getItem(PAGE_TOKENS_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PageTokenMap) : {}
  } catch {
    return {}
  }
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

const ORDER_STATUS_SELECT_OPTIONS: SelectOption[] = ORDER_STATUS_OPTIONS.map(
  (opt) => ({ value: String(opt.value), label: opt.label }),
)

const STATUS_FILTER_OPTIONS: SelectOption[] = [
  { value: "all", label: "All statuses" },
  ...ORDER_STATUS_SELECT_OPTIONS,
]

// The ownerid lookup bind is omitted from the generated Base type (Owner-type
// fields are excluded from Base entirely), so it has to be passed through a cast.
type OwnerBindPayload = { "ownerid@odata.bind": string }

export default function AllOrdersPage({ refreshKey }: AllOrdersPageProps) {
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [users, setUsers] = useState<Systemusers[]>([])
  const [loading, setLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(false)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingCell, setSavingCell] = useState<{
    orderId: string
    field: "status" | "assignedTo"
  } | null>(null)

  const [searchParams, setSearchParams] = useSearchParams()
  const statusFilter = searchParams.get("status") ?? "all"
  const assignedToFilter = searchParams.get("assignedTo") ?? "all"
  const dateFrom = searchParams.get("from") ?? ""
  const dateTo = searchParams.get("to") ?? ""
  const orderIdFilter = searchParams.get("orderId") ?? ""
  const [orderIdInput, setOrderIdInput] = useState(orderIdFilter)
  const debouncedOrderIdInput = useDebouncedValue(orderIdInput, 400)
  const pageParam = Number(searchParams.get("page") ?? "1")
  const page =
    Number.isFinite(pageParam) && pageParam >= 1 ? Math.floor(pageParam) : 1

  const pageTokensRef = useRef<PageTokenMap>(readStoredPageTokens())
  const initialPageRef = useRef(page)
  // Tracks the filter/refreshKey signature this effect last acted on, rather than a
  // one-shot boolean -- React StrictMode replays the mount effect a second time with
  // identical deps, and a plain "ranOnce" flag would already be flipped by then, making
  // the replay take the "filters changed" branch and wrongly reset to page 1. Comparing
  // against the last-processed signature makes the replay a no-op (same signature) while
  // still detecting a genuine filter change (different signature) later.
  const lastEffectSignatureRef = useRef<string | null>(null)

  function persistPageTokens() {
    try {
      sessionStorage.setItem(
        PAGE_TOKENS_STORAGE_KEY,
        JSON.stringify(pageTokensRef.current),
      )
    } catch {
      // sessionStorage unavailable (private mode / quota) -- pagination still
      // works within the session, it just won't survive an iframe reload.
    }
  }

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
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
    },
    [setSearchParams],
  )

  // Reflect the debounced input into the URL param that actually drives the
  // Dataverse query (only once it settles, not on every keystroke).
  useEffect(() => {
    if (debouncedOrderIdInput.trim() === orderIdFilter) return
    updateParams({ orderId: debouncedOrderIdInput.trim() || null })
  }, [debouncedOrderIdInput, orderIdFilter, updateParams])

  /*
  Converting loadPage to async/await trips the project's
  react-hooks/set-state-in-effect lint rule: it
  treats a setState sitting directly in a called
  function's body (even after an await) as a
  synchronous effect call, but specifically
  allowlists setState inside a
  .then()/.catch()/.finally() callback as the
  legitimate deferred case. Converting them would
  fail npm run lint
  */
  const loadPage = useCallback(
    (
      targetPage: number,
      token: string | undefined,
      busySetter: (busy: boolean) => void,
    ) => {
      const filterParts: string[] = []
      if (statusFilter !== "all")
        filterParts.push(`cr9b0_orderstatus eq ${statusFilter}`)
      if (assignedToFilter !== "all")
        filterParts.push(`_ownerid_value eq ${assignedToFilter}`)
      if (dateFrom)
        filterParts.push(
          `cr9b0_orderdate ge ${new Date(dateFrom).toISOString()}`,
        )
      if (dateTo)
        filterParts.push(`cr9b0_orderdate le ${new Date(dateTo).toISOString()}`)
      if (orderIdFilter)
        filterParts.push(
          `contains(cr9b0_orderid,'${orderIdFilter.replace(/'/g, "''")}')`,
        )

      return Cr9b0_internalordersService.getAll({
        filter: filterParts.length ? filterParts.join(" and ") : undefined,
        orderBy: ["cr9b0_orderdate desc"],
        maxPageSize: PAGE_SIZE,
        skipToken: token,
      })
        .then((result) => {
          if (result.success) {
            setOrders(result.data ?? [])
            setError(null)
            setHasNextPage(Boolean(result.skipToken))

            if (result.skipToken) {
              pageTokensRef.current[targetPage + 1] = result.skipToken
            } else {
              delete pageTokensRef.current[targetPage + 1]
            }

            persistPageTokens()
          } else {
            setError(result.error?.message ?? "Failed to load orders.")
          }
        })
        .catch((err: unknown) => {
          setError(
            err instanceof Error ? err.message : "Failed to load orders.",
          )
        })
        .finally(() => busySetter(false))
    },
    [statusFilter, assignedToFilter, dateFrom, dateTo, orderIdFilter],
  )

  // loadPage/updateParams are read via refs (not listed as effect deps) so this
  // effect only re-runs when the filters/refreshKey actually change -- their
  // identity can churn on every render (e.g. if setSearchParams isn't referentially
  // stable), which would otherwise re-trigger the "filters changed" reset branch
  // on every navigation, including the page-only navigation from goToPage itself.
  const loadPageRef = useRef(loadPage)
  const updateParamsRef = useRef(updateParams)
  useEffect(() => {
    loadPageRef.current = loadPage
    updateParamsRef.current = updateParams
  })

  useEffect(() => {
    const signature = JSON.stringify([
      statusFilter,
      assignedToFilter,
      dateFrom,
      dateTo,
      orderIdFilter,
      refreshKey,
    ])
    const isMountOrReplay =
      lastEffectSignatureRef.current === null ||
      lastEffectSignatureRef.current === signature
    lastEffectSignatureRef.current = signature

    if (isMountOrReplay) {
      const initialPage = initialPageRef.current
      const storedToken =
        initialPage > 1 ? pageTokensRef.current[initialPage] : undefined
      if (initialPage > 1 && !storedToken) {
        // Restored ?page=N with no matching skiptoken (sessionStorage was cleared,
        // or the page/token got out of sync some other way) -- self-heal to page 1
        // rather than erroring, same as the "no direct page jump" constraint itself.
        updateParamsRef.current({ page: null })
        loadPageRef.current(1, undefined, setLoading)
      } else {
        loadPageRef.current(initialPage, storedToken, setLoading)
      }
      return
    }

    // Filters (or refreshKey) genuinely changed -- a skiptoken is only valid for the
    // exact filter/sort combination it came from, so reset to page 1 and drop the stack.
    pageTokensRef.current = {}
    persistPageTokens()
    updateParamsRef.current({ page: null })
    loadPageRef.current(1, undefined, setLoading)
  }, [statusFilter, assignedToFilter, dateFrom, dateTo, orderIdFilter, refreshKey])

  function goToPage(nextPage: number, token: string | undefined) {
    setPageLoading(true)
    updateParams({ page: nextPage === 1 ? null : String(nextPage) })
    loadPage(nextPage, token, setPageLoading).then(scrollToTop)
  }

  function handleFirst() {
    if (page === 1) return
    goToPage(1, undefined)
  }

  function handlePrevious() {
    if (page <= 1) return
    goToPage(page - 1, pageTokensRef.current[page - 1])
  }

  function handleNext() {
    if (!hasNextPage) return
    goToPage(page + 1, pageTokensRef.current[page + 1])
  }

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

  const userSelectOptions: SelectOption[] = useMemo(
    () =>
      userOptions.map((u) => ({
        value: u.systemuserid,
        label: u.fullname ?? "",
      })),
    [userOptions],
  )

  const assignedToFilterOptions: SelectOption[] = useMemo(
    () => [{ value: "all", label: "All assignees" }, ...userSelectOptions],
    [userSelectOptions],
  )

  useEffect(() => {
    return () => {
      sessionStorage.removeItem(PAGE_TOKENS_STORAGE_KEY)
    }
  }, [])

  async function handleStatusChange(order: OrderRecord, next: string) {
    setSavingCell({ orderId: order.cr9b0_internalorderid, field: "status" })
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
        // Re-fetch the current page in place -- this is a targeted single-row
        // edit, not a filter change, so it shouldn't bounce the admin back to page 1.
        await loadPage(
          page,
          page > 1 ? pageTokensRef.current[page] : undefined,
          () => {},
        )
      } else {
        setError(result.error?.message ?? "Failed to update order status.")
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update order status.",
      )
    } finally {
      setSavingCell(null)
    }
  }

  async function handleAssignedToChange(
    order: OrderRecord,
    nextUserId: string,
  ) {
    setSavingCell({ orderId: order.cr9b0_internalorderid, field: "assignedTo" })
    try {
      const payload: OwnerBindPayload = {
        "ownerid@odata.bind": `/systemusers(${nextUserId})`,
      }
      const result = await Cr9b0_internalordersService.update(
        order.cr9b0_internalorderid,
        payload as never,
      )
      if (result.success) {
        await loadPage(
          page,
          page > 1 ? pageTokensRef.current[page] : undefined,
          () => {},
        )
      } else {
        setError(result.error?.message ?? "Failed to reassign order.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reassign order.")
    } finally {
      setSavingCell(null)
    }
  }

  function clearFilters() {
    setOrderIdInput("")
    updateParams({
      status: null,
      assignedTo: null,
      from: null,
      to: null,
      orderId: null,
    })
  }

  return (
    <section>
      <div className={shared.pageHeader}>
        <div className={styles.clearFiltersWrapper}>
          <div>
            <h1>All Orders</h1>

            <p className={shared.pageSubtitle}>
              Every order across all requesters.
            </p>
          </div>

          {(statusFilter !== "all" ||
            assignedToFilter !== "all" ||
            dateFrom ||
            dateTo ||
            orderIdFilter) && (
            <BaseButton variant="secondary" onClick={clearFilters}>
              Clear filters
            </BaseButton>
          )}
        </div>
      </div>

      <div className={styles.filterGrid}>
        <BaseInput
          type="search"
          className={styles.orderIdSearch}
          placeholder="Search by order ID…"
          value={orderIdInput}
          onChange={(e) => setOrderIdInput(e.target.value)}
          aria-label="Search by order ID"
        />

        <Select<SelectOption>
          className={shared.filterSelectWrapper}
          classNamePrefix="rs"
          styles={selectStyles}
          menuPortalTarget={document.body}
          isSearchable={false}
          options={STATUS_FILTER_OPTIONS}
          value={
            STATUS_FILTER_OPTIONS.find((opt) => opt.value === statusFilter) ??
            STATUS_FILTER_OPTIONS[0]
          }
          onChange={(option) =>
            updateParams({
              status: !option || option.value === "all" ? null : option.value,
            })
          }
          aria-label="Filter by status"
        />
        <Select<SelectOption>
          className={shared.filterSelectWrapper}
          classNamePrefix="rs"
          styles={selectStyles}
          menuPortalTarget={document.body}
          options={assignedToFilterOptions}
          value={
            assignedToFilterOptions.find(
              (opt) => opt.value === assignedToFilter,
            ) ?? assignedToFilterOptions[0]
          }
          onChange={(option) =>
            updateParams({
              assignedTo:
                !option || option.value === "all" ? null : option.value,
            })
          }
          aria-label="Filter by assigned to"
        />

        <BaseInput
          type="date"
          className={shared.filterSelect}
          value={dateFrom}
          max={dateTo || new Date().toLocaleDateString("en-CA")}
          onChange={(e) => updateParams({ from: e.target.value || null })}
          aria-label="Order date from"
          helperText="Date from:"
        />

        <BaseInput
          type="date"
          className={shared.filterSelect}
          value={dateTo}
          min={dateFrom || undefined}
          max={new Date().toLocaleDateString("en-CA")}
          onChange={(e) => updateParams({ to: e.target.value || null })}
          aria-label="Order date to"
          helperText="Date to:"
        />
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
                    <Select<SelectOption>
                      className={styles.statusSelect}
                      classNamePrefix="rs"
                      styles={selectStyles}
                      menuPortalTarget={document.body}
                      isSearchable={false}
                      isLoading={
                        savingCell?.orderId === order.cr9b0_internalorderid &&
                        savingCell.field === "status"
                      }
                      isDisabled={
                        savingCell?.orderId === order.cr9b0_internalorderid &&
                        savingCell.field === "status"
                      }
                      options={ORDER_STATUS_SELECT_OPTIONS}
                      value={
                        ORDER_STATUS_SELECT_OPTIONS.find(
                          (opt) =>
                            opt.value === String(order.cr9b0_orderstatus ?? ""),
                        ) ?? null
                      }
                      onChange={(option) =>
                        option && handleStatusChange(order, option.value)
                      }
                      aria-label={`Status for order ${order.cr9b0_orderid ?? order.cr9b0_internalorderid}`}
                    />
                  </td>
                  <td>
                    <Select<SelectOption>
                      className={styles.assignedToSelect}
                      classNamePrefix="rs"
                      styles={selectStyles}
                      menuPortalTarget={document.body}
                      isSearchable={false}
                      isLoading={
                        savingCell?.orderId === order.cr9b0_internalorderid &&
                        savingCell.field === "assignedTo"
                      }
                      isDisabled={
                        savingCell?.orderId === order.cr9b0_internalorderid &&
                        savingCell.field === "assignedTo"
                      }
                      options={
                        getRawValue(order, "_ownerid_value")
                          ? userSelectOptions
                          : [
                              { value: "", label: "Unassigned" },
                              ...userSelectOptions,
                            ]
                      }
                      value={
                        [
                          { value: "", label: "Unassigned" },
                          ...userSelectOptions,
                        ].find(
                          (opt) =>
                            opt.value ===
                            (getRawValue(order, "_ownerid_value") ?? ""),
                        ) ?? null
                      }
                      onChange={(option) =>
                        option && handleAssignedToChange(order, option.value)
                      }
                      aria-label={`Assignee for order ${order.cr9b0_orderid ?? order.cr9b0_internalorderid}`}
                    />
                  </td>
                  <td>{getFormattedValue(order, "_createdby_value") ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <Pagination
          page={page}
          hasNextPage={hasNextPage}
          pageLoading={pageLoading}
          onFirst={handleFirst}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      )}
    </section>
  )
}
