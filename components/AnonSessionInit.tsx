'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// Silently creates an anonymous Supabase session on first visit if none exists.
export default function AnonSessionInit() {
  const supabase = createClient()
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        supabase.auth.signInAnonymously()
      }
    })
  }, [])
  return null
}
