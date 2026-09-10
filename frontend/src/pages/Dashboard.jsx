import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Loader2, Sparkles } from "lucide-react";
import api, { formatApiErrorDetail } from "../lib/api";
import { useData } from "../context/DataContext";
import { PageHeader, SectionTitle, Card } from "../components/common";
import ScoreCards from "../components/ScoreCards";
import ExecutiveSummary from "../components/ExecutiveSummary";
import PricingSection from "../components/PricingSection";
import FeatureMatrix from "../components/FeatureMatrix";
import SwotGrid from "../components/SwotGrid";
import InsightsSection from "../components/InsightsSection";
import RecommendedActions from "../components/RecommendedActions";
import { RadarComparison, PositioningMap } from "../components/Charts";

export default function Dashboard() {
  const { company, competitors, insights, loading, setInsights } = useData();
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
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingBlock />;

  const analyzed = competitors.filter((c) => c.status === "Analyzed").length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Competitor Intelligence"
        subtitle="Understand where you win, where competitors lead, and where to act next."
        right={
          <button onClick={regenerate} disabled={busy} data-testid="regenerate-insights-btn"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Regenerate Insights
          </button>
        }
      />

      {!insights ? (
        <EmptyInsights analyzed={analyzed} onGenerate={regenerate} busy={busy} />
      ) : (
        <>
          <ScoreCards scores={company?.scores} />
          <ExecutiveSummary summary={insights.executive_summary} />

          <section>
            <SectionTitle eyebrow="Pricing" title="Pricing Comparison" />
            <PricingSection pricing={insights.pricing_comparison} />
          </section>

          <section>
            <SectionTitle eyebrow="Capabilities" title="Feature Comparison" />
            <FeatureMatrix matrix={insights.feature_matrix} />
          </section>

          <section>
            <SectionTitle eyebrow="Visual Analysis" title="Competitive Landscape" />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="font-heading font-semibold text-slate-100 mb-2">Multi-Dimension Radar</h4>
                <RadarComparison radar={insights.radar} />
              </Card>
              <Card className="p-6">
                <h4 className="font-heading font-semibold text-slate-100 mb-2">Positioning Map</h4>
                <p className="text-slate-500 text-xs mb-2">Price competitiveness vs feature strength</p>
                <PositioningMap points={insights.positioning} />
              </Card>
            </div>
          </section>

          <section>
            <SectionTitle eyebrow="Analysis" title="SWOT Overview" />
            <SwotGrid swot={insights.swot} />
          </section>

          <section>
            <SectionTitle eyebrow="Recommendations" title="AI Competitive Insights" />
            <InsightsSection insights={insights.insights} />
          </section>

          <RecommendedActions actions={insights.recommended_actions} onChange={(a) => setInsights({ ...insights, recommended_actions: a })} />
        </>
      )}
    </div>
  );
}

function EmptyInsights({ analyzed, onGenerate, busy }) {
  return (
    <Card className="p-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
        <Sparkles className="w-7 h-7 text-blue-400" />
      </div>
      <h3 className="font-heading text-xl font-bold text-slate-100">No insights yet</h3>
      <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
        {analyzed > 0
          ? "You have analyzed competitors. Generate an AI competitive report to populate the dashboard."
          : "Add and analyze at least one competitor, then generate your AI competitive report."}
      </p>
      <button onClick={onGenerate} disabled={busy || analyzed === 0} data-testid="empty-generate-btn"
        className="mt-5 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Generate Report
      </button>
    </Card>
  );
}

function LoadingBlock() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );
}
