import { useEffect, useState } from "react";
import { BookOpen, CheckCircle, Clock, UploadCloud } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { dashboardApi } from "@/lib/dashboard-api";
import { materialsApi } from "@/lib/materials-api";
import type { DashboardStats, ChartDataPoint, Material } from "@/types";
import { Link } from "react-router-dom";
import React from "react";

export default function TeacherDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [myMaterials, setMyMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.stats().then(setStats),
      dashboardApi.materialsOverTime({ days: 30 }).then(setChartData),
      materialsApi
        .getMaterials({ ordering: "-created_at", page_size: 5 } as never)
        .then((d) => setMyMaterials(d.results)),
    ]).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { icon: <UploadCloud />, label: "My Materials", value: stats?.my_materials ?? "—" },
    { icon: <CheckCircle />, label: "Verified", value: stats?.my_verified ?? "—" },
    { icon: <Clock />, label: "Pending Review", value: stats?.my_pending ?? "—" },
    { icon: <BookOpen />, label: "Total Subjects", value: stats?.total_subjects ?? "—" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
        <Button asChild>
          <Link to="/materials/upload">Upload Material</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="text-muted-foreground">{s.icon}</div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">Materials Uploaded (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              Loading chart…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* My Recent Materials */}
      <h2 className="text-lg font-semibold mb-3">My Recent Materials</h2>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {myMaterials.map((m) => (
              <tr key={m.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link
                    to={`/materials/${m.id}`}
                    className="hover:underline text-blue-600 font-medium"
                  >
                    {m.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      m.verification_status === "verified"
                        ? "default"
                        : m.verification_status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {m.verification_status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(m.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
