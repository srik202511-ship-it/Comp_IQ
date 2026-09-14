import { useEffect, useState, useCallback, Fragment } from "react";
import { toast } from "sonner";
import {
  Loader2, Play, Scale, Trophy, Info, CheckCircle2, XCircle, MinusCircle,
  ShieldCheck, TrendingUp, Target, Search, HelpCircle, FileSearch, AlertTriangle,
} from "lucide-react";
import api, { formatApiErrorDetail } from "../lib/api";
import { PageHeader, Card, SectionTitle } from "../components/common";
import { ComparabilityMatrix, ValueScatter, RadarComparison } from "../components/Charts";

const fmtINR = (v) => (v == null ? "—" : `\u20b9${Number(v).toLocaleString("en-IN")}`);

const COMPARABILITY_TIP =
  "Measures how fairly the two products can be compared based on category, customer, use case, geography, product tier and business model. It does NOT measure product quality or competitive strength.";
const COMPETITIVE_TIP =
  "Measures product performance across comparable capabilities, value and other selected dimensions. It does NOT measure whether the products are inherently similar.";

function InfoTip({ text }) {
  return (
    <span className="relative inline-flex group align-middle">
      <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-help" />
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 opacity-0 group-hover:opacity-100 transition-opacity z-50 rounded-lg bg-[#0B0F17] border border-[#374151] p-2.5 text-[11px] leading-snug text-slate-300 shadow-xl">
        {text}
      </span>
    </span>
  );
}

function compStatusMeta(comp) {
  if (!comp) return { label: "—", cls: "text-slate-400", dot: "bg-slate-500" };
  if (comp.not_comparable) return { label: "Not Comparable", cls: "text-rose-300", dot: "bg-rose-400", ring: "border-rose-500/40" };
  if (comp.status === "HIGHLY_COMPARABLE") return { label: "Highly Comparable", cls: "text-emerald-300", dot: "bg-emerald-400", ring: "border-emerald-500/40" };
  return { label: "Partially Comparable", cls: "text-amber-300", dot: "bg-amber-400", ring: "border-amber-500/40" };
}

function bandMeta(band) {
  return {
    STRONG: { label: "Strong", cls: "text-emerald-300", ring: "border-emerald-500/40" },
    MODERATE: { label: "Moderate", cls: "text-amber-300", ring: "border-amber-500/40" },
    WEAK: { label: "Weak", cls: "text-rose-300", ring: "border-rose-500/40" },
  }[band] || { label: "—", cls: "text-slate-300", ring: "border-slate-700" };
}

const dimBadge = (status) => ({
  high: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  partial: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  low: "bg-rose-500/10 text-rose-300 border-rose-500/30",
  none: "bg-slate-700/40 text-slate-400 border-slate-600",
}[status] || "bg-slate-700/40 text-slate-400 border-slate-600");

export default function Analysis() {
  const [report, setReport] = useState(undefined);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState("normal");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/analysis");
      setReport(data || null);
      if (data?.competitors?.length) {
        const firstComparable = data.competitors.find((c) => c.comparability?.is_comparable) || data.competitors[0];
        setSelected(firstComparable?.name || null);
      }
    } catch {
      setReport(null);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async () => {
    setRunning(true);
    const t = toast.loading("Running Apples-to-Apples analysis (scraping + GPT-5.4)…");
    try {
      const { data } = await api.post("/analysis/run", { mode });
      setReport(data);
      const fc = data.competitors?.find((c) => c.comparability?.is_comparable) || data.competitors?.[0];
      setSelected(fc?.name || null);
      toast.success("Analysis complete", { id: t });
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail), { id: t });
    } finally {
      setRunning(false);
    }
  };

  const RunButton = (
    <div className="flex items-center gap-2">
      <select value={mode} onChange={(e) => setMode(e.target.value)} data-testid="analysis-mode"
        className="bg-[#0B0F17] border border-[#1f2937] rounded-xl px-3 py-2.5 text-slate-200 text-sm outline-none">
        <option value="normal">Normal mode</option>
        <option value="exploratory">Exploratory mode</option>
      </select>
      <button onClick={run} disabled={running} data-testid="run-analysis-btn"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
        {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Run Apples-to-Apples Analysis
      </button>
    </div>
  );

  if (report === undefined) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  }

  return (
    <div className="space-y-8" data-testid="analysis-page">
      <PageHeader
        title="Apples-to-Apples Analysis"
        subtitle="First we validate whether the comparison is fair, then we score how well each product performs on comparable dimensions."
        right={RunButton}
      />

      {/* Methodology banner */}
      <Card className="p-4 border-blue-500/20 bg-blue-500/[0.03]">
        <div className="flex items-start gap-3 text-sm text-slate-300">
          <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
          <p>
            <span className="text-slate-100 font-medium">Two separate questions.</span>{" "}
            <span className="text-blue-300">Comparability</span> tells us whether the benchmark is valid.{" "}
            <span className="text-cyan-300">Competitive Score</span> tells us how well each product performs on the dimensions we can fairly compare. We deliberately keep these scores independent.
          </p>
        </div>
      </Card>

      {!report ? (
        <Card className="p-12 text-center" testid="analysis-empty">
          <Scale className="w-10 h-10 text-slate-600 mx-auto mb-4" />
          <div className="text-slate-200 font-heading text-lg font-semibold">No analysis yet</div>
          <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">Run the Apples-to-Apples analysis to validate comparability and score competitive strength across your competitors.</p>
          <div className="mt-5 flex justify-center">{RunButton}</div>
        </Card>
      ) : (
        <>
          <Overview report={report} />
          <CompetitorSelector report={report} selected={selected} setSelected={setSelected} />
          <CompetitorDetail report={report} name={selected} />
          <Insights insights={report.insights} />
          <EvidenceSection report={report} />
          <Disclaimer text={report.disclaimer} />
        </>
      )}
    </div>
  );
}

/* --------------------------- OVERVIEW --------------------------- */
function Overview({ report }) {
  const matrixPoints = (report.competitors || [])
    .filter((c) => c.competitive_score)
    .map((c) => ({ name: c.name, x: c.comparability.score, y: c.competitive_score.score }));

  const vfm = (report.value_for_money || []).map((e) => ({
    name: e.name, x: e.annual_inr, y: e.capability, is_ours: e.is_ours, idx: e.value_efficiency_index,
  }));

  const notComparable = (report.competitors || []).filter((c) => !c.competitive_score);

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Overview" title="Competitive Landscape" />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5" testid="matrix-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-heading font-semibold text-slate-100">Comparability vs Competitive Strength</h3>
          </div>
          <ComparabilityMatrix points={matrixPoints} />
          <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] text-slate-400">
            <QuadNote color="text-emerald-300" label="Top-right: Strong Direct Competitor" />
            <QuadNote color="text-amber-300" label="Bottom-right: Relevant but Weaker" />
            <QuadNote color="text-cyan-300" label="Top-left: Strong Indirect" />
            <QuadNote color="text-slate-400" label="Bottom-left: Low Priority" />
          </div>
          {notComparable.length > 0 && (
            <div className="mt-3 text-[11px] text-slate-500">
              Not plotted (not comparable): {notComparable.map((c) => c.name).join(", ")}
            </div>
          )}
        </Card>

        <Card className="p-5" testid="ranking-card">
          <h3 className="font-heading font-semibold text-slate-100 mb-3">Competitive Ranking</h3>
          <p className="text-[11px] text-slate-500 mb-3">Ranked by Competitive Score. Comparability shown as context only.</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#374151] text-slate-400 font-mono text-[11px] uppercase">
                <th className="text-left py-2">Product</th>
                <th className="text-right py-2">Comparability</th>
                <th className="text-right py-2">Competitive</th>
              </tr>
            </thead>
            <tbody>
              {report.ranking.map((r) => (
                <tr key={r.name} className={`border-b border-[#1f2937] ${r.is_ours ? "bg-blue-500/[0.04]" : ""}`}>
                  <td className="py-2.5 text-slate-200 font-medium">
                    {r.name}{r.is_ours && <span className="ml-2 text-[9px] font-mono text-blue-300 border border-blue-500/30 rounded px-1">OURS</span>}
                  </td>
                  <td className="py-2.5 text-right text-slate-400">{r.comparability == null ? "—" : r.comparability}</td>
                  <td className="py-2.5 text-right font-mono font-semibold text-slate-100">{r.competitive_score == null ? <span className="text-rose-300 text-xs">N/C</span> : r.competitive_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5" testid="radar-card">
          <h3 className="font-heading font-semibold text-slate-100 mb-1">Competitive Radar</h3>
          <p className="text-[11px] text-slate-500 mb-2">Competitive performance dimensions only — comparability is deliberately excluded.</p>
          <RadarComparison radar={report.radar} />
        </Card>
        <Card className="p-5" testid="value-card">
          <h3 className="font-heading font-semibold text-slate-100 mb-1">Value for Money</h3>
          <p className="text-[11px] text-slate-500 mb-2">Capability vs normalized annual cost (₹). Upper-left = more capability per rupee.</p>
          <ValueScatter points={vfm} />
        </Card>
      </div>
    </div>
  );
}

const QuadNote = ({ color, label }) => (
  <div className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${color.replace("text", "bg")}`} /><span className={color}>{label}</span></div>
);

/* --------------------------- SELECTOR --------------------------- */
function CompetitorSelector({ report, selected, setSelected }) {
  return (
    <div className="flex flex-wrap gap-2" data-testid="competitor-selector">
      {report.competitors.map((c) => {
        const m = compStatusMeta(c.comparability);
        const active = c.name === selected;
        return (
          <button key={c.name} onClick={() => setSelected(c.name)} data-testid={`select-comp-${c.name}`}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm transition-all ${active ? "bg-blue-500/10 border-blue-500/40 text-blue-200" : "bg-[#111827] border-[#1f2937] text-slate-300 hover:border-slate-600"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
            {c.name}
            <span className="font-mono text-[10px] text-slate-500">{c.comparability.score}</span>
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------- DETAIL --------------------------- */
function CompetitorDetail({ report, name }) {
  const comp = report.competitors.find((c) => c.name === name);
  if (!comp) return null;
  const cm = compStatusMeta(comp.comparability);
  const cs = comp.competitive_score;
  const bm = cs ? bandMeta(cs.band) : null;

  return (
    <div className="space-y-6" data-testid="competitor-detail">
      <SectionTitle eyebrow="Apples-to-Apples Check" title={`Our Product vs ${comp.name}`} />

      {/* Two independent score cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className={`p-6 border ${cm.ring || "border-[#1f2937]"}`} testid="comparability-card">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-4 h-4 text-blue-400" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">Apples-to-Apples Comparability</span>
            <InfoTip text={COMPARABILITY_TIP} />
          </div>
          <div className="flex items-end gap-3">
            <div className="font-heading text-5xl font-extrabold text-slate-50">{comp.comparability.score}<span className="text-2xl text-slate-500">/100</span></div>
            <div className={`mb-2 inline-flex items-center gap-1.5 text-sm font-semibold ${cm.cls}`}>
              <span className={`w-2 h-2 rounded-full ${cm.dot}`} />{cm.label}
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-2">How fairly can these products be compared?</p>
          {comp.comparability.reasoning && <p className="text-slate-300 text-sm mt-3 leading-snug">{comp.comparability.reasoning}</p>}
          {comp.comparability.rejection_reason && (
            <div className="mt-3 flex items-start gap-2 text-rose-300 text-xs bg-rose-500/5 border border-rose-500/20 rounded-lg p-2.5">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{comp.comparability.rejection_reason}
            </div>
          )}
        </Card>

        <Card className={`p-6 border ${cs ? bm.ring : "border-rose-500/40"}`} testid="competitive-card">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">Competitive Score</span>
            <InfoTip text={COMPETITIVE_TIP} />
          </div>
          {cs ? (
            <>
              <div className="flex items-end gap-3">
                <div className="font-heading text-5xl font-extrabold text-slate-50">{cs.score}<span className="text-2xl text-slate-500">/100</span></div>
                <div className={`mb-2 text-sm font-semibold ${bm.cls}`}>{bm.label}</div>
              </div>
              <p className="text-slate-400 text-sm mt-2">How well does {comp.name} perform on comparable dimensions?</p>
              <div className="flex gap-4 mt-3 text-xs">
                <span className="text-slate-400">Data coverage <span className="text-slate-100 font-mono">{cs.data_coverage}%</span></span>
                <span className="text-slate-400">Confidence <span className="text-slate-100 font-mono">{cs.confidence}%</span></span>
              </div>
            </>
          ) : (
            <div className="py-4">
              <div className="font-heading text-3xl font-extrabold text-rose-300">NOT CALCULATED</div>
              <p className="text-slate-400 text-sm mt-2">{comp.competitive_not_calculated_reason || "Insufficient comparability."}</p>
              <p className="text-slate-500 text-xs mt-2">We do not show a misleading competitive score for products that are not fairly comparable.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Comparability breakdown */}
      <Card className="p-5" testid="comparability-breakdown">
        <h3 className="font-heading font-semibold text-slate-100 mb-3">Comparability Breakdown</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {Object.entries(comp.comparability.dimensions).map(([k, d]) => (
            <div key={k} className="rounded-xl border border-[#1f2937] bg-[#0B0F17] p-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-xs">{d.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${dimBadge(d.status)}`}>{d.status}</span>
              </div>
              <div className="font-heading text-2xl font-bold text-slate-100 mt-1">{d.score}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Metric-level competitive breakdown */}
      {cs && (
        <Card className="p-5" testid="competitive-breakdown">
          <h3 className="font-heading font-semibold text-slate-100 mb-3">Metric-Level Competitive Scores</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#374151] text-slate-400 font-mono text-[11px] uppercase">
                <th className="text-left py-2">Metric</th>
                <th className="text-center py-2">Comparability</th>
                <th className="text-right py-2">Our</th>
                <th className="text-right py-2">{comp.name}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(cs.dimensions).map(([k, d]) => {
                const ourDim = report.our_product.competitive_score?.dimensions?.[k];
                return (
                  <tr key={k} className={`border-b border-[#1f2937] ${!d.included ? "opacity-50" : ""}`}>
                    <td className="py-2.5 text-slate-200">{d.label}{!d.included && <span className="ml-2 text-[10px] text-slate-500">(excluded)</span>}</td>
                    <td className="py-2.5 text-center"><span className={`text-[10px] px-1.5 py-0.5 rounded border ${dimBadge(d.comparable)}`}>{d.comparable}</span></td>
                    <td className="py-2.5 text-right font-mono text-slate-300">{ourDim?.score ?? "—"}</td>
                    <td className="py-2.5 text-right font-mono text-slate-100 font-semibold">{d.score ?? "?"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {cs.excluded_dimensions?.length > 0 && (
            <p className="text-[11px] text-slate-500 mt-3">Excluded (UNKNOWN or not comparable) and re-normalized: {cs.excluded_dimensions.join(", ")}. Data coverage {cs.data_coverage}%.</p>
          )}
        </Card>
      )}

      {/* Gaps */}
      {comp.gaps && <Gaps gaps={comp.gaps} name={comp.name} />}

      {/* Pricing */}
      <PricingCompare our={report.our_product.pricing} comp={comp.pricing} name={comp.name} />

      {/* Feature comparison */}
      <FeatureComparison rows={comp.feature_comparison} name={comp.name} />
    </div>
  );
}

/* --------------------------- GAPS --------------------------- */
function Gaps({ gaps, name }) {
  const col = (title, items, Icon, color) => (
    <Card className="p-5">
      <div className={`flex items-center gap-2 mb-3 ${color}`}><Icon className="w-4 h-4" /><h4 className="font-heading font-semibold">{title}</h4><span className="text-slate-500 text-xs">({items.length})</span></div>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-slate-500 text-xs">None</p>}
        {items.slice(0, 6).map((g, i) => (
          <div key={i} className="flex items-center justify-between text-sm border-b border-[#1f2937] pb-1.5">
            <span className="text-slate-300">{g.label}</span>
            <span className="font-mono text-xs text-slate-400">{g.our}<span className="text-slate-600"> vs </span>{g.competitor} <span className={g.diff > 0 ? "text-emerald-400" : g.diff < 0 ? "text-rose-400" : "text-slate-500"}>({g.diff > 0 ? "+" : ""}{g.diff})</span></span>
          </div>
        ))}
      </div>
    </Card>
  );
  return (
    <div>
      <SectionTitle eyebrow="Gap Analysis" title={`Where We Stand vs ${name}`} />
      <div className="grid md:grid-cols-3 gap-4">
        {col("We Win", gaps.we_win, CheckCircle2, "text-emerald-300")}
        {col("Competitor Wins", gaps.competitor_wins, XCircle, "text-rose-300")}
        {col("Parity", gaps.parity, MinusCircle, "text-slate-300")}
      </div>
    </div>
  );
}

/* --------------------------- PRICING --------------------------- */
function PriceRow({ label, p, ours }) {
  const norm = p?.normalized;
  return (
    <div className={`rounded-xl border p-4 ${ours ? "border-blue-500/30 bg-blue-500/[0.04]" : "border-[#1f2937] bg-[#0B0F17]"}`}>
      <div className="flex items-center justify-between">
        <span className="text-slate-200 font-medium text-sm">{label}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${p?.comparable ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" : "bg-amber-500/10 text-amber-300 border-amber-500/30"}`}>
          {p?.comparable ? "Comparable" : "Partial / Custom"}
        </span>
      </div>
      <div className="mt-2 text-slate-100 font-heading text-lg">{p?.original?.label || "—"}</div>
      {norm ? (
        <div className="text-slate-400 text-xs mt-1">
          ≈ {fmtINR(norm.annual)}/yr {norm.per_user_year ? `· ${fmtINR(norm.per_user_year)}/user/yr` : ""}
          <div className="text-slate-600 mt-0.5">FX {norm.fx_source === "fallback" ? "(fallback)" : ""} rate {norm.fx_rate} · {norm.fx_rate_date}</div>
        </div>
      ) : (
        <div className="text-slate-500 text-xs mt-1">{p?.note || "Not normalized"}</div>
      )}
    </div>
  );
}

function PricingCompare({ our, comp, name }) {
  return (
    <div>
      <SectionTitle eyebrow="Pricing" title="Normalized Pricing" />
      <div className="grid sm:grid-cols-2 gap-4">
        <PriceRow label="Our Product" p={our} ours />
        <PriceRow label={name} p={comp} />
      </div>
      <p className="text-[11px] text-slate-500 mt-2">Prices normalized to INR annual-equivalent for fair comparison. Custom / contact-sales pricing is never invented.</p>
    </div>
  );
}

/* --------------------------- FEATURES --------------------------- */
function FeatureComparison({ rows, name }) {
  const [open, setOpen] = useState(null);
  const capCell = (f) => {
    if (!f) return <span className="text-slate-600">—</span>;
    if (f.availability === "unknown" || f.capability_pct == null) return <span className="text-slate-500 text-xs">UNKNOWN</span>;
    return <span className="font-mono text-slate-100">{f.capability_score}/5</span>;
  };
  const winnerBadge = (w) => ({
    ours: "text-blue-300", competitor: "text-cyan-300", parity: "text-slate-400", unknown: "text-slate-600",
  }[w]);
  return (
    <div>
      <SectionTitle eyebrow="Features" title="Canonical Feature Comparison" />
      <Card className="p-0 overflow-hidden" testid="feature-comparison">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#374151] bg-[#0B0F17] text-slate-400 font-mono text-[11px] uppercase">
              <th className="text-left py-3 px-4">Capability</th>
              <th className="text-center py-3 px-4">Our Product</th>
              <th className="text-center py-3 px-4">{name}</th>
              <th className="text-left py-3 px-4">Winner</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <Fragment key={r.canonical_feature}>
                <tr className="border-b border-[#1f2937]">
                  <td className="py-2.5 px-4 text-slate-200">{r.canonical_feature}<div className="text-[10px] text-slate-500">{r.category}</div></td>
                  <td className="py-2.5 px-4 text-center">{capCell(r.our)}</td>
                  <td className="py-2.5 px-4 text-center">{capCell(r.competitor)}</td>
                  <td className={`py-2.5 px-4 capitalize font-medium ${winnerBadge(r.winner)}`}>{r.winner === "ours" ? "Our Product" : r.winner === "competitor" ? name : r.winner}</td>
                  <td className="py-2.5 px-4 text-right">
                    <button onClick={() => setOpen(open === i ? null : i)} data-testid={`feat-evidence-${i}`} className="text-slate-500 hover:text-blue-400 text-xs inline-flex items-center gap-1"><FileSearch className="w-3.5 h-3.5" /> Evidence</button>
                  </td>
                </tr>
                {open === i && (
                  <tr className="bg-[#0B0F17]/60"><td colSpan={5} className="px-4 py-3 text-xs text-slate-400">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <EvidenceCell title="Our Product" f={r.our} />
                      <EvidenceCell title={name} f={r.competitor} />
                    </div>
                  </td></tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function EvidenceCell({ title, f }) {
  if (!f) return <div><div className="text-slate-500 font-mono text-[10px] uppercase">{title}</div><div className="text-slate-600 mt-1">No data</div></div>;
  return (
    <div>
      <div className="text-slate-500 font-mono text-[10px] uppercase">{title} · conf {f.confidence}%</div>
      <div className="text-slate-300 mt-1">{f.evidence || "No evidence text"}</div>
      {f.source_url && <a href={f.source_url} target="_blank" rel="noreferrer" className="text-blue-400 text-[11px]">{f.source_url}</a>}
    </div>
  );
}

/* --------------------------- INSIGHTS --------------------------- */
function Insights({ insights }) {
  if (!insights) return null;
  const block = (title, Icon, color, items) => (
    <Card className="p-5">
      <div className={`flex items-center gap-2 mb-3 ${color}`}><Icon className="w-4 h-4" /><h4 className="font-heading font-semibold">{title}</h4></div>
      <div className="space-y-2.5">
        {(items || []).length === 0 && <p className="text-slate-500 text-xs">No items.</p>}
        {(items || []).map((it, i) => (
          <div key={i} className="text-sm">
            <div className="text-slate-200">{it.point}</div>
            {it.evidence && <div className="text-slate-500 text-xs mt-0.5">{it.evidence}</div>}
          </div>
        ))}
      </div>
    </Card>
  );
  return (
    <div data-testid="analysis-insights">
      <SectionTitle eyebrow="AI Strategic Insights" title="What To Do Next" />
      {insights.executive_summary && (
        <Card className="p-5 mb-4">
          <div className="font-mono text-[11px] uppercase tracking-wider text-blue-400 mb-1.5">Executive Summary</div>
          <p className="text-slate-200 leading-relaxed">{insights.executive_summary}</p>
        </Card>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        {block("Defend", ShieldCheck, "text-emerald-300", insights.defend)}
        {block("Close the Gap", TrendingUp, "text-rose-300", insights.close_the_gap)}
        {block("Differentiate", Target, "text-blue-300", insights.differentiate)}
        {block("Investigate", Search, "text-amber-300", insights.investigate)}
      </div>
    </div>
  );
}

/* --------------------------- EVIDENCE --------------------------- */
function EvidenceSection({ report }) {
  const [open, setOpen] = useState(false);
  const rows = [];
  const push = (product, f) => rows.push({
    product, metric: f.canonical_feature, value: f.availability === "unknown" ? "UNKNOWN" : `${f.capability_score}/5`,
    source: f.source_url, evidence: f.evidence, confidence: f.confidence,
  });
  (report.our_product.features || []).forEach((f) => push(report.our_product.name, f));
  (report.competitors || []).forEach((c) => (c.features || []).forEach((f) => push(c.name, f)));
  return (
    <div data-testid="evidence-section">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-slate-300 hover:text-slate-100 text-sm font-medium">
        <FileSearch className="w-4 h-4" /> {open ? "Hide" : "Show"} Evidence & Data Quality ({rows.length} data points)
      </button>
      {open && (
        <Card className="p-0 overflow-hidden mt-3">
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#0B0F17]">
                <tr className="border-b border-[#374151] text-slate-400 font-mono uppercase">
                  <th className="text-left py-2.5 px-3">Product</th>
                  <th className="text-left py-2.5 px-3">Metric</th>
                  <th className="text-left py-2.5 px-3">Value</th>
                  <th className="text-left py-2.5 px-3">Evidence</th>
                  <th className="text-right py-2.5 px-3">Conf.</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-[#1f2937]">
                    <td className="py-2 px-3 text-slate-300">{r.product}</td>
                    <td className="py-2 px-3 text-slate-300">{r.metric}</td>
                    <td className="py-2 px-3 font-mono text-slate-100">{r.value}</td>
                    <td className="py-2 px-3 text-slate-400 max-w-[340px]">{r.evidence || "—"}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-400">{r.confidence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function Disclaimer({ text }) {
  if (!text) return null;
  return (
    <div className="flex items-start gap-2 text-[11px] text-slate-500 border-t border-[#1f2937] pt-4">
      <HelpCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <p className="leading-snug">{text}</p>
    </div>
  );
}
