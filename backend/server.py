from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import uuid
import json
import logging
import re
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
import requests
from bs4 import BeautifulSoup
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

from emergentintegrations.llm.chat import LlmChat, UserMessage

import demo_data

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("competeiq")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)


# ----------------------------- Auth utils -----------------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    token = None
    if creds:
        token = creds.credentials
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ----------------------------- Models -----------------------------
class RegisterBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: Optional[str] = None


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class ForgotBody(BaseModel):
    email: EmailStr


class CompanyBody(BaseModel):
    company_name: str
    industry: str = ""
    website: str = ""
    description: str = ""
    product_name: str = ""
    product_url: str = ""
    category: str = ""
    product_description: str = ""
    target_customers: str = ""
    value_proposition: str = ""
    differentiators: List[str] = []
    use_cases: List[str] = []
    features: List[str] = []
    pricing: str = ""
    competitive_goals: str = ""


class CompetitorBody(BaseModel):
    company_name: str
    industry: str = ""
    website: str = ""
    product_name: str = ""
    product_category: str = ""
    target_market: str = ""
    notes: str = ""


class ActionStatusBody(BaseModel):
    status: str


# ----------------------------- Scraping + AI -----------------------------
def scrape_website(url: str) -> dict:
    if not url.startswith("http"):
        url = "https://" + url
    headers = {"User-Agent": "Mozilla/5.0 (compatible; CompeteIQ/1.0; +https://competeiq.ai)"}
    collected = []
    pages = [url]
    base = url.rstrip("/")
    for suffix in ["/pricing", "/features"]:
        pages.append(base + suffix)
    title = ""
    ok = False
    for p in pages:
        try:
            r = requests.get(p, headers=headers, timeout=12)
            if r.status_code >= 400:
                continue
            ok = True
            soup = BeautifulSoup(r.text, "html.parser")
            if not title and soup.title and soup.title.string:
                title = soup.title.string.strip()
            for t in soup(["script", "style", "noscript", "svg"]):
                t.extract()
            text = " ".join(soup.get_text(" ").split())
            collected.append(f"[{p}] {text[:4000]}")
        except Exception as e:
            logger.info(f"scrape fail {p}: {e}")
    return {"ok": ok, "title": title, "text": " ".join(collected)[:9000]}


async def ai_json(system: str, prompt: str) -> dict:
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=str(uuid.uuid4()), system_message=system).with_model("openai", "gpt-5.4")
    resp = await chat.send_message(UserMessage(text=prompt))
    text = resp if isinstance(resp, str) else str(resp)
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(json)?", "", text).strip()
        text = re.sub(r"```$", "", text).strip()
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if m:
        text = m.group(0)
    return json.loads(text)


ANALYZE_SYSTEM = (
    "You are a competitive-intelligence analyst. You extract structured facts ONLY from the provided website text. "
    "NEVER fabricate pricing or facts. If a value is not present in the text, use the string 'Not publicly available'. "
    "Clearly separate confirmed (from text) vs AI-inferred data. Respond with valid minified JSON only, no markdown."
)


def analyze_prompt(comp: dict, scraped: dict, our: dict) -> str:
    return f"""Analyze this competitor for a competitive dashboard.

COMPETITOR: {comp['company_name']} | Industry: {comp.get('industry')} | Website: {comp.get('website')}

OUR PRODUCT (for comparison context): {our.get('product_name')} - {our.get('product_description')}. Our features: {', '.join(our.get('features', []))}. Our pricing: {our.get('pricing')}.

SCRAPED WEBSITE TEXT (source of truth, do not invent beyond this):
\"\"\"{scraped.get('text', '')[:8000]}\"\"\"

Return JSON with EXACTLY this shape:
{{
 "description": "1-2 sentence company/product description from text",
 "products": ["key products/services"],
 "target_customers": "who they sell to",
 "value_props": ["3 key value propositions"],
 "pricing": {{"starting_price": "e.g. $99/mo or 'Not publicly available'", "model": "pricing model", "tiers": [{{"name":"tier","price":"price"}}], "confidence": "High|Medium|Low", "source": "{comp.get('website')}", "available": true }},
 "features": [{{"name":"feature","category":"category","supported":true}}],
 "scores": {{"overall": 0-100, "price_competitiveness": 0-10, "feature_strength": 0-100, "value_prop": 0-10, "market_position": 1-10, "innovation": 0-10}},
 "key_strength": "their biggest strength vs our product",
 "key_weakness": "their biggest weakness vs our product",
 "confidence": "High|Medium|Low",
 "source_url": "{comp.get('website')}"
}}
Set pricing.available=false and starting_price='Not publicly available' if pricing is not in the text. Scores are AI-derived estimates."""


COMPANY_SYSTEM = (
    "You are a competitive-intelligence analyst. Extract structured facts about a company's OWN product ONLY from the provided website text. "
    "NEVER fabricate. If a value is not present, use 'Not publicly available'. Respond with valid minified JSON only, no markdown."
)


def company_prompt(website: str, scraped: dict) -> str:
    return f"""Analyze THIS company's own website to build their product profile for a competitive dashboard.

WEBSITE: {website}
SCRAPED TEXT (source of truth):
\"\"\"{scraped.get('text', '')[:8000]}\"\"\"

Return JSON EXACTLY:
{{
 "company_name": "",
 "industry": "",
 "description": "1-2 sentences",
 "product_name": "",
 "category": "",
 "product_description": "1-2 sentences",
 "target_customers": "",
 "value_proposition": "",
 "differentiators": ["up to 3"],
 "use_cases": ["up to 3"],
 "features": ["key product features"],
 "pricing": "starting price or 'Not publicly available'",
 "competitive_goals": "inferred competitive goal",
 "scores": {{"overall": 0-100, "price_competitiveness": 0-10, "feature_strength": 0-100, "value_prop": 0-10, "market_position": 1-10, "innovation": 0-10}}
}}
Scores are AI-derived baseline estimates for this product."""



INSIGHTS_SYSTEM = (
    "You are a senior competitive strategy advisor. You reason ONLY from the provided competitor data. "
    "Every insight must cite specific evidence from the data (features, prices, scores). "
    "Avoid generic advice. Respond with valid minified JSON only, no markdown."
)


def insights_prompt(our: dict, our_scores: dict, competitors: List[dict]) -> str:
    comp_lines = []
    for c in competitors:
        a = c.get("analysis", {})
        comp_lines.append({
            "name": c["company_name"],
            "scores": a.get("scores"),
            "pricing": a.get("pricing", {}).get("starting_price"),
            "features": [f["name"] for f in a.get("features", []) if f.get("supported")],
            "key_strength": a.get("key_strength"),
            "key_weakness": a.get("key_weakness"),
        })
    return f"""Generate a full competitive intelligence report as JSON.

OUR PRODUCT: {our.get('product_name')} ({our.get('company_name')}). Features: {our.get('features')}. Pricing: {our.get('pricing')}. Scores: {our_scores}. Value prop: {our.get('value_proposition')}.

COMPETITORS DATA: {json.dumps(comp_lines)}

Build a UNION feature list across our product + competitors. For each feature mark true/false per company (our product uses key "Our Product").
Return JSON EXACTLY:
{{
 "executive_summary": {{"position":"Strong|Moderate|Weak","biggest_advantage":"","biggest_weakness":"","biggest_threat":"","biggest_opportunity":"","narrative":"3-4 sentences"}},
 "feature_matrix": {{"features":[{{"name":"","category":"","Our Product":true,{', '.join([f'"{c["company_name"]}":true' for c in competitors])}}}],"feature_scores":{{"Our Product":0,{', '.join([f'"{c["company_name"]}":0' for c in competitors])}}}}},
 "pricing_comparison":[{{"company":"Our Product","starting_price":"","numeric":0,"relative_position":"Low|Mid|Higher","is_ours":true}}],
 "radar":{{"dimensions":["Pricing","Features","Brand Power","Innovation","Customer Support","Market Velocity"],"series":[{{"name":"Our Product","values":[0,0,0,0,0,0]}}]}},
 "positioning":[{{"company":"Our Product","x":0,"y":0,"is_ours":true}}],
 "comparison_table":[{{"company":"Our Product","overall":0,"price":"","feature_score":0,"innovation":0,"value_prop":0,"key_strength":"","key_weakness":"","is_ours":true}}],
 "swot":{{"strengths":[{{"text":"","evidence":""}}],"weaknesses":[{{"text":"","evidence":""}}],"opportunities":[{{"text":"","evidence":""}}],"threats":[{{"text":"","evidence":""}}]}},
 "insights":{{"weaker":[{{"issue":"","evidence":"","impact":""}}],"competitors_better":[{{"competitor":"","advantage":"","evidence":"","impact":"High|Medium|Low"}}],"opportunities":[{{"opportunity":"","why":"","evidence":"","impact":"High|Medium|Low","priority":"P0|P1|P2"}}]}},
 "recommended_actions":[{{"id":"act-1","priority":"P0|P1|P2","action":"","reason":"","impact":"High|Medium|Low","status":"Not Started"}}]
}}
In positioning: x = price competitiveness (0-10, higher=more affordable), y = feature strength (0-100). Include every company (ours + all competitors) in pricing_comparison, radar.series, positioning and comparison_table."""


# ----------------------------- Seeding -----------------------------
DEMO_EMAIL = "demo@competeiq.ai"
DEMO_PASSWORD = "demo1234"


async def ensure_demo_user():
    """Idempotently create the demo account so the 'Use demo' login always works."""
    existing = await db.users.find_one({"email": DEMO_EMAIL})
    if existing:
        await seed_user_data(existing["id"])
        return
    uid = str(uuid.uuid4())
    user = {
        "id": uid,
        "email": DEMO_EMAIL,
        "password_hash": hash_password(DEMO_PASSWORD),
        "name": "Demo User",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user)
    await seed_user_data(uid)
    logger.info(f"[seed] demo user ensured: {DEMO_EMAIL}")


async def seed_user_data(user_id: str):
    existing = await db.company.find_one({"user_id": user_id})
    if existing:
        return
    comp = {**demo_data.DEMO_COMPANY, "id": str(uuid.uuid4()), "user_id": user_id,
            "scores": demo_data.demo_company_scores(), "is_demo": True}
    await db.company.insert_one(comp)
    for c in demo_data.DEMO_COMPETITORS:
        doc = {**c, "id": str(uuid.uuid4()), "user_id": user_id,
               "last_analyzed": datetime.now(timezone.utc).isoformat(),
               "created_at": datetime.now(timezone.utc).isoformat()}
        await db.competitors.insert_one(doc)
    ins = {**demo_data.DEMO_INSIGHTS, "id": str(uuid.uuid4()), "user_id": user_id}
    await db.insights.insert_one(ins)


def clean(doc):
    if doc:
        doc.pop("_id", None)
    return doc


# ----------------------------- Auth routes -----------------------------
@api_router.post("/auth/register")
async def register(body: RegisterBody):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    uid = str(uuid.uuid4())
    user = {"id": uid, "email": email, "password_hash": hash_password(body.password),
            "name": body.name or email.split("@")[0], "created_at": datetime.now(timezone.utc).isoformat()}
    await db.users.insert_one(user)
    await seed_user_data(uid)
    token = create_access_token(uid, email)
    return {"access_token": token, "user": {"id": uid, "email": email, "name": user["name"]}}


@api_router.post("/auth/login")
async def login(body: LoginBody):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await seed_user_data(user["id"])
    token = create_access_token(user["id"], email)
    return {"access_token": token, "user": {"id": user["id"], "email": email, "name": user.get("name")}}


@api_router.post("/auth/forgot-password")
async def forgot(body: ForgotBody):
    logger.info(f"[password-reset] requested for {body.email}")
    return {"message": "If an account exists, a reset link has been sent."}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# ----------------------------- Company routes -----------------------------
@api_router.get("/company")
async def get_company(user: dict = Depends(get_current_user)):
    return clean(await db.company.find_one({"user_id": user["id"]}))


@api_router.put("/company")
async def update_company(body: CompanyBody, user: dict = Depends(get_current_user)):
    existing = await db.company.find_one({"user_id": user["id"]})
    data = body.model_dump()
    data["is_demo"] = False
    if existing:
        await db.company.update_one({"user_id": user["id"]}, {"$set": data})
    else:
        data.update({"id": str(uuid.uuid4()), "user_id": user["id"], "scores": demo_data.demo_company_scores()})
        await db.company.insert_one(data)
    return clean(await db.company.find_one({"user_id": user["id"]}))


class CompanyAnalyzeBody(BaseModel):
    website: str


@api_router.post("/company/analyze")
async def analyze_company(body: CompanyAnalyzeBody, user: dict = Depends(get_current_user)):
    scraped = scrape_website(body.website)
    if not scraped["ok"]:
        raise HTTPException(status_code=422, detail=f"Could not retrieve website data for {body.website}. Please check the URL and retry.")
    try:
        profile = await ai_json(COMPANY_SYSTEM, company_prompt(body.website, scraped))
    except Exception as e:
        logger.error(f"company analyze AI error: {e}")
        raise HTTPException(status_code=502, detail="AI analysis failed. Please retry.")
    profile["website"] = body.website if body.website.startswith("http") else "https://" + body.website
    profile["is_demo"] = False
    existing = await db.company.find_one({"user_id": user["id"]})
    if existing:
        await db.company.update_one({"user_id": user["id"]}, {"$set": profile})
    else:
        profile.update({"id": str(uuid.uuid4()), "user_id": user["id"]})
        await db.company.insert_one(profile)
    # Clear demo dataset so the user only sees their own product going forward
    await db.competitors.delete_many({"user_id": user["id"], "is_demo": True})
    await db.insights.delete_many({"user_id": user["id"], "is_demo": True})
    return clean(await db.company.find_one({"user_id": user["id"]}))


# ----------------------------- Competitor routes -----------------------------
@api_router.get("/competitors")
async def list_competitors(user: dict = Depends(get_current_user)):
    items = await db.competitors.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
    return items


@api_router.post("/competitors")
async def add_competitor(body: CompetitorBody, user: dict = Depends(get_current_user)):
    doc = body.model_dump()
    doc.update({"id": str(uuid.uuid4()), "user_id": user["id"], "status": "Pending",
                "is_demo": False, "analysis": None, "last_analyzed": None,
                "created_at": datetime.now(timezone.utc).isoformat()})
    await db.competitors.insert_one(doc)
    return clean(doc)


@api_router.delete("/competitors/{comp_id}")
async def delete_competitor(comp_id: str, user: dict = Depends(get_current_user)):
    await db.competitors.delete_one({"id": comp_id, "user_id": user["id"]})
    return {"message": "deleted"}


@api_router.post("/competitors/{comp_id}/analyze")
async def analyze_competitor(comp_id: str, user: dict = Depends(get_current_user)):
    comp = await db.competitors.find_one({"id": comp_id, "user_id": user["id"]})
    if not comp:
        raise HTTPException(status_code=404, detail="Competitor not found")
    our = await db.company.find_one({"user_id": user["id"]}) or {}
    scraped = scrape_website(comp.get("website", ""))
    if not scraped["ok"]:
        await db.competitors.update_one({"id": comp_id}, {"$set": {"status": "Error"}})
        raise HTTPException(status_code=422, detail=f"Could not retrieve website data for {comp.get('website')}. Please check the URL and retry.")
    try:
        analysis = await ai_json(ANALYZE_SYSTEM, analyze_prompt(comp, scraped, our))
    except Exception as e:
        logger.error(f"analyze AI error: {e}")
        await db.competitors.update_one({"id": comp_id}, {"$set": {"status": "Error"}})
        raise HTTPException(status_code=502, detail="AI analysis failed. Please retry.")
    analysis["collected_at"] = datetime.now(timezone.utc).isoformat()
    await db.competitors.update_one(
        {"id": comp_id},
        {"$set": {"analysis": analysis, "status": "Analyzed", "is_demo": False,
                  "last_analyzed": datetime.now(timezone.utc).isoformat()}},
    )
    return clean(await db.competitors.find_one({"id": comp_id}))


# ----------------------------- Insights routes -----------------------------
@api_router.get("/insights")
async def get_insights(user: dict = Depends(get_current_user)):
    return clean(await db.insights.find_one({"user_id": user["id"]}))


@api_router.post("/insights/generate")
async def generate_insights(user: dict = Depends(get_current_user)):
    our = await db.company.find_one({"user_id": user["id"]})
    if not our:
        raise HTTPException(status_code=400, detail="Set up your company profile first.")
    competitors = await db.competitors.find({"user_id": user["id"], "status": "Analyzed"}).to_list(50)
    if not competitors:
        raise HTTPException(status_code=400, detail="Analyze at least one competitor first.")
    our_scores = our.get("scores", demo_data.demo_company_scores())
    try:
        report = await ai_json(INSIGHTS_SYSTEM, insights_prompt(our, our_scores, competitors))
    except Exception as e:
        logger.error(f"insights AI error: {e}")
        raise HTTPException(status_code=502, detail="AI insight generation failed. Please retry.")
    report.update({"is_demo": False, "generated_at": datetime.now(timezone.utc).isoformat()})
    existing = await db.insights.find_one({"user_id": user["id"]})
    if existing:
        report["id"] = existing["id"]
        await db.insights.update_one({"user_id": user["id"]}, {"$set": report})
    else:
        report["id"] = str(uuid.uuid4())
        report["user_id"] = user["id"]
        await db.insights.insert_one(report)
    return clean(await db.insights.find_one({"user_id": user["id"]}))


@api_router.put("/actions/{action_id}")
async def update_action(action_id: str, body: ActionStatusBody, user: dict = Depends(get_current_user)):
    ins = await db.insights.find_one({"user_id": user["id"]})
    if not ins:
        raise HTTPException(status_code=404, detail="No insights found")
    actions = ins.get("recommended_actions", [])
    for a in actions:
        if a.get("id") == action_id:
            a["status"] = body.status
    await db.insights.update_one({"user_id": user["id"]}, {"$set": {"recommended_actions": actions}})
    return {"recommended_actions": actions}


@api_router.post("/reset-demo")
async def reset_demo(user: dict = Depends(get_current_user)):
    await db.company.delete_many({"user_id": user["id"]})
    await db.competitors.delete_many({"user_id": user["id"]})
    await db.insights.delete_many({"user_id": user["id"]})
    await seed_user_data(user["id"])
    return {"message": "Demo data reloaded"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.competitors.create_index("user_id")
    await db.company.create_index("user_id")
    try:
        await ensure_demo_user()
    except Exception as e:
        logger.error(f"[seed] ensure_demo_user failed: {e}")


@app.on_event("shutdown")
async def shutdown():
    client.close()
