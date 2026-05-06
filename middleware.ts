import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const isDev = process.env.NODE_ENV !== 'production'

const supabaseHost = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co').host }
  catch { return '' }
})()

function buildCsp(nonce: string): string {
  // In dev, Next.js needs unsafe-inline + unsafe-eval for HMR. In prod, swap
  // unsafe-inline for a per-request nonce + strict-dynamic so any inline
  // <script> needs the matching nonce attribute.
  const scriptSrc = isDev
    ? `'self' 'unsafe-inline' 'unsafe-eval'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`

  return [
    `default-src 'self'`,
    `base-uri 'self'`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    `img-src 'self' data: blob: https://${supabaseHost} https://*.ytimg.com https://i.ytimg.com`,
    `media-src 'self' blob: https://${supabaseHost}`,
    `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
    `frame-src https://www.youtube-nocookie.com https://www.youtube.com`,
    `object-src 'none'`,
    `worker-src 'self' blob:`,
    `manifest-src 'self'`,
    `upgrade-insecure-requests`,
  ].join('; ')
}

export async function middleware(request: NextRequest) {
  // Per-request CSP nonce. Generated using Web Crypto (Edge-runtime safe).
  const nonceBytes = new Uint8Array(16)
  crypto.getRandomValues(nonceBytes)
  let binary = ''
  for (let i = 0; i < nonceBytes.length; i++) binary += String.fromCharCode(nonceBytes[i])
  const nonce = btoa(binary)

  // Forward the nonce to RSC + route handlers so they can attach it to
  // any inline <script>. Read with `headers().get('x-nonce')`.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  let response = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: requestHeaders } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: requestHeaders } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  await supabase.auth.getUser()

  // Attach CSP at response time (not build time) so the nonce is per-request.
  response.headers.set('Content-Security-Policy', buildCsp(nonce))
  response.headers.set('x-nonce', nonce)
  return response
}

export const config = {
  matcher: [
    // Apply to all pages and API routes; skip static assets.
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)',
  ],
}
