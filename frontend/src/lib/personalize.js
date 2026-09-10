// Replaces the generic "Our Product" label with the user's real product name
// across all structured insight fields (preserving key order).

export function getOurName(company) {
  return (company?.product_name || company?.company_name || "Our Product").trim() || "Our Product";
}

const OUR = "Our Product";

function renameKeys(obj, ourName) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k === OUR ? ourName : k, v])
  );
}

export function personalizeInsights(insights, ourName) {
  if (!insights || !ourName || ourName === OUR) return insights;
  const c = JSON.parse(JSON.stringify(insights));

  if (c.feature_matrix) {
    if (Array.isArray(c.feature_matrix.features))
      c.feature_matrix.features = c.feature_matrix.features.map((f) => renameKeys(f, ourName));
    if (c.feature_matrix.feature_scores)
      c.feature_matrix.feature_scores = renameKeys(c.feature_matrix.feature_scores, ourName);
  }
  (c.pricing_comparison || []).forEach((p) => { if (p.company === OUR) p.company = ourName; });
  (c.comparison_table || []).forEach((r) => { if (r.company === OUR) r.company = ourName; });
  (c.positioning || []).forEach((p) => { if (p.company === OUR) p.company = ourName; });
  if (c.radar?.series) c.radar.series.forEach((s) => { if (s.name === OUR) s.name = ourName; });

  return c;
}
