import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, Loader2, RotateCcw } from "lucide-react";
import api, { formatApiErrorDetail } from "../lib/api";
import { useData } from "../context/DataContext";
import { PageHeader, Card, SectionTitle } from "../components/common";

const toList = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
const toStr = (a) => (Array.isArray(a) ? a.join(", ") : a || "");

export default function Settings() {
  const { company, refresh } = useData();
  const [f, setF] = useState(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (company) setF({
      company_name: company.company_name || "", industry: company.industry || "", website: company.website || "",
      description: company.description || "", product_name: company.product_name || "", product_url: company.product_url || "",
      category: company.category || "", product_description: company.product_description || "",
      target_customers: company.target_customers || "", value_proposition: company.value_proposition || "",
      differentiators: toStr(company.differentiators), use_cases: toStr(company.use_cases),
      features: toStr(company.features), pricing: company.pricing || "", competitive_goals: company.competitive_goals || "",
    });
  }, [company]);

  if (!f) return null;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/company", {
        ...f,
        differentiators: toList(f.differentiators), use_cases: toList(f.use_cases), features: toList(f.features),
      });
      await refresh();
      toast.success("Company profile saved");
    } catch (err) { toast.error(formatApiErrorDetail(err.response?.data?.detail)); }
    finally { setSaving(false); }
  };

  const resetDemo = async () => {
    setResetting(true);
    try {
      await api.post("/reset-demo");
      await refresh();
      toast.success("Demo dataset reloaded");
    } catch { toast.error("Could not reset demo"); }
    finally { setResetting(false); }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader title="Settings" subtitle="Define your company & product profile. This is the baseline all competitors are compared against." />

      <form onSubmit={save} className="space-y-6">
        <Card className="p-6">
          <SectionTitle eyebrow="Company" title="Company Profile" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Inp label="Company name" value={f.company_name} onChange={set("company_name")} testid="set-company-name" />
            <Inp label="Industry" value={f.industry} onChange={set("industry")} testid="set-industry" />
            <Inp label="Website" value={f.website} onChange={set("website")} testid="set-website" />
            <Inp label="Pricing" value={f.pricing} onChange={set("pricing")} testid="set-pricing" />
          </div>
          <Area label="Description" value={f.description} onChange={set("description")} testid="set-description" />
        </Card>

        <Card className="p-6">
          <SectionTitle eyebrow="Product" title="Product Profile" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Inp label="Product name" value={f.product_name} onChange={set("product_name")} testid="set-product-name" />
            <Inp label="Category" value={f.category} onChange={set("category")} testid="set-category" />
            <Inp label="Product URL" value={f.product_url} onChange={set("product_url")} testid="set-product-url" />
            <Inp label="Target customers" value={f.target_customers} onChange={set("target_customers")} testid="set-target" />
          </div>
          <Area label="Product description" value={f.product_description} onChange={set("product_description")} testid="set-product-description" />
          <Area label="Value proposition" value={f.value_proposition} onChange={set("value_proposition")} testid="set-value-prop" />
          <Inp label="Features (comma separated)" value={f.features} onChange={set("features")} testid="set-features" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Inp label="Differentiators (comma separated)" value={f.differentiators} onChange={set("differentiators")} testid="set-differentiators" />
            <Inp label="Use cases (comma separated)" value={f.use_cases} onChange={set("use_cases")} testid="set-use-cases" />
          </div>
          <Area label="Competitive goals" value={f.competitive_goals} onChange={set("competitive_goals")} testid="set-goals" />
        </Card>

        <button type="submit" disabled={saving} data-testid="save-company-btn"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Profile
        </button>
      </form>

      <Card className="p-6 border-amber-500/20">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h4 className="font-heading font-semibold text-slate-100">Reset demo data</h4>
            <p className="text-slate-400 text-sm mt-0.5">Restore the pre-loaded SaaS observability dataset and demo insights.</p>
          </div>
          <button onClick={resetDemo} disabled={resetting} data-testid="reset-demo-btn"
            className="inline-flex items-center gap-2 border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
            {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} Reload Demo
          </button>
        </div>
      </Card>
    </div>
  );
}

function Inp({ label, value, onChange, testid }) {
  return (
    <div>
      <label className="block text-slate-300 text-xs font-medium mb-1.5">{label}</label>
      <input value={value} onChange={onChange} data-testid={testid}
        className="w-full bg-[#0B0F17] border border-[#1f2937] focus:border-blue-500/60 rounded-xl px-3 py-2.5 text-slate-100 text-sm outline-none" />
    </div>
  );
}
function Area({ label, value, onChange, testid }) {
  return (
    <div className="mt-4">
      <label className="block text-slate-300 text-xs font-medium mb-1.5">{label}</label>
      <textarea value={value} onChange={onChange} rows={2} data-testid={testid}
        className="w-full bg-[#0B0F17] border border-[#1f2937] focus:border-blue-500/60 rounded-xl px-3 py-2.5 text-slate-100 text-sm outline-none resize-none" />
    </div>
  );
}
