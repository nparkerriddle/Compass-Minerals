import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { attendanceStatus, effectivePoints } from '../../lib/attendance'

function Section({ title, children, right }) {
  return (
    <section className="break-inside-avoid">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-1.5 mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
      <div className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{value}</div>
      <div className={`text-xs font-medium mt-0.5 ${accent || 'text-gray-500 dark:text-gray-400'}`}>{label}</div>
    </div>
  )
}

export default function ReportsPage() {
  const workers          = useAppStore((s) => s.workers)
  const openings         = useAppStore((s) => s.openings)
  const waitlist         = useAppStore((s) => s.waitlist)
  const furloughWorkers  = useAppStore((s) => s.furloughWorkers)
  const attendanceRecords = useAppStore((s) => s.attendanceRecords)

  const today = new Date()
  const [weekEnding, setWeekEnding] = useState(today.toISOString().slice(0, 10))

  const m = useMemo(() => {
    const active = workers.filter((w) => w.status === 'Active')
    const termed = workers.filter((w) => w.status === 'Termed')
    const dna = workers.filter((w) => w.status === 'DNA')
    const onFurlough = furloughWorkers.filter((w) => w.status === 'On Furlough')

    const deptMap = {}
    active.forEach((w) => { deptMap[w.department || 'Unknown'] = (deptMap[w.department || 'Unknown'] || 0) + 1 })
    const deptCounts = Object.entries(deptMap).map(([d, c]) => ({ department: d, count: c })).sort((a, b) => b.count - a.count)

    const watch = attendanceRecords
      .map((r) => ({ r, st: attendanceStatus(r) }))
      .filter(({ st }) => st.tier >= 2)
      .sort((a, b) => b.st.tier - a.st.tier || effectivePoints(b.r) - effectivePoints(a.r))

    const reasonMap = {}
    termed.forEach((w) => { if (w.termReason) reasonMap[w.termReason] = (reasonMap[w.termReason] || 0) + 1 })
    const topReasons = Object.entries(reasonMap).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count).slice(0, 5)

    return { active, termed, dna, onFurlough, deptCounts, watch, topReasons }
  }, [workers, furloughWorkers, attendanceRecords])

  function buildEmailText() {
    const fmt = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const lines = []
    lines.push(`COMPASS MINERALS — WORKFORCE SUMMARY`)
    lines.push(`Week ending ${fmt(weekEnding)}  ·  Prepared by YES (Your Employment Solutions)`)
    lines.push('')
    lines.push(`Active workers:    ${m.active.length}`)
    lines.push(`Open positions:    ${openings.length}`)
    lines.push(`Waitlist:          ${waitlist.length}`)
    lines.push(`On furlough:       ${m.onFurlough.length}`)
    lines.push(`Attendance watch:  ${m.watch.length} (written warning or higher)`)
    lines.push(`Termed (season):   ${m.termed.length}   DNA: ${m.dna.length}`)
    lines.push('')
    lines.push(`HEADCOUNT BY DEPARTMENT`)
    m.deptCounts.forEach((d) => lines.push(`  ${d.department}: ${d.count}`))
    if (openings.length) {
      lines.push('')
      lines.push(`OPEN POSITIONS`)
      openings.forEach((o) => lines.push(`  ${o.department}${o.position ? ' — ' + o.position : ''} (${o.openingsCount || 1})`))
    }
    if (m.watch.length) {
      lines.push('')
      lines.push(`ATTENDANCE WATCH`)
      m.watch.forEach(({ r, st }) => lines.push(`  ${r.firstName} ${r.lastName} — ${effectivePoints(r)} pts — ${st.label}`))
    }
    if (m.topReasons.length) {
      lines.push('')
      lines.push(`TOP TERMINATION REASONS`)
      m.topReasons.forEach((t) => lines.push(`  ${t.reason}: ${t.count}`))
    }
    return lines.join('\n')
  }

  const [copied, setCopied] = useState(false)
  async function copyForEmail() {
    try {
      await navigator.clipboard.writeText(buildEmailText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const longDate = new Date(weekEnding + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Action bar — hidden when printing */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Weekly Summary</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">A shareable snapshot for client HR. Print to PDF or copy for email.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 dark:text-gray-400">Week ending</label>
          <input
            type="date" value={weekEnding} onChange={(e) => setWeekEnding(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={copyForEmail}
            className="px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            {copied ? '✓ Copied' : 'Copy for email'}
          </button>
          <button onClick={() => window.print()}
            className="px-4 py-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Print / PDF
          </button>
        </div>
      </div>

      {/* The report */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 space-y-7 print:border-0 print:shadow-none print:p-0">
        {/* Report header */}
        <div className="flex items-start justify-between border-b-2 border-gray-900 dark:border-gray-100 pb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">YES · Your Employment Solutions</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">Compass Minerals — Workforce Summary</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Week ending {longDate}</p>
          </div>
        </div>

        {/* Headline stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Stat label="Active workers" value={m.active.length} accent="text-blue-600 dark:text-blue-400" />
          <Stat label="Open positions" value={openings.length} accent="text-amber-600 dark:text-amber-400" />
          <Stat label="Waitlist" value={waitlist.length} accent="text-green-600 dark:text-green-400" />
          <Stat label="On furlough" value={m.onFurlough.length} accent="text-sky-600 dark:text-sky-400" />
          <Stat label="Attendance watch (5+ pts)" value={m.watch.length} accent="text-orange-600 dark:text-orange-400" />
          <Stat label="Termed / DNA (season)" value={`${m.termed.length} / ${m.dna.length}`} accent="text-red-600 dark:text-red-400" />
        </div>

        {/* Headcount by department */}
        <Section title="Headcount by Department">
          {m.deptCounts.length === 0 ? (
            <p className="text-sm text-gray-400">No active workers recorded.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5">
              {m.deptCounts.map((d) => (
                <div key={d.department} className="flex items-center justify-between text-sm border-b border-dashed border-gray-100 dark:border-gray-700 py-1">
                  <span className="text-gray-700 dark:text-gray-300">{d.department}</span>
                  <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Open positions */}
        {openings.length > 0 && (
          <Section title="Open Positions" right={<span className="text-xs text-gray-400">{openings.length} total</span>}>
            <div className="space-y-1.5">
              {openings.map((o) => (
                <div key={o.id} className="flex items-center justify-between text-sm py-1 border-b border-dashed border-gray-100 dark:border-gray-700">
                  <span className="text-gray-700 dark:text-gray-300">{o.department}{o.position ? <span className="text-gray-400"> — {o.position}</span> : null}</span>
                  <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">{o.openingsCount || 1}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Attendance watch */}
        {m.watch.length > 0 && (
          <Section title="Attendance Watch" right={<span className="text-xs text-gray-400">written warning or higher</span>}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-1.5 font-semibold">Worker</th>
                  <th className="py-1.5 font-semibold">Department</th>
                  <th className="py-1.5 font-semibold text-right">Points</th>
                  <th className="py-1.5 font-semibold text-right">Standing</th>
                </tr>
              </thead>
              <tbody>
                {m.watch.map(({ r, st }) => (
                  <tr key={r.id} className="border-b border-dashed border-gray-100 dark:border-gray-700">
                    <td className="py-1.5 text-gray-800 dark:text-gray-200">{r.firstName} {r.lastName}</td>
                    <td className="py-1.5 text-gray-500 dark:text-gray-400">{r.department || '—'}</td>
                    <td className="py-1.5 text-right tabular-nums text-gray-800 dark:text-gray-200">{effectivePoints(r)}</td>
                    <td className="py-1.5 text-right font-medium text-gray-800 dark:text-gray-200">{st.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {/* Top term reasons */}
        {m.topReasons.length > 0 && (
          <Section title="Top Termination Reasons">
            <div className="space-y-1.5">
              {m.topReasons.map((t) => (
                <div key={t.reason} className="flex items-center justify-between text-sm py-1 border-b border-dashed border-gray-100 dark:border-gray-700">
                  <span className="text-gray-700 dark:text-gray-300">{t.reason}</span>
                  <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">{t.count}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        <p className="text-xs text-gray-400 pt-2">Generated {today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · Compass Minerals Workforce Tracker · YES</p>
      </div>
    </div>
  )
}
