import { useState, useEffect } from "react";
import API from "@/lib/api";
import { DASHBOARD } from "@/constants/testIds";
import StatsCard from "@/components/StatsCard";
import StatusPill from "@/components/StatusPill";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { TrendingUp, AlertTriangle, Layers, DollarSign, Activity, Skull } from "lucide-react";

const COLORS = { healthy: "#10B981", watch: "#F59E0B", fatiguing: "#F97316", dead: "#EF4444" };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip" style={{ background: "#0D1411", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: 12 }}>
      <p className="text-xs text-[#94A3B8] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-mono" style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ov, tr, pb, al] = await Promise.all([
          API.get("/dashboard/overview"),
          API.get("/dashboard/trends"),
          API.get("/dashboard/platform-breakdown"),
          API.get("/alerts"),
        ]);
        setOverview(ov.data);
        setTrends(tr.data.trends || []);
        setPlatforms(pb.data.platforms || []);
        setAlerts(al.data.alerts?.slice(0, 5) || []);
      } catch (e) {
        console.error("Dashboard load error:", e);
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading || !overview) return (
    <div className="p-8" data-testid={DASHBOARD.page}>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton-shimmer h-24 rounded-xl" />)}
      </div>
      <div className="skeleton-shimmer h-72 rounded-xl mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeleton-shimmer h-64 rounded-xl" />
        <div className="skeleton-shimmer h-64 rounded-xl" />
      </div>
    </div>
  );

  const statusData = [
    { name: "Healthy", value: overview.healthy_count, fill: COLORS.healthy },
    { name: "Watch", value: overview.watch_count, fill: COLORS.watch },
    { name: "Fatiguing", value: overview.fatiguing_count, fill: COLORS.fatiguing },
    { name: "Dead", value: overview.dead_count, fill: COLORS.dead },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1600px]" data-testid={DASHBOARD.page}>
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight font-['Outfit']">Dashboard</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Creative fatigue intelligence overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatsCard testId={DASHBOARD.totalSpend} label="Total Spend" value={overview.total_spend} prefix="$" />
        <StatsCard testId={DASHBOARD.spendAtRisk} label="Spend at Risk" value={overview.spend_at_risk} prefix="$" danger />
        <StatsCard testId={DASHBOARD.totalCreatives} label="Creatives" value={overview.total_creatives} />
        <StatsCard testId={DASHBOARD.avgRoas} label="Avg ROAS" value={overview.avg_roas} suffix="x" />
        <StatsCard testId={DASHBOARD.fatiguingCount} label="Fatiguing" value={overview.fatiguing_count} danger={overview.fatiguing_count > 0} />
        <StatsCard testId={DASHBOARD.deadCount} label="Dead" value={overview.dead_count} danger={overview.dead_count > 0} />
      </div>

      {/* ROAS & Spend Trend */}
      <div className="en-card mb-6" data-testid={DASHBOARD.roasTrendChart}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-white font-['Outfit']">ROAS & Revenue Trend</h3>
            <p className="text-xs text-[#94A3B8]">Daily performance over time</p>
          </div>
          <TrendingUp size={18} className="text-[#10B981]" />
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={trends}>
            <defs>
              <linearGradient id="roasGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.06)" />
            <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 11 }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
            <YAxis yAxisId="roas" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="rev" orientation="right" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: "#94A3B8", fontSize: 12 }} />
            <Area yAxisId="roas" type="monotone" dataKey="roas" name="ROAS" stroke="#10B981" fill="url(#roasGrad)" strokeWidth={2} dot={false} />
            <Area yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue" stroke="#F59E0B" fill="url(#revGrad)" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Two-col: Platform + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Platform Performance */}
        <div className="en-card" data-testid={DASHBOARD.platformChart}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-white font-['Outfit']">Platform ROAS</h3>
              <p className="text-xs text-[#94A3B8]">Performance by ad platform</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={platforms} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.06)" />
              <XAxis dataKey="platform" tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="roas" name="ROAS" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="en-card" data-testid={DASHBOARD.statusChart}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-white font-['Outfit']">Creative Health</h3>
              <p className="text-xs text-[#94A3B8]">Portfolio status distribution</p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {statusData.map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.fill }} />
                    <span className="text-sm text-[#94A3B8]">{s.name}</span>
                  </div>
                  <span className="font-mono text-sm text-white">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Two-col: CTR Trend + Spend vs Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="en-card" data-testid={DASHBOARD.ctrTrendChart}>
          <h3 className="text-lg font-medium text-white font-['Outfit'] mb-4">CTR Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 11 }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="ctr" name="CTR %" stroke="#34D399" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="en-card" data-testid={DASHBOARD.spendRevenueChart}>
          <h3 className="text-lg font-medium text-white font-['Outfit'] mb-4">Spend vs Revenue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trends.slice(-14)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 11 }} tickFormatter={(v) => v.slice(8)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: "#94A3B8", fontSize: 12 }} />
              <Bar dataKey="spend" name="Spend" fill="#EF4444" radius={[2, 2, 0, 0]} opacity={0.7} />
              <Bar dataKey="revenue" name="Revenue" fill="#10B981" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Platform Spend Breakdown + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="en-card">
          <h3 className="text-lg font-medium text-white font-['Outfit'] mb-4">Platform Spend Breakdown</h3>
          <div className="space-y-3">
            {platforms.map((p) => {
              const maxSpend = Math.max(...platforms.map((x) => x.spend));
              return (
                <div key={p.platform}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white">{p.platform}</span>
                    <span className="font-mono text-xs text-[#94A3B8]">${p.spend.toLocaleString()} | {p.creatives} ads</span>
                  </div>
                  <div className="w-full h-2 bg-[#131C18] rounded-full overflow-hidden">
                    <div className="h-full bg-[#10B981] rounded-full transition-all duration-500" style={{ width: `${(p.spend / maxSpend) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="en-card" data-testid={DASHBOARD.recentAlerts}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white font-['Outfit']">Recent Alerts</h3>
            <AlertTriangle size={16} className="text-[#F59E0B]" />
          </div>
          {alerts.length === 0 ? (
            <p className="text-sm text-[#475569] text-center py-8">No active alerts</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((a) => (
                <div key={a._id} className="flex items-start gap-3 p-3 rounded-lg bg-[#131C18] border border-[#10B981]/5">
                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${a.status === "dead" ? "bg-[#EF4444]" : "bg-[#F97316]"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{a.creative_name}</p>
                    <p className="text-xs text-[#475569] mt-0.5">{a.platform} | ${a.spend_at_risk?.toLocaleString()} at risk</p>
                  </div>
                  <StatusPill status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
