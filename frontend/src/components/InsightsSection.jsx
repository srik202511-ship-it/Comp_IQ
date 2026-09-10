import { TrendingDown, Swords, Rocket, ArrowRight } from "lucide-react";
import { Card } from "./common";
import { ImpactBadge, PriorityBadge } from "./Badges";

export default function InsightsSection({ insights }) {
  if (!insights) return null;
  return (
    <div className="space-y-6" data-testid="insights-section">
      <InsightBlock
        testid="insight-weaker" Icon={TrendingDown} color="text-rose-400" ring="border-rose-500/20"
        title="Where We Are Weaker" subtitle="Areas where our product trails the competitive set">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {(insights.weaker || []).map((w, i) => (
            <div key={i} className="rounded-xl border border-[#1f2937] bg-[#0B0F17] p-4">
              <div className="text-slate-100 font-semibold text-sm mb-2">{w.issue}</div>
              <Field label="Evidence" value={w.evidence} />
              <Field label="Impact" value={w.impact} />
            </div>
          ))}
        </div>
      </InsightBlock>

      <InsightBlock
        testid="insight-competitors" Icon={Swords} color="text-amber-400" ring="border-amber-500/20"
        title="Where Competitors Are Better" subtitle="Specific competitor advantages backed by data">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {(insights.competitors_better || []).map((c, i) => (
            <div key={i} className="rounded-xl border border-[#1f2937] bg-[#0B0F17] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-100 font-semibold text-sm">{c.competitor}</span>
                <ImpactBadge impact={c.impact} />
              </div>
              <p className="text-slate-300 text-sm mb-2">{c.advantage}</p>
              <Field label="Evidence" value={c.evidence} />
            </div>
          ))}
        </div>
      </InsightBlock>

      <InsightBlock
        testid="insight-opportunities" Icon={Rocket} color="text-blue-400" ring="border-blue-500/20"
        title="Opportunities to Pursue" subtitle="Actionable, evidence-based competitive plays">
        <div className="space-y-3">
          {(insights.opportunities || []).map((o, i) => (
            <div key={i} className="rounded-xl border border-[#1f2937] bg-[#0B0F17] p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-100 font-semibold text-sm">{o.opportunity}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <PriorityBadge priority={o.priority} />
                  <ImpactBadge impact={o.impact} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pl-6">
                <Field label="Why it matters" value={o.why} />
                <Field label="Evidence" value={o.evidence} />
              </div>
            </div>
          ))}
        </div>
      </InsightBlock>
    </div>
  );
}

function InsightBlock({ Icon, color, title, subtitle, children, testid }) {
  return (
    <Card testid={testid} className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl bg-[#1F2937] flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-lg text-slate-100">{title}</h3>
          <p className="text-slate-500 text-xs">{subtitle}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div className="mt-1.5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{label}: </span>
      <span className="text-slate-300 text-xs leading-snug">{value}</span>
    </div>
  );
}
