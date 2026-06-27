"""Adspora backend regression tests"""
import os
import io
import requests
import pytest

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://fatigue-detect-4.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@adspora.ai"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="session")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data
    s.headers.update({"Authorization": f"Bearer {data['token']}"})
    return s


# ---------- Auth ----------
class TestAuth:
    def test_login_admin(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        d = r.json()
        assert d["email"] == ADMIN_EMAIL
        assert d["role"] == "admin"
        assert "token" in d and len(d["token"]) > 20
        # httpOnly cookie set
        assert "access_token" in r.cookies

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_demo_login(self):
        r = requests.post(f"{API}/auth/demo")
        assert r.status_code == 200
        d = r.json()
        assert d["email"] == "demo@adspora.ai"
        assert "token" in d

    def test_me_requires_auth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_with_token(self, admin_session):
        r = admin_session.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_logout(self, admin_session):
        r = admin_session.post(f"{API}/auth/logout")
        assert r.status_code == 200


# ---------- Dashboard ----------
class TestDashboard:
    def test_overview(self, admin_session):
        r = admin_session.get(f"{API}/dashboard/overview")
        assert r.status_code == 200
        d = r.json()
        for k in ["total_spend", "total_revenue", "spend_at_risk", "total_creatives",
                  "healthy_count", "watch_count", "fatiguing_count", "dead_count",
                  "avg_roas", "avg_fatigue_score"]:
            assert k in d
        assert d["total_creatives"] >= 24  # 24 seeded creatives

    def test_trends(self, admin_session):
        r = admin_session.get(f"{API}/dashboard/trends")
        assert r.status_code == 200
        d = r.json()
        assert "trends" in d
        assert isinstance(d["trends"], list)
        assert len(d["trends"]) > 0
        sample = d["trends"][0]
        for k in ["date", "spend", "revenue", "roas", "ctr"]:
            assert k in sample

    def test_platform_breakdown(self, admin_session):
        r = admin_session.get(f"{API}/dashboard/platform-breakdown")
        assert r.status_code == 200
        d = r.json()
        assert "platforms" in d
        platforms = {p["platform"] for p in d["platforms"]}
        assert {"Meta", "Google", "TikTok", "Taboola"}.issubset(platforms)


# ---------- Creatives ----------
class TestCreatives:
    def test_list_all(self, admin_session):
        r = admin_session.get(f"{API}/creatives")
        assert r.status_code == 200
        d = r.json()
        assert "creatives" in d and "total" in d
        assert d["total"] >= 24
        # Verify no mongodb _id ObjectId leak (must be string)
        first = d["creatives"][0]
        assert isinstance(first.get("_id"), str)
        for k in ["name", "platform", "fatigue_score", "status", "current_roas", "current_ctr"]:
            assert k in first

    def test_filter_by_platform(self, admin_session):
        r = admin_session.get(f"{API}/creatives", params={"platform": "Meta"})
        assert r.status_code == 200
        for c in r.json()["creatives"]:
            assert c["platform"] == "Meta"

    def test_filter_by_status(self, admin_session):
        r = admin_session.get(f"{API}/creatives", params={"status": "fatiguing"})
        assert r.status_code == 200
        for c in r.json()["creatives"]:
            assert c["status"] == "fatiguing"

    def test_search(self, admin_session):
        r = admin_session.get(f"{API}/creatives", params={"search": "Summer"})
        assert r.status_code == 200

    def test_get_creative_detail(self, admin_session):
        r = admin_session.get(f"{API}/creatives")
        cid = r.json()["creatives"][0]["_id"]
        d = admin_session.get(f"{API}/creatives/{cid}")
        assert d.status_code == 200
        body = d.json()
        assert body["_id"] == cid
        assert "daily_history" in body
        assert isinstance(body["daily_history"], list)

    def test_get_creative_invalid_id(self, admin_session):
        r = admin_session.get(f"{API}/creatives/507f1f77bcf86cd799439011")
        assert r.status_code == 404


# ---------- Alerts ----------
class TestAlerts:
    def test_list_alerts(self, admin_session):
        r = admin_session.get(f"{API}/alerts")
        assert r.status_code == 200
        d = r.json()
        assert "alerts" in d
        assert isinstance(d["alerts"], list)
        if d["alerts"]:
            a = d["alerts"][0]
            for k in ["creative_name", "platform", "type", "message", "spend_at_risk"]:
                assert k in a

    def test_dismiss_alert_and_verify(self, admin_session):
        r = admin_session.get(f"{API}/alerts")
        alerts = r.json()["alerts"]
        if not alerts:
            pytest.skip("No alerts to dismiss")
        aid = alerts[0]["_id"]
        d = admin_session.put(f"{API}/alerts/{aid}/dismiss")
        assert d.status_code == 200
        # Verify dismissed alert not in list
        r2 = admin_session.get(f"{API}/alerts")
        ids = [a["_id"] for a in r2.json()["alerts"]]
        assert aid not in ids


# ---------- Settings ----------
class TestSettings:
    def test_get_settings(self, admin_session):
        r = admin_session.get(f"{API}/settings")
        assert r.status_code == 200
        d = r.json()
        for k in ["breakeven_roas", "alert_threshold", "notification_email"]:
            assert k in d

    def test_update_and_verify(self, admin_session):
        payload = {"breakeven_roas": 1.5, "alert_threshold": 35, "weekly_report": False,
                   "notification_email": "test@adspora.ai", "slack_webhook": "", "connected_platforms": []}
        r = admin_session.put(f"{API}/settings", json=payload)
        assert r.status_code == 200
        g = admin_session.get(f"{API}/settings")
        d = g.json()
        assert d["breakeven_roas"] == 1.5
        assert d["alert_threshold"] == 35
        assert d["weekly_report"] is False


# ---------- Upload ----------
class TestUpload:
    def test_upload_csv(self, admin_session):
        csv_content = b"name,platform,campaign,spend,revenue,impressions,clicks,age_days\n" \
                      b"TEST_Upload_Ad,Meta,TEST_Campaign,500,1200,50000,800,10\n"
        files = {"file": ("test.csv", io.BytesIO(csv_content), "text/csv")}
        r = admin_session.post(f"{API}/upload/file", files=files)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("status") == "success"
        assert d.get("inserted", 0) >= 1

    def test_upload_invalid_format(self, admin_session):
        files = {"file": ("test.txt", io.BytesIO(b"hello"), "text/plain")}
        r = admin_session.post(f"{API}/upload/file", files=files)
        assert r.status_code == 400


# ---------- AI (smoke test - just check streaming endpoint responds) ----------
class TestAI:
    def test_diagnose_endpoint_responds(self, admin_session):
        r = admin_session.get(f"{API}/creatives")
        cid = r.json()["creatives"][0]["_id"]
        # Stream initial chunk only
        with admin_session.post(f"{API}/ai/diagnose", json={"creative_id": cid}, stream=True, timeout=30) as resp:
            assert resp.status_code == 200
            chunk_received = False
            for line in resp.iter_lines(decode_unicode=True):
                if line and line.startswith("data:"):
                    chunk_received = True
                    break
            assert chunk_received, "No SSE chunk received from /ai/diagnose"

    def test_diagnose_invalid_id(self, admin_session):
        r = admin_session.post(f"{API}/ai/diagnose", json={"creative_id": "507f1f77bcf86cd799439011"})
        assert r.status_code == 404

    def test_unauthenticated_diagnose(self):
        r = requests.post(f"{API}/ai/diagnose", json={"creative_id": "507f1f77bcf86cd799439011"})
        assert r.status_code == 401
