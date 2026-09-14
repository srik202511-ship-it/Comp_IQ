"""Reset demo and check CI report."""
import os
import requests
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://app-docs-10.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@competeiq.ai"
DEMO_PASSWORD = "demo1234"

# Login
print("Logging in...")
r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}, timeout=30)
token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Reset demo
print("Resetting demo...")
r = requests.post(f"{API}/reset-demo", headers=headers, timeout=30)
print(f"Reset status: {r.status_code}")

# Get analysis
print("\nGetting analysis after reset...")
r = requests.get(f"{API}/analysis", headers=headers, timeout=30)
if r.status_code == 200:
    report = r.json()
    print(f"Report has {len(report.get('competitors', []))} competitors")
    for i, comp in enumerate(report.get('competitors', [])):
        print(f"  {i+1}. {comp.get('name', 'Unknown')}")
else:
    print(f"Error: {r.status_code} {r.text}")
