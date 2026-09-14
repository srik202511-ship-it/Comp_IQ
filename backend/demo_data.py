"""Pre-computed demo dataset (SaaS Observability vertical) for instant dashboard population."""
from datetime import datetime, timezone


def _now():
    return datetime.now(timezone.utc).isoformat()


DEMO_COMPANY = {
    "company_name": "NimbusIQ",
    "industry": "SaaS",
    "website": "https://www.nimbusiq.example",
    "description": "Cloud observability and AIOps platform that unifies metrics, logs and traces with AI-driven anomaly detection for engineering teams.",
    "product_name": "NimbusIQ Observability Cloud",
    "product_url": "https://www.nimbusiq.example/product",
    "category": "Observability / APM",
    "product_description": "Full-stack monitoring with infrastructure metrics, distributed tracing, log analytics and an AI copilot that surfaces root causes automatically.",
    "target_customers": "Mid-market and enterprise engineering, SRE and DevOps teams running cloud-native workloads.",
    "value_proposition": "Faster incident resolution at a predictable, host-based price without per-seat lock-in.",
    "differentiators": [
        "Predictable host-based pricing (no surprise data-ingest bills)",
        "Built-in AI copilot for root-cause analysis",
        "Fast time-to-value with auto-instrumentation",
    ],
    "use_cases": ["Incident response", "Kubernetes monitoring", "Cost-aware log analytics"],
    "features": [
        "Infrastructure Monitoring", "APM / Distributed Tracing", "Log Management",
        "AIOps / Anomaly Detection", "Kubernetes Monitoring", "Custom Dashboards",
        "Alerting", "AI Assistant / Copilot",
    ],
    "pricing": "$15 per host / month (all-inclusive tier)",
    "competitive_goals": "Win mid-market accounts frustrated by unpredictable observability bills and close the RUM/Synthetic feature gap.",
}


def _analysis(desc, products, target, vals, price, model, tiers, conf, features, scores, ks, kw, url):
    return {
        "description": desc,
        "products": products,
        "target_customers": target,
        "value_props": vals,
        "pricing": {"starting_price": price, "model": model, "tiers": tiers,
                    "confidence": conf, "source": url, "available": price != "Not publicly available"},
        "features": [{"name": f[0], "category": f[1], "supported": f[2]} for f in features],
        "scores": scores,
        "key_strength": ks,
        "key_weakness": kw,
        "confidence": conf,
        "source_url": url,
        "collected_at": _now(),
    }


_FEATS = ["Infrastructure Monitoring", "APM / Distributed Tracing", "Log Management",
          "Real User Monitoring", "Synthetic Monitoring", "AIOps / Anomaly Detection",
          "Kubernetes Monitoring", "Custom Dashboards", "Alerting", "SLO Management",
          "AI Assistant / Copilot", "Security Monitoring"]


def _f(name, cat, ok):
    return (name, cat, ok)


DEMO_COMPETITORS = [
    {
        "company_name": "Datadog",
        "industry": "SaaS",
        "website": "https://www.datadoghq.com",
        "product_name": "Datadog Platform",
        "product_category": "Observability / APM",
        "target_market": "Mid-market to large enterprise cloud teams",
        "notes": "Market leader, broadest module catalog.",
        "status": "Analyzed",
        "is_demo": True,
        "analysis": _analysis(
            "Leading cloud monitoring and security platform spanning infrastructure, APM, logs, RUM and security in one SaaS product.",
            ["Infrastructure", "APM", "Log Management", "RUM", "Cloud SIEM"],
            "Cloud-native engineering and security teams at scale.",
            ["Single pane of glass across 700+ integrations", "Deep APM and RUM", "Strong security suite"],
            "$15 per host / month (Infra Pro)", "Per-host + usage-based (log ingest, indexed spans)",
            [{"name": "Infrastructure Pro", "price": "$15/host/mo"},
             {"name": "APM & Continuous Profiler", "price": "$31/host/mo"},
             {"name": "Log Management", "price": "$0.10/GB ingest + indexing"}],
            "High",
            [_f("Infrastructure Monitoring", "Monitoring", True), _f("APM / Distributed Tracing", "APM", True),
             _f("Log Management", "Logs", True), _f("Real User Monitoring", "Frontend", True),
             _f("Synthetic Monitoring", "Frontend", True), _f("AIOps / Anomaly Detection", "AI", True),
             _f("Kubernetes Monitoring", "Cloud", True), _f("Custom Dashboards", "Visualization", True),
             _f("Alerting", "Ops", True), _f("SLO Management", "Reliability", True),
             _f("AI Assistant / Copilot", "AI", True), _f("Security Monitoring", "Security", True)],
            {"overall": 88, "price_competitiveness": 5.5, "feature_strength": 94,
             "value_prop": 8.5, "market_position": 1, "innovation": 8.8},
            "Broadest end-to-end platform with best-in-class integrations and security.",
            "Usage-based pricing becomes expensive and unpredictable at high log/trace volumes.",
            "https://www.datadoghq.com/pricing/",
        ),
    },
    {
        "company_name": "Dynatrace",
        "industry": "SaaS",
        "website": "https://www.dynatrace.com",
        "product_name": "Dynatrace Platform",
        "product_category": "Observability / APM",
        "target_market": "Large enterprises with complex hybrid estates",
        "notes": "Strongest automation and AI engine (Davis).",
        "status": "Analyzed",
        "is_demo": True,
        "analysis": _analysis(
            "Enterprise observability platform with the Davis AI causation engine and automatic full-stack instrumentation.",
            ["Full-stack Monitoring", "APM", "Digital Experience", "AIOps", "AppSec"],
            "Large enterprises modernizing complex hybrid and multi-cloud estates.",
            ["Deterministic AI root-cause (Davis)", "OneAgent auto-instrumentation", "Runtime app security"],
            "$69 per month per 8 GiB host (Full-stack)", "Per-host-hour and per-GiB consumption",
            [{"name": "Full-stack Monitoring", "price": "$0.08/host-hour"},
             {"name": "Infrastructure Monitoring", "price": "$0.04/host-hour"},
             {"name": "Log Management", "price": "$0.20/GiB ingest"}],
            "High",
            [_f("Infrastructure Monitoring", "Monitoring", True), _f("APM / Distributed Tracing", "APM", True),
             _f("Log Management", "Logs", True), _f("Real User Monitoring", "Frontend", True),
             _f("Synthetic Monitoring", "Frontend", True), _f("AIOps / Anomaly Detection", "AI", True),
             _f("Kubernetes Monitoring", "Cloud", True), _f("Custom Dashboards", "Visualization", True),
             _f("Alerting", "Ops", True), _f("SLO Management", "Reliability", True),
             _f("AI Assistant / Copilot", "AI", True), _f("Security Monitoring", "Security", True)],
            {"overall": 84, "price_competitiveness": 5.0, "feature_strength": 90,
             "value_prop": 8.0, "market_position": 2, "innovation": 9.0},
            "Deterministic Davis AI delivers precise root-cause automation unmatched by peers.",
            "Premium pricing and steeper learning curve; overkill for smaller teams.",
            "https://www.dynatrace.com/pricing/",
        ),
    },
    {
        "company_name": "New Relic",
        "industry": "SaaS",
        "website": "https://newrelic.com",
        "product_name": "New Relic Platform",
        "product_category": "Observability / APM",
        "target_market": "Startups to mid-market engineering teams",
        "notes": "Usage (data GB + users) pricing with generous free tier.",
        "status": "Analyzed",
        "is_demo": True,
        "analysis": _analysis(
            "Consolidated observability platform priced on data ingest plus users, with a large perpetual free tier.",
            ["APM", "Infrastructure", "Logs", "Browser", "Mobile"],
            "Startups and mid-market teams wanting all telemetry in one consumption-priced platform.",
            ["100 GB/month free ingest", "Single consumption-based platform", "Simple onboarding"],
            "Free tier, then $0.35/GB ingested", "Data ingest (GB) + per full-platform user",
            [{"name": "Free", "price": "$0 (100 GB/mo)"},
             {"name": "Data ingest", "price": "$0.35/GB"},
             {"name": "Full platform user", "price": "$99/user/mo"}],
            "High",
            [_f("Infrastructure Monitoring", "Monitoring", True), _f("APM / Distributed Tracing", "APM", True),
             _f("Log Management", "Logs", True), _f("Real User Monitoring", "Frontend", True),
             _f("Synthetic Monitoring", "Frontend", True), _f("AIOps / Anomaly Detection", "AI", True),
             _f("Kubernetes Monitoring", "Cloud", True), _f("Custom Dashboards", "Visualization", True),
             _f("Alerting", "Ops", True), _f("SLO Management", "Reliability", False),
             _f("AI Assistant / Copilot", "AI", True), _f("Security Monitoring", "Security", False)],
            {"overall": 76, "price_competitiveness": 7.0, "feature_strength": 80,
             "value_prop": 7.2, "market_position": 4, "innovation": 7.4},
            "Generous free tier and simple consumption pricing lower the barrier to entry.",
            "Per-user full-platform pricing can spike, and SLO/security depth trails leaders.",
            "https://newrelic.com/pricing",
        ),
    },
    {
        "company_name": "HubSpot",
        "industry": "SaaS",
        "website": "https://www.hubspot.com",
        "product_name": "HubSpot CRM",
        "product_category": "CRM / Marketing",
        "target_market": "SMB and mid-market sales & marketing teams",
        "notes": "Included to demonstrate a NON-COMPARABLE product (different category).",
        "status": "Analyzed",
        "is_demo": True,
        "analysis": _analysis(
            "All-in-one CRM, marketing automation and sales platform for growing businesses.",
            ["CRM", "Marketing Hub", "Sales Hub", "Service Hub"],
            "SMB and mid-market sales, marketing and service teams.",
            ["All-in-one customer platform", "Large app marketplace", "Ease of use"],
            "$90 per seat / month (Professional)", "Per-seat subscription",
            [{"name": "Starter", "price": "$20/seat/mo"},
             {"name": "Professional", "price": "$90/seat/mo"},
             {"name": "Enterprise", "price": "Custom"}],
            "Medium",
            [_f("CRM", "Sales", True), _f("Marketing Automation", "Marketing", True),
             _f("Email Marketing", "Marketing", True), _f("Sales Pipeline", "Sales", True),
             _f("Custom Dashboards", "Visualization", True), _f("API", "Integrations", True)],
            {"overall": 82, "price_competitiveness": 6.5, "feature_strength": 85,
             "value_prop": 8.0, "market_position": 1, "innovation": 7.8},
            "Dominant all-in-one CRM and marketing suite with a huge ecosystem.",
            "Not an observability product \u2014 a different category entirely.",
            "https://www.hubspot.com/pricing",
        ),
    },
]


def demo_company_scores():
    return {"overall": 78, "price_competitiveness": 8.2, "feature_strength": 67,
            "value_prop": 7.5, "market_position": 3, "innovation": 8.0}


DEMO_INSIGHTS = {
    "is_demo": True,
    "generated_at": _now(),
    "executive_summary": {
        "position": "Moderate",
        "biggest_advantage": "Predictable host-based pricing and a strong built-in AI copilot at a materially lower cost than Datadog and Dynatrace.",
        "biggest_weakness": "Missing Real User Monitoring, Synthetic Monitoring, SLO Management and Security Monitoring that all three competitors offer.",
        "biggest_threat": "Datadog — the broadest platform and default enterprise choice with 94% feature coverage.",
        "biggest_opportunity": "Close the RUM + Synthetic gap to become a credible full-stack alternative for cost-sensitive mid-market teams.",
        "narrative": "NimbusIQ wins on price predictability and AI-assisted incident response, but a real feature gap (front-end and reliability tooling) keeps it out of enterprise shortlists. Prioritising RUM/Synthetic and SLO management would convert its pricing advantage into competitive wins against Datadog and Dynatrace.",
    },
    "feature_matrix": {
        "features": [
            {"name": f, "category": "", "Our Product": ours, "Datadog": True, "Dynatrace": True, "New Relic": nr}
            for f, ours, nr in [
                ("Infrastructure Monitoring", True, True), ("APM / Distributed Tracing", True, True),
                ("Log Management", True, True), ("Real User Monitoring", False, True),
                ("Synthetic Monitoring", False, True), ("AIOps / Anomaly Detection", True, True),
                ("Kubernetes Monitoring", True, True), ("Custom Dashboards", True, True),
                ("Alerting", True, True), ("SLO Management", False, False),
                ("AI Assistant / Copilot", True, True), ("Security Monitoring", False, False),
            ]
        ],
        "feature_scores": {"Our Product": 67, "Datadog": 100, "Dynatrace": 100, "New Relic": 83},
    },
    "pricing_comparison": [
        {"company": "Our Product", "starting_price": "$15/host/mo", "numeric": 15, "relative_position": "Low", "is_ours": True},
        {"company": "Datadog", "starting_price": "$15/host/mo", "numeric": 15, "relative_position": "Low", "is_ours": False},
        {"company": "Dynatrace", "starting_price": "$69/8GiB host/mo", "numeric": 69, "relative_position": "Higher", "is_ours": False},
        {"company": "New Relic", "starting_price": "$99/user/mo", "numeric": 99, "relative_position": "Higher", "is_ours": False},
    ],
    "radar": {
        "dimensions": ["Pricing", "Features", "Brand Power", "Innovation", "Customer Support", "Market Velocity"],
        "series": [
            {"name": "Our Product", "values": [82, 67, 45, 80, 70, 60]},
            {"name": "Datadog", "values": [55, 94, 95, 88, 85, 90]},
            {"name": "Dynatrace", "values": [50, 90, 82, 90, 80, 78]},
            {"name": "New Relic", "values": [70, 80, 70, 74, 72, 65]},
        ],
    },
    "positioning": [
        {"company": "Our Product", "x": 8.2, "y": 67, "is_ours": True},
        {"company": "Datadog", "x": 5.5, "y": 94, "is_ours": False},
        {"company": "Dynatrace", "x": 5.0, "y": 90, "is_ours": False},
        {"company": "New Relic", "x": 7.0, "y": 80, "is_ours": False},
    ],
    "comparison_table": [
        {"company": "Our Product", "overall": 78, "price": "$15/host/mo", "feature_score": 67, "innovation": 8.0,
         "value_prop": 7.5, "key_strength": "Predictable pricing + AI copilot", "key_weakness": "No RUM/Synthetic/SLO", "is_ours": True},
        {"company": "Datadog", "overall": 88, "price": "$15/host/mo", "feature_score": 100, "innovation": 8.8,
         "value_prop": 8.5, "key_strength": "Broadest platform", "key_weakness": "Unpredictable usage bills", "is_ours": False},
        {"company": "Dynatrace", "overall": 84, "price": "$69/8GiB/mo", "feature_score": 100, "innovation": 9.0,
         "value_prop": 8.0, "key_strength": "Davis causation AI", "key_weakness": "Premium price, steep learning", "is_ours": False},
        {"company": "New Relic", "overall": 76, "price": "$99/user/mo", "feature_score": 83, "innovation": 7.4,
         "value_prop": 7.2, "key_strength": "Free tier, simple pricing", "key_weakness": "Per-user spikes; no SLO/security", "is_ours": False},
    ],
    "swot": {
        "strengths": [
            {"text": "Lowest predictable entry price in the set", "evidence": "$15/host flat vs Dynatrace $69 and New Relic $99/user."},
            {"text": "AI copilot included in base tier", "evidence": "AI Assistant supported like all three competitors, but bundled without add-on cost."},
        ],
        "weaknesses": [
            {"text": "No Real User Monitoring or Synthetic Monitoring", "evidence": "All 3 competitors offer both; NimbusIQ offers neither."},
            {"text": "No SLO Management or Security Monitoring", "evidence": "Datadog and Dynatrace both provide SLO + security modules."},
        ],
        "opportunities": [
            {"text": "Capture cost-sensitive mid-market", "evidence": "Datadog and New Relic bills grow unpredictably with volume/users."},
            {"text": "Bundle front-end monitoring", "evidence": "RUM+Synthetic gap is the top reason NimbusIQ loses full-stack deals."},
        ],
        "threats": [
            {"text": "Datadog default-choice momentum", "evidence": "94% feature coverage and #1 market position."},
            {"text": "Dynatrace AI leadership", "evidence": "Davis causation engine scores 9.0 innovation vs our 8.0."},
        ],
    },
    "insights": {
        "weaker": [
            {"issue": "Missing Real User & Synthetic Monitoring", "evidence": "3 of 3 competitors ship both; NimbusIQ ships neither.", "impact": "Excluded from full-stack front-end evaluations."},
            {"issue": "No SLO Management", "evidence": "Datadog and Dynatrace offer SLO tracking; New Relic and NimbusIQ do not.", "impact": "Loses SRE-led reliability deals."},
            {"issue": "Lower feature breadth", "evidence": "Feature score 67 vs Datadog/Dynatrace 100.", "impact": "Perceived as point tool, not platform."},
        ],
        "competitors_better": [
            {"competitor": "Datadog", "advantage": "Complete platform + security", "evidence": "12/12 features incl. RUM, Synthetic, SLO, Security.", "impact": "High"},
            {"competitor": "Dynatrace", "advantage": "Deterministic root-cause AI", "evidence": "Innovation 9.0 with Davis engine + auto-instrumentation.", "impact": "High"},
            {"competitor": "New Relic", "advantage": "Free tier acquisition", "evidence": "100 GB/mo free ingest lowers trial friction.", "impact": "Medium"},
        ],
        "opportunities": [
            {"opportunity": "Ship Real User + Synthetic Monitoring", "why": "Only missing front-end capabilities keep NimbusIQ out of full-stack shortlists.", "evidence": "3/3 competitors offer both.", "impact": "High", "priority": "P0"},
            {"opportunity": "Add SLO Management", "why": "Reliability/SRE buyers require SLOs; 2 leaders have it.", "evidence": "Datadog + Dynatrace ship SLO tooling.", "impact": "High", "priority": "P1"},
            {"opportunity": "Lead with pricing-predictability messaging", "why": "Competitors' usage/user pricing is their weakest point.", "evidence": "Datadog & New Relic bills spike with scale.", "impact": "Medium", "priority": "P1"},
        ],
    },
    "recommended_actions": [
        {"id": "act-1", "priority": "P0", "action": "Ship Real User & Synthetic Monitoring", "reason": "Only capability gap vs all 3 competitors", "impact": "High", "status": "Not Started"},
        {"id": "act-2", "priority": "P1", "action": "Add SLO Management module", "reason": "Required by SRE buyers; 2 leaders have it", "impact": "High", "status": "Not Started"},
        {"id": "act-3", "priority": "P1", "action": "Launch 'predictable pricing' campaign", "reason": "Datadog & New Relic bills are unpredictable", "impact": "Medium", "status": "Not Started"},
        {"id": "act-4", "priority": "P2", "action": "Add lightweight Security Monitoring", "reason": "Close gap with Datadog/Dynatrace suites", "impact": "Medium", "status": "Not Started"},
    ],
}
