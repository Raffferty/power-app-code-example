import { useEffect, useRef, useState } from "react"
import { Check, Monitor, Moon, Sun } from "lucide-react"
import BaseButton from "@/components/base/BaseButton"
import { useTheme } from "@/hooks/useTheme"
import type { ThemeSetting } from "@/contexts/theme"
import styles from "./ThemeToggle.module.css"

const OPTIONS: Array<{ value: ThemeSetting; label: string; Icon: typeof Sun }> = [
  { value: "system", label: "System", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
]

const TRIGGER_ICON: Record<ThemeSetting, typeof Sun> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
}

export default function ThemeToggle() {
  const { setting, setSetting } = useTheme()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  const TriggerIcon = TRIGGER_ICON[setting]

  return (
    <div className={styles.themeToggle} ref={containerRef}>
      <BaseButton
        variant="ghost"
        iconOnly
        aria-label="Change theme"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <TriggerIcon size={18} aria-hidden="true" />
      </BaseButton>

      {open && (
        <ul className={styles.menu} role="menu">
          {OPTIONS.map(({ value, label, Icon }) => (
            <li key={value} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={setting === value}
                className={styles.menuItem}
                onClick={() => {
                  setSetting(value)
                  setOpen(false)
                }}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{label}</span>
                {setting === value && <Check size={14} aria-hidden="true" className={styles.check} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
