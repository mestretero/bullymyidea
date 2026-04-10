import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
            onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }) }
  }))
}))

import Navbar from './Navbar'

describe('Navbar', () => {
  it('renders logo', () => {
    render(<Navbar />)
    expect(screen.getByText(/bully/i)).toBeInTheDocument()
  })

  it('shows Giriş and Paylaş buttons when not logged in', () => {
    render(<Navbar />)
    expect(screen.getByText('Giriş')).toBeInTheDocument()
    expect(screen.getByText('+ Paylaş')).toBeInTheDocument()
  })
})
