import { useEffect, useId, useRef, type ReactNode } from "react"
import { createPortal } from "react-dom"
import styles from "./Modal.module.css"

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function Modal({ title, onClose, children }: ModalProps) {
  const titleId = useId()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const container = containerRef.current
    const firstFocusable = container?.querySelector<HTMLElement>(
      FOCUSABLE_SELECTOR,
    )
    ;(firstFocusable ?? container)?.focus()

    return () => {
      previouslyFocused?.focus()
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }

      const container = containerRef.current
      if (event.key !== "Tab" || !container) return

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose])

  return createPortal(
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className={styles.modal} ref={containerRef} tabIndex={-1}>
        <div className={styles.modalHeader}>
          <h2 id={titleId}>{title}</h2>
          <button
            type="button"
            className={styles.modalClose}
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
