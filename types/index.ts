export type IdeaStatus = 'active' | 'archived'
export type VoteType = 'up' | 'down'
export type Category =
  | 'teknoloji' | 'sanat' | 'iş' | 'sosyal'
  | 'eğitim' | 'sağlık' | 'eğlence' | 'diğer'

export interface Idea {
  id: string
  title: string
  description: string
  category: Category
  tags: string[]
  user_id: string | null
  created_at: string
  status: IdeaStatus
  feedback_count?: number
}

export interface Feedback {
  id: string
  idea_id: string
  strengths: string
  weaknesses: string
  suggestions: string
  user_id: string | null
  created_at: string
  vote_counts?: { up: number; down: number }
  user_vote?: VoteType | null
}

export interface Vote {
  id: string
  feedback_id: string
  vote_type: VoteType
  user_id: string | null
  created_at: string
}

export interface Report {
  id: string
  idea_id: string | null
  feedback_id: string | null
  reporter_ip_hash: string
  reason: string
  created_at: string
}
