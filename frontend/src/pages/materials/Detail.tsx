/**
 * Material detail page — hero info, metadata, verification actions, version history.
 */

import { useParams, useNavigate, Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Download,
  Eye,
  ExternalLink,
  ShieldCheck,
  ShieldX,
  Clock,
  Tag as TagIcon,
  BookOpen,
  CalendarDays,
  History,
  Loader2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { materialsApi } from "@/lib/materials-api"
import { useAuth } from "@/hooks/useAuth"
import { MATERIAL_PERMISSIONS } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import type { VerificationStatus } from "@/types"
import { useState } from "react"

// ─── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<VerificationStatus, string> = {
  verified: "border-green-500 text-green-700 dark:text-green-400 bg-green-500/10",
  pending: "border-yellow-500 text-yellow-700 dark:text-yellow-400 bg-yellow-500/10",
  rejected: "border-red-500 text-red-600 bg-red-500/10",
  revision_requested: "border-blue-500 text-blue-700 bg-blue-500/10",
}

const STATUS_ICON: Record<VerificationStatus, React.FC<{ className?: string }>> = {
  verified: ShieldCheck,
  pending: Clock,
  rejected: ShieldX,
  revision_requested: Clock,
}

function StatusBadge({ status }: { status: VerificationStatus }) {
  const Icon = STATUS_ICON[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm font-medium",
        STATUS_STYLES[status]
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {status.replace("_", " ")}
    </span>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function MaterialDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { can, user } = useAuth()

  const [verifyNote, setVerifyNote] = useState("")
  const [showVerifyForm, setShowVerifyForm] = useState<
    "verify" | "reject" | "revision_requested" | null
  >(null)

  const { data: material, isLoading } = useQuery({
    queryKey: ["material", Number(id)],
    queryFn: () => materialsApi.getMaterial(Number(id)),
    enabled: !!id,
  })

  const { data: versions } = useQuery({
    queryKey: ["material-versions", Number(id)],
    queryFn: () => materialsApi.getMaterialVersions(Number(id)),
    enabled: !!id,
  })

  // Record view on mount — fire & forget
  useQuery({
    queryKey: ["record-view", Number(id)],
    queryFn: () => materialsApi.recordView(Number(id)),
    enabled: !!id,
    staleTime: Infinity,
  })

  const verifyMutation = useMutation({
    mutationFn: ({
      action,
      note,
    }: {
      action: VerificationStatus
      note: string
    }) =>
      materialsApi.verifyMaterial(Number(id), {
        verification_status: action,
        verification_note: note,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["material", Number(id)] })
      setShowVerifyForm(null)
      setVerifyNote("")
    },
  })

  const downloadMutation = useMutation({
    mutationFn: () => materialsApi.downloadMaterial(Number(id)),
    onSuccess: (url: string) => {
      window.open(url, "_blank")
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!material) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Material not found.</p>
        <Button variant="link" onClick={() => navigate("/materials")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to browse
        </Button>
      </div>
    )
  }

  const isOwner = user?.id === material.uploaded_by.id
  const canVerify = can(MATERIAL_PERMISSIONS.APPROVE)
  const versionList = Array.isArray(versions) ? versions : (versions as { results?: unknown[] })?.results ?? []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        to="/materials"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to materials
      </Link>

      {/* Hero */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-start gap-3">
          <h1 className="text-2xl font-bold flex-1">{material.title}</h1>
          <Badge variant="outline">{material.material_type.name}</Badge>
          <StatusBadge status={material.verification_status} />
        </div>

        {material.description && (
          <p className="text-muted-foreground">{material.description}</p>
        )}

        {/* Tags */}
        {material.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <TagIcon className="w-3.5 h-3.5 text-muted-foreground" />
            {material.tags.map((t) => (
              <Badge key={t.id} variant="secondary" className="text-xs">
                {t.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="md:col-span-2 space-y-5">
          {/* File / embed */}
          {material.file ? (
            material.file.endsWith(".pdf") ? (
              <div className="rounded-xl border overflow-hidden bg-muted">
                <iframe
                  src={material.file}
                  className="w-full h-[540px]"
                  title={material.title}
                />
              </div>
            ) : (
              <div className="rounded-xl border p-6 text-center text-muted-foreground bg-muted/40 space-y-2">
                <p className="text-sm">Preview not available for this file type.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadMutation.mutate()}
                  disabled={downloadMutation.isPending}
                >
                  {downloadMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-1.5" />
                  )}
                  Download to view
                </Button>
              </div>
            )
          ) : material.external_url ? (
            <div className="rounded-xl border p-6 text-center space-y-2 bg-muted/40">
              <p className="text-sm text-muted-foreground">External resource</p>
              <Button variant="outline" size="sm" asChild>
                <a href={material.external_url} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                  Open link
                </a>
              </Button>
            </div>
          ) : null}

          {/* Verification form (admin/verifier only) */}
          {canVerify && material.verification_status !== "verified" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {showVerifyForm ? (
                  <>
                    <div className="space-y-1.5">
                      <Label>Note (optional)</Label>
                      <Textarea
                        value={verifyNote}
                        onChange={(e) => setVerifyNote(e.target.value)}
                        rows={2}
                        placeholder="Leave a note for the uploader…"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          verifyMutation.mutate({
                            action: showVerifyForm,
                            note: verifyNote,
                          })
                        }
                        disabled={verifyMutation.isPending}
                      >
                        {verifyMutation.isPending && (
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        )}
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowVerifyForm(null)
                          setVerifyNote("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => setShowVerifyForm("verified")}
                    >
                      <ShieldCheck className="w-4 h-4 mr-1.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowVerifyForm("revision_requested")}
                    >
                      <Clock className="w-4 h-4 mr-1.5" />
                      Request revision
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setShowVerifyForm("rejected")}
                    >
                      <ShieldX className="w-4 h-4 mr-1.5" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Verification note */}
          {material.verification_note && (
            <Card className="border-yellow-300 dark:border-yellow-700">
              <CardContent className="pt-4 text-sm">
                <p className="font-medium mb-1">Reviewer note</p>
                <p className="text-muted-foreground">{material.verification_note}</p>
              </CardContent>
            </Card>
          )}

          {/* Version history */}
          {(versionList as unknown[]).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Version history
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(versionList as Array<{
                  id: number
                  version_number: number
                  change_note: string
                  uploaded_by: { display_name: string; username: string }
                  created_at: string
                }>).map((v) => (
                  <div key={v.id} className="flex items-start gap-3 text-sm py-2 border-b last:border-0">
                    <Badge variant="outline" className="shrink-0">
                      v{v.version_number}
                    </Badge>
                    <div className="flex-1">
                      <p>{v.change_note || "No change note"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {v.uploaded_by.display_name || v.uploaded_by.username} ·{" "}
                        {new Date(v.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar metadata */}
        <div className="space-y-4">
          {/* Actions */}
          <Card>
            <CardContent className="pt-5 space-y-2">
              {material.file && (
                <Button
                  className="w-full"
                  onClick={() => downloadMutation.mutate()}
                  disabled={downloadMutation.isPending}
                >
                  {downloadMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-1.5" />
                  )}
                  Download
                </Button>
              )}
              {isOwner && (
                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <Link to={`/materials/${material.id}/edit`}>
                    Edit
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardContent className="pt-5 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span>{material.view_count} views</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Download className="w-4 h-4" />
                <span>{material.download_count} downloads</span>
              </div>
              <Separator />
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>{material.subject.name}</span>
              </div>
              {material.semester && (
                <p className="text-muted-foreground text-xs pl-6">
                  Sem {material.semester.number} · {material.semester.academic_year}
                </p>
              )}
              {material.department && (
                <p className="text-muted-foreground text-xs pl-6">
                  {material.department.code}
                </p>
              )}
              <Separator />
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="w-4 h-4" />
                <span>
                  Uploaded {new Date(material.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-muted-foreground text-xs pl-6">
                by {material.uploaded_by.display_name || material.uploaded_by.username}
              </p>
              {material.verified_at && (
                <p className="text-muted-foreground text-xs">
                  Verified {new Date(material.verified_at).toLocaleDateString()}
                  {material.verified_by
                    ? ` by ${material.verified_by.display_name || material.verified_by.username}`
                    : ""}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
