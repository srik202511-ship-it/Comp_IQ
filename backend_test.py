#!/usr/bin/env python3
"""
Backend API tests for CompeteIQ demo credentials login fix.
Tests the demo user login flow and protected endpoints.
"""
import requests
import uuid
import sys
from pathlib import Path

# Read backend URL from frontend/.env
env_file = Path("/app/frontend/.env")
BACKEND_URL = None
if env_file.exists():
    for line in env_file.read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BACKEND_URL = line.split("=", 1)[1].strip()
            break

if not BACKEND_URL:
    print("❌ CRITICAL: Could not read REACT_APP_BACKEND_URL from /app/frontend/.env")
    sys.exit(1)

API_BASE = f"{BACKEND_URL}/api"
print(f"🔗 Testing backend at: {API_BASE}\n")

# Test results tracking
tests_passed = 0
tests_failed = 0
critical_failures = []


def test_result(name, passed, details=""):
    global tests_passed, tests_failed, critical_failures
    if passed:
        tests_passed += 1
        print(f"✅ {name}")
        if details:
            print(f"   {details}")
    else:
        tests_failed += 1
        critical_failures.append(f"{name}: {details}")
        print(f"❌ {name}")
        if details:
            print(f"   {details}")
    print()


# ============================================================================
# TEST 1: Demo credentials login (PRIMARY BUG FIX)
# ============================================================================
print("=" * 70)
print("TEST 1: Demo credentials login (demo@competeiq.ai / demo1234)")
print("=" * 70)

demo_token = None
demo_user = None

try:
    response = requests.post(
        f"{API_BASE}/auth/login",
        json={"email": "demo@competeiq.ai", "password": "demo1234"},
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        if "access_token" in data and "user" in data:
            demo_token = data["access_token"]
            demo_user = data["user"]
            test_result(
                "Demo login returns 200 with access_token and user",
                True,
                f"User: {demo_user.get('email')} (ID: {demo_user.get('id')})"
            )
        else:
            test_result(
                "Demo login returns 200 with access_token and user",
                False,
                f"Missing fields in response: {data}"
            )
    else:
        test_result(
            "Demo login returns 200 with access_token and user",
            False,
            f"Status {response.status_code}: {response.text}"
        )
except Exception as e:
    test_result("Demo login returns 200 with access_token and user", False, str(e))


# ============================================================================
# TEST 2: Protected endpoints with demo token
# ============================================================================
if demo_token:
    headers = {"Authorization": f"Bearer {demo_token}"}
    
    # TEST 2a: GET /api/auth/me
    print("=" * 70)
    print("TEST 2a: GET /api/auth/me with demo token")
    print("=" * 70)
    try:
        response = requests.get(f"{API_BASE}/auth/me", headers=headers, timeout=10)
        if response.status_code == 200:
            user = response.json()
            if user.get("email") == "demo@competeiq.ai":
                test_result(
                    "GET /api/auth/me returns demo user",
                    True,
                    f"Email: {user.get('email')}, Name: {user.get('name')}"
                )
            else:
                test_result(
                    "GET /api/auth/me returns demo user",
                    False,
                    f"Wrong user: {user}"
                )
        else:
            test_result(
                "GET /api/auth/me returns demo user",
                False,
                f"Status {response.status_code}: {response.text}"
            )
    except Exception as e:
        test_result("GET /api/auth/me returns demo user", False, str(e))
    
    # TEST 2b: GET /api/company
    print("=" * 70)
    print("TEST 2b: GET /api/company (should return NimbusIQ)")
    print("=" * 70)
    try:
        response = requests.get(f"{API_BASE}/company", headers=headers, timeout=10)
        if response.status_code == 200:
            company = response.json()
            if company and company.get("product_name") == "NimbusIQ Observability Cloud":
                test_result(
                    "GET /api/company returns NimbusIQ profile",
                    True,
                    f"Company: {company.get('company_name')}, Product: {company.get('product_name')}"
                )
            else:
                test_result(
                    "GET /api/company returns NimbusIQ profile",
                    False,
                    f"Wrong company or missing data: {company}"
                )
        else:
            test_result(
                "GET /api/company returns NimbusIQ profile",
                False,
                f"Status {response.status_code}: {response.text}"
            )
    except Exception as e:
        test_result("GET /api/company returns NimbusIQ profile", False, str(e))
    
    # TEST 2c: GET /api/competitors
    print("=" * 70)
    print("TEST 2c: GET /api/competitors (should return 3 seeded competitors)")
    print("=" * 70)
    try:
        response = requests.get(f"{API_BASE}/competitors", headers=headers, timeout=10)
        if response.status_code == 200:
            competitors = response.json()
            if isinstance(competitors, list) and len(competitors) == 3:
                names = [c.get("company_name") for c in competitors]
                statuses = [c.get("status") for c in competitors]
                expected_names = {"Datadog", "Dynatrace", "New Relic"}
                if set(names) == expected_names and all(s == "Analyzed" for s in statuses):
                    test_result(
                        "GET /api/competitors returns 3 seeded competitors (Analyzed)",
                        True,
                        f"Competitors: {', '.join(names)}"
                    )
                else:
                    test_result(
                        "GET /api/competitors returns 3 seeded competitors (Analyzed)",
                        False,
                        f"Names: {names}, Statuses: {statuses}"
                    )
            else:
                test_result(
                    "GET /api/competitors returns 3 seeded competitors (Analyzed)",
                    False,
                    f"Expected 3 competitors, got {len(competitors) if isinstance(competitors, list) else 'non-list'}"
                )
        else:
            test_result(
                "GET /api/competitors returns 3 seeded competitors (Analyzed)",
                False,
                f"Status {response.status_code}: {response.text}"
            )
    except Exception as e:
        test_result("GET /api/competitors returns 3 seeded competitors (Analyzed)", False, str(e))
    
    # TEST 2d: GET /api/insights
    print("=" * 70)
    print("TEST 2d: GET /api/insights (should return seeded insights report)")
    print("=" * 70)
    try:
        response = requests.get(f"{API_BASE}/insights", headers=headers, timeout=10)
        if response.status_code == 200:
            insights = response.json()
            if insights and "executive_summary" in insights and "feature_matrix" in insights:
                test_result(
                    "GET /api/insights returns seeded insights report",
                    True,
                    f"Position: {insights.get('executive_summary', {}).get('position')}"
                )
            else:
                test_result(
                    "GET /api/insights returns seeded insights report",
                    False,
                    f"Missing expected fields: {insights}"
                )
        else:
            test_result(
                "GET /api/insights returns seeded insights report",
                False,
                f"Status {response.status_code}: {response.text}"
            )
    except Exception as e:
        test_result("GET /api/insights returns seeded insights report", False, str(e))
else:
    print("⚠️  Skipping protected endpoint tests (no demo token)\n")
    tests_failed += 4


# ============================================================================
# TEST 3: Negative check - wrong password
# ============================================================================
print("=" * 70)
print("TEST 3: Login with wrong password (should return 401)")
print("=" * 70)

try:
    response = requests.post(
        f"{API_BASE}/auth/login",
        json={"email": "demo@competeiq.ai", "password": "wrongpassword"},
        timeout=10
    )
    
    if response.status_code == 401:
        test_result(
            "Login with wrong password returns 401",
            True,
            f"Response: {response.json().get('detail', 'Unauthorized')}"
        )
    else:
        test_result(
            "Login with wrong password returns 401",
            False,
            f"Expected 401, got {response.status_code}: {response.text}"
        )
except Exception as e:
    test_result("Login with wrong password returns 401", False, str(e))


# ============================================================================
# TEST 4: Fresh registration with random user
# ============================================================================
print("=" * 70)
print("TEST 4: Register new user (should return token and seed demo data)")
print("=" * 70)

random_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
random_password = "testpass123"

try:
    response = requests.post(
        f"{API_BASE}/auth/register",
        json={"email": random_email, "password": random_password, "name": "Test User"},
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        if "access_token" in data and "user" in data:
            new_token = data["access_token"]
            new_user = data["user"]
            
            # Verify the new user gets seeded data
            headers = {"Authorization": f"Bearer {new_token}"}
            
            # Check if company is seeded
            comp_resp = requests.get(f"{API_BASE}/company", headers=headers, timeout=10)
            competitors_resp = requests.get(f"{API_BASE}/competitors", headers=headers, timeout=10)
            
            if comp_resp.status_code == 200 and competitors_resp.status_code == 200:
                company = comp_resp.json()
                competitors = competitors_resp.json()
                
                if company and company.get("product_name") == "NimbusIQ Observability Cloud" and len(competitors) == 3:
                    test_result(
                        "Register new user returns token and seeds demo data",
                        True,
                        f"User: {new_user.get('email')}, Company: {company.get('company_name')}, Competitors: {len(competitors)}"
                    )
                else:
                    test_result(
                        "Register new user returns token and seeds demo data",
                        False,
                        f"Data not properly seeded. Company: {company.get('product_name') if company else None}, Competitors: {len(competitors) if isinstance(competitors, list) else 0}"
                    )
            else:
                test_result(
                    "Register new user returns token and seeds demo data",
                    False,
                    f"Could not fetch seeded data. Company status: {comp_resp.status_code}, Competitors status: {competitors_resp.status_code}"
                )
        else:
            test_result(
                "Register new user returns token and seeds demo data",
                False,
                f"Missing fields in response: {data}"
            )
    else:
        test_result(
            "Register new user returns token and seeds demo data",
            False,
            f"Status {response.status_code}: {response.text}"
        )
except Exception as e:
    test_result("Register new user returns token and seeds demo data", False, str(e))


# ============================================================================
# SUMMARY
# ============================================================================
print("=" * 70)
print("TEST SUMMARY")
print("=" * 70)
print(f"✅ Passed: {tests_passed}")
print(f"❌ Failed: {tests_failed}")
print(f"📊 Total:  {tests_passed + tests_failed}")
print()

if critical_failures:
    print("🚨 CRITICAL FAILURES:")
    for failure in critical_failures:
        print(f"   • {failure}")
    print()

if tests_failed == 0:
    print("🎉 ALL TESTS PASSED! Demo credentials login is working correctly.")
    sys.exit(0)
else:
    print("⚠️  SOME TESTS FAILED. Review the failures above.")
    sys.exit(1)
