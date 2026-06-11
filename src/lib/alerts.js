// Computes actionable "needs attention" items from current dashboard data.
import { attendanceStatus } from './attendance'

function daysSince(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  return Math.floor((Date.now() - d.getTime()) / 86_400_000)
}
const daysUntil = (dateStr) => { const s = daysSince(dateStr); return s === null ? null : -s }

export function computeAlerts({ workers = [], attendanceRecords = [], openings = [], furloughWorkers = [] }) {
  const alerts = []

  // ── Physical exam expirations (active workers) ──
  const expiring = workers.filter((w) => {
    if (w.status !== 'Active' || !w.physicalExpiration) return false
    const d = daysUntil(w.physicalExpiration)
    return d !== null && d <= 30
  }).length
  if (expiring) alerts.push({ id: 'phys-exp', severity: 'medium', title: `${expiring} physical${expiring > 1 ? 's' : ''} expiring soon`, detail: 'Due within 30 days (or expired)', page: 'onboarding' })

  // ── Attendance escalations ──
  const term = attendanceRecords.filter((r) => attendanceStatus(r).tier === 4).length
  const susp = attendanceRecords.filter((r) => attendanceStatus(r).tier === 3).length
  if (term) alerts.push({ id: 'att-term', severity: 'high', title: `${term} worker${term > 1 ? 's' : ''} at termination level`, detail: '8+ attendance points or 2 NCNS', page: 'attendance' })
  if (susp) alerts.push({ id: 'att-susp', severity: 'medium', title: `${susp} at suspension level`, detail: '7+ attendance points', page: 'attendance' })

  // ── Openings aging ──
  const aging = openings.filter((o) => (daysSince(o.dateReceived) ?? 0) > 30).length
  if (aging) alerts.push({ id: 'open-aging', severity: 'medium', title: `${aging} opening${aging > 1 ? 's' : ''} open 30+ days`, detail: 'Sourcing may need escalation', page: 'openings' })

  // ── Furlough decisions / intent ──
  const pending = furloughWorkers.filter((w) => w.status === 'On Furlough' && w.clientDecision === 'Pending').length
  if (pending) alerts.push({ id: 'fur-pending', severity: 'medium', title: `${pending} furloughed awaiting client decision`, detail: 'Return approval still pending', page: 'furlough' })
  const unknown = furloughWorkers.filter((w) => w.status === 'On Furlough' && w.workerIntent === 'Unknown').length
  if (unknown) alerts.push({ id: 'fur-intent', severity: 'info', title: `${unknown} furloughed with unknown return intent`, detail: 'Confirm who plans to return next season', page: 'furlough' })

  return alerts
}
