import { useEffect, useState } from "react";
import { BookOpen, CheckCircle, Clock, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { dashboardApi } from "@/lib/dashboard-api";
import { materialsApi } from "@/lib/materials-api";
import type { DashboardStats, Material } from "@/types";
import { Link } from "react-router-dom";

export default function StudentDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.stats().then(setStats),
      materialsApi
        .getMaterials({ ordering: "-created_at", page_size: 6, verification_status: "verified" } as never)
        .then((d) => setRecent(d.results)),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Student Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<BookOpen />} label="Total Materials" value={stats?.total_materials ?? "—"} />
        <StatCard icon={<CheckCircle />} label="Verified" value={stats?.verified_materials ?? "—"} />
        <StatCard icon={<Star />} label="Subjects" value={stats?.total_subjects ?? "—"} />
        <StatCard icon={<Clock />} label="Pending" value={stats?.pending_verification ?? "—"} />
      </div>

      {/* Recent Materials */}
      <h2 className="text-lg font-semibold mb-3">Recently Added Materials</h2>
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recent.map((m) => (
            <Card key={m.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium line-clamp-2">
                  <Link to={`/materials/${m.id}`} className="hover:underline text-blue-600">
                    {m.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">{m.material_type?.name ?? "—"}</Badge>
                  {m.verification_status === "verified" && (
                    <Badge className="bg-green-100 text-green-800">Verified</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(m.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link to="/materials" className="text-blue-600 hover:underline text-sm">
          Browse all materials →
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="text-muted-foreground">{icon}</div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
