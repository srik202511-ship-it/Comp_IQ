"""Assembles CI report blocks from parsed LLM extractions using the deterministic engine."""
from . import engine, pricing as pricing_mod
from .taxonomy import COMPETITIVE_WEIGHTS, COMPETITIVE_DIMENSION_LABELS
from . import CALCULATION_VERSION


def build_features(feat_list):
    out = []
    for f in (feat_list or []):
        cap = f.get("capability_score")
        avail = (f.get("availability") or "unknown").lower()
        if avail == "not_available":
            cap = 0
        out.append({
            "original_term": f.get("original_term", ""),
            "canonical_category": f.get("canonical_category", ""),
            "canonical_feature": f.get("canonical_feature", ""),
            "availability": avail,
            "capability_score": cap,
            "capability_pct": engine.capability_pct(cap),
            "evidence": f.get("evidence", ""),
            "source_url": f.get("source_url", ""),
            "confidence": f.get("confidence", 50),
        })
    return out


def build_our_block(company, extracted):
    dims_in = extracted.get("competitive_dimensions", {})
    # our own product: all dimensions are the comparison baseline (fully comparable)
    dim_data = {}
    for k in COMPETITIVE_WEIGHTS:
        d = dims_in.get(k) or {}
        dim_data[k] = {
            "score": d.get("score"),
            "comparable": "high",
            "confidence": d.get("confidence", 70),
            "evidence": d.get("evidence", ""),
            "source_url": company.get("website", ""),
        }
    competitive = engine.compute_competitive(dim_data)
    features = build_features(extracted.get("features"))
    pricing = pricing_mod.normalize_pricing(extracted.get("pricing"))
    return {
        "name": company.get("product_name") or company.get("company_name") or "Our Product",
        "is_ours": True,
        "classification": extracted.get("classification", {}),
        "competitive_score": competitive,
        "features": features,
        "pricing": pricing,
    }


def build_competitor_block(our_block, comp_doc, extracted, mode="normal"):
    comparability = engine.compute_comparability(
        extracted.get("comparability_match", {}),
        extracted.get("comparability_reasoning", ""),
    )
    features = build_features(extracted.get("features"))
    pricing = pricing_mod.normalize_pricing(extracted.get("pricing"))

    competitive = None
    not_calc_reason = ""
    allow = comparability["is_comparable"] or mode == "exploratory"
    if allow:
        competitive = engine.compute_competitive(extracted.get("competitive_dimensions", {}))
    else:
        not_calc_reason = "Insufficient comparability \u2014 " + (
            comparability["rejection_reason"] or "overall comparability below 60."
        )

    gaps = None
    feature_comparison = engine.build_feature_comparison(our_block.get("features"), features)
    if competitive:
        gaps = engine.compute_gaps(
            our_block.get("competitive_score"), competitive,
            our_block.get("features"), features,
        )

    quadrant = engine.classify_quadrant(
        comparability["score"], competitive["score"] if competitive else None
    )

    return {
        "competitor_id": comp_doc.get("id"),
        "name": comp_doc.get("company_name") or comp_doc.get("product_name") or "Competitor",
        "website": comp_doc.get("website", ""),
        "is_ours": False,
        "mode": mode,
        "exploratory": (not comparability["is_comparable"]) and mode == "exploratory",
        "classification": extracted.get("classification", {}),
        "comparability": comparability,
        "competitive_score": competitive,
        "competitive_not_calculated_reason": not_calc_reason,
        "features": features,
        "feature_comparison": feature_comparison,
        "pricing": pricing,
        "gaps": gaps,
        "quadrant": quadrant,
    }


def _annual_inr(block):
    p = (block.get("pricing") or {}).get("normalized")
    return p.get("annual") if p else None


def _capability(block):
    cs = block.get("competitive_score")
    if not cs:
        return None
    pc = cs.get("dimensions", {}).get("product_capability", {})
    return pc.get("score")


def assemble_report(our_block, comp_blocks, mode="normal"):
    # 2x2 matrix
    matrix = [{"name": our_block["name"], "x": None, "y": (our_block.get("competitive_score") or {}).get("score"),
               "is_ours": True, "quadrant": None}]
    for c in comp_blocks:
        matrix.append({
            "name": c["name"],
            "x": c["comparability"]["score"],
            "y": (c.get("competitive_score") or {}).get("score"),
            "is_ours": False,
            "quadrant": c.get("quadrant"),
        })

    # value for money (our + comparable competitors with real pricing)
    vfm_entries = [{"name": our_block["name"], "capability": _capability(our_block),
                    "annual_inr": _annual_inr(our_block), "is_ours": True}]
    for c in comp_blocks:
        if c.get("competitive_score"):
            vfm_entries.append({"name": c["name"], "capability": _capability(c),
                                "annual_inr": _annual_inr(c), "is_ours": False})
    value_for_money = engine.build_value_for_money(vfm_entries)

    # radar (competitive dimensions only) for our + comparable competitors
    radar_dims = list(COMPETITIVE_WEIGHTS.keys())
    radar_labels = [COMPETITIVE_DIMENSION_LABELS[k] for k in radar_dims]

    def series_for(block):
        cs = block.get("competitive_score")
        if not cs:
            return None
        return [cs["dimensions"][k]["score"] for k in radar_dims]

    radar_series = []
    ours_series = series_for(our_block)
    if ours_series:
        radar_series.append({"name": our_block["name"], "values": ours_series, "is_ours": True})
    for c in comp_blocks:
        s = series_for(c)
        if s:
            radar_series.append({"name": c["name"], "values": s, "is_ours": False})

    # ranking by competitive score (comparable ones), comparability shown as context
    ranking = []
    for b in [our_block] + comp_blocks:
        cs = b.get("competitive_score")
        ranking.append({
            "name": b["name"],
            "is_ours": b.get("is_ours", False),
            "comparability": None if b.get("is_ours") else b["comparability"]["score"],
            "competitive_score": cs["score"] if cs else None,
        })
    ranking.sort(key=lambda r: (r["competitive_score"] is None, -(r["competitive_score"] or 0)))

    return {
        "calculation_version": CALCULATION_VERSION,
        "mode": mode,
        "our_product": our_block,
        "competitors": comp_blocks,
        "matrix": matrix,
        "value_for_money": value_for_money,
        "radar": {"dimensions": radar_labels, "series": radar_series},
        "ranking": ranking,
    }


def summarize_for_insights(report):
    """Compact summary passed to the insights LLM prompt."""
    def comp_summary(c):
        cs = c.get("competitive_score")
        return {
            "name": c["name"],
            "comparability": c["comparability"]["score"],
            "comparability_status": c["comparability"]["status"],
            "competitive_score": cs["score"] if cs else "NOT_CALCULATED",
            "top_wins_for_us": [g["label"] for g in (c.get("gaps") or {}).get("we_win", [])[:3]],
            "top_gaps": [g["label"] for g in (c.get("gaps") or {}).get("competitor_wins", [])[:3]],
            "price": (c.get("pricing") or {}).get("original", {}).get("label"),
        }
    ours = report["our_product"]
    return {
        "our_product": {
            "name": ours["name"],
            "competitive_score": (ours.get("competitive_score") or {}).get("score"),
        },
        "competitors": [comp_summary(c) for c in report["competitors"]],
    }
