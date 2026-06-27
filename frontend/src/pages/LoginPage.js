import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AUTH } from "@/constants/testIds";
import { formatApiError } from "@/lib/api";
import { Sparkles, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Navigate } from "react-router-dom";

export default function LoginPage() {
  const { user, login, register, demoLogin, loading } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);

  if (loading) return <div className="min-h-screen bg-[#050A08] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password, name);
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message);
    }
    setSubmitting(false);
  };

  const handleDemo = async () => {
    setError("");
    setSubmitting(true);
    try { await demoLogin(); }
    catch (err) { setError(formatApiError(err.response?.data?.detail) || err.message); }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen login-bg flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(https://images.pexels.com/photos/5200063/pexels-photo-5200063.jpeg)`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="relative z-10 max-w-md text-center">
          <img src="https://customer-assets.emergentagent.com/job_217906d7-692a-4730-b893-fe6b7715f218/artifacts/tipqcf7w_image.png" alt="Adspora" className="h-14 mx-auto mb-8" />
          <h1 className="text-4xl sm:text-5xl font-light text-white tracking-tight mb-4 font-['Outfit']">
            Stop Losing Money to Dead Creatives
          </h1>
          <p className="text-[#94A3B8] text-base leading-relaxed">
            AI-powered creative fatigue intelligence for performance marketing teams. Detect, diagnose, generate, decide.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 text-left">
            {[["Detect", "Real-time fatigue scoring"], ["Diagnose", "AI-powered analysis"], ["Generate", "Instant replacement ads"], ["Decide", "Prioritized action list"]].map(([t, d]) => (
              <div key={t} className="bg-[#0D1411]/60 backdrop-blur rounded-lg p-4 border border-[#10B981]/10">
                <p className="text-[#10B981] font-mono text-xs mb-1">{t}</p>
                <p className="text-white text-sm">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right auth panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <img src="https://customer-assets.emergentagent.com/job_217906d7-692a-4730-b893-fe6b7715f218/artifacts/tipqcf7w_image.png" alt="Adspora" className="h-10 mx-auto mb-4" />
          </div>

          <div className="en-card-glass p-8">
            <h2 className="text-2xl font-medium text-white mb-1 font-['Outfit']">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-[#94A3B8] text-sm mb-6">
              {mode === "login" ? "Sign in to your workspace" : "Start monitoring your creatives"}
            </p>

            {error && <div data-testid={AUTH.errorMessage} className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} data-testid={mode === "login" ? AUTH.loginForm : AUTH.registerForm}>
              {mode === "register" && (
                <div className="mb-4">
                  <label className="block text-xs text-[#94A3B8] mb-1.5 font-mono uppercase tracking-wider">Name</label>
                  <input data-testid={AUTH.nameInput} type="text" className="en-input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              )}
              <div className="mb-4">
                <label className="block text-xs text-[#94A3B8] mb-1.5 font-mono uppercase tracking-wider">Email</label>
                <input data-testid={AUTH.emailInput} type="email" className="en-input" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="mb-6">
                <label className="block text-xs text-[#94A3B8] mb-1.5 font-mono uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input data-testid={AUTH.passwordInput} type={showPw ? "text" : "password"} className="en-input pr-10" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94A3B8]">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                data-testid={mode === "login" ? AUTH.loginButton : AUTH.registerButton}
                type="submit"
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span>{mode === "login" ? "Sign In" : "Create Account"}</span><ArrowRight size={16} /></>}
              </button>
            </form>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-px bg-[#10B981]/10" />
              <span className="text-xs text-[#475569]">or</span>
              <div className="flex-1 h-px bg-[#10B981]/10" />
            </div>

            <button
              data-testid={AUTH.demoButton}
              onClick={handleDemo}
              disabled={submitting}
              className="mt-4 w-full btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles size={16} className="text-[#10B981]" />
              <span>Try Live Demo</span>
            </button>

            <p className="mt-6 text-center text-sm text-[#475569]">
              {mode === "login" ? "No account? " : "Already have one? "}
              <button
                data-testid={mode === "login" ? AUTH.switchToRegister : AUTH.switchToLogin}
                onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
                className="text-[#10B981] hover:text-[#34D399]"
              >
                {mode === "login" ? "Create one" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
