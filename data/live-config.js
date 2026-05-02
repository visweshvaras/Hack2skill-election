const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = IS_LOCAL && window.location.port !== '8787' ? 'http://localhost:8787' : '';

window.LIVE_DATA_CONFIG = {
  // false = use bundled static datasets as fallback when live scraping fails
  liveOnly: false,

  // Refresh interval for all live internet calls
  refreshMs: 60000,

  // News is fetched by backend via Google News RSS (no API key required)
  news: {
    endpoint: API_BASE + '/api/news/live',
    query: 'india election OR lok sabha OR vidhan sabha',
    language: 'en',
    country: 'in',
    max: 6,

    // Optional fallback sources if you host additional feeds.
    sourceCandidates: [
      API_BASE + '/api/news/live'
    ]
  },

  // Vote counting is scraped by backend from https://results.eci.gov.in.
  voteCounting: {
    endpoint: API_BASE + '/api/vote-counting/live',
    max: 12,

    // Optional source candidates for automatic first-working fetch.
    sourceCandidates: [
      API_BASE + '/api/vote-counting/live'
    ]
  },

  // Live endpoints for the remaining sections.
  // Each should return JSON arrays (or an object with data/results/items array).
  endpoints: {
    mps: API_BASE + '/api/mps/live',
    mlas: API_BASE + '/api/mlas/live',
    states: API_BASE + '/api/states/live',
    ministries: API_BASE + '/api/ministries/live',
    promises: API_BASE + '/api/promises/live',
    memberPerformance: API_BASE + '/api/member-performance/live',
    integrity: API_BASE + '/api/integrity/live',
    stateAnalysis: API_BASE + '/api/state-analysis/live',
    representativeDetails: API_BASE + '/api/representative-details'
  },

  // Directorate of Enforcement (ED) cases feed
  edCases: {
    endpoint: API_BASE + '/api/ed-cases/live',
    apiKey: '',
    max: 20
  }
};
