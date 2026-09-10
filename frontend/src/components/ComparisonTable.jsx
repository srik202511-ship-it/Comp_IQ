import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { Card } from "./common";

const COLS = [
  { key: "company", label: "Company", align: "left" },
  { key: "overall", label: "Overall", align: "center" },
  { key: "price", label: "Price", align: "left" },
  { key: "feature_score", label: "Features", align: "center" },
  { key: "innovation", label: "Innovation", align: "center" },
  { key: "value_prop", label: "Value", align: "center" },
  { key: "key_strength", label: "Key Strength", align: "left" },
  { key: "key_weakness", label: "Key Weakness", align: "left" },
];

export default function ComparisonTable({ rows }) {
  const [sort, setSort] = useState({ key: "overall", dir: "desc" });
  if (!rows?.length) return <Card className="p-8 text-slate-500 text-sm">No comparison data yet.</Card>;

  const sorted = [...rows].sort((a, b) => {
    const va = a[sort.key], vb = b[sort.key];
    const na = typeof va === "number", nb = typeof vb === "number";
    let cmp = na && nb ? va - vb : String(va).localeCompare(String(vb));
    return sort.dir === "asc" ? cmp : -cmp;
  });

  const toggle = (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }));

  return (
    <Card testid="comparison-table" className="p-6 overflow-hidden">
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full border-collapse min-w-[860px]">
          <thead>
            <tr className="border-b border-[#374151]">
              {COLS.map((c) => (
                <th key={c.key} onClick={() => toggle(c.key)} data-testid={`sort-${c.key}`}
                  className={`py-3 px-3 font-mono text-[11px] uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-200 ${c.align === "center" ? "text-center" : "text-left"}`}>
                  <span className="inline-flex items-center gap-1">{c.label}<ArrowUpDown className="w-3 h-3 opacity-50" /></span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={i} className={`border-b border-[#1f2937] hover:bg-[#1F2937]/40 transition-colors ${r.is_ours ? "bg-blue-500/5" : ""}`}>
                <td className={`py-3 px-3 text-sm font-medium ${r.is_ours ? "text-blue-300" : "text-slate-200"}`}>
                  {r.company}{r.is_ours && <span className="ml-2 text-[10px] font-mono text-blue-400/70">(YOU)</span>}
                </td>
                <td className="py-3 px-3 text-center"><ScorePill v={r.overall} /></td>
                <td className="py-3 px-3 text-slate-300 text-sm font-mono">{r.price}</td>
                <td className="py-3 px-3 text-center text-slate-200 text-sm">{r.feature_score}</td>
                <td className="py-3 px-3 text-center text-slate-200 text-sm">{r.innovation}</td>
                <td className="py-3 px-3 text-center text-slate-200 text-sm">{r.value_prop}</td>
                <td className="py-3 px-3 text-slate-400 text-xs max-w-[180px]">{r.key_strength}</td>
                <td className="py-3 px-3 text-slate-400 text-xs max-w-[180px]">{r.key_weakness}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ScorePill({ v }) {
  const color = v >= 85 ? "text-emerald-300" : v >= 70 ? "text-blue-300" : v >= 55 ? "text-amber-300" : "text-rose-300";
  return <span className={`font-heading font-bold ${color}`}>{v}</span>;
}
