/**
 * Multi-step material upload wizard.
 * Step 1: Choose material type
 * Step 2: Academic classification (dept → course → semester → subject)
 * Step 3: File / URL + title, description, tags
 * Step 4: Review & submit
 */

import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useDropzone } from "react-dropzone"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  BookOpen,
  FileText,
  Notebook,
  Video,
  Link2,
  UploadCloud,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  File,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  CascadingSelects,
  type CascadingSelection,
} from "@/components/academic/CascadingSelects"
import { TagInput } from "@/components/common/TagInput"
import { materialsApi } from "@/lib/materials-api"
import { cn } from "@/lib/utils"
import type { MaterialType } from "@/types"

// ─── icon helper ──────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  notes: Notebook,
  question: FileText,
  assignment: BookOpen,
  reference: BookOpen,
  tutorial: Video,
  other: File,
}

function MaterialTypeIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const Icon = ICON_MAP[name.toLowerCase().split(" ")[0]] ?? File
  return <Icon className={className} />
}

// ─── Step indicators ──────────────────────────────────────────────────────────

const STEPS = ["Type", "Classification", "File & Details", "Review"]

function StepBar({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-0 mb-8">
      {STEPS.map((label, idx) => {
        const done = idx < current
        const active = idx === current
        return (
          <li key={label} className="flex-1 flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 border-2",
                  done &&
                    "bg-primary border-primary text-primary-foreground",
                  active &&
                    "border-primary text-primary bg-background",
                  !done && !active && "border-muted text-muted-foreground bg-background"
                )}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span
                className={cn(
                  "text-sm hidden sm:inline",
                  active ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className="flex-1 h-px bg-border mx-3" />
            )}
          </li>
        )
      })}
    </ol>
  )
}

// ─── Zod schema ───────────────────────────────────────────────────────────────

const formSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    external_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
    file: z.instanceof(File).optional(),
  })
  .refine((d) => d.file || (d.external_url && d.external_url.length > 0), {
    message: "Upload a file or provide an external URL",
    path: ["file"],
  })

type FormValues = z.infer<typeof formSchema>

// ─── Main component ───────────────────────────────────────────────────────────

export default function UploadPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [selectedType, setSelectedType] = useState<MaterialType | null>(null)
  const [selection, setSelection] = useState<CascadingSelection>({
    departmentId: null,
    courseId: null,
    semesterId: null,
    subjectId: null,
  })
  const [tags, setTags] = useState<string[]>([])
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file")
  const [droppedFile, setDroppedFile] = useState<File | null>(null)

  const { data: typesData, isLoading: typesLoading } = useQuery({
    queryKey: ["material-types"],
    queryFn: () => materialsApi.getMaterialTypes(),
  })
  const materialTypes = typesData?.results ?? []

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) })

  const title = watch("title")
  const externalUrl = watch("external_url")

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) {
        setDroppedFile(accepted[0])
        setValue("file", accepted[0])
        // Auto-populate title from filename if empty
        if (!title) {
          setValue(
            "title",
            accepted[0].name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ")
          )
        }
      }
    },
    [setValue, title]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    maxSize: 50 * 1024 * 1024,
    multiple: false,
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      materialsApi.createMaterial({
        title: values.title,
        description: values.description,
        material_type: selectedType!.id,
        subject: selection.subjectId!,
        semester: selection.semesterId,
        department: selection.departmentId,
        course: selection.courseId,
        file: uploadMode === "file" ? droppedFile ?? undefined : undefined,
        external_url: uploadMode === "url" ? values.external_url : undefined,
        tags,
      }),
    onSuccess: (res) => {
      const data = res as { id?: number; detail?: string }
      if (data.id) navigate(`/materials/${data.id}`)
      else navigate("/materials")
    },
  })

  // ─── Step navigation guards ────────────────────────────────────────────────

  const canProceedStep0 = selectedType != null
  const canProceedStep1 = selection.subjectId != null
  const canProceedStep2 =
    uploadMode === "url" ? !!externalUrl : !!droppedFile

  function tryNext() {
    if (step === 0 && canProceedStep0) setStep(1)
    else if (step === 1 && canProceedStep1) setStep(2)
    else if (step === 2 && canProceedStep2) setStep(3)
  }

  // ─── Render steps ──────────────────────────────────────────────────────────

  const renderStep0 = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">What type of material are you uploading?</h2>
      {typesLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {materialTypes
            .filter((t) => t.is_active)
            .map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedType(t)}
                className={cn(
                  "rounded-xl border-2 p-5 flex flex-col items-center gap-3 transition-all",
                  selectedType?.id === t.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/40"
                )}
              >
                <MaterialTypeIcon name={t.icon || t.name} className="w-7 h-7 text-primary" />
                <span className="text-sm font-medium">{t.name}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Where does this material belong?</h2>
      <p className="text-sm text-muted-foreground">
        Select the academic classification. Choose "Common Subject" if it applies
        to multiple departments.
      </p>
      <CascadingSelects
        value={selection}
        onChange={setSelection}
        allowCommon={true}
        filterByMapping={true}
      />
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">Upload file or link</h2>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={uploadMode === "file" ? "default" : "outline"}
          onClick={() => setUploadMode("file")}
        >
          <UploadCloud className="w-4 h-4 mr-1.5" />
          Upload File
        </Button>
        <Button
          type="button"
          size="sm"
          variant={uploadMode === "url" ? "default" : "outline"}
          onClick={() => setUploadMode("url")}
        >
          <Link2 className="w-4 h-4 mr-1.5" />
          External URL
        </Button>
      </div>

      {uploadMode === "file" ? (
        <div
          {...getRootProps()}
          className={cn(
            "rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40"
          )}
        >
          <input {...getInputProps()} />
          {droppedFile ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <File className="w-8 h-8 text-primary" />
              <span className="text-sm font-medium">{droppedFile.name}</span>
              <span className="text-xs">
                {(droppedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
              <Badge variant="secondary">File ready</Badge>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <UploadCloud className="w-10 h-10" />
              <p className="font-medium">Drop your file here</p>
              <p className="text-xs">PDF, DOCX, PPTX, PNG, JPG · max 50 MB</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="external_url">External URL</Label>
          <Input
            id="external_url"
            placeholder="https://…"
            {...register("external_url")}
          />
          {errors.external_url && (
            <p className="text-xs text-destructive">{errors.external_url.message}</p>
          )}
        </div>
      )}

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="e.g. Unit 3 Notes – Data Structures"
          {...register("title")}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={3}
          placeholder="Brief description of the content…"
          {...register("description")}
        />
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <Label>Tags</Label>
        <TagInput value={tags} onChange={setTags} />
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">Review & submit</h2>
      <Card>
        <CardContent className="pt-5 space-y-4 text-sm">
          <Row label="Type" value={selectedType?.name ?? "—"} />
          <Row
            label="Subject"
            value={selection.subjectId ? `Subject #${selection.subjectId}` : "—"}
          />
          {selection.semesterId && <Row label="Semester" value={`Semester #${selection.semesterId}`} />}
          <Row
            label="File / URL"
            value={
              uploadMode === "file"
                ? droppedFile?.name ?? "—"
                : externalUrl ?? "—"
            }
          />
          <Row label="Title" value={title ?? "—"} />
          {tags.length > 0 && (
            <div className="flex items-start gap-4">
              <span className="w-28 text-muted-foreground shrink-0">Tags</span>
              <div className="flex flex-wrap gap-1">
                {tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {mutation.isError && (
        <p className="text-sm text-destructive">
          Upload failed. Please check your inputs and try again.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Depending on your role, your upload may require verification before it becomes
        publicly visible.
      </p>
    </div>
  )

  const stepContent = [renderStep0, renderStep1, renderStep2, renderStep3]

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upload Material</h1>
      <StepBar current={step} />

      <form
        onSubmit={handleSubmit((v) => mutation.mutate(v))}
        className="space-y-8"
      >
        {stepContent[step]()}

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={tryNext}
              disabled={
                (step === 0 && !canProceedStep0) ||
                (step === 1 && !canProceedStep1) ||
                (step === 2 && !canProceedStep2)
              }
            >
              Next
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              )}
              Submit Upload
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

// ─── Small row helper ─────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="w-28 text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium break-all">{value}</span>
    </div>
  )
}
