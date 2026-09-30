import { useCallback, useEffect, useState } from "react"
import type { ReactNode } from "react"
import {
  applyDocumentTheme,
  getSystemTheme,
  readStoredSetting,
  ThemeContext,
  THEME_STORAGE_KEY,
} from "./theme"
import type { ResolvedTheme, ThemeSetting } from "./theme"

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [setting, setSettingState] = useState<ThemeSetting>(readStoredSetting)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    setting === "system" ? getSystemTheme() : setting,
  )

  useEffect(() => {
    applyDocumentTheme(setting)
  }, [setting])

  useEffect(() => {
    if (setting !== "system") return

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => setResolvedTheme(getSystemTheme())

    media.addEventListener("change", handleChange)
    return () => media.removeEventListener("change", handleChange)
  }, [setting])

  const setSetting = useCallback((next: ThemeSetting) => {
    setSettingState(next)
    setResolvedTheme(next === "system" ? getSystemTheme() : next)

    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // localStorage unavailable (private mode/quota) — theme still applies for this session
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ setting, resolvedTheme, setSetting }}>
      {children}
    </ThemeContext.Provider>
  )
}
