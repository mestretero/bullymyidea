import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import FeedbackCard from './FeedbackCard'
import type { Feedback } from '@/types'

const mockFeedback: Feedback = {
  id: 'fb-1', idea_id: 'idea-1',
  strengths: 'Pazar büyük', weaknesses: 'API kısıtlı', suggestions: 'Manuel upload ekle',
  user_id: null, created_at: new Date().toISOString(),
}

describe('FeedbackCard', () => {
  it('renders strengths', () => {
    render(<FeedbackCard feedback={mockFeedback} />)
    expect(screen.getByText('Pazar büyük')).toBeInTheDocument()
  })

  it('renders weaknesses', () => {
    render(<FeedbackCard feedback={mockFeedback} />)
    expect(screen.getByText('API kısıtlı')).toBeInTheDocument()
  })

  it('renders suggestions', () => {
    render(<FeedbackCard feedback={mockFeedback} />)
    expect(screen.getByText('Manuel upload ekle')).toBeInTheDocument()
  })
})
