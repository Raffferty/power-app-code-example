import { useEffect } from "react"
import styles from "./Toast.module.css"

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

export default function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={styles.toast} role="status">
      <span className={styles.toastIcon} aria-hidden="true">
        ✓
      </span>
      {message}
    </div>
  );
}
