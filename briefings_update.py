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

Robustness:
  - Tries several Gemini models in fallback order (handles overload / quota).
  - Validates every article link with a real HTTP request, so dead /
    hallucinated URLs are caught and regenerated instead of shipped.
  - As a last resort, a link that still cannot be verified is replaced with a
    Google search URL for the headline, which always resolves to the article.
"""

from google import genai
from google.genai import types
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
import urllib.error
from datetime import date, timedelta

TODAY = date.today().isoformat()
DASHBOARD_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_PATH = os.path.join(DASHBOARD_DIR, "daily_briefings.js")
HISTORY_PATH = os.path.join(DASHBOARD_DIR, "briefings_history.json")

# Models tried in order — if one is overloaded (503) or quota-limited (429),
# the next is attempted. All support google_search grounding.
MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-flash-lite",
    "gemini-flash-latest",
]
MAX_ATTEMPTS = 8

BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# Patterns that indicate a URL is a site homepage, not a specific article
HOMEPAGE_RE = re.compile(
    r"^https?://[^/]+/?$"
    r"|^https?://[^/]+/index\.html?$"
    r"|^https?://[^/]+/(home|news|articles|index)/?$",
    re.IGNORECASE,
)

# HTTP statuses that mean "the page exists but the server is blocking our bot."
# We treat these as reachable rather than dead.
BLOCKED_OK = {401, 403, 405, 406, 409, 429, 999}


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


def _request(url, method, timeout):
    req = urllib.request.Request(url, method=method, headers=BROWSER_HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return 200 <= resp.status < 400


def link_is_live(url, timeout=12):
    """Make a real HTTP request to confirm the URL resolves to a live page.

    Tries HEAD first (cheap), falls back to GET when a server rejects HEAD.
    Bot-blocking statuses (403/405/etc.) count as live since the page exists.
    DNS failures, connection errors, and 404/410 count as dead.
    """
    if not is_article_url(url):
        return False
    for method in ("HEAD", "GET"):
        try:
            return _request(url, method, timeout)
        except urllib.error.HTTPError as e:
            if e.code in BLOCKED_OK:
                return True
            if e.code in (400, 405, 501) and method == "HEAD":
                continue  # server dislikes HEAD — retry with GET
            return False
        except Exception:
            if method == "HEAD":
                continue  # retry with GET before giving up
            return False
    return False


def google_search_url(headline, source):
    """A search URL that always resolves and surfaces the real article."""
    q = urllib.parse.quote_plus(f"{headline} {source}".strip())
    return f"https://www.google.com/search?q={q}"


def build_prompt(history, bad_notes=""):
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

{bad_notes}{history_block}Find exactly 3 real news articles — one for each category below. Do NOT substitute or swap categories.

1. Politics — the single most important hard-news political development of the last 24 HOURS (today or yesterday — no older). Must be a factual news report, NOT an opinion piece, editorial, or commentary. Pick the biggest breaking story, not analysis.
2. Chemical Engineering — process engineering, chemicals, materials, energy tech, or relevant manufacturing news published within the last 7 days. The article should be primarily technical or scientific — some financial context is fine but the core must be about the chemistry, process, or engineering.
3. Tech — a technical or industry development in AI, semiconductors, software engineering, hardware, or scientific computing published within the last 7 days. The article should be primarily about what was built, discovered, or released — not purely a financial story. Some financial context is fine but the core of the article must be technical. Category must be exactly "Tech".

CRITICAL LINK REQUIREMENT: The "link" field MUST be the direct URL to the exact article you are citing. It must be a real, currently-live URL that you found via search — never guess or construct a URL from a pattern. The page must load (no 404s) and its headline must match the headline you provide. Never use a homepage, section page, or search page.
BAD examples: https://reuters.com, https://cen.acs.org/index.html, https://cnbc.com/tech/, https://nytimes.com
GOOD examples: https://cen.acs.org/energy/renewables/2026/05/green-hydrogen-costs.html, https://arstechnica.com/science/2026/05/new-chip-architecture.html

For each article, return a JSON object with exactly these fields:
  category     — must be exactly one of: "Politics", "Chemical Engineering", "Tech"
  headline     — the actual article headline, verbatim
  source       — publication name (e.g. Reuters, WSJ, C&EN, Ars Technica)
  link         — direct, live URL to the specific article page
  whyItMatters — 1-2 sentences on why this matters to a ChemE student interested in industry careers

CRITICAL JSON RULES — follow exactly:
- Return ONLY a valid JSON array of exactly 3 objects. No markdown, no explanation, no prose before or after.
- Every string value MUST use straight double quotes ". No smart/curly quotes.
- If a value contains a double quote, escape it as \\".
- The output must be parseable by Python's json.loads() with no modifications."""


def generate_once(client, model, prompt):
    """One API call → parsed list of briefing dicts. Raises on failure."""
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            tools=[types.Tool(google_search=types.GoogleSearch())],
            temperature=0.1,
        ),
    )
    text = response.text or ""
    match = re.search(r"\[.*\]", text, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON array in response: {text[:300]}")
    return json.loads(match.group())


def validate_links(briefings):
    """Return list of indices whose link is dead/unreachable."""
    bad = []
    for i, b in enumerate(briefings):
        url = b.get("link", "")
        live = link_is_live(url)
        status = "ok" if live else "DEAD"
        print(f"    link [{b.get('category','?')}] {status}: {url}")
        if not live:
            bad.append(i)
    return bad


def generate_briefings():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        sys.exit(
            "Error: GEMINI_API_KEY environment variable not set.\n"
            "Get a free key at https://aistudio.google.com/apikey"
        )

    history = load_history()
    client = genai.Client(api_key=api_key)

    bad_notes = ""
    best = None          # briefings with the fewest dead links seen so far
    best_bad = None      # the dead-link indices for `best`
    last_error = None

    for attempt in range(1, MAX_ATTEMPTS + 1):
        model = MODELS[(attempt - 1) % len(MODELS)]
        print(f"Attempt {attempt}/{MAX_ATTEMPTS} using {model} ({TODAY})...")
        prompt = build_prompt(history, bad_notes)

        try:
            briefings = generate_once(client, model, prompt)
        except Exception as e:
            last_error = str(e)
            delay = min(20 * attempt, 75)
            print(f"  API/parse error: {str(e)[:160]} — waiting {delay}s")
            time.sleep(delay)
            continue

        if not isinstance(briefings, list) or len(briefings) < 3:
            last_error = f"Expected 3 briefings, got: {briefings}"
            print("  Bad structure, retrying...")
            continue

        print("  Validating links...")
        bad = validate_links(briefings)

        if not bad:
            print("  All links verified live.")
            save_history(history, briefings)
            return briefings

        # Track the best partial result so we can salvage it if needed.
        if best is None or len(bad) < len(best_bad):
            best, best_bad = briefings, bad

        dead = [f"{briefings[i].get('category')}: {briefings[i].get('link')}" for i in bad]
        bad_notes = (
            "IMPORTANT: On the previous attempt these links were DEAD (404 or "
            "unreachable). Find DIFFERENT real articles with working URLs:\n  "
            + "\n  ".join(dead) + "\n\n"
        )
        print(f"  {len(bad)} dead link(s); regenerating those categories...")
        time.sleep(5)

    # Could not get a fully-clean set. Salvage the best one, replacing any
    # remaining dead links with a Google search URL (always resolves).
    if best is not None:
        for i in best_bad:
            b = best[i]
            b["link"] = google_search_url(b.get("headline", ""), b.get("source", ""))
            print(f"  Fallback search link for {b.get('category')}: {b['link']}")
        save_history(history, best)
        return best

    sys.exit(f"Error: All {MAX_ATTEMPTS} attempts failed.\nLast error: {last_error}")


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
