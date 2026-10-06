import { useEffect, useState } from "react"
import { Cr9b0_studentsesService } from "@/generated/services/Cr9b0_studentsesService"
import { getFormattedValue } from "@/types"
import Spinner from "@/components/shared/Spinner"
import shared from "@/styles/shared.module.css"
import type { StudentRecord } from "@/types"

export default function ReportsPage() {
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadStudents() {
      try {
        const result = await Cr9b0_studentsesService.getAll()
        if (cancelled) return
        if (result.success) {
          setStudents(result.data ?? [])
          setError(null)
        } else {
          setError(result.error?.message ?? "Failed to load your students.")
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load your students.",
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadStudents()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section>
      <div className={shared.pageHeader}>
        <h1>Students</h1>
        <p className={shared.pageSubtitle}>
          Students name, email, course and isCertified status
        </p>
      </div>

      {loading && (
        <p className={`${shared.stateMessage} ${shared.stateMessageLoading}`}>
          <Spinner /> Loading Students…
        </p>
      )}

      {!loading && error && (
        <p className={`${shared.stateMessage} ${shared.stateError}`}>{error}</p>
      )}

      {!loading && !error && students.length === 0 && (
        <p className={shared.stateMessage}>No students found.</p>
      )}

      {!loading && !error && students.length > 0 && (
        <div className={shared.tableWrapper}>
          <table className={shared.ordersTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Course</th>
                <th>Certified</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.cr9b0_id}>
                  <td>{student.cr9b0_id}</td>
                  <td>{student.cr9b0_name}</td>
                  <td>{student.cr9b0_email}</td>
                  <td>{student.cr9b0_course}</td>
                  <td>{getFormattedValue(student, "cr9b0_iscertified")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
