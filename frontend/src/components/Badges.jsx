import { ShieldCheck, Sparkles, EyeOff } from "lucide-react";

export function ReliabilityBadge({ level }) {
  const map = {
    "High": { label: "Confirmed", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", Icon: ShieldCheck },
    "Confirmed": { label: "Confirmed", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", Icon: ShieldCheck },
    "Medium": { label: "AI-inferred", cls: "bg-amber-500/10 text-amber-400 border-amber-500/30", Icon: Sparkles },
    "AI-inferred": { label: "AI-inferred", cls: "bg-amber-500/10 text-amber-400 border-amber-500/30", Icon: Sparkles },
    "Low": { label: "Not Publicly Available", cls: "bg-slate-800 text-slate-400 border-slate-700", Icon: EyeOff },
  };
  const cfg = map[level] || map["Medium"];
  const Icon = cfg.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${cfg.cls}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const map = {
    P0: "bg-rose-500/15 text-rose-300 border-rose-500/40",
    P1: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    P2: "bg-blue-500/15 text-blue-300 border-blue-500/40",
  };
  return (
    <span className={`font-mono inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-semibold ${map[priority] || map.P2}`}>
      {priority}
    </span>
  );
}

export function ImpactBadge({ impact }) {
  const map = {
    High: "bg-rose-500/10 text-rose-300 border-rose-500/30",
    Medium: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    Low: "bg-slate-700/40 text-slate-300 border-slate-600",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md border text-[11px] font-medium ${map[impact] || map.Medium}`}>
      {impact} Impact
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    Analyzed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    Pending: "bg-slate-700/40 text-slate-300 border-slate-600",
    Error: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${map[status] || map.Pending}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "Analyzed" ? "bg-emerald-400" : status === "Error" ? "bg-rose-400" : "bg-slate-400"}`} />
      {status}
    </span>
  );
}

export function RelativePriceBadge({ position }) {
  const map = {
    Low: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    Lower: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    Mid: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    Higher: "bg-rose-500/10 text-rose-300 border-rose-500/30",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md border text-xs font-medium ${map[position] || map.Mid}`}>
      {position}
    </span>
  );
}
