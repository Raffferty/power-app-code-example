import { useId } from "react"
import type { Ref, TextareaHTMLAttributes } from "react"
import styles from "./BaseTextarea.module.css"

export interface BaseTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  ref?: Ref<HTMLTextAreaElement>
  label?: string
  helperText?: string
  errorText?: string
}

/**
 * Atomic textarea primitive, sharing BaseInput's box styling and its opt-in
 * label/helperText/errorText wrapper: without them this renders a bare
 * `<textarea>`; passing any of them wraps it with a label on top and,
 * when both `helperText` and `errorText` are given, `errorText` wins.
 *
 * React 19 passes `ref` as a regular prop to function components, so no
 * forwardRef wrapper is needed here.
 */
export default function BaseTextarea({
  className,
  ref,
  id,
  label,
  helperText,
  errorText,
  ...rest
}: BaseTextareaProps) {
  const generatedId = useId()
  const textareaId = id ?? generatedId
  const classNames = [styles.textarea, className].filter(Boolean).join(" ")

  const textarea = (
    <textarea {...rest} id={textareaId} ref={ref} className={classNames} />
  )

  if (!label && !helperText && !errorText) {
    return textarea
  }

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={textareaId} className={styles.label}>
          {label}
        </label>
      )}
      {textarea}
      {errorText ? (
        <p className={styles.errorText}>{errorText}</p>
      ) : helperText ? (
        <p className={styles.helperText}>{helperText}</p>
      ) : null}
    </div>
  )
}
