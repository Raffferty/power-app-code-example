import BaseButton from "@/components/base/BaseButton"
import Spinner from "../Spinner"
import styles from "./Pagination.module.css"

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
      <BaseButton
        variant="secondary"
        onClick={onFirst}
        disabled={page === 1 || pageLoading}
      >
        First
      </BaseButton>
      <BaseButton
        variant="secondary"
        onClick={onPrevious}
        disabled={page === 1 || pageLoading}
      >
        Previous
      </BaseButton>
      <span className={styles.pageIndicator}>
        Page {page}
        {pageLoading && <Spinner size="sm" />}
      </span>
      <BaseButton
        variant="secondary"
        onClick={onNext}
        disabled={!hasNextPage || pageLoading}
      >
        Next
      </BaseButton>
    </div>
  )
}
