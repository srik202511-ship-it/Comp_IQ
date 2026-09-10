import { useState } from "react";
import { toast } from "sonner";
import {
  Plus, Loader2, Play, RefreshCw, Trash2, Eye, ExternalLink, Building2,
} from "lucide-react";
import api, { formatApiErrorDetail } from "../lib/api";
import { useData } from "../context/DataContext";
import { PageHeader, Card } from "../components/common";
import { StatusBadge, ReliabilityBadge } from "../components/Badges";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "../components/ui/dialog";

const INDUSTRIES = ["SaaS", "Electric Vehicles", "Consumer Electronics", "Banking", "E-commerce", "Fintech", "Healthcare", "Other"];

export default function Competitors() {
  const { competitors, refresh } = useData();
  const [busyId, setBusyId] = useState(null);
  const [viewComp, setViewComp] = useState(null);

  const analyze = async (id) => {
    setBusyId(id);
    const t = toast.loading("Crawling website & running GPT-5.4 analysis…");
    try {
      await api.post(`/competitors/${id}/analyze`);
      await refresh();
      toast.success("Competitor analyzed", { id: t });
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail), { id: t });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/competitors/${id}`);
      await refresh();
      toast.success("Competitor removed");
    } catch { toast.error("Could not delete"); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Competitors"
        subtitle="Add competitors, crawl their sites and run AI analysis. Analyzed competitors feed every dashboard view."
        right={<AddCompetitorDialog onAdded={refresh} />}
      />

      <Card className="p-0 overflow-hidden" testid="competitors-table">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px]">
            <thead>
              <tr className="border-b border-[#374151] bg-[#0B0F17]">
                {["Competitor", "Industry", "Website", "Status", "Last Analyzed", "Actions"].map((h) => (
                  <th key={h} className="text-left py-3.5 px-5 font-mono text-[11px] uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {competitors.length === 0 && (
                <tr><td colSpan={6} className="py-16 text-center text-slate-500 text-sm">No competitors yet. Add your first one.</td></tr>
              )}
              {competitors.map((c) => (
                <tr key={c.id} data-testid={`competitor-row-${c.id}`} className="border-b border-[#1f2937] hover:bg-[#1F2937]/40 transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#1F2937] flex items-center justify-center text-slate-400 shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-slate-100 font-medium text-sm flex items-center gap-2">
                          {c.company_name}
                          {c.is_demo && <span className="text-[9px] font-mono text-amber-400 border border-amber-500/30 rounded px-1">DEMO</span>}
                        </div>
                        {c.product_name && <div className="text-slate-500 text-xs">{c.product_name}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-slate-300 text-sm">{c.industry || "—"}</td>
                  <td className="py-3.5 px-5">
                    {c.website ? (
                      <a href={c.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 text-sm inline-flex items-center gap-1">
                        {c.website.replace(/^https?:\/\//, "").replace(/\/$/, "")} <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : <span className="text-slate-500 text-sm">—</span>}
                  </td>
                  <td className="py-3.5 px-5"><StatusBadge status={c.status} /></td>
                  <td className="py-3.5 px-5 text-slate-400 text-xs">{c.last_analyzed ? new Date(c.last_analyzed).toLocaleDateString() : "—"}</td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-1.5">
                      {c.status === "Analyzed" ? (
                        <>
                          <IconBtn onClick={() => setViewComp(c)} title="View" testid={`view-${c.id}`}><Eye className="w-4 h-4" /></IconBtn>
                          <IconBtn onClick={() => analyze(c.id)} title="Refresh Analysis" busy={busyId === c.id} testid={`refresh-${c.id}`}><RefreshCw className="w-4 h-4" /></IconBtn>
                        </>
                      ) : (
                        <button onClick={() => analyze(c.id)} disabled={busyId === c.id} data-testid={`analyze-${c.id}`}
                          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                          {busyId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Analyze
                        </button>
                      )}
                      <IconBtn onClick={() => remove(c.id)} title="Delete" danger testid={`delete-${c.id}`}><Trash2 className="w-4 h-4" /></IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ViewDialog comp={viewComp} onClose={() => setViewComp(null)} />
    </div>
  );
}

function IconBtn({ children, onClick, title, danger, busy, testid }) {
  return (
    <button onClick={onClick} title={title} disabled={busy} data-testid={testid}
      className={`w-8 h-8 rounded-lg flex items-center justify-center border border-[#1f2937] bg-[#111827] transition-colors ${danger ? "text-slate-400 hover:text-rose-400 hover:border-rose-500/40" : "text-slate-400 hover:text-blue-400 hover:border-blue-500/40"}`}>
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
}

function AddCompetitorDialog({ onAdded }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ company_name: "", industry: "SaaS", website: "", product_name: "", product_category: "", target_market: "", notes: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/competitors", f);
      await onAdded();
      toast.success("Competitor added — click Analyze to run AI");
      setOpen(false);
      setF({ company_name: "", industry: "SaaS", website: "", product_name: "", product_category: "", target_market: "", notes: "" });
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button data-testid="add-competitor-btn" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Add Competitor
        </button>
      </DialogTrigger>
      <DialogContent className="bg-[#111827] border-[#374151] text-slate-200 max-w-lg">
        <DialogHeader><DialogTitle className="font-heading text-slate-50">Add Competitor</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Inp label="Company name *" value={f.company_name} onChange={set("company_name")} required testid="add-name" placeholder="Ather Energy" />
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1.5">Industry</label>
              <select value={f.industry} onChange={set("industry")} data-testid="add-industry"
                className="w-full bg-[#0B0F17] border border-[#1f2937] focus:border-blue-500/60 rounded-xl px-3 py-2.5 text-slate-100 text-sm outline-none">
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>
          <Inp label="Website *" value={f.website} onChange={set("website")} required testid="add-website" placeholder="https://www.atherenergy.com" />
          <div className="grid grid-cols-2 gap-3">
            <Inp label="Product name" value={f.product_name} onChange={set("product_name")} testid="add-product" placeholder="Optional" />
            <Inp label="Category" value={f.product_category} onChange={set("product_category")} testid="add-category" placeholder="Optional" />
          </div>
          <Inp label="Target market" value={f.target_market} onChange={set("target_market")} testid="add-target" placeholder="Optional" />
          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1.5">Notes</label>
            <textarea value={f.notes} onChange={set("notes")} rows={2} data-testid="add-notes"
              className="w-full bg-[#0B0F17] border border-[#1f2937] focus:border-blue-500/60 rounded-xl px-3 py-2.5 text-slate-100 text-sm outline-none resize-none" placeholder="Optional context" />
          </div>
          <DialogFooter>
            <button type="submit" disabled={saving} data-testid="add-submit"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Competitor
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Inp({ label, value, onChange, required, testid, placeholder }) {
  return (
    <div>
      <label className="block text-slate-300 text-xs font-medium mb-1.5">{label}</label>
      <input value={value} onChange={onChange} required={required} data-testid={testid} placeholder={placeholder}
        className="w-full bg-[#0B0F17] border border-[#1f2937] focus:border-blue-500/60 rounded-xl px-3 py-2.5 text-slate-100 text-sm outline-none placeholder:text-slate-600" />
    </div>
  );
}

function ViewDialog({ comp, onClose }) {
  if (!comp) return null;
  const a = comp.analysis || {};
  return (
    <Dialog open={!!comp} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#111827] border-[#374151] text-slate-200 max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-slate-50 flex items-center gap-3">
            {comp.company_name}
            <ReliabilityBadge level={a.confidence} />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <Detail label="Description" value={a.description} />
          <div className="grid grid-cols-2 gap-4">
            <Detail label="Target Customers" value={a.target_customers} />
            <Detail label="Starting Price" value={a.pricing?.starting_price} badge={<ReliabilityBadge level={a.pricing?.confidence} />} />
          </div>
          {a.value_props?.length > 0 && (
            <div>
              <Lbl>Value Propositions</Lbl>
              <ul className="mt-1 space-y-1">{a.value_props.map((v, i) => <li key={i} className="text-slate-300 flex gap-2"><span className="text-blue-400">•</span>{v}</li>)}</ul>
            </div>
          )}
          {a.features?.length > 0 && (
            <div>
              <Lbl>Features ({a.features.length})</Lbl>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {a.features.map((ft, i) => <span key={i} className="px-2 py-0.5 rounded-md bg-[#1F2937] text-slate-300 text-xs border border-[#374151]">{ft.name}</span>)}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Detail label="Key Strength" value={a.key_strength} />
            <Detail label="Key Weakness" value={a.key_weakness} />
          </div>
          {a.source_url && (
            <div className="pt-3 border-t border-[#1f2937] text-xs text-slate-500">
              Source: <a href={a.source_url} target="_blank" rel="noreferrer" className="text-blue-400">{a.source_url}</a>
              {a.collected_at && <> · Collected {new Date(a.collected_at).toLocaleString()}</>}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const Lbl = ({ children }) => <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{children}</span>;
function Detail({ label, value, badge }) {
  return (
    <div>
      <div className="flex items-center gap-2"><Lbl>{label}</Lbl>{badge}</div>
      <p className="text-slate-300 mt-1 leading-snug">{value || "Not publicly available"}</p>
    </div>
  );
}
