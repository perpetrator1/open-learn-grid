/**
 * Cascading department → course → semester → subject selects.
 * Each level loads options filtered by the previous selection.
 */

import { useQuery } from "@tanstack/react-query"
import { academicApi } from "@/lib/academic-api"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { Department, Course, Semester, Subject } from "@/types"

export interface CascadingSelection {
  departmentId: number | null
  courseId: number | null
  semesterId: number | null
  subjectId: number | null
}

interface Props {
  value: CascadingSelection
  onChange: (value: CascadingSelection) => void
  allowCommon?: boolean
  /** When true, show only subjects that exist in the picked semester */
  filterByMapping?: boolean
}

export function CascadingSelects({
  value,
  onChange,
  allowCommon = true,
  filterByMapping = true,
}: Props) {
  const { data: deptData } = useQuery({
    queryKey: ["departments", { is_active: true, page_size: 200 }],
    queryFn: () => academicApi.getDepartments({ is_active: true, page_size: 200 }),
  })
  const departments: Department[] = deptData?.results ?? []

  const { data: courseData } = useQuery({
    queryKey: ["courses", { department: value.departmentId, is_active: true, page_size: 200 }],
    queryFn: () =>
      academicApi.getCourses({
        department: value.departmentId,
        is_active: true,
        page_size: 200,
      }),
    enabled: value.departmentId != null,
  })
  const courses: Course[] = courseData?.results ?? []

  const { data: semesterData } = useQuery({
    queryKey: ["semesters", { course: value.courseId, is_active: true, page_size: 200 }],
    queryFn: () =>
      academicApi.getSemesters({ course: value.courseId, is_active: true, page_size: 200 }),
    enabled: value.courseId != null,
  })
  const semesters: Semester[] = semesterData?.results ?? []

  const subjectParams: Record<string, unknown> = { is_active: true, page_size: 500 }
  if (filterByMapping && value.semesterId) subjectParams.semester = value.semesterId
  if (value.departmentId) subjectParams.department = value.departmentId

  const { data: subjectData } = useQuery({
    queryKey: ["subjects", subjectParams],
    queryFn: () => academicApi.getSubjects(subjectParams),
    enabled: value.semesterId != null || !filterByMapping,
  })
  const subjects: Subject[] = subjectData?.results ?? []

  const handleDept = (v: string) => {
    const id = v === "common" ? null : Number(v)
    onChange({ departmentId: id, courseId: null, semesterId: null, subjectId: null })
  }

  const handleCourse = (v: string) => {
    onChange({ ...value, courseId: Number(v), semesterId: null, subjectId: null })
  }

  const handleSemester = (v: string) => {
    onChange({ ...value, semesterId: Number(v), subjectId: null })
  }

  const handleSubject = (v: string) => {
    onChange({ ...value, subjectId: Number(v) })
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Department */}
      <div className="space-y-1.5">
        <Label>Department</Label>
        <Select
          value={value.departmentId == null ? (allowCommon ? "common" : "") : String(value.departmentId)}
          onValueChange={handleDept}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {allowCommon && <SelectItem value="common">Common Subject</SelectItem>}
            {departments.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.code} – {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Course */}
      <div className="space-y-1.5">
        <Label>Course</Label>
        <Select
          value={value.courseId != null ? String(value.courseId) : ""}
          onValueChange={handleCourse}
          disabled={value.departmentId == null && !allowCommon}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select course" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.code} – {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Semester */}
      <div className="space-y-1.5">
        <Label>Semester</Label>
        <Select
          value={value.semesterId != null ? String(value.semesterId) : ""}
          onValueChange={handleSemester}
          disabled={value.courseId == null}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select semester" />
          </SelectTrigger>
          <SelectContent>
            {semesters.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                Semester {s.number} ({s.academic_year})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subject */}
      <div className="space-y-1.5">
        <Label>Subject</Label>
        <Select
          value={value.subjectId != null ? String(value.subjectId) : ""}
          onValueChange={handleSubject}
          disabled={!filterByMapping ? false : value.semesterId == null}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                <span className="flex items-center gap-2">
                  {s.code} – {s.name}
                  {s.is_common && (
                    <Badge variant="secondary" className="text-xs">
                      Common
                    </Badge>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
