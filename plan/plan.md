# Plan: Policy-aware, tiered web data acquisition layer

## Goal
Replace the current single-shot website fetch with a responsible, multi-tier crawler that gathers
publicly available competitor information, renders JavaScript pages when needed, detects when a site
restricts automated access, and always keeps the analysis running on whatever was legitimately
obtained. It will never attempt to defeat security controls (CAPTCHA, bot challenges, auth,
paywalls, IP/fingerprint evasion, robots.txt circumvention).

This crawler becomes the shared data source for both "Analyze competitor" and the Apples-to-Apples
comparison run.

## What will be built

### Tiered acquisition
- **Tier 1 – HTTP fetch:** improved standard retrieval (browser-style headers, redirects, robots.txt
  check, content-type/size validation, retry with backoff). Extracts titles, headings, product/
  feature/pricing/spec/FAQ text and relevant links.
- **Tier 2 – Browser rendering:** when a page needs JavaScript, render it in a real browser and read
  the public content — handling cookie banners, tabs/accordions, lazy-loaded sections, pagination,
  and incremental scrolling, at a normal human pace with pauses. Interaction is for usability and
  responsible pacing only, never to evade detection.
- **Focused crawl:** only follow a small number of relevant pages (pricing, products, features,
  specs, plans, FAQ, docs), not the whole site, with conservative limits and URL de-duplication.

### Restriction detection & safe fallback
- Classify each fetch into a clear status: ACCESSIBLE, JAVASCRIPT_REQUIRED, PARTIALLY_ACCESSIBLE,
  ROBOTS_RESTRICTED, RATE_LIMITED, AUTHENTICATION_REQUIRED, CAPTCHA_OR_BOT_CHALLENGE, ACCESS_DENIED,
  TIMEOUT, SITE_ERROR, UNKNOWN.
- On an explicit restriction (bot challenge, auth, access denied): **stop immediately, do not retry,
  attempt no bypass**, and show the user a clear message. On HTTP 429: respect Retry-After. On
  temporary errors: a few backoff retries only.
- Legitimate fallbacks offered to the user: **paste page content / provide a specific URL** so the
  competitor can still be analyzed from user-supplied material (clearly labelled as such).

### Evidence & provenance
- Every extracted data point keeps its source: competitor, source URL, domain, page title,
  retrieval time, acquisition method (http / browser_rendered / user_provided), content type,
  extraction status, and a confidence score.
- Evidence-first: if a fact isn't found in the collected sources it is recorded as "Not found",
  never guessed. This feeds the existing Evidence/Data-Quality view.

### Dashboard & UX
- Each competitor row shows a **data-collection status**: green collected, yellow partial, blue
  JavaScript-rendered, orange some pages unavailable, red site restricts automated access — plus
  last successful crawl, pages analyzed, sources used, extraction confidence, and any failed pages.
- Failures are never shown as a bare "Scraping failed." They explain what happened and offer
  actions: **View Sources · Retry Later · Provide Page Manually**.
- The comparison continues using all competitors that succeeded; missing competitors/data are
  clearly marked unavailable rather than blocking the run.

### Logging
- Structured per-URL crawl logs (timestamp, competitor, URL, status, method, classification,
  success/failure + reason, retry count, confidence) for transparency and debugging.

## Decisions / assumptions
- **Compliance (fixed):** no anti-bot, CAPTCHA, auth, paywall, or access-control bypass of any kind;
  restrictions are detected and respected. This is a hard boundary of the design.
- **Assumption – browser engine in the backend:** Tier 2 uses Playwright with a headless Chromium
  installed into the backend. This adds a large dependency and makes crawls noticeably slower
  (seconds per rendered page). See open question — if the hosting container can't run it, Tier 2 is
  skipped and the system runs on Tier 1 + manual fallback.
- **Assumption – crawls run in the background:** because multi-page rendered crawls can take up to a
  minute or two per competitor, analysis runs as a background job and the competitor row updates its
  status live, instead of the user waiting on a frozen button.
- **Assumption – conservative default limits:** ~8 pages per competitor, depth 2, ~12 requests per
  domain, ~90s max runtime per competitor, ~3 MB max page size. Tunable later.
- **Assumption – manual fallback = paste text / provide URL** (no PDF/file upload in this round;
  can be added later if wanted).
- **Assumption – no paid scraping/proxy/anti-bot service** is used (consistent with the earlier
  decision). Heavily protected sites (e.g. some large consumer brands) may therefore remain
  uncollectable, which the UI will state plainly.
- **Assumption – scoring logic unchanged:** this work only changes how evidence is gathered and how
  status is reported; the comparability and competitive scoring stay as-is.

## Open question
- **Browser rendering in the backend:** proceed with installing Playwright + headless Chromium for
  Tier 2 (heavier, slower, more memory), or keep the backend HTTP-only (Tier 1 improvements +
  restriction detection + manual fallback) and rely on manual paste for JavaScript-only sites?
  Default if no answer: attempt to enable Tier 2 browser rendering, and automatically fall back to
  Tier 1 + manual paste if the environment cannot support a browser.
