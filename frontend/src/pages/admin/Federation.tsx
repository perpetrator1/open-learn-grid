import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Globe,
  Shield,
  ShieldOff,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Plus,
  ExternalLink,
  AlertTriangle,
  Activity,
  BarChart3,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { federationApi } from "@/lib/federation-api"
import type { FederatedInstance, InstanceDiscoveryInfo, TrustLevel } from "@/types"

// ── Trust badge ──────────────────────────────────────────────────────────────

function TrustBadge({ level }: { level: TrustLevel }) {
  const map: Record<TrustLevel, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    trusted: { label: "Trusted", variant: "default" },
    neutral: { label: "Neutral", variant: "secondary" },
    blocked: { label: "Blocked", variant: "destructive" },
  }
  const { label, variant } = map[level] ?? map.neutral
  return <Badge variant={variant}>{label}</Badge>
}

function ReachableBadge({ ok }: { ok: boolean }) {
  return (
    <Badge variant={ok ? "default" : "secondary"} className={ok ? "bg-green-600" : "bg-gray-400"}>
      {ok ? "Online" : "Offline"}
    </Badge>
  )
}

// ── Add Instance Dialog ───────────────────────────────────────────────────────

function AddInstanceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [domain, setDomain] = useState("")
  const [preview, setPreview] = useState<InstanceDiscoveryInfo | null>(null)
  const [fetchError, setFetchError] = useState("")
  const qc = useQueryClient()

  const fetchMutation = useMutation({
    mutationFn: (d: string) => federationApi.fetchInstanceInfo(d),
    onSuccess: (data) => { setPreview(data); setFetchError("") },
    onError: (e: Error) => { setFetchError(e.message); setPreview(null) },
  })

  const addMutation = useMutation({
    mutationFn: () => federationApi.addInstance(domain),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["federation-instances"] })
      onClose()
      setDomain("")
      setPreview(null)
    },
  })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Federated Instance</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                placeholder="learngrid.example.edu"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => fetchMutation.mutate(domain)}
                disabled={!domain || fetchMutation.isPending}
              >
                {fetchMutation.isPending ? "Fetching…" : "Fetch Info"}
              </Button>
            </div>
          </div>

          {fetchError && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" /> {fetchError}
            </p>
          )}

          {preview && (
            <div className="rounded-md border p-4 space-y-2 text-sm">
              <p className="font-medium text-base">{preview.name}</p>
              {preview.description && <p className="text-muted-foreground">{preview.description}</p>}
              <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                <span>Admin:</span><span>{preview.admin_email || "—"}</span>
                <span>Version:</span><span>{preview.software_version}</span>
                <span>Materials:</span><span>{preview.material_count.toLocaleString()}</span>
                <span>Users:</span><span>{preview.user_count.toLocaleString()}</span>
                <span>Registration:</span><span>{preview.registration_open ? "Open" : "Closed"}</span>
                <span>Key fingerprint:</span>
                <span className="font-mono text-xs">{preview.public_key ? preview.public_key.slice(27, 43) + "…" : "—"}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!preview || addMutation.isPending}
            onClick={() => addMutation.mutate()}
          >
            {addMutation.isPending ? "Adding…" : "Add Instance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Trust Dialog ──────────────────────────────────────────────────────────────

function TrustDialog({
  instance,
  open,
  onClose,
}: {
  instance: FederatedInstance | null
  open: boolean
  onClose: () => void
}) {
  const [level, setLevel] = useState<TrustLevel>("neutral")
  const [reason, setReason] = useState("")
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => federationApi.setTrust(instance!.id, level, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["federation-instances"] }); onClose() },
  })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Trust Level — {instance?.domain}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Trust Level</Label>
            <Select value={level} onValueChange={(v) => setLevel(v as TrustLevel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="trusted">Trusted — accepts activities, syncs materials</SelectItem>
                <SelectItem value="neutral">Neutral — limited interaction</SelectItem>
                <SelectItem value="blocked">Blocked — all activities rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {level === "blocked" && (
            <div>
              <Label>Reason for blocking</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe why this instance is being blocked…" />
            </div>
          )}
          {level === "blocked" && (
            <p className="text-sm text-destructive flex gap-1">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              This instance will be blocked immediately and all future activities will be rejected.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant={level === "blocked" ? "destructive" : "default"}
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Instances Tab ─────────────────────────────────────────────────────────────

function InstancesTab() {
  const [showAdd, setShowAdd] = useState(false)
  const [trustTarget, setTrustTarget] = useState<FederatedInstance | null>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["federation-instances"],
    queryFn: () => federationApi.listInstances(),
  })

  const syncMutation = useMutation({
    mutationFn: (id: number) => federationApi.syncInstance(id),
  })

  const removeMutation = useMutation({
    mutationFn: (id: number) => federationApi.removeInstance(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["federation-instances"] }),
  })

  const instances = data?.results ?? []

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Instance
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : instances.length === 0 ? (
        <p className="text-muted-foreground text-sm">No federated instances configured.</p>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">Instance</th>
                <th className="text-left p-3">Trust</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Materials</th>
                <th className="text-right p-3">Users</th>
                <th className="text-left p-3">Last Seen</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {instances.map((inst) => (
                <tr key={inst.id} className="border-t hover:bg-muted/30">
                  <td className="p-3">
                    <div className="font-medium">{inst.name}</div>
                    <div className="text-muted-foreground text-xs">{inst.domain}</div>
                    {inst.is_home && <Badge variant="outline" className="text-xs mt-1">Home</Badge>}
                  </td>
                  <td className="p-3"><TrustBadge level={inst.trust_level} /></td>
                  <td className="p-3"><ReachableBadge ok={inst.is_reachable} /></td>
                  <td className="p-3 text-right">{inst.material_count.toLocaleString()}</td>
                  <td className="p-3 text-right">{inst.user_count.toLocaleString()}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {inst.last_seen_at ? new Date(inst.last_seen_at).toLocaleDateString() : "Never"}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost" size="icon"
                        title="Change trust"
                        onClick={() => setTrustTarget(inst)}
                        disabled={inst.is_home}
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        title="Sync now"
                        onClick={() => syncMutation.mutate(inst.id)}
                        disabled={inst.is_home}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        title="Open domain"
                        asChild
                      >
                        <a href={`https://${inst.domain}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      {!inst.is_home && (
                        <Button
                          variant="ghost" size="icon"
                          title="Remove instance"
                          className="text-destructive"
                          onClick={() => {
                            if (confirm(`Remove ${inst.domain}?`)) removeMutation.mutate(inst.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddInstanceDialog open={showAdd} onClose={() => setShowAdd(false)} />
      <TrustDialog instance={trustTarget} open={!!trustTarget} onClose={() => setTrustTarget(null)} />
    </div>
  )
}

// ── Activity Log Tab ──────────────────────────────────────────────────────────

const ACTIVITY_LABELS: Record<string, string> = {
  material_shared: "Material Shared",
  material_updated: "Material Updated",
  material_removed: "Material Removed",
  user_reported: "User Reported",
  instance_announcement: "Announcement",
  instance_stats_update: "Stats Update",
}

const STATUS_COLORS: Record<string, string> = {
  received: "secondary",
  processing: "outline",
  processed: "default",
  failed: "destructive",
}

function ActivityLogTab() {
  const [filters, setFilters] = useState<Record<string, string>>({})
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["federation-activities", filters],
    queryFn: () => federationApi.listActivities(filters),
  })

  const retryMutation = useMutation({
    mutationFn: (id: number) => federationApi.retryActivity(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["federation-activities"] }),
  })

  const [selected, setSelected] = useState<(typeof data)["results"][0] | null>(null)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select onValueChange={(v) => setFilters((f) => ({ ...f, activity_type: v === "all" ? "" : v }))}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={(v) => setFilters((f) => ({ ...f, status: v === "all" ? "" : v }))}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="processed">Processed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">Time</th>
                <th className="text-left p-3">From</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.results ?? []).map((act) => (
                <tr key={act.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => setSelected(act)}>
                  <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(act.created_at).toLocaleString()}
                  </td>
                  <td className="p-3 font-mono text-xs">{act.from_instance_domain}</td>
                  <td className="p-3">
                    <Badge variant="outline">{ACTIVITY_LABELS[act.activity_type] ?? act.activity_type}</Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant={(STATUS_COLORS[act.status] ?? "secondary") as "default" | "secondary" | "outline" | "destructive"}>
                      {act.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {act.status === "failed" && (
                      <Button
                        variant="outline" size="sm"
                        onClick={() => retryMutation.mutate(act.id)}
                        disabled={retryMutation.isPending}
                      >
                        Retry
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail drawer */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Activity Detail — {selected?.activity_id}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Type:</span>
                <Badge variant="outline">{ACTIVITY_LABELS[selected.activity_type]}</Badge>
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={(STATUS_COLORS[selected.status] ?? "secondary") as "default" | "secondary" | "outline" | "destructive"}>
                  {selected.status}
                </Badge>
                <span className="text-muted-foreground">From:</span>
                <span className="font-mono">{selected.from_instance_domain}</span>
                <span className="text-muted-foreground">Received:</span>
                <span>{new Date(selected.created_at).toLocaleString()}</span>
                <span className="text-muted-foreground">Processed:</span>
                <span>{selected.processed_at ? new Date(selected.processed_at).toLocaleString() : "—"}</span>
                <span className="text-muted-foreground">Retries:</span>
                <span>{selected.retry_count}</span>
              </div>
              {selected.error_message && (
                <div className="rounded bg-destructive/10 p-3 text-destructive text-xs font-mono">
                  {selected.error_message}
                </div>
              )}
              <div>
                <p className="text-muted-foreground mb-1">Payload:</p>
                <pre className="rounded bg-muted p-3 text-xs overflow-x-auto">
                  {JSON.stringify(selected.payload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Blocked Instances Tab ─────────────────────────────────────────────────────

function BlockedTab() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["federation-blocks"],
    queryFn: () => federationApi.listBlocks(),
  })

  const unblockMutation = useMutation({
    mutationFn: (id: number) => federationApi.unblockInstance(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["federation-blocks"] })
      qc.invalidateQueries({ queryKey: ["federation-instances"] })
    },
  })

  const blocks = data?.results ?? []

  return (
    <div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : blocks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No blocked instances.</p>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">Instance</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Blocked By</th>
                <th className="text-left p-3">Reason</th>
                <th className="text-left p-3">Date</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{b.instance_name}</div>
                    <div className="text-xs text-muted-foreground">{b.instance_domain}</div>
                  </td>
                  <td className="p-3 text-xs">{b.block_type.replace(/_/g, " ")}</td>
                  <td className="p-3 text-xs">{b.blocked_by_username || "—"}</td>
                  <td className="p-3 text-xs max-w-[200px] truncate">{b.reason}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(b.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => {
                        if (confirm(`Unblock ${b.instance_domain}?`)) unblockMutation.mutate(b.id)
                      }}
                    >
                      Unblock
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Statistics Tab ────────────────────────────────────────────────────────────

function StatsTab() {
  const { data: metrics } = useQuery({
    queryKey: ["federation-metrics"],
    queryFn: () => federationApi.getMetrics(),
  })
  const { data: instances } = useQuery({
    queryKey: ["federation-instances"],
    queryFn: () => federationApi.listInstances(),
  })

  const cards = [
    { label: "Total Instances", value: instances?.count ?? 0, icon: Globe },
    { label: "Trusted", value: metrics?.trusted_instances ?? 0, icon: ShieldCheck },
    { label: "Federated Materials", value: metrics?.total_federated_materials ?? 0, icon: BarChart3 },
    { label: "Activities (24h)", value: metrics?.activities_received_24h ?? 0, icon: Activity },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className="h-8 w-8 text-muted-foreground shrink-0" />
              <div>
                <div className="text-2xl font-bold">{value.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {metrics?.activities_failed != null && metrics.activities_failed > 0 && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm">
            <strong>{metrics.activities_failed}</strong> activities failed and need attention. Check the Activity Log tab.
          </p>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Instance Health</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(instances?.results ?? []).filter((i) => !i.is_home).map((inst) => (
              <div key={inst.id} className="flex items-center justify-between py-1 border-b last:border-0">
                <div>
                  <span className="font-medium text-sm">{inst.domain}</span>
                  <span className="text-xs text-muted-foreground ml-2">{inst.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrustBadge level={inst.trust_level} />
                  <ReachableBadge ok={inst.is_reachable} />
                  <span className="text-xs text-muted-foreground">
                    {inst.last_seen_at ? new Date(inst.last_seen_at).toLocaleDateString() : "Never"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FederationAdmin() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Globe className="h-7 w-7" />
        <div>
          <h1 className="text-2xl font-bold">Federation Management</h1>
          <p className="text-muted-foreground text-sm">
            Manage trusted instances, monitor activity, and control federated content.
          </p>
        </div>
      </div>

      <Tabs defaultValue="instances">
        <TabsList>
          <TabsTrigger value="instances"><Globe className="h-4 w-4 mr-1" />Instances</TabsTrigger>
          <TabsTrigger value="activity"><Activity className="h-4 w-4 mr-1" />Activity Log</TabsTrigger>
          <TabsTrigger value="blocked"><Lock className="h-4 w-4 mr-1" />Blocked</TabsTrigger>
          <TabsTrigger value="stats"><BarChart3 className="h-4 w-4 mr-1" />Statistics</TabsTrigger>
        </TabsList>
        <TabsContent value="instances" className="mt-4"><InstancesTab /></TabsContent>
        <TabsContent value="activity" className="mt-4"><ActivityLogTab /></TabsContent>
        <TabsContent value="blocked" className="mt-4"><BlockedTab /></TabsContent>
        <TabsContent value="stats" className="mt-4"><StatsTab /></TabsContent>
      </Tabs>
    </div>
  )
}
