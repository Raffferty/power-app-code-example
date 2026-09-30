import type { CSSProperties } from "react"
import { NavLink } from "react-router-dom"
import { BarChart3, ClipboardList, FolderOpen, Package } from "lucide-react"
import { useTheme } from "@/hooks/useTheme"
import { getCategoricalColors } from "@/components/shared/charts/colors"
import styles from "./Sidebar.module.css"

interface SidebarProps {
  isOrderAdmin: boolean
}

const NAV_ITEMS: Array<{
  to: string
  icon: typeof FolderOpen
  label: string
  adminOnly?: boolean
}> = [
  { to: "/catalog", icon: FolderOpen, label: "Catalog" },
  { to: "/orders", icon: Package, label: "My Orders" },
  {
    to: "/all-orders",
    icon: ClipboardList,
    label: "All Orders",
    adminOnly: true,
  },
  { to: "/reports", icon: BarChart3, label: "Reports", adminOnly: true },
]

export default function Sidebar({ isOrderAdmin }: SidebarProps) {
  const { resolvedTheme } = useTheme()
  const colors = getCategoricalColors(resolvedTheme)

  return (
    <nav className={styles.sidebar} aria-label="Primary">
      {NAV_ITEMS.filter((item) => !item.adminOnly || isOrderAdmin).map(
        (item, index) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.sidebarLink} ${isActive ? styles.active : ""}`
            }
          >
            <item.icon
              className={styles.sidebarIcon}
              size={18}
              aria-hidden="true"
              style={{ "--icon-color": colors[index] } as CSSProperties}
            />
            {item.label}
          </NavLink>
        ),
      )}
    </nav>
  )
}
