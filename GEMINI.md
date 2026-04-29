# NaagrikInfo: Political Transparency & Live Tracker

NaagrikInfo is a high-fidelity political transparency dashboard designed for Indian citizens. It tracks representatives, election promises, and provides live news updates with a modern glassmorphic aesthetic.

## 🛠 Tech Stack

- **Frontend**: Vanilla HTML5, CSS3 (Custom Design System), ES6+ JavaScript.
- **Backend (Node.js)**: Express.js API for data aggregation and real-time scraping.
- **Backend (Python)**: Flask-based tracking system for automated news and ECI result snapshots.
- **Data Processing**: Pandas (Python) for HTML table parsing, Cheerio (Node.js) for scraping.
- **Styling**: "Event Horizon" design system featuring Glassmorphism and Mesh Gradients.

## 📁 Project Structure

```text
├── app.js               # Main frontend logic (Dashboard, search, charts)
├── assistant.html       # 5-step visual election guide
├── index.html           # Primary dashboard entry point
├── server.js            # Node.js Express API (Port 8787)
├── master_tracker.py    # Standalone Python scraper (CLI)
├── data/                # Bundled JS datasets (MPs, MLAs, States, Promises)
└── python_tracker/      # Flask-based tracking API (Port 5050)
    └── app.py           # Python backend with background scheduler
```

## 🚀 Getting Started

### 1. Frontend Development
To launch the frontend with live-reloading:
```bash
npm install
npm run dev
```
Accessible at: `http://localhost:8000`

### 2. Node.js API
To start the primary data API:
```bash
npm run api
```
Accessible at: `http://localhost:8787`

### 3. Python Tracking System
To start the Python-based live tracker and snapshot system:
```bash
cd python_tracker
pip install -r requirements.txt
python app.py
```
Accessible at: `http://localhost:5050`

## 💡 Development Conventions

- **UI/UX**: Strictly adhere to the "Event Horizon" design system (Glassmorphism). Use CSS variables defined in `index.css`.
- **Data Handling**: Frontend prefers fetching from the Node.js API (`server.js`) but falls back to static data in `data/` if configured.
- **Scraping**: The system relies on Google News RSS and `results.eci.gov.in`. Avoid aggressive polling to prevent rate limiting (default is 5 minutes).
- **Modularity**: Keep UI initialization functions separated in `app.js` (e.g., `initTabs`, `initCharts`).

## 📌 Roadmap & TODOs

- [ ] **Real Data Integration**: Move from mock JSON to full production News/Election APIs.
- [ ] **Integrity Metrics**: Refine "calculated assumption" logic for party integrity graphs.
- [ ] **Mobile Optimization**: Improve navigation dropdown behavior on small screens.
- [ ] **Search expansion**: Enable global search across all bundled datasets.
