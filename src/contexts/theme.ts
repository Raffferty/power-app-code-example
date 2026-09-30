import { createContext } from "react"

export type ThemeSetting = "system" | "light" | "dark"
export type ResolvedTheme = "light" | "dark"

export const THEME_STORAGE_KEY = "supplyhub:theme"

export interface ThemeContextValue {
  setting: ThemeSetting
  resolvedTheme: ResolvedTheme
  setSetting: (setting: ThemeSetting) => void
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function isThemeSetting(value: unknown): value is ThemeSetting {
  return value === "system" || value === "light" || value === "dark"
}

export function readStoredSetting(): ThemeSetting {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isThemeSetting(stored) ? stored : "system"
  } catch {
    return "system"
  }
}

export function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function applyDocumentTheme(setting: ThemeSetting) {
  if (setting === "system") {
    document.documentElement.removeAttribute("data-theme")
  } else {
    document.documentElement.setAttribute("data-theme", setting)
  }
}
