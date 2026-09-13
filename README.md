# CompeteIQ — AI Competitor & Product Analysis Dashboard

CompeteIQ is a competitive-intelligence SaaS that turns raw competitor data into
decisions. Instead of just showing you what competitors do, it tells you **what it
means and what to do next**.

**Core journey:** `Login → Set up "Our Product" → Add competitors → Analyze (live
website scrape + AI) → Compare (pricing / features / positioning) → Read AI insights
(SWOT, executive summary, opportunities) → Act on prioritized recommendations.`

The guiding flow is: **DATA → COMPARISON → INSIGHT → ACTION.**

---

## Table of Contents
1. [What you can do](#what-you-can-do)
2. [Getting started (log in)](#getting-started-log-in)
3. [Step-by-step usage guide](#step-by-step-usage-guide)
4. [Page-by-page reference](#page-by-page-reference)
5. [How data reliability works](#how-data-reliability-works)
6. [Tech stack](#tech-stack)
7. [Running locally / architecture notes](#running-locally--architecture-notes)
8. [API reference](#api-reference)
9. [Troubleshooting](#troubleshooting)

---

## What you can do
- **Profile your own product** ("Our Product") manually or by auto-analyzing your website.
- **Add & manage competitors** (create, refresh, view, delete).
- **Analyze any competitor** with a live website scrape + GPT-powered structured analysis.
- **Compare** everyone side-by-side: scores, pricing, feature matrix, radar, and a
  2-axis positioning map.
- **Get AI insights**: an executive summary, where you're weaker, where competitors
  are better, and prioritized opportunities.
- **See a SWOT** grid backed by evidence from the data.
- **Track recommended actions** with statuses (Not Started / In Progress / Completed).
- **Reset to the demo dataset** at any time from Settings.

---

## Getting started (log in)

Open the app URL. You'll land on the **Login** page.

### Option A — Use the demo account (fastest)
A pre-seeded demo account lets you explore a fully populated dashboard immediately:

- **Email:** `demo@competeiq.ai`
- **Password:** `demo1234`

The demo comes pre-loaded with **NimbusIQ** (a SaaS observability product) as "Our
Product" and **Datadog, Dynatrace, and New Relic** as already-analyzed competitors,
plus a complete set of AI insights.

### Option B — Create your own account
1. Switch to **Sign up** on the login screen.
2. Enter your name (optional), email, and a password (min. 6 characters).
3. On first login your account is auto-seeded with the same demo dataset so you have
   something to explore. The moment you analyze your own website or add your own
   competitors, the demo data is cleared out and replaced with your real data.

> Forgot your password? The "Forgot password" link acknowledges the request; in this
> MVP no email is actually sent (the request is just logged server-side).

---

## Step-by-step usage guide

### 1. Set up "Our Product"
Go to **Settings**. You can either:
- **Fill in the profile manually** — company name, industry, website, product name,
  category, description, target customers, value proposition, differentiators, use
  cases, features, and pricing; **or**
- **Auto-analyze your website** — paste your product URL and let the AI scrape it and
  pre-fill the profile for you.

This "Our Product" profile is the baseline every competitor is compared against.

### 2. Add competitors
Go to **Competitors → Add competitor**. Provide at least the **company name** and
**website** (the website is what gets scraped). Optionally add industry, product name,
category, target market, and notes. New competitors start with a **Pending** status.

### 3. Analyze a competitor
On the Competitors page, click **Analyze** on a competitor row. CompeteIQ will:
1. Scrape their homepage plus `/pricing` and `/features` pages.
2. Feed that text to the AI to extract a structured profile: description, products,
   value props, pricing (with a confidence label), features, scores, and their key
   strength/weakness relative to your product.

Status changes to **Analyzed** on success, or **Error** if the site couldn't be
retrieved (check the URL and retry). Use **Refresh** to re-run analysis later.

### 4. Generate AI insights
Once you have **at least one analyzed competitor** and an "Our Product" profile, open
**Insights** (or the Dashboard) and generate the report. The AI builds:
- An **executive summary** (position, biggest advantage/weakness/threat/opportunity).
- A **feature matrix** across everyone.
- A **pricing comparison** and **positioning** map.
- A **SWOT** with supporting evidence.
- **Insights**: where you're weaker, where competitors beat you, and opportunities.
- **Recommended actions** with P0/P1/P2 priorities.

### 5. Compare & visualize
Open **Compare** and **Dashboard** to view sortable comparison tables, overall/feature
bar charts, the radar chart, and the 2-axis positioning map.

### 6. Act
On **Insights**, toggle each recommended action between **Not Started → In Progress →
Completed** to track execution.

### 7. Reset anytime
In **Settings**, use **Reset demo** to wipe your data and reload the original demo
dataset — handy for demos or starting over.

---

## Page-by-page reference

| Page | Route | What it does |
|------|-------|--------------|
| **Login** | `/login` | Sign in, sign up, or request a password reset. |
| **Dashboard** | `/` | 6 score cards + methodology modal, AI executive summary, pricing comparison (table + bar), feature matrix with category filter, radar chart, 2-axis positioning map, SWOT grid, AI insights, and recommended actions. |
| **Competitors** | `/competitors` | Competitor table with status badges; Add, Analyze, Refresh, View, and Delete. |
| **Compare** | `/compare` | Sortable comparison table, overall/feature bar charts, feature matrix, pricing, and positioning. |
| **Insights** | `/insights` | Executive summary + three insight categories + recommended actions with status toggles. |
| **SWOT** | `/swot` | Strengths / Weaknesses / Opportunities / Threats grid backed by evidence. |
| **Settings** | `/settings` | Edit the "Our Product" profile, auto-analyze your website, and reset the demo data. |

All pages except Login are protected — you must be authenticated to view them.

---

## How data reliability works
CompeteIQ is designed to **never fabricate facts**:
- Pricing and facts are extracted **only from scraped website text**.
- If a value isn't publicly available, it's labeled **"Not publicly available"**.
- Pricing carries a **confidence** label (High / Medium / Low) and a **source URL**.
- **Scores are AI-derived estimates** (clearly baseline/inferred), not confirmed facts.

This keeps confirmed data and AI inference clearly separated so you can trust what you see.

---

## Tech stack
- **Frontend:** React 19, react-router 7, Tailwind CSS, shadcn/ui, Recharts, sonner,
  framer-motion. Dark, premium SaaS theme.
- **Backend:** FastAPI + MongoDB (Motor async driver).
- **Auth:** Email + password with JWT (7-day tokens), bcrypt password hashing.
- **AI:** OpenAI **GPT-5.4** via the Emergent Universal Key (`emergentintegrations`).
- **Scraping:** `requests` + BeautifulSoup (homepage + `/pricing` + `/features`).

---

## Running locally / architecture notes
The app runs as three services managed by supervisor:

- **Backend** — FastAPI on `0.0.0.0:8001`. All routes are prefixed with `/api`.
- **Frontend** — React app; talks to the backend only via `REACT_APP_BACKEND_URL`.
- **MongoDB** — accessed via the backend's `MONGO_URL`.

Restart services with:
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
sudo supervisorctl restart all
```

### Environment variables
**backend/.env**
- `MONGO_URL` — MongoDB connection string.
- `DB_NAME` — database name.
- `JWT_SECRET` — secret used to sign JWT tokens.
- `EMERGENT_LLM_KEY` — Emergent Universal Key used for AI calls.
- `CORS_ORIGINS` — comma-separated allowed origins (defaults to `*`).

**frontend/.env**
- `REACT_APP_BACKEND_URL` — external URL of the backend (used for all API calls).

> Do not hardcode URLs or ports; the frontend always calls the backend through
> `REACT_APP_BACKEND_URL`, and every backend route is under `/api`.

---

## API reference
All endpoints are prefixed with `/api`. Protected routes require an
`Authorization: Bearer <token>` header (token returned by login/register).

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create an account; returns a JWT and user. |
| POST | `/api/auth/login` | Log in; returns a JWT and user. |
| POST | `/api/auth/forgot-password` | Acknowledge a reset request (no email sent in MVP). |
| GET | `/api/auth/me` | Get the current authenticated user. |

### Company ("Our Product")
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/company` | Get your product profile. |
| PUT | `/api/company` | Create/update your product profile. |
| POST | `/api/company/analyze` | Scrape + AI-analyze your website to build the profile. |

### Competitors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/competitors` | List your competitors. |
| POST | `/api/competitors` | Add a competitor. |
| POST | `/api/competitors/{id}/analyze` | Scrape + AI-analyze a competitor. |
| DELETE | `/api/competitors/{id}` | Delete a competitor. |

### Insights & actions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/insights` | Get the current insights report. |
| POST | `/api/insights/generate` | Generate a fresh AI insights report. |
| PUT | `/api/actions/{id}` | Update a recommended action's status. |
| POST | `/api/reset-demo` | Wipe your data and reload the demo dataset. |

---

## Troubleshooting
- **"Could not retrieve website data"** — the target site couldn't be scraped. Check
  the URL is correct and publicly reachable, then retry.
- **"AI analysis failed. Please retry."** — a transient AI error; retry the analyze
  action. If it persists, verify `EMERGENT_LLM_KEY` is set on the backend.
- **"Set up your company profile first."** — generate insights only after saving your
  "Our Product" profile in Settings.
- **"Analyze at least one competitor first."** — you need at least one competitor with
  an **Analyzed** status before generating insights.
- **Stuck on a loading spinner after login** — the session is being verified; if it
  never resolves, confirm the backend is running (`sudo supervisorctl status`).
