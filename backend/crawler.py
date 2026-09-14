"""Policy-aware, tiered web data acquisition layer.

Tier 1: standard HTTP fetch (robots-aware, retries/backoff, size/type checks).
Tier 2: real-browser rendering (Playwright) for JavaScript-heavy pages.
Focused crawl of a few relevant pages only. Restrictions (bot challenge, auth,
access denied) are DETECTED and RESPECTED -- never bypassed.
"""
import time
import logging
from datetime import datetime, timezone
from urllib.parse import urljoin, urlparse
from urllib import robotparser

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger("competeiq.crawler")

# ---- Status classifications ----
ACCESSIBLE = "ACCESSIBLE"
JAVASCRIPT_REQUIRED = "JAVASCRIPT_REQUIRED"
PARTIALLY_ACCESSIBLE = "PARTIALLY_ACCESSIBLE"
ROBOTS_RESTRICTED = "ROBOTS_RESTRICTED"
RATE_LIMITED = "RATE_LIMITED"
AUTHENTICATION_REQUIRED = "AUTHENTICATION_REQUIRED"
CAPTCHA_OR_BOT_CHALLENGE = "CAPTCHA_OR_BOT_CHALLENGE"
ACCESS_DENIED = "ACCESS_DENIED"
TIMEOUT = "TIMEOUT"
SITE_ERROR = "SITE_ERROR"
UNKNOWN = "UNKNOWN"

# Restrictions we must respect (never retry / never bypass)
HARD_RESTRICTIONS = {ROBOTS_RESTRICTED, AUTHENTICATION_REQUIRED, CAPTCHA_OR_BOT_CHALLENGE, ACCESS_DENIED}

# ---- Conservative limits ----
MAX_PAGES = 8
MAX_DEPTH = 2
MAX_REQUESTS = 12
MAX_RUNTIME = 90          # seconds per competitor
MAX_PAGE_BYTES = 3 * 1024 * 1024
HTTP_TIMEOUT = 12

BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

RELEVANT_KEYWORDS = ["pricing", "price", "plans", "plan", "features", "feature", "product",
                     "products", "solutions", "specs", "specification", "compare", "faq",
                     "docs", "documentation", "capabilities", "platform", "overview"]

_CHALLENGE_MARKERS = ["just a moment", "checking your browser", "verify you are human",
                      "cf-challenge", "captcha", "recaptcha", "hcaptcha", "attention required",
                      "enable cookies and reload", "ddos protection by", "cf-browser-verification"]
_AUTH_MARKERS = ["sign in to continue", "please log in", "log in to view", "create a free account to view",
                 "you must be logged in", "session expired"]
_JS_MARKERS = ['id="root"', 'id="__next"', 'id="app"', "please enable javascript", "you need to enable javascript"]


def _now():
    return datetime.now(timezone.utc).isoformat()


def _domain(url):
    try:
        return urlparse(url).netloc.lower()
    except Exception:
        return ""


def _norm(url):
    if not url.startswith("http"):
        url = "https://" + url
    return url


def check_robots(url):
    """Return (allowed, reason). Fail-open (allow) if robots can't be read."""
    try:
        parts = urlparse(url)
        robots_url = f"{parts.scheme}://{parts.netloc}/robots.txt"
        rp = robotparser.RobotFileParser()
        rp.set_url(robots_url)
        rp.read()
        allowed = rp.can_fetch(BROWSER_HEADERS["User-Agent"], url)
        return (allowed, "" if allowed else "Disallowed by robots.txt")
    except Exception:
        return (True, "")


def classify(status_code, html_lower, headers):
    """Map an HTTP response to a status classification + human reason + restricted flag."""
    if status_code == 429:
        return RATE_LIMITED, "Server returned 429 (rate limited).", False
    if status_code == 401:
        return AUTHENTICATION_REQUIRED, "Page requires authentication (401).", True
    if status_code == 403:
        if any(m in html_lower for m in _CHALLENGE_MARKERS):
            return CAPTCHA_OR_BOT_CHALLENGE, "Site presented a bot / CAPTCHA challenge.", True
        return ACCESS_DENIED, "Access denied (403).", True
    if status_code >= 500:
        return SITE_ERROR, f"Server error ({status_code}).", False
    if status_code >= 400:
        return SITE_ERROR, f"Client error ({status_code}).", False
    # 2xx / 3xx
    if any(m in html_lower for m in _CHALLENGE_MARKERS):
        return CAPTCHA_OR_BOT_CHALLENGE, "Site presented a bot / CAPTCHA challenge.", True
    if any(m in html_lower for m in _AUTH_MARKERS):
        return AUTHENTICATION_REQUIRED, "Content is behind a login wall.", True
    return ACCESSIBLE, "", False


def _extract(html, url, domain):
    soup = BeautifulSoup(html, "html.parser")
    title = ""
    if soup.title and soup.title.string:
        title = soup.title.string.strip()
    for t in soup(["script", "style", "noscript", "svg", "header", "footer", "nav"]):
        t.extract()
    text = " ".join(soup.get_text(" ").split())
    links = []
    for a in soup.find_all("a", href=True):
        href = urljoin(url, a["href"].split("#")[0])
        if _domain(href) == domain and href.startswith("http"):
            low = href.lower()
            if any(k in low for k in RELEVANT_KEYWORDS):
                links.append(href)
    return title, text, links


def _looks_js_required(html, text):
    hl = html.lower()
    if len(text) < 400 and (any(m in hl for m in _JS_MARKERS) or hl.count("<script") > 8):
        return True
    return False


def _confidence(status, method, text_len):
    if status != ACCESSIBLE:
        return 30
    base = {"user_provided": 90, "browser_rendered": 78, "http": 72}.get(method, 60)
    if text_len < 300:
        base -= 25
    elif text_len > 1500:
        base += 5
    return max(20, min(95, base))


def fetch_http(url):
    """Tier 1. Returns a page dict. Retries only for transient errors; respects Retry-After."""
    domain = _domain(url)
    retries = 2
    for attempt in range(retries + 1):
        try:
            r = requests.get(url, headers=BROWSER_HEADERS, timeout=HTTP_TIMEOUT,
                             allow_redirects=True, stream=True)
            ctype = r.headers.get("content-type", "")
            if "html" not in ctype and "text" not in ctype and ctype:
                r.close()
                return _page(url, domain, SITE_ERROR, "http", "", "", [],
                             reason=f"Unsupported content-type ({ctype}).", ctype=ctype)
            raw = r.content[:MAX_PAGE_BYTES]
            html = raw.decode(r.encoding or "utf-8", errors="ignore")
            status, reason, restricted = classify(r.status_code, html.lower(), r.headers)
            if status == RATE_LIMITED and attempt < retries:
                wait = int(r.headers.get("Retry-After", "3") or "3")
                time.sleep(min(wait, 8))
                continue
            if status == SITE_ERROR and r.status_code >= 500 and attempt < retries:
                time.sleep(1.5 * (attempt + 1))
                continue
            title, text, links = ("", "", [])
            if status == ACCESSIBLE:
                title, text, links = _extract(html, url, domain)
            return _page(url, domain, status, "http", title, text, links,
                         reason=reason, ctype=ctype, html=html, retries=attempt)
        except requests.Timeout:
            if attempt < retries:
                time.sleep(1.5 * (attempt + 1))
                continue
            return _page(url, domain, TIMEOUT, "http", "", "", [], reason="Request timed out.", retries=attempt)
        except Exception as e:
            return _page(url, domain, SITE_ERROR, "http", "", "", [], reason=f"Fetch error: {e}")
    return _page(url, domain, UNKNOWN, "http", "", "", [], reason="Unknown fetch outcome.")


def _page(url, domain, status, method, title, text, links, reason="", ctype="", html="", retries=0):
    return {
        "url": url, "domain": domain, "status": status, "method": method,
        "title": title, "text": (text or "")[:6000], "links": links[:10],
        "reason": reason, "content_type": ctype, "_html": html, "retries": retries,
        "retrieved_at": _now(), "bytes": len(text or ""),
        "confidence": _confidence(status, method, len(text or "")),
    }


async def render_browser(url):
    """Tier 2. Render with a real browser at a human pace. Read PUBLIC content only."""
    domain = _domain(url)
    try:
        from playwright.async_api import async_playwright
    except Exception as e:
        return _page(url, domain, UNKNOWN, "browser_rendered", "", "", [], reason=f"Browser engine unavailable: {e}")
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page(user_agent=BROWSER_HEADERS["User-Agent"],
                                          extra_http_headers={"Accept-Language": "en-US,en;q=0.9"})
            resp = await page.goto(url, wait_until="domcontentloaded", timeout=25000)
            status_code = resp.status if resp else 200
            await page.wait_for_timeout(1200)
            # Dismiss cookie/consent banners (usability, not evasion)
            for label in ["Accept all", "Accept All", "Accept", "I agree", "Got it", "Allow all"]:
                try:
                    btn = page.get_by_role("button", name=label)
                    if await btn.count() > 0:
                        await btn.first.click(timeout=1500)
                        await page.wait_for_timeout(500)
                        break
                except Exception:
                    pass
            # Gentle incremental scroll to trigger lazy content
            for _ in range(4):
                await page.mouse.wheel(0, 1600)
                await page.wait_for_timeout(600)
            html = await page.content()
            await browser.close()
        html = html[: MAX_PAGE_BYTES]
        status, reason, restricted = classify(status_code, html.lower(), {})
        title, text, links = ("", "", [])
        if status == ACCESSIBLE:
            title, text, links = _extract(html, url, domain)
        pg = _page(url, domain, status, "browser_rendered", title, text, links,
                   reason=reason, ctype="text/html", html=html)
        return pg
    except Exception as e:
        msg = str(e).lower()
        if "timeout" in msg:
            return _page(url, domain, TIMEOUT, "browser_rendered", "", "", [], reason="Browser render timed out.")
        return _page(url, domain, SITE_ERROR, "browser_rendered", "", "", [], reason=f"Render error: {e}")


def _seed_urls(base):
    base = base.rstrip("/")
    seeds = [base]
    for s in ["/pricing", "/features", "/products", "/product", "/plans", "/solutions", "/faq"]:
        seeds.append(base + s)
    return seeds


async def acquire(url, competitor_name="", use_browser=True, max_pages=MAX_PAGES,
                  max_runtime=MAX_RUNTIME, max_requests=MAX_REQUESTS):
    """Main entrypoint. Returns rich acquisition result with evidence + provenance + logs."""
    url = _norm(url)
    domain = _domain(url)
    started = time.time()
    logs, pages, failed = [], [], []
    requests_made = 0
    visited = set()

    def log(u, pg):
        logs.append({"ts": _now(), "competitor": competitor_name, "url": u, "status": pg["status"],
                     "method": pg["method"], "reason": pg.get("reason", ""),
                     "retries": pg.get("retries", 0), "confidence": pg["confidence"]})

    allowed, robots_reason = check_robots(url)
    if not allowed:
        pg = _page(url, domain, ROBOTS_RESTRICTED, "http", "", "", [], reason=robots_reason)
        log(url, pg)
        return _result(domain, ROBOTS_RESTRICTED, [], [pg], logs, competitor_name,
                       message="This site's robots.txt disallows automated access. We respect that and did not crawl it.")

    queue = [(u, 0) for u in _seed_urls(url)]
    hard_stop = None

    while queue and len(pages) < max_pages and requests_made < max_requests:
        if time.time() - started > max_runtime:
            break
        u, depth = queue.pop(0)
        if u in visited:
            continue
        visited.add(u)
        requests_made += 1

        pg = fetch_http(u)
        # Escalate to browser if the page looks JS-only
        if use_browser and pg["status"] == ACCESSIBLE and _looks_js_required(pg.get("_html", ""), pg["text"]):
            rendered = await render_browser(u)
            if rendered["status"] == ACCESSIBLE and len(rendered["text"]) > len(pg["text"]):
                pg = rendered
            else:
                pg["status"] = JAVASCRIPT_REQUIRED if not rendered["text"] else pg["status"]
        elif use_browser and pg["status"] in (TIMEOUT, SITE_ERROR) and depth == 0:
            rendered = await render_browser(u)
            if rendered["status"] == ACCESSIBLE:
                pg = rendered

        log(u, pg)
        pg.pop("_html", None)

        if pg["status"] in HARD_RESTRICTIONS:
            # Respect the restriction: stop immediately, no retries, no bypass.
            hard_stop = pg
            failed.append(pg)
            break
        if pg["status"] == ACCESSIBLE and pg["text"]:
            pages.append(pg)
            if depth < MAX_DEPTH:
                for link in pg["links"]:
                    if link not in visited and len(queue) < MAX_REQUESTS:
                        queue.append((link, depth + 1))
        else:
            failed.append(pg)
        time.sleep(0.4)  # polite pacing

    # Determine overall status
    if hard_stop is not None:
        overall = hard_stop["status"]
        message = _restriction_message(overall)
    elif pages:
        overall = ACCESSIBLE if not failed else PARTIALLY_ACCESSIBLE
        message = ""
    else:
        if failed and all(f["status"] == JAVASCRIPT_REQUIRED for f in failed):
            overall = JAVASCRIPT_REQUIRED
            message = "This site relies on JavaScript we could not render. You can paste its content or provide a specific URL."
        elif failed:
            overall = failed[0]["status"]
            message = failed[0].get("reason") or _restriction_message(overall)
        else:
            overall = UNKNOWN
            message = "No public content could be collected."

    return _result(domain, overall, pages, failed, logs, competitor_name, message=message)


def _restriction_message(status):
    return {
        ROBOTS_RESTRICTED: "This site's robots.txt disallows automated access, which we respect.",
        AUTHENTICATION_REQUIRED: "This content sits behind a login. We don't bypass authentication — paste the page content instead.",
        CAPTCHA_OR_BOT_CHALLENGE: "This site uses a bot/CAPTCHA challenge. We never attempt to defeat it — you can paste the page content instead.",
        ACCESS_DENIED: "The site denied automated access. You can paste the page content or provide a specific URL.",
        RATE_LIMITED: "The site is rate-limiting requests. Please retry later.",
        TIMEOUT: "The site did not respond in time. Please retry later.",
        SITE_ERROR: "The site returned an error. Please retry later.",
    }.get(status, "Some content could not be collected.")


def _result(domain, overall, pages, failed, logs, competitor_name, message=""):
    combined = " ".join(f"[{p['url']}] {p['text']}" for p in pages)[:9000]
    confidences = [p["confidence"] for p in pages] or [0]
    sources = [{
        "url": p["url"], "domain": p["domain"], "title": p["title"], "method": p["method"],
        "content_type": p["content_type"], "status": p["status"], "confidence": p["confidence"],
        "retrieved_at": p["retrieved_at"], "bytes": p["bytes"],
    } for p in pages]
    return {
        "ok": bool(pages),
        "overall_status": overall,
        "domain": domain,
        "title": pages[0]["title"] if pages else "",
        "text": combined,               # backward-compatible field for existing prompts
        "combined_text": combined,
        "pages": sources,
        "pages_analyzed": len(pages),
        "sources_used": len(sources),
        "failed_pages": [{"url": f["url"], "status": f["status"], "reason": f.get("reason", "")} for f in failed],
        "extraction_confidence": round(sum(confidences) / len(confidences)),
        "restricted": overall in HARD_RESTRICTIONS,
        "message": message,
        "logs": logs,
        "collected_at": _now(),
    }


def from_user_text(text, competitor_name="", source_url=""):
    """Build an acquisition result from user-provided page content (clearly labelled)."""
    text = " ".join((text or "").split())[:9000]
    src = {"url": source_url or "user-provided", "domain": _domain(source_url) if source_url else "user-provided",
           "title": "User-provided content", "method": "user_provided", "content_type": "text/plain",
           "status": ACCESSIBLE, "confidence": 90, "retrieved_at": _now(), "bytes": len(text)}
    return {
        "ok": bool(text), "overall_status": ACCESSIBLE if text else UNKNOWN, "domain": src["domain"],
        "title": src["title"], "text": text, "combined_text": text, "pages": [src] if text else [],
        "pages_analyzed": 1 if text else 0, "sources_used": 1 if text else 0, "failed_pages": [],
        "extraction_confidence": 90 if text else 0, "restricted": False,
        "message": "Analyzed from user-provided content.", "logs": [], "collected_at": _now(),
    }
