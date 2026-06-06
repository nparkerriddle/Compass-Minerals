// Safe default seed used when src/data/compass-data.json is absent
// (it is gitignored because it contains worker PII). This lets a fresh
// clone build and run with an empty dashboard; the user then either adds
// records through the UI or runs `npm run extract-data` to load real data.
//
// Shape must match the output of scripts/extract-data.mjs.
export const sampleData = {
  summary: {
    activeWorkers: 0,
    openPositions: 0,
    waitlistCount: 0,
    furloughCount: 0,
    termedCount: 0,
    dnaCount: 0,
    totalRegHours: 0,
    totalOTHours: 0,
  },
  activeWorkers: [],
  departmentCounts: [],
  shiftCounts: [],
  openings: [],
  waitlist: [],
  furloughWorkers: [],
  termReasons: [],
  deptAttrition: [],
  termedWorkers: [],
  rosterWorkers: [],
  incidents: [],
}
