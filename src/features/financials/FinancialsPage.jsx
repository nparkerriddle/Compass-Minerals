import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useAppStore } from '../../store/useAppStore'
import Modal from '../../components/ui/Modal'

const inputCls = 'w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const EMPTY = { month: '', income: 0, grossProfit: 0, netIncome: 0 }

const usd = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('en-US')
const usdK = (n) => '$' + Math.round((Number(n) || 0) / 1000) + 'k'
const pct = (part, whole) => whole > 0 ? Math.round((part / whole) * 100) + '%' : '—'

function MonthModal({ isOpen, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial ?? EMPTY)
  const [error, setError] = useState('')
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  function save() {
    if (!form.month.trim()) { setError('Month label is required'); return }
    onSave({
      month: form.month.trim(),
      income: Number(form.income) || 0,
      grossProfit: Number(form.grossProfit) || 0,
      netIncome: Number(form.netIncome) || 0,
    })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'Edit Month' : 'Add Month'} size="sm"
      footer={<>
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">Cancel</button>
        <button onClick={save} className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg">{initial ? 'Save' : 'Add'}</button>
      </>}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Month</label>
          <input className={inputCls} value={form.month} onChange={(e) => set('month', e.target.value)} placeholder="e.g. Feb 2025" />
          {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Total Income</label>
          <input type="number" min="0" step="0.01" className={inputCls} value={form.income} onChange={(e) => set('income', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Gross Profit</label>
            <input type="number" step="0.01" className={inputCls} value={form.grossProfit} onChange={(e) => set('grossProfit', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Net Income</label>
            <input type="number" step="0.01" className={inputCls} value={form.netIncome} onChange={(e) => set('netIncome', e.target.value)} />
          </div>
        </div>
      </div>
    </Modal>
  )
}

function Tile({ label, value, sub, color, val }) {
  return (
    <div className={`rounded-xl border p-5 ${color}`}>
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${val}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function FinancialsPage() {
  const financials = useAppStore((s) => s.financials)
  const darkMode = useAppStore((s) => s.darkMode)
  const addFinancialMonth = useAppStore((s) => s.addFinancialMonth)
  const updateFinancialMonth = useAppStore((s) => s.updateFinancialMonth)
  const deleteFinancialMonth = useAppStore((s) => s.deleteFinancialMonth)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  const axisColor = darkMode ? '#9ca3af' : '#6b7280'
  const gridColor = darkMode ? '#374151' : '#e5e7eb'
  const tooltipStyle = { fontSize: 12, borderRadius: 8, border: `1px solid ${gridColor}`, background: darkMode ? '#1f2937' : '#ffffff', color: darkMode ? '#e5e7eb' : '#111827' }

  const latest = financials[financials.length - 1]
  const totals = useMemo(() => {
    const income = financials.reduce((s, m) => s + (m.income || 0), 0)
    const netIncome = financials.reduce((s, m) => s + (m.netIncome || 0), 0)
    return { income, netIncome }
  }, [financials])

  const chartData = financials.map((m) => ({
    month: m.month,
    Income: Math.round(m.income || 0),
    'Gross Profit': Math.round(m.grossProfit || 0),
    'Net Income': Math.round(m.netIncome || 0),
  }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Financials</h1>
            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">Internal</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Monthly profit &amp; loss for the Compass account</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Month
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile label={latest ? `Income — ${latest.month}` : 'Income'} value={latest ? usd(latest.income) : '—'} sub="latest month" color="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" val="text-blue-700 dark:text-blue-400" />
        <Tile label="Gross margin" value={latest ? pct(latest.grossProfit, latest.income) : '—'} sub="latest month" color="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" val="text-green-700 dark:text-green-400" />
        <Tile label="Net margin" value={latest ? pct(latest.netIncome, latest.income) : '—'} sub="latest month" color="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" val="text-emerald-700 dark:text-emerald-400" />
        <Tile label="Total net income" value={usd(totals.netIncome)} sub={`across ${financials.length} months`} color="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700" val="text-gray-700 dark:text-gray-300" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Monthly Trend</h3>
        {chartData.length === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center">No financial data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: axisColor }} />
              <YAxis tickFormatter={usdK} tick={{ fontSize: 11, fill: axisColor }} />
              <Tooltip formatter={(v) => usd(v)} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Gross Profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Net Income" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-xs uppercase tracking-wider text-gray-400">
              <th className="px-4 py-3 text-left font-semibold">Month</th>
              <th className="px-4 py-3 text-right font-semibold">Income</th>
              <th className="px-4 py-3 text-right font-semibold">Gross Profit</th>
              <th className="px-4 py-3 text-right font-semibold">GM %</th>
              <th className="px-4 py-3 text-right font-semibold">Net Income</th>
              <th className="px-4 py-3 text-right font-semibold">NM %</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {financials.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No months recorded yet.</td></tr>
            ) : financials.map((m) => (
              <tr key={m.id} className="border-b border-gray-100 dark:border-gray-700/60 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 group">
                <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100">{m.month}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">{usd(m.income)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">{usd(m.grossProfit)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-gray-500 dark:text-gray-400">{pct(m.grossProfit, m.income)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-gray-900 dark:text-gray-100">{usd(m.netIncome)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-gray-500 dark:text-gray-400">{pct(m.netIncome, m.income)}</td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditing(m); setModalOpen(true) }} className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30" title="Edit">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                    </button>
                    <button onClick={() => setConfirmId(m.id)} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" title="Delete">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166M18.16 5.79a48.108 48.108 0 00-3.478-.397" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <MonthModal isOpen={modalOpen} initial={editing}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSave={(data) => { if (editing) updateFinancialMonth(editing.id, data); else addFinancialMonth(data) }} />
      )}

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete month?</h3>
            <p className="text-sm text-gray-500 mb-5">This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmId(null)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">Cancel</button>
              <button onClick={() => { deleteFinancialMonth(confirmId); setConfirmId(null) }} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
