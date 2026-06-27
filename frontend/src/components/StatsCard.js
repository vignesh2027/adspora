export default function StatsCard({ label, value, prefix = "", suffix = "", trend, danger, testId }) {
  return (
    <div className={`stat-card ${danger ? "danger" : ""}`} data-testid={testId}>
      <p className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-light text-white font-['Outfit'] tracking-tight">
        {prefix}{typeof value === "number" ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value}{suffix}
      </p>
      {trend !== undefined && (
        <p className={`text-xs mt-1 font-mono ${trend >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
          {trend >= 0 ? "+" : ""}{trend}%
        </p>
      )}
    </div>
  );
}
