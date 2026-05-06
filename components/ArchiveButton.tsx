'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Props {
  ideaId: string
  /** When true, the button restores an archived idea instead of archiving it. */
  unarchive?: boolean
}

export default function ArchiveButton({ ideaId, unarchive = false }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    const targetStatus = unarchive ? 'active' : 'archived'
    const res = await fetch(`/api/ideas/${ideaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: targetStatus }),
    })
    setLoading(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      toast.error(d.error ?? 'Failed')
      return
    }
    toast.success(unarchive ? 'Idea restored' : 'Idea archived')
    if (unarchive) {
      router.refresh()
    } else {
      router.push('/')
      router.refresh()
    }
  }

  const label = unarchive ? 'Restore' : 'Archive idea'
  const confirmLabel = unarchive ? 'Yes, restore' : 'Yes, archive'
  const icon = unarchive ? 'unarchive' : 'archive'
  const color = unarchive ? 'text-primary' : 'text-[#ff7351]'
  const colorHover = unarchive ? 'hover:text-primary' : 'hover:text-[#ff7351]'

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className={`flex items-center gap-2 font-label text-[10px] uppercase tracking-widest text-neutral-600 ${colorHover} transition-colors`}
      >
        <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>
        {label}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="font-label text-[10px] uppercase tracking-widest text-neutral-500">Sure?</span>
      <button
        onClick={toggle}
        disabled={loading}
        className={`font-label text-[10px] uppercase tracking-widest ${color} hover:underline disabled:opacity-50`}
      >
        {loading ? '...' : confirmLabel}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="font-label text-[10px] uppercase tracking-widest text-neutral-600 hover:text-white"
      >
        Cancel
      </button>
    </div>
  )
}
