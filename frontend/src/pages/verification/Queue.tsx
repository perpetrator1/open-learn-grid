import { useEffect, useState } from "react";
import { ShieldCheck, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { materialsApi } from "@/lib/materials-api";
import type { Material } from "@/types";
import { Link } from "react-router-dom";
import { apiClient } from "@/lib/api";

export default function VerificationQueuePage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState({ search: "", department: "", material_type: "" });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await materialsApi.getMaterials({
        verification_status: "pending",
        search: filters.search || undefined,
        department: filters.department ? Number(filters.department) : undefined,
        page,
      });
      setMaterials(data.results);
      setTotal(data.count);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [page]);

  const toggleSelect = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleBulkVerify = async (status: "verified" | "rejected") => {
    await Promise.all(
      [...selected].map((id) =>
        apiClient.patch(`/api/materials/${id}/`, { verification_status: status })
      )
    );
    setSelected(new Set());
    fetchQueue();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Verification Queue</h1>
            <p className="text-sm text-muted-foreground">{total} pending</p>
          </div>
        </div>
        {selected.size > 0 && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleBulkVerify("rejected")}>
              Reject ({selected.size})
            </Button>
            <Button size="sm" onClick={() => handleBulkVerify("verified")}>
              Verify ({selected.size})
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Input
          placeholder="Search materials…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="max-w-xs"
        />
        <Button variant="outline" size="icon" onClick={fetchQueue}>
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading queue…</div>
      ) : materials.length === 0 ? (
        <div className="text-center py-16">
          <ShieldCheck className="h-12 w-12 mx-auto text-green-500 mb-3" />
          <h3 className="text-lg font-medium">Queue is empty</h3>
          <p className="text-sm text-muted-foreground">All materials are verified!</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.size === materials.length}
                    onChange={(e) =>
                      setSelected(e.target.checked ? new Set(materials.map((m) => m.id)) : new Set())
                    }
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Uploader</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(m.id)}
                      onChange={() => toggleSelect(m.id)}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/materials/${m.id}`} className="hover:underline text-blue-600">
                      {m.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.uploaded_by?.display_name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{m.material_type?.name ?? "—"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() =>
                          apiClient
                            .patch(`/api/materials/${m.id}/`, { verification_status: "rejected" })
                            .then(fetchQueue)
                        }
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                          apiClient
                            .patch(`/api/materials/${m.id}/`, { verification_status: "verified" })
                            .then(fetchQueue)
                        }
                      >
                        Verify
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t text-sm text-muted-foreground">
            <span>Page {page}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page * 20 >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
