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
| State | Zustand v5 with `persist` |
| **Persistence** | **Server-side — Flask + SQLite via `/api/state` (NO localStorage)** |
| Backend / deploy | Flask + gunicorn on Render (`app.py`, `render.yaml`) |
| Charts | Recharts 3 |
| Tables | TanStack Table v8 |
| Build target | ES2020 |

---

## Setup
```bash
npm install
npm run build          # builds the React app into static/ (served by Flask)

pip install -r requirements.txt
python app.py          # Flask on http://localhost:5000  (serves static/ + /api)
```
Front-end dev with hot reload (optional): run `python app.py` (backend) and
`npm run dev` in another terminal — Vite (5173) proxies `/api` to Flask (5000).

```bash
npm run extract-data   # OPTIONAL — parse Compass Tracker.xlsx → src/data/compass-data.json (seed)
npm run lint
```

---

## Persistence — server-side, nothing local
**All dashboard data lives on the server. Nothing is saved in the browser.**
- The Zustand store persists through a custom storage adapter (`src/lib/serverStorage.js`)
  that GET/PUTs the whole state to **`/api/state`** instead of localStorage.
- Flask (`app.py`) stores it in **SQLite** (`compass.db`). Set `DATA_DIR` to a
  persistent disk (see `render.yaml`) so data survives redeploys.
- In plain `npm run dev` with no backend, the adapter fails quietly — the app
  runs but doesn't persist (still nothing written locally).

## Seed data
1. Place `Compass Tracker.xlsx` in the parent folder, run `npm run extract-data`
   → writes `src/data/compass-data.json` (gitignored, PII). Bundled as the
   in-memory seed; falls back to empty `src/lib/sampleData.js` if absent.
2. On load the store seeds from that, then hydrates from the server. The server
   is the source of truth once data has been saved to it.

---

## Deployment (Render, like flex-dashboard)
- Handoff is a **git clone** of this repo. The built front-end is committed in
  `static/`, so no Node build step is needed on the server.
- `render.yaml` defines a Python web service: `pip install -r requirements.txt`
  then `gunicorn app:app`, with a persistent disk mounted at `/var/data`.
- After any front-end change: `npm run build` (rebuilds `static/`) and commit it.

---

## Authentication
**Current:** none. `.env.example` reserves `VITE_DASHBOARD_PASSWORD` for a future password gate.
**To add:** wrap `<App />` in a `LoginGate` that checks `import.meta.env.VITE_DASHBOARD_PASSWORD`.

---

## Sensitive Data
- Worker names, wages, phone numbers, and attendance points are stored **server-side** in SQLite (`compass.db` on the persistent disk). The app has no login of its own — **the hosting must enforce the Microsoft sign-in gate** (see Auth / access) before this is reachable.
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
    home/                  — branded hero landing + "Needs Attention" alerts + bookmarkable cards (default page)
    overview/              — KPI tiles + charts
    departments/           — site photos + live headcount/openings per department
    workers/               — ACTIVE roster only (CRUD) + Move actions (→ furlough/waitlist/term/DNA)
    onboarding/            — new-hire sign-off checklist for active workers
    staffing/              — headcount Actual vs AOP plan (CRUD)
    openings/              — open requisitions (CRUD)
    waitlist/              — waitlist candidates (CRUD) + Place (→ active)
    furlough/              — furlough tracking (CRUD) + Return (→ active)
    attendance/            — attendance points + policy standing (CRUD)
    attrition/             — "Terminations & Attrition": termed/DNA records (CRUD + rehire) + analytics charts
    supervisors/           — per-supervisor rollups (headcount/attendance/incidents)
    safety/                — injuries & incidents (CRUD)
    breakfast/             — Spring Breakfast supplies + notes (CRUD)
    reports/               — printable Weekly Summary for client HR (print/PDF + copy-for-email)
    qbr/                   — QBR builder → branded PowerPoint export (pptxgenjs)
    financials/            — monthly P&L trend (CRUD, marked Internal)
    payroll/               — drag-and-drop Kronos report reader (parse + preview; processing TBD)
    activity/              — audit/activity log of changes
    settings/              — dark mode, sign-in info
  lib/
    constants.js           — departments, shifts, statuses, term reasons
    attendance.js          — attendance points POLICY (single source of truth)
    alerts.js              — computes Home "Needs Attention" items
    departments.js         — department→photo map + site photo gallery
    exportCsv.js           — CSV export helper (Workers/Attendance/Safety/Terminations)
    nav.jsx                — nav SINGLE SOURCE OF TRUTH: ICONS + SECTIONS used by Sidebar + Home
    serverStorage.js       — Zustand storage adapter → /api/state (debounced + save status)
    sampleData.js          — empty seed used when no extracted data is present
  store/useAppStore.js     — Zustand store (data + CRUD + status transitions + activity log)
public/
  images/brand/            — Compass logo (compass-logo.png, used in sidebar + hero)
  images/departments/      — real Ogden site photos (haul, loader, salt plant), web-compressed
static/                    — BUILT front-end (committed; Flask serves it). Regenerate with `npm run build`.
scripts/
  extract-data.mjs         — parses Compass Tracker.xlsx → src/data/compass-data.json
app.py                     — Flask backend: serves static/ + /api/state (SQLite)
requirements.txt           — Python deps (flask, gunicorn)
render.yaml                — Render deploy config (gunicorn + persistent disk)
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

## Auth / access
**No app-level login.** Access is gated upstream by the company's **Microsoft sign-in** —
users must be logged into their M365/Microsoft account to reach the dashboard. The app
has no usernames, passwords, or roles by design.
- ⚠️ The hosting must enforce the Microsoft gate (Azure App Service Easy Auth / Entra ID,
  or an identity-aware proxy). The app's `/api/state` is otherwise open to anyone who can
  reach the URL — don't expose it on plain public hosting without that gate.

## Roadmap
- Real Kronos parsing in Payroll (hours by employee × cost center) — pending a sample report
- One-time "import the tracker" step to seed the server on first deploy
- Avionte Bold API for live headcount

---

## Changelog
### v1.2.0 — 2026-06-06 (features wave + workforce lifecycle)
- New sections: **QBR builder** (PowerPoint export), **Activity Log**, **Safety & Incidents**, **Supervisors**, **Terminations**, **Onboarding**. Home **alerts** panel. **CSV export** on key tables.
- **Workforce lifecycle:** Workers = active only; status transitions (Active ⇄ Furlough/Waitlist/Termed/DNA; Rehire; Place; Return). All changes recorded in the activity log.
- Auth removed — access now via company Microsoft sign-in (hosting-enforced).

### v1.1.0 — 2026-06-06 (server-side persistence)
- **Replaced localStorage with server-side persistence.** Added a Flask backend (`app.py`) + SQLite via `/api/state`; Zustand persists through `src/lib/serverStorage.js`. All CRUD unchanged — data now shared on the server, nothing in the browser. Deploys on Render (`render.yaml`); front-end committed in `static/`.
- Refreshed data from the current (Jun 6) tracker: off-season — 5 active, 43 haul workers furloughed (now populated in the Furlough section); `Waitlist-Furlough` sheet renamed to `Waitlist`. Raised attendance "at risk" to 7+ points.

### v1.0.0 — 2026-06-06
- Hardened for handoff: builds with no data file; fixed modal Edit (add/edit forms now populate correctly); completed dark mode across the shared component library; removed dead code (old Dashboard/react-query); lint clean.
- Attendance now scored against the real Compass points policy (3/5/7/8 + 2 NCNS + 180-day halving), centralized in `lib/attendance.js`.
- New **Weekly Summary** report (Reports section): live snapshot for client HR with Print/PDF and copy-for-email; charts (Overview + Attrition) are now dark-mode aware.
- Mined the client SharePoint export: added **Departments** (real site photos + live headcount), **Staffing Plan** (Actual vs AOP), and **Financials** (monthly P&L) sections.
- Applied **Compass branding** (logo + navy/cyan theme via `@theme` brand colors), added a **Home** hero landing page with **bookmarkable** quick-access cards (default page; bookmarks persisted), centralized nav in `lib/nav.jsx`, and added a **Payroll** drag-and-drop Kronos reader (basic parse + preview; column mapping / hours-by-employee×cost-center pending a real Kronos sample). `xlsx` moved to runtime dependencies.

### v1.0.0 — 2026-05-07 (initial)
- Initial build from Compass Tracker.xlsx; nine sections, CRUD, KPI cards, charts, worker tables.
