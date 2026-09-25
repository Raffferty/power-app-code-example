import { STATUS_BADGE_COLOR } from "@/types"
import styles from "./StatusBadge.module.css"

interface StatusBadgeProps {
  status?: string
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const color = status ? STATUS_BADGE_COLOR[status] ?? "gray" : "gray"
  return (
    <span className={`${styles.statusBadge} ${styles[color]}`}>
      {status ?? "Unknown"}
    </span>
  )
}
