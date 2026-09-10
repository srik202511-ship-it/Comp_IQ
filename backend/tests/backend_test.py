"""Backend API tests for CompeteIQ dashboard."""
import os
import uuid
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://market-pulse-2519.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@competeiq.ai"
DEMO_PASSWORD = "demo1234"


@pytest.fixture(scope="session")
def demo_token():
    r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"demo login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def new_user():
    email = f"test_{uuid.uuid4().hex[:8]}@test.com"
    password = "testpass123"
    r = requests.post(f"{API}/auth/register", json={"email": email, "password": password, "name": "Tester"}, timeout=30)
    assert r.status_code == 200, f"register failed: {r.text}"
    data = r.json()
    return {"token": data["access_token"], "email": email, "user": data["user"]}


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ----------------------------- Auth -----------------------------
class TestAuth:
    def test_register_seeds_demo_data(self, new_user):
        token = new_user["token"]
        # /me works
        r = requests.get(f"{API}/auth/me", headers=auth_headers(token), timeout=20)
        assert r.status_code == 200
        assert r.json()["email"] == new_user["email"]
        # company seeded
        c = requests.get(f"{API}/company", headers=auth_headers(token), timeout=20).json()
        assert c is not None
        assert c.get("company_name")
        # 3 demo competitors seeded
        comps = requests.get(f"{API}/competitors", headers=auth_headers(token), timeout=20).json()
        assert isinstance(comps, list) and len(comps) >= 3
        # insights seeded
        ins = requests.get(f"{API}/insights", headers=auth_headers(token), timeout=20).json()
        assert ins is not None
        assert "executive_summary" in ins

    def test_duplicate_register_fails(self, new_user):
        r = requests.post(f"{API}/auth/register",
                          json={"email": new_user["email"], "password": "abcdef"}, timeout=20)
        assert r.status_code == 400

    def test_login_demo(self, demo_token):
        assert isinstance(demo_token, str) and len(demo_token) > 10

    def test_login_bad_password(self):
        r = requests.post(f"{API}/auth/login",
                          json={"email": DEMO_EMAIL, "password": "wrongpass"}, timeout=20)
        assert r.status_code == 401

    def test_protected_no_token(self):
        r = requests.get(f"{API}/company", timeout=20)
        assert r.status_code in (401, 403)

    def test_forgot_password(self):
        r = requests.post(f"{API}/auth/forgot-password", json={"email": DEMO_EMAIL}, timeout=20)
        assert r.status_code == 200


# ----------------------------- Company -----------------------------
class TestCompany:
    def test_get_and_update_company(self, demo_token):
        r = requests.get(f"{API}/company", headers=auth_headers(demo_token), timeout=20)
        assert r.status_code == 200
        curr = r.json()
        payload = {
            "company_name": curr.get("company_name", "NimbusIQ"),
            "industry": curr.get("industry", "SaaS"),
            "website": curr.get("website", ""),
            "description": curr.get("description", ""),
            "product_name": curr.get("product_name", "NimbusIQ"),
            "product_url": curr.get("product_url", ""),
            "category": curr.get("category", "Observability"),
            "product_description": "Updated by test",
            "target_customers": curr.get("target_customers", ""),
            "value_proposition": curr.get("value_proposition", ""),
            "differentiators": curr.get("differentiators", []) or [],
            "use_cases": curr.get("use_cases", []) or [],
            "features": curr.get("features", []) or [],
            "pricing": curr.get("pricing", ""),
            "competitive_goals": curr.get("competitive_goals", ""),
        }
        r2 = requests.put(f"{API}/company", headers=auth_headers(demo_token), json=payload, timeout=20)
        assert r2.status_code == 200
        assert r2.json()["product_description"] == "Updated by test"


# ----------------------------- Competitors CRUD -----------------------------
class TestCompetitors:
    def test_create_and_delete_competitor(self, demo_token):
        payload = {
            "company_name": "TEST_Comp",
            "industry": "SaaS",
            "website": "https://example.com",
            "product_name": "TestProd",
            "product_category": "Test",
            "target_market": "Test",
            "notes": "",
        }
        r = requests.post(f"{API}/competitors", headers=auth_headers(demo_token), json=payload, timeout=20)
        assert r.status_code == 200
        cid = r.json()["id"]
        assert r.json()["status"] == "Pending"
        # verify list contains it
        lst = requests.get(f"{API}/competitors", headers=auth_headers(demo_token), timeout=20).json()
        assert any(c["id"] == cid for c in lst)
        # delete
        d = requests.delete(f"{API}/competitors/{cid}", headers=auth_headers(demo_token), timeout=20)
        assert d.status_code == 200
        lst2 = requests.get(f"{API}/competitors", headers=auth_headers(demo_token), timeout=20).json()
        assert not any(c["id"] == cid for c in lst2)


# ----------------------------- Actions -----------------------------
class TestActions:
    def test_update_action_status(self, demo_token):
        ins = requests.get(f"{API}/insights", headers=auth_headers(demo_token), timeout=20).json()
        actions = ins.get("recommended_actions", [])
        if not actions:
            pytest.skip("no actions to update")
        aid = actions[0]["id"]
        r = requests.put(f"{API}/actions/{aid}", headers=auth_headers(demo_token),
                         json={"status": "In Progress"}, timeout=20)
        assert r.status_code == 200
        # verify persisted
        ins2 = requests.get(f"{API}/insights", headers=auth_headers(demo_token), timeout=20).json()
        for a in ins2["recommended_actions"]:
            if a["id"] == aid:
                assert a["status"] == "In Progress"
                break


# ----------------------------- Reset Demo -----------------------------
class TestResetDemo:
    def test_reset_demo(self, demo_token):
        r = requests.post(f"{API}/reset-demo", headers=auth_headers(demo_token), timeout=30)
        assert r.status_code == 200
        comps = requests.get(f"{API}/competitors", headers=auth_headers(demo_token), timeout=20).json()
        assert len(comps) >= 3
