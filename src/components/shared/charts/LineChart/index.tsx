import { useState } from "react"
import { getCategoricalColors, getChartInk } from "../colors"
import { useTheme } from "@/hooks/useTheme"
import styles from "../charts.module.css"
import shared from "@/styles/shared.module.css"

interface LineChartProps {
  data: Array<{ label: string; value: number }>
  ariaLabel: string
}

const WIDTH = 480
const HEIGHT = 200
const PAD_LEFT = 30
const PAD_RIGHT = 12
const PAD_TOP = 16
const PAD_BOTTOM = 24

export default function LineChart({ data, ariaLabel }: LineChartProps) {
  const { resolvedTheme } = useTheme()
  const chartInk = getChartInk(resolvedTheme)
  const lineColor = getCategoricalColors(resolvedTheme)[0]
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (data.length === 0) {
    return <p className={shared.stateMessage}>No data yet.</p>
  }

  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM
  const max = Math.max(1, ...data.map((d) => d.value))
  const stepX = data.length > 1 ? plotW / (data.length - 1) : 0

  const points = data.map((d, i) => {
    const x = PAD_LEFT + stepX * i
    const y = PAD_TOP + plotH - (d.value / max) * plotH
    return { x, y, ...d }
  })

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ")
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${PAD_TOP + plotH} L ${points[0].x} ${PAD_TOP + plotH} Z`

  const gridLines = [0, 0.5, 1].map((f) => PAD_TOP + plotH * f)

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH
    let closest = 0
    let closestDist = Infinity
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX)
      if (dist < closestDist) {
        closestDist = dist
        closest = i
      }
    })
    setHoverIndex(closest)
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null

  return (
    <div className={styles.chartRoot}>
      <svg
        className={styles.chartSvg}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={ariaLabel}
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        {gridLines.map((y) => (
          <line
            key={y}
            x1={PAD_LEFT}
            x2={WIDTH - PAD_RIGHT}
            y1={y}
            y2={y}
            stroke={chartInk.gridline}
            strokeWidth={1}
          />
        ))}
        <line
          x1={PAD_LEFT}
          x2={WIDTH - PAD_RIGHT}
          y1={PAD_TOP + plotH}
          y2={PAD_TOP + plotH}
          stroke={chartInk.baseline}
          strokeWidth={1}
        />
        <path d={areaPath} fill={lineColor} opacity={0.12} stroke="none" />
        <path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {hovered && (
          <line
            x1={hovered.x}
            x2={hovered.x}
            y1={PAD_TOP}
            y2={PAD_TOP + plotH}
            stroke={chartInk.secondary}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}
        {hovered && (
          <circle
            cx={hovered.x}
            cy={hovered.y}
            r={4}
            fill={lineColor}
            stroke={chartInk.surface}
            strokeWidth={1.5}
          />
        )}
      </svg>
      {hovered && (
        <div
          className={styles.chartTooltip}
          style={{
            left: `${(hovered.x / WIDTH) * 100}%`,
            top: `${(hovered.y / HEIGHT) * 100}%`,
          }}
        >
          <div className={styles.chartTooltipLabel}>{hovered.label}</div>
          <div className={styles.chartTooltipValue}>{hovered.value} orders</div>
        </div>
      )}
    </div>
  )
}
