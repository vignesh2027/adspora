import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "@/lib/api";
import { CREATIVES } from "@/constants/testIds";
import FatigueGauge from "@/components/FatigueGauge";
import StatusPill from "@/components/StatusPill";
import PlatformIcon from "@/components/PlatformIcon";
import { Search, SlidersHorizontal, ArrowUpDown, Clock, ChevronRight } from "lucide-react";

export default function CreativesPage() {
  const navigate = useNavigate();
  const [creatives, setCreatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("all");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("fatigue_score");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await API.get("/creatives", { params: { platform: platform !== "all" ? platform : undefined, status: status !== "all" ? status : undefined, sort_by: sortBy, sort_order: sortOrder, search: search || undefined } });
        setCreatives(data.creatives || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    const debounce = setTimeout(load, 300);
    return () => clearTimeout(debounce);
  }, [search, platform, status, sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortOrder("asc"); }
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px]" data-testid={CREATIVES.page}>
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight font-['Outfit']">Creatives</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Command center for all your ad creatives</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_160px] gap-3 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
          <input data-testid={CREATIVES.searchInput} type="text" placeholder="Search creatives..." className="en-input pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select data-testid={CREATIVES.platformFilter} value={platform} onChange={(e) => setPlatform(e.target.value)} className="en-input">
          <option value="all">All Platforms</option>
          <option value="Meta">Meta</option>
          <option value="Google">Google</option>
          <option value="TikTok">TikTok</option>
          <option value="Taboola">Taboola</option>
        </select>
        <select data-testid={CREATIVES.statusFilter} value={status} onChange={(e) => setStatus(e.target.value)} className="en-input">
          <option value="all">All Status</option>
          <option value="healthy">Healthy</option>
          <option value="watch">Watch</option>
          <option value="fatiguing">Fatiguing</option>
          <option value="dead">Dead</option>
        </select>
      </div>

      {/* Table */}
      <div className="en-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="en-table" data-testid={CREATIVES.table}>
            <thead>
              <tr>
                <th className="cursor-pointer" onClick={() => toggleSort("name")}>
                  <span className="flex items-center gap-1">Creative <ArrowUpDown size={12} /></span>
                </th>
                <th>Platform</th>
                <th>Campaign</th>
                <th className="cursor-pointer" onClick={() => toggleSort("current_roas")}>
                  <span className="flex items-center gap-1">ROAS <ArrowUpDown size={12} /></span>
                </th>
                <th className="cursor-pointer" onClick={() => toggleSort("current_ctr")}>
                  <span className="flex items-center gap-1">CTR <ArrowUpDown size={12} /></span>
                </th>
                <th className="cursor-pointer" onClick={() => toggleSort("total_spend")}>
                  <span className="flex items-center gap-1">Spend <ArrowUpDown size={12} /></span>
                </th>
                <th className="cursor-pointer" onClick={() => toggleSort("age_days")}>
                  <span className="flex items-center gap-1">Age <ArrowUpDown size={12} /></span>
                </th>
                <th className="cursor-pointer" onClick={() => toggleSort("fatigue_score")}>
                  <span className="flex items-center gap-1">Fatigue <ArrowUpDown size={12} /></span>
                </th>
                <th>Status</th>
                <th>Days Left</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}><td colSpan={11}><div className="skeleton-shimmer h-8 rounded" /></td></tr>
                ))
              ) : creatives.length === 0 ? (
                <tr><td colSpan={11} className="text-center text-[#475569] py-12">No creatives found</td></tr>
              ) : (
                creatives.map((c) => (
                  <tr key={c._id} data-testid={`${CREATIVES.creativeRow}-${c._id}`} className="cursor-pointer" onClick={() => navigate(`/creatives/${c._id}`)}>
                    <td>
                      <div className="flex items-center gap-3">
                        <PlatformIcon platform={c.platform} size={14} />
                        <span className="text-white font-medium truncate max-w-[200px]">{c.name}</span>
                      </div>
                    </td>
                    <td><span className="text-[#94A3B8]">{c.platform}</span></td>
                    <td><span className="text-[#94A3B8] truncate max-w-[150px] block">{c.campaign}</span></td>
                    <td><span className={`font-mono ${c.current_roas >= 1 ? "text-[#10B981]" : "text-[#EF4444]"}`}>{c.current_roas}x</span></td>
                    <td><span className="font-mono text-[#94A3B8]">{c.current_ctr}%</span></td>
                    <td><span className="font-mono text-white">${c.total_spend?.toLocaleString()}</span></td>
                    <td>
                      <span className="flex items-center gap-1 text-[#94A3B8] font-mono">
                        <Clock size={12} />{c.age_days}d
                      </span>
                    </td>
                    <td data-testid={`${CREATIVES.fatigueGauge}-${c._id}`}>
                      <FatigueGauge score={c.fatigue_score} size="sm" />
                    </td>
                    <td><StatusPill status={c.status} /></td>
                    <td>
                      <span className={`font-mono text-xs ${c.days_remaining <= 3 ? "text-[#EF4444]" : c.days_remaining <= 7 ? "text-[#F59E0B]" : "text-[#94A3B8]"}`}>
                        {c.days_remaining > 0 ? `~${c.days_remaining}d` : "---"}
                      </span>
                    </td>
                    <td><ChevronRight size={14} className="text-[#475569]" /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-[#475569] mt-3 text-right">{creatives.length} creatives</p>
    </div>
  );
}
