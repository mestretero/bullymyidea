import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

global.fetch = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

import FeedbackForm from './FeedbackForm'

describe('FeedbackForm', () => {
  it('renders Bully Et button initially (collapsed)', () => {
    render(<FeedbackForm ideaId="idea-1" />)
    expect(screen.getByText('Bully Et')).toBeInTheDocument()
  })

  it('shows textareas after clicking Bully Et', async () => {
    render(<FeedbackForm ideaId="idea-1" />)
    fireEvent.click(screen.getByText('Bully Et'))
    expect(screen.getByPlaceholderText(/ne işe yarıyor/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/nerede çöküyor/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/nasıl kurtarırsın/i)).toBeInTheDocument()
  })

  it('calls POST /api/feedbacks on submit', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => ({}) } as any)
    render(<FeedbackForm ideaId="idea-1" />)

    fireEvent.click(screen.getByText('Bully Et'))
    fireEvent.change(screen.getByPlaceholderText(/ne işe yarıyor/i), { target: { value: 'Güçlü' } })
    fireEvent.click(screen.getByText('Gönder'))

    expect(fetch).toHaveBeenCalledWith('/api/feedbacks', expect.objectContaining({ method: 'POST' }))
  })
})
