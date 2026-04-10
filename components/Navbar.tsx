'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Session } from '@supabase/supabase-js'

export default function Navbar() {
  const [session, setSession] = useState<Session | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  return (
    <nav style={{
      padding: '20px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #1a1a1a',
    }}>
      <Link href="/" style={{ fontWeight: 700, fontSize: 15, color: '#fff', textDecoration: 'none', letterSpacing: '-.02em' }}>
        bully <span style={{ color: '#ff3b5c' }}>my idea</span>
      </Link>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {session?.user?.is_anonymous === false ? (
          <>
            <Link href="/my-ideas" style={{ fontSize: 12, color: '#666', textDecoration: 'none' }}>Fikirlerim</Link>
            <Link href="/profile/me" style={{ fontSize: 12, color: '#666', textDecoration: 'none' }}>Profil</Link>
          </>
        ) : (
          <Link href="/auth" style={{ fontSize: 12, color: '#666', textDecoration: 'none' }}>Giriş</Link>
        )}
        <Link href="/submit" style={{
          fontSize: 12, background: '#ff3b5c', color: '#fff',
          borderRadius: 8, padding: '6px 14px', fontWeight: 600, textDecoration: 'none'
        }}>
          + Paylaş
        </Link>
      </div>
    </nav>
  )
}
