// Compass Minerals attendance points policy — single source of truth.
// Source: clients/compass-minerals.md
//   3 pts → Verbal warning
//   5 pts → Written warning
//   7 pts → Suspension
//   8 pts → Termination
//   2 consecutive NCNS → automatic termination
//   Points are cut in half once a worker passes 180 days on assignment.

export const POINTS_HALVE_DAYS = 180
export const NCNS_AUTO_TERM = 2

// Ordered high → low. `badge` maps to <StatusBadge> / tile color tokens.
export const ATTENDANCE_TIERS = [
  { min: 8, level: 'termination', label: 'Termination',     action: 'Subject to termination',     badge: 'danger',  tier: 4 },
  { min: 7, level: 'suspension',  label: 'Suspension',      action: 'Write up + suspension',      badge: 'danger',  tier: 3 },
  { min: 5, level: 'written',     label: 'Written Warning', action: 'Written warning issued',     badge: 'warning', tier: 2 },
  { min: 3, level: 'verbal',      label: 'Verbal Warning',  action: 'Verbal warning issued',      badge: 'warning', tier: 1 },
  { min: 0, level: 'clear',       label: 'Good Standing',   action: 'No action needed',           badge: 'success', tier: 0 },
]

// Points cut in half once a worker passes 180 days on assignment.
export function effectivePoints(record) {
  const raw = Number(record?.attendancePoints) || 0
  const days = Number(record?.daysOnAssignment) || 0
  return days >= POINTS_HALVE_DAYS ? raw / 2 : raw
}

// Resolve a record to its policy status. 2 NCNS forces termination regardless
// of points; otherwise the tier is driven by effective (post-halving) points.
export function attendanceStatus(record) {
  const raw = Number(record?.attendancePoints) || 0
  const points = effectivePoints(record)
  const ncns = Number(record?.ncns) || 0
  const halved = points !== raw

  if (ncns >= NCNS_AUTO_TERM) {
    return { ...ATTENDANCE_TIERS[0], label: 'Auto-Term (NCNS)', action: '2 consecutive NCNS', points, raw, ncns, halved, reason: 'ncns' }
  }
  const tier = ATTENDANCE_TIERS.find((t) => points >= t.min) ?? ATTENDANCE_TIERS[ATTENDANCE_TIERS.length - 1]
  return { ...tier, points, raw, ncns, halved, reason: 'points' }
}

// "At risk" = suspension level and up (7+ effective points, or 2 NCNS).
export function isAtRisk(record) {
  return attendanceStatus(record).tier >= 3
}
