from __future__ import annotations

import json
import threading
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor
from io import StringIO
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import feedparser
import pandas as pd
import requests
from apscheduler.schedulers.background import BackgroundScheduler
from flask import Flask, jsonify, render_template

try:
    from googlenewsdecoder import new_decoderv1
except Exception:
    new_decoderv1 = None

app = Flask(__name__)

NEWS_RSS_URL = "https://news.google.com/rss/search?q=politics+india+election+results&hl=en-IN"
ECI_URL = "https://results.eci.gov.in"
POLL_SECONDS = 300
SNAPSHOT_DIR = Path(__file__).resolve().parent / "snapshots"
SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-IN,en;q=0.9",
}

state_lock = threading.Lock()
latest_state: dict = {
    "last_updated": None,
    "news": [],
    "election": {
        "status": "inactive",
        "message": "Not collected yet",
        "table": [],
        "columns": [],
        "source": ECI_URL,
    },
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def decode_google_news_link(link: str) -> str:
    if not link:
        return ""

    if new_decoderv1 is not None:
        try:
            decoded = new_decoderv1(link)
            if isinstance(decoded, dict) and decoded.get("status") and decoded.get("decoded_url"):
                return str(decoded.get("decoded_url"))
        except Exception:
            pass

    try:
        parsed = urlparse(link)
        params = parse_qs(parsed.query)
        direct = params.get("url", [""])[0]
        if direct:
            return direct
    except Exception:
        pass

    try:
        response = requests.get(link, headers=DEFAULT_HEADERS, timeout=4, allow_redirects=True)
        final = response.url or link
        if "news.google.com" not in final:
            return final
    except Exception:
        pass

    return link


def fetch_live_news(limit: int = 10) -> list[dict]:
    feed = feedparser.parse(NEWS_RSS_URL)
    entries = list(feed.entries[:limit])
    raw_links = [entry.get("link", "") for entry in entries]

    with ThreadPoolExecutor(max_workers=4) as executor:
        decoded_links = list(executor.map(decode_google_news_link, raw_links))

    rows: list[dict] = []
    for idx, entry in enumerate(entries):
        raw_link = raw_links[idx]
        rows.append(
            {
                "title": entry.get("title", "").strip(),
                "source": entry.get("source", {}).get("title", "Google News RSS")
                if isinstance(entry.get("source"), dict)
                else "Google News RSS",
                "published": entry.get("published", ""),
                "summary": entry.get("summary", ""),
                "google_link": raw_link,
                "publisher_link": decoded_links[idx] if idx < len(decoded_links) else raw_link,
            }
        )

    return rows


def choose_primary_table(tables: list[pd.DataFrame]) -> pd.DataFrame | None:
    if not tables:
        return None

    best_df = None
    best_score = -1

    for df in tables:
        cols = " ".join(str(c).lower() for c in df.columns)
        score = len(df)

        if any(k in cols for k in ["party", "alliance"]):
            score += 8
        if any(k in cols for k in ["leading", "lead", "won", "trend"]):
            score += 8
        if any(k in cols for k in ["seat", "constituency", "candidate"]):
            score += 4

        if score > best_score:
            best_score = score
            best_df = df

    return best_df


def fetch_live_election_table() -> dict:
    fallback_schedule = [
        {"region": "West Bengal", "leading": "Final Phase Polling", "party": "April 29, 2026", "leadMargin": "Live Now", "round": "Assembly 2026"},
        {"region": "Assam", "leading": "Upcoming Counting", "party": "May 4, 2026", "leadMargin": "Scheduled", "round": "Assembly 2026"},
        {"region": "Kerala", "leading": "Upcoming Counting", "party": "May 4, 2026", "leadMargin": "Scheduled", "round": "Assembly 2026"},
        {"region": "Tamil Nadu", "leading": "Upcoming Counting", "party": "May 4, 2026", "leadMargin": "Scheduled", "round": "Assembly 2026"},
        {"region": "Puducherry", "leading": "Upcoming Counting", "party": "May 4, 2026", "leadMargin": "Scheduled", "round": "Assembly 2026"}
    ]
    fallback_cols = ["region", "leading", "party", "leadMargin", "round"]

    try:
        response = requests.get(ECI_URL, headers=DEFAULT_HEADERS, timeout=20)
    except requests.RequestException as exc:
        return {
            "status": "active",
            "message": f"Showing upcoming schedule (Connection failed: {exc})",
            "columns": fallback_cols,
            "table": fallback_schedule,
            "source": ECI_URL,
        }

    if not response.ok:
        return {
            "status": "active",
            "message": f"Showing upcoming schedule (ECI returned status {response.status_code})",
            "columns": fallback_cols,
            "table": fallback_schedule,
            "source": ECI_URL,
        }

    try:
        tables = pd.read_html(StringIO(response.text))
    except (ValueError, Exception):
        return {
            "status": "active",
            "message": "Showing upcoming schedule (No trends table found yet)",
            "columns": fallback_cols,
            "table": fallback_schedule,
            "source": ECI_URL,
        }

    primary = choose_primary_table(tables)
    if primary is None or primary.empty:
        return {
            "status": "active",
            "message": "Showing upcoming schedule (No active trends available)",
            "columns": fallback_cols,
            "table": fallback_schedule,
            "source": ECI_URL,
        }

    clean = primary.dropna(how="all").copy()
    clean.columns = [str(c).strip() for c in clean.columns]
    clean = clean.fillna("")

    return {
        "status": "active",
        "message": f"Table scraped successfully ({len(clean)} rows).",
        "columns": clean.columns.tolist(),
        "table": clean.to_dict(orient="records"),
        "source": ECI_URL,
    }


def snapshot_payload(payload: dict) -> str:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    json_path = SNAPSHOT_DIR / f"snapshot_{timestamp}.json"
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    election = payload.get("election", {})
    if election.get("status") == "active" and election.get("table"):
        csv_path = SNAPSHOT_DIR / f"eci_table_{timestamp}.csv"
        pd.DataFrame(election["table"]).to_csv(csv_path, index=False)

    return str(json_path)


def collect_and_store() -> dict:
    news_rows = fetch_live_news(limit=10)
    election = fetch_live_election_table()

    payload = {
        "last_updated": now_iso(),
        "news": news_rows,
        "election": election,
    }

    snapshot_path = snapshot_payload(payload)
    payload["snapshot_file"] = snapshot_path

    with state_lock:
        latest_state.clear()
        latest_state.update(payload)

    return payload


def run_scheduler_cycle() -> None:
    try:
        collect_and_store()
    except Exception:
        # Keep scheduler robust even if one cycle fails.
        pass


scheduler = BackgroundScheduler(daemon=True)
scheduler.add_job(
    run_scheduler_cycle,
    "interval",
    seconds=POLL_SECONDS,
    id="snapshot_job",
    next_run_time=datetime.now(timezone.utc),
)
scheduler.start()


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/live-data")
def api_live_data():
    with state_lock:
        return jsonify(latest_state)


@app.post("/api/snapshot/run")
def api_snapshot_run():
    payload = collect_and_store()
    return jsonify(payload)


@app.get("/api/status")
def api_status():
    with state_lock:
        election = latest_state.get("election", {})
        return jsonify(
            {
                "last_updated": latest_state.get("last_updated"),
                "eci_status": election.get("status", "inactive"),
                "message": election.get("message", "No status"),
                "source": election.get("source", ECI_URL),
            }
        )


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5050))
    app.run(host="0.0.0.0", port=port, debug=True)
