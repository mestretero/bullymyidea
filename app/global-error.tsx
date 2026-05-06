'use client'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body style={{ background: '#0e0e0e', color: '#fff', fontFamily: 'sans-serif', padding: '60px 24px', minHeight: '100vh' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', fontStyle: 'italic', margin: '0 0 16px' }}>
            Total system failure.
          </h1>
          <p style={{ color: '#adaaaa', marginBottom: 32 }}>
            The page itself crashed. We are sorry.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: '#cafd00', color: '#000', border: 'none',
              padding: '14px 32px', fontWeight: 900, letterSpacing: '0.15em',
              fontSize: 12, textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
