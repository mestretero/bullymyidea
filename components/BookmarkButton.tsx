'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Props {
  ideaId: string
  initial: boolean
  signedIn: boolean
}

export default function BookmarkButton({ ideaId, initial, signedIn }: Props) {
  const router = useRouter()
  const [active, setActive] = useState(initial)
  const [, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)

  async function toggle() {
    if (!signedIn) {
      toast.error('Sign in to bookmark')
      router.push('/auth')
      return
    }
    setBusy(true)
    const prev = active
    setActive(!prev) // optimistic
    const res = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea_id: ideaId }),
    })
    setBusy(false)
    if (!res.ok) {
      setActive(prev)
      const d = await res.json()
      toast.error(d.error ?? 'Failed')
      return
    }
    const data = await res.json()
    setActive(data.bookmarked)
    toast.success(data.bookmarked ? 'Saved to bookmarks' : 'Removed from bookmarks')
    startTransition(() => router.refresh())
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={active ? 'Remove bookmark' : 'Bookmark this idea'}
      aria-pressed={active}
      className="flex items-center gap-2 font-label text-[10px] uppercase tracking-widest text-neutral-600 hover:text-primary transition-colors disabled:opacity-50"
    >
      <span
        aria-hidden="true"
        className="material-symbols-outlined"
        style={{ fontSize: 16, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
      >
        bookmark
      </span>
      {active ? 'Saved' : 'Save'}
    </button>
  )
}
