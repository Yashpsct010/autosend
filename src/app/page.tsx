"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  Send,
  Clock,
  XCircle,
  FileText,
  TrendingUp,
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

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${color}`} />
      <div className="relative">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg mb-4`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="text-3xl font-bold text-white mb-1">
          {value.toLocaleString()}
        </div>
        <div className="text-sm text-white/50">{label}</div>
        {sub && <div className="text-xs text-white/30 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
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

  const stats = [
    {
      label: "Total Contacts",
      value: data?.totalContacts ?? 0,
      icon: Users,
      color: "from-violet-500 to-indigo-600",
    },
    {
      label: "Emails Sent",
      value: data?.totalSent ?? 0,
      icon: Send,
      color: "from-emerald-500 to-teal-600",
    },
    {
      label: "Queued",
      value: data?.totalQueued ?? 0,
      icon: Clock,
      color: "from-amber-500 to-orange-600",
    },
    {
      label: "Failed",
      value: data?.totalFailed ?? 0,
      icon: XCircle,
      color: "from-rose-500 to-pink-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-white/40 mt-1 text-sm">
          Your outreach campaign overview
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Chart + Top Templates */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Area Chart */}
        <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-5 w-5 text-violet-400" />
            <h2 className="text-base font-semibold text-white">
              Emails Sent – Last 30 Days
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data?.chartData ?? []}>
              <defs>
                <linearGradient id="sentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#1a1a2e",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: "white",
                }}
              />
              <Area
                type="monotone"
                dataKey="sent"
                stroke="#7c3aed"
                strokeWidth={2}
                fill="url(#sentGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Templates */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">
              Top Templates
            </h2>
          </div>
          {data?.topTemplates && data.topTemplates.length > 0 ? (
            <div className="space-y-3">
              {data.topTemplates.map((t, i) => {
                const max = data.topTemplates[0].count;
                const pct = Math.round((t.count / max) * 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/70 truncate max-w-[140px]">{t.name}</span>
                      <span className="text-white/40">{t.count}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-white/30">
              <FileText className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No template data yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
