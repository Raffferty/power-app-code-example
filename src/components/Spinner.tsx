import styles from "./Spinner.module.css"

interface SpinnerProps {
  size?: "sm" | "md"
  variant?: "default" | "light"
}

export default function Spinner({ size = "md", variant = "default" }: SpinnerProps) {
  const classes = [styles.spinner]
  if (size === "sm") classes.push(styles.sm)
  if (variant === "light") classes.push(styles.light)

  return <span className={classes.join(" ")} role="status" aria-label="Loading" />
}
