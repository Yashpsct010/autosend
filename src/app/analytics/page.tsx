"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
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
import {
  Users,
  Send,
  Clock,
  XCircle,
  FileText,
  TrendingUp,
  BarChart2,
} from "lucide-react";

interface AnalyticsData {
  totalContacts: number;
  totalSent: number;
  totalQueued: number;
  totalFailed: number;
  totalDraft: number;
  chartData: { date: string; sent: number }[];
  topTemplates: { name: string; count: number }[];
}

const PIE_COLORS = ["#7c3aed", "#6366f1", "#10b981", "#f59e0b", "#f43f5e"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const pieData = [
    { name: "Sent", value: data?.totalSent ?? 0 },
    { name: "Queued", value: data?.totalQueued ?? 0 },
    { name: "Draft", value: data?.totalDraft ?? 0 },
    { name: "Failed", value: data?.totalFailed ?? 0 },
  ].filter((d) => d.value > 0);

  const totalEmails =
    (data?.totalSent ?? 0) +
    (data?.totalQueued ?? 0) +
    (data?.totalFailed ?? 0) +
    (data?.totalDraft ?? 0);

  const deliveryRate =
    totalEmails > 0
      ? Math.round(((data?.totalSent ?? 0) / totalEmails) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-white/40 mt-1 text-sm">
          Deep dive into your outreach campaign performance
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          {
            label: "Total Contacts",
            value: data?.totalContacts ?? 0,
            icon: Users,
            color: "text-violet-400",
            bg: "bg-violet-500/10",
          },
          {
            label: "Emails Sent",
            value: data?.totalSent ?? 0,
            icon: Send,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Queued",
            value: data?.totalQueued ?? 0,
            icon: Clock,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
          },
          {
            label: "Failed",
            value: data?.totalFailed ?? 0,
            icon: XCircle,
            color: "text-rose-400",
            bg: "bg-rose-500/10",
          },
          {
            label: "Delivery Rate",
            value: deliveryRate,
            icon: TrendingUp,
            color: "text-indigo-400",
            bg: "bg-indigo-500/10",
            suffix: "%",
          },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col gap-2"
            >
              <div className={`h-8 w-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <Icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="text-2xl font-bold text-white">
                {s.value.toLocaleString()}
                {s.suffix ?? ""}
              </div>
              <div className="text-xs text-white/40">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Area Chart - Sent over time */}
        <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-5 w-5 text-violet-400" />
            <h2 className="text-base font-semibold text-white">
              Emails Sent — Last 30 Days
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.chartData ?? []}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#1a1a2e",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: "#fff",
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="sent"
                stroke="#7c3aed"
                strokeWidth={2}
                fill="url(#grad1)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart - status breakdown */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart2 className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">
              Status Breakdown
            </h2>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#1a1a2e",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "#fff",
                    fontSize: 12,
                  }}
                />
                <Legend
                  formatter={(v) => (
                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-52 text-white/30">
              <BarChart2 className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm">No outreach data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Templates Bar Chart */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="h-5 w-5 text-violet-400" />
            <h2 className="text-base font-semibold text-white">
              Top Templates by Usage
            </h2>
          </div>
          {data?.topTemplates && data.topTemplates.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={data.topTemplates}
                layout="vertical"
                margin={{ left: 0, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a2e",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "#fff",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="#7c3aed" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-white/30">
              <FileText className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">No template data yet</p>
            </div>
          )}
        </div>

        {/* Summary Stats Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart2 className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">
              Campaign Summary
            </h2>
          </div>
          <div className="space-y-4">
            {[
              { label: "Total outreaches", value: totalEmails },
              { label: "Successfully sent", value: data?.totalSent ?? 0, color: "text-emerald-400" },
              { label: "Currently queued", value: data?.totalQueued ?? 0, color: "text-amber-400" },
              { label: "Drafts", value: data?.totalDraft ?? 0, color: "text-blue-400" },
              { label: "Failed sends", value: data?.totalFailed ?? 0, color: "text-rose-400" },
              { label: "Delivery rate", value: `${deliveryRate}%`, color: "text-violet-400" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-sm text-white/50">{row.label}</span>
                <span className={`text-sm font-semibold ${row.color ?? "text-white"}`}>
                  {typeof row.value === "number" ? row.value.toLocaleString() : row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
