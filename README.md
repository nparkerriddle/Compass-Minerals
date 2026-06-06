# Compass Minerals — Workforce Tracker

Internal workforce dashboard built by **YES (Your Employment Solutions)** for the
Compass Minerals onsite. Replaces the `Compass Tracker.xlsx` spreadsheet with an
editable (CRUD) dashboard for headcount, openings, waitlist, furloughs, attendance,
attrition, and the Spring Breakfast event.

## Quick start
```bash
npm install
npm run dev      # http://localhost:5173
```
The app runs immediately with an empty dashboard you can populate through the UI.

## Seeding from the spreadsheet (optional)
```bash
npm run extract-data   # reads ../Compass Tracker.xlsx → src/data/compass-data.json
```
The extracted JSON contains worker PII and is gitignored.

## Build
```bash
npm run build    # → dist/  (static SPA; zip and hand to admin)
npm run lint
```

## Stack
React 19 · Vite 8 · Tailwind v4 (light/dark) · Zustand (localStorage) · TanStack Table · Recharts

See **CLAUDE.md** for full architecture, data flow, and the attendance policy.
