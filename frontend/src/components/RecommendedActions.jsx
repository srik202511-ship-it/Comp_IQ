import { useState } from "react";
import { toast } from "sonner";
import api from "../lib/api";
import { Card } from "./common";
import { PriorityBadge, ImpactBadge } from "./Badges";
import { CheckCircle2, Circle, Clock } from "lucide-react";

const STATUSES = ["Not Started", "In Progress", "Completed"];
const STATUS_STYLE = {
  "Not Started": { cls: "text-slate-400 border-slate-600", Icon: Circle },
  "In Progress": { cls: "text-amber-300 border-amber-500/40", Icon: Clock },
  "Completed": { cls: "text-emerald-300 border-emerald-500/40", Icon: CheckCircle2 },
};

export default function RecommendedActions({ actions, onChange }) {
  const [items, setItems] = useState(actions || []);

  const cycle = async (id) => {
    const item = items.find((a) => a.id === id);
    const next = STATUSES[(STATUSES.indexOf(item.status) + 1) % STATUSES.length];
    const updated = items.map((a) => (a.id === id ? { ...a, status: next } : a));
    setItems(updated);
    try {
      await api.put(`/actions/${id}`, { status: next });
      onChange?.(updated);
    } catch {
      toast.error("Could not update action");
    }
  };

  if (!items.length) return null;

  return (
    <Card testid="recommended-actions" className="p-6">
      <div className="mb-5">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-blue-400 mb-1">Recommended Actions</div>
        <h3 className="font-heading text-xl font-bold text-slate-100">Turn insight into action</h3>
        <p className="text-slate-500 text-xs mt-1">Click a status pill to advance it. Tracks your competitive response.</p>
      </div>
      <div className="space-y-2.5">
        {items.map((a) => {
          const st = STATUS_STYLE[a.status] || STATUS_STYLE["Not Started"];
          return (
            <div key={a.id} data-testid={`action-${a.id}`}
              className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-[#1f2937] bg-[#0B0F17] p-4 hover:border-[#374151] transition-colors">
              <PriorityBadge priority={a.priority} />
              <div className="flex-1 min-w-0">
                <div className="text-slate-100 font-medium text-sm">{a.action}</div>
                <div className="text-slate-500 text-xs mt-0.5">{a.reason}</div>
              </div>
              <ImpactBadge impact={a.impact} />
              <button onClick={() => cycle(a.id)} data-testid={`action-status-${a.id}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all hover:scale-[1.03] ${st.cls} bg-[#111827]`}>
                <st.Icon className="w-3.5 h-3.5" /> {a.status}
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
