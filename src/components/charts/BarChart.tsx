import { CATEGORICAL_COLORS } from "./colors"
import styles from "./charts.module.css"

interface BarChartProps {
  data: Array<{ label: string; value: number }>
  ariaLabel: string
}

export default function BarChart({ data, ariaLabel }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value))

  return (
    <div className={styles.hbarChart} role="img" aria-label={ariaLabel}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100
        const color = CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]
        return (
          <div
            className={styles.hbarRow}
            key={d.label}
            title={`${d.label}: ${d.value}`}
          >
            <span className={styles.hbarLabel}>{d.label}</span>
            <div className={styles.hbarTrack}>
              <div
                className={styles.hbarFill}
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
            <span className={styles.hbarValue}>{d.value}</span>
          </div>
        )
      })}
    </div>
  )
}
