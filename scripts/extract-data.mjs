import XLSX from 'xlsx';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Optional CLI arg overrides the default tracker location.
const xlsxPath = process.argv[2]
  ? resolve(process.cwd(), process.argv[2])
  : resolve(__dirname, '../../Compass Tracker.xlsx');
const outDir = resolve(__dirname, '../src/data');

mkdirSync(outDir, { recursive: true });

const wb = XLSX.readFile(xlsxPath);

function sheetToRows(sheetName) {
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

function sheetToAoa(sheetName) {
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
}

// ── Active workers from Haul Data 25-26 ──────────────────────────────────────
const haulRaw = sheetToRows('Haul Data 25-26');
const haulWorkers = haulRaw
  .filter(r => String(r['Status']).trim() === 'Active')
  .map(r => ({
    name: `${String(r['First']).trim()} ${String(r['Last']).trim()}`.trim(),
    department: String(r['Department']).trim(),
    shift: String(r['Shift']).trim(),
    supervisor: String(r['Supervisor']).trim(),
    daysWorked: Number(r['Days Worked']) || 0,
    wage: Number(r['Wage']) || 0,
    status: 'Active',
  }))
  .filter(r => r.name && r.name !== ' ');

// ── Active workers from Fueler-HEO-Salt-Mag ──────────────────────────────────
const otherRaw = sheetToRows('Fueler-HEO-Salt-Mag');
const otherWorkers = otherRaw
  .filter(r => String(r['Status']).trim() === 'Active')
  .map(r => ({
    name: `${String(r['First']).trim()} ${String(r['Last']).trim()}`.trim(),
    department: String(r['Department']).trim(),
    shift: String(r['Shift']).trim(),
    supervisor: String(r['Supervisor']).trim(),
    daysWorked: Number(r['Days Worked']) || 0,
    wage: Number(r['Wage']) || 0,
    status: 'Active',
  }))
  .filter(r => r.name && r.name !== ' ');

const allActive = [...haulWorkers, ...otherWorkers];

// ── Furloughed workers (off-season) from Haul + Fueler sheets ─────────────────
function furloughFrom(raw) {
  return raw
    .filter(r => String(r['Status']).trim() === 'Furlough')
    .map(r => ({
      name: `${String(r['First']).trim()} ${String(r['Last']).trim()}`.trim(),
      department: String(r['Department']).trim(),
      shift: String(r['Shift']).trim(),
      supervisor: String(r['Supervisor']).trim(),
      seasonsWorked: Number(r['Season']) || 0,
    }))
    .filter(r => r.name && r.name !== ' ');
}
const furloughWorkers = [...furloughFrom(haulRaw), ...furloughFrom(otherRaw)];

// ── Department counts ─────────────────────────────────────────────────────────
const deptMap = {};
allActive.forEach(w => {
  const d = w.department || 'Unknown';
  deptMap[d] = (deptMap[d] || 0) + 1;
});
const departmentCounts = Object.entries(deptMap)
  .map(([department, count]) => ({ department, count }))
  .sort((a, b) => b.count - a.count);

// ── Shift counts ──────────────────────────────────────────────────────────────
const shiftMap = {};
allActive.forEach(w => {
  const s = w.shift || 'Unknown';
  shiftMap[s] = (shiftMap[s] || 0) + 1;
});
const shiftCounts = Object.entries(shiftMap)
  .map(([shift, count]) => ({ shift, count }))
  .sort((a, b) => b.count - a.count);

// ── Termed / DNA ──────────────────────────────────────────────────────────────
const termedRaw = sheetToRows('Termed or DNA');
const termedWorkers = termedRaw
  .filter(r => {
    const s = String(r['Status']).trim();
    return s === 'Termed' || s === 'DNA';
  })
  .map(r => ({
    name: `${String(r['First']).trim()} ${String(r['Last']).trim()}`.trim(),
    status: String(r['Status']).trim(),
    department: String(r['Department']).trim(),
    termReason: String(r['Term Reason']).trim(),
    daysWorked: Number(r['Days Worked']) || 0,
  }))
  .filter(r => r.name && r.name !== ' ');

const dnaCount = termedWorkers.filter(r => r.status === 'DNA').length;
const termedCount = termedWorkers.filter(r => r.status === 'Termed').length;

// ── Openings ──────────────────────────────────────────────────────────────────
// Headers are in row index 1 (second row), data starts at index 2
const openingsAoa = sheetToAoa('Openings');
// Row 1 = section header, Row 2 = column headers, Row 3+ = data
const openHeaders = openingsAoa[1]; // ['Date Received', 'Date Filled', 'Department', ...]
const openData = openingsAoa.slice(2).filter(r => r[0] && r[0] !== '');

const openings = openData.map(r => ({
  dateReceived: r[0] ? XLSX.SSF.format('m/d/yyyy', r[0]) : '',
  dateFilled:   r[1] ? XLSX.SSF.format('m/d/yyyy', r[1]) : '',
  department:   String(r[2] || '').trim(),
  position:     String(r[3] || '').trim(),
  openings:     Number(r[5]) || 1,
  daysToFill:   Number(r[6]) || 0,
})).filter(r => r.department);

const openPositions = openings.filter(r => !r.dateFilled);

// ── Waitlist ──────────────────────────────────────────────────────────────────
const wfRaw = sheetToRows('Waitlist');
const waitlistWorkers = wfRaw
  .filter(r => {
    const name = `${String(r['First'] || '').trim()} ${String(r['Last'] || '').trim()}`.trim();
    return name.length > 1;
  })
  .map(r => ({
    name: `${String(r['First']).trim()} ${String(r['Last']).trim()}`.trim(),
    status: String(r['Status']).trim(),
    department: String(r['Department']).trim(),
    preferredShift: String(r['Preferred Shift']).trim(),
    notes: String(r['Notes']).trim(),
  }));

// ── Wait List 2.0 (complex multi-column layout) ───────────────────────────────
// Parse by extracting First/Last from the repeating 6-column groups
const wl2Aoa = sheetToAoa('Wait List 2.0');
const wl2Workers = new Set();
// Row 3 = headers for each group: Date, Last Contact, First, Last, Phone, Note
// Groups start at col 0, 6, 12, 18, 24, 30
const groupOffsets = [0, 6, 12, 18, 24, 30];
for (let rowIdx = 3; rowIdx < wl2Aoa.length; rowIdx++) {
  const row = wl2Aoa[rowIdx];
  for (const offset of groupOffsets) {
    const first = String(row[offset + 2] || '').trim();
    const last  = String(row[offset + 3] || '').trim();
    if (first && last && first.toLowerCase() !== 'first') {
      wl2Workers.add(`${first} ${last}`);
    }
  }
}

const totalWaitlist = waitlistWorkers.length + wl2Workers.size;

// ── Attrition: Term Reasons ───────────────────────────────────────────────────
// Row index 2 = section headers, row index 3 = column labels
// Term Reasons columns: col 7 = Reason, col 12 = Total
const attritionAoa = sheetToAoa('Attrition Dashboard');
const termReasons = [];
for (let i = 3; i < attritionAoa.length; i++) {
  const reason = String(attritionAoa[i][7] || '').trim();
  const total  = Number(attritionAoa[i][12]) || 0;
  if (reason && total > 0 && reason.toLowerCase() !== 'total') {
    termReasons.push({ reason, count: total });
  }
}
termReasons.sort((a, b) => b.count - a.count);

// ── Attrition: Terminations by Department ────────────────────────────────────
// Row index 3 = column labels, col 0 = Department, col 5 = Total
const deptAttrition = [];
for (let i = 4; i < attritionAoa.length; i++) {
  const dept  = String(attritionAoa[i][0] || '').trim();
  const total = Number(attritionAoa[i][5]) || 0;
  if (dept && total > 0 && dept.toLowerCase() !== 'total') {
    deptAttrition.push({ department: dept, terminations: total });
  }
}
deptAttrition.sort((a, b) => b.terminations - a.terminations);

// ── Payroll summary ───────────────────────────────────────────────────────────
const payrollRaw = sheetToRows('Payroll');
let totalReg = 0, totalOT = 0;
payrollRaw.forEach(r => {
  totalReg += Number(r['REG']) || 0;
  totalOT  += Number(r['OT'])  || 0;
});

// ── Roster (Attendance) ───────────────────────────────────────────────────────
const rosterAoa = sheetToAoa('Roster')
const rosterWorkers = []
const nameOffsets = [1, 5, 9, 13, 17, 21, 25, 29]

function buildDeptMap(labelRow) {
  const map = {}
  let current = ''
  nameOffsets.forEach(off => {
    const lbl = String(labelRow[off] || '').trim()
    if (lbl) current = lbl
    map[off] = current
  })
  return map
}

function parseSupervisorLabel(raw) {
  const parts = raw.split(' - ')
  if (parts.length >= 2) return { supervisor: parts[0].trim(), shift: parts.slice(1).join(' - ').trim() }
  return { supervisor: raw.trim(), shift: '' }
}

function extractRosterSection(labelRow, supervisorRow, dataRows) {
  const deptMap = buildDeptMap(labelRow)
  const supMap = {}, shiftMap = {}
  nameOffsets.forEach(off => {
    const { supervisor, shift } = parseSupervisorLabel(String(supervisorRow[off] || '').trim())
    supMap[off] = supervisor
    shiftMap[off] = shift
  })
  dataRows.forEach(row => {
    nameOffsets.forEach(off => {
      const name = String(row[off] || '').trim()
      if (!name || name.toLowerCase() === 'name') return
      const pts  = row[off + 1]
      const wage = row[off + 2]
      rosterWorkers.push({
        name,
        department: deptMap[off] || '',
        supervisor: supMap[off] || '',
        shift: shiftMap[off] || '',
        attendancePoints: typeof pts  === 'number' ? pts  : (parseFloat(String(pts))  || 0),
        wage:             typeof wage === 'number' ? wage : (parseFloat(String(wage)) || 0),
      })
    })
  })
}

// Section 1: Haul Drivers / Salt Plant / Admin / Fuelers  (rows 4–12)
extractRosterSection(rosterAoa[1] || [], rosterAoa[3] || [], rosterAoa.slice(4, 13))
// Section 2: Haul Operators / SOP-Mag / HEO-Harvest / Misc  (rows 20–26)
extractRosterSection(rosterAoa[17] || [], rosterAoa[19] || [], rosterAoa.slice(20, 27))

// ── Output ────────────────────────────────────────────────────────────────────
const data = {
  summary: {
    activeWorkers: allActive.length,
    openPositions: openPositions.length,
    waitlistCount: totalWaitlist,
    furloughCount: furloughWorkers.length,
    termedCount,
    dnaCount,
    totalRegHours: Math.round(totalReg),
    totalOTHours:  Math.round(totalOT),
  },
  activeWorkers: allActive,
  departmentCounts,
  shiftCounts,
  openings: openPositions,
  waitlist: waitlistWorkers,
  furloughWorkers,
  termReasons,
  deptAttrition,
  termedWorkers,
  rosterWorkers,
};

writeFileSync(resolve(outDir, 'compass-data.json'), JSON.stringify(data, null, 2));
console.log('Extracted data:');
console.log(`  Active workers: ${data.summary.activeWorkers}`);
console.log(`  Open positions: ${data.summary.openPositions}`);
console.log(`  Waitlist:       ${data.summary.waitlistCount}`);
console.log(`  Furlough:       ${data.summary.furloughCount}`);
console.log(`  Termed:         ${data.summary.termedCount}  DNA: ${data.summary.dnaCount}`);
console.log(`  Dept counts:`, departmentCounts);
console.log(`  Shift counts:`, shiftCounts);
console.log(`  Term reasons:`, termReasons.slice(0, 6));
console.log(`  Dept attrition:`, deptAttrition.slice(0, 5));
console.log(`  Roster workers: ${rosterWorkers.length}`)
console.log('\nWrote src/data/compass-data.json');
