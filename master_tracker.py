"""
INDUSTRIAL SYSTEM: LIVE INDIA POLITICS & ELECTION TRACKER
OBJECTIVE:
1. Scrape live political news via Google News RSS.
2. Scrape live counting data from results.eci.gov.in with May 2026 awareness.
3. Persistent logging and CLI visualization.
"""

from __future__ import annotations

import json
import time
import sys
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
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
}

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
    try:
        with path.open("a", encoding="utf-8") as f:
            for row in rows:
                f.write(json.dumps(row, ensure_ascii=False) + "\n")
    except Exception as e:
        print(f"[ERROR] Failed to write to {path}: {e}")

def get_live_news(limit: int = 10) -> list[dict]:
    try:
        feed = feedparser.parse(NEWS_RSS_URL)
        rows: list[dict] = []

        for entry in feed.entries[:limit]:
            rows.append(
                {
                    "title": entry.get("title", ""),
                    "link": entry.get("link", ""),
                    "published": entry.get("published", ""),
                    "fetched_at": now_iso(),
                }
            )

        append_jsonl(NEWS_JSONL, rows)
        return rows
    except Exception as e:
        print(f"[ERROR] News collection failed: {e}")
        return []

def get_election_results() -> pd.DataFrame:
    now = datetime.now(timezone.utc)
    # ECI Counting starts May 4, 2026 at 8:00 AM IST (2:30 AM UTC)
    counting_start = datetime(2026, 5, 4, 2, 30, tzinfo=timezone.utc)

    if now < counting_start:
        # Pre-election schedule fallback
        data = [
            {"Region": "West Bengal", "Status": "Counting Starts May 4", "Party": "Scheduled"},
            {"Region": "Tamil Nadu", "Status": "Counting Starts May 4", "Party": "Scheduled"},
            {"Region": "Kerala", "Status": "Counting Starts May 4", "Party": "Scheduled"},
            {"Region": "Assam", "Status": "Counting Starts May 4", "Party": "Scheduled"},
            {"Region": "Puducherry", "Status": "Counting Starts May 4", "Party": "Scheduled"},
            {"Region": "Diamond Harbour", "Status": "Re-polling May 2", "Party": "Live Update"}
        ]
        df = pd.DataFrame(data)
        df["fetched_at"] = now_iso()
        return df

    try:
        response = requests.get(ECI_URL, headers=HEADERS, timeout=20)
        response.raise_for_status()

        tables = pd.read_html(response.text)
        if not tables:
            return pd.DataFrame()

        # Simple heuristic to find the best results table
        best_df = max(tables, key=lambda d: len(d.columns) if "Party" in str(d.columns) or "Won" in str(d.columns) else 0)
        
        clean = best_df.dropna(how="all").copy()
        clean["fetched_at"] = now_iso()
        return clean
    except Exception as e:
        print(f"[ERROR] ECI Scrape failed: {e}")
        return pd.DataFrame()

def main() -> None:
    print("====================================================")
    print(" INDUSTRIAL LIVE POLITICS TRACKER (v2.0) ")
    print("====================================================")
    print(f"Timeline Check: {datetime.now()}")
    
    while True:
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Starting sync cycle...")
        
        news = get_live_news()
        if news:
            print(f"  - Collected {len(news)} news articles.")
            for n in news[:3]:
                print(f"    * {n['title'][:60]}...")
        
        results = get_election_results()
        if not results.empty:
            print(f"  - Collected election trends ({len(results)} rows).")
            print(results.head(10).to_string(index=False))
            results.to_csv(RESULTS_CSV, index=False)
            append_jsonl(RESULTS_JSONL, results.to_dict(orient="records"))
        
        print(f"Waiting {POLL_SECONDS}s for next cycle...")
        time.sleep(POLL_SECONDS)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[INFO] Tracker stopped by user.")
        sys.exit(0)
