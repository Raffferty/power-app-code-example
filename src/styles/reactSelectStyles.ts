import type { StylesConfig } from "react-select"

export interface SelectOption {
  value: string
  label: string
}

/**
 * Shared react-select styling so every dropdown in the app matches the design
 * system's CSS variables (border, radius, focus ring) instead of react-select's
 * defaults. Pass to the `styles` prop of every <Select />.
 */
export const selectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 38,
    borderRadius: 8,
    borderColor: state.isFocused ? "var(--color-primary)" : "var(--color-border)",
    backgroundColor: state.isDisabled ? "var(--color-bg)" : "var(--color-surface)",
    boxShadow: state.isFocused ? "0 0 0 3px var(--color-primary-light)" : "none",
    cursor: state.isDisabled ? "not-allowed" : "default",
    "&:hover": {
      borderColor: "var(--color-primary)",
    },
  }),
  valueContainer: (base) => ({ ...base, padding: "2px 10px" }),
  input: (base) => ({ ...base, color: "var(--color-text)", margin: 0 }),
  singleValue: (base, state) => ({
    ...base,
    color: state.isDisabled ? "var(--color-text-muted)" : "var(--color-text)",
  }),
  placeholder: (base) => ({ ...base, color: "var(--color-text-muted)" }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? "var(--color-primary)" : "var(--color-text-muted)",
    padding: "0 10px",
  }),
  clearIndicator: (base) => ({ ...base, color: "var(--color-text-muted)" }),
  loadingIndicator: (base) => ({ ...base, color: "var(--color-primary)" }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  menu: (base) => ({
    ...base,
    borderRadius: 8,
    border: "1px solid var(--color-border)",
    boxShadow: "var(--shadow-sm)",
    backgroundColor: "var(--color-surface)",
    overflow: "hidden",
  }),
  menuList: (base) => ({ ...base, padding: 4 }),
  option: (base, state) => ({
    ...base,
    borderRadius: 6,
    fontSize: "0.9rem",
    backgroundColor: state.isSelected
      ? "var(--color-primary)"
      : state.isFocused
        ? "var(--color-bg)"
        : "transparent",
    color: state.isSelected ? "#fff" : "var(--color-text)",
    cursor: "pointer",
  }),
}
