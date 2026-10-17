import { useEffect, useMemo, useState } from "react"
import Select from "react-select"
import { Cr9b0_studentsesService } from "@/generated/services/Cr9b0_studentsesService"
import { Raf_studentslevelsService } from "@/generated/services/Raf_studentslevelsService"
import type { Raf_studentslevels } from "@/generated/models/Raf_studentslevelsModel"
import { Raf_studentslevelsraf_stlevel } from "@/generated/models/Raf_studentslevelsModel"
import { getFormattedValue, getRawValue } from "@/types"
import Spinner from "@/components/shared/Spinner"
import { selectStyles, type SelectOption } from "@/styles/reactSelectStyles"
import shared from "@/styles/shared.module.css"
import styles from "./StudentsPage.module.css"
import type { StudentRecord } from "@/types"

type LevelBindPayload = { "raf_StudentsLevel@odata.bind": string }

export default function ReportsPage() {
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [levels, setLevels] = useState<Raf_studentslevels[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingStudentId, setSavingStudentId] = useState<string | null>(null)

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

  useEffect(() => {
    let cancelled = false

    async function loadLevels() {
      try {
        const result = await Raf_studentslevelsService.getAll({
          orderBy: ["raf_studentslevelname asc"],
        })
        if (!cancelled && result.success) {
          setLevels(result.data ?? [])
        }
      } catch {
        // Level dropdown just stays empty; not critical enough to surface as a page error.
      }
    }

    loadLevels()

    return () => {
      cancelled = true
    }
  }, [])

  const levelSelectOptions: SelectOption[] = useMemo(
    () =>
      levels
        .filter((l) => l.raf_studentslevelid && l.raf_stlevel)
        .map((l) => ({
          value: l.raf_studentslevelid,
          label:
            getFormattedValue(l, "raf_stlevel") ??
            Raf_studentslevelsraf_stlevel[l.raf_stlevel!],
        })),
    [levels],
  )

  async function handleLevelChange(student: StudentRecord, levelId: string) {
    setSavingStudentId(student.cr9b0_studentsid)
    try {
      const payload: LevelBindPayload = {
        "raf_StudentsLevel@odata.bind": `/raf_studentslevels(${levelId})`,
      }
      const result = await Cr9b0_studentsesService.update(
        student.cr9b0_studentsid,
        payload as never,
      )
      if (result.success) {
        setStudents((prev) =>
          prev.map((s) =>
            s.cr9b0_studentsid === student.cr9b0_studentsid
              ? (result.data ?? s)
              : s,
          ),
        )
        setError(null)
      } else {
        setError(result.error?.message ?? "Failed to update student level.")
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update student level.",
      )
    } finally {
      setSavingStudentId(null)
    }
  }

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
                <th>Level</th>
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
                  <td>
                    <Select<SelectOption>
                      className={styles.levelSelect}
                      classNamePrefix="rs"
                      styles={selectStyles}
                      menuPortalTarget={document.body}
                      isSearchable={false}
                      isLoading={savingStudentId === student.cr9b0_studentsid}
                      isDisabled={savingStudentId === student.cr9b0_studentsid}
                      options={levelSelectOptions}
                      value={
                        levelSelectOptions.find(
                          (opt) =>
                            opt.value ===
                            (getRawValue(student, "_raf_studentslevel_value") ??
                              ""),
                        ) ?? null
                      }
                      onChange={(option) =>
                        option && handleLevelChange(student, option.value)
                      }
                      aria-label={`Level for student ${student.cr9b0_name ?? student.cr9b0_studentsid}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
