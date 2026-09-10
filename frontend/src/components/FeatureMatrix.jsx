import { useMemo, useState } from "react";
import { Check, X, Minus } from "lucide-react";
import { Card } from "./common";

function Cell({ v }) {
  if (v === true) return <Check className="w-4 h-4 text-emerald-400 mx-auto" />;
  if (v === false) return <X className="w-4 h-4 text-rose-400 mx-auto" />;
  return <Minus className="w-4 h-4 text-amber-400 mx-auto" />;
}

export default function FeatureMatrix({ matrix, ourName = "Our Product" }) {
  const [cat, setCat] = useState("All");
  const features = matrix?.features || [];
  const scores = matrix?.feature_scores || {};
  const companies = Object.keys(scores);

  const categories = useMemo(() => {
    const set = new Set(features.map((f) => f.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [features]);

  const rows = cat === "All" ? features : features.filter((f) => f.category === cat);

  if (!features.length) return <Card className="p-8 text-slate-500 text-sm">No feature comparison available yet.</Card>;

  return (
    <Card testid="feature-matrix" className="p-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 text-slate-400"><Check className="w-3.5 h-3.5 text-emerald-400" /> Available</span>
          <span className="inline-flex items-center gap-1 text-slate-400"><X className="w-3.5 h-3.5 text-rose-400" /> Not available</span>
          <span className="inline-flex items-center gap-1 text-slate-400"><Minus className="w-3.5 h-3.5 text-amber-400" /> Unknown</span>
        </div>
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button key={c} data-testid={`feature-filter-${c}`} onClick={() => setCat(c)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  cat === c ? "bg-blue-500/15 text-blue-300 border-blue-500/40" : "bg-[#1F2937] text-slate-400 border-transparent hover:text-slate-200"
                }`}>
                {c}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full border-collapse min-w-[560px]">
          <thead>
            <tr className="border-b border-[#374151]">
              <th className="text-left py-3 pr-4 text-slate-400 font-mono text-[11px] uppercase tracking-wider">Feature</th>
              {companies.map((c) => (
                <th key={c} className={`py-3 px-2 text-center text-xs font-semibold ${c === ourName ? "text-blue-300" : "text-slate-300"}`}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((f, i) => (
              <tr key={i} className="border-b border-[#1f2937] hover:bg-[#1F2937]/40 transition-colors">
                <td className="py-2.5 pr-4 text-slate-200 text-sm">{f.name}</td>
                {companies.map((c) => (
                  <td key={c} className="py-2.5 px-2"><Cell v={f[c]} /></td>
                ))}
              </tr>
            ))}
            <tr className="bg-[#0B0F17]">
              <td className="py-3 pr-4 text-slate-400 font-mono text-[11px] uppercase tracking-wider">Feature Score</td>
              {companies.map((c) => (
                <td key={c} className="py-3 px-2 text-center">
                  <span className={`font-heading font-bold ${c === ourName ? "text-blue-300" : "text-slate-200"}`}>{scores[c]}</span>
                  <span className="text-slate-500 text-xs">/100</span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}
