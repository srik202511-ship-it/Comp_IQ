"""Static constants: canonical feature taxonomy, scoring weights, thresholds, FX fallback."""

# ---------------- Comparability weights (sum = 1.00) ----------------
COMPARABILITY_WEIGHTS = {
    "category": 0.20,
    "subcategory": 0.10,
    "use_case": 0.20,
    "customer_segment": 0.15,
    "geography": 0.10,
    "product_tier": 0.15,
    "business_model": 0.05,
    "primary_buyer": 0.05,
}

COMPARABILITY_DIMENSION_LABELS = {
    "category": "Category",
    "subcategory": "Subcategory",
    "use_case": "Primary Use Case",
    "customer_segment": "Customer Segment",
    "geography": "Geography",
    "product_tier": "Product Tier",
    "business_model": "Business Model",
    "primary_buyer": "Primary Buyer",
}

# Mandatory rejection: if any of these match scores fall below the floor,
# the products are NOT comparable regardless of the weighted total.
REJECTION_DIMENSIONS = ["category", "subcategory", "use_case"]
REJECTION_FLOOR = 40

# Comparability status thresholds
COMPARABILITY_HIGH = 80   # >= 80 highly comparable
COMPARABILITY_PARTIAL = 60  # 60-79 partial ; < 60 low / not comparable

# ---------------- Competitive weights (sum = 1.00) ----------------
# NOTE: comparability is deliberately NOT one of these dimensions.
COMPETITIVE_WEIGHTS = {
    "product_capability": 0.35,
    "price_value": 0.20,
    "customer_fit": 0.15,
    "ux": 0.10,
    "ai": 0.10,
    "integration": 0.05,
    "security": 0.05,
}

COMPETITIVE_DIMENSION_LABELS = {
    "product_capability": "Product Capability",
    "price_value": "Price / Value",
    "customer_fit": "Customer Fit",
    "ux": "UX / Experience",
    "ai": "AI Capability",
    "integration": "Integration",
    "security": "Security",
}

# Competitive strength banding (for status label only, not a gate)
COMPETITIVE_STRONG = 75
COMPETITIVE_MODERATE = 50

# ---------------- Feature capability scale ----------------
# 0 Not available | 1 Basic | 2 Limited | 3 Standard | 4 Advanced | 5 Differentiated
CAPABILITY_MAX = 5

# ---------------- Canonical feature taxonomy (extensible) ----------------
CANONICAL_TAXONOMY = {
    "AI & Intelligence": [
        "AI Assistant", "Generative AI", "AI Recommendations",
        "Predictive Analytics", "Automated Insights", "Natural Language Query",
    ],
    "Core Product": [
        "Core Capability 1", "Core Capability 2", "Core Capability 3",
    ],
    "Analytics": [
        "Dashboard", "Advanced Analytics", "Custom Reports",
        "Benchmarking", "Data Visualization",
    ],
    "Integrations": [
        "API", "CRM", "ERP", "Collaboration Tools", "Data Import", "Data Export",
    ],
    "Security": [
        "SSO", "RBAC", "Encryption", "Audit Logs", "Compliance",
    ],
    "Administration": [
        "User Management", "Role Management", "Permissions", "Workspace Management",
    ],
    "Automation": [
        "Workflow Automation", "Alerts", "Scheduled Reports", "Automated Data Collection",
    ],
}

# Flat list of "category :: feature" for prompts
def flat_taxonomy():
    out = []
    for cat, feats in CANONICAL_TAXONOMY.items():
        for f in feats:
            out.append({"category": cat, "feature": f})
    return out

# ---------------- 2x2 matrix thresholds & quadrant labels ----------------
MATRIX_COMPARABILITY_HIGH = 60   # x-axis split
MATRIX_COMPETITIVE_HIGH = 70     # y-axis split

QUADRANTS = {
    (True, True): "STRONG_DIRECT",       # high comparability + high competitive
    (True, False): "RELEVANT_WEAKER",    # high comparability + low competitive
    (False, True): "STRONG_INDIRECT",    # low comparability + high competitive
    (False, False): "LOW_PRIORITY",      # low comparability + low competitive
}

QUADRANT_LABELS = {
    "STRONG_DIRECT": "Strong Direct Competitor",
    "RELEVANT_WEAKER": "Relevant but Weaker Competitor",
    "STRONG_INDIRECT": "Strong Indirect Competitor",
    "LOW_PRIORITY": "Low-Priority Competitor",
}

# ---------------- FX fallback (approx units of currency -> 1 unit = X INR) ----------------
# Used only when the live FX API is unavailable. Values are approximate.
FX_FALLBACK_TO_INR = {
    "INR": 1.0,
    "USD": 83.0,
    "EUR": 90.0,
    "GBP": 105.0,
    "AUD": 55.0,
    "CAD": 61.0,
    "SGD": 62.0,
    "AED": 22.6,
    "JPY": 0.56,
    "CHF": 94.0,
}

DEFAULT_NORMALIZED_CURRENCY = "INR"

DISCLAIMER = (
    "This tool is developed strictly for educational, research, and personal data "
    "portability purposes. The authors do not encourage, condone, or facilitate "
    "unauthorized data extraction or any activities that violate the terms of service "
    "of third-party platforms. Competitive intelligence results are generated from "
    "publicly available information and may contain incomplete, estimated, or outdated "
    "information. Users should independently verify critical business decisions."
)
