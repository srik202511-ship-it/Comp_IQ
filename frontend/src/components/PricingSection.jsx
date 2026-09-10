import { Card } from "./common";
import { ValueBarChart } from "./Charts";
import { RelativePriceBadge } from "./Badges";

export default function PricingSection({ pricing }) {
  if (!pricing?.length) return <Card className="p-8 text-slate-500 text-sm">No pricing comparison available yet.</Card>;

  const numeric = pricing.filter((p) => typeof p.numeric === "number" && p.numeric > 0);
  const prices = numeric.map((p) => p.numeric);
  const lowest = prices.length ? Math.min(...prices) : null;
  const highest = prices.length ? Math.max(...prices) : null;
  const ours = pricing.find((p) => p.is_ours);
  const barData = numeric.map((p) => ({ company: p.company, value: p.numeric, is_ours: p.is_ours }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Card testid="pricing-table" className="p-6">
        <div className="grid grid-cols-3 gap-3 mb-5">
          <Stat label="Lowest" value={lowest != null ? `$${lowest}` : "—"} color="text-emerald-400" />
          <Stat label="Highest" value={highest != null ? `$${highest}` : "—"} color="text-rose-400" />
          <Stat label="Our Price" value={ours?.starting_price || "—"} color="text-blue-400" small />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px]">
            <thead>
              <tr className="border-b border-[#374151]">
                <th className="text-left py-2.5 text-slate-400 font-mono text-[11px] uppercase tracking-wider">Company</th>
                <th className="text-left py-2.5 text-slate-400 font-mono text-[11px] uppercase tracking-wider">Starting Price</th>
                <th className="text-right py-2.5 text-slate-400 font-mono text-[11px] uppercase tracking-wider">Position</th>
              </tr>
            </thead>
            <tbody>
              {pricing.map((p, i) => (
                <tr key={i} className={`border-b border-[#1f2937] ${p.is_ours ? "bg-blue-500/5" : ""}`}>
                  <td className={`py-2.5 text-sm font-medium ${p.is_ours ? "text-blue-300" : "text-slate-200"}`}>{p.company}</td>
                  <td className="py-2.5 text-sm text-slate-300 font-mono">{p.starting_price}</td>
                  <td className="py-2.5 text-right"><RelativePriceBadge position={p.relative_position} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-slate-500 text-xs mt-4">Pricing models differ across vendors — comparison is approximate.</p>
      </Card>

      <Card testid="pricing-chart" className="p-6">
        <h4 className="font-heading font-semibold text-slate-100 mb-4">Starting Price Comparison</h4>
        <ValueBarChart data={barData} suffix="" />
      </Card>
    </div>
  );
}

function Stat({ label, value, color, small }) {
  return (
    <div className="rounded-xl border border-[#1f2937] bg-[#0B0F17] p-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-1">{label}</div>
      <div className={`font-heading font-bold ${small ? "text-sm" : "text-xl"} ${color}`}>{value}</div>
    </div>
  );
}
