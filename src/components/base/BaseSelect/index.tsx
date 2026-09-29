import type { Ref, SelectHTMLAttributes } from "react"
import ChevronDownIcon from "@/components/icons/ChevronDownIcon"
import Spinner from "@/components/shared/Spinner"
import styles from "./BaseSelect.module.css"

export interface BaseSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Shows a spinner over the indicator and disables the select. */
  loading?: boolean
  ref?: Ref<HTMLSelectElement>
}

/**
 * Atomic select primitive. Renders a custom chevron indicator in place of
 * the native browser arrow. The indicator is static (not swapped on
 * open/close) because a native <select>'s dropdown is browser/OS-rendered
 * chrome, not a DOM node -- the click that dismisses it isn't reliably
 * observable as a page event, so an accurate open-state indicator isn't
 * achievable without replacing <select> with a fully custom listbox.
 *
 * React 19 passes `ref` as a regular prop to function components, so no
 * forwardRef wrapper is needed here.
 */
export default function BaseSelect({
  loading = false,
  disabled,
  className,
  children,
  ref,
  ...rest
}: BaseSelectProps) {
  const wrapperClassNames = [styles.wrapper, className].filter(Boolean).join(" ")

  return (
    <span className={wrapperClassNames}>
      <select
        {...rest}
        ref={ref}
        className={styles.select}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
      >
        {children}
      </select>
      <span className={styles.indicator}>
        {loading ? <Spinner size="sm" /> : <ChevronDownIcon />}
      </span>
    </span>
  )
}
