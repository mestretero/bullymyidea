export type IdeaStatus = 'active' | 'archived'
export type VoteType = 'up' | 'down'
export type Category =
  | 'technology' | 'art' | 'business' | 'social'
  | 'education' | 'health' | 'entertainment' | 'other'

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
  media_urls?: string[]
  whitepaper_url?: string
  youtube_url?: string
  language?: string
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
  language?: string
  display_name?: string
  username?: string | null
  avatar_url?: string | null
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
