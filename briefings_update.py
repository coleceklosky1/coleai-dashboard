#!/usr/bin/env python3
"""
Daily briefings generator for Cole.ai dashboard.

Usage:
  python briefings_update.py

Requires:
  pip install google-genai
  GEMINI_API_KEY environment variable set (free key from https://aistudio.google.com/apikey)

Run this each morning. It writes daily_briefings.js into the dashboard folder,
which the app loads automatically on next page open/refresh.
"""

from google import genai
from google.genai import types
import json
import os
import re
import sys
import time
from datetime import date, timedelta

TODAY = date.today().isoformat()
DASHBOARD_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_PATH = os.path.join(DASHBOARD_DIR, "daily_briefings.js")
HISTORY_PATH = os.path.join(DASHBOARD_DIR, "briefings_history.json")

# Patterns that indicate a URL is a site homepage, not a specific article
HOMEPAGE_RE = re.compile(
    r"^https?://[^/]+/?$"
    r"|^https?://[^/]+/index\.html?$"
    r"|^https?://[^/]+/(home|news|articles|index)/?$",
    re.IGNORECASE,
)


def load_history():
    """Load the rolling 60-day history of previously generated articles."""
    if not os.path.exists(HISTORY_PATH):
        return []
    try:
        with open(HISTORY_PATH, "r", encoding="utf-8") as f:
            history = json.load(f)
        cutoff = (date.today() - timedelta(days=60)).isoformat()
        return [h for h in history if h.get("date", "") >= cutoff]
    except Exception:
        return []


def save_history(history, new_briefings):
    """Append today's articles to the history file."""
    for b in new_briefings:
        history.append({
            "date": TODAY,
            "category": b.get("category", ""),
            "headline": b.get("headline", ""),
            "link": b.get("link", ""),
        })
    with open(HISTORY_PATH, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2, ensure_ascii=False)


def is_article_url(url):
    """Return False if the URL is a homepage rather than a specific article page."""
    if not url or not url.startswith("http"):
        return False
    return not HOMEPAGE_RE.match(url)


def build_prompt(history):
    history_block = ""
    if history:
        lines = [
            f"  [{h['category']}] {h['headline']} — {h['link']}"
            for h in history[-50:]
        ]
        history_block = (
            "PREVIOUSLY COVERED ARTICLES — do NOT repeat any of these, find different ones:\n"
            + "\n".join(lines)
            + "\n\n"
        )

    return f"""Today is {TODAY}. Generate a daily news briefing for Cole, a Chemical Engineering junior at Notre Dame interested in industry careers, energy, and tech.

{history_block}Find exactly 3 real news articles — one for each category below. Do NOT substitute or swap categories.

1. Politics — the single most important hard-news political development of the last 24 HOURS (today or yesterday — no older). Must be a factual news report, NOT an opinion piece, editorial, or commentary. Pick the biggest breaking story, not analysis.
2. Chemical Engineering — process engineering, chemicals, materials, energy tech, or relevant manufacturing news published within the last 7 days.
3. Tech — a technical or industry development in AI, semiconductors, software engineering, hardware, or scientific computing published within the last 7 days. Focus on what was built, discovered, or released — NOT on stock prices, earnings, valuations, or financial performance. Category must be exactly "Tech".

CRITICAL LINK REQUIREMENT: The "link" field MUST be the direct URL to the exact article you are citing — the URL must resolve to a page whose headline matches the headline you provide. Never use a homepage, section page, search page, or a URL that redirects to a different article.
BAD examples: https://reuters.com, https://cen.acs.org/index.html, https://cnbc.com/tech/, https://nytimes.com
GOOD examples: https://cen.acs.org/energy/renewables/2026/05/green-hydrogen-costs.html, https://arstechnica.com/science/2026/05/new-chip-architecture.html
Before returning a link, verify it points to the specific article, not a listing or homepage.

For each article, return a JSON object with exactly these fields:
  category     — must be exactly one of: "Politics", "Chemical Engineering", "Tech"
  headline     — the actual article headline, verbatim
  source       — publication name (e.g. Reuters, WSJ, C&EN, Ars Technica)
  link         — direct URL to the specific article page
  whyItMatters — 1-2 sentences on why this matters to a ChemE student interested in industry careers

CRITICAL JSON RULES — follow exactly:
- Return ONLY a valid JSON array of exactly 3 objects. No markdown, no explanation, no prose before or after.
- Every string value MUST use straight double quotes ". No smart/curly quotes.
- If a value contains a double quote, escape it as \\".
- The output must be parseable by Python's json.loads() with no modifications."""


def generate_briefings():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        sys.exit(
            "Error: GEMINI_API_KEY environment variable not set.\n"
            "Get a free key at https://aistudio.google.com/apikey"
        )

    history = load_history()
    prompt = build_prompt(history)

    client = genai.Client(api_key=api_key)

    last_error = None
    for attempt in range(1, 4):
        print(f"Searching for today's articles ({TODAY})... (attempt {attempt}/3)")
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    tools=[types.Tool(google_search=types.GoogleSearch())],
                    temperature=0.1,
                ),
            )
        except Exception as e:
            last_error = str(e)
            delay = 60 * attempt
            print(f"Attempt {attempt} API error: {e}. Waiting {delay}s before retry...")
            time.sleep(delay)
            continue

        text = response.text or ""

        match = re.search(r"\[.*\]", text, re.DOTALL)
        if not match:
            last_error = f"No JSON array in response:\n{text[:500]}"
            print(f"Attempt {attempt}: no JSON array found. Retrying...")
            time.sleep(30)
            continue

        try:
            briefings = json.loads(match.group())
        except json.JSONDecodeError as e:
            last_error = f"JSON parse error: {e}\nRaw text:\n{text[:500]}"
            print(f"Attempt {attempt} JSON error: {e}. Retrying...")
            time.sleep(30)
            continue

        bad_links = [b for b in briefings if not is_article_url(b.get("link", ""))]
        if bad_links:
            cats = [b.get("category") for b in bad_links]
            last_error = f"Homepage URLs returned for categories: {cats}"
            print(f"Attempt {attempt}: homepage URLs detected {cats}. Retrying...")
            time.sleep(30)
            continue

        # Warn (don't fail) if a duplicate headline slips through
        history_headlines = {h["headline"].lower() for h in history}
        dups = [b for b in briefings if b.get("headline", "").lower() in history_headlines]
        if dups:
            print(f"  Warning: {len(dups)} duplicate headline(s) — keeping result.")

        save_history(history, briefings)
        return briefings

    sys.exit(f"Error: All 3 attempts failed.\nLast error: {last_error}")


def write_js(briefings):
    entries = []
    for i, b in enumerate(briefings):
        entries.append({
            "id": f"auto-{TODAY}-{i + 1}",
            "date": TODAY,
            "category": b.get("category", "World"),
            "headline": b.get("headline", ""),
            "source": b.get("source", ""),
            "link": b.get("link", ""),
            "whyItMatters": b.get("whyItMatters", ""),
        })

    js_entries = json.dumps(entries, indent=2, ensure_ascii=False)

    js = f"""// Auto-generated by briefings_update.py — {TODAY}
// Do not edit manually.
(function () {{
  var todayBriefings = {js_entries};
  try {{
    var raw = localStorage.getItem('briefings');
    var existing = raw ? JSON.parse(raw) : [];
    var filtered = existing.filter(function (b) {{ return b.date !== '{TODAY}'; }});
    localStorage.setItem('briefings', JSON.stringify(filtered.concat(todayBriefings)));
    if (typeof Sync !== 'undefined' && Sync.schedulePush) Sync.schedulePush();
    if (typeof App !== 'undefined' && App.renderBriefings) {{
      App.renderBriefings();
      App.renderToday();
    }}
  }} catch(e) {{}}
}})();
"""

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(js)

    print(f"\n✓ Wrote {len(entries)} briefings to daily_briefings.js\n")
    for b in entries:
        print(f"  [{b['category']:22s}] {b['headline'][:65]}")
        print(f"  {'':22s}  {b['link']}")
    print("\nRefresh Cole.ai in your browser to see today's briefings.")


if __name__ == "__main__":
    briefings = generate_briefings()
    write_js(briefings)
