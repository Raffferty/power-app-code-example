import { NavLink } from "react-router-dom"
import styles from "./Sidebar.module.css"

interface SidebarProps {
  isOrderAdmin: boolean
}

const NAV_ITEMS: Array<{
  to: string
  icon: string
  label: string
  adminOnly?: boolean
}> = [
  { to: "/catalog", icon: "🗂️", label: "Catalog" },
  { to: "/orders", icon: "📦", label: "My Orders" },
  { to: "/all-orders", icon: "📋", label: "All Orders", adminOnly: true },
  { to: "/reports", icon: "📊", label: "Reports", adminOnly: true },
]

export default function Sidebar({ isOrderAdmin }: SidebarProps) {
  return (
    <nav className={styles.sidebar} aria-label="Primary">
      {NAV_ITEMS.filter((item) => !item.adminOnly || isOrderAdmin).map(
        (item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.sidebarLink} ${isActive ? styles.active : ""}`
            }
          >
            <span className={styles.sidebarIcon} aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ),
      )}
    </nav>
  )
}
