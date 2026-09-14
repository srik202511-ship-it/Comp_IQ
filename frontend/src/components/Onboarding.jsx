import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Radar, Sparkles, Building2, Lightbulb, ArrowRight, Loader2, Check, X, PartyPopper, Plus,
} from "lucide-react";
import api, { formatApiErrorDetail } from "../lib/api";
import { useData } from "../context/DataContext";

const STEPS = [
  { key: "welcome", label: "Welcome", Icon: Radar },
  { key: "product", label: "Your Product", Icon: Sparkles },
  { key: "competitor", label: "Competitors", Icon: Building2 },
  { key: "insights", label: "Generate Insights", Icon: Lightbulb },
];

const INDUSTRIES = ["SaaS", "Electric Vehicles", "Consumer Electronics", "Banking", "E-commerce", "Fintech", "Healthcare", "Other"];
const MAX_COMPS = 3;

export default function Onboarding({ onClose }) {
  const { company, refresh } = useData();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [website, setWebsite] = useState("");
  const [comps, setComps] = useState([{ company_name: "", industry: "SaaS", website: "" }]);
  const [progress, setProgress] = useState("");

  const setCompAt = (i, patch) => setComps((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const addCompRow = () => setComps((prev) => (prev.length >= MAX_COMPS ? prev : [...prev, { company_name: "", industry: "SaaS", website: "" }]));
  const removeCompRow = (i) => setComps((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));

  const dismiss = () => { localStorage.setItem("ciq_onb_done", "1"); onClose(); };
  const finishTo = (path) => { localStorage.setItem("ciq_onb_done", "1"); onClose(); navigate(path); };
  const finish = () => finishTo("/");

  const analyzeProduct = async () => {
    if (!website.trim()) { toast.error("Enter your product website"); return; }
    setBusy(true);
    const t = toast.loading("Crawling your site & building your product profile…");
    try {
      await api.post("/company/analyze", { website: website.trim(), reset: true });
      await refresh();
      toast.success("Your product profile is ready — starting a fresh comparison", { id: t });
      setStep(2);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail), { id: t });
    } finally { setBusy(false); }
  };

  const addAndAnalyzeCompetitors = async () => {
    const valid = comps.filter((c) => c.company_name.trim() && c.website.trim());
    if (!valid.length) { toast.error("Enter at least one competitor (name and website)"); return; }
    setBusy(true);
    const t = toast.loading(`Adding & analyzing ${valid.length} competitor${valid.length > 1 ? "s" : ""}…`);
    let ok = 0;
    try {
      for (let i = 0; i < valid.length; i++) {
        const c = valid[i];
        setProgress(`Analyzing ${c.company_name} (${i + 1}/${valid.length})…`);
        toast.loading(`Analyzing ${c.company_name} (${i + 1}/${valid.length})…`, { id: t });
        try {
          const { data } = await api.post("/competitors", c);
          await api.post(`/competitors/${data.id}/analyze`);
          ok++;
        } catch (e) { /* keep going with the rest */ }
      }
      await refresh();
      setProgress("");
      if (ok === 0) { toast.error("Could not analyze those competitors — check the websites and retry.", { id: t }); return; }
      toast.success(`${ok} competitor${ok > 1 ? "s" : ""} analyzed`, { id: t });
      setStep(3);
    } finally { setBusy(false); }
  };

  const generateInsights = async () => {
    setBusy(true);
    const t = toast.loading("GPT-5.4 building your report & first apples-to-apples comparison…");
    try {
      await api.post("/insights/generate");
      // Run the apples-to-apples comparison so it's ready when we land there
      try { await api.post("/analysis/run", { mode: "normal" }); } catch (e) { /* non-fatal */ }
      await refresh();
      toast.success("Your comparison is ready", { id: t });
      finishTo("/analysis");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail), { id: t });
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0B0F17]/90 backdrop-blur-md" />
      <div className="relative w-full max-w-3xl bg-[#111827] border border-[#374151] rounded-3xl overflow-hidden shadow-2xl animate-fade-up">
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        {/* Header + steps */}
        <div className="flex items-center justify-between px-7 pt-6 relative">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <Radar className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-slate-50">Get set up in 3 steps</span>
          </div>
          <button onClick={dismiss} disabled={busy} data-testid="onboarding-skip" className="text-slate-500 hover:text-slate-300 disabled:opacity-40 text-sm inline-flex items-center gap-1">
            Skip <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 px-7 mt-5 relative">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className={`flex items-center gap-2 ${i <= step ? "text-blue-300" : "text-slate-600"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border text-xs ${
                  i < step ? "bg-blue-500 border-blue-500 text-white" : i === step ? "border-blue-500 text-blue-300" : "border-slate-700 text-slate-600"
                }`}>
                  {i < step ? <Check className="w-3.5 h-3.5" /> : <s.Icon className="w-3.5 h-3.5" />}
                </div>
                <span className="text-xs font-medium hidden sm:block">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? "bg-blue-500/60" : "bg-slate-700"}`} />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="px-7 py-7 relative min-h-[280px]">
          {step === 0 && (
            <div data-testid="onboarding-welcome">
              <h2 className="font-heading text-2xl font-bold text-slate-50">Welcome to CompeteIQ 👋</h2>
              <p className="text-slate-400 mt-2 text-sm leading-relaxed max-w-xl">
                Let's map your competitive landscape. We'll start with <span className="text-slate-200 font-medium">your product</span>,
                add a competitor, then generate AI insights that tell you where you win, where you're losing, and what to do next.
              </p>
              <div className="mt-5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
                <div className="text-amber-300 text-xs font-mono uppercase tracking-wider mb-1">Heads up</div>
                <p className="text-slate-300 text-sm">
                  {company?.is_demo
                    ? "You're currently viewing demo data. Setting up your own product will replace it with your real analysis."
                    : "Analyzing a new website will update your product profile and rebuild your competitive analysis."}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button onClick={() => setStep(1)} data-testid="onboarding-start" className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors">
                  Set up my product <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={dismiss} data-testid="onboarding-explore-demo" className="inline-flex items-center justify-center gap-2 border border-[#374151] hover:border-slate-500 text-slate-300 text-sm font-semibold px-5 py-3 rounded-xl transition-colors">
                  Explore the demo first
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div data-testid="onboarding-product">
              <StepHead Icon={Sparkles} title="Analyze your website" subtitle="AI reads your site and builds your product profile automatically. This starts a fresh comparison (any previous competitors and history are cleared)." />
              <label className="block text-slate-300 text-xs font-medium mb-1.5 mt-6">Your product website</label>
              <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourcompany.com" data-testid="onboarding-website"
                className="w-full bg-[#0B0F17] border border-[#1f2937] focus:border-blue-500/60 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none placeholder:text-slate-600" />
              <div className="flex items-center gap-3 mt-6">
                <button onClick={analyzeProduct} disabled={busy} data-testid="onboarding-analyze-product" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Analyze & continue
                </button>
                <span className="text-slate-500 text-xs">Takes ~30-60s</span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div data-testid="onboarding-competitor">
              <StepHead Icon={Building2} title="Add competitors" subtitle={`Comparing against ${company?.company_name || "your product"}. Add up to ${MAX_COMPS} for a richer first comparison — we'll scrape and score each.`} />
              <div className="mt-6 space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {comps.map((c, i) => (
                  <div key={i} className="rounded-xl border border-[#1f2937] bg-[#0B0F17] p-3" data-testid={`onboarding-comp-row-${i}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-xs font-mono uppercase tracking-wider">Competitor {i + 1}</span>
                      {comps.length > 1 && (
                        <button onClick={() => removeCompRow(i)} disabled={busy} data-testid={`onboarding-comp-remove-${i}`}
                          className="text-slate-500 hover:text-rose-400 disabled:opacity-40"><X className="w-4 h-4" /></button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input value={c.company_name} onChange={(e) => setCompAt(i, { company_name: e.target.value })} placeholder="Acme Inc." data-testid={`onboarding-comp-name-${i}`}
                        className="w-full bg-[#111827] border border-[#1f2937] focus:border-blue-500/60 rounded-lg px-3 py-2.5 text-slate-100 text-sm outline-none placeholder:text-slate-600" />
                      <select value={c.industry} onChange={(e) => setCompAt(i, { industry: e.target.value })} data-testid={`onboarding-comp-industry-${i}`}
                        className="w-full bg-[#111827] border border-[#1f2937] focus:border-blue-500/60 rounded-lg px-3 py-2.5 text-slate-100 text-sm outline-none">
                        {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                      </select>
                    </div>
                    <input value={c.website} onChange={(e) => setCompAt(i, { website: e.target.value })} placeholder="https://competitor.com" data-testid={`onboarding-comp-website-${i}`}
                      className="w-full bg-[#111827] border border-[#1f2937] focus:border-blue-500/60 rounded-lg px-3 py-2.5 text-slate-100 text-sm outline-none placeholder:text-slate-600 mt-2" />
                  </div>
                ))}
              </div>
              {comps.length < MAX_COMPS && (
                <button onClick={addCompRow} disabled={busy} data-testid="onboarding-comp-add-row"
                  className="mt-3 inline-flex items-center gap-1.5 text-blue-300 hover:text-blue-200 disabled:opacity-40 text-sm font-medium">
                  <Plus className="w-4 h-4" /> Add another competitor
                </button>
              )}
              <div className="flex items-center gap-3 mt-5">
                <button onClick={addAndAnalyzeCompetitors} disabled={busy} data-testid="onboarding-add-competitor" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Analyze competitors
                </button>
                <span className="text-slate-500 text-xs">{busy && progress ? progress : "~30-60s each"}</span>
              </div>
            </div>
          )}

          {step === 3 && (
            <div data-testid="onboarding-insights" className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto">
                <PartyPopper className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-slate-50 mt-4">You're all set!</h2>
              <p className="text-slate-400 mt-2 text-sm max-w-md mx-auto">
                Generate your AI report and your first apples-to-apples comparison, and we will open it for you.
              </p>
              <button onClick={generateInsights} disabled={busy} data-testid="onboarding-generate" className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />} Generate & open comparison
              </button>
              <div className="mt-3">
                <button onClick={finish} data-testid="onboarding-finish-later" className="text-slate-500 hover:text-slate-300 text-xs">I'll do this later</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepHead({ Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#1F2937] flex items-center justify-center text-blue-400 shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h2 className="font-heading text-xl font-bold text-slate-50">{title}</h2>
        <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
      </div>
    </div>
  );
}
