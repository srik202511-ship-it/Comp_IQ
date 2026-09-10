# PRD — AI Competitor & Product Analysis Dashboard (CompeteIQ)

## Original Problem Statement
Build a professional competitive-intelligence SaaS MVP. Core journey:
Login → Add competitors → Analyze (scrape website + AI) → Compare (pricing/features/positioning)
→ Visualize (radar, bar, 2-axis positioning, comparison table) → AI recommendations (SWOT,
executive summary, where we are weaker / competitors better / opportunities, recommended actions).
Primary value: "Don't just show competitor data — tell me what it means and what to do next."
Flow: DATA → COMPARISON → INSIGHT → ACTION.

## User Choices
- AI model: GPT-5.4 (OpenAI) via Emergent Universal Key
- Auth: simple email + password (JWT, database-backed)
- Analysis: live website scraping + AI reasoning
- "Our Product": pre-filled demo profile (NimbusIQ, SaaS observability)
- Pre-loaded demo dataset (SaaS observability vertical)

## Architecture
- Backend: FastAPI + MongoDB (motor). JWT Bearer auth (bcrypt hashing). emergentintegrations LlmChat (openai/gpt-5.4).
- Scraping: requests + BeautifulSoup (homepage + /pricing + /features), fed to GPT-5.4 for structured JSON.
- Frontend: React 19 + react-router 7, recharts, sonner, shadcn/ui, Tailwind. Dark premium SaaS theme (Outfit/Inter/JetBrains Mono).
- Auth token stored in localStorage (`ciq_token`), sent as Authorization: Bearer.

## User Personas
- Founders / product / strategy leads and executives who need a fast competitive read and prioritized actions.

## Core Requirements (static)
Login, company profile ("Our Product"), competitor CRUD, live analysis, scores, pricing comparison,
feature matrix, SWOT, radar/bar/positioning charts, comparison table, AI insights, recommended actions,
data-reliability labeling (Confirmed / AI-inferred / Not publicly available), no fabricated data.

## Implemented (2026-06)
- JWT auth: register/login/me/forgot-password; protected routes; demo account auto-seeded (demo@competeiq.ai / demo1234).
- Demo dataset auto-seeded per user: NimbusIQ + Datadog/Dynatrace/New Relic (analyzed) + full precomputed insights.
- Competitors: list table (status badges, actions), Add dialog, live scrape+GPT-5.4 Analyze, Refresh, View detail, Delete.
- Dashboard: 6 score cards + methodology modal, AI executive summary, pricing comparison (table+bar),
  feature matrix (✓/✕/— with category filter), radar chart, 2-axis positioning map, SWOT grid, AI insights, recommended actions.
- Compare page: sortable comparison table, overall/feature bar charts, feature matrix, pricing, positioning.
- AI Insights page: executive summary + 3 insight categories + recommended actions with status toggle (Not Started/In Progress/Completed).
- SWOT page, Settings page (edit company profile, reset demo).
- AI insight regeneration (/insights/generate) and per-competitor analysis, both real GPT-5.4 calls.
- Verified: backend curl (all flows incl. live grafana.com analyze) + testing agent E2E (100% backend & frontend).

## Backlog
- P1: Export to PDF/Excel, competitor analysis history, saved comparison views, custom scoring weights, more chart filters.
- P1 (hardening): async/threadpool scraping to avoid event-loop blocking, login rate limiting/brute-force lockout, AI JSON retry-on-parse-fail.
- P2: automated monitoring, email/news alerts, social & review analysis, market-share data, forecasting, team collaboration, RBAC, API integrations.

## Next Tasks
- Gather user feedback on demo; prioritize export + refresh-history if requested.
