import { TrendingUp, AlertTriangle, Target, ShieldAlert } from "lucide-react";
import { Card } from "./common";

export default function ExecutiveSummary({ summary }) {
  if (!summary) return null;
  const posColor = {
    Strong: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    Moderate: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    Weak: "bg-rose-500/10 text-rose-300 border-rose-500/30",
  }[summary.position] || "bg-slate-700 text-slate-300 border-slate-600";

  const items = [
    { label: "Biggest Advantage", value: summary.biggest_advantage, Icon: TrendingUp, color: "text-emerald-400" },
    { label: "Biggest Weakness", value: summary.biggest_weakness, Icon: AlertTriangle, color: "text-rose-400" },
    { label: "Biggest Threat", value: summary.biggest_threat, Icon: ShieldAlert, color: "text-amber-400" },
    { label: "Biggest Opportunity", value: summary.biggest_opportunity, Icon: Target, color: "text-blue-400" },
  ];

  return (
    <Card testid="executive-summary" className="p-6 sm:p-8 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
      <div className="flex items-center justify-between mb-4 relative">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-blue-400 mb-1">AI Executive Summary</div>
          <h2 className="font-heading text-2xl font-bold text-slate-50">Competitive Position</h2>
        </div>
        <span className={`px-3 py-1.5 rounded-full border text-sm font-semibold ${posColor}`} data-testid="position-badge">
          {summary.position}
        </span>
      </div>
      <p className="text-slate-300 leading-relaxed text-sm sm:text-base mb-6 max-w-4xl relative">{summary.narrative}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 relative">
        {items.map((it) => (
          <div key={it.label} className="rounded-xl border border-[#1f2937] bg-[#0B0F17] p-4">
            <div className={`flex items-center gap-2 mb-2 ${it.color}`}>
              <it.Icon className="w-4 h-4" />
              <span className="font-mono text-[10px] uppercase tracking-wider">{it.label}</span>
            </div>
            <p className="text-slate-200 text-sm leading-snug">{it.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
