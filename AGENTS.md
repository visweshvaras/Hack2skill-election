# NaagrikInfo - AI Agent Guidance

NaagrikInfo is a **full-stack civic engagement platform** that helps Indian citizens track elected representatives, monitor election results, and access political transparency data.

## Quick Start

### Prerequisites
- Node.js (v14+)
- Python 3.11+ (avoid 3.14; pandas wheel building issues)
- External APIs optional: `NIC_API_KEY`, `NIC_API_SECRET`

### Run Commands
```bash
# Frontend (Port 8000) - Live-reloading development server
npm run dev

# Node.js API (Port 8787) - Express API with data aggregation
npm run api

# Python Tracker (Port 5050) - Flask background job scheduler
cd python_tracker && pip install -r requirements.txt && python app.py

# Build/prepare
npm install
npm install -g live-server  # If not installed
```

## Architecture Overview

### Frontend (Vanilla ES6+, Port 8000)
- **Entry**: [index.html](index.html) (main dashboard), [assistant.html](assistant.html) (election guide)
- **Logic**: [app.js](app.js) - 20+ initialization functions using `init*()` pattern
- **Styling**: [index.css](index.css) - Event Horizon design system (glassmorphism, CSS variables, responsive)
- **Pattern**: Each feature gets an `init*()` function triggered on DOMContentLoaded

### Node.js API (Express, Port 8787)
- **Entry**: [server.js](server.js)
- **Responsibilities**: 
  - RSS feed parsing (Google News)
  - Web scraping (ECI results from results.eci.gov.in)
  - HTML table parsing (using Cheerio)
  - Static data loading & API aggregation
  - CORS-enabled, serves entire frontend from Express
- **Dependencies**: Cheerio, fast-xml-parser, express-cors

### Python Tracker (Flask, Port 5050)
- **Entry**: [python_tracker/app.py](python_tracker/app.py)
- **Responsibilities**:
  - Background job scheduling (APScheduler at 5-minute intervals)
  - News feed collection
  - ECI results scraping
  - Time-stamped JSON snapshots → [python_tracker/snapshots/](python_tracker/snapshots/)
- **Dependencies**: Flask, Pandas, APScheduler, Feedparser, Requests, Gunicorn

### Static Data ([data/](data/))
- [mp-data.js](data/mp-data.js) - MP information & profiles
- [mla-data.js](data/mla-data.js) - MLA information & profiles
- [states-data.js](data/states-data.js) - State boundaries & metadata
- [promises-data.js](data/promises-data.js) - Election promises tracking
- [live-config.js](data/live-config.js) - Configuration (section status, reasons)

## Development Conventions

### Frontend Patterns
- **Modular Initialization**: Each UI feature has `init{Feature}()` function (e.g., `initTabs()`, `initCharts()`, `initSearch()`)
- **Event-Driven**: All initialization triggered by `DOMContentLoaded` event in app.js
- **Fallback Strategy**: Frontend prefers Node API but gracefully falls back to bundled static data
- **Local Storage**: Used for state persistence (e.g., warning banner dismissal)

### Backend Patterns
- **Section Status System**: Each data section (news, votes, MPs, etc.) has `status` and `reason` tracking in [live-config.js](data/live-config.js)
- **Safe Array Handling**: API normalizes various response formats before returning
- **Rate Limiting**: Python tracker enforces 5-minute intervals; Node API includes User-Agent headers to avoid blocking

### Data Flow
1. Frontend requests from Node API → Express aggregates from multiple sources
2. Python tracker runs scheduled jobs → stores snapshots with timestamps
3. Data sources: Google News RSS, ECI website, PRSindia, MyNeta.info
4. Fallback: Static bundled data in [data/](data/) directory

## Current State & Known Considerations

### Recent Updates (as of April 26, 2026)
- ✅ Navigation redesigned (dropdown to prevent wrapping)
- ✅ Interactive 5-step election guide fully implemented
- ✅ Live news feed with modal detail view working
- ⚠️ Still using mock JSON; real API integration in progress
- ⚠️ News feed on 8-second simulation loop (not real-time)

### Limitations & Pitfalls
- **Party Integrity Metrics**: "Calculated assumption" logic needs refinement
- **Mobile Navigation**: Test dropdown behavior on small screens
- **Search**: Limited to specific datasets; global search expansion planned
- **Scraping Stability**: Google News RSS and ECI scraping may break if pages change
- **Python 3.14**: Avoid; use 3.11-3.13 for stable pandas wheels

### Deployment
- **Frontend/API**: Vercel (see [vercel.json](vercel.json) for routing rules)
- **Python Tracker**: Standalone deployment required (not Vercel-compatible)
- Express serves entire app directory; Python runs on separate port

## Key Files by Task

| Task | Primary Files |
|------|----------------|
| Add UI feature | [app.js](app.js), [index.html](index.html), [index.css](index.css) |
| Add API endpoint | [server.js](server.js) |
| Add data collection job | [python_tracker/app.py](python_tracker/app.py) |
| Update representative data | [data/mp-data.js](data/mp-data.js), [data/mla-data.js](data/mla-data.js) |
| Configure sections | [data/live-config.js](data/live-config.js) |
| Style & theming | [index.css](index.css) (Event Horizon design system) |

## Testing Workflow

1. **Frontend**: Launch `npm run dev` (port 8000); open browser DevTools
2. **API**: Launch `npm run api` (port 8787); test endpoints via curl/Postman
3. **Python Tracker**: Launch `python python_tracker/app.py` (port 5050); check snapshots folder
4. **Integration**: Ensure all three services running; test frontend data flow

## Documentation

- [RESUME_DEVELOPMENT.md](RESUME_DEVELOPMENT.md) - Development progress tracking
- [GEMINI.md](GEMINI.md) - Project requirements & specifications
- [run.bat](run.bat) - Windows batch script for running services

---

**Last Updated**: April 29, 2026  
**Project Status**: MVP complete; transitioning to real data sources
