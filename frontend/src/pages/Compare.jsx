import { useData } from "../context/DataContext";
import { PageHeader, SectionTitle, Card } from "../components/common";
import FeatureMatrix from "../components/FeatureMatrix";
import ComparisonTable from "../components/ComparisonTable";
import PricingSection from "../components/PricingSection";
import { ValueBarChart, PositioningMap } from "../components/Charts";

export default function Compare() {
  const { insights } = useData();

  if (!insights)
    return (
      <div className="space-y-6">
        <PageHeader title="Compare" subtitle="Side-by-side feature, pricing and score comparison." />
        <Card className="p-12 text-center text-slate-400">Generate insights from the Dashboard first to populate comparisons.</Card>
      </div>
    );

  const table = insights.comparison_table || [];
  const overallData = table.map((r) => ({ company: r.company, value: r.overall, is_ours: r.is_ours }));
  const featureData = table.map((r) => ({ company: r.company, value: r.feature_score, is_ours: r.is_ours }));

  return (
    <div className="space-y-8">
      <PageHeader title="Compare" subtitle="Side-by-side feature, pricing, and score comparison across your competitive set." />

      <section>
        <SectionTitle eyebrow="Consolidated" title="Comparison Table" />
        <ComparisonTable rows={table} />
      </section>

      <section>
        <SectionTitle eyebrow="Scores" title="Overall & Feature Strength" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="p-6"><h4 className="font-heading font-semibold text-slate-100 mb-4">Overall Score</h4><ValueBarChart data={overallData} /></Card>
          <Card className="p-6"><h4 className="font-heading font-semibold text-slate-100 mb-4">Feature Strength</h4><ValueBarChart data={featureData} /></Card>
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="Capabilities" title="Feature Matrix" />
        <FeatureMatrix matrix={insights.feature_matrix} />
      </section>

      <section>
        <SectionTitle eyebrow="Pricing" title="Pricing Comparison" />
        <PricingSection pricing={insights.pricing_comparison} />
      </section>

      <section>
        <SectionTitle eyebrow="Positioning" title="Competitive Map" />
        <Card className="p-6"><PositioningMap points={insights.positioning} /></Card>
      </section>
    </div>
  );
}
