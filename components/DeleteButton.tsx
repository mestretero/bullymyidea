'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteButton({ ideaId }: { ideaId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function remove() {
    setLoading(true)
    await fetch(`/api/ideas/${ideaId}`, { method: 'DELETE' })
    router.push('/')
    router.refresh()
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="flex items-center gap-2 font-label text-[10px] uppercase tracking-widest text-neutral-600 hover:text-error transition-colors"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
        Delete idea
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="font-label text-[10px] uppercase tracking-widest text-neutral-500">Permanent. Sure?</span>
      <button
        onClick={remove}
        disabled={loading}
        className="font-label text-[10px] uppercase tracking-widest text-error hover:underline disabled:opacity-50"
      >
        {loading ? '...' : 'Yes, delete'}
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
