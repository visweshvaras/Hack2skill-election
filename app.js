document.addEventListener('DOMContentLoaded', async () => {
  await initLiveDataBootstrap();
  initThemeToggle();
  initMobileMenu();
  initSmoothScroll();
  initHeaderScroll();
  initNavHighlight();
  initScrollAnimations();
  initCounters();
  initTabs();
  initFAQ();
  initQuiz();
  initStates();
  initRepresentatives();
  initPromises();
  initGlobalSearch();
  initWarningBanner();
  initLiveTrack();
  initIntegrityCharts();
  initEdCases();
  initStateAnalysis();
  initMemberAssessment();
  initHeroNeonMap();

  const config = getLiveConfig();
  setInterval(refreshAllLiveSections, config.refreshMs);
});

function initWarningBanner() {
  const banner = document.getElementById('warningBanner');
  const closeBtn = document.getElementById('closeWarning');
  if (banner && closeBtn) {
    if (localStorage.getItem('warningDismissed') === 'true') {
      banner.style.display = 'none';
    }
    closeBtn.addEventListener('click', () => {
      banner.style.display = 'none';
      localStorage.setItem('warningDismissed', 'true');
    });
  }
}

let LIVE_NEWS = [];

/**
 * Fetches data from a JSON endpoint with built-in timeout, signal management, and retry logic.
 * @param {string} endpoint - The URL to fetch.
 * @param {number} retries - Number of retry attempts.
 * @returns {Promise<Array>}
 */
async function fetchEndpointArray(endpoint, retries = 2) {
  if (!endpoint) return [];
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 8000);
  
  try {
    const response = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(id);
    
    if (!response.ok) {
      if (retries > 0) return fetchEndpointArray(endpoint, retries - 1);
      return [];
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : (data.data || data.results || []);
  } catch (error) {
    clearTimeout(id);
    if (retries > 0 && error.name !== 'AbortError') {
      return fetchEndpointArray(endpoint, retries - 1);
    }
    return [];
  }
}

async function fetchFirstWorkingArray(endpoints) {
  for (const endpoint of endpoints) {
    const rows = await fetchEndpointArray(endpoint);
    if (rows.length) return rows;
  }
  return [];
}

function getLiveConfig() {
  const userConfig = window.LIVE_DATA_CONFIG || {};
  return {
    liveOnly: userConfig.liveOnly !== false,
    refreshMs: Number(userConfig.refreshMs) || 60000,
    news: {
      endpoint: userConfig.news?.endpoint || '/api/news/live',
      query: userConfig.news?.query || 'india election OR lok sabha OR vidhan sabha',
      max: Number(userConfig.news?.max) || 6,
      language: userConfig.news?.language || 'en',
      country: userConfig.news?.country || 'in',
      sourceCandidates: Array.isArray(userConfig.news?.sourceCandidates) ? userConfig.news.sourceCandidates : []
    },
    voteCounting: {
      endpoint: userConfig.voteCounting?.endpoint || '',
      max: Number(userConfig.voteCounting?.max) || 12,
      sourceCandidates: Array.isArray(userConfig.voteCounting?.sourceCandidates) ? userConfig.voteCounting.sourceCandidates : []
    },
    endpoints: {
      mps: userConfig.endpoints?.mps || '',
      mlas: userConfig.endpoints?.mlas || '',
      states: userConfig.endpoints?.states || '',
      promises: userConfig.endpoints?.promises || '',
      memberPerformance: userConfig.endpoints?.memberPerformance || '',
      integrity: userConfig.endpoints?.integrity || '',
      stateAnalysis: userConfig.endpoints?.stateAnalysis || '',
      representativeDetails: userConfig.endpoints?.representativeDetails || ''
    },
    edCases: {
      endpoint: userConfig.edCases?.endpoint || '',
      apiKey: userConfig.edCases?.apiKey || '',
      max: Number(userConfig.edCases?.max) || 20
    }
  };
}

async function initLiveDataBootstrap() {
  const config = getLiveConfig();
  const mps = await fetchEndpointArray(config.endpoints.mps);
  const mlas = await fetchEndpointArray(config.endpoints.mlas);
  const states = await fetchEndpointArray(config.endpoints.states);
  const promises = await fetchEndpointArray(config.endpoints.promises);

  if (mps.length) {
    window.MP_DATA = mps;
  } else if (config.liveOnly) {
    window.MP_DATA = [];
  }

  if (mlas.length) {
    if (Array.isArray(mlas)) {
      const grouped = {};
      mlas.forEach(item => {
        const key = item.state || item.region || 'Unknown';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
      });
      window.MLA_DATA = grouped;
    } else if (typeof mlas === 'object') {
      window.MLA_DATA = mlas;
    }
  } else if (config.liveOnly) {
    window.MLA_DATA = {};
  }

  if (states.length) {
    window.STATES_DATA = states;
  } else if (config.liveOnly) {
    window.STATES_DATA = [];
  }

  if (promises.length) {
    window.PROMISES_DATA = {
      summary: {
        total: promises.length,
        fulfilled: promises.filter(p => p.status === 'fulfilled').length,
        inProgress: promises.filter(p => p.status === 'in-progress').length,
        notStarted: promises.filter(p => p.status === 'not-started').length
      },
      categories: [
        {
          name: 'Live Promises Feed',
          promises: promises
        }
      ]
    };
  } else if (config.liveOnly) {
    window.PROMISES_DATA = {
      summary: { total: 0, fulfilled: 0, inProgress: 0, notStarted: 0 },
      categories: []
    };
  }
}

function timeAgo(input) {
  const date = input ? new Date(input) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Recently';
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(Math.abs(diff) / 1000);
  const isFuture = diff < 0;
  const suffix = isFuture ? ' from now' : ' ago';

  if (sec < 60) return isFuture ? 'Starting soon' : 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min${suffix}`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr${suffix}`;
  return `${Math.floor(hr / 24)} day${suffix}`;
}

function toArrayPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  return payload.articles || payload.results || payload.items || payload.data || payload.contests || [];
}

async function fetchLiveNews(config, topic = '') {
  const endpoint = config.news.endpoint + (topic ? `?topic=${topic}` : '');
  const candidates = [endpoint, ...config.news.sourceCandidates].filter(Boolean);
  const fallbackRows = await fetchFirstWorkingArray(candidates);
  return fallbackRows.map(article => ({
    source: article.source?.name || article.source || 'Live Source',
    time: timeAgo(article.publishedAt || article.pubDate || article.time),
    title: article.title || 'No title',
    type: article.category || 'Election Update',
    image: article.image || article.urlToImage || '',
    content: article.description || article.content || article.snippet || 'Open source for details.',
    url: article.url || '#'
  })).slice(0, config.news.max);
}

async function refreshAllLiveSections() {
  console.log('Refreshing all live sections...');
  const config = getLiveConfig();
  
  // Refresh bootstrap data
  await initLiveDataBootstrap();
  
  // Re-run initialization for sections that depend on bootstrap data
  initRepresentatives();
  initPromises();
  initLiveTrack();
  initIntegrityCharts();
  initMemberAssessment();
  initHeroNeonMap();
  initStateAnalysis();
}

async function fetchVoteCounting(config) {
  if (!config.voteCounting.endpoint) {
    const candidateRows = await fetchFirstWorkingArray(config.voteCounting.sourceCandidates.filter(Boolean));
    return candidateRows.map(item => ({
      region: item.region || item.constituency || item.state || item.name || 'Unknown Region',
      leading: item.leading || item.candidate || item.leader || 'N/A',
      party: item.party || item.leadingParty || 'N/A',
      leadMargin: item.leadMargin || item.margin || item.leadingBy || 0,
      round: item.round || item.roundNo || item.phase || '-',
      updatedAt: item.updatedAt || item.lastUpdated || item.time || ''
    })).slice(0, config.voteCounting.max);
  }

  const response = await fetch(config.voteCounting.endpoint);
  if (!response.ok) throw new Error(`Vote API error: ${response.status}`);

  const data = await response.json();
  return toArrayPayload(data).map(item => ({
    region: item.region || item.constituency || item.state || item.name || 'Unknown Region',
    leading: item.leading || item.candidate || item.leader || 'N/A',
    party: item.party || item.leadingParty || 'N/A',
    leadMargin: item.leadMargin || item.margin || item.leadingBy || 0,
    round: item.round || item.roundNo || item.phase || '-',
    updatedAt: item.updatedAt || item.lastUpdated || item.time || ''
  })).slice(0, config.voteCounting.max);
}

window.openNewsModal = function(newsIndex) {
  const news = LIVE_NEWS[newsIndex];
  const modal = document.getElementById('newsModal');
  if(!modal || !news) return;

  document.getElementById('newsModalImage').src = news.image || '';
  document.getElementById('newsModalImage').style.display = news.image ? 'block' : 'none';
  document.getElementById('newsModalSource').innerText = news.source;
  document.getElementById('newsModalTime').innerText = news.time;
  document.getElementById('newsModalTitle').innerText = news.title;
  document.getElementById('newsModalCategory').innerText = news.type;
  document.getElementById('newsModalContent').innerText = news.content;

  modal.style.display = 'flex';
};

window.openConstituencyModal = async function(stateCode) {
  const modal = document.getElementById('constituencyModal');
  const tbody = document.getElementById('constituencyTableBody');
  const title = document.getElementById('constituencyModalTitle');
  const status = document.getElementById('constituencyModalStatus');
  const source = document.getElementById('constituencyModalSource');

  if(!modal || !tbody) return;

  // Find State Name
  const stateData = window.STATES_DATA ? window.STATES_DATA.find(s => s.code.toLowerCase() === stateCode.toLowerCase() || s.name.toLowerCase() === stateCode.toLowerCase()) : null;
  const stateName = stateData ? stateData.name : stateCode;

  title.innerText = `${stateName} - Electoral Details`;
  status.innerText = 'Loading Live Data...';
  status.className = 'live-badge';
  source.innerText = 'Connecting to ECI / MyNeta endpoints...';
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Fetching constituency records...</td></tr>';
  modal.style.display = 'flex';

  try {
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE = IS_LOCAL && window.location.port !== '8787' ? 'http://localhost:8787' : '';
    const res = await fetch(`${API_BASE}/api/vote-counting/state/${stateCode}`);
    if (!res.ok) {
      const errorText = `Live constituency data unavailable (${res.status})`;
      status.innerText = 'No Live Data';
      status.className = 'live-badge text-saffron';
      source.innerText = `Data Source: ${errorText}`;
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No verified live constituency data is published for this state yet.</td></tr>';
      return;
    }
    const data = await res.json();

    status.innerText = data.status === 'live' ? 'Live Data' : 'No Live Data';
    status.className = data.status === 'live' ? 'live-badge text-green' : 'live-badge text-saffron';
    source.innerText = `Data Source: ${data.source || 'Scraped Endpoint'}`;

    if (!data.constituencies || !data.constituencies.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No candidate data available for this state yet.</td></tr>';
      return;
    }

    tbody.innerHTML = data.constituencies.map(c => `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td>${c.candidate}</td>
        <td><span class="state-party-badge">${c.party}</span></td>
        <td>${c.status}</td>
        <td>${c.margin || c.assets || '-'}</td>
      </tr>
    `).join('');

  } catch(e) {
    status.innerText = 'Connection Error';
    status.className = 'live-badge text-error';
    source.innerText = '';
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--error);">Failed to load constituency data. The backend scraping endpoint may be unreachable or the source structure changed.</td></tr>';
  }
};
function initLiveTrack() {
  const newsFeed = document.getElementById('newsFeed');
  const trackerList = document.getElementById('liveTrackerList');
  const topicBtns = document.querySelectorAll('.topic-btn');
  const config = getLiveConfig();
  let currentTopic = 'all';

  function renderNews(items) {
    if (!newsFeed) return;

    if (!items.length) {
      newsFeed.innerHTML = `
        <div class="track-item pending">
          <strong>Live News Unavailable</strong>
          <span>Backend RSS fetch did not return entries for topic "${currentTopic}". Check server connectivity.</span>
        </div>
      `;
      return;
    }

    newsFeed.innerHTML = '';
    items.forEach((news, index) => {
      const div = document.createElement('div');
      div.className = 'news-item live-flash glass-card';
      div.style.cursor = 'pointer';
      div.onclick = () => window.openNewsModal(index);
      div.innerHTML = `
        <div class="news-meta">
          <div class="live-badge">
            <span class="live-dot"></span>
            LIVE - ${news.source}
          </div>
          <span style="color: var(--text-muted); font-weight: 500;">${news.time}</span>
        </div>
        <div class="news-title">${news.title}</div>
        <div class="news-footer">
          <span class="news-category">${news.type}</span>
          <span class="news-read-more">Read details <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
        </div>
      `;
      newsFeed.appendChild(div);
    });
  }

  async function refreshNews() {
    try {
      LIVE_NEWS = await fetchLiveNews(config, currentTopic === 'all' ? '' : currentTopic);
      renderNews(LIVE_NEWS);
    } catch (error) {
      renderNews([]);
    }
  }

  if (topicBtns) {
    topicBtns.forEach(btn => {
      btn.onclick = () => {
        topicBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTopic = btn.getAttribute('data-topic');
        refreshNews();
      };
    });
  }

  function renderVoteCounting(items) {
    if (!trackerList) return;

    if (!items.length) {
      trackerList.innerHTML = `
        <div class="track-item pending">
          <strong>Live ECI table not published yet</strong>
          <span>The backend is connected to the official results portal, but no verified table rows are available right now.</span>
        </div>
      `;
      return;
    }

    trackerList.innerHTML = items.map(v => `
      <div class="track-item fulfilled live-flash" onclick="window.openConstituencyModal('${v.region}')" style="cursor: pointer;" title="Click for details">
        <strong>${v.region}</strong>
        <span class="track-val">Leading: <b style="color: var(--text-primary);">${v.leading}</b></span>
        <span class="track-val" style="text-align: right;">Margin/Status: <b style="color: var(--green-light);">${v.leadMargin}</b></span>
        <div class="track-meta">
          Round/Phase: ${v.round} • Updated ${timeAgo(v.updatedAt)}
        </div>
      </div>
    `).join('');
  }

  async function refreshVoteData() {
    try {
      const voteData = await fetchVoteCounting(config);
      renderVoteCounting(voteData);
    } catch (error) {
      renderVoteCounting([]);
    }
  }

  async function refreshLiveData() {
    await refreshNews();
    await refreshVoteData();
  }

  if (newsFeed.dataset.initialized) {
    refreshLiveData();
    return;
  }
  newsFeed.dataset.initialized = "true";

  refreshLiveData();
  
  // Modal Close Logic
  const closeBtn = document.getElementById('closeNewsModal');
  if(closeBtn) {
    closeBtn.onclick = () => {
      document.getElementById('newsModal').style.display = 'none';
    };
  }

  const closeConstBtn = document.getElementById('closeConstituencyModal');
  if(closeConstBtn) {
    closeConstBtn.onclick = () => {
      document.getElementById('constituencyModal').style.display = 'none';
    };
  }

  window.onclick = (e) => {
    const modal = document.getElementById('newsModal');
    const constModal = document.getElementById('constituencyModal');
    if (e.target === modal) {
      modal.style.display = 'none';
    }
    if (e.target === constModal) {
      constModal.style.display = 'none';
    }
  };  
}

const INTEGRITY_LABELS = ["Unfulfilled Promises", "Money Influence", "False Claims", "Criminal Cases", "Hate Speech"];

async function initIntegrityCharts() {
  const select = document.getElementById('integrityPartySelect');
  const tbody = document.getElementById('integrityTableBody');
  if (!select || !tbody) return;
  
  const config = getLiveConfig();
  const integrityRows = await fetchEndpointArray(config.endpoints.integrity);

  if (!integrityRows.length) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Live integrity data unavailable.</td></tr>`;
    return;
  }

  const currentVal = select.value;
  select.innerHTML = integrityRows.map(row => `<option value="${row.party}" ${row.party === currentVal ? 'selected' : ''}>${row.party}</option>`).join('');

  function drawTableGraph(party) {
    const data = integrityRows.find(r => r.party === party);
    if (!data) return;

    const baseScore = parseFloat(data.score) || 5; 
    
    // Extrapolate detailed metrics based on the overall score.
    const metrics = [
      { label: "Criminal Cases", score: Math.max(0, 10 - baseScore) },
      { label: "Money Influence", score: Math.max(0, 9 - baseScore) },
      { label: "Unfulfilled Promises", score: Math.max(0, 8 - (baseScore*0.5)) },
      { label: "False Claims", score: Math.max(0, 7 - (baseScore*0.5)) },
      { label: "Hate Speech", score: Math.max(0, 6 - baseScore) }
    ];

    tbody.innerHTML = metrics.map(m => {
      const score = m.score.toFixed(1);
      const color = score > 6 ? 'var(--error)' : (score > 3 ? 'var(--saffron)' : 'var(--green-light)');
      const width = Math.min(100, score * 10);
      const risk = score > 6 ? 'High Risk' : (score > 3 ? 'Moderate' : 'Low Risk');

      return `
        <tr>
          <td>${m.label}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span>${score}/10</span>
              <div style="flex: 1; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
                <div style="width: ${width}%; height: 100%; background: ${color}; transition: width 1s var(--ease-out);"></div>
              </div>
            </div>
          </td>
          <td><span style="color: ${color}; font-weight: bold;">${risk}</span></td>
        </tr>
      `;
    }).join('');
  }

  if (!select.dataset.initialized) {
    select.onchange = (e) => drawTableGraph(e.target.value);
    select.dataset.initialized = "true";
  }
  
  drawTableGraph(select.value);
}

async function initEdCases() {
  const tbody = document.getElementById('edCasesTableBody');
  const totalEl = document.getElementById('edCasesTotal');
  const yearsEl = document.getElementById('edCasesYears');
  const peakEl = document.getElementById('edCasesPeak');
  const config = getLiveConfig();

  if (!tbody) return;
  if (!config.edCases.endpoint) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 1.5rem;">ED cases endpoint not configured. Set edCases.endpoint in data/live-config.js.</td></tr>';
    return;
  }

  const rows = await fetchEdCases(config.edCases);
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 1.5rem;">No ED cases data available from the connected source.</td></tr>';
    return;
  }

  const normalized = rows.map(normalizeEdCaseRow).filter(Boolean);
  if (!normalized.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 1.5rem;">ED cases data format not recognized.</td></tr>';
    return;
  }

  normalized.sort((a, b) => String(a.year).localeCompare(String(b.year)));
  const totalCases = normalized.reduce((sum, row) => sum + row.total, 0);
  const yearsCovered = new Set(normalized.map(row => row.year)).size;
  const peak = normalized.reduce((acc, row) => row.total > acc.total ? row : acc, normalized[0]);

  if (totalEl) totalEl.innerText = totalCases || '0';
  if (yearsEl) yearsEl.innerText = yearsCovered || '0';
  if (peakEl) peakEl.innerText = peak?.year ? `${peak.year} (${peak.total})` : '--';

  tbody.innerHTML = normalized.map(row => `
    <tr>
      <td>${row.year}</td>
      <td>${row.mps}</td>
      <td>${row.mlas}</td>
      <td>${row.politicalLeaders}</td>
      <td>${row.total}</td>
    </tr>
  `).join('');
}

async function fetchEdCases(config) {
  try {
    const endpoint = new URL(config.endpoint);
    if (config.apiKey && !endpoint.searchParams.has('api-key')) {
      endpoint.searchParams.set('api-key', config.apiKey);
    }
    if (!endpoint.searchParams.has('format')) {
      endpoint.searchParams.set('format', 'json');
    }
    if (config.max && !endpoint.searchParams.has('limit')) {
      endpoint.searchParams.set('limit', String(config.max));
    }

    const response = await fetch(endpoint.toString());
    if (!response.ok) return [];
    const data = await response.json();
    return toArrayPayload(data);
  } catch (error) {
    return [];
  }
}

function normalizeEdCaseRow(row) {
  if (!row || typeof row !== 'object') return null;
  const year = row.year || row.financial_year || row.fy || row.period || row.year_of_registration || row.yr;
  const mp = row.mps || row.mp || row.member_of_parliament || row.member_of_parliaments || row.mp_cases;
  const mla = row.mlas || row.mla || row.member_of_legislative_assembly || row.mla_cases;
  const leaders = row.political_leaders || row.political_leader || row.politicalleaders || row.political || row.leaders;

  const mpVal = Number(mp || 0);
  const mlaVal = Number(mla || 0);
  const leaderVal = Number(leaders || 0);
  const safeYear = year ? String(year) : 'Unknown';
  const total = mpVal + mlaVal + leaderVal;

  return {
    year: safeYear,
    mps: Number.isFinite(mpVal) ? mpVal : 0,
    mlas: Number.isFinite(mlaVal) ? mlaVal : 0,
    politicalLeaders: Number.isFinite(leaderVal) ? leaderVal : 0,
    total
  };
}

// State Analysis
async function initStateAnalysis() {
  const select = document.getElementById('analysisStateSelect');
  const asStateName = document.getElementById('asStateName');
  const asRulingParty = document.getElementById('asRulingParty');
  const asTotal = document.getElementById('asTotal');
  const asFulfilled = document.getElementById('asFulfilled');
  const asPending = document.getElementById('asPending');
  const asBroken = document.getElementById('asBroken');
  const asDetailsList = document.getElementById('asDetailsList');
  const config = getLiveConfig();
  if (!select) return;

  // Load all states for dropdown
  const allStates = await fetchEndpointArray(config.endpoints.stateAnalysis);
  if (!allStates.length) {
    if (asDetailsList) asDetailsList.innerHTML = '<div class="track-item pending"><strong>State analysis unavailable</strong><span>Could not load state list from server.</span></div>';
    return;
  }

  select.innerHTML = '<option value="" disabled selected>Select a state to view analysis</option>' +
    allStates.map(s => `<option value="${s.state || s.name}">${s.state || s.name}</option>`).join('');

  async function loadStateAnalysis(stateName) {
    if (asStateName) asStateName.innerText = stateName;
    if (asRulingParty) asRulingParty.innerText = 'Loading...';
    if (asDetailsList) asDetailsList.innerHTML = '<div class="track-item pending"><strong>Fetching live news...</strong><span>Analysing news sentiment for this state.</span></div>';

    try {
      const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const API_BASE = IS_LOCAL && window.location.port !== '8787' ? 'http://localhost:8787' : '';
      const res = await fetch(`${API_BASE}/api/state-analysis/live?state=${encodeURIComponent(stateName)}`);
      if (!res.ok) throw new Error('API error');
      const sData = await res.json();

      const rulingParty = sData.rulingParty || 'N/A';
      const cm = sData.cm || 'N/A';
      if (asStateName) asStateName.innerText = sData.state || stateName;
      if (asRulingParty) {
        asRulingParty.innerText = `${rulingParty} — CM: ${cm}`;
        asRulingParty.style.background = `var(--party-${String(rulingParty).toLowerCase().replace(/[^a-z0-9]/g, '')}, var(--party-other))`;
      }
      if (asTotal) asTotal.innerText = sData.totalPromises || 'N/A';
      if (asFulfilled) asFulfilled.innerText = `${sData.fulfilledPct || 0}%`;
      if (asPending) asPending.innerText = `${sData.pendingPct || 0}%`;
      if (asBroken) asBroken.innerText = `${sData.brokenPct || 0}%`;

      const news = Array.isArray(sData.recentNews) ? sData.recentNews : [];
      if (asDetailsList) {
        asDetailsList.innerHTML = news.length
          ? news.map(item => `
            <div class="track-item fulfilled">
              <strong>${item.title || 'Update'}</strong>
              <span>${item.source || ''} — <a href="${item.url || '#'}" target="_blank" rel="noopener" style="color:var(--chakra-blue-light);">Read more</a></span>
            </div>`).join('')
          : '<div class="track-item pending"><strong>No recent news found</strong><span>No matching news articles for this state right now.</span></div>';
      }
    } catch (e) {
      if (asDetailsList) asDetailsList.innerHTML = '<div class="track-item pending"><strong>Failed to load</strong><span>Could not fetch state analysis. Try again later.</span></div>';
    }
  }

  if (!select.dataset.initialized) {
    select.addEventListener('change', e => loadStateAnalysis(e.target.value));
    select.dataset.initialized = 'true';
  }
}

// Member Assessment
async function initMemberAssessment() {
  const grid = document.getElementById('memberAssessmentGrid');
  const search = document.getElementById('memberSearchInput');
  const prev = document.getElementById('memPrevPage');
  const next = document.getElementById('memNextPage');
  const info = document.getElementById('memPageInfo');
  const config = getLiveConfig();
  const liveRows = await fetchEndpointArray(config.endpoints.memberPerformance);
  
  if (!grid) return;
  if (!liveRows.length) {
    grid.innerHTML = '<div class="track-item pending"><strong>Live member performance feed not connected</strong><span>Set endpoints.memberPerformance in data/live-config.js to show real performance data.</span></div>';
    return;
  }
  
  let currentPage = 1;
  const pageSize = 12;
  let filtered = liveRows;
  
  function render() {
    const start = (currentPage - 1) * pageSize;
    const pageData = filtered.slice(start, start + pageSize);
    
    grid.innerHTML = '';
    
    pageData.forEach((m) => {
      const score = Number(m.promiseFulfillment || m.fulfillment || 0);
      const att = Number(m.attendance || 0);
      const safeScore = Number.isFinite(score) ? score : 0;
      const safeAtt = Number.isFinite(att) ? att : 0;
      const partyName = m.party || 'N/A';
      
      const card = document.createElement('div');
      card.className = 'member-card glass-card';
      card.style.cursor = 'pointer';
      card.innerHTML = `
        <div class="member-profile">
          <div class="member-avatar">👤</div>
          <div class="member-info">
            <span class="member-name">${m.name}</span>
            <span class="member-constituency">${m.constituency || 'N/A'}, ${m.state || 'N/A'}</span>
            <span class="state-party-badge" style="background: var(--party-${String(partyName).toLowerCase().replace(/[^a-z0-9]/g, '')}, var(--party-other)); margin-top: 5px;">${partyName}</span>
          </div>
        </div>
        <div class="member-metrics">
          <div class="metric-bar">
            <span>Promise Fulfillment</span><span>${safeScore ? `${safeScore}%` : 'N/A'}</span>
          </div>
          <div class="metric-fill-bg">
            <div class="metric-fill" style="width: ${safeScore}%; background: ${safeScore > 70 ? 'var(--green-light)' : (safeScore > 50 ? 'var(--saffron)' : 'var(--error)')};"></div>
          </div>
          <div class="metric-bar" style="margin-top: 10px;">
            <span>${m.houseType === 'MLA' ? 'Assembly Attendance' : 'Parliament Attendance'}</span><span>${safeAtt ? `${safeAtt}%` : 'N/A'}</span>
          </div>
          <div class="metric-fill-bg">
            <div class="metric-fill" style="width: ${safeAtt}%; background: var(--chakra-blue-light);"></div>
          </div>
        </div>
      `;
      
      card.addEventListener('click', () => openProfileModal(m));
      grid.appendChild(card);
    });
    
    if (pageData.length === 0) grid.innerHTML = '<p>No members found.</p>';
    
    const totalPages = Math.ceil(filtered.length / pageSize) || 1;
    info.innerText = `Page ${currentPage} of ${totalPages}`;
    prev.disabled = currentPage === 1;
    next.disabled = currentPage === totalPages;
  }
  
  function openProfileModal(m) {
    const modal = document.getElementById('profileModal');
    if(!modal) return;
    
    document.getElementById('profileName').innerText = m.name;
    document.getElementById('profileLocation').innerText = `${m.constituency}, ${m.state}`;
    document.getElementById('profilePartyBadge').innerText = m.party || 'N/A';
    document.getElementById('profilePartyBadge').style.background = `var(--party-${String(m.party || 'other').toLowerCase().replace(/[^a-z0-9]/g, '')}, var(--party-other))`;

    document.getElementById('profileActivity').innerHTML = `
      <div class="activity-item">
        <strong>Latest Activity</strong>
        <p style="font-size: 12px; color: var(--text-secondary);">${m.latestActivity || 'No live activity feed provided by API.'}</p>
      </div>
    `;
    
    document.getElementById('profileExperience').innerHTML = `
      <div class="exp-item">
        <div class="exp-logo">🏛️</div>
        <div>
          <strong>${m.currentRole || 'Representative'}</strong>
          <p style="font-size: 12px; color: var(--text-secondary);">${m.term || 'Term not supplied'} • ${m.constituency || 'N/A'}</p>
          <p style="font-size: 13px; margin-top: 5px;">${m.committee || 'Committee data not available in live feed.'}</p>
        </div>
      </div>
    `;
    
    document.getElementById('profileSkills').innerHTML = `
      <div class="skill-item">
        <span>Policy Making</span>
        <span class="endorsements">${m.policyScore ? `${m.policyScore}%` : 'N/A'}</span>
      </div>
      <div class="skill-item">
        <span>Public Speaking</span>
        <span class="endorsements">${m.publicSpeakingScore ? `${m.publicSpeakingScore}%` : 'N/A'}</span>
      </div>
      <div class="skill-item">
        <span>Rural Development</span>
        <span class="endorsements">${m.ruralScore ? `${m.ruralScore}%` : 'N/A'}</span>
      </div>
    `;
    
    modal.style.display = 'flex';
  }
  
  const closeBtn = document.getElementById('closeProfileModal');
  if(closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('profileModal').style.display = 'none';
    });
  }
  
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('profileModal');
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
  
  function update() {
    const q = search.value.toLowerCase();
    filtered = liveRows.filter(m => m.name.toLowerCase().includes(q) || String(m.constituency || '').toLowerCase().includes(q));
    currentPage = 1;
    render();
  }
  
  let deb;
  search.addEventListener('input', () => {
    clearTimeout(deb);
    deb = setTimeout(update, 300);
  });
  
  prev.addEventListener('click', () => { if(currentPage > 1) { currentPage--; render(); }});
  next.addEventListener('click', () => { if(currentPage < Math.ceil(filtered.length/pageSize)) { currentPage++; render(); }});
  
  render();
}

function initThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  const root = document.documentElement;
  
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') {
    root.setAttribute('data-theme', 'light');
  }

  toggle.addEventListener('click', () => {
    const currentTheme = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
  });
}

function initMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const nav = document.getElementById('mainNav');
  const searchInput = document.getElementById('globalSearch');

  btn.addEventListener('click', () => {
    nav.classList.toggle('mobile-open');
    if (nav.classList.contains('mobile-open')) {
      searchInput.style.display = 'block';
    } else {
      searchInput.style.display = '';
    }
  });

  document.getElementById('searchToggle').addEventListener('click', () => {
    searchInput.style.display = searchInput.style.display === 'block' ? 'none' : 'block';
    if (searchInput.style.display === 'block') searchInput.focus();
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (target) {
        window.scrollTo({
          top: target.offsetTop - 80,
          behavior: 'smooth'
        });
        document.getElementById('mainNav').classList.remove('mobile-open');
      }
    });
  });
}

function initHeaderScroll() {
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

function initNavHighlight() {
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      if (window.scrollY >= sectionTop - 150) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in, .scale-in, .slide-left, .slide-right').forEach(el => {
    observer.observe(el);
  });
}

function initCounters() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = +el.getAttribute('data-target');
        let start = 0;
        const duration = 2000;
        const startTime = performance.now();

        function updateCounter(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // easeOutQuart
          const easeProgress = 1 - Math.pow(1 - progress, 4);
          const current = Math.floor(easeProgress * target);
          el.innerText = current;

          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          } else {
            el.innerText = target;
          }
        }
        requestAnimationFrame(updateCounter);
        observer.unobserve(el);
      }
    });
  });

  document.querySelectorAll('.stat-number').forEach(el => observer.observe(el));
}

function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(btn.getAttribute('data-tab')).classList.add('active');
    });
  });
}

function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    
    btn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      faqItems.forEach(fi => {
        fi.classList.remove('active');
        fi.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        fi.querySelector('.faq-answer').style.maxHeight = null;
      });

      if (!isActive) {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}

// Quiz
const quizData = [
  { q: "How many seats are in the Lok Sabha?", options: ["245", "543", "403", "288"], a: 1 },
  { q: "What voting system does India use for Lok Sabha?", options: ["Ranked Choice", "Proportional Representation", "First-Past-The-Post", "Single Transferable Vote"], a: 2 },
  { q: "Minimum age to vote in India?", options: ["16", "18", "21", "25"], a: 1 },
  { q: "Who appoints the Prime Minister?", options: ["Chief Justice", "President", "Rajya Sabha", "Election Commission"], a: 1 },
  { q: "How many members in the Rajya Sabha?", options: ["543", "403", "288", "245"], a: 3 },
  { q: "What does NOTA stand for?", options: ["National Options Target Agency", "None Of The Above", "No Other True Alternative", "Nominated Officials Training Academy"], a: 1 },
  { q: "How long is a Lok Sabha term?", options: ["4 years", "5 years", "6 years", "Permanent"], a: 1 },
  { q: "Which body conducts elections in India?", options: ["Parliament", "Supreme Court", "Election Commission of India", "NITI Aayog"], a: 2 }
];

function initQuiz() {
  let currentQ = 0;
  let score = 0;
  
  const qText = document.getElementById('quizQuestion');
  const qOptions = document.getElementById('quizOptions');
  const qNext = document.getElementById('quizNext');
  const qProgText = document.getElementById('quizProgressText');
  const qProgBar = document.getElementById('quizProgressBar');
  const qContainer = document.getElementById('quizContainer');
  const qResults = document.getElementById('quizResults');
  
  function loadQ() {
    const q = quizData[currentQ];
    qText.innerText = q.q;
    qOptions.innerHTML = '';
    qNext.style.display = 'none';
    
    qProgText.innerText = `Question ${currentQ + 1} of ${quizData.length}`;
    qProgBar.style.setProperty('--progress', `${((currentQ) / quizData.length) * 100}%`);

    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.innerText = opt;
      btn.onclick = () => selectOpt(idx, btn);
      qOptions.appendChild(btn);
    });
  }

  function selectOpt(idx, btn) {
    const q = quizData[currentQ];
    const btns = qOptions.querySelectorAll('button');
    btns.forEach(b => b.disabled = true);
    
    if (idx === q.a) {
      btn.classList.add('correct');
      score++;
    } else {
      btn.classList.add('incorrect');
      btns[q.a].classList.add('correct');
    }
    
    qNext.style.display = 'inline-block';
  }

  qNext.addEventListener('click', () => {
    currentQ++;
    if (currentQ < quizData.length) {
      loadQ();
    } else {
      qProgBar.style.setProperty('--progress', `100%`);
      showRes();
    }
  });

  function showRes() {
    qContainer.style.display = 'none';
    qResults.style.display = 'flex';
    document.getElementById('resultsScore').innerText = `${score} / ${quizData.length}`;
    
    let msg = "Keep learning!";
    if (score === 8) msg = "Expert!";
    else if (score >= 6) msg = "Great!";
    else if (score >= 4) msg = "Good effort!";
    
    document.getElementById('resultsMessage').innerText = msg;
  }

  document.getElementById('quizRestart').addEventListener('click', () => {
    currentQ = 0;
    score = 0;
    qContainer.style.display = 'flex';
    qResults.style.display = 'none';
    loadQ();
  });

  if (qContainer) loadQ();
}

function initStates() {
  const grid = document.getElementById('statesGrid');
  const map = document.getElementById('indiaStateMap');
  const tooltip = document.getElementById('stateMapTooltip');
  if (!grid || !window.STATES_DATA) return;

  const STATE_GOVERNANCE = {
    AP: { cm: 'N. Chandrababu Naidu', centralSupport: 'NDA / Centre-aligned' },
    AR: { cm: 'Pema Khandu', centralSupport: 'NDA / Centre-aligned' },
    AS: { cm: 'Himanta Biswa Sarma', centralSupport: 'NDA / Centre-aligned' },
    BR: { cm: 'Samrat Choudhary', centralSupport: 'NDA / Centre-aligned' },
    CG: { cm: 'Vishnu Deo Sai', centralSupport: 'NDA / Centre-aligned' },
    GA: { cm: 'Pramod Sawant', centralSupport: 'NDA / Centre-aligned' },
    GJ: { cm: 'Bhupendra Patel', centralSupport: 'NDA / Centre-aligned' },
    HR: { cm: 'Nayab Singh Saini', centralSupport: 'NDA / Centre-aligned' },
    HP: { cm: 'Sukhvinder Singh Sukhu', centralSupport: 'Opposition / Not aligned' },
    JH: { cm: 'Hemant Soren', centralSupport: 'Opposition / Not aligned' },
    KA: { cm: 'Siddaramaiah', centralSupport: 'Opposition / Not aligned' },
    KL: { cm: 'Pinarayi Vijayan', centralSupport: 'Opposition / Not aligned' },
    MP: { cm: 'Mohan Yadav', centralSupport: 'NDA / Centre-aligned' },
    MH: { cm: 'Devendra Fadnavis', centralSupport: 'NDA / Centre-aligned' },
    MN: { cm: 'Yumnam Khemchand Singh', centralSupport: 'NDA / Centre-aligned' },
    ML: { cm: 'Conrad Sangma', centralSupport: 'NDA / Centre-aligned' },
    MZ: { cm: 'Lalduhoma', centralSupport: 'Regional / Outside NDA' },
    NL: { cm: 'Neiphiu Rio', centralSupport: 'NDA / Centre-aligned' },
    OD: { cm: 'Mohan Charan Majhi', centralSupport: 'NDA / Centre-aligned' },
    PB: { cm: 'Bhagwant Mann', centralSupport: 'Opposition / Not aligned' },
    RJ: { cm: 'Bhajan Lal Sharma', centralSupport: 'NDA / Centre-aligned' },
    SK: { cm: 'Prem Singh Tamang', centralSupport: 'NDA / Centre-aligned' },
    TN: { cm: 'M. K. Stalin', centralSupport: 'Opposition / Not aligned' },
    TS: { cm: 'A. Revanth Reddy', centralSupport: 'Opposition / Not aligned' },
    TR: { cm: 'Manik Saha', centralSupport: 'NDA / Centre-aligned' },
    UP: { cm: 'Yogi Adityanath', centralSupport: 'NDA / Centre-aligned' },
    UK: { cm: 'Pushkar Singh Dhami', centralSupport: 'NDA / Centre-aligned' },
    WB: { cm: 'Mamata Banerjee', centralSupport: 'Opposition / Not aligned' },
    AN: { cm: 'N/A', centralSupport: 'Central administration' },
    CH: { cm: 'N/A', centralSupport: 'Central administration' },
    DN: { cm: 'N/A', centralSupport: 'Central administration' },
    DL: { cm: 'Rekha Gupta', centralSupport: 'NDA / Centre-aligned' },
    JK: { cm: 'Omar Abdullah', centralSupport: 'Opposition / Not aligned' },
    LA: { cm: 'N/A', centralSupport: 'Central administration' },
    LD: { cm: 'N/A', centralSupport: 'Central administration' },
    PY: { cm: 'N. Rangasamy', centralSupport: 'NDA / Centre-aligned' }
  };

  function getStateMeta(state) {
    return STATE_GOVERNANCE[state.code] || {
      cm: 'Data Unavailable',
      centralSupport: state.type === 'ut' ? 'Central administration' : 'Data Unavailable'
    };
  }

  function showTooltip(state, event) {
    if (!tooltip) return;
    const meta = getStateMeta(state);
    tooltip.innerHTML = `
      <strong>${state.name}</strong>
      <span>Ruling Party: ${state.rulingParty}</span>
      <span>CM: ${meta.cm}</span>
      <span>Central Support: ${meta.centralSupport}</span>
    `;
    tooltip.style.display = 'flex';

    const box = map.getBoundingClientRect();
    const pointerX = event?.clientX ?? box.left + (box.width / 2);
    const pointerY = event?.clientY ?? box.top + (box.height / 2);
    const left = Math.min(pointerX - box.left + 14, box.width - 260);
    const top = Math.min(pointerY - box.top + 14, box.height - 120);
    tooltip.style.left = `${Math.max(10, left)}px`;
    tooltip.style.top = `${Math.max(10, top)}px`;
  }

  function hideTooltip() {
    if (!tooltip) return;
    tooltip.style.display = 'none';
  }

  function featurePolygons(geometry) {
    if (!geometry) return [];
    if (geometry.type === 'Polygon') return geometry.coordinates || [];
    if (geometry.type === 'MultiPolygon') return (geometry.coordinates || []).flat();
    return [];
  }

  function projectPoint(lon, lat, bounds, width, height, pad) {
    const xRange = Math.max(1e-9, bounds.maxLon - bounds.minLon);
    const yRange = Math.max(1e-9, bounds.maxLat - bounds.minLat);
    const x = pad + ((lon - bounds.minLon) / xRange) * (width - (pad * 2));
    const y = pad + ((bounds.maxLat - lat) / yRange) * (height - (pad * 2));
    return [x, y];
  }

  async function renderBoundaryMap() {
    if (!map) return;

    try {
      const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const API_BASE = IS_LOCAL && window.location.port !== '8787' ? 'http://localhost:8787' : '';
      const response = await fetch(API_BASE + '/api/map/india-states');
      if (!response.ok) throw new Error(`Map endpoint error ${response.status}`);

      const geo = await response.json();
      const features = Array.isArray(geo.features) ? geo.features : [];
      if (!features.length) throw new Error('No map features available');

      const points = [];
      features.forEach((feature) => {
        featurePolygons(feature.geometry).forEach((ring) => {
          ring.forEach((coord) => {
            if (Array.isArray(coord) && coord.length >= 2) {
              points.push([Number(coord[0]), Number(coord[1])]);
            }
          });
        });
      });

      if (!points.length) throw new Error('No usable coordinates in map features');

      // Use reduce() instead of spread — Math.min(...hugeArray) causes stack overflow
      let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
      for (const p of points) {
        if (p[0] < minLon) minLon = p[0];
        if (p[0] > maxLon) maxLon = p[0];
        if (p[1] < minLat) minLat = p[1];
        if (p[1] > maxLat) maxLat = p[1];
      }
      const bounds = { minLon, maxLon, minLat, maxLat };

      const width = 720;
      const height = 640;
      const pad = 20;

      const pathMarkup = features.map((feature) => {
        const code = String(feature?.properties?.code || '').toUpperCase();
        const name = String(feature?.properties?.name || '').trim();
        const state = window.STATES_DATA.find((s) => s.code === code)
          || window.STATES_DATA.find((s) => s.name.toLowerCase() === name.toLowerCase());
        if (!state) return '';

        const d = featurePolygons(feature.geometry).map((ring) => {
          if (!ring.length) return '';
          const commands = ring.map((coord, idx) => {
            const [x, y] = projectPoint(Number(coord[0]), Number(coord[1]), bounds, width, height, pad);
            return `${idx === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
          }).join(' ');
          return `${commands} Z`;
        }).join(' ');

        const partyClass = state.rulingParty.toLowerCase().replace(/[^a-z0-9]/g, '');
        return `
          <path
            class="india-state-shape"
            data-code="${state.code}"
            data-name="${state.name}"
            style="--state-party: var(--party-${partyClass}, var(--party-other));"
            d="${d}"
          />
        `;
      }).join('');

      map.innerHTML = `
        <svg class="india-map-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="India map with state boundaries">
          ${pathMarkup}
        </svg>
      `;

      if (tooltip) {
        map.appendChild(tooltip);
      }

      map.querySelectorAll('.india-state-shape').forEach((shape) => {
        const code = shape.getAttribute('data-code');
        const name = shape.getAttribute('data-name');
        const state = window.STATES_DATA.find((s) => s.code === code);
        if (!state) return;

        shape.addEventListener('mousemove', (event) => showTooltip(state, event));
        shape.addEventListener('mouseenter', (event) => showTooltip(state, event));
        shape.addEventListener('mouseleave', hideTooltip);
        shape.addEventListener('click', () => window.openConstituencyModal(code));
        shape.style.cursor = 'pointer';
      });
    } catch (error) {
      map.innerHTML = `
        <div class="track-item pending" style="margin: 1rem;">
          <strong>India map unavailable</strong>
          <span>Failed to load boundary data from live source. ${error.message || ''}</span>
        </div>
      `;
      if (tooltip) map.appendChild(tooltip);
    }
  }

  renderBoundaryMap();

  grid.innerHTML = window.STATES_DATA.map(state => `
    <div class="state-card glass-card" data-name="${state.name.toLowerCase()}" onclick="window.openConstituencyModal('${state.code}')" style="cursor:pointer;" title="View constituency details">
      <div class="state-card-header">
        <h3 class="state-name">${state.name}</h3>
        <span class="state-code">${state.code}</span>
      </div>
      <div class="state-stats">
        <div class="state-stat"><span>Capital</span><span>${state.capital}</span></div>
        <div class="state-stat"><span>Lok Sabha</span><span>${state.loksabhaSeats}</span></div>
        <div class="state-stat"><span>Vidhan Sabha</span><span>${state.vidhanSabhaSeats || 'N/A'}</span></div>
        <div class="state-stat"><span>CM</span><span>${getStateMeta(state).cm}</span></div>
        <div class="state-stat"><span>Central Support</span><span>${getStateMeta(state).centralSupport}</span></div>
      </div>
      <div class="state-party-badge" style="background: var(--party-${state.rulingParty.toLowerCase().replace(/[^a-z0-9]/g, '')}, var(--party-other))">
        ${state.rulingParty}
      </div>
    </div>
  `).join('');
}

function initRepresentatives() {
  const tableBody = document.getElementById('repTableBody');
  const typeFilter = document.getElementById('repTypeFilter');
  const stateFilter = document.getElementById('stateFilter');
  const partyFilter = document.getElementById('partyFilter');
  const searchInput = document.getElementById('repSearchInput');
  const prevPage = document.getElementById('prevPage');
  const nextPage = document.getElementById('nextPage');
  const pageInfo = document.getElementById('pageInfo');
  const detailsModal = document.getElementById('repDetailsModal');
  const detailsClose = document.getElementById('closeRepDetailsModal');

  if (!tableBody) return;

  let currentPage = 1;
  const pageSize = 20;
  let filteredData = [];
  
  function populateStateFilter() {
    const states = window.STATES_DATA.map(s => s.name).sort();
    const current = stateFilter.value;
    stateFilter.innerHTML = '<option value="">All States</option>' + 
      states.map(s => `<option value="${s}" ${s === current ? 'selected' : ''}>${s}</option>`).join('');
  }

  function populatePartyFilter() {
    let parties = new Set();
    if (typeFilter.value === 'mp') {
      window.MP_DATA.forEach(mp => parties.add(mp.party));
    } else {
      Object.values(window.MLA_DATA).forEach(list => list.forEach(mla => parties.add(mla.party)));
    }
    const partyArr = Array.from(parties).sort();
    const current = partyFilter.value;
    partyFilter.innerHTML = '<option value="">All Parties</option>' + 
      partyArr.map(p => `<option value="${p}" ${p === current ? 'selected' : ''}>${p}</option>`).join('');
  }

  function renderTable() {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageData = filteredData.slice(start, end);

    tableBody.innerHTML = pageData.map((r, index) => `
      <tr>
        <td>
          <button class="rep-name-btn" type="button" data-index="${index}">${r.name}</button>
        </td>
        <td>${r.constituency}</td>
        <td>${r.state || stateFilter.value || 'Multiple'}</td>
        <td><span style="color: var(--party-${String(r.party).toLowerCase().replace(/[^a-z0-9]/g, '')}, var(--party-other)); font-weight: bold;">●</span> ${r.party}</td>
      </tr>
    `).join('');

    if (pageData.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 2rem; color: var(--text-secondary);">No representatives found. Try adjusting your filters.</td></tr>`;
    }

    const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
    pageInfo.innerText = `Page ${currentPage} of ${totalPages} (${filteredData.length} total)`;
    prevPage.disabled = currentPage === 1;
    nextPage.disabled = currentPage === totalPages;

    tableBody.querySelectorAll('.rep-name-btn').forEach(btn => {
      btn.onclick = () => {
        const item = pageData[Number(btn.dataset.index)];
        if (item) openRepresentativeDetails(item, typeFilter.value);
      };
    });
  }

  function updateData() {
    const type = typeFilter.value;
    const state = stateFilter.value;
    const party = partyFilter.value;
    const q = searchInput.value.toLowerCase().trim();

    let base = type === 'mp' ? window.MP_DATA : (state ? (window.MLA_DATA[state] || []) : Object.values(window.MLA_DATA).flat());
    
    filteredData = base.filter(r => {
      const matchState = !state || r.state === state || (type === 'mla' && !r.state);
      const matchParty = !party || r.party === party;
      const matchSearch = !q || r.name.toLowerCase().includes(q) || r.constituency.toLowerCase().includes(q);
      return matchState && matchParty && matchSearch;
    });

    currentPage = 1;
    renderTable();
  }

  if (tableBody.dataset.initialized) {
    populateStateFilter();
    populatePartyFilter();
    updateData();
    return;
  }
  tableBody.dataset.initialized = "true";

  typeFilter.onchange = () => {
    populatePartyFilter();
    updateData();
  };
  stateFilter.onchange = updateData;
  partyFilter.onchange = updateData;
  
  let debounce;
  searchInput.oninput = () => {
    clearTimeout(debounce);
    debounce = setTimeout(updateData, 300);
  };

  prevPage.onclick = () => { if (currentPage > 1) { currentPage--; renderTable(); }};
  nextPage.onclick = () => { if (currentPage < Math.ceil(filteredData.length / pageSize)) { currentPage++; renderTable(); }};

  if (detailsClose && detailsModal) {
    detailsClose.onclick = () => {
      detailsModal.style.display = 'none';
    };

    window.addEventListener('click', (e) => {
      if (e.target === detailsModal) {
        detailsModal.style.display = 'none';
      }
    });
  }

  populateStateFilter();
  populatePartyFilter();
  updateData();
}


function partyLean(partyCode) {
  const normalized = String(partyCode || '').toUpperCase();
  if (normalized === 'BJP' || normalized === 'INC') return 'National Party';
  if (normalized === 'AAP' || normalized === 'TMC' || normalized === 'DMK') return 'Regional-National Hybrid';
  if (normalized === 'SP' || normalized === 'BSP' || normalized === 'NCP' || normalized === 'AIMIM') return 'Regional Party';
  return 'Other / Independent Bloc';
}

function parameterBand(score) {
  if (!Number.isFinite(score)) return 'Unavailable';
  if (score >= 75) return 'High';
  if (score >= 55) return 'Moderate';
  return 'Low';
}

async function fetchRepresentativeDetails(rep, repType) {
  const config = getLiveConfig();
  if (!config.endpoints.representativeDetails) return null;
  try {
    const url = new URL(config.endpoints.representativeDetails, window.location.origin);
    url.searchParams.set('name', rep.name);
    url.searchParams.set('constituency', rep.constituency || '');
    url.searchParams.set('type', repType);
    const response = await fetch(url.toString());
    if (!response.ok) return null;
    return await response.json();
  } catch { return null; }
}

async function openRepresentativeDetails(rep, repType) {
  const detailsModal = document.getElementById('repDetailsModal');
  if (!detailsModal) return;

  const KNOWN_REP_PHOTOS = {
    'Narendra Modi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Shri_Narendra_Modi%2C_Prime_Minister_of_India.jpg/440px-Shri_Narendra_Modi%2C_Prime_Minister_of_India.jpg',
    'Rahul Gandhi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Rahul_Gandhi_in_WEF_2020.jpg/440px-Rahul_Gandhi_in_WEF_2020.jpg',
    'Amit Shah': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Amit_Shah_in_2023.jpg/440px-Amit_Shah_in_2023.jpg'
  };

  const liveDetails = await fetchRepresentativeDetails(rep, repType);
  const assessment = liveDetails?.assessment || {};
  const deepProfile = liveDetails?.profile || {};
  const partyVar = `var(--party-${rep.party.toLowerCase().replace(/[^a-z0-9]/g, '')}, var(--party-other))`;
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(rep.name)}&background=1a56db&color=ffffff&size=256&bold=true`;
  const profileImage = liveDetails?.image || KNOWN_REP_PHOTOS[rep.name] || fallbackAvatar;

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.innerText = value || 'N/A';
  };

  setText('repDetailsName', rep.name);
  setText('repDetailsRole', liveDetails?.roleLabel || (repType === 'mla' ? 'State MLA' : 'Lok Sabha MP'));
  setText('repDetailsConstituency', `${rep.constituency}, ${rep.state || 'India'}`);
  setText('repDetailsStatus', assessment.politicalStatus || 'Unavailable');
  setText('repDetailsPartyLean', partyLean(rep.party));
  setText('repDetailsTenure', deepProfile.tenureYears ? `${deepProfile.tenureYears} years` : 'N/A');
  setText('repDetailsOverall', Number.isFinite(assessment.overallScore) ? `${assessment.overallScore}%` : 'N/A');
  setText('repDetailsWinChance', Number.isFinite(assessment.winProbability) ? `${assessment.winProbability}%` : 'N/A');
  setText('repDetailsAlliance', Number.isFinite(assessment.allianceStrength) ? `${assessment.allianceStrength}%` : 'N/A');
  setText('repDetailAge', deepProfile.age ? String(deepProfile.age) : 'N/A');
  setText('repDetailEducation', deepProfile.education);
  setText('repDetailProfession', deepProfile.profession);
  setText('repDetailCases', deepProfile.cases || 'N/A');
  setText('repDetailAssets', deepProfile.assets);
  setText('repDetailLiabilities', deepProfile.liabilities);
  setText('repDetailNetWorth', deepProfile.netWorth);
  setText('repDetailIssues', deepProfile.priorityIssues);

  const partyBadge = document.getElementById('repDetailsPartyBadge');
  if (partyBadge) { partyBadge.innerText = rep.party; partyBadge.style.background = partyVar; }

  const image = document.getElementById('repDetailsImage');
  if (image) {
    image.onerror = () => { image.onerror = null; image.src = fallbackAvatar; };
    image.src = profileImage;
    image.alt = `${rep.name} profile image`;
  }

  const list = document.getElementById('repAssessmentList');
  if (list) {
    const params = Array.isArray(assessment.parameters) ? assessment.parameters : [];
    list.innerHTML = params.length ? params.map(param => {
      const band = parameterBand(param.value);
      const color = !Number.isFinite(param.value) ? 'var(--text-secondary)' : (param.value >= 75 ? 'var(--green-light)' : (param.value >= 55 ? 'var(--saffron)' : 'var(--error)'));
      const w = Number.isFinite(param.value) ? Math.max(0, Math.min(100, Number(param.value))) : 0;
      return `<div class="rep-param-item"><div class="rep-param-head"><span>${param.key}</span><strong>${Number.isFinite(param.value) ? `${param.value}%` : 'N/A'}</strong></div><div class="rep-param-track"><div class="rep-param-fill" style="width:${w}%;background:${color};"></div></div><div class="rep-param-band" style="color:${color};">${band}</div></div>`;
    }).join('') : '<div class="track-item pending"><strong>No live assessment parameters</strong><span>Representative details API did not return parameter scores.</span></div>';
  }

  const highlights = document.getElementById('repHighlights');
  if (highlights) {
    const notes = Array.isArray(assessment.highlights) ? assessment.highlights : [];
    highlights.innerHTML = notes.length ? notes.map(h => `<li>${h}</li>`).join('') : '<li>No live highlights available for this representative.</li>';
  }

  const electionHistory = document.getElementById('repElectionHistory');
  if (electionHistory) {
    const history = Array.isArray(deepProfile.electionHistory) ? deepProfile.electionHistory : [];
    electionHistory.innerHTML = history.length ? history.map(item => {
      const color = item.result === 'Won' ? 'var(--green-light)' : 'var(--error)';
      return `<tr><td>${item.year}</td><td style="color:${color};font-weight:700;">${item.result}</td><td>${item.voteShare ? `${item.voteShare}%` : 'N/A'}</td><td>${item.margin}</td></tr>`;
    }).join('') : '<tr><td colspan="4" style="text-align:center;">No election history returned.</td></tr>';
  }

  const manifesto = document.getElementById('repManifestoList');
  if (manifesto) {
    const rows = Array.isArray(deepProfile.manifesto) ? deepProfile.manifesto : [];
    manifesto.innerHTML = rows.length ? rows.map(item => {
      const color = item.status === 'Fulfilled' ? 'var(--green-light)' : (item.status === 'In Progress' ? 'var(--saffron)' : 'var(--error)');
      return `<div class="rep-manifesto-item"><div class="rep-manifesto-head"><strong>${item.title}</strong><span class="rep-manifesto-status" style="color:${color};">${item.status}</span></div><div class="rep-param-track"><div class="rep-param-fill" style="width:${Number(item.completion)||0}%;background:${color};"></div></div><div class="rep-manifesto-foot">Completion: ${Number.isFinite(Number(item.completion)) ? `${item.completion}%` : 'N/A'}</div></div>`;
    }).join('') : '<div class="track-item pending"><strong>No manifesto mapping</strong><span>Representative detail feed does not include manifesto mapping yet.</span></div>';
  }

  detailsModal.style.display = 'flex';
}


function initPromises() {
  if (!window.PROMISES_DATA) return;
  const d = window.PROMISES_DATA;

  // Summary Cards
  const summaryCont = document.getElementById('promisesSummaryCards');
  if (summaryCont) {
    summaryCont.innerHTML = `
      <div class="summary-card total glass-card scale-in"><div class="summary-value stat-number" data-target="${d.summary.total}">${d.summary.total}</div><div class="summary-label">Total</div></div>
      <div class="summary-card fulfilled glass-card scale-in" style="--delay:100ms"><div class="summary-value stat-number" data-target="${d.summary.fulfilled}">${d.summary.fulfilled}</div><div class="summary-label">Fulfilled</div></div>
      <div class="summary-card in-progress glass-card scale-in" style="--delay:200ms"><div class="summary-value stat-number" data-target="${d.summary.inProgress}">${d.summary.inProgress}</div><div class="summary-label">In Progress</div></div>
      <div class="summary-card not-started glass-card scale-in" style="--delay:300ms"><div class="summary-value stat-number" data-target="${d.summary.notStarted}">${d.summary.notStarted}</div><div class="summary-label">Not Started</div></div>
    `;
  }

  // Accordion
  const accordion = document.getElementById('promisesAccordion');
  if (accordion) {
    accordion.innerHTML = '';
    d.categories.forEach(cat => {
      const fulfilled = cat.promises.filter(p => p.status === 'fulfilled').length;
      const total = cat.promises.length;
      const perc = (fulfilled / total) * 100;
      
      const item = document.createElement('div');
      item.innerHTML = `
        <div class="category-header">
          <div class="category-title"><span>${cat.name}</span></div>
          <div class="category-progress">
            <span>${fulfilled}/${total} Fulfilled</span>
            <div class="category-progress-bar"><div class="category-progress-fill" style="width: ${perc}%"></div></div>
          </div>
        </div>
        <div class="category-content">
          <div class="promise-list">
            ${cat.promises.map(p => `
              <div class="promise-item status-${p.status}">
                <div class="promise-header">
                  <span class="promise-title">${p.title}</span>
                  <span class="status-badge status-${p.status}">${p.status.replace('-', ' ')}</span>
                </div>
                <div class="promise-desc">${p.description} (${p.year || '2024'})</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      const header = item.querySelector('.category-header');
      const content = item.querySelector('.category-content');
      header.onclick = () => {
        if (content.style.maxHeight) {
          content.style.maxHeight = null;
        } else {
          content.style.maxHeight = content.scrollHeight + "px";
        }
      };
      accordion.appendChild(item);
    });
  }

  // Charts
  setTimeout(() => {
    drawLineChart(d);
    drawPieChart(d);
  }, 500);
}

function drawLineChart(data) {
  const canvas = document.getElementById('lineChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = 300;

  const years = [2020, 2021, 2022, 2023, 2024];
  // Calculate trend from currently loaded promise records
  const totalByYear = years.map(y => data.categories.reduce((acc, cat) => acc + cat.promises.filter(p => p.year === y).length, 0));
  const fulfilledByYear = years.map(y => data.categories.reduce((acc, cat) => acc + cat.promises.filter(p => p.year === y && p.status === 'fulfilled').length, 0));
  
  const w = canvas.width;
  const h = canvas.height;
  const padding = 40;
  const maxVal = Math.max(...totalByYear) + 2;
  const xStep = (w - padding*2) / (years.length - 1);
  const yScale = (h - padding*2) / maxVal;

  ctx.clearRect(0, 0, w, h);
  
  // Draw axes
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, h - padding);
  ctx.lineTo(w - padding, h - padding);
  ctx.stroke();

  // Draw lines
  function drawTrend(dataSet, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    dataSet.forEach((val, i) => {
      const x = padding + (i * xStep);
      const y = h - padding - (val * yScale);
      if(i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Draw points
    ctx.fillStyle = color;
    dataSet.forEach((val, i) => {
      const x = padding + (i * xStep);
      const y = h - padding - (val * yScale);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI*2);
      ctx.fill();
      
      if(i === years.length - 1) {
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-primary');
        ctx.font = '12px Arial';
        ctx.fillText(color === '#FF9933' ? 'Total' : 'Fulfilled', x + 10, y);
        ctx.fillStyle = color;
      }
    });
  }

  drawTrend(totalByYear, '#FF9933'); // Saffron
  drawTrend(fulfilledByYear, '#1db954'); // Green
  
  // X-axis labels
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-primary');
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  years.forEach((yr, i) => {
    ctx.fillText(yr, padding + (i * xStep), h - padding + 20);
  });
}

function drawPieChart(data) {
  const canvas = document.getElementById('pieChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = 300;
  
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = Math.min(cx, cy) - 20;
  
  const { total, fulfilled, inProgress, notStarted } = data.summary;
  const segments = [
    { val: fulfilled, color: '#1db954', label: 'Fulfilled' },
    { val: inProgress, color: '#FF9933', label: 'In Progress' },
    { val: notStarted, color: '#8a8aaa', label: 'Not Started' }
  ];
  
  let startAngle = -0.5 * Math.PI;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  segments.forEach(seg => {
    const sliceAngle = (seg.val / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy); // Move to center for Pie Chart (not donut)
    ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    
    // Draw labels
    const midAngle = startAngle + sliceAngle / 2;
    const labelX = cx + (r * 0.6) * Math.cos(midAngle);
    const labelY = cy + (r * 0.6) * Math.sin(midAngle);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if(seg.val > 0) ctx.fillText(Math.round((seg.val/total)*100) + '%', labelX, labelY);

    startAngle += sliceAngle;
  });
  
  // Legend
  ctx.textAlign = 'left';
  segments.forEach((seg, i) => {
    ctx.fillStyle = seg.color;
    ctx.fillRect(10, 10 + (i * 20), 12, 12);
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-primary');
    ctx.font = '12px Arial';
    ctx.fillText(seg.label, 30, 20 + (i * 20));
  });
}

function initGlobalSearch() {
  const input = document.getElementById('globalSearch');
  const searchWrapper = document.getElementById('searchWrapper');
  
  const dropdown = document.createElement('div');
  dropdown.className = 'search-results-dropdown';
  searchWrapper.appendChild(dropdown);
  
  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    const q = input.value.toLowerCase().trim();
    if (q.length < 2) {
      dropdown.classList.remove('active');
      return;
    }
    
    debounce = setTimeout(() => {
      let results = '';
      
      // MPs
      const mps = window.MP_DATA ? window.MP_DATA.filter(m => m.name.toLowerCase().includes(q) || m.constituency.toLowerCase().includes(q)).slice(0,3) : [];
      if (mps.length) {
        results += `<div class="search-category-label">Lok Sabha MPs</div>`;
        mps.forEach(m => results += `<div class="search-result-item" onclick="document.location.href='#representatives'">
          <div class="search-result-title">${m.name}</div>
          <div class="search-result-desc">${m.constituency}, ${m.party}</div>
        </div>`);
      }
      
      // States
      const states = window.STATES_DATA ? window.STATES_DATA.filter(s => s.name.toLowerCase().includes(q)).slice(0,3) : [];
      if (states.length) {
        results += `<div class="search-category-label">States & UTs</div>`;
        states.forEach(s => results += `<div class="search-result-item" onclick="document.location.href='#states'">
          <div class="search-result-title">${s.name}</div>
          <div class="search-result-desc">Capital: ${s.capital}</div>
        </div>`);
      }
      
      // FAQ
      const faqs = Array.from(document.querySelectorAll('.faq-item')).filter(f => f.getAttribute('data-searchable').includes(q)).slice(0,3);
      if (faqs.length) {
        results += `<div class="search-category-label">FAQ</div>`;
        faqs.forEach(f => {
          const qText = f.querySelector('.faq-question span').innerText;
          results += `<div class="search-result-item" onclick="document.location.href='#faq'; document.getElementById('${f.id}').scrollIntoView()">
            <div class="search-result-title">${qText}</div>
          </div>`;
        });
      }
      
      if (!results) {
        results = `<div class="search-result-item"><div class="search-result-desc">No results found</div></div>`;
      }
      
      dropdown.innerHTML = results;
      dropdown.classList.add('active');
    }, 300);
  });
  
  document.addEventListener('click', (e) => {
    if (!searchWrapper.contains(e.target)) {
      dropdown.classList.remove('active');
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') dropdown.classList.remove('active');
  });
}

/**
 * Premium Hero Map — India neon political map with party fills
 */
async function initHeroNeonMap() {
  const container = document.getElementById('heroMap');
  if (!container) return;

  try {
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE = IS_LOCAL && window.location.port !== '8787' ? 'http://localhost:8787' : '';
    const response = await fetch(API_BASE + '/api/map/india-states');
    if (!response.ok) throw new Error('Map data unavailable');
    const geo = await response.json();
    const features = geo.features || [];
    if (!features.length) throw new Error('No features');

    // Collect all coordinates safely (no spread on huge arrays)
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    features.forEach(f => {
      const geom = f.geometry;
      const rings = geom.type === 'Polygon' ? geom.coordinates :
                    geom.type === 'MultiPolygon' ? geom.coordinates.flat() : [];
      rings.forEach(ring => ring.forEach(coord => {
        const lon = Number(coord[0]), lat = Number(coord[1]);
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }));
    });

    const W = 440, H = 500, PAD = 24;
    const project = (lon, lat) => [
      PAD + ((lon - minLon) / (maxLon - minLon)) * (W - PAD * 2),
      PAD + ((maxLat - lat) / (maxLat - minLat)) * (H - PAD * 2)
    ];

    const PARTY_COLORS = {
      bjp: '#FF9933', inc: '#00BFFF', aap: '#0066CC', tmc: '#2E8B57',
      dmk: '#CC0000', sp: '#EE1111', bsp: '#1111FF', ncp: '#004C99',
      tdp: '#f6d32d', jmm: '#3f8f3f', cpim: '#d7263d', nc: '#c026d3',
      zpm: '#8b5cf6', skm: '#0ea5e9', nda: '#FF9933', other: '#4a5080'
    };

    function getPartyColor(rulingParty) {
      if (!rulingParty) return PARTY_COLORS.other;
      const key = rulingParty.toLowerCase().replace(/[^a-z0-9]/g, '');
      return PARTY_COLORS[key] || PARTY_COLORS.other;
    }

    // Build state paths
    const statePaths = features.map(f => {
      const name = f.properties?.name || '';
      const state = window.STATES_DATA?.find(s => s.name === name);
      const color = state ? getPartyColor(state.rulingParty) : PARTY_COLORS.other;
      const geom = f.geometry;
      const rings = geom.type === 'Polygon' ? geom.coordinates :
                    geom.type === 'MultiPolygon' ? geom.coordinates.flat() : [];
      const d = rings.map(ring => {
        if (!ring.length) return '';
        return ring.map((c, i) => {
          const [x, y] = project(Number(c[0]), Number(c[1]));
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
        }).join('') + 'Z';
      }).join(' ');
      if (!d.trim()) return '';
      return `<path d="${d}" fill="${color}" fill-opacity="0.55" stroke="rgba(255,255,255,0.18)" stroke-width="0.6"
        class="state-path" onclick="window.openConstituencyModal('${name.replace(/'/g, '')}')"
        data-name="${name.replace(/"/g, '')}"><title>${name}</title></path>`;
    }).join('');

    // Major cities
    const cities = [
      { n: 'Delhi',     lat: 28.61, lon: 77.21 },
      { n: 'Mumbai',    lat: 19.08, lon: 72.88 },
      { n: 'Kolkata',   lat: 22.57, lon: 88.36 },
      { n: 'Chennai',   lat: 13.08, lon: 80.27 },
      { n: 'Bengaluru', lat: 12.97, lon: 77.59 },
      { n: 'Hyderabad', lat: 17.38, lon: 78.49 },
      { n: 'Patna',     lat: 25.61, lon: 85.14 }
    ];
    const cityMarkup = cities.map(c => {
      const [x, y] = project(c.lon, c.lat);
      const id = `city-pulse-${c.n.replace(/\s/g,'')}`;
      return `<g>
        <circle cx="${x}" cy="${y}" r="5" fill="rgba(255,255,255,0.15)" class="city-pulse" id="${id}"/>
        <circle cx="${x}" cy="${y}" r="2.5" fill="#00ffff" filter="url(#glowFilter)"/>
        <text x="${x + 6}" y="${y + 3}" class="city-label">${c.n}</text>
      </g>`;
    }).join('');

    // Scanline grid
    const gridLines = [];
    for (let gx = 0; gx <= W; gx += 44)
      gridLines.push(`<line x1="${gx}" y1="0" x2="${gx}" y2="${H}" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>`);
    for (let gy = 0; gy <= H; gy += 44)
      gridLines.push(`<line x1="0" y1="${gy}" x2="${W}" y2="${gy}" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>`);

    container.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" class="india-neon-map" aria-label="India political map showing state ruling parties">
        <defs>
          <radialGradient id="mapBgGrad" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stop-color="#1a1f4e" stop-opacity="1"/>
            <stop offset="100%" stop-color="#0a0e27" stop-opacity="1"/>
          </radialGradient>
          <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="stateGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="6" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <style>
            @keyframes cityPulse {
              0%,100% { r: 5; opacity: 0.15; }
              50% { r: 10; opacity: 0; }
            }
            .city-pulse { animation: cityPulse 2.5s ease-out infinite; }
            .state-path { transition: fill-opacity 0.2s, filter 0.2s; cursor: pointer; }
            .state-path:hover { fill-opacity: 0.85; filter: url(#stateGlow); }
          </style>
        </defs>

        <!-- Background -->
        <rect width="${W}" height="${H}" fill="url(#mapBgGrad)" rx="12"/>

        <!-- Grid overlay -->
        <g opacity="1">${gridLines.join('')}</g>

        <!-- State fills -->
        <g>${statePaths}</g>

        <!-- Cities -->
        <g>${cityMarkup}</g>

        <!-- Border glow ring -->
        <rect width="${W}" height="${H}" fill="none" rx="12"
          stroke="rgba(26,86,219,0.3)" stroke-width="1.5"
          filter="url(#glowFilter)"/>
      </svg>`;

  } catch (err) {
    // Fallback: render a beautiful static SVG placeholder
    container.innerHTML = `
      <svg viewBox="0 0 440 500" class="india-neon-map" aria-label="India map placeholder">
        <defs>
          <radialGradient id="fallbackBg" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stop-color="#1a1f4e"/><stop offset="100%" stop-color="#0a0e27"/>
          </radialGradient>
        </defs>
        <rect width="440" height="500" fill="url(#fallbackBg)" rx="12"/>
        <path d="M167 54l44 15 26 40 55 17 63 44 8 46-19 39 12 38-29 24 9 42-34 25-10 49-39 39-32 5-27 58-52-26-16-54-49-23-28-58 13-47-34-28-25-70 21-73 42-58 49-18 28-44 44-12z"
          transform="translate(50,20) scale(1.1)"
          fill="rgba(26,86,219,0.25)" stroke="rgba(26,86,219,0.6)" stroke-width="1.5"
          filter="drop-shadow(0 0 12px rgba(26,86,219,0.5))"/>
        <text x="220" y="260" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="13" font-family="Inter,sans-serif">India</text>
        <text x="220" y="480" text-anchor="middle" fill="rgba(255,255,255,0.2)" font-size="10" font-family="Inter,sans-serif">Map data loading...</text>
      </svg>`;
  }
}
