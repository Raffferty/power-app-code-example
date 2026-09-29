import type { InputHTMLAttributes, Ref } from "react"
import styles from "./BaseInput.module.css"

export interface BaseInputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>
}

/**
 * Atomic input primitive. Covers text-like input types (text, search, number,
 * date, etc.) with shared box styling, and checkbox/radio types with their
 * native browser appearance (no border/padding box).
 *
 * React 19 passes `ref` as a regular prop to function components, so no
 * forwardRef wrapper is needed here.
 */
export default function BaseInput({ className, ref, ...rest }: BaseInputProps) {
  const classNames = [styles.input, className].filter(Boolean).join(" ")

  return <input {...rest} ref={ref} className={classNames} />
}
