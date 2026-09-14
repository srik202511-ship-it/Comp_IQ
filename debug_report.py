"""Debug script to inspect the CI report structure."""
import os
import json
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://app-docs-10.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@competeiq.ai"
DEMO_PASSWORD = "demo1234"

# Login
r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}, timeout=30)
token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Get analysis
r = requests.get(f"{API}/analysis", headers=headers, timeout=30)
report = r.json()

print("="*80)
print("REPORT STRUCTURE")
print("="*80)
print(f"\nTop-level keys: {list(report.keys())}")

if "our_product" in report:
    print(f"\nour_product keys: {list(report['our_product'].keys())}")
    if "competitive_score" in report["our_product"]:
        print(f"our_product.competitive_score keys: {list(report['our_product']['competitive_score'].keys())}")
        if "dimensions" in report["our_product"]["competitive_score"]:
            print(f"our_product.competitive_score.dimensions keys: {list(report['our_product']['competitive_score']['dimensions'].keys())}")

if "competitors" in report:
    print(f"\nNumber of competitors: {len(report['competitors'])}")
    for i, comp in enumerate(report['competitors']):
        print(f"\nCompetitor {i+1}:")
        print(f"  Keys: {list(comp.keys())}")
        print(f"  company_name: {comp.get('company_name', 'MISSING')}")
        print(f"  name: {comp.get('name', 'MISSING')}")
        if "comparability" in comp:
            print(f"  comparability.is_comparable: {comp['comparability'].get('is_comparable')}")
            print(f"  comparability.score: {comp['comparability'].get('score')}")
        if "competitive_score" in comp:
            if comp["competitive_score"] is not None:
                print(f"  competitive_score.score: {comp['competitive_score'].get('score')}")
            else:
                print(f"  competitive_score: null")
        if "competitive_not_calculated_reason" in comp:
            print(f"  competitive_not_calculated_reason: {comp['competitive_not_calculated_reason'][:80]}")

# Get competitors list
print("\n" + "="*80)
print("COMPETITORS LIST")
print("="*80)
r = requests.get(f"{API}/competitors", headers=headers, timeout=30)
competitors_list = r.json()
print(f"\nNumber of competitors: {len(competitors_list)}")
for i, comp in enumerate(competitors_list):
    print(f"\nCompetitor {i+1}:")
    print(f"  id: {comp.get('id')}")
    print(f"  company_name: {comp.get('company_name')}")
    print(f"  website: {comp.get('website')}")

# Try live run with first competitor
print("\n" + "="*80)
print("LIVE RUN TEST")
print("="*80)
if competitors_list:
    first_comp = competitors_list[0]
    print(f"\nRunning analysis for: {first_comp.get('company_name')} (id: {first_comp.get('id')})")
    r = requests.post(
        f"{API}/analysis/run",
        headers=headers,
        json={"competitor_ids": [first_comp["id"]]},
        timeout=120
    )
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        live_report = r.json()
        print(f"\nLive report top-level keys: {list(live_report.keys())}")
        if "competitors" in live_report:
            print(f"Number of competitors in live report: {len(live_report['competitors'])}")
            for i, comp in enumerate(live_report['competitors']):
                print(f"\nLive Competitor {i+1}:")
                print(f"  company_name: {comp.get('company_name', 'MISSING')}")
                print(f"  name: {comp.get('name', 'MISSING')}")
    else:
        print(f"Error: {r.text[:500]}")
