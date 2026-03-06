/**
 * Material browsing page — sidebar filters + material grid/list + pagination.
 */

import { useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Search, Grid2X2, List, SlidersHorizontal, X, Filter, ExternalLink, Globe } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { materialsApi } from "@/lib/materials-api"
import { academicApi } from "@/lib/academic-api"
import { federationApi } from "@/lib/federation-api"
import { cn } from "@/lib/utils"
import type { Material, MaterialFilters, FederatedMaterial, MaterialType, Department } from "@/types"

// ─── Material card ─────────────────────────────────────────────────────────────

function MaterialCard({
  material,
  layout,
}: {
  material: Material
  layout: "grid" | "list"
}) {
  const statusColor: Record<string, string> = {
    verified: "bg-green-500/10 text-green-700 dark:text-green-400",
    pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    rejected: "bg-red-500/10 text-red-600",
    revision_requested: "bg-blue-500/10 text-blue-700",
  }

  if (layout === "list") {
    return (
      <Link to={`/materials/${material.id}`} className="block group">
        <div className="rounded-lg border p-4 hover:bg-muted/40 transition-colors flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium group-hover:text-primary transition-colors truncate">
                {material.title}
              </span>
              <Badge variant="outline" className="text-xs shrink-0">
                {material.material_type.name}
              </Badge>
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                  statusColor[material.verification_status]
                )}
              >
                {material.verification_status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
              {material.subject.name} · {material.description || "No description"}
            </p>
          </div>
          <div className="text-xs text-muted-foreground shrink-0 text-right space-y-0.5">
            <p>{material.view_count} views</p>
            <p>{material.download_count} downloads</p>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link to={`/materials/${material.id}`} className="block group">
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {material.title}
            </span>
            <Badge variant="outline" className="shrink-0 text-xs">
              {material.material_type.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {material.description || "No description available."}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{material.subject.name}</span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded font-medium",
                statusColor[material.verification_status]
              )}
            >
              {material.verification_status}
            </span>
          </div>
          {material.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {material.tags.slice(0, 3).map((t) => (
                <Badge key={t.id} variant="secondary" className="text-xs">
                  {t.name}
                </Badge>
              ))}
              {material.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{material.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            <span>{material.view_count} views</span>
            <span>{material.download_count} downloads</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// ─── Federated material card ──────────────────────────────────────────────────

function FederatedMaterialCard({
  material,
  layout,
}: {
  material: FederatedMaterial
  layout: "grid" | "list"
}) {
  const instanceBadge = (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-normal">
      <Globe className="h-3 w-3" />
      {material.source_instance_domain}
    </span>
  )

  if (layout === "list") {
    return (
      <a href={material.external_url || material.file_url} target="_blank" rel="noreferrer" className="block group">
        <div className="rounded-lg border p-4 hover:bg-muted/40 transition-colors flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium group-hover:text-primary transition-colors truncate">
                {material.title}
              </span>
              <Badge variant="outline" className="text-xs shrink-0">
                {material.material_type}
              </Badge>
              <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
              {material.subject_name} · {material.description || "No description"}
            </p>
          </div>
          <div className="text-xs text-muted-foreground shrink-0 text-right">
            {instanceBadge}
          </div>
        </div>
      </a>
    )
  }

  return (
    <a href={material.external_url || material.file_url} target="_blank" rel="noreferrer" className="block group relative">
      <Card className="h-full hover:shadow-md transition-shadow">
        <div className="absolute top-2 right-2">{instanceBadge}</div>
        <CardHeader className="pb-2 pr-28">
          <span className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {material.title}
          </span>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {material.description || "No description available."}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{material.subject_name}</span>
            <Badge variant="outline" className="text-xs">{material.material_type}</Badge>
          </div>
          <div className="flex items-center gap-1 text-xs text-primary pt-1">
            <ExternalLink className="h-3 w-3" />
            <span>View on source instance</span>
          </div>
        </CardContent>
      </Card>
    </a>
  )
}

// ─── Sidebar filter section ────────────────────────────────────────────────────

function FilterSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [layout, setLayout] = useState<"grid" | "list">("grid")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"local" | "federated">("local")
  const [fedInstanceFilter, setFedInstanceFilter] = useState<string>("all")

  // ── Derive filter state from URL params ────────────────────────────────────
  const rawFilters: MaterialFilters = {
    search: searchParams.get("search") ?? undefined,
    department: searchParams.get("department")
      ? Number(searchParams.get("department"))
      : undefined,
    course: searchParams.get("course")
      ? Number(searchParams.get("course"))
      : undefined,
    semester: searchParams.get("semester")
      ? Number(searchParams.get("semester"))
      : undefined,
    subject: searchParams.get("subject")
      ? Number(searchParams.get("subject"))
      : undefined,
    material_type: searchParams.get("material_type")
      ? Number(searchParams.get("material_type"))
      : undefined,
    verification_status: (searchParams.get("verification_status") as MaterialFilters["verification_status"]) ?? undefined,
    tags: searchParams.get("tags") ?? undefined,
    ordering: searchParams.get("ordering") ?? "-created_at",
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
  }

  function setFilter(key: string, value: string | null) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) {
        next.set(key, value)
        next.set("page", "1")
      } else {
        next.delete(key)
        next.delete("page")
      }
      return next
    })
  }

  function clearAll() {
    setSearchParams({})
  }

  const activeFilterCount = Object.values(rawFilters).filter(
    (v) => v !== undefined && v !== "-created_at" && v !== 1
  ).length

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["materials", rawFilters],
    queryFn: () => materialsApi.getMaterials(rawFilters),
    enabled: activeTab === "local",
  })

  const { data: fedData, isLoading: fedLoading } = useQuery({
    queryKey: ["federated-materials", rawFilters.search, rawFilters.page, fedInstanceFilter],
    queryFn: () =>
      federationApi.listMaterials({
        search: rawFilters.search,
        page: rawFilters.page,
        source_instance: fedInstanceFilter !== "all" ? Number(fedInstanceFilter) : undefined,
      }),
    enabled: activeTab === "federated",
  })

  const { data: instancesData } = useQuery({
    queryKey: ["federation-instances"],
    queryFn: () => federationApi.listInstances(),
    enabled: activeTab === "federated",
  })

  const { data: typesData } = useQuery({
    queryKey: ["material-types"],
    queryFn: () => materialsApi.getMaterialTypes(),
  })

  const { data: deptsData } = useQuery({
    queryKey: ["departments", { is_active: true, page_size: 100 }],
    queryFn: () => academicApi.getDepartments({ is_active: true, page_size: 100 }),
  })

  const materials: Material[] = data?.results ?? []
  const total = data?.count ?? 0
  const materialTypes: MaterialType[] = typesData?.results ?? []
  const departments: Department[] = deptsData?.results ?? []
  const totalPages = Math.ceil(total / 20)
  const currentPage = rawFilters.page ?? 1

  const federatedMaterials: FederatedMaterial[] = fedData?.results ?? []
  const fedTotal = fedData?.count ?? 0
  const fedTotalPages = Math.ceil(fedTotal / 20)
  const federationInstances = instancesData?.results ?? []

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const sidebar = (
    <aside className="space-y-6 sticky top-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Filters</h2>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      <Separator />

      <FilterSection title="Verification Status">
        {(
          [
            { value: "", label: "All" },
            { value: "verified", label: "Verified" },
            { value: "pending", label: "Pending review" },
          ] as const
        ).map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="verification_status"
              value={opt.value}
              checked={
                (rawFilters.verification_status ?? "") === opt.value
              }
              onChange={() =>
                setFilter("verification_status", opt.value || null)
              }
            />
            {opt.label}
          </label>
        ))}
      </FilterSection>

      <Separator />

      <FilterSection title="Material Type">
        <Select
          value={rawFilters.material_type ? String(rawFilters.material_type) : "all"}
          onValueChange={(v) =>
            setFilter("material_type", v === "all" ? null : v)
          }
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {materialTypes.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      <Separator />

      <FilterSection title="Department">
        <Select
          value={rawFilters.department ? String(rawFilters.department) : "all"}
          onValueChange={(v) =>
            setFilter("department", v === "all" ? null : v)
          }
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.code} – {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      {activeTab === "federated" && federationInstances.length > 0 && (
        <>
          <Separator />
          <FilterSection title="Source Instance">
            <Select value={fedInstanceFilter} onValueChange={setFedInstanceFilter}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="All instances" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All instances</SelectItem>
                {federationInstances.map((inst) => (
                  <SelectItem key={inst.id} value={String(inst.id)}>
                    {inst.domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterSection>
        </>
      )}
    </aside>
  )

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold flex-1">Browse Materials</h1>
        <Link to="/materials/upload">
          <Button size="sm">Upload</Button>
        </Link>
      </div>

      {/* Network scope toggle */}
      <div className="inline-flex rounded-lg border overflow-hidden">
        <button
          type="button"
          onClick={() => setActiveTab("local")}
          className={cn(
            "px-4 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5",
            activeTab === "local" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          This Instance
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("federated")}
          className={cn(
            "px-4 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5",
            activeTab === "federated" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Globe className="h-3.5 w-3.5" />
          Federated Network
        </button>
      </div>

      {/* Search + sort toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-8 h-9"
            placeholder="Search materials…"
            value={rawFilters.search ?? ""}
            onChange={(e) =>
              setFilter("search", e.target.value || null)
            }
          />
        </div>

        <Select
          value={rawFilters.ordering ?? "-created_at"}
          onValueChange={(v) => setFilter("ordering", v)}
        >
          <SelectTrigger className="h-9 w-44 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="-created_at">Newest first</SelectItem>
            <SelectItem value="created_at">Oldest first</SelectItem>
            <SelectItem value="-view_count">Most viewed</SelectItem>
            <SelectItem value="-download_count">Most downloaded</SelectItem>
          </SelectContent>
        </Select>

        {/* Mobile sidebar toggle */}
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden"
          onClick={() => setSidebarOpen((o) => !o)}
        >
          <Filter className="w-4 h-4 mr-1.5" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* Layout toggle */}
        <div className="flex rounded-md border overflow-hidden">
          <button
            type="button"
            onClick={() => setLayout("grid")}
            className={cn(
              "p-2 text-muted-foreground transition-colors",
              layout === "grid" && "bg-muted text-foreground"
            )}
          >
            <Grid2X2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setLayout("list")}
            className={cn(
              "p-2 text-muted-foreground transition-colors",
              layout === "list" && "bg-muted text-foreground"
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile sidebar sheet */}
      {sidebarOpen && (
        <div className="lg:hidden rounded-xl border p-5 bg-card">
          {sidebar}
        </div>
      )}

      {/* Main layout: sidebar + grid */}
      <div className="flex gap-6">
        <div className="hidden lg:block w-56 shrink-0">{sidebar}</div>

        <div className="flex-1 min-w-0 space-y-4">
          {/* Result count */}
          {activeTab === "local" && !isLoading && (
            <p className="text-sm text-muted-foreground">
              {total} material{total !== 1 ? "s" : ""} found
            </p>
          )}
          {activeTab === "federated" && !fedLoading && (
            <p className="text-sm text-muted-foreground">
              {fedTotal} federated material{fedTotal !== 1 ? "s" : ""} found across the network
            </p>
          )}

          {/* Grid / list */}
          {activeTab === "local" && (
            isLoading ? (
              <div className={cn(layout === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-2")}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-36 w-full rounded-xl" />
                ))}
              </div>
            ) : materials.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <SlidersHorizontal className="mx-auto w-8 h-8 mb-3 opacity-40" />
                <p>No materials match your filters.</p>
                {activeFilterCount > 0 && (
                  <Button variant="link" className="mt-2" onClick={clearAll}>Clear filters</Button>
                )}
              </div>
            ) : (
              <div className={cn(layout === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-2")}>
                {materials.map((m) => (
                  <MaterialCard key={m.id} material={m} layout={layout} />
                ))}
              </div>
            )
          )}

          {activeTab === "federated" && (
            fedLoading ? (
              <div className={cn(layout === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-2")}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-36 w-full rounded-xl" />
                ))}
              </div>
            ) : federatedMaterials.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Globe className="mx-auto w-8 h-8 mb-3 opacity-40" />
                <p>No federated materials found.</p>
                <p className="text-xs mt-1">Add trusted instances in the Federation admin to see their materials here.</p>
              </div>
            ) : (
              <div className={cn(layout === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-2")}>
                {federatedMaterials.map((m) => (
                  <FederatedMaterialCard key={`${m.source_instance}-${m.original_id}`} material={m} layout={layout} />
                ))}
              </div>
            )
          )}

          {/* Pagination — local */}
          {activeTab === "local" && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setFilter("page", String(currentPage - 1))}>Previous</Button>
              <span className="text-sm text-muted-foreground">{currentPage} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setFilter("page", String(currentPage + 1))}>Next</Button>
            </div>
          )}

          {/* Pagination — federated */}
          {activeTab === "federated" && fedTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setFilter("page", String(currentPage - 1))}>Previous</Button>
              <span className="text-sm text-muted-foreground">{currentPage} / {fedTotalPages}</span>
              <Button variant="outline" size="sm" disabled={currentPage >= fedTotalPages} onClick={() => setFilter("page", String(currentPage + 1))}>Next</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
