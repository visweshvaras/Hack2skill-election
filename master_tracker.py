"""
SYSTEM: LIVE INDIA POLITICS & ELECTION TRACKER (NO-API)
OBJECTIVE:
1. Scrape live political news via Google News RSS.
2. Scrape live counting data from results.eci.gov.in using table parsing.
3. Output JSON/CSV logs for analysis.
"""

from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from pathlib import Path

import feedparser
import pandas as pd
import requests

NEWS_RSS_URL = (
    "https://news.google.com/rss/search?"
    "q=politics+india+election+counting+live&hl=en-IN&gl=IN&ceid=IN:en"
)
ECI_URL = "https://results.eci.gov.in"
POLL_SECONDS = 300
HEADERS = {"User-Agent": "Mozilla/5.0"}

OUT_DIR = Path("tracker_output")
OUT_DIR.mkdir(exist_ok=True)

NEWS_JSONL = OUT_DIR / "live_news.jsonl"
RESULTS_JSONL = OUT_DIR / "live_results.jsonl"
RESULTS_CSV = OUT_DIR / "live_election_results.csv"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def append_jsonl(path: Path, rows: list[dict]) -> None:
    if not rows:
        return
    with path.open("a", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")


def get_live_news(limit: int = 10) -> list[dict]:
    feed = feedparser.parse(NEWS_RSS_URL)
    rows: list[dict] = []

    for entry in feed.entries[:limit]:
        rows.append(
            {
                "title": entry.get("title", ""),
                "link": entry.get("link", ""),
                "published": entry.get("published", ""),
                "summary": entry.get("summary", ""),
                "fetched_at": now_iso(),
            }
        )

    append_jsonl(NEWS_JSONL, rows)
    return rows


def pick_best_results_table(tables: list[pd.DataFrame]) -> pd.DataFrame | None:
    if not tables:
        return None

    best_df = None
    best_score = -1

    for df in tables:
        cols = " ".join(str(c).lower() for c in df.columns)
        score = len(df)

        if any(k in cols for k in ["party", "alliance"]):
            score += 5
        if any(k in cols for k in ["leading", "lead", "won", "trend"]):
            score += 5
        if any(k in cols for k in ["constituency", "assembly", "seat", "candidate"]):
            score += 4

        if score > best_score:
            best_score = score
            best_df = df

    return best_df


def get_election_results() -> pd.DataFrame:
    response = requests.get(ECI_URL, headers=HEADERS, timeout=20)
    response.raise_for_status()

    tables = pd.read_html(response.text)
    best = pick_best_results_table(tables)
    if best is None:
        return pd.DataFrame()

    clean = best.dropna(how="all").copy()
    clean["fetched_at"] = now_iso()
    return clean


def log_results(df: pd.DataFrame) -> None:
    if df.empty:
        return

    # Keep latest full table snapshot in CSV and append line-oriented JSON for history.
    df.to_csv(RESULTS_CSV, index=False)
    append_jsonl(RESULTS_JSONL, df.to_dict(orient="records"))


def print_news_preview(news_rows: list[dict]) -> None:
    print(f"\n--- LIVE NEWS UPDATED AT {datetime.now()} ---")
    for row in news_rows[:5]:
        print(f"TITLE: {row['title']}\nLINK: {row['link']}\n")


def print_results_preview(df: pd.DataFrame) -> None:
    if df.empty:
        print("--- LIVE COUNTING DATA ---")
        print("No results table detected yet. Waiting for ECI updates...")
        return

    print("--- LIVE COUNTING DATA ---")
    print(df.head(20).to_string(index=False))


def main() -> None:
    print("Starting no-API live tracker...")
    print(f"News RSS: {NEWS_RSS_URL}")
    print(f"ECI URL:  {ECI_URL}")
    print(f"Polling every {POLL_SECONDS} seconds")

    while True:
        try:
            news_rows = get_live_news()
            print_news_preview(news_rows)
        except Exception as exc:
            print(f"News fetch failed: {exc}")

        try:
            results_df = get_election_results()
            log_results(results_df)
            print_results_preview(results_df)
        except Exception as exc:
            print(f"Waiting for ECI portal/table availability: {exc}")

        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()
