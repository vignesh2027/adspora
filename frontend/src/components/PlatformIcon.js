export default function PlatformIcon({ platform, size = 16 }) {
  const colors = {
    Meta: "#1877F2",
    Google: "#4285F4",
    TikTok: "#00F2EA",
    Taboola: "#004B93",
  };
  const labels = {
    Meta: "M",
    Google: "G",
    TikTok: "T",
    Taboola: "Tb",
  };
  const bg = colors[platform] || "#94A3B8";
  return (
    <div
      className="inline-flex items-center justify-center rounded font-mono font-bold text-white"
      style={{ width: size + 8, height: size + 8, fontSize: size * 0.55, backgroundColor: bg }}
      title={platform}
    >
      {labels[platform] || platform?.[0]}
    </div>
  );
}
