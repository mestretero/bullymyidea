import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import IdeaCard from './IdeaCard'
import type { Idea } from '@/types'

const mockIdea: Idea = {
  id: 'abc-123',
  title: 'Test fikri',
  description: 'Açıklama burada.',
  category: 'technology',
  tags: ['ai', 'test'],
  user_id: null,
  created_at: new Date().toISOString(),
  status: 'active',
  feedback_count: 5,
}

describe('IdeaCard', () => {
  it('renders title', () => {
    render(<IdeaCard idea={mockIdea} />)
    expect(screen.getByText('Test fikri')).toBeInTheDocument()
  })

  it('renders feedback count', () => {
    render(<IdeaCard idea={mockIdea} />)
    expect(screen.getByText(/5 comments/i)).toBeInTheDocument()
  })

  it('renders category badge', () => {
    render(<IdeaCard idea={mockIdea} />)
    expect(screen.getByText(/technology/i)).toBeInTheDocument()
  })

  it('renders new label for zero feedback', () => {
    render(<IdeaCard idea={{ ...mockIdea, feedback_count: 0 }} />)
    expect(screen.getByText(/new/i)).toBeInTheDocument()
  })

  it('renders tags', () => {
    render(<IdeaCard idea={mockIdea} />)
    expect(screen.getByText(/#ai/)).toBeInTheDocument()
  })
})
