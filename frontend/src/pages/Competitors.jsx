import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus, Loader2, Play, RefreshCw, Trash2, Eye, ExternalLink, Building2, Scale,
  FileText, Link2, ShieldAlert, ListChecks,
} from "lucide-react";
import api, { formatApiErrorDetail } from "../lib/api";
import { useData } from "../context/DataContext";
import { PageHeader, Card } from "../components/common";
import { StatusBadge, ReliabilityBadge } from "../components/Badges";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "../components/ui/dialog";

const INDUSTRIES = ["SaaS", "Electric Vehicles", "Consumer Electronics", "Banking", "E-commerce", "Fintech", "Healthcare", "Other"];

const DC_META = {
  ACCESSIBLE: { label: "Collected", cls: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" },
  PARTIALLY_ACCESSIBLE: { label: "Partial", cls: "bg-amber-500/10 text-amber-300 border-amber-500/30" },
  JAVASCRIPT_REQUIRED: { label: "JS-rendered", cls: "bg-blue-500/10 text-blue-300 border-blue-500/30" },
  ROBOTS_RESTRICTED: { label: "Restricted", cls: "bg-rose-500/10 text-rose-300 border-rose-500/30" },
  AUTHENTICATION_REQUIRED: { label: "Login wall", cls: "bg-rose-500/10 text-rose-300 border-rose-500/30" },
  CAPTCHA_OR_BOT_CHALLENGE: { label: "Bot challenge", cls: "bg-rose-500/10 text-rose-300 border-rose-500/30" },
  ACCESS_DENIED: { label: "Access denied", cls: "bg-rose-500/10 text-rose-300 border-rose-500/30" },
  RATE_LIMITED: { label: "Rate limited", cls: "bg-orange-500/10 text-orange-300 border-orange-500/30" },
  TIMEOUT: { label: "Timed out", cls: "bg-orange-500/10 text-orange-300 border-orange-500/30" },
  SITE_ERROR: { label: "Site error", cls: "bg-orange-500/10 text-orange-300 border-orange-500/30" },
  UNKNOWN: { label: "Unknown", cls: "bg-slate-700/40 text-slate-400 border-slate-600" },
};

function DataBadge({ dc, onClick }) {
  if (!dc) return <span className="text-slate-600 text-xs">—</span>;
  const m = DC_META[dc.status] || DC_META.UNKNOWN;
  return (
    <button onClick={onClick} data-testid="data-collection-badge"
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] ${m.cls} hover:brightness-125`}>
      {m.label}
      {dc.sources_used > 0 && <span className="opacity-70">· {dc.sources_used} src</span>}
    </button>
  );
}

export default function Competitors() {
  const { competitors, refresh } = useData();
  const [busyId, setBusyId] = useState(null);
  const [viewComp, setViewComp] = useState(null);
  const [manualComp, setManualComp] = useState(null);
  const [sourcesComp, setSourcesComp] = useState(null);
  const navigate = useNavigate();

  const analyze = async (id) => {
    setBusyId(id);
    const t = toast.loading("Collecting public data (HTTP + browser) & running GPT-5.4…");
    try {
      await api.post(`/competitors/${id}/analyze`);
      await refresh();
      toast.success("Competitor analyzed", { id: t });
    } catch (err) {
      const msg = formatApiErrorDetail(err.response?.data?.detail);
      toast.error(msg, { id: t, duration: 6000 });
      await refresh();
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
        right={
          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate("/analysis")} data-testid="goto-analysis-btn"
              className="inline-flex items-center gap-2 border border-blue-500/40 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
              <Scale className="w-4 h-4" /> Run Apples-to-Apples Analysis
            </button>
            <AddCompetitorDialog onAdded={refresh} />
          </div>
        }
      />

      <Card className="p-0 overflow-hidden" testid="competitors-table">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px]">
            <thead>
              <tr className="border-b border-[#374151] bg-[#0B0F17]">
                {["Competitor", "Industry", "Website", "Status", "Data Collection", "Last Analyzed", "Actions"].map((h) => (
                  <th key={h} className="text-left py-3.5 px-5 font-mono text-[11px] uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {competitors.length === 0 && (
                <tr><td colSpan={7} className="py-16 text-center text-slate-500 text-sm">No competitors yet. Add your first one.</td></tr>
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
                  <td className="py-3.5 px-5"><DataBadge dc={c.data_collection} onClick={() => setSourcesComp(c)} /></td>
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
                      <IconBtn onClick={() => setManualComp(c)} title="Provide page manually" testid={`manual-${c.id}`}><FileText className="w-4 h-4" /></IconBtn>
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
      <SourcesDialog comp={sourcesComp} onClose={() => setSourcesComp(null)}
        onProvide={() => { setManualComp(sourcesComp); setSourcesComp(null); }}
        onRetry={(c) => { setSourcesComp(null); analyze(c.id); }} />
      <ManualDialog comp={manualComp} onClose={() => setManualComp(null)} onDone={refresh} />
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

function SourcesDialog({ comp, onClose, onProvide, onRetry }) {
  if (!comp) return null;
  const dc = comp.data_collection;
  const m = dc ? (DC_META[dc.status] || DC_META.UNKNOWN) : null;
  return (
    <Dialog open={!!comp} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#111827] border-[#374151] text-slate-200 max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-slate-50 flex items-center gap-2"><ListChecks className="w-5 h-5 text-blue-400" /> Data Collection — {comp.company_name}</DialogTitle>
        </DialogHeader>
        {!dc ? (
          <p className="text-slate-400 text-sm">No data-collection record yet. Run Analyze to collect public data.</p>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs ${m.cls}`}>{m.label}</span>
              <span className="text-slate-400 text-xs">Pages: <span className="text-slate-100">{dc.pages_analyzed}</span></span>
              <span className="text-slate-400 text-xs">Sources: <span className="text-slate-100">{dc.sources_used}</span></span>
              <span className="text-slate-400 text-xs">Confidence: <span className="text-slate-100">{dc.extraction_confidence}%</span></span>
              {dc.last_crawl && <span className="text-slate-500 text-xs">Last crawl {new Date(dc.last_crawl).toLocaleString()}</span>}
            </div>
            {dc.message && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-amber-200 text-xs">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />{dc.message}
              </div>
            )}
            {dc.sources?.length > 0 && (
              <div>
                <Lbl>Sources used</Lbl>
                <div className="mt-1.5 space-y-1.5">
                  {dc.sources.map((s, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 rounded-lg border border-[#1f2937] bg-[#0B0F17] px-3 py-2">
                      <a href={s.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 text-xs inline-flex items-center gap-1 truncate max-w-[60%]">
                        <Link2 className="w-3 h-3 shrink-0" /> {s.url.replace(/^https?:\/\//, "")}
                      </a>
                      <span className="text-[10px] text-slate-500 shrink-0">{s.method} · {s.confidence}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {dc.failed_pages?.length > 0 && (
              <div>
                <Lbl>Unavailable pages ({dc.failed_pages.length})</Lbl>
                <div className="mt-1.5 space-y-1">
                  {dc.failed_pages.map((f, i) => (
                    <div key={i} className="text-xs text-slate-500 truncate">{f.url.replace(/^https?:\/\//, "")} — {f.status}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <button onClick={() => onRetry(comp)} data-testid="sources-retry" className="inline-flex items-center gap-2 border border-[#1f2937] bg-[#0B0F17] hover:border-blue-500/40 text-slate-200 text-sm px-3 py-2 rounded-xl">
            <RefreshCw className="w-4 h-4" /> Retry Later
          </button>
          <button onClick={onProvide} data-testid="sources-provide" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-3 py-2 rounded-xl">
            <FileText className="w-4 h-4" /> Provide Page Manually
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ManualDialog({ comp, onClose, onDone }) {
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  if (!comp) return null;
  const submit = async () => {
    if (!text.trim() && !url.trim()) { toast.error("Paste page content or provide a URL"); return; }
    setSaving(true);
    const t = toast.loading("Analyzing provided content with GPT-5.4…");
    try {
      await api.post(`/competitors/${comp.id}/manual`, { text: text.trim() || null, url: url.trim() || null });
      await onDone();
      toast.success(`${comp.company_name} analyzed from provided content`, { id: t });
      onClose(); setText(""); setUrl("");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail), { id: t });
    } finally { setSaving(false); }
  };
  return (
    <Dialog open={!!comp} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#111827] border-[#374151] text-slate-200 max-w-lg">
        <DialogHeader><DialogTitle className="font-heading text-slate-50">Provide page manually — {comp.company_name}</DialogTitle></DialogHeader>
        <p className="text-slate-400 text-xs -mt-1">When a site restricts automated access, paste its public page text or point us at a specific URL. Results are clearly labelled as user-provided.</p>
        <div className="space-y-3 mt-2">
          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1.5">Specific page URL (optional)</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} data-testid="manual-url" placeholder="https://competitor.com/pricing"
              className="w-full bg-[#0B0F17] border border-[#1f2937] focus:border-blue-500/60 rounded-xl px-3 py-2.5 text-slate-100 text-sm outline-none placeholder:text-slate-600" />
          </div>
          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1.5">Or paste page content</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} data-testid="manual-text" placeholder="Paste the competitor's pricing / features / product page text here…"
              className="w-full bg-[#0B0F17] border border-[#1f2937] focus:border-blue-500/60 rounded-xl px-3 py-2.5 text-slate-100 text-sm outline-none resize-none placeholder:text-slate-600" />
          </div>
        </div>
        <DialogFooter>
          <button onClick={submit} disabled={saving} data-testid="manual-submit"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Analyze provided content
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
