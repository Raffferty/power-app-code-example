import type { ResolvedTheme } from "@/contexts/theme"

// Fixed categorical hue order from the design system's validated palette —
// assign by index, never cycle or reorder. Validated with validate_palette.js:
// light against the light chart surface (#fcfcfb), dark against the dark
// chart surface (#1a1a19). Both modes clear the CVD/normal-vision floors for
// every adjacent pair in this order.
const CATEGORICAL_COLORS_LIGHT = [
  "#2a78d6", // 1 blue
  "#eb6834", // 2 orange
  "#1baf7a", // 3 aqua
  "#eda100", // 4 yellow
  "#e87ba4", // 5 magenta
  "#008300", // 6 green
  "#4a3aa7", // 7 violet
  "#e34948", // 8 red
] as const

const CATEGORICAL_COLORS_DARK = [
  "#3987e5", // 1 blue
  "#d95926", // 2 orange
  "#199e70", // 3 aqua
  "#c98500", // 4 yellow
  "#d55181", // 5 magenta
  "#008300", // 6 green
  "#9085e9", // 7 violet
  "#e66767", // 8 red
] as const

const CHART_INK_LIGHT = {
  primary: "#0b0b0b",
  secondary: "#52514e",
  muted: "#898781",
  gridline: "#e1e0d9",
  baseline: "#c3c2b7",
  surface: "#fcfcfb",
} as const

const CHART_INK_DARK = {
  primary: "#ffffff",
  secondary: "#c3c2b7",
  muted: "#898781",
  gridline: "#2c2c2a",
  baseline: "#383835",
  surface: "#1a1a19",
} as const

export function getCategoricalColors(theme: ResolvedTheme) {
  return theme === "dark" ? CATEGORICAL_COLORS_DARK : CATEGORICAL_COLORS_LIGHT
}

export function getChartInk(theme: ResolvedTheme) {
  return theme === "dark" ? CHART_INK_DARK : CHART_INK_LIGHT
}
