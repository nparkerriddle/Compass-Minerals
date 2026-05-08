# Compass Minerals — Workforce Tracker
**Version:** v1.0.0  
**Client:** Compass Minerals  
**Built by:** YES (Your Employment Solutions)  
**Last updated:** 2026-05-07

---

## Overview
Internal workforce tracker for YES's Compass Minerals account. Shows active worker headcount by department and shift, open positions, waitlist size, and attrition/termination analytics. Data is sourced from the `Compass Tracker.xlsx` spreadsheet (not a live API yet).

---

## Tech Stack
| Layer | Tool |
|-------|------|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts 3 |
| Tables | TanStack Table v8 |
| Data fetching | TanStack Query v5 |
| Build target | ES2020 |

---

## Setup
```bash
npm install
npm run extract-data   # re-parse the Excel file → updates public/data/compass-data.json
npm run dev            # dev server at localhost:5173
npm run build          # production build → dist/
```

---

## Data Flow
1. Place updated `Compass Tracker.xlsx` in the `YES Projects/` folder (parent directory)
2. Run `npm run extract-data` — this reads the Excel file and writes `public/data/compass-data.json`
3. The dashboard fetches `/data/compass-data.json` at runtime

> **No API key required.** This version uses static JSON extracted from the spreadsheet.

---

## Deployment Notes
- Run `npm run build` → zip the `dist/` folder
- Admin imports `dist/` to company server
- The `public/data/compass-data.json` file must be included in the dist — it is served as a static asset

---

## Authentication
**Current:** None (this is a test build — add password gate before production)  
**To add:** Create a simple `LoginGate` component wrapping `<Dashboard />` in App.jsx, using `VITE_DASHBOARD_PASSWORD` from `.env`

---

## Sensitive Data
- Worker names, wages, and phone numbers are in the extracted JSON
- Do not commit `public/data/compass-data.json` to a public repository
- Add `public/data/` to `.gitignore` if this repo goes public

---

## Folder Structure
```
src/
  App.jsx                        — root component
  main.jsx                       — entry point + QueryClient
  index.css                      — Tailwind import
  components/
    shared/                      — reusable component library (KpiCard, DataTable, etc.)
  features/
    dashboard/
      Dashboard.jsx              — main dashboard with Overview / Workers / Attrition tabs
      useCompassData.js          — React Query hook for fetching compass-data.json
  data/
    compass-data.json            — extracted data (source of truth for src; copy in public/)
scripts/
  extract-data.mjs               — parses Compass Tracker.xlsx → compass-data.json
public/
  data/
    compass-data.json            — served as static asset
```

---

## Sheets Parsed
| Sheet | What it provides |
|-------|-----------------|
| Haul Data 25-26 | Active Haul Driver / Operator headcount |
| Fueler-HEO-Salt-Mag | Active workers in other departments |
| Termed or DNA | Termed (123) and DNA (39) workers |
| Waitlist-Furlough | Pending / furloughed candidates |
| Wait List 2.0 | Waitlisted candidates by department |
| Openings | Open requisitions with fill dates |
| Payroll | REG/OT hour totals |
| Attrition Dashboard | Term reasons + dept termination counts |

---

## Known Quirks
- The `Wait List 2.0` sheet uses a complex multi-column layout (one column group per department). The extraction script counts unique names across 6-column groups.
- `Openings` headers are on row 2 (not row 1) — the script accounts for this.
- Attrition `Term Reasons` are labeled with prefixes: `LG` = let go, `Q` = quit, `TH` = transferred/hired.

---

## Changelog
### v1.0.0 — 2026-05-07
- Initial build from Compass Tracker.xlsx
- Three-tab layout: Overview, Workers, Attrition
- KPI cards, department/shift bar charts, worker table with filters
