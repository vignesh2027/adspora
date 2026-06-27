import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import API from "@/lib/api";
import { AI_STUDIO } from "@/constants/testIds";
import StatusPill from "@/components/StatusPill";
import FatigueGauge from "@/components/FatigueGauge";
import PlatformIcon from "@/components/PlatformIcon";
import { Sparkles, Zap, Copy, Check, Loader2, Bot, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function AIStudioPage() {
  const [searchParams] = useSearchParams();
  const [creatives, setCreatives] = useState([]);
  const [selectedId, setSelectedId] = useState(searchParams.get("creative") || "");
  const [selected, setSelected] = useState(null);
  const [angle, setAngle] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [diagnosing, setDiagnosing] = useState(false);
  const [variations, setVariations] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [genText, setGenText] = useState("");
  const [copiedIdx, setCopiedIdx] = useState(null);
  const diagRef = useRef(null);

  useEffect(() => {
    API.get("/creatives", { params: { sort_by: "fatigue_score", sort_order: "asc" } })
      .then(({ data }) => setCreatives(data.creatives || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedId) {
      const c = creatives.find((x) => x._id === selectedId);
      setSelected(c || null);
    } else setSelected(null);
  }, [selectedId, creatives]);

  const streamSSE = async (url, body, onText, onDone, onVariations) => {
    const token = localStorage.getItem("adspora_token");
    const resp = await fetch(`${process.env.REACT_APP_BACKEND_URL}${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const evt = JSON.parse(line.slice(6));
          if (evt.type === "text") onText(evt.content);
          else if (evt.type === "variations" && onVariations) onVariations(evt.content);
          else if (evt.type === "done") { onDone(); return; }
          else if (evt.type === "error") { toast.error(evt.content); onDone(); return; }
        } catch {}
      }
    }
    onDone();
  };

  const handleDiagnose = async () => {
    if (!selectedId) return;
    setDiagnosis("");
    setDiagnosing(true);
    await streamSSE("/api/ai/diagnose", { creative_id: selectedId },
      (text) => setDiagnosis((prev) => prev + text),
      () => setDiagnosing(false)
    );
  };

  const handleGenerate = async () => {
    if (!selectedId) return;
    setVariations([]);
    setGenText("");
    setGenerating(true);
    await streamSSE("/api/ai/generate", { creative_id: selectedId, angle: angle || undefined },
      (text) => setGenText((prev) => prev + text),
      () => setGenerating(false),
      (vars) => setVariations(vars)
    );
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1400px]" data-testid={AI_STUDIO.page}>
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight font-['Outfit']">AI Studio</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Diagnose creative fatigue & generate replacements with AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Creative Selector */}
        <div className="lg:col-span-1 space-y-4">
          <div className="en-card">
            <h3 className="text-sm font-medium text-white mb-3">Select Creative</h3>
            <select
              data-testid={AI_STUDIO.creativeSelect}
              value={selectedId}
              onChange={(e) => { setSelectedId(e.target.value); setDiagnosis(""); setVariations([]); setGenText(""); }}
              className="en-input mb-3"
            >
              <option value="">Choose a creative...</option>
              {creatives.map((c) => (
                <option key={c._id} value={c._id}>{c.name} ({c.platform} - {c.status})</option>
              ))}
            </select>

            {selected && (
              <div className="p-4 rounded-lg bg-[#131C18] border border-[#10B981]/5 space-y-3">
                <div className="flex items-center gap-2">
                  <PlatformIcon platform={selected.platform} size={14} />
                  <span className="text-sm text-white font-medium">{selected.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <FatigueGauge score={selected.fatigue_score} size="md" />
                  <StatusPill status={selected.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div><span className="text-[#475569]">ROAS</span><p className="text-white">{selected.current_roas}x</p></div>
                  <div><span className="text-[#475569]">CTR</span><p className="text-white">{selected.current_ctr}%</p></div>
                  <div><span className="text-[#475569]">Spend</span><p className="text-white">${selected.total_spend?.toLocaleString()}</p></div>
                  <div><span className="text-[#475569]">Age</span><p className="text-white">{selected.age_days}d</p></div>
                </div>
              </div>
            )}

            <div className="mt-4 space-y-3">
              <button data-testid={AI_STUDIO.diagnoseButton} onClick={handleDiagnose} disabled={!selectedId || diagnosing} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40">
                {diagnosing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>{diagnosing ? "Analyzing..." : "Diagnose"}</span>
              </button>
              <div>
                <label className="block text-xs text-[#475569] mb-1">Creative angle (optional)</label>
                <input data-testid={AI_STUDIO.angleInput} type="text" className="en-input text-sm" placeholder="e.g. user testimonial focus" value={angle} onChange={(e) => setAngle(e.target.value)} />
              </div>
              <button data-testid={AI_STUDIO.generateButton} onClick={handleGenerate} disabled={!selectedId || generating} className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-40">
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                <span>{generating ? "Generating..." : "Generate Replacements"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Output */}
        <div className="lg:col-span-2 space-y-6">
          {/* Diagnosis */}
          {(diagnosis || diagnosing) && (
            <div className="en-card" data-testid={AI_STUDIO.diagnosisOutput}>
              <div className="flex items-center gap-2 mb-4">
                <Bot size={18} className="text-[#10B981]" />
                <h3 className="text-lg font-medium text-white font-['Outfit']">AI Diagnosis</h3>
                {diagnosing && <Loader2 size={14} className="animate-spin text-[#10B981]" />}
              </div>
              <div ref={diagRef} className="ai-stream-text max-h-[400px] overflow-y-auto pr-2">
                {diagnosis || <span className="text-[#475569]">Analyzing creative performance...</span>}
              </div>
            </div>
          )}

          {/* Generated Variations */}
          {(variations.length > 0 || generating) && (
            <div data-testid={AI_STUDIO.generatedAds}>
              <div className="flex items-center gap-2 mb-4">
                <Zap size={18} className="text-[#F59E0B]" />
                <h3 className="text-lg font-medium text-white font-['Outfit']">Generated Replacements</h3>
                {generating && <Loader2 size={14} className="animate-spin text-[#F59E0B]" />}
              </div>

              {variations.length > 0 ? (
                <div className="space-y-4">
                  {variations.map((v, i) => (
                    <div key={i} className="en-card">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded">V{v.variation || i + 1}</span>
                          <span className="text-xs text-[#475569]">{v.angle_description}</span>
                        </div>
                        <button
                          data-testid={`${AI_STUDIO.copyButton}-${i}`}
                          onClick={() => copyToClipboard(`${v.headline}\n\n${v.body}\n\nCTA: ${v.cta}`, i)}
                          className="flex items-center gap-1 text-xs text-[#94A3B8] hover:text-white transition-colors"
                        >
                          {copiedIdx === i ? <Check size={14} className="text-[#10B981]" /> : <Copy size={14} />}
                          <span>{copiedIdx === i ? "Copied!" : "Copy"}</span>
                        </button>
                      </div>
                      <h4 className="text-white font-medium mb-2">{v.headline}</h4>
                      <p className="text-sm text-[#94A3B8] leading-relaxed mb-2">{v.body}</p>
                      <p className="text-xs font-mono text-[#10B981]">CTA: {v.cta}</p>
                    </div>
                  ))}
                </div>
              ) : generating ? (
                <div className="en-card">
                  <div className="ai-stream-text">{genText || "Generating ad variations..."}</div>
                </div>
              ) : null}
            </div>
          )}

          {/* Empty state */}
          {!diagnosis && !diagnosing && variations.length === 0 && !generating && (
            <div className="en-card flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-[#10B981]/10 flex items-center justify-center mb-4">
                <Sparkles size={28} className="text-[#10B981]" />
              </div>
              <h3 className="text-xl font-medium text-white font-['Outfit'] mb-2">Select a creative to begin</h3>
              <p className="text-sm text-[#94A3B8] max-w-md">
                Choose a creative from the panel, then use AI to diagnose why it's fatiguing and generate ready-to-launch replacements.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
