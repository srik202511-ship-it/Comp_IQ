# Plan: Fix "comparison failing" (competitor analysis errors)

## What's happening now
On the Competitors page, some competitors finish with **Analyzed** (e.g. BYD) while others show
**Error** (e.g. Tesla, Toyota). "Error" happens when the app fetches the competitor's website but
the site blocks automated access or returns no usable text. Large consumer sites (tesla.com,
toyota.com, etc.) commonly do this. When that happens today the competitor is marked Error with a
generic message, and it contributes nothing to the comparison.

Two distinct things are going on:
1. **Website fetch failures** for protected sites → the real cause of the red "Error".
2. **Mismatched comparison** (Postman vs car brands) → the engine will correctly label these
   "NOT COMPARABLE". This is expected behaviour, not a bug, and will be made clearer.

## What will change

### 1. Make website fetching more resilient
- Send realistic browser-style request headers, follow redirects, use a longer timeout, and retry
  once before giving up.
- If a specific page path fails (e.g. `/pricing`, `/features`, or a deep URL like
  `toyota.com.au/bz4x-ev`), fall back to the site's home page so partial content can still be read.
- Result: several sites that fail today will succeed. Some heavily protected sites may still block
  automated access — no tool can guarantee otherwise without violating their terms.

### 2. Clear, honest errors instead of a blank "Error"
- When a site genuinely can't be read, show a plain-language reason (e.g. "This site blocked
  automated access" or "No readable content found") on the competitor row and in the analysis run.
- Keep the existing **Analyze/Retry** action so the user can try again.
- The Apples-to-Apples run continues with whatever competitors did succeed, and lists the ones that
  couldn't be analyzed with their reason, rather than failing the whole run.

### 3. Manual details fallback for blocked sites
- For any competitor that can't be crawled, let the user **paste a short description / key details**
  (what the product is, pricing, notable features) as an alternative source. The AI then analyzes
  that text instead of the website, so the competitor can still be scored.
- Anything derived this way is clearly marked as coming from user-provided info (not the live site),
  keeping the "no fabricated data" principle intact.

### 4. Make "NOT COMPARABLE" obvious for mismatched inputs
- When the chosen competitors are a different category from the product (e.g. Postman vs car
  brands), the result already reads NOT COMPARABLE. A short note will make clear this is a
  legitimate outcome (the products aren't a fair benchmark), not an error.

## Decisions / assumptions
- **Assumption:** Keep using the built-in crawler (improved as above). No paid third-party scraping
  service is added. That would raise reliability on protected sites but needs an external account /
  key and cost — can be added later if desired.
- **Assumption:** The manual-details fallback (item 3) is included, because it's the only reliable
  way to get past sites that permanently block crawling.
- **Assumption:** No change to how scores are calculated; this is purely about getting data in and
  reporting failures clearly.

## Open question
- Some very large sites (Tesla, Toyota) may still block automated access even after the improvements
  in item 1. Is the **manual-details fallback (item 3)** an acceptable way to handle those, or is a
  paid scraping service preferred despite the added cost and setup? (Default if no answer: ship items
  1, 2 and 3; skip the paid service.)
