import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Sparkles, Eye, Brain, Zap, CheckCircle, BarChart3, Shield, Upload, Bell, Globe, TrendingUp, Clock, DollarSign, Layers, Target, Activity } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } };
const fadeIn = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.8 } } };
const stagger = { visible: { transition: { staggerChildren: 0.15 } } };

function AnimatedSection({ children, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} variants={stagger} className={className}>
      {children}
    </motion.div>
  );
}

/* ── SVG Animated Illustrations ── */
function HeroIllustration() {
  return (
    <svg viewBox="0 0 500 400" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      {/* Background glow */}
      <defs>
        <radialGradient id="glow1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="40%" stopColor="#F97316" />
          <stop offset="60%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      <circle cx="250" cy="200" r="180" fill="url(#glow1)" />
      {/* Dashboard frame */}
      <rect x="80" y="60" width="340" height="240" rx="16" fill="#0D1411" stroke="#10B981" strokeOpacity="0.2" strokeWidth="1" />
      {/* Top bar */}
      <rect x="80" y="60" width="340" height="36" rx="16" fill="#131C18" />
      <circle cx="102" cy="78" r="5" fill="#EF4444" opacity="0.6" />
      <circle cx="118" cy="78" r="5" fill="#F59E0B" opacity="0.6" />
      <circle cx="134" cy="78" r="5" fill="#10B981" opacity="0.6" />
      {/* Stat cards */}
      <rect x="96" y="108" width="72" height="40" rx="6" fill="#131C18" stroke="#10B981" strokeOpacity="0.1" />
      <rect x="178" y="108" width="72" height="40" rx="6" fill="#131C18" stroke="#F59E0B" strokeOpacity="0.15" />
      <rect x="260" y="108" width="72" height="40" rx="6" fill="#131C18" stroke="#EF4444" strokeOpacity="0.15" />
      <rect x="342" y="108" width="64" height="40" rx="6" fill="#131C18" stroke="#10B981" strokeOpacity="0.1" />
      {/* Mini text in cards */}
      <text x="108" y="122" fill="#94A3B8" fontSize="6" fontFamily="monospace">ROAS</text>
      <text x="108" y="138" fill="#10B981" fontSize="11" fontFamily="monospace" fontWeight="600">3.2x</text>
      <text x="190" y="122" fill="#94A3B8" fontSize="6" fontFamily="monospace">AT RISK</text>
      <text x="190" y="138" fill="#F59E0B" fontSize="11" fontFamily="monospace" fontWeight="600">$14K</text>
      <text x="272" y="122" fill="#94A3B8" fontSize="6" fontFamily="monospace">DEAD</text>
      <text x="272" y="138" fill="#EF4444" fontSize="11" fontFamily="monospace" fontWeight="600">5</text>
      <text x="354" y="122" fill="#94A3B8" fontSize="6" fontFamily="monospace">ADS</text>
      <text x="354" y="138" fill="#FFFFFF" fontSize="11" fontFamily="monospace" fontWeight="600">24</text>
      {/* Chart area */}
      <rect x="96" y="160" width="230" height="120" rx="6" fill="#131C18" stroke="#10B981" strokeOpacity="0.1" />
      {/* Animated chart line */}
      <polyline
        points="106,260 130,250 154,245 178,240 202,255 226,230 250,220 274,225 298,210 314,215"
        fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round"
        strokeDasharray="220" strokeDashoffset="220"
      >
        <animate attributeName="stroke-dashoffset" from="220" to="0" dur="2s" fill="freeze" begin="0.5s" />
      </polyline>
      {/* Area fill under chart */}
      <polygon
        points="106,260 130,250 154,245 178,240 202,255 226,230 250,220 274,225 298,210 314,215 314,270 106,270"
        fill="#10B981" opacity="0.08"
      >
        <animate attributeName="opacity" from="0" to="0.08" dur="2s" fill="freeze" begin="0.5s" />
      </polygon>
      {/* Fatigue gauge */}
      <rect x="340" y="160" width="66" height="120" rx="6" fill="#131C18" stroke="#10B981" strokeOpacity="0.1" />
      <text x="353" y="178" fill="#94A3B8" fontSize="7" fontFamily="monospace">FATIGUE</text>
      {/* Circular gauge */}
      <circle cx="373" cy="225" r="30" fill="none" stroke="#131C18" strokeWidth="5" />
      <circle cx="373" cy="225" r="30" fill="none" stroke="url(#gaugeGrad)" strokeWidth="5" strokeLinecap="round"
        strokeDasharray="188.5" strokeDashoffset="188.5" transform="rotate(-90 373 225)">
        <animate attributeName="stroke-dashoffset" from="188.5" to="60" dur="1.5s" fill="freeze" begin="1s" />
      </circle>
      <text x="362" y="230" fill="#FFFFFF" fontSize="14" fontFamily="monospace" fontWeight="700">68</text>
      {/* Floating particles */}
      {[{ cx: 60, cy: 50, d: 3 }, { cx: 450, cy: 80, d: 4 }, { cx: 40, cy: 320, d: 3 }, { cx: 470, cy: 350, d: 5 }, { cx: 250, cy: 340, d: 3 }].map((p, i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r={p.d} fill="#10B981" opacity="0.3">
          <animate attributeName="opacity" values="0.1;0.4;0.1" dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
          <animate attributeName="cy" values={`${p.cy};${p.cy - 10};${p.cy}`} dur={`${3 + i * 0.3}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

function StepIcon({ type }) {
  const icons = {
    detect: (
      <svg viewBox="0 0 80 80" className="w-full h-full">
        <circle cx="40" cy="40" r="30" fill="none" stroke="#10B981" strokeWidth="1.5" opacity="0.3">
          <animate attributeName="r" values="20;30;20" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.1;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="40" cy="40" r="20" fill="none" stroke="#10B981" strokeWidth="1.5" opacity="0.5">
          <animate attributeName="r" values="15;20;15" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="40" cy="40" r="8" fill="#10B981" opacity="0.8">
          <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
        </circle>
        <line x1="40" y1="12" x2="40" y2="68" stroke="#10B981" strokeWidth="0.5" opacity="0.15" />
        <line x1="12" y1="40" x2="68" y2="40" stroke="#10B981" strokeWidth="0.5" opacity="0.15" />
      </svg>
    ),
    diagnose: (
      <svg viewBox="0 0 80 80" className="w-full h-full">
        <circle cx="40" cy="40" r="28" fill="none" stroke="#10B981" strokeWidth="1" opacity="0.2" />
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 40 + 18 * Math.cos(rad), y1 = 40 + 18 * Math.sin(rad);
          const x2 = 40 + 28 * Math.cos(rad), y2 = 40 + 28 * Math.sin(rad);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#10B981" strokeWidth="1.5" opacity="0.4">
            <animate attributeName="opacity" values="0.2;0.6;0.2" dur={`${1.5 + i * 0.2}s`} repeatCount="indefinite" />
          </line>;
        })}
        <circle cx="40" cy="40" r="12" fill="#10B981" opacity="0.15" />
        <text x="34" y="44" fill="#10B981" fontSize="12" fontFamily="monospace" fontWeight="700">AI</text>
      </svg>
    ),
    generate: (
      <svg viewBox="0 0 80 80" className="w-full h-full">
        {[{ x: 40, y: 20, d: 0 }, { x: 25, y: 55, d: 0.3 }, { x: 55, y: 55, d: 0.6 }].map((p, i) => (
          <g key={i}>
            <rect x={p.x - 12} y={p.y - 8} width="24" height="16" rx="3" fill="#131C18" stroke="#10B981" strokeWidth="1" opacity="0.6">
              <animate attributeName="opacity" values="0.3;0.7;0.3" dur={`${2 + p.d}s`} repeatCount="indefinite" />
            </rect>
            <line x1={p.x - 6} y1={p.y - 2} x2={p.x + 6} y2={p.y - 2} stroke="#10B981" strokeWidth="1" opacity="0.5" />
            <line x1={p.x - 6} y1={p.y + 2} x2={p.x + 3} y2={p.y + 2} stroke="#10B981" strokeWidth="1" opacity="0.3" />
          </g>
        ))}
        <path d="M40 32 L30 47" stroke="#10B981" strokeWidth="0.8" opacity="0.3" strokeDasharray="2 2" />
        <path d="M40 32 L50 47" stroke="#10B981" strokeWidth="0.8" opacity="0.3" strokeDasharray="2 2" />
        <circle cx="40" cy="14" r="4" fill="#10B981" opacity="0.6">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite" />
        </circle>
      </svg>
    ),
    decide: (
      <svg viewBox="0 0 80 80" className="w-full h-full">
        <rect x="18" y="20" width="44" height="8" rx="4" fill="#10B981" opacity="0.7">
          <animate attributeName="width" values="30;44;30" dur="3s" repeatCount="indefinite" />
        </rect>
        <rect x="18" y="34" width="36" height="8" rx="4" fill="#F59E0B" opacity="0.6">
          <animate attributeName="width" values="24;36;24" dur="3.5s" repeatCount="indefinite" />
        </rect>
        <rect x="18" y="48" width="28" height="8" rx="4" fill="#F97316" opacity="0.5">
          <animate attributeName="width" values="20;28;20" dur="4s" repeatCount="indefinite" />
        </rect>
        <rect x="18" y="62" width="16" height="8" rx="4" fill="#EF4444" opacity="0.4" />
        <text x="8" y="27" fill="#94A3B8" fontSize="7" fontFamily="monospace">1</text>
        <text x="8" y="41" fill="#94A3B8" fontSize="7" fontFamily="monospace">2</text>
        <text x="8" y="55" fill="#94A3B8" fontSize="7" fontFamily="monospace">3</text>
        <text x="8" y="69" fill="#94A3B8" fontSize="7" fontFamily="monospace">4</text>
      </svg>
    ),
  };
  return icons[type] || null;
}

/* ── Animated Counter ── */
function Counter({ end, prefix = "", suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

/* ── Main Landing Page ── */
export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#050A08] text-white overflow-x-hidden">
      {/* ── Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#050A08]/90 backdrop-blur-xl border-b border-[#10B981]/10 shadow-lg" : ""}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3" data-testid="landing-logo">
            <img src="https://customer-assets.emergentagent.com/job_217906d7-692a-4730-b893-fe6b7715f218/artifacts/tipqcf7w_image.png" alt="Adspora" className="h-9" />
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-[#94A3B8] hover:text-white transition-colors">How It Works</a>
            <a href="#features" className="text-sm text-[#94A3B8] hover:text-white transition-colors">Features</a>
            <a href="#platforms" className="text-sm text-[#94A3B8] hover:text-white transition-colors">Platforms</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/login")} className="text-sm text-[#94A3B8] hover:text-white transition-colors px-4 py-2" data-testid="landing-login-btn">
              Sign In
            </button>
            <button onClick={() => navigate(user ? "/dashboard" : "/login")} className="bg-[#10B981] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#34D399] transition-all" data-testid="landing-get-started-btn">
              {user ? "Go to Dashboard" : "Get Started"}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-32 pb-20 lg:pb-32 overflow-hidden">
        {/* Ambient background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#10B981]/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#10B981]/3 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 mb-6">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-xs font-mono text-[#10B981]">AI-Powered Creative Intelligence</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight leading-[1.1] mb-6 font-['Outfit']">
                Stop Losing Money to{" "}
                <span className="relative">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] to-[#34D399]">Dead Creatives</span>
                  <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 300 6">
                    <path d="M0 3 Q75 0 150 3 T300 3" fill="none" stroke="#10B981" strokeWidth="2" opacity="0.4" strokeDasharray="300" strokeDashoffset="300">
                      <animate attributeName="stroke-dashoffset" from="300" to="0" dur="1.5s" fill="freeze" begin="0.8s" />
                    </path>
                  </svg>
                </span>
              </h1>
              <p className="text-base lg:text-lg text-[#94A3B8] leading-relaxed mb-8 max-w-lg">
                Adspora watches every ad creative across Google, Meta, TikTok & Taboola. It detects fatigue the moment it starts, diagnoses why, and generates replacement ads instantly.
              </p>
              <div className="flex flex-wrap gap-4">
                <button onClick={() => navigate("/login")} className="bg-[#10B981] text-white font-medium px-8 py-3.5 rounded-lg hover:bg-[#34D399] transition-all flex items-center gap-2 text-base group" data-testid="hero-get-started-btn">
                  <Sparkles size={18} />
                  <span>Try Live Demo</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <a href="#how-it-works" className="border border-[#10B981]/20 text-[#10B981] font-medium px-8 py-3.5 rounded-lg hover:bg-[#10B981]/10 transition-all text-base">
                  See How It Works
                </a>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.3 }}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/10 to-transparent rounded-3xl blur-2xl" />
                <div className="relative bg-[#0D1411]/60 backdrop-blur-sm rounded-2xl border border-[#10B981]/10 p-4">
                  <HeroIllustration />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <AnimatedSection className="py-16 border-y border-[#10B981]/10 bg-[#0D1411]/40">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: 100, suffix: "M+", label: "Ad Spend Monitored" },
            { value: 50, suffix: "K+", label: "Creatives Analyzed" },
            { value: 34, suffix: "%", label: "Avg Spend Saved" },
            { value: 4, suffix: "", label: "Platforms Unified" },
          ].map((s, i) => (
            <motion.div key={i} variants={fadeUp} className="text-center">
              <p className="text-3xl lg:text-4xl font-light text-white font-['Outfit'] mb-1">
                <Counter end={s.value} prefix="$" suffix={s.suffix} />
              </p>
              <p className="text-sm text-[#94A3B8]">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* ── Problem Statement ── */}
      <section className="py-24">
        <AnimatedSection className="max-w-7xl mx-auto px-6">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-white tracking-tight font-['Outfit'] mb-4">
              The Creative Fatigue Problem
            </h2>
            <p className="text-base text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
              Every winning ad has a shelf life. CTR slips, CPM climbs, ROAS bleeds — and most teams notice too late.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Clock, title: "7-14 Day Lifespan", desc: "Most creatives decay within two weeks as audiences saturate and engagement fades.", color: "#EF4444" },
              { icon: DollarSign, title: "Silent Budget Drain", desc: "Spend keeps flowing to dying creatives because manual monitoring can't keep up.", color: "#F97316" },
              { icon: Globe, title: "4 Platforms, 4 Reports", desc: "Meta, Google, TikTok, Taboola — each names metrics differently. No unified view.", color: "#F59E0B" },
              { icon: Activity, title: "Reactive, Not Proactive", desc: "Teams scramble to replace ads after performance collapses, not before.", color: "#10B981" },
            ].map((p, i) => (
              <motion.div key={i} variants={fadeUp} className="bg-[#0D1411] border border-[#10B981]/10 rounded-xl p-6 hover:border-[#10B981]/25 transition-all hover:-translate-y-1">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: `${p.color}15` }}>
                  <p.icon size={20} style={{ color: p.color }} />
                </div>
                <h3 className="text-white font-medium mb-2 font-['Outfit']">{p.title}</h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 bg-[#0D1411]/30">
        <AnimatedSection className="max-w-7xl mx-auto px-6">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-white tracking-tight font-['Outfit'] mb-4">
              One Intelligent Loop
            </h2>
            <p className="text-base text-[#94A3B8] max-w-2xl mx-auto">
              Adspora thinks in a continuous cycle. Detect the signal, diagnose the cause, generate the fix, decide what to ship.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { type: "detect", title: "Detect", desc: "Continuously scores every creative on a 0-100 fatigue scale. Tracks ROAS decline, CTR trends, breakeven proximity, and age to label creatives as Healthy, Watch, Fatiguing, or Dead.", tag: "Real-time Monitoring" },
              { type: "diagnose", title: "Diagnose", desc: "AI analyst explains in plain language what's happening to the numbers, why it's happening — audience saturation, hook wear-out, rising competition — and what angle to test next.", tag: "AI-Powered Analysis" },
              { type: "generate", title: "Generate", desc: "One-click AI copywriter produces platform-native replacement ads. Casual for TikTok, benefit-led for Google, curiosity-driven for Taboola, scroll-stopping for Meta.", tag: "Instant Ad Copy" },
              { type: "decide", title: "Decide", desc: "Prioritized 'replace now' list ranked by spend at risk. Alerts the moment a high-spend creative crosses the danger zone. Tracks replacement performance.", tag: "Smart Prioritization" },
            ].map((step, i) => (
              <motion.div key={i} variants={fadeUp} className="relative group">
                <div className="bg-[#0D1411] border border-[#10B981]/10 rounded-xl p-6 hover:border-[#10B981]/25 transition-all h-full">
                  <div className="w-16 h-16 mb-4"><StepIcon type={step.type} /></div>
                  <span className="text-xs font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded mb-3 inline-block">{step.tag}</span>
                  <h3 className="text-xl font-medium text-white mb-2 font-['Outfit']">{step.title}</h3>
                  <p className="text-sm text-[#94A3B8] leading-relaxed">{step.desc}</p>
                </div>
                {i < 3 && <div className="hidden lg:block absolute top-1/2 -right-4 w-8 text-[#10B981]/30"><ArrowRight size={20} /></div>}
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="py-24">
        <AnimatedSection className="max-w-7xl mx-auto px-6">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-white tracking-tight font-['Outfit'] mb-4">
              Everything You Need
            </h2>
            <p className="text-base text-[#94A3B8] max-w-2xl mx-auto">
              A complete suite of tools to turn creative refresh from a fire drill into a calm, automated workflow.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BarChart3, title: "Fatigue Dashboard", desc: "At-a-glance view: total spend, spend at risk, ROAS trends, creative health distribution — all in one premium control room." },
              { icon: Layers, title: "Creatives Command Center", desc: "Sortable table with live fatigue gauge, status pills, platform icons, and predictive 'days remaining' for every creative." },
              { icon: Brain, title: "AI Diagnosis", desc: "GPT-5.2 powered analyst explains what's dying, why, how urgent it is, and what creative angle to test next." },
              { icon: Zap, title: "AI Ad Generator", desc: "One-click replacement ads written in each platform's native voice — casual for TikTok, benefit-led for Google, emotional for Meta." },
              { icon: Target, title: "A/B Test Tracking", desc: "Launch replacement creatives and track how they perform vs. the original. The system keeps learning what works." },
              { icon: TrendingUp, title: "Predictive Forecasting", desc: "Estimates how many days a creative has left before it dies, so teams can refresh proactively." },
              { icon: Upload, title: "CSV & Excel Import", desc: "Upload your ad performance data from any source. Auto-maps columns and instantly calculates fatigue scores." },
              { icon: Bell, title: "Smart Alerts", desc: "Spend-at-risk alerts pushed the moment a creative turns dangerous. Slack and email delivery built-in." },
              { icon: Shield, title: "Cross-Platform Normalization", desc: "Google, Meta, Taboola, and TikTok metrics normalized into one clean, comparable view at last." },
            ].map((f, i) => (
              <motion.div key={i} variants={fadeUp} className="bg-[#0D1411] border border-[#10B981]/8 rounded-xl p-6 hover:border-[#10B981]/25 transition-all hover:-translate-y-1 group">
                <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 flex items-center justify-center mb-4 group-hover:bg-[#10B981]/20 transition-colors">
                  <f.icon size={20} className="text-[#10B981]" />
                </div>
                <h3 className="text-white font-medium mb-2 font-['Outfit']">{f.title}</h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ── Platform Support ── */}
      <section id="platforms" className="py-24 bg-[#0D1411]/30">
        <AnimatedSection className="max-w-7xl mx-auto px-6 text-center">
          <motion.div variants={fadeUp}>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-white tracking-tight font-['Outfit'] mb-4">
              One View. Four Platforms.
            </h2>
            <p className="text-base text-[#94A3B8] max-w-2xl mx-auto mb-12">
              Finally see Google, Meta, TikTok, and Taboola side by side — normalized, scored, and actionable.
            </p>
          </motion.div>
          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-6">
            {[
              { name: "Meta", color: "#1877F2", desc: "Facebook & Instagram Ads" },
              { name: "Google", color: "#4285F4", desc: "Search, Shopping, Display, PMax" },
              { name: "TikTok", color: "#00F2EA", desc: "Spark Ads & In-Feed" },
              { name: "Taboola", color: "#004B93", desc: "Native Discovery & Content" },
            ].map((p, i) => (
              <motion.div key={i} variants={fadeUp}
                className="bg-[#0D1411] border border-[#10B981]/10 rounded-xl p-8 w-56 hover:border-[#10B981]/25 transition-all hover:-translate-y-1">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center font-['Outfit'] font-bold text-xl text-white mx-auto mb-4" style={{ backgroundColor: p.color }}>
                  {p.name[0]}
                </div>
                <h3 className="text-white font-medium font-['Outfit'] mb-1">{p.name}</h3>
                <p className="text-xs text-[#94A3B8]">{p.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-24">
        <AnimatedSection className="max-w-4xl mx-auto px-6 text-center">
          <motion.div variants={fadeUp} className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#10B981]/10 to-[#10B981]/5 rounded-3xl blur-3xl" />
            <div className="relative bg-[#0D1411] border border-[#10B981]/15 rounded-3xl p-12 lg:p-16">
              <img src="https://customer-assets.emergentagent.com/job_217906d7-692a-4730-b893-fe6b7715f218/artifacts/tipqcf7w_image.png" alt="Adspora" className="h-12 mx-auto mb-8" />
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white tracking-tight font-['Outfit'] mb-4">
                Ready to stop the bleed?
              </h2>
              <p className="text-base text-[#94A3B8] max-w-lg mx-auto mb-8 leading-relaxed">
                See your entire creative portfolio's health in seconds. No credit card needed. One-click live demo with real data.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button onClick={() => navigate("/login")} className="bg-[#10B981] text-white font-medium px-10 py-4 rounded-lg hover:bg-[#34D399] transition-all flex items-center gap-2 text-lg group" data-testid="cta-get-started-btn">
                  <Sparkles size={20} />
                  <span>Try Adspora Free</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#10B981]/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="https://customer-assets.emergentagent.com/job_217906d7-692a-4730-b893-fe6b7715f218/artifacts/tipqcf7w_image.png" alt="Adspora" className="h-7" />
            </div>
            <div className="flex items-center gap-6 text-sm text-[#475569]">
              <a href="#how-it-works" className="hover:text-[#94A3B8] transition-colors">How It Works</a>
              <a href="#features" className="hover:text-[#94A3B8] transition-colors">Features</a>
              <a href="#platforms" className="hover:text-[#94A3B8] transition-colors">Platforms</a>
              <button onClick={() => navigate("/login")} className="hover:text-[#94A3B8] transition-colors">Sign In</button>
            </div>
            <p className="text-xs text-[#475569]">&copy; 2026 Adspora. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
