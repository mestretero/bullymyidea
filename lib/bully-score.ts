// Bully Score — single curve used everywhere, with optional vote-quality bonus.
//
// Base formula (count-only):
//   score = min(9.9, sqrt(count) * 3)
//   1 critique = 3.0
//   4 critiques = 6.0
//   9 critiques = 9.0
//   11+ critiques = 9.9 (capped)
//
// Full formula (when vote data is available, e.g. on the idea detail page):
//   base = sqrt(count) * 3
//   avgCredibility = mean of (ups + 1) / (ups + downs + 2)  // Laplace-smoothed
//   score = min(9.9, base * (0.8 + avgCredibility * 0.4))
//
// The vote-quality bonus shifts the score by ±20% of base. A pile of upvoted
// critiques is more brutal than a pile of downvoted (fake) critiques.

export interface FeedbackForScore {
  created_at: string
  vote_counts?: { up: number; down: number } | null
}

function baseScore(count: number): number {
  if (count <= 0) return 0
  return Math.sqrt(count) * 3
}

export function calculateBullyScore(feedbacks: FeedbackForScore[]): number {
  if (!feedbacks.length) return 0
  const base = baseScore(feedbacks.length)
  let credSum = 0
  for (const fb of feedbacks) {
    const ups = fb.vote_counts?.up ?? 0
    const downs = fb.vote_counts?.down ?? 0
    credSum += (ups + 1) / (ups + downs + 2)
  }
  const avgCred = credSum / feedbacks.length
  const score = base * (0.8 + avgCred * 0.4)
  return Math.min(9.9, Math.round(score * 10) / 10)
}

export function estimateBullyScore(feedbackCount: number): number {
  return Math.min(9.9, Math.round(baseScore(feedbackCount) * 10) / 10)
}

export function formatScore(score: number): string {
  return score === 0 ? '—' : score.toFixed(1)
}
