import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LabelList, Legend,
} from "recharts";
import { SERIES_COLORS } from "./common";

const AXIS = { fontSize: 11, fill: "#9CA3AF", fontFamily: "JetBrains Mono" };
const TOOLTIP_STYLE = {
  contentStyle: { background: "#0B0F17", border: "1px solid #374151", borderRadius: 12, color: "#F9FAFB" },
  labelStyle: { color: "#F9FAFB" }, itemStyle: { color: "#cbd5e1" },
};

export function RadarComparison({ radar }) {
  if (!radar?.series?.length) return <Empty />;
  const data = radar.dimensions.map((dim, i) => {
    const row = { dimension: dim };
    radar.series.forEach((s) => { row[s.name] = s.values[i]; });
    return row;
  });
  return (
    <ResponsiveContainer width="100%" height={340}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="#1f2937" />
        <PolarAngleAxis dataKey="dimension" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        {radar.series.map((s, i) => (
          <Radar key={s.name} name={s.name} dataKey={s.name}
            stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
            fill={SERIES_COLORS[i % SERIES_COLORS.length]} fillOpacity={i === 0 ? 0.35 : 0.08} strokeWidth={2} />
        ))}
        <Legend wrapperStyle={{ fontSize: 12, color: "#cbd5e1" }} />
        <Tooltip {...TOOLTIP_STYLE} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function PositioningMap({ points, xLabel = "Price Competitiveness →", yLabel = "Feature Strength →" }) {
  if (!points?.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={360}>
      <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 10 }}>
        <CartesianGrid stroke="#1f2937" />
        <XAxis type="number" dataKey="x" name="Price" domain={[0, 10]} tick={AXIS}
          label={{ value: xLabel, position: "insideBottom", offset: -15, fill: "#6B7280", fontSize: 12 }} />
        <YAxis type="number" dataKey="y" name="Features" domain={[0, 100]} tick={AXIS}
          label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "#6B7280", fontSize: 12 }} />
        <ZAxis range={[220, 220]} />
        <Tooltip {...TOOLTIP_STYLE} cursor={{ strokeDasharray: "3 3", stroke: "#374151" }} />
        {points.map((p, i) => (
          <Scatter key={p.company} name={p.company} data={[p]}
            fill={p.is_ours ? "#3B82F6" : SERIES_COLORS[(i % (SERIES_COLORS.length - 1)) + 1]}>
            <LabelList dataKey="company" position="top" style={{ fill: "#e2e8f0", fontSize: 11, fontWeight: 600 }} />
          </Scatter>
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function ValueBarChart({ data, dataKey = "value", nameKey = "company", suffix = "" }) {
  if (!data?.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid stroke="#1f2937" vertical={false} />
        <XAxis dataKey={nameKey} tick={{ fill: "#9CA3AF", fontSize: 11 }} interval={0} />
        <YAxis tick={AXIS} />
        <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: "#1f293733" }} formatter={(v) => `${v}${suffix}`} />
        <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} maxBarSize={64}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.is_ours ? "#3B82F6" : SERIES_COLORS[(i % (SERIES_COLORS.length - 1)) + 1]} />
          ))}
          <LabelList dataKey={dataKey} position="top" formatter={(v) => `${v}${suffix}`} style={{ fill: "#94a3b8", fontSize: 11, fontFamily: "JetBrains Mono" }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function Empty() {
  return <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">No data available yet.</div>;
}
