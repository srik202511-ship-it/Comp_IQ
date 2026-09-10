import { useData } from "../context/DataContext";
import { PageHeader, Card } from "../components/common";
import SwotGrid from "../components/SwotGrid";

export default function Swot() {
  const { insights } = useData();
  return (
    <div className="space-y-6">
      <PageHeader
        title="SWOT Matrix"
        subtitle="AI-generated strengths, weaknesses, opportunities and threats — each grounded in comparison data."
      />
      {!insights?.swot ? (
        <Card className="p-12 text-center text-slate-400">Generate insights from the Dashboard first to populate the SWOT matrix.</Card>
      ) : (
        <SwotGrid swot={insights.swot} />
      )}
    </div>
  );
}
