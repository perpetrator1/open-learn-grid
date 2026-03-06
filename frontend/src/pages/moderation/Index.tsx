import { useEffect, useState } from "react";
import { Flag, Ban, MessageSquare } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import * as moderationApi from "@/lib/moderation-api";
import type { Report, Ban as BanType, Appeal } from "@/types";

// ─── Report Status Badge ──────────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800",
  under_review: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  dismissed: "bg-gray-100 text-gray-600",
};

// ─── Reports Tab ─────────────────────────────────────────────────────────────
function ReportsTab() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolveDialog, setResolveDialog] = useState<Report | null>(null);
  const [actionText, setActionText] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");

  const load = () =>
    moderationApi
      .getReports({ status: statusFilter, page_size: 30 } as never)
      .then((r) => setReports(r.data.results ?? []))
      .finally(() => setLoading(false));

  useEffect(() => {
    setLoading(true);
    load();
  }, [statusFilter]);

  const doResolve = async (status: "resolved" | "dismissed") => {
    if (!resolveDialog) return;
    await moderationApi.resolveReport(resolveDialog.id, { status, action_taken: actionText });
    setResolveDialog(null);
    setActionText("");
    load();
  };

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground py-8 text-center">Loading…</p>
      ) : reports.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">No reports found</p>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[r.status]}`}>
                      {r.status.replace("_", " ")}
                    </span>
                    <Badge variant="outline">{r.reported_item_type}</Badge>
                    <Badge variant="outline">{r.reason.replace(/_/g, " ")}</Badge>
                  </div>
                  <p className="text-sm">{r.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(r.created_at).toLocaleString()}
                    {r.reporter && ` · by ${r.reporter.display_name}`}
                  </p>
                </div>
                {r.status === "open" || r.status === "under_review" ? (
                  <div className="flex gap-2 shrink-0 ml-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setResolveDialog(r); setActionText(""); }}
                    >
                      Resolve
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!resolveDialog} onOpenChange={() => setResolveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Report #{resolveDialog?.id}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Describe the action taken (optional)…"
            value={actionText}
            onChange={(e) => setActionText(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => doResolve("dismissed")}>
              Dismiss
            </Button>
            <Button onClick={() => doResolve("resolved")}>Mark Resolved</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Bans Tab ─────────────────────────────────────────────────────────────────
function BansTab() {
  const [bans, setBans] = useState<BanType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActive, setShowActive] = useState(true);

  const load = () =>
    moderationApi
      .getBans({ is_active: showActive } as never)
      .then((r) => setBans(r.data.results ?? []))
      .finally(() => setLoading(false));

  useEffect(() => {
    setLoading(true);
    load();
  }, [showActive]);

  const doLift = async (id: number) => {
    await moderationApi.liftBan(id);
    load();
  };

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <Button
          variant={showActive ? "default" : "outline"}
          size="sm"
          onClick={() => setShowActive(true)}
        >
          Active
        </Button>
        <Button
          variant={!showActive ? "default" : "outline"}
          size="sm"
          onClick={() => setShowActive(false)}
        >
          Inactive
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground py-8 text-center">Loading…</p>
      ) : bans.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">No bans</p>
      ) : (
        <div className="space-y-2">
          {bans.map((b) => (
            <div key={b.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{b.user.display_name}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary">{b.scope.replace(/_/g, " ")}</Badge>
                    {b.is_expired && <Badge variant="outline">Expired</Badge>}
                  </div>
                  <p className="text-sm mt-1">{b.reason}</p>
                  {b.expires_at && (
                    <p className="text-xs text-muted-foreground">
                      Expires: {new Date(b.expires_at).toLocaleString()}
                    </p>
                  )}
                </div>
                {b.is_active && !b.is_expired && (
                  <Button size="sm" variant="outline" onClick={() => doLift(b.id)}>
                    Lift Ban
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Appeals Tab ─────────────────────────────────────────────────────────────
function AppealsTab() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialog, setReviewDialog] = useState<Appeal | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const load = () =>
    moderationApi
      .getAppeals({ status: "pending" } as never)
      .then((r) => setAppeals(r.data.results ?? []))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const doReview = async (status: "approved" | "rejected") => {
    if (!reviewDialog) return;
    await moderationApi.reviewAppeal(reviewDialog.id, { status, review_note: reviewNote });
    setReviewDialog(null);
    setReviewNote("");
    load();
  };

  return (
    <div>
      {loading ? (
        <p className="text-muted-foreground py-8 text-center">Loading…</p>
      ) : appeals.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">No pending appeals</p>
      ) : (
        <div className="space-y-2">
          {appeals.map((a) => (
            <div key={a.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{a.appellant.display_name}</p>
                  <p className="text-sm mt-1">{a.reason}</p>
                  {a.supporting_evidence && (
                    <p className="text-xs text-muted-foreground mt-1">{a.supporting_evidence}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0 ml-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setReviewDialog(a); setReviewNote(""); }}
                  >
                    Review
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!reviewDialog} onOpenChange={() => setReviewDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Appeal #{reviewDialog?.id}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Review note…"
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => doReview("rejected")}>
              Reject
            </Button>
            <Button onClick={() => doReview("approved")}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ModerationPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Flag className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Moderation</h1>
      </div>

      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports" className="flex items-center gap-1.5">
            <Flag className="h-4 w-4" /> Reports
          </TabsTrigger>
          <TabsTrigger value="bans" className="flex items-center gap-1.5">
            <Ban className="h-4 w-4" /> Bans
          </TabsTrigger>
          <TabsTrigger value="appeals" className="flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" /> Appeals
          </TabsTrigger>
        </TabsList>
        <TabsContent value="reports" className="mt-6">
          <ReportsTab />
        </TabsContent>
        <TabsContent value="bans" className="mt-6">
          <BansTab />
        </TabsContent>
        <TabsContent value="appeals" className="mt-6">
          <AppealsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
