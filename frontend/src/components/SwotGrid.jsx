import { TrendingUp, TrendingDown, Lightbulb, AlertTriangle } from "lucide-react";

const QUADRANTS = [
  { key: "strengths", label: "Strengths", Icon: TrendingUp, wrap: "bg-emerald-950/30 border-emerald-800/40", text: "text-emerald-400", dot: "bg-emerald-400" },
  { key: "weaknesses", label: "Weaknesses", Icon: TrendingDown, wrap: "bg-rose-950/30 border-rose-800/40", text: "text-rose-400", dot: "bg-rose-400" },
  { key: "opportunities", label: "Opportunities", Icon: Lightbulb, wrap: "bg-blue-950/30 border-blue-800/40", text: "text-blue-400", dot: "bg-blue-400" },
  { key: "threats", label: "Threats", Icon: AlertTriangle, wrap: "bg-amber-950/30 border-amber-800/40", text: "text-amber-400", dot: "bg-amber-400" },
];

export default function SwotGrid({ swot }) {
  if (!swot) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="swot-grid">
      {QUADRANTS.map((q) => (
        <div key={q.key} className={`rounded-2xl border p-6 ${q.wrap}`} data-testid={`swot-${q.key}`}>
          <div className={`flex items-center gap-2 mb-4 ${q.text}`}>
            <q.Icon className="w-5 h-5" />
            <h3 className="font-heading font-bold text-lg">{q.label}</h3>
          </div>
          <ul className="space-y-3">
            {(swot[q.key] || []).map((item, i) => (
              <li key={i} className="flex gap-2.5">
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${q.dot}`} />
                <div>
                  <p className="text-slate-200 text-sm font-medium leading-snug">{item.text}</p>
                  {item.evidence && <p className="text-slate-400 text-xs mt-1 leading-snug">{item.evidence}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
