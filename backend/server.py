from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from bson.errors import InvalidId
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator
from typing import List, Optional, Annotated
from datetime import datetime, timezone, timedelta
import os, logging, json, io, uuid, random, math, secrets
from pathlib import Path
import bcrypt
import jwt as pyjwt
import pandas as pd
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

ROOT_DIR = Path(__file__).parent
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
JWT_SECRET = os.environ.get('JWT_SECRET', 'fallback-secret')
JWT_ALGORITHM = "HS256"
EMERGENT_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ===== PyObjectId & Base =====
PyObjectId = Annotated[str, BeforeValidator(str)]

class BaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    @classmethod
    def from_mongo(cls, doc):
        if not doc:
            return None
        doc["_id"] = str(doc["_id"])
        return cls(**doc)

    def to_mongo(self):
        data = self.model_dump(by_alias=True, exclude_none=True)
        if "_id" in data and data["_id"]:
            data["_id"] = ObjectId(data["_id"])
        else:
            data.pop("_id", None)
        return data

# ===== Auth Helpers =====
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(hours=24), "type": "access"}
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ===== Fatigue Scoring =====
def calculate_fatigue_score(roas, peak_roas, ctr, initial_ctr, breakeven_roas, age_days):
    roas_ratio = roas / peak_roas if peak_roas > 0 else 0
    roas_score = min(35, roas_ratio * 35)
    ctr_ratio = ctr / initial_ctr if initial_ctr > 0 else 0
    ctr_score = min(25, ctr_ratio * 25)
    if roas >= breakeven_roas * 1.5:
        be_score = 25
    elif roas >= breakeven_roas:
        be_score = 15 + (roas - breakeven_roas) / (breakeven_roas * 0.5) * 10
    else:
        be_score = max(0, (roas / breakeven_roas) * 15) if breakeven_roas > 0 else 0
    if age_days <= 3: age_score = 15
    elif age_days <= 7: age_score = 12
    elif age_days <= 14: age_score = 8
    elif age_days <= 21: age_score = 4
    else: age_score = max(0, 2 - (age_days - 21) * 0.1)
    return round(min(100, max(0, roas_score + ctr_score + be_score + age_score)), 1)

def get_status(score):
    if score >= 70: return "healthy"
    if score >= 50: return "watch"
    if score >= 25: return "fatiguing"
    return "dead"

def predict_days_remaining(score, status):
    if status == "dead": return 0
    if status == "healthy": return random.randint(14, 30)
    if status == "watch": return random.randint(5, 14)
    return random.randint(1, 5)

# ===== Request Models =====
class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class DiagnoseRequest(BaseModel):
    creative_id: str

class GenerateRequest(BaseModel):
    creative_id: str
    angle: Optional[str] = None

# ===== Demo Data =====
PLATFORMS = ["Meta", "Google", "TikTok", "Taboola"]
CAMPAIGNS = {
    "Meta": ["Summer Flash Sale", "Holiday Retargeting", "New Collection Launch", "Brand Awareness Q1"],
    "Google": ["Performance Max - Shoes", "Search - Best Deals 2026", "Shopping - Premium", "Display Remarketing"],
    "TikTok": ["Creator Collab Series", "Trending Sounds Campaign", "UGC Challenge Push", "Spark Ads - Lifestyle"],
    "Taboola": ["Native Discovery - Health", "Advertorial - Finance", "Content Hub - Tech", "Clickbait Refresh"],
}
CREATIVE_NAMES = {
    "Meta": [("Summer Vibes - Carousel", "carousel"), ("BOGO Flash - Video", "video"), ("Limited Drop Alert", "static"), ("Real People Real Style", "ugc"), ("Countdown Timer Sale", "video"), ("Social Proof Testimonial", "carousel")],
    "Google": [("Best Running Shoes RSA", "rsa"), ("Premium Sneakers Shopping", "shopping"), ("50% Off Performance Max", "pmax"), ("Top Rated Search Ad", "search"), ("Athletic Gear Display", "display"), ("Clearance Remarketing", "remarketing")],
    "TikTok": [("POV Perfect Outfit Find", "spark"), ("This Changed Everything", "in_feed"), ("Creator Unboxing Haul", "ugc"), ("Dance Challenge Promo", "branded"), ("Get Ready With Me", "spark"), ("Day In My Life Product", "in_feed")],
    "Taboola": [("The Secret Doctors Know", "native"), ("Why Experts Switching", "advertorial"), ("You Wont Believe This", "discovery"), ("Top 10 Must-Haves 2026", "listicle"), ("One Simple Trick For", "native"), ("Breaking New Study Shows", "advertorial")],
}

def generate_daily_history(age_days, status, base_spend, base_roas, base_ctr):
    history = []
    now = datetime.now(timezone.utc)
    for day in range(age_days, 0, -1):
        date = now - timedelta(days=day)
        progress = 1 - (day / age_days) if age_days > 0 else 1
        if status == "healthy":
            rm, cm = 0.9 + 0.1 * random.random(), 0.9 + 0.1 * random.random()
        elif status == "watch":
            rm = max(0.6, 1 - progress * 0.4 + random.uniform(-0.05, 0.05))
            cm = max(0.6, 1 - progress * 0.35 + random.uniform(-0.05, 0.05))
        elif status == "fatiguing":
            rm = max(0.3, 1 - progress * 0.7 + random.uniform(-0.05, 0.05))
            cm = max(0.3, 1 - progress * 0.6 + random.uniform(-0.05, 0.05))
        else:
            rm = max(0.1, 1 - progress * 0.9 + random.uniform(-0.03, 0.03))
            cm = max(0.1, 1 - progress * 0.85 + random.uniform(-0.03, 0.03))
        ds = round(base_spend * (0.8 + 0.4 * random.random()), 2)
        dr = round(base_roas * rm, 3)
        dc = round(base_ctr * cm, 3)
        di = int(ds * 1000 / random.uniform(5, 15))
        dk = int(di * dc / 100)
        drev = round(ds * dr, 2)
        history.append({"date": date.isoformat(), "spend": ds, "revenue": drev, "roas": dr, "ctr": dc, "impressions": di, "clicks": dk})
    return history

async def seed_demo_data():
    count = await db.creatives.count_documents({})
    if count > 0:
        return
    logger.info("Seeding demo data...")
    creatives = []
    status_dist = ["healthy", "healthy", "watch", "watch", "fatiguing", "dead"]
    for platform in PLATFORMS:
        for i, (name, ad_type) in enumerate(CREATIVE_NAMES[platform]):
            target = status_dist[i % len(status_dist)]
            campaign = CAMPAIGNS[platform][i % len(CAMPAIGNS[platform])]
            if target == "healthy":
                age, br, pr, bc, ic, bs = random.randint(2, 8), random.uniform(2.5, 4.5), 0, random.uniform(2.5, 5.0), 0, random.uniform(150, 500)
                pr = br * random.uniform(1.0, 1.1); ic = bc * random.uniform(0.95, 1.0)
            elif target == "watch":
                age, br, pr, bc, ic, bs = random.randint(7, 14), random.uniform(1.5, 2.5), 0, random.uniform(1.5, 3.0), 0, random.uniform(200, 600)
                pr = br * random.uniform(1.3, 1.8); ic = bc * random.uniform(1.2, 1.5)
            elif target == "fatiguing":
                age, br, pr, bc, ic, bs = random.randint(12, 21), random.uniform(0.8, 1.5), 0, random.uniform(0.8, 1.8), 0, random.uniform(300, 800)
                pr = br * random.uniform(2.0, 3.0); ic = bc * random.uniform(1.8, 2.5)
            else:
                age, br, pr, bc, ic, bs = random.randint(18, 35), random.uniform(0.2, 0.7), 0, random.uniform(0.3, 0.8), 0, random.uniform(100, 400)
                pr = br * random.uniform(3.0, 5.0); ic = bc * random.uniform(2.5, 4.0)
            bev = 1.0
            fs = calculate_fatigue_score(br, pr, bc, ic, bev, age)
            st = get_status(fs)
            dr = predict_days_remaining(fs, st)
            hist = generate_daily_history(age, st, bs, pr, ic)
            ts = sum(d["spend"] for d in hist)
            tr = sum(d["revenue"] for d in hist)
            ti = sum(d["impressions"] for d in hist)
            tc = sum(d["clicks"] for d in hist)
            creatives.append({
                "name": name, "platform": platform, "campaign": campaign, "ad_type": ad_type,
                "total_spend": round(ts, 2), "total_revenue": round(tr, 2),
                "total_impressions": ti, "total_clicks": tc,
                "current_roas": round(br, 3), "peak_roas": round(pr, 3),
                "current_ctr": round(bc, 3), "initial_ctr": round(ic, 3),
                "cpc": round(ts / max(tc, 1), 2), "cpm": round(ts / max(ti, 1) * 1000, 2),
                "breakeven_roas": bev, "age_days": age, "fatigue_score": fs,
                "status": st, "days_remaining": dr, "daily_history": hist,
                "created_at": (datetime.now(timezone.utc) - timedelta(days=age)).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            })
    if creatives:
        await db.creatives.insert_many(creatives)
    danger = [c for c in creatives if c["status"] in ["fatiguing", "dead"]]
    alerts = []
    for c in danger[:6]:
        alerts.append({
            "creative_name": c["name"], "platform": c["platform"], "campaign": c["campaign"],
            "type": "spend_at_risk" if c["status"] == "fatiguing" else "creative_dead",
            "message": f"{c['name']} on {c['platform']} — ROAS dropped to {c['current_roas']}x (was {c['peak_roas']}x). {'Fatiguing fast' if c['status']=='fatiguing' else 'Creative is dead'}.",
            "spend_at_risk": round(c["total_spend"] * 0.3, 2),
            "fatigue_score": c["fatigue_score"], "status": c["status"],
            "dismissed": False, "created_at": datetime.now(timezone.utc).isoformat(),
        })
    if alerts:
        await db.alerts.insert_many(alerts)
    logger.info(f"Seeded {len(creatives)} creatives, {len(alerts)} alerts")

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@adspora.ai")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({"email": admin_email, "password_hash": hash_password(admin_password), "name": "Admin", "role": "admin", "created_at": datetime.now(timezone.utc).isoformat()})
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await seed_admin()
    await seed_demo_data()
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write("# Test Credentials\n\n## Admin\n- Email: admin@adspora.ai\n- Password: admin123\n- Role: admin\n\n## Demo\n- Use 'Try Demo' button\n- Auto-creates demo@adspora.ai\n\n## Endpoints\n- POST /api/auth/login\n- POST /api/auth/register\n- POST /api/auth/demo\n- GET /api/auth/me\n")
    logger.info("Startup complete")

# ===== Auth Endpoints =====
@api_router.post("/auth/register")
async def register(body: UserCreate, response: Response):
    email = body.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    result = await db.users.insert_one({"email": email, "password_hash": hash_password(body.password), "name": body.name, "role": "user", "created_at": datetime.now(timezone.utc).isoformat()})
    uid = str(result.inserted_id)
    at = create_access_token(uid, email)
    rt = create_refresh_token(uid)
    response.set_cookie(key="access_token", value=at, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=rt, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": uid, "email": email, "name": body.name, "role": "user", "token": at}

@api_router.post("/auth/login")
async def login(body: UserLogin, response: Response):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    uid = str(user["_id"])
    at = create_access_token(uid, email)
    rt = create_refresh_token(uid)
    response.set_cookie(key="access_token", value=at, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=rt, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": uid, "email": email, "name": user.get("name", ""), "role": user.get("role", "user"), "token": at}

@api_router.post("/auth/demo")
async def demo_login(response: Response):
    demo_email = "demo@adspora.ai"
    user = await db.users.find_one({"email": demo_email})
    if not user:
        result = await db.users.insert_one({"email": demo_email, "password_hash": hash_password("demo123"), "name": "Demo User", "role": "demo", "created_at": datetime.now(timezone.utc).isoformat()})
        uid = str(result.inserted_id)
    else:
        uid = str(user["_id"])
    at = create_access_token(uid, demo_email)
    rt = create_refresh_token(uid)
    response.set_cookie(key="access_token", value=at, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=rt, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": uid, "email": demo_email, "name": "Demo User", "role": "demo", "token": at}

@api_router.get("/auth/me")
async def get_me(request: Request):
    return await get_current_user(request)

@api_router.post("/auth/logout")
async def logout_user(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

# ===== Dashboard =====
@api_router.get("/dashboard/overview")
async def dashboard_overview(request: Request):
    await get_current_user(request)
    creatives = await db.creatives.find({}, {"daily_history": 0}).to_list(1000)
    ts = sum(c.get("total_spend", 0) for c in creatives)
    tr = sum(c.get("total_revenue", 0) for c in creatives)
    statuses = {"healthy": 0, "watch": 0, "fatiguing": 0, "dead": 0}
    sar = 0
    scores = []
    for c in creatives:
        s = c.get("status", "healthy")
        statuses[s] = statuses.get(s, 0) + 1
        if s in ["fatiguing", "dead"]:
            sar += c.get("total_spend", 0) * 0.3
        scores.append(c.get("fatigue_score", 50))
    return {
        "total_spend": round(ts, 2), "total_revenue": round(tr, 2), "spend_at_risk": round(sar, 2),
        "total_creatives": len(creatives), "healthy_count": statuses["healthy"], "watch_count": statuses["watch"],
        "fatiguing_count": statuses["fatiguing"], "dead_count": statuses["dead"],
        "avg_roas": round(tr / ts, 2) if ts > 0 else 0,
        "avg_fatigue_score": round(sum(scores) / len(scores), 1) if scores else 0,
    }

@api_router.get("/dashboard/trends")
async def dashboard_trends(request: Request):
    await get_current_user(request)
    creatives = await db.creatives.find({}, {"daily_history": 1}).to_list(1000)
    daily = {}
    for c in creatives:
        for d in c.get("daily_history", []):
            dt = d["date"][:10]
            if dt not in daily:
                daily[dt] = {"spend": 0, "revenue": 0, "impressions": 0, "clicks": 0}
            daily[dt]["spend"] += d.get("spend", 0)
            daily[dt]["revenue"] += d.get("revenue", 0)
            daily[dt]["impressions"] += d.get("impressions", 0)
            daily[dt]["clicks"] += d.get("clicks", 0)
    trends = []
    for dt in sorted(daily.keys()):
        d = daily[dt]
        trends.append({"date": dt, "spend": round(d["spend"], 2), "revenue": round(d["revenue"], 2), "roas": round(d["revenue"] / d["spend"], 3) if d["spend"] > 0 else 0, "ctr": round(d["clicks"] / d["impressions"] * 100, 3) if d["impressions"] > 0 else 0})
    return {"trends": trends}

@api_router.get("/dashboard/platform-breakdown")
async def platform_breakdown(request: Request):
    await get_current_user(request)
    creatives = await db.creatives.find({}, {"daily_history": 0}).to_list(1000)
    pf = {}
    for c in creatives:
        p = c.get("platform", "Unknown")
        if p not in pf:
            pf[p] = {"platform": p, "spend": 0, "revenue": 0, "creatives": 0, "fatiguing": 0, "dead": 0}
        pf[p]["spend"] += c.get("total_spend", 0)
        pf[p]["revenue"] += c.get("total_revenue", 0)
        pf[p]["creatives"] += 1
        if c.get("status") == "fatiguing": pf[p]["fatiguing"] += 1
        if c.get("status") == "dead": pf[p]["dead"] += 1
    result = []
    for v in pf.values():
        v["roas"] = round(v["revenue"] / v["spend"], 2) if v["spend"] > 0 else 0
        v["spend"] = round(v["spend"], 2)
        v["revenue"] = round(v["revenue"], 2)
        result.append(v)
    return {"platforms": result}

# ===== Creatives =====
@api_router.get("/creatives")
async def list_creatives(request: Request, platform: Optional[str] = None, status: Optional[str] = None, sort_by: str = "fatigue_score", sort_order: str = "asc", search: Optional[str] = None):
    await get_current_user(request)
    q = {}
    if platform and platform != "all": q["platform"] = platform
    if status and status != "all": q["status"] = status
    if search: q["name"] = {"$regex": search, "$options": "i"}
    sd = 1 if sort_order == "asc" else -1
    creatives = await db.creatives.find(q, {"daily_history": 0}).sort(sort_by, sd).to_list(500)
    for c in creatives:
        c["_id"] = str(c["_id"])
    return {"creatives": creatives, "total": len(creatives)}

@api_router.get("/creatives/{creative_id}")
async def get_creative(creative_id: str, request: Request):
    await get_current_user(request)
    try:
        oid = ObjectId(creative_id)
    except (InvalidId, Exception):
        raise HTTPException(status_code=404, detail="Creative not found")
    c = await db.creatives.find_one({"_id": oid})
    if not c:
        raise HTTPException(status_code=404, detail="Creative not found")
    c["_id"] = str(c["_id"])
    return c

# ===== AI Endpoints =====
@api_router.post("/ai/diagnose")
async def ai_diagnose(body: DiagnoseRequest, request: Request):
    await get_current_user(request)
    c = await db.creatives.find_one({"_id": ObjectId(body.creative_id)})
    if not c:
        raise HTTPException(status_code=404, detail="Creative not found")
    info = {k: c[k] for k in ["name", "platform", "campaign", "current_roas", "peak_roas", "current_ctr", "initial_ctr", "fatigue_score", "status", "age_days", "total_spend", "cpc", "cpm"]}
    prompt = f"""You are a senior media buying analyst. Analyze this ad creative and diagnose its performance issues.

Creative Data:
{json.dumps(info, indent=2)}

Provide analysis:
1. **What's Happening**: Current performance trajectory
2. **Why It's Happening**: Root causes (audience saturation, hook wear-out, seasonality, competition, frequency)
3. **Urgency**: Critical/High/Medium/Low
4. **Recommended Angle**: New creative angle to test
5. **Action Items**: 3 specific next steps

Be concise, data-driven, reference actual numbers."""

    chat = LlmChat(api_key=EMERGENT_KEY, session_id=f"diag-{uuid.uuid4().hex[:8]}", system_message="You are Adspora's AI Media Buying Analyst.").with_model("openai", "gpt-5.2")

    async def gen():
        try:
            async for ev in chat.stream_message(UserMessage(text=prompt)):
                if isinstance(ev, TextDelta):
                    yield f"data: {json.dumps({'type': 'text', 'content': ev.content})}\n\n"
                elif isinstance(ev, StreamDone):
                    yield f"data: {json.dumps({'type': 'done'})}\n\n"
                    break
        except Exception as e:
            logger.error(f"AI diagnose error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
    return StreamingResponse(gen(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

@api_router.post("/ai/generate")
async def ai_generate(body: GenerateRequest, request: Request):
    await get_current_user(request)
    c = await db.creatives.find_one({"_id": ObjectId(body.creative_id)})
    if not c:
        raise HTTPException(status_code=404, detail="Creative not found")
    angle = body.angle or "fresh approach with stronger hook"
    prompt = f"""Generate 3 replacement ad variations for a fatiguing {c['platform']} ad.

Original: {c['name']} | Campaign: {c['campaign']}
Angle: {angle} | Current ROAS: {c['current_roas']}x (peak {c['peak_roas']}x)

Platform voice:
- Meta: Scroll-stopping emotional hooks, benefit-driven
- Google: Search-intent focused, benefit-led, clear CTA
- TikTok: Casual creator-style, trendy, authentic
- Taboola: Curiosity-driven, advertorial, native feel

Return ONLY this JSON array:
[{{"variation":1,"headline":"...","body":"...","cta":"...","angle_description":"..."}},{{"variation":2,"headline":"...","body":"...","cta":"...","angle_description":"..."}},{{"variation":3,"headline":"...","body":"...","cta":"...","angle_description":"..."}}]"""

    chat = LlmChat(api_key=EMERGENT_KEY, session_id=f"gen-{uuid.uuid4().hex[:8]}", system_message="You are Adspora's AI Ad Copywriter. Respond only with valid JSON.").with_model("openai", "gpt-5.2")

    async def gen():
        full = ""
        try:
            async for ev in chat.stream_message(UserMessage(text=prompt)):
                if isinstance(ev, TextDelta):
                    full += ev.content
                    yield f"data: {json.dumps({'type': 'text', 'content': ev.content})}\n\n"
                elif isinstance(ev, StreamDone):
                    try:
                        js = full.find('['); je = full.rfind(']') + 1
                        if js >= 0 and je > js:
                            variations = json.loads(full[js:je])
                            yield f"data: {json.dumps({'type': 'variations', 'content': variations})}\n\n"
                    except:
                        pass
                    yield f"data: {json.dumps({'type': 'done'})}\n\n"
                    break
        except Exception as e:
            logger.error(f"AI generate error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
    return StreamingResponse(gen(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

# ===== Upload =====
@api_router.post("/upload/file")
async def upload_file(request: Request, file: UploadFile = File(...)):
    await get_current_user(request)
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file")
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ["csv", "xlsx", "xls"]:
        raise HTTPException(status_code=400, detail="Use CSV or Excel files")
    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content)) if ext == "csv" else pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Parse error: {e}")
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    col_map = {"creative": "name", "creative_name": "name", "ad_name": "name", "network": "platform", "source": "platform", "cost": "spend", "amount_spent": "spend", "conversions_value": "revenue", "conversion_value": "revenue", "click_through_rate": "ctr", "return_on_ad_spend": "roas", "campaign_name": "campaign", "days": "age_days"}
    df.rename(columns=col_map, inplace=True)
    if "name" not in df.columns:
        return {"status": "error", "message": "Missing 'name' column", "columns": list(df.columns), "preview": df.head(5).to_dict(orient="records")}
    inserted = 0
    for _, row in df.iterrows():
        data = {k: (None if pd.isna(v) else v) for k, v in row.to_dict().items()}
        spend = float(data.get("spend", 0) or 0)
        revenue = float(data.get("revenue", 0) or 0)
        imps = int(data.get("impressions", 0) or 0)
        clicks = int(data.get("clicks", 0) or 0)
        ctr = float(data.get("ctr", 0) or 0) or (clicks / imps * 100 if imps > 0 else 0)
        roas = float(data.get("roas", 0) or 0) or (revenue / spend if spend > 0 else 0)
        age = int(data.get("age_days", 7) or 7)
        pr = roas * random.uniform(1.1, 2.0)
        ic = ctr * random.uniform(1.1, 1.8)
        fs = calculate_fatigue_score(roas, pr, ctr, ic, 1.0, age)
        st = get_status(fs)
        await db.creatives.insert_one({
            "name": str(data.get("name", "Unnamed")), "platform": str(data.get("platform", "Unknown")),
            "campaign": str(data.get("campaign", "Imported")), "ad_type": "imported",
            "total_spend": round(spend, 2), "total_revenue": round(revenue, 2),
            "total_impressions": imps, "total_clicks": clicks,
            "current_roas": round(roas, 3), "peak_roas": round(pr, 3),
            "current_ctr": round(ctr, 3), "initial_ctr": round(ic, 3),
            "cpc": round(spend / max(clicks, 1), 2), "cpm": round(spend / max(imps, 1) * 1000, 2),
            "breakeven_roas": 1.0, "age_days": age, "fatigue_score": fs,
            "status": st, "days_remaining": predict_days_remaining(fs, st),
            "daily_history": [], "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        inserted += 1
    return {"status": "success", "inserted": inserted, "total_rows": len(df), "columns": list(df.columns)}

# ===== Alerts =====
@api_router.get("/alerts")
async def get_alerts(request: Request):
    await get_current_user(request)
    alerts = await db.alerts.find({"dismissed": False}).sort("created_at", -1).to_list(50)
    for a in alerts:
        a["_id"] = str(a["_id"])
    return {"alerts": alerts}

@api_router.put("/alerts/{alert_id}/dismiss")
async def dismiss_alert(alert_id: str, request: Request):
    await get_current_user(request)
    r = await db.alerts.update_one({"_id": ObjectId(alert_id)}, {"$set": {"dismissed": True}})
    if r.modified_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Dismissed"}

# ===== Settings =====
@api_router.get("/settings")
async def get_settings(request: Request):
    user = await get_current_user(request)
    s = await db.settings.find_one({"user_id": user["_id"]})
    if not s:
        s = {"user_id": user["_id"], "breakeven_roas": 1.0, "alert_threshold": 40, "connected_platforms": [], "notification_email": user.get("email", ""), "slack_webhook": "", "weekly_report": True}
        await db.settings.insert_one(s)
    s["_id"] = str(s.get("_id", ""))
    return s

@api_router.put("/settings")
async def update_settings(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    body.pop("_id", None); body.pop("user_id", None)
    await db.settings.update_one({"user_id": user["_id"]}, {"$set": body}, upsert=True)
    return {"message": "Settings updated"}

@api_router.get("/")
async def root():
    return {"message": "Adspora API", "version": "1.0.0"}

app.include_router(api_router)
frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(CORSMiddleware, allow_origins=[frontend_url, "http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
