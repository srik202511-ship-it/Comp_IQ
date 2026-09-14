import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Radar, Sparkles, Building2, Lightbulb, ArrowRight, Loader2, Check, X, PartyPopper,
} from "lucide-react";
import api, { formatApiErrorDetail } from "../lib/api";
import { useData } from "../context/DataContext";

const STEPS = [
  { key: "welcome", label: "Welcome", Icon: Radar },
  { key: "product", label: "Your Product", Icon: Sparkles },
  { key: "competitor", label: "First Competitor", Icon: Building2 },
  { key: "insights", label: "Generate Insights", Icon: Lightbulb },
];

const INDUSTRIES = ["SaaS", "Electric Vehicles", "Consumer Electronics", "Banking", "E-commerce", "Fintech", "Healthcare", "Other"];

export default function Onboarding({ onClose }) {
  const { company, refresh } = useData();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [website, setWebsite] = useState("");
  const [comp, setComp] = useState({ company_name: "", industry: "SaaS", website: "" });

  const dismiss = () => { localStorage.setItem("ciq_onb_done", "1"); onClose(); };
  const finish = () => { localStorage.setItem("ciq_onb_done", "1"); onClose(); navigate("/"); };

  const analyzeProduct = async () => {
    if (!website.trim()) { toast.error("Enter your product website"); return; }
    setBusy(true);
    const t = toast.loading("Crawling your site & building your product profile…");
    try {
      await api.post("/company/analyze", { website: website.trim() });
      await refresh();
      toast.success("Your product profile is ready — demo data cleared", { id: t });
      setStep(2);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail), { id: t });
    } finally { setBusy(false); }
  };

  const addAndAnalyzeCompetitor = async () => {
    if (!comp.company_name.trim() || !comp.website.trim()) { toast.error("Enter competitor name and website"); return; }
    setBusy(true);
    const t = toast.loading("Adding competitor & running AI analysis…");
    try {
      const { data } = await api.post("/competitors", comp);
      await api.post(`/competitors/${data.id}/analyze`);
      await refresh();
      toast.success(`${comp.company_name} analyzed`, { id: t });
      setStep(3);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail), { id: t });
    } finally { setBusy(false); }
  };

  const generateInsights = async () => {
    setBusy(true);
    const t = toast.loading("GPT-5.4 generating your competitive report…");
    try {
      await api.post("/insights/generate");
      await refresh();
      toast.success("Your dashboard is ready", { id: t });
      finish();
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
              <StepHead Icon={Sparkles} title="Analyze your website" subtitle="AI reads your site and builds your product profile automatically. This clears the demo data." />
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
              <StepHead Icon={Building2} title="Add your first competitor" subtitle={`Comparing against ${company?.company_name || "your product"}. We'll scrape their site and score them.`} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5">Competitor name</label>
                  <input value={comp.company_name} onChange={(e) => setComp({ ...comp, company_name: e.target.value })} placeholder="Acme Inc." data-testid="onboarding-comp-name"
                    className="w-full bg-[#0B0F17] border border-[#1f2937] focus:border-blue-500/60 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none placeholder:text-slate-600" />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5">Industry</label>
                  <select value={comp.industry} onChange={(e) => setComp({ ...comp, industry: e.target.value })} data-testid="onboarding-comp-industry"
                    className="w-full bg-[#0B0F17] border border-[#1f2937] focus:border-blue-500/60 rounded-xl px-3 py-3 text-slate-100 text-sm outline-none">
                    {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>
              <label className="block text-slate-300 text-xs font-medium mb-1.5 mt-3">Competitor website</label>
              <input value={comp.website} onChange={(e) => setComp({ ...comp, website: e.target.value })} placeholder="https://competitor.com" data-testid="onboarding-comp-website"
                className="w-full bg-[#0B0F17] border border-[#1f2937] focus:border-blue-500/60 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none placeholder:text-slate-600" />
              <div className="flex items-center gap-3 mt-6">
                <button onClick={addAndAnalyzeCompetitor} disabled={busy} data-testid="onboarding-add-competitor" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Analyze competitor
                </button>
                <span className="text-slate-500 text-xs">Takes ~30-60s</span>
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
                Generate your AI competitive report to populate the dashboard with scores, SWOT, insights and recommended actions.
              </p>
              <button onClick={generateInsights} disabled={busy} data-testid="onboarding-generate" className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />} Generate my report
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
