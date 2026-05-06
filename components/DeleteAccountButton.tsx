'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const CONFIRM_PHRASE = 'DELETE MY ACCOUNT'

export default function DeleteAccountButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [phrase, setPhrase] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleDelete() {
    if (phrase !== CONFIRM_PHRASE) {
      toast.error('Phrase does not match')
      return
    }
    if (!password) {
      toast.error('Password required')
      return
    }
    setBusy(true)
    const res = await fetch('/api/account/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setBusy(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      toast.error(d.error ?? 'Failed to delete')
      return
    }
    toast.success('Account deleted')
    router.push('/')
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="group inline-flex items-center justify-center gap-2 font-label font-black text-xs uppercase tracking-[0.2em] px-6 py-3 text-error border-2 border-error/40 hover:bg-error hover:text-white hover:border-error transition-all duration-200 active:scale-[0.97] w-full md:w-auto"
      >
        <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 16 }}>delete_forever</span>
        Delete account
      </button>
    )
  }

  return (
    <div className="space-y-4 p-6 border border-error/30 bg-error/5 max-w-md">
      <p className="font-headline italic text-xl text-error">This is permanent.</p>
      <p className="font-body text-sm text-on-surface-variant">
        Your account, ideas, critiques, votes, and bookmarks will be deleted forever. There is no undo.
      </p>
      <p className="font-body text-sm text-on-surface-variant">
        Type <code className="font-mono text-error">{CONFIRM_PHRASE}</code> to confirm:
      </p>
      <input
        type="text"
        value={phrase}
        onChange={e => setPhrase(e.target.value)}
        className="w-full bg-black/30 border border-error/30 px-4 py-3 text-sm font-body text-on-surface focus:border-error focus:ring-0 outline-none"
        placeholder={CONFIRM_PHRASE}
      />
      <p className="font-body text-sm text-on-surface-variant">
        Confirm with your account password:
      </p>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        autoComplete="current-password"
        className="w-full bg-black/30 border border-error/30 px-4 py-3 text-sm font-body text-on-surface focus:border-error focus:ring-0 outline-none"
        placeholder="Password"
      />
      <div className="flex gap-3">
        <button
          onClick={handleDelete}
          disabled={busy || phrase !== CONFIRM_PHRASE || !password}
          className="bg-error text-white font-label font-bold py-2 px-6 uppercase text-xs tracking-widest disabled:opacity-30 transition-opacity"
        >
          {busy ? 'Deleting...' : 'Delete forever'}
        </button>
        <button
          onClick={() => { setOpen(false); setPhrase(''); setPassword('') }}
          className="font-label text-xs uppercase tracking-widest text-neutral-500 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
