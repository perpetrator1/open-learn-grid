import { useEffect, useState } from "react";
import { FileText, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { auditApi } from "@/lib/audit-api";
import type { AuditLog } from "@/types";

const PAGE_SIZE = 25;

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    action: "",
    target_type: "",
    date_from: "",
    date_to: "",
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries({ ...filters, page, page_size: PAGE_SIZE }).filter(([, v]) => v !== "")
      ) as Record<string, string | number>;
      const data = await auditApi.list(params);
      setLogs(data.results ?? []);
      setTotal(data.count ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const handleExport = () => {
    auditApi.exportCsv(
      Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== "")
      ) as Record<string, string>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Audit Log</h1>
            <p className="text-sm text-muted-foreground">{total} entries</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 rounded-lg bg-muted/30 border">
        <Input
          placeholder="Filter by action (e.g. material.verify)"
          value={filters.action}
          onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
          className="w-56"
        />
        <Input
          placeholder="Target type (e.g. material)"
          value={filters.target_type}
          onChange={(e) => setFilters((f) => ({ ...f, target_type: e.target.value }))}
          className="w-44"
        />
        <Input
          type="date"
          value={filters.date_from}
          onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
          className="w-40"
        />
        <Input
          type="date"
          value={filters.date_to}
          onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
          className="w-40"
        />
        <Button size="sm" onClick={() => { setPage(1); fetchLogs(); }}>
          <Filter className="h-4 w-4 mr-1" /> Apply
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-center text-muted-foreground py-12">Loading…</p>
      ) : logs.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No entries found</p>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Timestamp</th>
                <th className="px-4 py-3 text-left font-medium">Actor</th>
                <th className="px-4 py-3 text-left font-medium">Action</th>
                <th className="px-4 py-3 text-left font-medium">Target</th>
                <th className="px-4 py-3 text-left font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {log.actor ? log.actor.display_name : <span className="text-muted-foreground">System</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="font-mono text-xs">
                      {log.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {log.target_type && (
                      <span className="text-muted-foreground">{log.target_type}/</span>
                    )}
                    <span>{log.target_repr || log.target_id || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                    {log.metadata?.ip ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t text-sm text-muted-foreground">
            <span>
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page * PAGE_SIZE >= total}
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
