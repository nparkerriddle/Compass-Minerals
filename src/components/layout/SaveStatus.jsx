import { useEffect, useState } from 'react'
import { saveStatus } from '../../lib/serverStorage'

const MAP = {
  saving: { text: 'Saving…', cls: 'text-slate-400', dot: 'bg-amber-400 animate-pulse' },
  saved: { text: 'All changes saved', cls: 'text-slate-400', dot: 'bg-green-400' },
  error: { text: 'Save failed — retrying', cls: 'text-red-400', dot: 'bg-red-500' },
}

export default function SaveStatus() {
  const [st, setSt] = useState(saveStatus.get())
  useEffect(() => saveStatus.subscribe(setSt), [])
  if (st.state === 'idle') return null
  const m = MAP[st.state] || MAP.saving
  return (
    <div className={`flex items-center gap-2 px-3 py-1 text-[11px] ${m.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${m.dot}`} />
      {m.text}
    </div>
  )
}
