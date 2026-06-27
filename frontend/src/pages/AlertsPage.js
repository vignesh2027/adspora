import { useState, useEffect } from "react";
import API from "@/lib/api";
import { ALERTS } from "@/constants/testIds";
import StatusPill from "@/components/StatusPill";
import PlatformIcon from "@/components/PlatformIcon";
import { Bell, X, AlertTriangle, Skull, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/alerts").then(({ data }) => { setAlerts(data.alerts || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const dismiss = async (id) => {
    try {
      await API.put(`/alerts/${id}/dismiss`);
      setAlerts((prev) => prev.filter((a) => a._id !== id));
      toast.success("Alert dismissed");
    } catch { toast.error("Failed to dismiss"); }
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1000px]" data-testid={ALERTS.page}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight font-['Outfit']">Alerts</h1>
          <p className="text-sm text-[#94A3B8] mt-1">Creatives that need your attention now</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/20">
          <Bell size={14} className="text-[#F59E0B]" />
          <span className="text-xs font-mono text-[#F59E0B]">{alerts.length} active</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton-shimmer h-20 rounded-xl" />)}</div>
      ) : alerts.length === 0 ? (
        <div className="en-card flex flex-col items-center justify-center py-16">
          <div className="w-14 h-14 rounded-full bg-[#10B981]/10 flex items-center justify-center mb-4">
            <Bell size={24} className="text-[#10B981]" />
          </div>
          <p className="text-white font-medium mb-1">All clear</p>
          <p className="text-sm text-[#475569]">No active alerts at the moment</p>
        </div>
      ) : (
        <div className="space-y-3" data-testid={ALERTS.list}>
          {alerts.map((a) => (
            <div key={a._id} className={`en-card flex items-start gap-4 ${a.status === "dead" ? "border-red-500/20" : "border-[#F97316]/20"}`}>
              <div className={`mt-1 p-2 rounded-lg ${a.status === "dead" ? "bg-red-500/10" : "bg-[#F97316]/10"}`}>
                {a.status === "dead" ? <Skull size={18} className="text-red-400" /> : <AlertTriangle size={18} className="text-[#F97316]" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <PlatformIcon platform={a.platform} size={12} />
                  <span className="text-white font-medium">{a.creative_name}</span>
                  <StatusPill status={a.status} />
                </div>
                <p className="text-sm text-[#94A3B8]">{a.message}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1 text-xs font-mono text-[#F59E0B]">
                    <DollarSign size={12} />${a.spend_at_risk?.toLocaleString()} at risk
                  </span>
                  <span className="text-xs font-mono text-[#475569]">Score: {a.fatigue_score}</span>
                </div>
              </div>
              <button data-testid={`${ALERTS.dismissButton}-${a._id}`} onClick={() => dismiss(a._id)} className="p-2 rounded-lg hover:bg-white/5 text-[#475569] hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
