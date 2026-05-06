'use client'
import { useState } from 'react'
import { toast } from 'sonner'

export default function DataExportButton() {
  const [busy, setBusy] = useState(false)

  async function exportData() {
    setBusy(true)
    try {
      const res = await fetch('/api/account/export')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'Export failed')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bullymyidea-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Your data is downloading')
    } catch {
      toast.error('Network error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={exportData}
      disabled={busy}
      className="flex items-center gap-2 font-label text-[10px] uppercase tracking-widest text-neutral-500 hover:text-primary transition-colors disabled:opacity-50"
    >
      <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 14 }}>download</span>
      {busy ? 'Preparing…' : 'Export my data'}
    </button>
  )
}
