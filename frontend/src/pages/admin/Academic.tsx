/**
 * Admin academic management page.
 * 5 tabs: Departments | Courses | Semesters | Subjects | Requests
 */

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Pencil, Loader2, Check, X, ChevronDown } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { academicApi } from "@/lib/academic-api"
import type {
  Department,
  Course,
  Semester,
  Subject,
  AcademicRequest,
} from "@/types"

// ─── Shared helpers ────────────────────────────────────────────────────────────

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "default" : "secondary"}>
      {active ? "Active" : "Inactive"}
    </Badge>
  )
}

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

// ─── DEPARTMENTS tab ──────────────────────────────────────────────────────────

const deptSchema = z.object({
  name: z.string().min(2, "Name required"),
  code: z.string().min(1, "Code required").max(10),
  description: z.string().optional(),
})
type DeptForm = z.infer<typeof deptSchema>

function DepartmentsTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<Department | null>(null)
  const [open, setOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["departments", { search, page_size: 100 }],
    queryFn: () => academicApi.getDepartments({ search, page_size: 100 }),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeptForm>({ resolver: zodResolver(deptSchema) })

  const upsertMutation = useMutation({
    mutationFn: (values: DeptForm) => {
      const fd = new FormData()
      Object.entries(values).forEach(([k, v]) => v && fd.append(k, v))
      if (editing) return academicApi.updateDepartment(editing.id, fd)
      return academicApi.createDepartment(fd)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] })
      setOpen(false)
      reset()
      setEditing(null)
    },
  })

  const toggleActive = useMutation({
    mutationFn: (d: Department) => {
      const fd = new FormData()
      fd.append("is_active", String(!d.is_active))
      return academicApi.updateDepartment(d.id, fd)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  })

  function openCreate() {
    reset()
    setEditing(null)
    setOpen(true)
  }

  function openEdit(d: Department) {
    reset({ name: d.name, code: d.code, description: d.description })
    setEditing(d)
    setOpen(true)
  }

  const departments = data?.results ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search departments…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1.5" />
          New
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Courses</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton cols={5} />
          ) : (
            departments.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-mono text-sm">{d.code}</TableCell>
                <TableCell>{d.name}</TableCell>
                <TableCell>{d.course_count}</TableCell>
                <TableCell>
                  <ActiveBadge active={d.is_active} />
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(d)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive.mutate(d)}
                  >
                    {d.is_active ? (
                      <X className="w-3.5 h-3.5 text-destructive" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Department" : "New Department"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((v) => upsertMutation.mutate(v))}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Code *</Label>
              <Input {...register("code")} className="uppercase" />
              {errors.code && (
                <p className="text-xs text-destructive">{errors.code.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={2} {...register("description")} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                )}
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── COURSES tab ───────────────────────────────────────────────────────────────

const courseSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(1).max(20),
  department: z.number({ coerce: true }),
  duration_years: z.number({ coerce: true }).min(1).max(10),
  description: z.string().optional(),
})
type CourseForm = z.infer<typeof courseSchema>

function CoursesTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<Course | null>(null)
  const [open, setOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["courses", { search, page_size: 100 }],
    queryFn: () => academicApi.getCourses({ search, page_size: 100 }),
  })

  const { data: deptsData } = useQuery({
    queryKey: ["departments", { is_active: true, page_size: 200 }],
    queryFn: () => academicApi.getDepartments({ is_active: true, page_size: 200 }),
  })
  const departments = deptsData?.results ?? []

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CourseForm>({ resolver: zodResolver(courseSchema) })

  const upsert = useMutation({
    mutationFn: (values: CourseForm) =>
      editing
        ? academicApi.updateCourse(editing.id, values)
        : academicApi.createCourse(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] })
      setOpen(false)
      reset()
      setEditing(null)
    },
  })

  function openCreate() {
    reset({ duration_years: 3 })
    setEditing(null)
    setOpen(true)
  }

  function openEdit(c: Course) {
    reset({
      name: c.name,
      code: c.code,
      department: c.department.id,
      duration_years: c.duration_years,
      description: c.description,
    })
    setEditing(c)
    setOpen(true)
  }

  const courses = data?.results ?? []
  const selectedDept = watch("department")

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search courses…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1.5" />
          New
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Semesters</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton cols={7} />
          ) : (
            courses.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-sm">{c.code}</TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.department.code}</TableCell>
                <TableCell>{c.duration_years}y</TableCell>
                <TableCell>{c.semester_count}</TableCell>
                <TableCell>
                  <ActiveBadge active={c.is_active} />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(c)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Course" : "New Course"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((v) => upsert.mutate(v))}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Department *</Label>
              <Select
                value={selectedDept ? String(selectedDept) : ""}
                onValueChange={(v) => setValue("department", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.code} – {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department && (
                <p className="text-xs text-destructive">Required</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Code *</Label>
                <Input {...register("code")} />
              </div>
              <div className="space-y-1.5">
                <Label>Duration (years) *</Label>
                <Input type="number" min={1} max={10} {...register("duration_years")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input {...register("name")} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={2} {...register("description")} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={upsert.isPending}>
                {upsert.isPending && (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                )}
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── SEMESTERS tab ─────────────────────────────────────────────────────────────

const semSchema = z.object({
  number: z.number({ coerce: true }).min(1).max(12),
  academic_year: z.string().regex(/^\d{4}-\d{2}$/, "Format: 2024-25"),
  course: z.number({ coerce: true }),
})
type SemForm = z.infer<typeof semSchema>

function SemestersTab() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Semester | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["semesters", { page_size: 200 }],
    queryFn: () => academicApi.getSemesters({ page_size: 200 }),
  })

  const { data: coursesData } = useQuery({
    queryKey: ["courses", { is_active: true, page_size: 200 }],
    queryFn: () => academicApi.getCourses({ is_active: true, page_size: 200 }),
  })
  const courses = coursesData?.results ?? []

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SemForm>({ resolver: zodResolver(semSchema) })

  const upsert = useMutation({
    mutationFn: (v: SemForm) =>
      editing
        ? academicApi.updateSemester(editing.id, v)
        : academicApi.createSemester(v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["semesters"] })
      setOpen(false)
      reset()
      setEditing(null)
    },
  })

  function openCreate() {
    reset()
    setEditing(null)
    setOpen(true)
  }

  function openEdit(s: Semester) {
    reset({ number: s.number, academic_year: s.academic_year, course: s.course.id })
    setEditing(s)
    setOpen(true)
  }

  const semesters = data?.results ?? []
  const selectedCourse = watch("course")

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1.5" />
          New
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Academic Year</TableHead>
            <TableHead>Subjects</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton cols={6} />
          ) : (
            semesters.map((s) => (
              <TableRow key={s.id}>
                <TableCell>Semester {s.number}</TableCell>
                <TableCell>{s.course.code}</TableCell>
                <TableCell>{s.academic_year}</TableCell>
                <TableCell>{s.subject_count}</TableCell>
                <TableCell>
                  <ActiveBadge active={s.is_active} />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(s)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Semester" : "New Semester"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((v) => upsert.mutate(v))}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Course *</Label>
              <Select
                value={selectedCourse ? String(selectedCourse) : ""}
                onValueChange={(v) => setValue("course", Number(v))}
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
              {errors.course && <p className="text-xs text-destructive">Required</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Number *</Label>
                <Input type="number" min={1} max={12} {...register("number")} />
                {errors.number && (
                  <p className="text-xs text-destructive">{errors.number.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Academic Year *</Label>
                <Input placeholder="2024-25" {...register("academic_year")} />
                {errors.academic_year && (
                  <p className="text-xs text-destructive">{errors.academic_year.message}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={upsert.isPending}>
                {upsert.isPending && (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                )}
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── SUBJECTS tab ──────────────────────────────────────────────────────────────

const subjectSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(1).max(20),
  credit_hours: z.number({ coerce: true }).min(0).max(10),
  is_common: z.boolean().default(false),
  description: z.string().optional(),
})
type SubjectForm = z.infer<typeof subjectSchema>

function SubjectsTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Subject | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["subjects", { search, page_size: 200 }],
    queryFn: () => academicApi.getSubjects({ search, page_size: 200 }),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubjectForm>({ resolver: zodResolver(subjectSchema) })

  const upsert = useMutation({
    mutationFn: (v: SubjectForm) =>
      editing
        ? academicApi.updateSubject(editing.id, v)
        : academicApi.createSubject(v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects"] })
      setOpen(false)
      reset()
      setEditing(null)
    },
  })

  function openCreate() {
    reset({ credit_hours: 3, is_common: false })
    setEditing(null)
    setOpen(true)
  }

  function openEdit(s: Subject) {
    reset({
      name: s.name,
      code: s.code,
      credit_hours: s.credit_hours,
      is_common: s.is_common,
      description: s.description,
    })
    setEditing(s)
    setOpen(true)
  }

  const subjects = data?.results ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search subjects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1.5" />
          New
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Credits</TableHead>
            <TableHead>Common</TableHead>
            <TableHead>Semesters</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton cols={7} />
          ) : (
            subjects.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-sm">{s.code}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.credit_hours}</TableCell>
                <TableCell>
                  {s.is_common && (
                    <Badge variant="secondary" className="text-xs">
                      Common
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{s.mappings.length}</TableCell>
                <TableCell>
                  <ActiveBadge active={s.is_active} />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(s)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Subject" : "New Subject"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((v) => upsert.mutate(v))}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Code *</Label>
                <Input {...register("code")} />
              </div>
              <div className="space-y-1.5">
                <Label>Credit hours *</Label>
                <Input type="number" step="0.5" {...register("credit_hours")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={2} {...register("description")} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_common" {...register("is_common")} />
              <Label htmlFor="is_common" className="cursor-pointer">
                Common subject (shared across departments)
              </Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={upsert.isPending}>
                {upsert.isPending && (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                )}
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── ACADEMIC REQUESTS tab ────────────────────────────────────────────────────

function RequestsTab() {
  const qc = useQueryClient()
  const [reviewingId, setReviewingId] = useState<number | null>(null)
  const [note, setNote] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["academic-requests", { status: "pending" }],
    queryFn: () => academicApi.getAcademicRequests({ status: "pending", page_size: 100 }),
  })

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      status,
      review_note,
    }: {
      id: number
      status: "approved" | "rejected"
      review_note?: string
    }) => academicApi.reviewAcademicRequest(id, { status, review_note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academic-requests"] })
      setReviewingId(null)
      setNote("")
    },
  })

  const requests: AcademicRequest[] = data?.results ?? []

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          No pending academic requests.
        </p>
      ) : (
        requests.map((req) => (
          <div
            key={req.id}
            className="rounded-xl border p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{req.request_type.replace("_", " ")}</Badge>
                  <Badge
                    variant={
                      req.status === "pending"
                        ? "secondary"
                        : req.status === "approved"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {req.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  by {req.requester.display_name || req.requester.username} ·{" "}
                  {new Date(req.created_at).toLocaleDateString()}
                </p>
              </div>
              {req.status === "pending" && (
                <button
                  type="button"
                  onClick={() =>
                    setReviewingId(reviewingId === req.id ? null : req.id)
                  }
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${reviewingId === req.id ? "rotate-180" : ""}`}
                  />
                </button>
              )}
            </div>

            {/* Payload preview */}
            <pre className="text-xs bg-muted rounded-md p-3 overflow-auto max-h-32">
              {JSON.stringify(req.payload, null, 2)}
            </pre>

            {/* Review form */}
            {reviewingId === req.id && (
              <div className="space-y-3 border-t pt-3">
                <div className="space-y-1.5">
                  <Label>Note (optional)</Label>
                  <Textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Leave a review note…"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() =>
                      reviewMutation.mutate({
                        id: req.id,
                        status: "approved",
                        review_note: note,
                      })
                    }
                    disabled={reviewMutation.isPending}
                  >
                    <Check className="w-4 h-4 mr-1.5" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      reviewMutation.mutate({
                        id: req.id,
                        status: "rejected",
                        review_note: note,
                      })
                    }
                    disabled={reviewMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-1.5" />
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AcademicAdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Academic Management</h1>
      <Tabs defaultValue="departments">
        <TabsList className="mb-6">
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="semesters">Semesters</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="departments">
          <DepartmentsTab />
        </TabsContent>
        <TabsContent value="courses">
          <CoursesTab />
        </TabsContent>
        <TabsContent value="semesters">
          <SemestersTab />
        </TabsContent>
        <TabsContent value="subjects">
          <SubjectsTab />
        </TabsContent>
        <TabsContent value="requests">
          <RequestsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
