import { useEffect, useState, useCallback, useMemo } from "react";
import { Loader2, History as HistoryIcon, TrendingUp, TrendingDown, Minus, Scale } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { PageHeader, Card, SectionTitle, SERIES_COLORS } from "../components/common";
import { TrendChart } from "../components/Charts";

const fmtDate = (s) => {
  try { return new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
  catch { return s; }
};

export default function History() {
  const [snaps, setSnaps] = useState(undefined);
  const [metric, setMetric] = useState("competitive"); // competitive | comparability
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/analysis/history");
      setSnaps(Array.isArray(data) ? data : []);
    } catch {
      setSnaps([]);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Build the set of series names (our product + competitors that appear)
  const { chartData, series, ourName } = useMemo(() => {
    if (!snaps?.length) return { chartData: [], series: [], ourName: null };
    const ourName = snaps[snaps.length - 1]?.our?.name || "Our Product";
    const compNames = [];
    snaps.forEach((s) => (s.competitors || []).forEach((c) => {
      if (!compNames.includes(c.name)) compNames.push(c.name);
    }));

    const rows = snaps.map((s) => {
      const row = { label: fmtDate(s.generated_at) };
      if (metric === "competitive") row[ourName] = s.our?.competitive_score ?? null;
      (s.competitors || []).forEach((c) => {
        row[c.name] = metric === "competitive" ? (c.competitive_score ?? null) : (c.comparability ?? null);
      });
      return row;
    });

    const series = [];
    if (metric === "competitive") series.push({ name: ourName, color: "#3B82F6", isOurs: true });
    compNames.forEach((n, i) => series.push({ name: n, color: SERIES_COLORS[(i % (SERIES_COLORS.length - 1)) + 1] }));
    return { chartData: rows, series, ourName };
  }, [snaps, metric]);

  // Delta between first and last run for each series
  const deltas = useMemo(() => {
    if (!snaps?.length || snaps.length < 2) return [];
    const first = snaps[0], last = snaps[snaps.length - 1];
    const out = [];
    const val = (snap, name, isOurs) => {
      if (isOurs) return snap.our?.competitive_score ?? null;
      const c = (snap.competitors || []).find((x) => x.name === name);
      return c ? (metric === "competitive" ? c.competitive_score : c.comparability) : null;
    };
    series.forEach((s) => {
      const a = val(first, s.name, s.isOurs);
      const b = val(last, s.name, s.isOurs);
      if (a != null && b != null) out.push({ name: s.name, from: a, to: b, diff: b - a, isOurs: s.isOurs });
    });
    return out;
  }, [snaps, series, metric]);

  if (snaps === undefined) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  }

  const enoughData = snaps.length >= 2;

  return (
    <div className="space-y-8" data-testid="history-page">
      <PageHeader
        title="Saved Comparisons"
        subtitle="Every analysis run is saved so you can track how comparability and competitive scores shift over time."
        right={
          <button onClick={() => navigate("/analysis")} data-testid="history-run-btn"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <Scale className="w-4 h-4" /> New Analysis
          </button>
        }
      />

      {snaps.length === 0 ? (
        <Card className="p-12 text-center" testid="history-empty">
          <HistoryIcon className="w-10 h-10 text-slate-600 mx-auto mb-4" />
          <div className="text-slate-200 font-heading text-lg font-semibold">No saved comparisons yet</div>
          <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">Run an Apples-to-Apples analysis and it will be saved here. Run it again later to see how scores change.</p>
          <button onClick={() => navigate("/analysis")} className="mt-5 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
            <Scale className="w-4 h-4" /> Run First Analysis
          </button>
        </Card>
      ) : (
        <>
          {/* Metric toggle + trend */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle eyebrow="Trend" title={metric === "competitive" ? "Competitive Score Over Time" : "Comparability Over Time"} />
              <div className="inline-flex rounded-xl border border-[#1f2937] bg-[#111827] p-1" data-testid="metric-toggle">
                {[["competitive", "Competitive"], ["comparability", "Comparability"]].map(([k, label]) => (
                  <button key={k} onClick={() => setMetric(k)} data-testid={`metric-${k}`}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${metric === k ? "bg-blue-500/15 text-blue-200" : "text-slate-400 hover:text-slate-200"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <Card className="p-5" testid="trend-card">
              {enoughData ? <TrendChart data={chartData} series={series} /> : (
                <div className="h-[200px] flex flex-col items-center justify-center text-center">
                  <p className="text-slate-300 text-sm">Only one run saved so far.</p>
                  <p className="text-slate-500 text-xs mt-1">Run the analysis again later to see how scores shift over time.</p>
                </div>
              )}
              {metric === "comparability" && (
                <p className="text-[11px] text-slate-500 mt-2">Comparability tracks how fairly each competitor can be compared. Our product is the baseline and has no comparability score.</p>
              )}
            </Card>
          </div>

          {/* Change since first run */}
          {enoughData && deltas.length > 0 && (
            <div>
              <SectionTitle eyebrow="Change" title="Since First Saved Run" />
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3" data-testid="delta-cards">
                {deltas.map((d) => {
                  const up = d.diff > 0, flat = d.diff === 0;
                  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
                  const color = flat ? "text-slate-400" : up ? "text-emerald-400" : "text-rose-400";
                  return (
                    <Card key={d.name} className={`p-4 ${d.isOurs ? "border-blue-500/30" : ""}`}>
                      <div className="text-slate-300 text-sm font-medium flex items-center gap-2">
                        {d.name}{d.isOurs && <span className="text-[9px] font-mono text-blue-300 border border-blue-500/30 rounded px-1">OURS</span>}
                      </div>
                      <div className="flex items-end gap-2 mt-1">
                        <span className="font-heading text-2xl font-bold text-slate-100">{d.to}</span>
                        <span className={`mb-1 inline-flex items-center gap-1 text-xs font-mono ${color}`}>
                          <Icon className="w-3.5 h-3.5" />{d.diff > 0 ? "+" : ""}{d.diff}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">was {d.from}</div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Runs table */}
          <div>
            <SectionTitle eyebrow="Log" title="Saved Runs" />
            <Card className="p-0 overflow-hidden" testid="runs-table">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-[#374151] bg-[#0B0F17] text-slate-400 font-mono text-[11px] uppercase">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Mode</th>
                      <th className="text-right py-3 px-4">Our Competitive</th>
                      <th className="text-left py-3 px-4">Competitors ({metric})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...snaps].reverse().map((s) => (
                      <tr key={s.id} className="border-b border-[#1f2937] hover:bg-[#1F2937]/40">
                        <td className="py-3 px-4 text-slate-200">{fmtDate(s.generated_at)}</td>
                        <td className="py-3 px-4 text-slate-400 capitalize">{s.mode || "normal"}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-100 font-semibold">{s.our?.competitive_score ?? "—"}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            {(s.competitors || []).map((c) => {
                              const v = metric === "competitive" ? c.competitive_score : c.comparability;
                              return (
                                <span key={c.name} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#1F2937] border border-[#374151] text-xs text-slate-300">
                                  {c.name}
                                  <span className="font-mono text-slate-100">{v == null ? "N/C" : v}</span>
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
