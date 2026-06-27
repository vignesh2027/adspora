import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SIDEBAR } from "@/constants/testIds";
import { LayoutDashboard, Layers, Sparkles, Upload, Bell, Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview", tid: SIDEBAR.overview },
  { to: "/creatives", icon: Layers, label: "Creatives", tid: SIDEBAR.creatives },
  { to: "/ai-studio", icon: Sparkles, label: "AI Studio", tid: SIDEBAR.aiStudio },
  { to: "/upload", icon: Upload, label: "Upload", tid: SIDEBAR.upload },
  { to: "/alerts", icon: Bell, label: "Alerts", tid: SIDEBAR.alerts },
  { to: "/settings", icon: Settings, label: "Settings", tid: SIDEBAR.settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <button
        data-testid={SIDEBAR.mobileToggle}
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#0D1411] border border-[#10B981]/10 text-white"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && <div className="md:hidden fixed inset-0 bg-black/60 z-30" onClick={() => setMobileOpen(false)} />}

      <aside className={`app-sidebar ${mobileOpen ? "open" : ""}`} data-testid={SIDEBAR.nav}>
        <div className="p-5 border-b border-[#10B981]/10">
          <div className="flex items-center gap-3" data-testid={SIDEBAR.logo}>
            <img
              src="https://customer-assets.emergentagent.com/job_217906d7-692a-4730-b893-fe6b7715f218/artifacts/tipqcf7w_image.png"
              alt="Adspora"
              className="h-8 w-auto"
            />
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label, tid }) => (
            <NavLink
              key={to}
              to={to}
              data-testid={tid}
              onClick={() => setMobileOpen(false)}
              className={`nav-item ${location.pathname.startsWith(to) ? "active" : ""}`}
            >
              <Icon size={18} strokeWidth={1.5} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[#10B981]/10">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-[#10B981]/20 flex items-center justify-center text-[#10B981] text-xs font-medium">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p data-testid={SIDEBAR.userName} className="text-sm text-white truncate">{user?.name || "User"}</p>
              <p className="text-xs text-[#475569] truncate">{user?.email || ""}</p>
            </div>
          </div>
          <button
            data-testid={SIDEBAR.logout}
            onClick={logout}
            className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut size={18} strokeWidth={1.5} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
