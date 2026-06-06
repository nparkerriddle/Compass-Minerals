import { useState, useRef, useCallback } from 'react'

const ACCEPT = '.xlsx,.xls,.csv'
const MAX_PREVIEW_ROWS = 25

export default function PayrollPage() {
  const [dragging, setDragging] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null) // { fileName, sheetNames, sheet, headers, rows, totalRows }
  const inputRef = useRef(null)

  const handleFile = useCallback(async (file) => {
    if (!file) return
    setError('')
    setParsing(true)
    try {
      const XLSX = (await import('xlsx')).default
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { cellDates: true })
      const sheetName = wb.SheetNames[0]
      const ws = wb.Sheets[sheetName]
      const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
      const nonEmpty = aoa.filter((r) => r.some((c) => String(c).trim() !== ''))
      const headers = (nonEmpty[0] || []).map((h) => String(h))
      const rows = nonEmpty.slice(1)
      setResult({
        fileName: file.name,
        sheetNames: wb.SheetNames,
        sheet: sheetName,
        headers,
        rows,
        totalRows: rows.length,
      })
    } catch (e) {
      setError(`Could not read that file: ${e.message}`)
      setResult(null)
    } finally {
      setParsing(false)
    }
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    handleFile(file)
  }, [handleFile])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Payroll</h1>
            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">Beta</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Drop a Kronos hours report to process. Processing rules are wired up once we have a sample report.</p>
        </div>
        {result && (
          <button onClick={() => { setResult(null); setError('') }}
            className="px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
            Clear
          </button>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-brand-cyan bg-brand-cyan/5'
            : 'border-gray-300 dark:border-gray-600 hover:border-brand-cyan/60 bg-white dark:bg-gray-800'
        }`}
      >
        <input ref={inputRef} type="file" accept={ACCEPT} className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])} />
        <div className="mx-auto w-12 h-12 rounded-full bg-brand-cyan/10 text-brand-cyan flex items-center justify-center mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {parsing ? 'Reading file…' : <>Drag &amp; drop a Kronos report here, or <span className="text-brand-cyan font-semibold">browse</span></>}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Accepts .xlsx, .xls, or .csv — the file is read in your browser and never uploaded.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300">{error}</div>
      )}

      {result && (
        <>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm">
            <span className="text-gray-700 dark:text-gray-200"><span className="text-gray-400">File:</span> <span className="font-medium">{result.fileName}</span></span>
            <span className="text-gray-700 dark:text-gray-200"><span className="text-gray-400">Sheet:</span> <span className="font-medium">{result.sheet}</span></span>
            <span className="text-gray-700 dark:text-gray-200"><span className="text-gray-400">Columns:</span> <span className="font-medium">{result.headers.length}</span></span>
            <span className="text-gray-700 dark:text-gray-200"><span className="text-gray-400">Data rows:</span> <span className="font-medium">{result.totalRows}</span></span>
          </div>

          <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            File parsed successfully. Next step (pending a sample Kronos report): map the columns and total <strong>hours by employee and cost center</strong>. Below is a raw preview of the first {Math.min(result.totalRows, MAX_PREVIEW_ROWS)} rows so we can confirm the layout.
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400">#</th>
                    {result.headers.map((h, i) => (
                      <th key={i} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap">{h || <span className="text-gray-300">col {i + 1}</span>}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                  {result.rows.slice(0, MAX_PREVIEW_ROWS).map((row, ri) => (
                    <tr key={ri} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-3 py-1.5 text-gray-400 tabular-nums">{ri + 1}</td>
                      {result.headers.map((_, ci) => (
                        <td key={ci} className="px-3 py-1.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{String(row[ci] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.totalRows > MAX_PREVIEW_ROWS && (
              <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-200 dark:border-gray-700">
                Showing {MAX_PREVIEW_ROWS} of {result.totalRows} rows.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
