import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const BLUE = [37, 99, 235];
const DARK = [11, 15, 23];
const SLATE = [71, 85, 105];
const LIGHT = [148, 163, 184];
const M = 40; // margin

export function exportDashboardPdf({ company, insights }) {
  const doc = new jsPDF("p", "pt", "a4");
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const es = insights?.executive_summary || {};
  const today = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  // ---------- Header band ----------
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 92, "F");
  doc.setFillColor(...BLUE);
  doc.rect(0, 88, W, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Competitive Intelligence Report", M, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(148, 197, 255);
  doc.text(`${company?.company_name || "Your Company"}  ·  ${company?.industry || ""}`, M, 62);
  doc.setTextColor(160, 174, 192);
  doc.setFontSize(9);
  doc.text(`Generated ${today}  ·  CompeteIQ`, M, 78);

  let y = 120;

  // ---------- Executive summary ----------
  y = sectionTitle(doc, "Executive Summary", y);
  const posColor = es.position === "Strong" ? [16, 185, 129] : es.position === "Weak" ? [225, 29, 72] : [217, 119, 6];
  doc.setFillColor(...posColor);
  doc.roundedRect(M, y - 12, 120, 22, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Position: ${es.position || "—"}`, M + 10, y + 3);
  y += 26;

  y = wrapText(doc, es.narrative || "", M, y, W - 2 * M, 11, SLATE);
  y += 8;

  const highlights = [
    ["Biggest Advantage", es.biggest_advantage],
    ["Biggest Weakness", es.biggest_weakness],
    ["Biggest Threat", es.biggest_threat],
    ["Biggest Opportunity", es.biggest_opportunity],
  ];
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 6, lineColor: [226, 232, 240], textColor: SLATE },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 130, textColor: BLUE }, 1: { cellWidth: W - 2 * M - 130 } },
    body: highlights.map(([k, v]) => [k, v || "—"]),
    margin: { left: M, right: M },
  });
  y = doc.lastAutoTable.finalY + 20;

  // ---------- Scores ----------
  const s = company?.scores || {};
  y = ensure(doc, y, 90);
  y = sectionTitle(doc, "Competitive Scores  (AI-derived)", y);
  autoTable(doc, {
    startY: y,
    theme: "grid",
    head: [["Overall", "Price Comp.", "Feature Strength", "Value Prop", "Market Pos.", "Innovation"]],
    body: [[
      `${s.overall ?? "—"}/100`, `${s.price_competitiveness ?? "—"}/10`, `${s.feature_strength ?? "—"}%`,
      `${s.value_prop ?? "—"}/10`, `#${s.market_position ?? "—"}`, `${s.innovation ?? "—"}/10`,
    ]],
    headStyles: { fillColor: BLUE, fontSize: 8, halign: "center" },
    bodyStyles: { fontSize: 12, fontStyle: "bold", halign: "center", textColor: DARK },
    margin: { left: M, right: M },
  });
  y = doc.lastAutoTable.finalY + 20;

  // ---------- Comparison table ----------
  const ct = insights?.comparison_table || [];
  if (ct.length) {
    y = ensure(doc, y, 80);
    y = sectionTitle(doc, "Competitor Comparison", y);
    autoTable(doc, {
      startY: y,
      theme: "striped",
      head: [["Company", "Overall", "Price", "Features", "Innov.", "Value", "Key Strength", "Key Weakness"]],
      body: ct.map((r) => [
        r.company + (r.is_ours ? " (You)" : ""), r.overall, r.price, r.feature_score, r.innovation, r.value_prop,
        r.key_strength, r.key_weakness,
      ]),
      headStyles: { fillColor: BLUE, fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 4, textColor: SLATE },
      columnStyles: { 6: { cellWidth: 90 }, 7: { cellWidth: 90 } },
      margin: { left: M, right: M },
    });
    y = doc.lastAutoTable.finalY + 20;
  }

  // ---------- Pricing ----------
  const pc = insights?.pricing_comparison || [];
  if (pc.length) {
    y = ensure(doc, y, 80);
    y = sectionTitle(doc, "Pricing Comparison", y);
    autoTable(doc, {
      startY: y,
      theme: "striped",
      head: [["Company", "Starting Price", "Relative Position"]],
      body: pc.map((p) => [p.company + (p.is_ours ? " (You)" : ""), p.starting_price, p.relative_position]),
      headStyles: { fillColor: BLUE, fontSize: 8 },
      styles: { fontSize: 9, cellPadding: 5, textColor: SLATE },
      margin: { left: M, right: M },
    });
    y = doc.lastAutoTable.finalY + 20;
  }

  // ---------- SWOT ----------
  const swot = insights?.swot;
  if (swot) {
    y = ensure(doc, y, 120);
    y = sectionTitle(doc, "SWOT Analysis", y);
    const quads = [
      ["Strengths", swot.strengths, [16, 185, 129]],
      ["Weaknesses", swot.weaknesses, [225, 29, 72]],
      ["Opportunities", swot.opportunities, BLUE],
      ["Threats", swot.threats, [217, 119, 6]],
    ];
    quads.forEach(([label, items, color]) => {
      y = ensure(doc, y, 40);
      doc.setTextColor(...color);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(label, M, y);
      y += 14;
      (items || []).forEach((it) => {
        y = ensure(doc, y, 24);
        doc.setTextColor(...SLATE);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        y = wrapText(doc, `•  ${it.text}${it.evidence ? "  — " + it.evidence : ""}`, M + 6, y, W - 2 * M - 6, 9.5, SLATE);
        y += 3;
      });
      y += 8;
    });
  }

  // ---------- Opportunities / Insights ----------
  const opps = insights?.insights?.opportunities || [];
  if (opps.length) {
    y = ensure(doc, y, 80);
    y = sectionTitle(doc, "Opportunities to Pursue", y);
    autoTable(doc, {
      startY: y,
      theme: "grid",
      head: [["Priority", "Opportunity", "Why It Matters", "Impact"]],
      body: opps.map((o) => [o.priority, o.opportunity, o.why, o.impact]),
      headStyles: { fillColor: BLUE, fontSize: 8 },
      styles: { fontSize: 8.5, cellPadding: 5, textColor: SLATE },
      columnStyles: { 0: { cellWidth: 50, fontStyle: "bold" }, 1: { cellWidth: 130 }, 3: { cellWidth: 55 } },
      margin: { left: M, right: M },
    });
    y = doc.lastAutoTable.finalY + 20;
  }

  // ---------- Recommended actions ----------
  const ra = insights?.recommended_actions || [];
  if (ra.length) {
    y = ensure(doc, y, 80);
    y = sectionTitle(doc, "Recommended Actions", y);
    autoTable(doc, {
      startY: y,
      theme: "grid",
      head: [["Priority", "Action", "Reason", "Impact", "Status"]],
      body: ra.map((a) => [a.priority, a.action, a.reason, a.impact, a.status]),
      headStyles: { fillColor: DARK, fontSize: 8 },
      styles: { fontSize: 8.5, cellPadding: 5, textColor: SLATE },
      columnStyles: { 0: { cellWidth: 50, fontStyle: "bold" }, 4: { cellWidth: 70 } },
      margin: { left: M, right: M },
    });
    y = doc.lastAutoTable.finalY + 16;
  }

  // ---------- Footer on every page ----------
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(M, H - 34, W - M, H - 34);
    doc.setTextColor(...LIGHT);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("Scores and insights are AI-derived estimates, not objective facts. Treat as directional guidance.", M, H - 20);
    doc.text(`Page ${i} of ${pages}`, W - M, H - 20, { align: "right" });
  }

  const name = (company?.company_name || "company").replace(/[^a-z0-9]/gi, "-").toLowerCase();
  doc.save(`competeiq-report-${name}.pdf`);
}

function sectionTitle(doc, text, y) {
  const W = doc.internal.pageSize.getWidth();
  y = ensure(doc, y, 30);
  doc.setFillColor(...BLUE);
  doc.rect(M, y - 10, 4, 14, "F");
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(text, M + 12, y + 2);
  doc.setDrawColor(226, 232, 240);
  doc.line(M, y + 10, W - M, y + 10);
  return y + 26;
}

function wrapText(doc, text, x, y, maxW, size, color) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(size);
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(text || "", maxW);
  lines.forEach((ln) => {
    y = ensure(doc, y, 16);
    doc.text(ln, x, y);
    y += size + 3;
  });
  return y;
}

function ensure(doc, y, needed) {
  const H = doc.internal.pageSize.getHeight();
  if (y + needed > H - 44) {
    doc.addPage();
    return 50;
  }
  return y;
}
