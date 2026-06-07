import { useMemo, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useAppStore } from '../../store/useAppStore'
import { attendanceStatus } from '../../lib/attendance'
import compassLogo from '../../assets/brand/compass-logo.png'

// Brand palette (hex without # for pptxgenjs).
const PALETTE = ['00A3E0', '16365C', '22C55E', 'F59E0B', 'EF4444', '8B5CF6', '06B6D4', 'F97316']
const hex = (c) => `#${c}`

function defaultPeriod() {
  const d = new Date()
  return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`
}

async function fetchAsDataUrl(url) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const fr = new FileReader()
      fr.onload = () => resolve(fr.result)
      fr.onerror = () => resolve(null)
      fr.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export default function QBRPage() {
  const workers = useAppStore((s) => s.workers)
  const openings = useAppStore((s) => s.openings)
  const waitlist = useAppStore((s) => s.waitlist)
  const furloughWorkers = useAppStore((s) => s.furloughWorkers)
  const attendanceRecords = useAppStore((s) => s.attendanceRecords)
  const staffingPlan = useAppStore((s) => s.staffingPlan)
  const financials = useAppStore((s) => s.financials)
  const darkMode = useAppStore((s) => s.darkMode)

  const [title, setTitle] = useState('Compass Minerals — Quarterly Business Review')
  const [period, setPeriod] = useState(defaultPeriod())
  const [included, setIncluded] = useState({})
  const [exporting, setExporting] = useState(false)

  const axisColor = darkMode ? '#9ca3af' : '#6b7280'
  const gridColor = darkMode ? '#374151' : '#e5e7eb'

  const blocks = useMemo(() => {
    const active = workers.filter((w) => w.status === 'Active')
    const termed = workers.filter((w) => w.status === 'Termed')
    const dna = workers.filter((w) => w.status === 'DNA')
    const onFur = furloughWorkers.filter((w) => w.status === 'On Furlough')

    const countBy = (arr, key) => {
      const m = {}
      arr.forEach((x) => { const k = x[key] || 'Unknown'; m[k] = (m[k] || 0) + 1 })
      return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
    }

    const dept = countBy(active, 'department')
    const shift = countBy(active, 'shift')

    const tiers = [0, 0, 0, 0, 0]
    attendanceRecords.forEach((r) => { tiers[attendanceStatus(r).tier]++ })
    const standing = [
      { label: 'Good standing', value: tiers[0] },
      { label: 'Verbal', value: tiers[1] },
      { label: 'Written', value: tiers[2] },
      { label: 'Suspension', value: tiers[3] },
      { label: 'Termination', value: tiers[4] },
    ].filter((x) => x.value > 0)

    const reasonsMap = {}
    termed.forEach((w) => { if (w.termReason) reasonsMap[w.termReason] = (reasonsMap[w.termReason] || 0) + 1 })
    const termReasons = Object.entries(reasonsMap).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8)

    const sepMap = {}
    ;[...termed, ...dna].forEach((w) => { const k = w.department || 'Unknown'; sepMap[k] = (sepMap[k] || 0) + 1 })
    const separations = Object.entries(sepMap).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)

    const atRisk = attendanceRecords.filter((r) => attendanceStatus(r).tier >= 3).length

    return [
      {
        id: 'kpis', title: 'Headline Metrics', kind: 'table',
        rows: [
          ['Active workers', active.length], ['Open positions', openings.reduce((s, o) => s + (o.openingsCount || 1), 0)],
          ['Waitlist', waitlist.length], ['On furlough', onFur.length],
          ['Termed (season)', termed.length], ['DNA', dna.length], ['At risk (7+ pts)', atRisk],
        ],
      },
      { id: 'dept', title: 'Active Headcount by Department', kind: 'bar', series: [{ name: 'Workers', data: dept }] },
      { id: 'shift', title: 'Active Workers by Shift', kind: 'bar', series: [{ name: 'Workers', data: shift }] },
      {
        id: 'staffing', title: 'Headcount: Actual vs. AOP Plan', kind: 'grouped',
        labels: staffingPlan.map((r) => r.role),
        series: [
          { name: 'Actual', values: staffingPlan.map((r) => r.actual || 0) },
          { name: 'AOP Target', values: staffingPlan.map((r) => r.target || 0) },
        ],
      },
      { id: 'standing', title: 'Attendance Standing', kind: 'pie', series: [{ name: 'Workers', data: standing }] },
      { id: 'reasons', title: 'Top Termination Reasons', kind: 'bar', series: [{ name: 'Workers', data: termReasons }] },
      { id: 'separations', title: 'Separations by Department', kind: 'bar', series: [{ name: 'Separations', data: separations }] },
      {
        id: 'financials', title: 'Monthly Financials', kind: 'lineGrouped',
        labels: financials.map((m) => m.month),
        series: [
          { name: 'Income', values: financials.map((m) => Math.round(m.income || 0)) },
          { name: 'Gross Profit', values: financials.map((m) => Math.round(m.grossProfit || 0)) },
          { name: 'Net Income', values: financials.map((m) => Math.round(m.netIncome || 0)) },
        ],
      },
    ]
  }, [workers, openings, waitlist, furloughWorkers, attendanceRecords, staffingPlan, financials])

  const isIn = (id) => included[id] !== false // default included
  const toggle = (id) => setIncluded((p) => ({ ...p, [id]: p[id] === false ? true : false }))
  const selectedCount = blocks.filter((b) => isIn(b.id)).length

  async function exportPptx() {
    setExporting(true)
    try {
      const PptxGenJS = (await import('pptxgenjs')).default
      const pptx = new PptxGenJS()
      pptx.layout = 'LAYOUT_WIDE' // 13.33 x 7.5 in
      const NAVY = '16365C', CYAN = '00A3E0', GRAY = '6B7280'

      // ── Title slide ──
      const title1 = pptx.addSlide()
      title1.background = { color: NAVY }
      const logo = await fetchAsDataUrl(compassLogo)
      if (logo) title1.addImage({ data: logo, x: 0.6, y: 0.6, w: 2.8, h: 0.75 })
      title1.addText(title, { x: 0.6, y: 2.6, w: 12, h: 1.2, fontSize: 34, bold: true, color: 'FFFFFF' })
      title1.addText(period, { x: 0.6, y: 3.8, w: 12, h: 0.6, fontSize: 20, color: CYAN })
      title1.addText('Prepared by YES — Your Employment Solutions', { x: 0.6, y: 6.6, w: 12, h: 0.4, fontSize: 12, color: 'A9B4C2' })

      const addTitle = (slide, text) => {
        slide.addText(text, { x: 0.5, y: 0.35, w: 12.3, h: 0.7, fontSize: 24, bold: true, color: NAVY })
        slide.addShape(pptx.ShapeType.line, { x: 0.5, y: 1.1, w: 12.3, h: 0, line: { color: CYAN, width: 2 } })
      }

      for (const b of blocks) {
        if (!isIn(b.id)) continue
        const slide = pptx.addSlide()
        addTitle(slide, b.title)
        const area = { x: 0.6, y: 1.4, w: 12.1, h: 5.6 }

        if (b.kind === 'table') {
          const rows = [
            [{ text: 'Metric', options: { bold: true, color: 'FFFFFF', fill: NAVY } }, { text: 'Value', options: { bold: true, color: 'FFFFFF', fill: NAVY } }],
            ...b.rows.map(([k, v]) => [String(k), String(v)]),
          ]
          slide.addTable(rows, { ...area, h: 4.5, fontSize: 16, border: { type: 'solid', color: 'E5E7EB', pt: 1 }, color: '111827', valign: 'middle', rowH: 0.5 })
        } else if (b.kind === 'pie') {
          const data = [{ name: b.series[0].name, labels: b.series[0].data.map((d) => d.label), values: b.series[0].data.map((d) => d.value) }]
          slide.addChart(pptx.ChartType.pie, data, { ...area, showLegend: true, legendPos: 'r', showPercent: true, chartColors: PALETTE })
        } else if (b.kind === 'grouped' || b.kind === 'lineGrouped') {
          const data = b.series.map((s) => ({ name: s.name, labels: b.labels, values: s.values }))
          const type = b.kind === 'lineGrouped' ? pptx.ChartType.line : pptx.ChartType.bar
          slide.addChart(type, data, { ...area, showLegend: true, legendPos: 'b', chartColors: PALETTE, catAxisLabelFontSize: 10, valAxisLabelFontSize: 10 })
        } else {
          // single-series bar
          const d = b.series[0].data
          const data = [{ name: b.series[0].name, labels: d.map((x) => x.label), values: d.map((x) => x.value) }]
          slide.addChart(pptx.ChartType.bar, data, { ...area, barDir: 'bar', showLegend: false, chartColors: [CYAN], catAxisLabelFontSize: 10, valAxisLabelFontSize: 10 })
        }
        slide.addText('Compass Minerals · YES', { x: 0.5, y: 7.05, w: 12.3, h: 0.3, fontSize: 9, color: GRAY, align: 'right' })
      }

      await pptx.writeFile({ fileName: `Compass-QBR-${period.replace(/\s+/g, '-')}.pptx` })
    } finally {
      setExporting(false)
    }
  }

  // ── On-screen preview ──
  function Preview({ b }) {
    if (b.kind === 'table') {
      return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          {b.rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between text-sm border-b border-dashed border-gray-100 dark:border-gray-700 py-1">
              <span className="text-gray-600 dark:text-gray-400">{k}</span>
              <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">{v}</span>
            </div>
          ))}
        </div>
      )
    }
    if (b.kind === 'pie') {
      const data = b.series[0].data
      return (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={70}>
              {data.map((_, i) => <Cell key={i} fill={hex(PALETTE[i % PALETTE.length])} />)}
            </Pie>
            <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      )
    }
    if (b.kind === 'grouped' || b.kind === 'lineGrouped') {
      const data = b.labels.map((label, i) => {
        const row = { label }
        b.series.forEach((s) => { row[s.name] = s.values[i] })
        return row
      })
      const Chart = b.kind === 'lineGrouped' ? LineChart : BarChart
      return (
        <ResponsiveContainer width="100%" height={200}>
          <Chart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: axisColor }} />
            <YAxis tick={{ fontSize: 10, fill: axisColor }} />
            <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
            {b.series.map((s, i) => b.kind === 'lineGrouped'
              ? <Line key={s.name} dataKey={s.name} stroke={hex(PALETTE[i % PALETTE.length])} strokeWidth={2} dot={false} />
              : <Bar key={s.name} dataKey={s.name} fill={hex(PALETTE[i % PALETTE.length])} radius={[3, 3, 0, 0]} />)}
          </Chart>
        </ResponsiveContainer>
      )
    }
    // bar (single)
    const data = b.series[0].data
    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
          <XAxis type="number" tick={{ fontSize: 10, fill: axisColor }} />
          <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 10, fill: axisColor }} />
          <Tooltip />
          <Bar dataKey="value" fill={hex(PALETTE[0])} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">QBR Builder</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Pick the slides to include, then export a branded PowerPoint.</p>
        </div>
        <button onClick={exportPptx} disabled={exporting || selectedCount === 0}
          className="flex items-center gap-2 px-4 py-2 bg-brand-cyan hover:bg-brand-cyan-dark text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" /></svg>
          {exporting ? 'Building…' : `Export PowerPoint (${selectedCount})`}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Period</label>
          <input value={period} onChange={(e) => setPeriod(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {blocks.map((b) => (
          <div key={b.id} className={`rounded-xl border bg-white dark:bg-gray-800 shadow-sm p-4 transition-all ${isIn(b.id) ? 'border-brand-cyan/60 ring-1 ring-brand-cyan/30' : 'border-gray-200 dark:border-gray-700 opacity-60'}`}>
            <label className="flex items-center justify-between mb-3 cursor-pointer">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{b.title}</span>
              <input type="checkbox" checked={isIn(b.id)} onChange={() => toggle(b.id)}
                className="rounded border-gray-300 dark:border-gray-600 text-brand-cyan focus:ring-brand-cyan w-4 h-4" />
            </label>
            <Preview b={b} />
          </div>
        ))}
      </div>
    </div>
  )
}
