"""Deterministic CI scoring engine. No LLM calls here — pure math on parsed inputs."""
from .taxonomy import (
    COMPARABILITY_WEIGHTS, COMPARABILITY_DIMENSION_LABELS, REJECTION_DIMENSIONS,
    REJECTION_FLOOR, COMPARABILITY_HIGH, COMPARABILITY_PARTIAL,
    COMPETITIVE_WEIGHTS, COMPETITIVE_DIMENSION_LABELS, COMPETITIVE_STRONG,
    COMPETITIVE_MODERATE, CAPABILITY_MAX, MATRIX_COMPARABILITY_HIGH,
    MATRIX_COMPETITIVE_HIGH, QUADRANTS, QUADRANT_LABELS,
)


def _clamp(v, lo=0, hi=100):
    try:
        v = float(v)
    except (TypeError, ValueError):
        return 0
    return max(lo, min(hi, v))


def capability_pct(score):
    """Convert a 0-5 capability score to 0-100. None stays None (UNKNOWN)."""
    if score is None:
        return None
    return round((float(score) / CAPABILITY_MAX) * 100)


# ------------------------- COMPARABILITY -------------------------
def compute_comparability(dim_scores: dict, reasoning: str = "") -> dict:
    """dim_scores: {dimension: 0-100 match score}. Returns comparability result."""
    dims = {k: _clamp(dim_scores.get(k, 0)) for k in COMPARABILITY_WEIGHTS}
    weighted = sum(dims[k] * w for k, w in COMPARABILITY_WEIGHTS.items())
    score = round(weighted)

    rejected = any(dims[d] < REJECTION_FLOOR for d in REJECTION_DIMENSIONS)
    rejection_reason = ""
    if rejected:
        low = [COMPARABILITY_DIMENSION_LABELS[d] for d in REJECTION_DIMENSIONS if dims[d] < REJECTION_FLOOR]
        rejection_reason = f"Insufficient match on: {', '.join(low)} (below {REJECTION_FLOOR})."

    if score >= COMPARABILITY_HIGH:
        status = "HIGHLY_COMPARABLE"
    elif score >= COMPARABILITY_PARTIAL:
        status = "PARTIALLY_COMPARABLE"
    else:
        status = "LOW_COMPARABILITY"

    is_comparable = (not rejected) and score >= COMPARABILITY_PARTIAL
    not_comparable = rejected or score < COMPARABILITY_PARTIAL

    def dim_status(v):
        if v >= COMPARABILITY_HIGH:
            return "high"
        if v >= COMPARABILITY_PARTIAL:
            return "partial"
        return "low"

    return {
        "score": score,
        "status": status,
        "is_comparable": is_comparable,
        "not_comparable": not_comparable,
        "rejected": rejected,
        "rejection_reason": rejection_reason,
        "reasoning": reasoning,
        "dimensions": {
            k: {"score": round(dims[k]), "status": dim_status(dims[k]),
                "label": COMPARABILITY_DIMENSION_LABELS[k], "weight": COMPARABILITY_WEIGHTS[k]}
            for k in COMPARABILITY_WEIGHTS
        },
    }


# ------------------------- COMPETITIVE SCORE -------------------------
def compute_competitive(dim_data: dict) -> dict:
    """dim_data: {dimension: {score:0-100|None, comparable:'high'|'partial'|'none',
    confidence:0-100, evidence, source_url}}.

    Excludes UNKNOWN (score None) and non-comparable ('none') dimensions, then
    re-normalizes the remaining weights. Never takes comparability as an input.
    """
    included = {}
    excluded = []
    for k, w in COMPETITIVE_WEIGHTS.items():
        d = dim_data.get(k) or {}
        score = d.get("score")
        comparable = d.get("comparable", "high")
        if score is None or comparable == "none":
            excluded.append(k)
        else:
            included[k] = (_clamp(score), w, _clamp(d.get("confidence", 70)))

    avail_weight = sum(w for _, w, _ in included.values())
    if avail_weight <= 0:
        return None

    overall = sum(s * w for s, w, _ in included.values()) / avail_weight
    confidence = sum(c * w for _, w, c in included.values()) / avail_weight
    data_coverage = round(avail_weight * 100)
    score = round(overall)

    if score >= COMPETITIVE_STRONG:
        band = "STRONG"
    elif score >= COMPETITIVE_MODERATE:
        band = "MODERATE"
    else:
        band = "WEAK"

    dims_out = {}
    for k in COMPETITIVE_WEIGHTS:
        d = dim_data.get(k) or {}
        dims_out[k] = {
            "score": None if d.get("score") is None else round(_clamp(d.get("score"))),
            "comparable": d.get("comparable", "high"),
            "confidence": round(_clamp(d.get("confidence", 70))),
            "evidence": d.get("evidence", ""),
            "source_url": d.get("source_url", ""),
            "label": COMPETITIVE_DIMENSION_LABELS[k],
            "weight": COMPETITIVE_WEIGHTS[k],
            "included": k in included,
        }

    return {
        "score": score,
        "band": band,
        "confidence": round(confidence),
        "data_coverage": data_coverage,
        "excluded_dimensions": excluded,
        "dimensions": dims_out,
    }


# ------------------------- QUADRANT / MATRIX -------------------------
def classify_quadrant(comparability_score, competitive_score):
    if competitive_score is None:
        return None
    x_high = comparability_score >= MATRIX_COMPARABILITY_HIGH
    y_high = competitive_score >= MATRIX_COMPETITIVE_HIGH
    key = QUADRANTS[(x_high, y_high)]
    return {"key": key, "label": QUADRANT_LABELS[key]}


# ------------------------- GAPS -------------------------
def compute_gaps(our_comp: dict, comp_comp: dict, our_features: list, comp_features: list):
    """Compare competitive dimensions + canonical features. diff <= 5 => parity."""
    we_win, competitor_wins, parity = [], [], []

    def add(label, kind, ours, theirs):
        if ours is None or theirs is None:
            return
        diff = round(ours - theirs)
        item = {"label": label, "kind": kind, "our": round(ours), "competitor": round(theirs), "diff": diff}
        if abs(diff) <= 5:
            parity.append(item)
        elif diff > 0:
            we_win.append(item)
        else:
            competitor_wins.append(item)

    our_dims = (our_comp or {}).get("dimensions", {})
    comp_dims = (comp_comp or {}).get("dimensions", {})
    for k in COMPETITIVE_WEIGHTS:
        od, cd = our_dims.get(k, {}), comp_dims.get(k, {})
        if od.get("included") and cd.get("included"):
            add(COMPETITIVE_DIMENSION_LABELS[k], "dimension", od.get("score"), cd.get("score"))

    ours_map = {f["canonical_feature"]: f for f in (our_features or [])}
    comp_map = {f["canonical_feature"]: f for f in (comp_features or [])}
    for feat in sorted(set(ours_map) | set(comp_map)):
        o = ours_map.get(feat, {}).get("capability_pct")
        c = comp_map.get(feat, {}).get("capability_pct")
        add(feat, "feature", o, c)

    we_win.sort(key=lambda x: -x["diff"])
    competitor_wins.sort(key=lambda x: x["diff"])
    return {"we_win": we_win, "competitor_wins": competitor_wins, "parity": parity}


def build_feature_comparison(our_features: list, comp_features: list):
    ours_map = {f["canonical_feature"]: f for f in (our_features or [])}
    comp_map = {f["canonical_feature"]: f for f in (comp_features or [])}
    rows = []
    for feat in sorted(set(ours_map) | set(comp_map)):
        o = ours_map.get(feat, {})
        c = comp_map.get(feat, {})
        op, cp = o.get("capability_pct"), c.get("capability_pct")
        if op is None or cp is None:
            winner = "unknown"
        elif abs(op - cp) <= 5:
            winner = "parity"
        elif op > cp:
            winner = "ours"
        else:
            winner = "competitor"
        rows.append({
            "canonical_feature": feat,
            "category": o.get("canonical_category") or c.get("canonical_category", ""),
            "our": o or None,
            "competitor": c or None,
            "winner": winner,
        })
    return rows


# ------------------------- VALUE FOR MONEY -------------------------
def build_value_for_money(entries: list):
    """entries: [{name, capability, annual_inr, is_ours}]. Adds relative efficiency index."""
    valid = [e for e in entries if e.get("annual_inr") and e.get("capability") is not None and e["annual_inr"] > 0]
    if valid:
        raw = {e["name"]: e["capability"] / e["annual_inr"] for e in valid}
        mx = max(raw.values()) or 1
        for e in entries:
            r = raw.get(e["name"])
            e["value_efficiency_index"] = round((r / mx) * 100) if r is not None else None
    else:
        for e in entries:
            e["value_efficiency_index"] = None
    return entries
