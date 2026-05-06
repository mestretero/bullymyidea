// Robust client-IP detection for rate-limiting.
//
// `X-Forwarded-For` is a comma-separated list ordered "client, proxy1, proxy2".
// The FIRST entry is attacker-controlled (anyone can set their own header).
// The LAST entry is the IP of the closest hop to our server — the only one
// we can trust if the request reached us through exactly one trusted proxy.
//
// Vercel and Cloudflare set `X-Real-IP` to the verified client IP. Prefer it.

import type { NextRequest } from 'next/server'

type HeaderSource = Headers | NextRequest['headers'] | { get(name: string): string | null }

export function getClientIp(headers: HeaderSource): string {
  const realIp = headers.get('x-real-ip')
  if (realIp && realIp.trim()) return realIp.trim()

  const xff = headers.get('x-forwarded-for')
  if (xff) {
    // Trust the LAST hop, not the first (which is client-spoofable).
    const parts = xff.split(',').map(s => s.trim()).filter(Boolean)
    if (parts.length) return parts[parts.length - 1]
  }

  return 'unknown'
}
