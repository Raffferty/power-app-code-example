import { useId } from "react"
import type { InputHTMLAttributes, Ref } from "react"
import styles from "./BaseInput.module.css"

export interface BaseInputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>
  label?: string
  helperText?: string
  errorText?: string
}

/**
 * Atomic input primitive. Covers text-like input types (text, search, number,
 * date, etc.) with shared box styling, and checkbox/radio types with their
 * native browser appearance (no border/padding box).
 *
 * `label`/`helperText`/`errorText` are opt-in: without them this renders a
 * bare `<input>` (unchanged for callers like inline filters/checkboxes).
 * Passing any of them wraps the input with a label on top and, when both
 * `helperText` and `errorText` are given, `errorText` wins -- the slot below
 * the input is for future form-validation messages.
 *
 * React 19 passes `ref` as a regular prop to function components, so no
 * forwardRef wrapper is needed here.
 */
export default function BaseInput({
  className,
  ref,
  id,
  label,
  helperText,
  errorText,
  ...rest
}: BaseInputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const classNames = [styles.input, className].filter(Boolean).join(" ")

  const input = <input {...rest} id={inputId} ref={ref} className={classNames} />

  if (!label && !helperText && !errorText) {
    return input
  }

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      {input}
      {errorText ? (
        <p className={styles.errorText}>{errorText}</p>
      ) : helperText ? (
        <p className={styles.helperText}>{helperText}</p>
      ) : null}
    </div>
  )
}
