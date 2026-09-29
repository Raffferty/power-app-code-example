import type { ButtonHTMLAttributes, ReactNode, Ref } from "react"
import Spinner from "@/components/shared/Spinner"
import styles from "./BaseButton.module.css"

export type ButtonVariant = "primary" | "secondary" | "ghost"
export type ButtonSize = "sm" | "md"

export interface BaseButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Square, compact button for a single icon/glyph child (e.g. a modal close "×"). */
  iconOnly?: boolean
  /** Shows a spinner in place of startIcon and disables the button. */
  loading?: boolean
  startIcon?: ReactNode
  endIcon?: ReactNode
  type?: "button" | "submit" | "reset"
  ref?: Ref<HTMLButtonElement>
}

/**
 * Atomic button primitive. Defaults to type="button" so it never triggers an
 * implicit form submit; pass type="submit" explicitly where that's wanted.
 *
 * React 19 passes `ref` as a regular prop to function components, so no
 * forwardRef wrapper is needed here.
 */
export default function BaseButton({
  variant = "primary",
  size = "md",
  iconOnly = false,
  loading = false,
  startIcon,
  endIcon,
  type = "button",
  disabled,
  className,
  children,
  ref,
  ...rest
}: BaseButtonProps) {
  if (import.meta.env.DEV && iconOnly && !rest["aria-label"] && !rest["aria-labelledby"]) {
    console.warn(
      "BaseButton: icon-only buttons must have an aria-label (or aria-labelledby) so screen readers can announce their purpose.",
    )
  }

  const classNames = [
    styles.button,
    styles[variant],
    size === "sm" ? styles.sm : undefined,
    iconOnly ? styles.iconOnly : undefined,
    className,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      className={classNames}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <Spinner size="sm" variant={variant === "primary" ? "light" : "default"} />
      ) : (
        startIcon
      )}
      {children}
      {!loading && endIcon}
    </button>
  )
}
