export default function FatigueGauge({ score = 0, size = "md" }) {
  const getColor = (s) => {
    if (s >= 70) return "#10B981";
    if (s >= 50) return "#F59E0B";
    if (s >= 25) return "#F97316";
    return "#EF4444";
  };

  const color = getColor(score);
  const width = size === "sm" ? "w-16" : size === "lg" ? "w-32" : "w-24";

  return (
    <div className={`${width} flex flex-col gap-1`}>
      <div className="fatigue-gauge-track">
        <div
          className="fatigue-gauge-fill"
          style={{ width: `${Math.min(100, Math.max(0, score))}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-xs" style={{ color }}>{score}</span>
    </div>
  );
}
