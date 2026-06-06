# Compass Minerals — Workforce Tracker
**Version:** v1.0.0
**Client:** Compass Minerals
**Built by:** YES (Your Employment Solutions)
**Last updated:** 2026-06-06

---

## Overview
Internal workforce tracker for YES's Compass Minerals onsite. Replaces the `Compass Tracker.xlsx` spreadsheet with a CRUD dashboard covering active headcount, open positions, the waitlist, furloughs, attendance points, attrition analytics, and the Spring Breakfast event. All data is editable in-app and persisted to the browser's local storage.

---

## Tech Stack
| Layer | Tool |
|-------|------|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 (light + dark mode) |
| State / persistence | Zustand v5 with `persist` (localStorage) |
| Charts | Recharts 3 |
| Tables | TanStack Table v8 |
| Build target | ES2020 |

---

## Setup
```bash
npm install
npm run extract-data   # OPTIONAL — parse Compass Tracker.xlsx → src/data/compass-data.json (seed data)
npm run dev            # dev server at localhost:5173
npm run build          # production build → dist/
npm run lint           # eslint
```

> The app **builds and runs without any data file** — it falls back to an empty
> dashboard you can populate through the UI. `extract-data` is only needed to
> seed it from the spreadsheet.

---

## Data Flow
1. **Seed (optional):** place an updated `Compass Tracker.xlsx` in the parent `YES Projects/` folder and run `npm run extract-data`. This writes `src/data/compass-data.json` (gitignored — contains PII).
2. **Load:** on first run the Zustand store seeds itself from that JSON if present (via `import.meta.glob`, so a missing file does not break the build), otherwise from the empty `src/lib/sampleData.js`.
3. **Edit & persist:** every section is full CRUD. Changes are saved to `localStorage` under the key `compass-dashboard-v1`. Re-running `extract-data` does **not** overwrite a user's existing local data — the seed only applies on first load / cleared storage.

---

## Deployment
- `npm run build` → zip the `dist/` folder → admin imports to the company server.
- It's a static SPA; no server or API key required.
- Because data lives in each browser's localStorage, the dashboard is per-device. (Future: a shared backend — see Roadmap.)

---

## Authentication
**Current:** none. `.env.example` reserves `VITE_DASHBOARD_PASSWORD` for a future password gate.
**To add:** wrap `<App />` in a `LoginGate` that checks `import.meta.env.VITE_DASHBOARD_PASSWORD`.

---

## Sensitive Data
- Worker names, wages, phone numbers, and attendance points are stored locally.
- `src/data/` and `public/data/` are gitignored — never commit extracted data.
- `src/lib/sampleData.js` is the only committed "data" and contains **no PII** (empty arrays).

---

## Folder Structure
```
src/
  App.jsx                  — page router (object map of pages)
  main.jsx                 — entry point
  index.css                — Tailwind import + dark variant
  components/
    layout/                — Sidebar, Layout
    shared/                — component library (KpiCard, DataTable, StatusBadge, etc.) — all dark-mode aware
    ui/Modal.jsx           — portal modal
  features/
    home/                  — branded hero landing page + bookmarkable section cards (default page)
    overview/              — KPI tiles + charts
    departments/           — site photos + live headcount/openings per department
    payroll/               — drag-and-drop Kronos report reader (parse + preview; processing TBD)
    workers/               — active/termed/DNA workers (CRUD)
    staffing/              — headcount Actual vs AOP plan (CRUD)
    openings/              — open requisitions (CRUD)
    waitlist/              — waitlist candidates (CRUD)
    furlough/              — furlough tracking (CRUD)
    attendance/            — attendance points + policy standing (CRUD)
    attrition/             — termination analytics
    breakfast/             — Spring Breakfast supplies + notes (CRUD)
    reports/               — printable Weekly Summary for client HR (print/PDF + copy-for-email)
    financials/            — monthly P&L trend (CRUD, marked Internal)
    settings/              — dark mode + roadmap toggles
  lib/
    constants.js           — departments, shifts, statuses, term reasons
    attendance.js          — attendance points POLICY (single source of truth)
    departments.js         — department→photo map + site photo gallery
    nav.jsx                — nav SINGLE SOURCE OF TRUTH: ICONS + SECTIONS used by Sidebar + Home
    sampleData.js          — empty seed used when no extracted data is present
  store/useAppStore.js     — Zustand store (all data + actions + persistence)
public/
  images/brand/            — Compass logo (compass-logo.png, used in sidebar + hero)
  images/departments/      — real Ogden site photos (haul, loader, salt plant), web-compressed
scripts/
  extract-data.mjs         — parses Compass Tracker.xlsx → src/data/compass-data.json
```

> **Seed data from SharePoint (2026-06-06):** Staffing Plan (Actual vs AOP) and
> Financials (monthly P&L) are seeded with real numbers hardcoded in
> `store/useAppStore.js` (`initStaffingPlan` / `initFinancials`), since they come
> from spreadsheets outside the main tracker. They're CRUD-editable; update in-app
> each month. Financials is sensitive — gate it behind auth before any external sharing.

---

## Attendance Policy (lib/attendance.js)
Single source of truth for worker standing — used by the Attendance page, the
sidebar "at risk" badge, and the Overview KPI.

| Effective points | Standing |
|---|---|
| 3 | Verbal warning |
| 5 | Written warning |
| 7 | Suspension |
| 8 | Termination |
| 2 consecutive NCNS | Automatic termination (overrides points) |

Points are **cut in half after 180 days on assignment** — the dashboard scores
standing on these halved ("effective") points.

---

## Modals
Add/Edit modals are **mounted only while open** (`{modalOpen && <XModal/>}`) so the
form state resets cleanly on each open. Don't reintroduce a long-lived modal with a
`useState`/`useEffect` reset hack — the mount/unmount pattern is intentional.

---

## Known Quirks (extraction)
- `Wait List 2.0` uses a multi-column layout; the script counts unique names across 6-column groups.
- `Openings` headers are on row 2 (not row 1).
- Attrition `Term Reasons` use prefixes: `LG` = let go, `Q` = quit, `TH` = transferred/hired.
- `Roster` sheet provides attendance points; NCNS counts and days-on-assignment default to 0 (enter via the UI).

---

## Roadmap (surfaced as "Coming soon" in Settings)
- Export / import data (JSON backup)
- Password gate / user roles
- Shared backend so data isn't per-device (candidate: Avionte Bold API for live headcount)

---

## Changelog
### v1.0.0 — 2026-06-06
- Hardened for handoff: builds with no data file; fixed modal Edit (add/edit forms now populate correctly); completed dark mode across the shared component library; removed dead code (old Dashboard/react-query); lint clean.
- Attendance now scored against the real Compass points policy (3/5/7/8 + 2 NCNS + 180-day halving), centralized in `lib/attendance.js`.
- New **Weekly Summary** report (Reports section): live snapshot for client HR with Print/PDF and copy-for-email; charts (Overview + Attrition) are now dark-mode aware.
- Mined the client SharePoint export: added **Departments** (real site photos + live headcount), **Staffing Plan** (Actual vs AOP), and **Financials** (monthly P&L) sections.
- Applied **Compass branding** (logo + navy/cyan theme via `@theme` brand colors), added a **Home** hero landing page with **bookmarkable** quick-access cards (default page; bookmarks persisted), centralized nav in `lib/nav.jsx`, and added a **Payroll** drag-and-drop Kronos reader (basic parse + preview; column mapping / hours-by-employee×cost-center pending a real Kronos sample). `xlsx` moved to runtime dependencies.

### v1.0.0 — 2026-05-07 (initial)
- Initial build from Compass Tracker.xlsx; nine sections, CRUD, KPI cards, charts, worker tables.
