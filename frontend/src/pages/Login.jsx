import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Radar, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { formatApiErrorDetail } from "../lib/api";

export default function Login() {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("Welcome back");
        nav("/");
      } else if (mode === "signup") {
        await register(email, password, name);
        toast.success("Account created — demo data loaded");
        nav("/");
      } else {
        toast.success("If an account exists, a reset link was sent.");
        setMode("login");
      }
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const useDemo = () => { setEmail("demo@competeiq.ai"); setPassword("demo1234"); setMode("login"); };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#0B0F17]">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 border-r border-[#1f2937] overflow-hidden">
        <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="flex items-center gap-3 relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <Radar className="w-6 h-6 text-white" />
          </div>
          <span className="font-heading font-bold text-xl text-slate-50">CompeteIQ</span>
        </div>
        <div className="relative">
          <h1 className="font-heading text-5xl font-extrabold text-slate-50 leading-[1.05] tracking-tight">
            Don't just see<br />competitor data.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Know what to do next.</span>
          </h1>
          <p className="text-slate-400 mt-6 text-lg max-w-md leading-relaxed">
            AI competitive intelligence that maps where you win, where competitors lead, and the exact moves to make.
          </p>
          <div className="flex gap-8 mt-10">
            {[["Data", "Scraped"], ["Comparison", "Scored"], ["Insight", "AI-driven"], ["Action", "Prioritized"]].map(([a, b]) => (
              <div key={a}>
                <div className="font-heading text-slate-100 font-bold">{a}</div>
                <div className="font-mono text-[11px] text-blue-400 uppercase tracking-wider">{b}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="font-mono text-xs text-slate-600 relative">DATA → COMPARISON → INSIGHT → ACTION</div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <Radar className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-slate-50">CompeteIQ</span>
          </div>

          <h2 className="font-heading text-2xl font-bold text-slate-50">
            {mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password"}
          </h2>
          <p className="text-slate-400 text-sm mt-1 mb-6">
            {mode === "forgot" ? "Enter your email to receive a reset link." : "Access your competitive intelligence dashboard."}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <Field label="Name" value={name} onChange={setName} placeholder="Jane Doe" testid="signup-name" required={false} />
            )}
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" testid="auth-email" />
            {mode !== "forgot" && (
              <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" testid="auth-password" />
            )}

            <button type="submit" disabled={loading} data-testid="auth-submit"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>
                {mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
                <ArrowRight className="w-4 h-4" />
              </>}
            </button>
          </form>

          <div className="flex items-center justify-between mt-4 text-sm">
            {mode === "login" ? (
              <>
                <button onClick={() => setMode("forgot")} data-testid="goto-forgot" className="text-slate-400 hover:text-slate-200">Forgot password?</button>
                <button onClick={() => setMode("signup")} data-testid="goto-signup" className="text-blue-400 hover:text-blue-300 font-medium">Sign up</button>
              </>
            ) : (
              <button onClick={() => setMode("login")} data-testid="goto-login" className="text-blue-400 hover:text-blue-300 font-medium">Back to sign in</button>
            )}
          </div>

          <button onClick={useDemo} data-testid="use-demo-btn"
            className="w-full mt-6 rounded-xl border border-[#1f2937] bg-[#111827] hover:border-blue-500/40 p-3 text-left transition-colors group">
            <div className="font-mono text-[10px] uppercase tracking-wider text-amber-400 mb-0.5">Try the demo</div>
            <div className="text-slate-300 text-sm group-hover:text-slate-100">demo@competeiq.ai · demo1234 — pre-loaded dataset</div>
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = "text", value, onChange, placeholder, testid, required = true }) {
  return (
    <div>
      <label className="block text-slate-300 text-xs font-medium mb-1.5">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        required={required} data-testid={testid}
        className="w-full bg-[#0B0F17] border border-[#1f2937] focus:border-blue-500/60 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none transition-colors placeholder:text-slate-600"
      />
    </div>
  );
}
