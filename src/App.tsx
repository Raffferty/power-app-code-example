import { useEffect, useState } from "react"
import { Navigate, Route, Routes, useLocation } from "react-router-dom"
import styles from "./App.module.css"
import shared from "./styles/shared.module.css"
import Header from "./components/Header"
import Sidebar from "./components/Sidebar"
import CatalogPage from "./components/CatalogPage"
import MyOrdersPage from "./components/MyOrdersPage"
import AllOrdersPage from "./components/AllOrdersPage"
import ReportsPage from "./components/ReportsPage"
import Toast from "./components/Toast"
import ProtectedRoute from "./components/ProtectedRoute"
import { useCurrentUser } from "./hooks/useCurrentUser"
import { useSecurityContext } from "./hooks/useSecurityContext"

// The player embeds this app in an iframe with a fixed src, so a reload of the
// player page recreates the iframe from that fixed URL and wipes the hash —
// sessionStorage (scoped to this origin, survives the iframe being torn down
// and recreated on reload) is what actually makes the last page/filters durable.
const LAST_PATH_KEY = "supplyhub:lastPath"

function RootRedirect() {
  const lastPath = sessionStorage.getItem(LAST_PATH_KEY)
  return <Navigate to={lastPath || "/catalog"} replace />
}

export default function App() {
  const { user, loading: userLoading, error: userError } = useCurrentUser()
  const {
    loading: roleLoading,
    error: roleError,
    isOrderAdmin,
    hasAccess,
    systemUserId,
  } = useSecurityContext()
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0)
  const location = useLocation()

  useEffect(() => {
    if (location.pathname === "/") return
    sessionStorage.setItem(LAST_PATH_KEY, location.pathname + location.search)
  }, [location])

  function handleOrderSubmitted() {
    setToastMessage("Order submitted successfully.")
    setOrdersRefreshKey((key) => key + 1)
  }

  const loading = userLoading || roleLoading
  const error = userError ?? roleError

  if (loading) {
    return (
      <div className={`${styles.appShell} ${styles.appShellCentered}`}>
        <p className={shared.stateMessage}>Loading Supply Hub…</p>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className={`${styles.appShell} ${styles.appShellCentered}`}>
        <p className={`${shared.stateMessage} ${shared.stateError}`}>
          {error ?? "Unable to load the current user."}
        </p>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className={`${styles.appShell} ${styles.appShellCentered}`}>
        <div className={styles.accessDenied}>
          <span className={styles.accessDeniedIcon} aria-hidden="true">
            🔒
          </span>
          <h1>Access Denied</h1>
          <p>
            Please contact your administrator to request access to Supply Hub.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.appShell}>
      <Header userName={user.fullName} />
      <div className={styles.appBody}>
        <Sidebar isOrderAdmin={isOrderAdmin} />
        <main className={styles.appContent}>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route
              path="/catalog"
              element={
                <CatalogPage
                  onOrderSubmitted={handleOrderSubmitted}
                  isOrderAdmin={isOrderAdmin}
                  currentUserEmail={user.userPrincipalName ?? ""}
                  onNotify={setToastMessage}
                />
              }
            />
            <Route
              path="/orders"
              element={
                <MyOrdersPage
                  currentSystemUserId={systemUserId ?? ""}
                  refreshKey={ordersRefreshKey}
                />
              }
            />
            <Route
              path="/all-orders"
              element={
                <ProtectedRoute allowed={isOrderAdmin} redirectTo="/catalog">
                  <AllOrdersPage refreshKey={ordersRefreshKey} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowed={isOrderAdmin} redirectTo="/catalog">
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/catalog" replace />} />
          </Routes>
        </main>
      </div>
      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}
    </div>
  )
}
