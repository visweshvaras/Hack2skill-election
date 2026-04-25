# Phase 1: Indian Election & Politics Assistant - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a comprehensive Indian election & politics assistant as a single-page web app using vanilla HTML/CSS/JS. The app educates users on India's election process (Lok Sabha, Rajya Sabha, Vidhan Sabha), provides searchable databases of all 543 Lok Sabha MPs and ~4,120 state-wise MLAs, displays interactive government promise fulfillment charts, and includes quizzes and FAQs — all with a premium 2026 design and under 10MB total.

</domain>

<decisions>
## Implementation Decisions

### Stack
- Vanilla HTML + CSS + JavaScript (no React, no build tools)
- Files: index.html, index.css, app.js, data/mp-data.js, data/mla-data.js, data/promises-data.js, data/states-data.js
- Google Fonts (Inter for body, Outfit for headings) via CDN
- No npm packages, no Chart.js — custom canvas charts

### Design System (2026 Aesthetic with Indian Identity)
- **Liquid Glass / Glassmorphism:** Semi-transparent cards with backdrop-filter blur
- **Mesh Gradients:** Aurora-style animated background with saffron, green, blue tones
- **Color Palette:**
  - Dark base: #0a0e27 (deep navy)
  - Saffron accent: #FF9933 (Indian flag)
  - Green accent: #138808 (Indian flag)
  - Chakra Blue: #1a56db (inspired by Ashoka Chakra)
  - White: #f0f0ff (text on dark)
  - Coral highlight: #ff6b6b (alerts/important)
  - Gold: #ffd166 (badges/stars)
- **Typography:** Inter (body, 400/500/600), Outfit (headings, 700/800)
- **Shape:** Rounded corners (12-16px cards, 8px buttons, full-round pills)
- **Micro-animations:** 200-500ms transitions, scroll reveals, hover transforms
- **Dark mode primary** with light mode toggle

### Data Architecture
- **MP Data (data/mp-data.js):** Array of ~543 objects: { name, constituency, state, party }. Estimated ~60-80KB.
- **MLA Data (data/mla-data.js):** Object keyed by state, each containing array of MLA objects: { name, constituency, party }. Estimated ~400-500KB. Include representative sample data for ALL 28 states + 3 UTs with assemblies.
- **States Data (data/states-data.js):** Array of 36 states/UTs: { name, code, loksabhaSeats, vidhanSabhaSeats, rulingParty, capital, type: 'state'|'ut' }
- **Promise Data (data/promises-data.js):** Categorized promise objects with status tracking. ~20-30KB.

### Content Sections (Tab-based Navigation)
1. **Hero** — Animated overview of Indian democracy, key stats (543 LS seats, 245 RS seats, 28 states, 900M+ voters)
2. **Election Process** — How Lok Sabha, Rajya Sabha, Vidhan Sabha elections work (FPTP, STV, ECI role, EVMs, NOTA)
3. **Representatives** — Tabbed sub-section:
   - MPs tab: Searchable/filterable table of all 543 Lok Sabha MPs
   - MLAs tab: State selector → searchable MLA list for that state
4. **State Explorer** — Grid of all states with quick stats, click to see details
5. **Promise Tracker** — Canvas charts: bar chart (category-wise), donut chart (overall status), progress bars per category
6. **Quiz** — 8 questions on Indian democracy
7. **FAQ** — 10 questions about Indian elections

### Chart Specifications (Custom Canvas)
- **Bar Chart:** Categories on X-axis (Infrastructure, Economy, Welfare, Health, Education, Agriculture), stacked bars showing Fulfilled (green), In Progress (saffron), Not Started (grey)
- **Donut Chart:** Overall promise fulfillment percentage with animated segments
- **Progress Bars:** Per-category horizontal progress bars with percentage labels

### Agent's Discretion
- Exact animation timings and easing curves
- Internal code organization
- Specific quiz questions (should cover ECI, electoral process, constitutional provisions)
- Chart animation details

</decisions>

<canonical_refs>
## Canonical References

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<specifics>
## Specific Ideas

- Use CSS `backdrop-filter: blur()` for glass cards
- Mesh gradient background with saffron and green blobs (subtle Indian tricolor vibe)
- Representatives section: virtual scrolling or pagination for large MLA lists
- Search should be instant (debounced 200ms) across MP names, constituencies, parties
- Promise data should be unbiased — present factual status without political commentary
- Charts should animate on scroll into view
- State explorer cards should show party colors as accent borders
- All data files loaded via script tags (not fetch) to work without a server
- Keep total data files under 700KB

</specifics>

<deferred>
## Deferred Ideas

- Real-time API integration with ECI data
- Rajya Sabha member database
- Historical election results
- Constituency-level maps
- Multi-language support (Hindi, regional languages)

</deferred>

---

*Phase: 01-election-assistant*
*Context gathered: 2026-04-26*
