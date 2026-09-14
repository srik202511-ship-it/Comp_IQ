"""LLM prompt builders for extraction / classification / feature-mapping / insights.

These return (system, prompt) strings. The caller runs them through ai_json().
The LLM assists with classification + per-dimension similarity + feature mapping
with EVIDENCE, but the final numeric scores are computed deterministically in engine.py.
"""
import json
from .taxonomy import flat_taxonomy

_TAXO = flat_taxonomy()

_EVIDENCE_RULES = (
    "CRITICAL RULES: (1) Extract facts ONLY from the provided text. NEVER fabricate. "
    "(2) If a feature/fact is not present in the text, set availability='unknown' and "
    "capability_score=null — do NOT mark it 'not_available' or 0 just because it is missing. "
    "(3) For pricing that says 'contact sales' set price_type='custom' and DO NOT invent a number. "
    "(4) Every capability_score MUST be backed by evidence text quoted from the source. "
    "Respond with valid minified JSON only, no markdown."
)


def our_profile_system():
    return ("You are a competitive-intelligence analyst building a structured profile of "
            "a company's OWN product for benchmarking. " + _EVIDENCE_RULES)


def our_profile_prompt(company: dict) -> str:
    return f"""Build a structured CI profile for OUR OWN product from the profile data below.

OUR PROFILE DATA:
{json.dumps({k: company.get(k) for k in [
    'company_name','product_name','industry','category','product_description',
    'target_customers','value_proposition','differentiators','use_cases',
    'features','pricing','website','competitive_goals']}, default=str)[:6000]}

CANONICAL FEATURE TAXONOMY (map to these where relevant): {json.dumps(_TAXO)}

Return JSON EXACTLY:
{{
 "classification": {{"category":"","subcategory":"","target_customer":"","customer_segment":"SMB|Mid-Market|Enterprise|Consumer","geography":"","primary_use_case":"","secondary_use_cases":[],"business_model":"","pricing_model":"","pricing_tier":"Starter|Professional|Business|Enterprise","primary_buyer":"","key_value_proposition":""}},
 "competitive_dimensions": {{"product_capability":{{"score":0-100,"confidence":0-100,"evidence":""}},"price_value":{{"score":0-100,"confidence":0-100,"evidence":""}},"customer_fit":{{"score":0-100,"confidence":0-100,"evidence":""}},"ux":{{"score":0-100,"confidence":0-100,"evidence":""}},"ai":{{"score":0-100,"confidence":0-100,"evidence":""}},"integration":{{"score":0-100,"confidence":0-100,"evidence":""}},"security":{{"score":0-100,"confidence":0-100,"evidence":""}}}},
 "features": [{{"original_term":"","canonical_category":"","canonical_feature":"","availability":"available|unknown|not_available","capability_score":0-5,"evidence":"","confidence":0-100}}],
 "pricing": {{"price_type":"fixed|free|custom|estimated|unknown","price":number_or_null,"currency":"USD","billing_frequency":"monthly|annual|one_time","included_users":number_or_null,"tier":"","evidence":"","confidence":0-100}}
}}"""


def competitor_system():
    return ("You are a competitive-intelligence analyst comparing a COMPETITOR to OUR product. "
            "You output canonical classification, per-dimension COMPARABILITY match scores "
            "(how similar the competitor is to us on each axis, 0-100), competitive performance "
            "scores, canonical features and pricing. " + _EVIDENCE_RULES)


def competitor_prompt(our_classification: dict, competitor: dict, scraped_text: str) -> str:
    return f"""Analyze this COMPETITOR against OUR product for an apples-to-apples benchmark.

OUR PRODUCT CLASSIFICATION (comparison baseline):
{json.dumps(our_classification, default=str)[:2500]}

COMPETITOR: {competitor.get('company_name')} | site: {competitor.get('website')}
SCRAPED COMPETITOR TEXT (source of truth, do not invent beyond this):
\"\"\"{(scraped_text or '')[:8000]}\"\"\"

CANONICAL FEATURE TAXONOMY: {json.dumps(_TAXO)}

Return JSON EXACTLY:
{{
 "classification": {{"category":"","subcategory":"","target_customer":"","customer_segment":"","geography":"","primary_use_case":"","secondary_use_cases":[],"business_model":"","pricing_model":"","pricing_tier":"","primary_buyer":"","key_value_proposition":""}},
 "comparability_match": {{"category":0-100,"subcategory":0-100,"use_case":0-100,"customer_segment":0-100,"geography":0-100,"product_tier":0-100,"business_model":0-100,"primary_buyer":0-100}},
 "comparability_reasoning": "1-2 sentences on why this comparison is fair or limited",
 "competitive_dimensions": {{"product_capability":{{"score":0-100_or_null,"comparable":"high|partial|none","confidence":0-100,"evidence":""}},"price_value":{{"score":0-100_or_null,"comparable":"high|partial|none","confidence":0-100,"evidence":""}},"customer_fit":{{"score":0-100_or_null,"comparable":"high|partial|none","confidence":0-100,"evidence":""}},"ux":{{"score":0-100_or_null,"comparable":"high|partial|none","confidence":0-100,"evidence":""}},"ai":{{"score":0-100_or_null,"comparable":"high|partial|none","confidence":0-100,"evidence":""}},"integration":{{"score":0-100_or_null,"comparable":"high|partial|none","confidence":0-100,"evidence":""}},"security":{{"score":0-100_or_null,"comparable":"high|partial|none","confidence":0-100,"evidence":""}}}},
 "features": [{{"original_term":"","canonical_category":"","canonical_feature":"","availability":"available|unknown|not_available","capability_score":0-5_or_null,"evidence":"","source_url":"{competitor.get('website','')}","confidence":0-100}}],
 "pricing": {{"price_type":"fixed|free|custom|estimated|unknown","price":number_or_null,"currency":"USD","billing_frequency":"monthly|annual|one_time","included_users":number_or_null,"tier":"","source_url":"{competitor.get('website','')}","evidence":"","confidence":0-100}}
}}
For comparability_match: 100=identical, 0=completely different. Judge category, use case, customer segment, geography, pricing tier honestly. If the competitor is a totally different kind of product, give low category/subcategory/use_case scores."""


def insights_system():
    return ("You are a senior competitive strategy advisor. Reason ONLY from the provided "
            "computed comparison data and cite specific numbers. Avoid generic advice. "
            "Respond with valid minified JSON only, no markdown.")


def insights_prompt(report_summary: dict) -> str:
    our_name = (report_summary.get("our_product") or {}).get("name") or "our product"
    return f"""Given this computed competitive analysis, write strategic insights.

OUR PRODUCT NAME: "{our_name}"

DATA (computed scores, gaps, pricing):
{json.dumps(report_summary, default=str)[:8000]}

Return JSON EXACTLY:
{{
 "executive_summary": "2-4 sentences citing specific scores",
 "defend": [{{"point":"","evidence":""}}],
 "close_the_gap": [{{"point":"","evidence":""}}],
 "differentiate": [{{"point":"","evidence":""}}],
 "investigate": [{{"point":"","evidence":""}}]
}}
Max 3 items per list. Always refer to our own product by its name "{our_name}" (for example, "{our_name} holds a strong position...") \u2014 NEVER write the generic phrase "Our Product". Every point MUST reference a specific competitor name, score, price or feature from the data."""
