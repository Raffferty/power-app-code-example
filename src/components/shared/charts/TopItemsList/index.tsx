import { getCategoricalColors } from "../colors"
import { useTheme } from "@/hooks/useTheme"
import styles from "../charts.module.css"
import shared from "@/styles/shared.module.css"

interface TopItemsListProps {
  data: Array<{ label: string; value: number }>
}

export default function TopItemsList({ data }: TopItemsListProps) {
  const { resolvedTheme } = useTheme()
  // magnitude ranking of one entity type: single flat hue, not per-item identity
  const barColor = getCategoricalColors(resolvedTheme)[0]

  if (data.length === 0) {
    return <p className={shared.stateMessage}>No orders yet.</p>
  }

  const max = Math.max(1, ...data.map((d) => d.value))

  return (
    <div
      className={styles.hbarChart}
      role="img"
      aria-label="Top 5 most-ordered items by quantity"
    >
      {data.map((d, i) => {
        const pct = (d.value / max) * 100
        return (
          <div
            className={styles.hbarRow}
            key={d.label}
            title={`${d.label}: ${d.value}`}
          >
            <span className={`${styles.hbarLabel} ${styles.hbarLabelRanked}`}>
              <span className={styles.hbarRank}>{i + 1}</span>
              {d.label}
            </span>
            <div className={styles.hbarTrack}>
              <div
                className={styles.hbarFill}
                style={{ width: `${pct}%`, background: barColor }}
              />
            </div>
            <span className={styles.hbarValue}>{d.value}</span>
          </div>
        )
      })}
    </div>
  )
}
