import Spinner from "../Spinner"
import styles from "./Pagination.module.css"
import shared from "@/styles/shared.module.css"

interface PaginationProps {
  page: number
  hasNextPage: boolean
  pageLoading: boolean
  onFirst: () => void
  onPrevious: () => void
  onNext: () => void
}

export default function Pagination({
  page,
  hasNextPage,
  pageLoading,
  onFirst,
  onPrevious,
  onNext,
}: PaginationProps) {
  return (
    <div className={styles.pagination}>
      <button
        type="button"
        className={`${shared.btn} ${shared.btnSecondary}`}
        onClick={onFirst}
        disabled={page === 1 || pageLoading}
      >
        First
      </button>
      <button
        type="button"
        className={`${shared.btn} ${shared.btnSecondary}`}
        onClick={onPrevious}
        disabled={page === 1 || pageLoading}
      >
        Previous
      </button>
      <span className={styles.pageIndicator}>
        Page {page}
        {pageLoading && <Spinner size="sm" />}
      </span>
      <button
        type="button"
        className={`${shared.btn} ${shared.btnSecondary}`}
        onClick={onNext}
        disabled={!hasNextPage || pageLoading}
      >
        Next
      </button>
    </div>
  )
}
