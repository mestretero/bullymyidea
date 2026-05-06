const ID_RE = /^[a-zA-Z0-9_-]{11}$/

export function extractYouTubeId(url: string): string | null {
  if (!url) return null
  try {
    const u = new URL(url.trim())
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0]
      return ID_RE.test(id) ? id : null
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname === '/watch') {
        const id = u.searchParams.get('v') ?? ''
        return ID_RE.test(id) ? id : null
      }
      const m = u.pathname.match(/^\/(embed|shorts|live|v)\/([a-zA-Z0-9_-]{11})/)
      if (m) return m[2]
    }
    return null
  } catch {
    return null
  }
}
