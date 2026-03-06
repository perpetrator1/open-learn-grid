import { useEffect, useState } from "react";
import {
  Users,
  BookOpen,
  ShieldCheck,
  Flag,
  BarChart2,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { dashboardApi } from "@/lib/dashboard-api";
import type { DashboardStats, ActivityItem, ChartDataPoint } from "@/types";
import { Link } from "react-router-dom";
import React from "react";

const PIE_COLORS = ["#3b82f6", "#10b981", "#ef4444", "#f59e0b"];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [verificationData, setVerificationData] = useState<{ label: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.stats().then(setStats),
      dashboardApi.activity({ page_size: 10 } as never).then((d) => setActivity(d.results ?? [])),
      dashboardApi.materialsOverTime({ days: 14 }).then(setChartData),
      dashboardApi.verificationStatus().then(setVerificationData),
    ]).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { icon: <Users className="h-5 w-5" />, label: "Total Users", value: stats?.total_users ?? "—", color: "text-blue-500" },
    { icon: <BookOpen className="h-5 w-5" />, label: "Total Materials", value: stats?.total_materials ?? "—", color: "text-green-500" },
    { icon: <ShieldCheck className="h-5 w-5" />, label: "Pending Verification", value: stats?.pending_verification ?? "—", color: "text-yellow-500" },
    { icon: <Flag className="h-5 w-5" />, label: "Active Reports", value: stats?.active_reports ?? "—", color: "text-red-500" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Link
            to="/verification/queue"
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            Verification Queue ({stats?.pending_verification ?? 0})
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={s.color}>{s.icon}</div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart2 className="h-4 w-4" /> Materials (Last 14 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground">Loading…</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verification Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground">Loading…</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={verificationData}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ label, percent }) =>
                      `${label} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {verificationData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-4 text-center">Loading…</p>
          ) : activity.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No activity yet</p>
          ) : (
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                  <div className="flex-1">
                    <p>{item.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {item.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-3 border-t">
            <Link to="/admin/audit-log" className="text-xs text-blue-600 hover:underline">
              View full audit log →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
