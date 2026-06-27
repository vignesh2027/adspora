import { useState, useEffect } from "react";
import API from "@/lib/api";
import { SETTINGS } from "@/constants/testIds";
import { useAuth } from "@/contexts/AuthContext";
import { Save, User, Bell, Link2, Shield, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    API.get("/settings").then(({ data }) => setSettings(data)).catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.put("/settings", settings);
      toast.success("Settings saved");
    } catch { toast.error("Failed to save settings"); }
    setSaving(false);
  };

  const update = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  if (!settings) return <div className="p-8"><div className="skeleton-shimmer h-96 rounded-xl" /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-[900px]" data-testid={SETTINGS.page}>
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight font-['Outfit']">Settings</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Configure your workspace and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Account */}
        <div className="en-card">
          <div className="flex items-center gap-2 mb-4">
            <User size={18} className="text-[#10B981]" />
            <h3 className="text-lg font-medium text-white font-['Outfit']">Account</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5 font-mono uppercase tracking-wider">Name</label>
              <input type="text" className="en-input" value={user?.name || ""} readOnly />
            </div>
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5 font-mono uppercase tracking-wider">Email</label>
              <input type="text" className="en-input" value={user?.email || ""} readOnly />
            </div>
          </div>
        </div>

        {/* Fatigue Settings */}
        <div className="en-card">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} className="text-[#10B981]" />
            <h3 className="text-lg font-medium text-white font-['Outfit']">Fatigue Thresholds</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5 font-mono uppercase tracking-wider">Breakeven ROAS</label>
              <input data-testid={SETTINGS.breakevenInput} type="number" step="0.1" className="en-input" value={settings.breakeven_roas || 1.0} onChange={(e) => update("breakeven_roas", parseFloat(e.target.value))} />
              <p className="text-xs text-[#475569] mt-1">Below this ROAS, creatives are losing money</p>
            </div>
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5 font-mono uppercase tracking-wider">Alert Threshold</label>
              <input type="number" className="en-input" value={settings.alert_threshold || 40} onChange={(e) => update("alert_threshold", parseInt(e.target.value))} />
              <p className="text-xs text-[#475569] mt-1">Fatigue score below this triggers an alert</p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="en-card">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={18} className="text-[#10B981]" />
            <h3 className="text-lg font-medium text-white font-['Outfit']">Notifications</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5 font-mono uppercase tracking-wider">Email Notifications</label>
              <input data-testid={SETTINGS.emailInput} type="email" className="en-input" placeholder="you@company.com" value={settings.notification_email || ""} onChange={(e) => update("notification_email", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5 font-mono uppercase tracking-wider">Slack Webhook</label>
              <input data-testid={SETTINGS.slackInput} type="text" className="en-input" placeholder="https://hooks.slack.com/..." value={settings.slack_webhook || ""} onChange={(e) => update("slack_webhook", e.target.value)} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#131C18]">
              <div>
                <p className="text-sm text-white">Weekly Performance Report</p>
                <p className="text-xs text-[#475569]">Receive a weekly email summary</p>
              </div>
              <button
                onClick={() => update("weekly_report", !settings.weekly_report)}
                className={`w-11 h-6 rounded-full transition-colors ${settings.weekly_report ? "bg-[#10B981]" : "bg-[#131C18] border border-[#475569]"}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.weekly_report ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Connected Platforms */}
        <div className="en-card">
          <div className="flex items-center gap-2 mb-4">
            <Link2 size={18} className="text-[#10B981]" />
            <h3 className="text-lg font-medium text-white font-['Outfit']">Connected Platforms</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["Meta", "Google", "TikTok", "Taboola"].map((p) => {
              const connected = settings.connected_platforms?.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => {
                    const current = settings.connected_platforms || [];
                    update("connected_platforms", connected ? current.filter((x) => x !== p) : [...current, p]);
                  }}
                  className={`p-4 rounded-lg border text-center transition-all ${connected ? "border-[#10B981]/30 bg-[#10B981]/5 text-[#10B981]" : "border-[#10B981]/5 bg-[#131C18] text-[#475569] hover:text-[#94A3B8]"}`}
                >
                  <p className="font-medium text-sm">{p}</p>
                  <p className="text-xs mt-1">{connected ? "Connected" : "Connect"}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Save */}
        <button data-testid={SETTINGS.saveButton} onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>{saving ? "Saving..." : "Save Settings"}</span>
        </button>
      </div>
    </div>
  );
}
