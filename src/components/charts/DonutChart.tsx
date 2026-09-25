import { CATEGORICAL_COLORS, CHART_INK } from "./colors"
import styles from "./charts.module.css"
import shared from "@/styles/shared.module.css"

interface DonutChartProps {
  data: Array<{ label: string; value: number }>
  ariaLabel: string
}

const SIZE = 200
const CENTER = SIZE / 2
const OUTER_R = 90
const INNER_R = 54
const GAP_DEG = 2

function polarToXY(radius: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return [CENTER + radius * Math.cos(rad), CENTER + radius * Math.sin(rad)]
}

function arcPath(startDeg: number, endDeg: number) {
  const [x1, y1] = polarToXY(OUTER_R, startDeg)
  const [x2, y2] = polarToXY(OUTER_R, endDeg)
  const [x3, y3] = polarToXY(INNER_R, endDeg)
  const [x4, y4] = polarToXY(INNER_R, startDeg)
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return [
    `M ${x1} ${y1}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${largeArc} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${INNER_R} ${INNER_R} 0 ${largeArc} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ")
}

export default function DonutChart({ data, ariaLabel }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (total === 0) {
    return <p className={shared.stateMessage}>No data yet.</p>
  }

  const sweeps = data.map((d) => (d.value / total) * 360)
  const cursors = sweeps.reduce<number[]>((acc, _sweep, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1]! + sweeps[i - 1]!)
    return acc
  }, [])
  const segments = data.map((d, i) => {
    const sweep = sweeps[i]!
    const cursor = cursors[i]!
    const start = cursor + (sweep > GAP_DEG ? GAP_DEG / 2 : 0)
    const end = cursor + sweep - (sweep > GAP_DEG ? GAP_DEG / 2 : 0)
    return {
      ...d,
      color: CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length],
      path: arcPath(start, end),
      pct: Math.round((d.value / total) * 100),
    }
  })

  return (
    <div className={styles.donutChart}>
      <svg
        className={styles.donutSvg}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={ariaLabel}
      >
        {segments.map((seg) => (
          <path key={seg.label} d={seg.path} fill={seg.color}>
            <title>{`${seg.label}: ${seg.value} (${seg.pct}%)`}</title>
          </path>
        ))}
        <text
          x={CENTER}
          y={CENTER - 6}
          textAnchor="middle"
          className={styles.donutTotalValue}
          fill={CHART_INK.primary}
        >
          {total}
        </text>
        <text
          x={CENTER}
          y={CENTER + 14}
          textAnchor="middle"
          className={styles.donutTotalLabel}
          fill={CHART_INK.muted}
        >
          orders
        </text>
      </svg>
      <ul className={styles.chartLegend}>
        {segments.map((seg) => (
          <li key={seg.label} className={styles.chartLegendItem}>
            <span
              className={styles.legendSwatch}
              style={{ background: seg.color }}
              aria-hidden="true"
            />
            <span className={styles.legendLabel}>{seg.label}</span>
            <span className={styles.legendValue}>
              {seg.value} ({seg.pct}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
