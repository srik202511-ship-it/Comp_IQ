"""Pre-computed Apples-to-Apples demo report (SaaS Observability vertical).

Includes 3 valid (apples-to-apples) competitors + 1 deliberately NON-COMPARABLE
CRM product, so users immediately see valid vs invalid comparison.
Built through the real engine for consistency.
"""
from ci_engine import assemble
from ci_engine.taxonomy import DISCLAIMER


def _f(cat, feat, avail, cap, ev, conf=85, term=None):
    return {"original_term": term or feat, "canonical_category": cat, "canonical_feature": feat,
            "availability": avail, "capability_score": cap, "evidence": ev, "confidence": conf}


def _dim(score, comparable="high", conf=85, ev=""):
    return {"score": score, "comparable": comparable, "confidence": conf, "evidence": ev}


OUR = {
    "classification": {
        "category": "Observability / APM", "subcategory": "Full-stack Monitoring",
        "target_customer": "Engineering & SRE teams", "customer_segment": "Mid-Market",
        "geography": "Global", "primary_use_case": "Incident response & monitoring",
        "secondary_use_cases": ["Kubernetes monitoring", "Log analytics"],
        "business_model": "SaaS subscription", "pricing_model": "Per-host",
        "pricing_tier": "Professional", "primary_buyer": "Engineering leadership",
        "key_value_proposition": "Predictable host-based pricing with a built-in AI copilot",
    },
    "competitive_dimensions": {
        "product_capability": _dim(67, conf=88, ev="Infra, APM, logs, AIOps and dashboards, but no RUM/Synthetic."),
        "price_value": _dim(88, conf=90, ev="$15/host flat, all-inclusive tier."),
        "customer_fit": _dim(78, conf=80, ev="Strong fit for cost-sensitive mid-market teams."),
        "ux": _dim(80, conf=75, ev="Fast auto-instrumentation and simple onboarding."),
        "ai": _dim(85, conf=82, ev="Built-in AI copilot for root-cause analysis."),
        "integration": _dim(72, conf=78, ev="Core integrations and open API."),
        "security": _dim(60, conf=70, ev="RBAC and audit logs; no dedicated security monitoring."),
    },
    "features": [
        _f("AI & Intelligence", "AI Assistant", "available", 4, "AI copilot surfaces root causes."),
        _f("AI & Intelligence", "Automated Insights", "available", 4, "AIOps anomaly detection.", term="AIOps / Anomaly Detection"),
        _f("Analytics", "Dashboard", "available", 4, "Custom dashboards."),
        _f("Analytics", "Advanced Analytics", "available", 3, "Log analytics."),
        _f("Integrations", "API", "available", 4, "Open API and auto-instrumentation."),
        _f("Automation", "Alerts", "available", 4, "Alerting on metrics and logs."),
        _f("Security", "RBAC", "available", 3, "Role-based access control."),
        _f("Security", "Audit Logs", "unknown", None, "Not documented in the source."),
    ],
    "pricing": {"price_type": "fixed", "price": 15, "currency": "USD", "billing_frequency": "monthly",
                "included_users": None, "tier": "Professional", "evidence": "$15 per host / month all-inclusive.",
                "confidence": 90, "label": "$15/host/mo"},
}

DATADOG = {
    "classification": {"category": "Observability / APM", "subcategory": "Full-stack Monitoring",
                       "target_customer": "Cloud engineering & security teams", "customer_segment": "Mid-Market to Enterprise",
                       "geography": "Global", "primary_use_case": "Monitoring & security",
                       "secondary_use_cases": ["RUM", "Cloud SIEM"], "business_model": "SaaS subscription",
                       "pricing_model": "Per-host + usage", "pricing_tier": "Professional",
                       "primary_buyer": "Engineering leadership", "key_value_proposition": "Broadest single-pane platform"},
    "comparability_match": {"category": 95, "subcategory": 90, "use_case": 92, "customer_segment": 85,
                            "geography": 100, "product_tier": 78, "business_model": 95, "primary_buyer": 88},
    "comparability_reasoning": "Same category, use case and buyer; both host-priced SaaS observability platforms.",
    "competitive_dimensions": {
        "product_capability": _dim(94, "high", 90, "700+ integrations, infra, APM, logs, RUM, security."),
        "price_value": _dim(60, "high", 85, "Usage-based pricing gets expensive at scale."),
        "customer_fit": _dim(82, "high", 82, "Strong across mid-market and enterprise."),
        "ux": _dim(85, "high", 80, "Polished unified UI."),
        "ai": _dim(88, "high", 82, "Watchdog anomaly detection + AI assist."),
        "integration": _dim(95, "high", 90, "700+ integrations."),
        "security": _dim(85, "high", 82, "Cloud SIEM and security monitoring."),
    },
    "features": [
        _f("AI & Intelligence", "AI Assistant", "available", 4, "Bits AI assistant."),
        _f("AI & Intelligence", "Automated Insights", "available", 5, "Watchdog anomaly detection."),
        _f("Analytics", "Dashboard", "available", 5, "Rich dashboards."),
        _f("Analytics", "Advanced Analytics", "available", 4, "Log analytics and metrics."),
        _f("Integrations", "API", "available", 5, "Extensive API + 700 integrations."),
        _f("Automation", "Alerts", "available", 5, "Advanced monitors and alerting."),
        _f("Security", "RBAC", "available", 4, "Granular RBAC."),
        _f("Security", "Audit Logs", "available", 4, "Audit trail available."),
    ],
    "pricing": {"price_type": "fixed", "price": 15, "currency": "USD", "billing_frequency": "monthly",
                "included_users": None, "tier": "Infrastructure Pro", "source_url": "https://www.datadoghq.com/pricing/",
                "evidence": "$15/host/mo Infrastructure Pro.", "confidence": 88, "label": "$15/host/mo"},
}

DYNATRACE = {
    "classification": {"category": "Observability / APM", "subcategory": "Full-stack Monitoring",
                       "target_customer": "Large enterprises", "customer_segment": "Enterprise",
                       "geography": "Global", "primary_use_case": "Enterprise observability & AIOps",
                       "secondary_use_cases": ["AppSec", "Digital experience"], "business_model": "SaaS subscription",
                       "pricing_model": "Consumption", "pricing_tier": "Enterprise",
                       "primary_buyer": "Platform engineering leadership", "key_value_proposition": "Deterministic Davis AI"},
    "comparability_match": {"category": 92, "subcategory": 85, "use_case": 88, "customer_segment": 68,
                            "geography": 100, "product_tier": 60, "business_model": 90, "primary_buyer": 80},
    "comparability_reasoning": "Same category and use case, but skews enterprise vs our mid-market focus (tier/segment partial).",
    "competitive_dimensions": {
        "product_capability": _dim(90, "high", 88, "Full-stack auto-instrumentation with OneAgent."),
        "price_value": _dim(55, "partial", 78, "Premium consumption pricing; tier differs from ours."),
        "customer_fit": _dim(80, "high", 80, "Best fit for complex enterprise estates."),
        "ux": _dim(78, "high", 75, "Powerful but steeper learning curve."),
        "ai": _dim(92, "high", 85, "Davis deterministic causation engine."),
        "integration": _dim(88, "high", 82, "Broad integrations + OneAgent."),
        "security": _dim(88, "high", 82, "Runtime application security."),
    },
    "features": [
        _f("AI & Intelligence", "AI Assistant", "available", 4, "Davis CoPilot."),
        _f("AI & Intelligence", "Automated Insights", "available", 5, "Davis causation AI."),
        _f("Analytics", "Dashboard", "available", 4, "Dashboards and notebooks."),
        _f("Analytics", "Advanced Analytics", "available", 4, "Grail analytics."),
        _f("Integrations", "API", "available", 4, "API + OneAgent."),
        _f("Automation", "Alerts", "available", 5, "Automatic problem detection."),
        _f("Security", "RBAC", "available", 4, "Enterprise RBAC."),
        _f("Security", "Audit Logs", "available", 4, "Audit logging."),
    ],
    "pricing": {"price_type": "fixed", "price": 69, "currency": "USD", "billing_frequency": "monthly",
                "included_users": None, "tier": "Full-stack", "source_url": "https://www.dynatrace.com/pricing/",
                "evidence": "~$69/mo per 8GiB host full-stack.", "confidence": 80, "label": "$69/8GiB host/mo"},
}

NEWRELIC = {
    "classification": {"category": "Observability / APM", "subcategory": "Full-stack Monitoring",
                       "target_customer": "Startups to mid-market", "customer_segment": "Mid-Market",
                       "geography": "Global", "primary_use_case": "Consolidated observability",
                       "secondary_use_cases": ["Browser", "Mobile"], "business_model": "SaaS subscription",
                       "pricing_model": "Usage + per-user", "pricing_tier": "Professional",
                       "primary_buyer": "Engineering leadership", "key_value_proposition": "Generous free tier"},
    "comparability_match": {"category": 90, "subcategory": 85, "use_case": 88, "customer_segment": 90,
                            "geography": 100, "product_tier": 80, "business_model": 82, "primary_buyer": 85},
    "comparability_reasoning": "Very close match: same category, mid-market focus and monitoring use case.",
    "competitive_dimensions": {
        "product_capability": _dim(80, "high", 82, "APM, infra, logs, browser, mobile."),
        "price_value": _dim(70, "high", 82, "Free 100GB/mo tier then usage-based."),
        "customer_fit": _dim(82, "high", 80, "Great for startups/mid-market."),
        "ux": _dim(80, "high", 76, "Simple onboarding."),
        "ai": _dim(74, "high", 75, "Applied intelligence anomaly detection."),
        "integration": _dim(85, "high", 80, "Broad integrations + API."),
        "security": _dim(70, "high", 72, "RBAC; lighter security suite."),
    },
    "features": [
        _f("AI & Intelligence", "AI Assistant", "available", 3, "New Relic AI."),
        _f("AI & Intelligence", "Automated Insights", "available", 4, "Applied intelligence."),
        _f("Analytics", "Dashboard", "available", 4, "Custom dashboards."),
        _f("Analytics", "Advanced Analytics", "available", 4, "NRQL analytics."),
        _f("Integrations", "API", "available", 4, "NerdGraph API."),
        _f("Automation", "Alerts", "available", 4, "Alerting and workflows."),
        _f("Security", "RBAC", "available", 3, "Role-based access."),
        _f("Security", "Audit Logs", "unknown", None, "Not clearly documented."),
    ],
    "pricing": {"price_type": "fixed", "price": 99, "currency": "USD", "billing_frequency": "monthly",
                "included_users": 1, "tier": "Full platform user", "source_url": "https://newrelic.com/pricing",
                "evidence": "$99/full-platform user/mo after free tier.", "confidence": 82, "label": "$99/user/mo"},
}

# --- Deliberately NON-COMPARABLE product (different category entirely) ---
HUBSPOT = {
    "classification": {"category": "CRM / Marketing", "subcategory": "Marketing Automation",
                       "target_customer": "Sales & marketing teams", "customer_segment": "SMB to Mid-Market",
                       "geography": "Global", "primary_use_case": "Customer relationship management",
                       "secondary_use_cases": ["Email marketing", "Sales pipeline"], "business_model": "SaaS subscription",
                       "pricing_model": "Per-seat", "pricing_tier": "Professional",
                       "primary_buyer": "Marketing / Sales leadership", "key_value_proposition": "All-in-one CRM & marketing"},
    "comparability_match": {"category": 8, "subcategory": 8, "use_case": 12, "customer_segment": 55,
                            "geography": 100, "product_tier": 55, "business_model": 75, "primary_buyer": 30},
    "comparability_reasoning": "HubSpot is a CRM/marketing platform, not an observability tool \u2014 fundamentally different category and use case.",
    "competitive_dimensions": {
        "product_capability": _dim(85, "high", 85, "Strong CRM/marketing suite (different domain)."),
        "price_value": _dim(70, "high", 80, "Per-seat pricing."),
        "customer_fit": _dim(60, "partial", 70, "Different buyer."),
        "ux": _dim(88, "high", 80, "Polished UX."),
        "ai": _dim(75, "high", 75, "AI content and insights."),
        "integration": _dim(90, "high", 82, "Large app marketplace."),
        "security": _dim(80, "high", 78, "SOC2, RBAC."),
    },
    "features": [
        _f("Core Product", "Core Capability 1", "available", 5, "CRM contact management."),
        _f("Automation", "Workflow Automation", "available", 5, "Marketing automation."),
        _f("Integrations", "CRM", "available", 5, "Native CRM."),
        _f("Integrations", "API", "available", 4, "Open API."),
        _f("Security", "SSO", "available", 4, "SSO available."),
    ],
    "pricing": {"price_type": "fixed", "price": 90, "currency": "USD", "billing_frequency": "monthly",
                "included_users": 1, "tier": "Professional", "source_url": "https://www.hubspot.com/pricing",
                "evidence": "~$90/seat/mo Professional.", "confidence": 75, "label": "$90/seat/mo"},
}

EXTRACTIONS = {
    "Datadog": DATADOG, "Dynatrace": DYNATRACE, "New Relic": NEWRELIC, "HubSpot": HUBSPOT,
}

DEMO_INSIGHTS_CI = {
    "executive_summary": (
        "Against fairly comparable observability platforms, NimbusIQ scores mid-pack on competitive "
        "strength: it wins decisively on price/value (88 vs Datadog 60) but trails on product capability "
        "(67 vs Datadog 94, Dynatrace 90). HubSpot was correctly flagged NOT COMPARABLE \u2014 a CRM is not an "
        "apples-to-apples observability benchmark."
    ),
    "defend": [
        {"point": "Lead with predictable pricing", "evidence": "Price/Value 88 vs Datadog 60 and Dynatrace 55."},
        {"point": "Keep the built-in AI copilot front and centre", "evidence": "AI 85, close to Datadog 88 at a fraction of the cost."},
    ],
    "close_the_gap": [
        {"point": "Add RUM & Synthetic to lift product capability", "evidence": "Product Capability 67 vs Datadog 94 / Dynatrace 90."},
        {"point": "Strengthen security monitoring", "evidence": "Security 60 vs Datadog 85 / Dynatrace 88."},
    ],
    "differentiate": [
        {"point": "Own the cost-predictability narrative for mid-market", "evidence": "Highest value-efficiency index in the comparable set."},
    ],
    "investigate": [
        {"point": "Verify audit-logging coverage", "evidence": "Audit Logs marked UNKNOWN for NimbusIQ (no evidence in source)."},
    ],
}


def build_demo_report(company_doc, competitor_docs):
    our_block = assemble.build_our_block(company_doc, OUR)
    blocks = []
    for doc in competitor_docs:
        ext = EXTRACTIONS.get(doc.get("company_name"))
        if not ext:
            continue
        blocks.append(assemble.build_competitor_block(our_block, doc, ext, mode="normal"))
    report = assemble.assemble_report(our_block, blocks, mode="normal")
    report["insights"] = DEMO_INSIGHTS_CI
    report["is_demo"] = True
    report["disclaimer"] = DISCLAIMER
    report["errors"] = []
    return report
