import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Loader2 } from "lucide-react";
import api, { formatApiErrorDetail } from "../lib/api";
import { useData } from "../context/DataContext";
import { PageHeader, Card } from "../components/common";
import ExecutiveSummary from "../components/ExecutiveSummary";
import InsightsSection from "../components/InsightsSection";
import RecommendedActions from "../components/RecommendedActions";

export default function Insights() {
  const { insights, setInsights } = useData();
  const [busy, setBusy] = useState(false);

  const regenerate = async () => {
    setBusy(true);
    const t = toast.loading("GPT-5.4 generating competitive report…");
    try {
      const { data } = await api.post("/insights/generate");
      setInsights(data);
      toast.success("Insights refreshed", { id: t });
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail), { id: t });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Insights"
        subtitle="Evidence-based competitive analysis: where you're weaker, where competitors lead, and what to pursue."
        right={
          <button onClick={regenerate} disabled={busy} data-testid="regenerate-insights-btn"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Regenerate
          </button>
        }
      />
      {!insights ? (
        <Card className="p-12 text-center text-slate-400">No insights yet. Analyze competitors and generate a report.</Card>
      ) : (
        <>
          <ExecutiveSummary summary={insights.executive_summary} />
          <InsightsSection insights={insights.insights} />
          <RecommendedActions actions={insights.recommended_actions} onChange={(a) => setInsights({ ...insights, recommended_actions: a })} />
        </>
      )}
    </div>
  );
}
