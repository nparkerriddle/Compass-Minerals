// Browser port of scripts/extract-data.mjs — parses an uploaded Compass
// Tracker.xlsx into the datasets the store seeds from. Keep in sync with the
// Node script if the spreadsheet layout changes.
import { read, utils } from 'xlsx'

// Excel serial date → m/d/yyyy (avoids the SSF module, which isn't exported by xlsx.mjs).
function fmtDate(v) {
  if (!v) return ''
  if (typeof v !== 'number') return String(v).trim()
  const d = new Date(Math.round((v - 25569) * 86400 * 1000))
  return isNaN(d.getTime()) ? '' : `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`
}

export function parseTracker(arrayBuffer) {
  const wb = read(arrayBuffer, { type: 'array' })
  const rows = (name) => { const ws = wb.Sheets[name]; return ws ? utils.sheet_to_json(ws, { defval: '' }) : [] }
  const aoa = (name) => { const ws = wb.Sheets[name]; return ws ? utils.sheet_to_json(ws, { header: 1, defval: '' }) : [] }

  // ── Active workers (Haul + Fueler), with onboarding sign-offs ──
  const activeFrom = (raw) => raw
    .filter((r) => String(r['Status']).trim() === 'Active')
    .map((r) => ({
      name: `${String(r['First']).trim()} ${String(r['Last']).trim()}`.trim(),
      department: String(r['Department']).trim(),
      shift: String(r['Shift']).trim(),
      supervisor: String(r['Supervisor']).trim(),
      daysWorked: Number(r['Days Worked']) || 0,
      wage: Number(r['Wage']) || 0,
      status: 'Active',
      photoDone: String(r['Photo Done'] || '').trim(),
      truckSignOff: String(r['Haul Truck Sign Off'] || '').trim(),
      stockpileTesting: String(r['Passed Stockplie Testing'] || '').trim(),
      operatorSignOff: String(r['Operator Sign Off'] || '').trim(),
      physicalExpiration: fmtDate(r['Physical Expiration']),
    }))
    .filter((r) => r.name && r.name !== ' ')

  const haulRaw = rows('Haul Data 25-26')
  const otherRaw = rows('Fueler-HEO-Salt-Mag')
  const activeWorkers = [...activeFrom(haulRaw), ...activeFrom(otherRaw)]

  // ── Furloughed ──
  const furloughFrom = (raw) => raw
    .filter((r) => String(r['Status']).trim() === 'Furlough')
    .map((r) => ({
      name: `${String(r['First']).trim()} ${String(r['Last']).trim()}`.trim(),
      department: String(r['Department']).trim(), shift: String(r['Shift']).trim(), supervisor: String(r['Supervisor']).trim(),
      seasonsWorked: Number(r['Season']) || 0,
    }))
    .filter((r) => r.name && r.name !== ' ')
  const furloughWorkers = [...furloughFrom(haulRaw), ...furloughFrom(otherRaw)]

  // ── Termed / DNA ──
  const termedWorkers = rows('Termed or DNA')
    .filter((r) => { const s = String(r['Status']).trim(); return s === 'Termed' || s === 'DNA' })
    .map((r) => ({
      name: `${String(r['First']).trim()} ${String(r['Last']).trim()}`.trim(),
      status: String(r['Status']).trim(), department: String(r['Department']).trim(),
      termReason: String(r['Term Reason']).trim(), daysWorked: Number(r['Days Worked']) || 0,
    }))
    .filter((r) => r.name && r.name !== ' ')

  // ── Openings (headers row index 1, data from row 2; unfilled only) ──
  const openingsAoa = aoa('Openings')
  const openings = openingsAoa.slice(2)
    .filter((r) => r[0] && r[0] !== '')
    .map((r) => ({
      dateReceived: fmtDate(r[0]), dateFilled: fmtDate(r[1]),
      department: String(r[2] || '').trim(), position: String(r[3] || '').trim(),
      openings: Number(r[5]) || 1, daysToFill: Number(r[6]) || 0,
    }))
    .filter((r) => r.department && !r.dateFilled)

  // ── Waitlist ──
  const waitlist = rows('Waitlist')
    .filter((r) => `${String(r['First'] || '').trim()} ${String(r['Last'] || '').trim()}`.trim().length > 1)
    .map((r) => ({
      name: `${String(r['First']).trim()} ${String(r['Last']).trim()}`.trim(),
      status: String(r['Status']).trim(), department: String(r['Department']).trim(),
      preferredShift: String(r['Preferred Shift']).trim(), notes: String(r['Notes']).trim(),
    }))

  // ── Roster → attendance ──
  const rosterAoa = aoa('Roster')
  const rosterWorkers = []
  const nameOffsets = [1, 5, 9, 13, 17, 21, 25, 29]
  const buildDeptMap = (labelRow) => { const map = {}; let cur = ''; nameOffsets.forEach((off) => { const lbl = String(labelRow[off] || '').trim(); if (lbl) cur = lbl; map[off] = cur }); return map }
  const parseSup = (raw) => { const p = raw.split(' - '); return p.length >= 2 ? { supervisor: p[0].trim(), shift: p.slice(1).join(' - ').trim() } : { supervisor: raw.trim(), shift: '' } }
  const extractSection = (labelRow, supRow, dataRows) => {
    const deptMap = buildDeptMap(labelRow), supMap = {}, shiftMap = {}
    nameOffsets.forEach((off) => { const { supervisor, shift } = parseSup(String(supRow[off] || '').trim()); supMap[off] = supervisor; shiftMap[off] = shift })
    dataRows.forEach((row) => nameOffsets.forEach((off) => {
      const name = String(row[off] || '').trim()
      if (!name || name.toLowerCase() === 'name') return
      const pts = row[off + 1], wage = row[off + 2]
      rosterWorkers.push({
        name, department: deptMap[off] || '', supervisor: supMap[off] || '', shift: shiftMap[off] || '',
        attendancePoints: typeof pts === 'number' ? pts : (parseFloat(String(pts)) || 0),
        wage: typeof wage === 'number' ? wage : (parseFloat(String(wage)) || 0),
      })
    }))
  }
  extractSection(rosterAoa[1] || [], rosterAoa[3] || [], rosterAoa.slice(4, 13))
  extractSection(rosterAoa[17] || [], rosterAoa[19] || [], rosterAoa.slice(20, 27))

  // ── Injuries / Incidents (row 0 blank, header row 1, data from 2) ──
  const incAoa = aoa('Injuries.Incidents')
  const incidents = []
  for (let i = 2; i < incAoa.length; i++) {
    const r = incAoa[i]
    const first = String(r[3] || '').trim(), last = String(r[4] || '').trim()
    if (!first && !last) continue
    incidents.push({
      date: fmtDate(r[0]), time: String(r[1] || '').trim(), name: `${first} ${last}`.trim(),
      daysWorked: Number(r[5]) || 0, shift: String(r[6] || '').trim(), supervisor: String(r[7] || '').trim(),
      department: String(r[8] || '').trim(), outcome: String(r[9] || '').trim(), notes: String(r[10] || '').trim(),
    })
  }

  return { activeWorkers, furloughWorkers, termedWorkers, openings, waitlist, rosterWorkers, incidents }
}
