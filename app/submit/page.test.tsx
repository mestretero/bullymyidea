import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

global.fetch = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

import SubmitPage from './page'

describe('SubmitPage', () => {
  it('renders title and description fields', () => {
    render(<SubmitPage />)
    expect(screen.getByPlaceholderText(/fikrin kısa adı/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/fikrin ne/i)).toBeInTheDocument()
  })

  it('renders category select', () => {
    render(<SubmitPage />)
    expect(screen.getByText('Teknoloji')).toBeInTheDocument()
  })

  it('calls POST /api/ideas on submit', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'idea-1' }) } as any)
    render(<SubmitPage />)

    fireEvent.change(screen.getByPlaceholderText(/fikrin kısa adı/i), { target: { value: 'Test Fikri' } })
    fireEvent.change(screen.getByPlaceholderText(/fikrin ne/i), { target: { value: 'Açıklama buraya' } })
    fireEvent.click(screen.getByText(/paylaş/i))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/ideas', expect.objectContaining({ method: 'POST' }))
    })
  })

  it('shows error message on failed submit', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Başlık gerekli' }) } as any)
    render(<SubmitPage />)
    fireEvent.click(screen.getByText(/paylaş/i))
    await waitFor(() => expect(screen.getByText('Başlık gerekli')).toBeInTheDocument())
  })
})
