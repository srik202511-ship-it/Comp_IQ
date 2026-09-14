// Client-side PDF export for the Apples-to-Apples competitive report.
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const BRAND = [59, 130, 246];
const SLATE = [100, 116, 139];

const px = (t, ourName) =>
  typeof t === "string" && ourName ? t.split("Our Product").join(ourName) : t;

const inr = (v) => (v == null ? "—" : `INR ${Number(v).toLocaleString("en-IN")}`);

function statusLabel(comp) {
  if (!comp) return "—";
  if (comp.not_comparable) return "Not Comparable";
  if (comp.status === "HIGHLY_COMPARABLE") return "Highly Comparable";
  return "Partially Comparable";
}

function priceStr(p) {
  if (!p) return "—";
  if (p.normalized) return `${p.original?.label || "—"} (≈ ${inr(p.normalized.annual)}/yr)`;
  return p.original?.label || p.note || "Not publicly available";
}

export function exportAnalysisPdf(report, ourName = "Our Product") {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  let y = 0;

  const ensure = (h) => { if (y + h > H - 55) { doc.addPage(); y = M; } };
  const heading = (text, size = 13) => {
    ensure(size + 14);
    doc.setFont("helvetica", "bold"); doc.setFontSize(size); doc.setTextColor(25);
    doc.text(text, M, y); y += size + 8;
  };
  const para = (text, size = 10, color = 80) => {
    if (!text) return;
    doc.setFont("helvetica", "normal"); doc.setFontSize(size); doc.setTextColor(color);
    const lines = doc.splitTextToSize(String(text), W - 2 * M);
    ensure(lines.length * (size + 3) + 4);
    doc.text(lines, M, y); y += lines.length * (size + 3) + 6;
  };
  const afterTable = () => { y = (doc.lastAutoTable?.finalY || y) + 16; };

  // ---- Header band ----
  doc.setFillColor(...BRAND); doc.rect(0, 0, W, 64, "F");
  doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(18);
  doc.text("Apples-to-Apples Competitive Report", M, 34);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.text("CompeteIQ  ·  Comparability & Competitive Score (kept independent)", M, 50);
  y = 88;

  heading(ourName, 16);
  const dt = report.generated_at ? new Date(report.generated_at) : new Date();
  para(`Generated ${dt.toLocaleString()}${report.is_demo ? "  ·  DEMO DATA" : ""}`, 9, 120);
  y += 4;

  // ---- Ranking ----
  heading("Competitive Ranking");
  para("Ranked by Competitive Score. Comparability shown as context only.", 9, 120);
  autoTable(doc, {
    startY: y,
    head: [["Product", "Comparability", "Competitive Score"]],
    body: (report.ranking || []).map((r) => [
      r.name + (r.is_ours ? " (Ours)" : ""),
      r.comparability == null ? "—" : String(r.comparability),
      r.competitive_score == null ? "Not Calculated" : String(r.competitive_score),
    ]),
    theme: "grid", headStyles: { fillColor: BRAND }, styles: { fontSize: 9, cellPadding: 5 },
    margin: { left: M, right: M },
  });
  afterTable();

  // ---- Per competitor ----
  (report.competitors || []).forEach((c) => {
    ensure(90);
    heading(`${ourName} vs ${c.name}`, 13);
    const cs = c.competitive_score;
    para(
      `Comparability: ${c.comparability.score}/100 — ${statusLabel(c.comparability)}.  ` +
      `Competitive: ${cs ? `${cs.score}/100 (coverage ${cs.data_coverage}%, confidence ${cs.confidence}%)` : "NOT CALCULATED — insufficient comparability"}.`,
      10, 55,
    );
    if (c.comparability.reasoning) para(c.comparability.reasoning, 9, 110);

    autoTable(doc, {
      startY: y,
      head: [["Comparability Dimension", "Match", "Status"]],
      body: Object.values(c.comparability.dimensions).map((d) => [d.label, String(d.score), d.status]),
      theme: "striped", headStyles: { fillColor: SLATE }, styles: { fontSize: 8, cellPadding: 4 },
      margin: { left: M, right: M },
    });
    afterTable();

    if (cs) {
      const ourDims = report.our_product?.competitive_score?.dimensions || {};
      autoTable(doc, {
        startY: y,
        head: [["Metric", "Comparability", ourName, c.name]],
        body: Object.entries(cs.dimensions).map(([k, d]) => [
          d.label, d.comparable,
          ourDims[k]?.score ?? "—",
          d.score == null ? "?" : String(d.score),
        ]),
        theme: "grid", headStyles: { fillColor: BRAND }, styles: { fontSize: 8, cellPadding: 4 },
        margin: { left: M, right: M },
      });
      afterTable();
    }

    para(`Pricing — ${ourName}: ${priceStr(report.our_product?.pricing)}   |   ${c.name}: ${priceStr(c.pricing)}`, 9, 90);

    if (c.gaps) {
      const win = c.gaps.we_win.slice(0, 5).map((g) => `${g.label} (+${g.diff})`).join(", ") || "—";
      const lose = c.gaps.competitor_wins.slice(0, 5).map((g) => `${g.label} (${g.diff})`).join(", ") || "—";
      para(`We win: ${win}`, 9, 90);
      para(`Competitor wins: ${lose}`, 9, 90);
    }
    y += 6;
  });

  // ---- Insights ----
  const ins = report.insights || {};
  ensure(60); heading("AI Strategic Insights");
  para(px(ins.executive_summary, ourName), 10, 60);
  const insBlock = (title, items) => {
    if (!(items && items.length)) return;
    ensure(24);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(30);
    doc.text(title, M, y); y += 14;
    items.forEach((it) => para(`• ${px(it.point, ourName)}${it.evidence ? `  —  ${px(it.evidence, ourName)}` : ""}`, 9, 95));
    y += 2;
  };
  insBlock("Defend", ins.defend);
  insBlock("Close the Gap", ins.close_the_gap);
  insBlock("Differentiate", ins.differentiate);
  insBlock("Investigate", ins.investigate);

  // ---- Footer: disclaimer + page numbers ----
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    if (report.disclaimer) {
      doc.setFontSize(6.5); doc.setTextColor(150); doc.setFont("helvetica", "normal");
      const dl = doc.splitTextToSize(report.disclaimer, W - 2 * M);
      doc.text(dl, M, H - 34);
    }
    doc.setFontSize(8); doc.setTextColor(150);
    doc.text(`Page ${i} of ${pages}`, W - M - 60, H - 18);
  }

  const safe = String(ourName).replace(/[^a-z0-9]/gi, "_").slice(0, 40) || "report";
  doc.save(`CompeteIQ_${safe}_apples-to-apples.pdf`);
}
