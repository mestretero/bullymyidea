'use client'
import { useState } from 'react'
import { toast } from 'sonner'

interface Props {
  url: string
  title: string
}

export default function ShareButton({ url, title }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const fullUrl = typeof window !== 'undefined' && url.startsWith('/') ? window.location.origin + url : url
  const encoded = encodeURIComponent(fullUrl)
  const titleEncoded = encodeURIComponent(title)

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      toast.success('Link copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 font-label text-[10px] uppercase tracking-widest text-neutral-600 hover:text-primary transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>share</span>
        Share
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute left-0 top-full mt-2 z-50 bg-surface-container-high border border-white/10 min-w-[200px] py-2"
          >
            <button
              onClick={copy}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-container-highest font-label text-xs uppercase tracking-widest text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                {copied ? 'check' : 'content_copy'}
              </span>
              {copied ? 'Copied!' : 'Copy link'}
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${titleEncoded}&url=${encoded}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-container-highest font-label text-xs uppercase tracking-widest text-on-surface no-underline transition-colors"
              onClick={() => setOpen(false)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>alternate_email</span>
              Twitter / X
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-container-highest font-label text-xs uppercase tracking-widest text-on-surface no-underline transition-colors"
              onClick={() => setOpen(false)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>work</span>
              LinkedIn
            </a>
            <a
              href={`https://wa.me/?text=${titleEncoded}%20${encoded}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-container-highest font-label text-xs uppercase tracking-widest text-on-surface no-underline transition-colors"
              onClick={() => setOpen(false)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chat</span>
              WhatsApp
            </a>
          </div>
        </>
      )}
    </div>
  )
}
