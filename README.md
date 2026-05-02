# 🇮🇳 NaagrikInfo: Political Transparency & Live Tracker

[![Live Demo](https://img.shields.io/badge/Live_Demo-View_Website-1ED760?style=for-the-badge&logo=google-cloud)](https://naagrikinfo-api-1060897573420.us-central1.run.app)
[![Tech Stack: Node.js & Python](https://img.shields.io/badge/Stack-Node.js%20%7C%20Python-3A2D56?style=for-the-badge)](#%EF%B8%8F-tech-stack)

**NaagrikInfo** is a high-fidelity political transparency dashboard and interactive educational platform designed for Indian citizens. It empowers voters by tracking representatives, monitoring election promises, providing live news updates, and educating new voters through a highly immersive digital experience.

🌍 **Live Website:** [https://naagrikinfo-api-1060897573420.us-central1.run.app](https://naagrikinfo-api-1060897573420.us-central1.run.app)

---

## ✨ Key Features

### 📖 The Franchise: An Interactive Scrollytelling Guide
We've completely reimagined voter education. NaagrikInfo features **"The Franchise,"** a premium, cinematic digital book experience designed to guide 18-year-olds through the voter registration and voting process. 
- **GSAP-Powered Animations:** Advanced timeline sequencing brings custom SVG illustrations to life.
- **3D Mouse Parallax:** Elements react to the user's cursor, providing an award-winning depth effect.
- **Story-Driven Narrative:** Users follow Aryan, a new voter, through a mature, engaging script covering Form 6 registration, BLO verification, receiving an EPIC card, and casting a mandate on an EVM.
- **Interactive Questionnaire:** Tests users' knowledge at the end of the journey to ensure comprehension.

### 📊 Political Transparency Dashboard
A beautiful, data-driven dashboard utilizing our custom **"Event Horizon"** glassmorphic design system.
- **Interactive Maps:** Real-time map data reflecting official Indian boundaries.
- **Representative Tracking:** Keep track of elected officials (MPs and MLAs) and their performance.
- **Live News Aggregation:** Pulls the latest political and election updates automatically.
- **Calculated Integrity Metrics:** Visual graphs estimating political alignment and party integrity.

---

## 🛠️ Tech Stack

**Frontend**
- **HTML5 & CSS3:** Custom Vanilla CSS utilizing the "Event Horizon" Glassmorphism design system.
- **JavaScript (ES6+):** Pure vanilla JS for seamless interactivity.
- **GSAP (GreenSock):** Industry-standard animation library powering the cinematic interactive guide.

**Backend**
- **Node.js (Express.js):** Primary API for data aggregation, serving the frontend, and real-time scraping (via Cheerio).
- **Python (Flask):** Secondary tracking API providing automated news polling and Election Commission (ECI) result snapshots using Pandas.

**Deployment**
- **Google Cloud Run:** Fully containerized, serverless deployment.
- **Google Cloud Build:** Automated CI/CD pipeline triggered from source.

---

## 📁 Project Structure

```text
├── app.js               # Main frontend dashboard logic (search, charts, data fetching)
├── assistant.html       # The GSAP-powered interactive "Scrollytelling" election guide
├── index.html           # Primary dashboard entry point
├── index.css            # "Event Horizon" design system variables and styles
├── server.js            # Node.js Express API serving data and the frontend
├── master_tracker.py    # Standalone Python scraper (CLI)
├── cloudbuild.yaml      # Google Cloud deployment configuration
├── data/                # Bundled mock/fallback datasets (MPs, MLAs, States, Promises)
└── python_tracker/      # Flask-based tracking API 
    └── app.py           # Background scheduler and snapshot generation
```

---

## 🚀 Local Development

To run NaagrikInfo locally on your machine, you need both Node.js and Python installed.

### 1. Start the Primary Web Server (Node.js)
This server hosts the frontend assets and the primary data API.
```bash
# Install dependencies
npm install

# Start the development server (runs on Port 8000 & API on 8787)
npm run dev

# Alternatively, run the production-ready API
npm run api
```
Access the dashboard at `http://localhost:8000`

### 2. Start the Tracking System (Python)
This handles the background snapshotting and tracking features.
```bash
cd python_tracker

# Install Python dependencies
pip install -r requirements.txt

# Start the Flask app
python app.py
```
Access the tracking API at `http://localhost:5050`

---

## 📌 Roadmap & Future Enhancements

- [ ] **Production APIs:** Fully transition from localized JSON data bundles to live, authorized News and Election APIs.
- [ ] **Advanced Metrics:** Refine the logic algorithms that drive the Party Integrity graphs.
- [ ] **Global Search Expansion:** Enable full-text searching across all bundled and fetched datasets.
- [ ] **Mobile Touch Optimizations:** Enhance the GSAP interactive guide with native swipe gestures for mobile users.

---

*Designed and developed to bring transparency and education to the democratic process.* 🇮🇳