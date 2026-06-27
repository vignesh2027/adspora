import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "@/lib/api";
import { CREATIVE_DETAIL } from "@/constants/testIds";
import FatigueGauge from "@/components/FatigueGauge";
import StatusPill from "@/components/StatusPill";
import PlatformIcon from "@/components/PlatformIcon";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";
import { ArrowLeft, Sparkles, Zap, Clock, DollarSign, TrendingDown, Target } from "lucide-react";

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0D1411", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: 12 }}>
      <p className="text-xs text-[#94A3B8] mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} className="text-sm font-mono" style={{ color: p.color }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function CreativeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [creative, setCreative] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/creatives/${id}`).then(({ data }) => { setCreative(data); setLoading(false); }).catch(() => { navigate("/creatives"); });
  }, [id, navigate]);

  if (loading || !creative) return <div className="p-8"><div className="skeleton-shimmer h-96 rounded-xl" /></div>;

  const history = (creative.daily_history || []).map((d) => ({ ...d, date: d.date?.slice(5, 10) }));
  const metrics = [
    { label: "Current ROAS", value: `${creative.current_roas}x`, sub: `Peak: ${creative.peak_roas}x`, icon: Target, color: creative.current_roas >= 1 ? "#10B981" : "#EF4444" },
    { label: "Current CTR", value: `${creative.current_ctr}%`, sub: `Initial: ${creative.initial_ctr}%`, icon: TrendingDown, color: "#F59E0B" },
    { label: "Total Spend", value: `$${creative.total_spend?.toLocaleString()}`, sub: `Rev: $${creative.total_revenue?.toLocaleString()}`, icon: DollarSign, color: "#94A3B8" },
    { label: "Age", value: `${creative.age_days} days`, sub: `${creative.days_remaining > 0 ? `~${creative.days_remaining}d left` : "Expired"}`, icon: Clock, color: "#94A3B8" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1400px]" data-testid={CREATIVE_DETAIL.page}>
      <button data-testid={CREATIVE_DETAIL.backButton} onClick={() => navigate("/creatives")} className="flex items-center gap-2 text-[#94A3B8] hover:text-white mb-6 transition-colors">
        <ArrowLeft size={16} /><span className="text-sm">Back to Creatives</span>
      </button>

      {/* Header */}
      <div className="en-card mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <PlatformIcon platform={creative.platform} size={24} />
            <div>
              <h1 data-testid={CREATIVE_DETAIL.name} className="text-2xl font-medium text-white font-['Outfit']">{creative.name}</h1>
              <p className="text-sm text-[#94A3B8]">{creative.campaign} | {creative.ad_type}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <FatigueGauge score={creative.fatigue_score} size="lg" />
            <StatusPill status={creative.status} />
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((m) => (
          <div key={m.label} className="en-card">
            <div className="flex items-center gap-2 mb-2">
              <m.icon size={14} style={{ color: m.color }} />
              <span className="text-xs font-mono text-[#94A3B8] uppercase">{m.label}</span>
            </div>
            <p className="text-xl font-mono text-white">{m.value}</p>
            <p className="text-xs text-[#475569] mt-1">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {history.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="en-card" data-testid={CREATIVE_DETAIL.roasChart}>
            <h3 className="text-lg font-medium text-white font-['Outfit'] mb-4">ROAS History</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="drg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.06)" />
                <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="roas" name="ROAS" stroke="#10B981" fill="url(#drg)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="en-card" data-testid={CREATIVE_DETAIL.ctrChart}>
            <h3 className="text-lg font-medium text-white font-['Outfit'] mb-4">CTR History</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.06)" />
                <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} />
                <Line type="monotone" dataKey="ctr" name="CTR %" stroke="#34D399" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button data-testid={CREATIVE_DETAIL.diagnoseButton} onClick={() => navigate(`/ai-studio?creative=${creative._id}`)} className="btn-primary flex items-center gap-2">
          <Sparkles size={16} /><span>AI Diagnosis</span>
        </button>
        <button data-testid={CREATIVE_DETAIL.generateButton} onClick={() => navigate(`/ai-studio?creative=${creative._id}&mode=generate`)} className="btn-secondary flex items-center gap-2">
          <Zap size={16} /><span>Generate Replacements</span>
        </button>
      </div>
    </div>
  );
}
