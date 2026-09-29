import type { SVGProps } from "react"

export interface ChevronDownIconProps extends SVGProps<SVGSVGElement> {
  /** Stroke color for the chevron. */
  color?: string
}

export default function ChevronDownIcon({
  color = "currentColor",
  ...rest
}: ChevronDownIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      aria-hidden="true"
      {...rest}
    >
      <path
        d="M4 6l4 4 4-4"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
