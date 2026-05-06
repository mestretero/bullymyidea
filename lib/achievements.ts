// Achievement system based on user activity counts.
// Unlocked badges are shown on profiles. No DB persistence needed —
// derived from feedback/idea counts at read time.

export interface Achievement {
  id: string
  label: string
  description: string
  icon: string
  threshold: number
  metric: 'feedbacks_given' | 'ideas_posted' | 'upvotes_received'
  tier: 'bronze' | 'silver' | 'gold' | 'legendary'
}

export const ACHIEVEMENTS: Achievement[] = [
  // Critic ladder — feedbacks given
  { id: 'first-blood',     label: 'First Blood',      description: 'Posted your first critique',    icon: 'bloodtype',     threshold: 1,   metric: 'feedbacks_given', tier: 'bronze' },
  { id: 'rookie-bully',    label: 'Rookie Bully',     description: '5 critiques delivered',         icon: 'spa',           threshold: 5,   metric: 'feedbacks_given', tier: 'bronze' },
  { id: 'junior-critic',   label: 'Junior Critic',    description: '10 critiques delivered',        icon: 'trending_up',   threshold: 10,  metric: 'feedbacks_given', tier: 'silver' },
  { id: 'senior-bully',    label: 'Senior Bully',     description: '25 critiques delivered',        icon: 'local_fire_department', threshold: 25,  metric: 'feedbacks_given', tier: 'silver' },
  { id: 'master-bully',    label: 'Master Bully',     description: '50 critiques delivered',        icon: 'workspace_premium', threshold: 50,  metric: 'feedbacks_given', tier: 'gold' },
  { id: 'inquisitor',      label: 'The Inquisitor',   description: '100 critiques delivered',       icon: 'gavel',         threshold: 100, metric: 'feedbacks_given', tier: 'legendary' },

  // Founder ladder — ideas posted
  { id: 'first-pitch',     label: 'First Pitch',      description: 'Submitted your first idea',     icon: 'lightbulb',     threshold: 1,   metric: 'ideas_posted',    tier: 'bronze' },
  { id: 'serial-founder',  label: 'Serial Founder',   description: '5 ideas submitted',             icon: 'rocket_launch', threshold: 5,   metric: 'ideas_posted',    tier: 'silver' },
  { id: 'idea-machine',    label: 'Idea Machine',     description: '10 ideas submitted',            icon: 'precision_manufacturing', threshold: 10, metric: 'ideas_posted', tier: 'gold' },
  { id: 'visionary',       label: 'Visionary',        description: '25 ideas submitted',            icon: 'auto_awesome',  threshold: 25,  metric: 'ideas_posted',    tier: 'legendary' },

  // Quality ladder — upvotes received on critiques
  { id: 'sharp-tongue',    label: 'Sharp Tongue',     description: '10 upvotes on your critiques',  icon: 'thumbs_up_down', threshold: 10,  metric: 'upvotes_received', tier: 'silver' },
  { id: 'beloved-critic',  label: 'Beloved Critic',   description: '50 upvotes on your critiques',  icon: 'favorite',       threshold: 50,  metric: 'upvotes_received', tier: 'gold' },
  { id: 'oracle',          label: 'Oracle',           description: '200 upvotes on your critiques', icon: 'psychology',     threshold: 200, metric: 'upvotes_received', tier: 'legendary' },
]

export interface UserStats {
  feedbacks_given: number
  ideas_posted: number
  upvotes_received: number
}

export function unlockedAchievements(stats: UserStats): Achievement[] {
  return ACHIEVEMENTS.filter(a => stats[a.metric] >= a.threshold)
}

export function nextAchievement(stats: UserStats): Achievement | null {
  // Find the lowest-threshold achievement not yet unlocked
  const locked = ACHIEVEMENTS.filter(a => stats[a.metric] < a.threshold)
  if (!locked.length) return null
  return locked.sort((a, b) => (a.threshold - stats[a.metric]) - (b.threshold - stats[b.metric]))[0]
}

// Combined activity score — weights different actions.
// Critiquing builds the platform; ideas drive the platform; quality (upvotes) earns more.
export function activityScore(stats: UserStats): number {
  return stats.feedbacks_given * 1
    + stats.ideas_posted * 2
    + stats.upvotes_received * 0.5
}

export interface ReputationTier {
  key: string
  label: string
  min: number
}

// Reputation ladder driven by activity score.
export const REPUTATION_TIERS: ReputationTier[] = [
  { key: 'newcomer',    label: 'Newcomer',         min: 0 },
  { key: 'rookie',      label: 'Rookie',           min: 5 },
  { key: 'junior',      label: 'Junior Critic',    min: 15 },
  { key: 'senior',      label: 'Senior Bully',     min: 30 },
  { key: 'master',      label: 'Master Bully',     min: 60 },
  { key: 'inquisitor',  label: 'The Inquisitor',   min: 120 },
]

export function reputationTier(stats: UserStats): ReputationTier {
  const score = activityScore(stats)
  return REPUTATION_TIERS.slice().reverse().find(t => score >= t.min) ?? REPUTATION_TIERS[0]
}

export function nextReputationTier(stats: UserStats): { tier: ReputationTier; remaining: number } | null {
  const score = activityScore(stats)
  const next = REPUTATION_TIERS.find(t => t.min > score)
  if (!next) return null
  return { tier: next, remaining: next.min - score }
}

export const TIER_COLORS: Record<Achievement['tier'], string> = {
  bronze:    '#cd7f32',
  silver:    '#c0c0c0',
  gold:      '#f3ffca',
  legendary: '#cafd00',
}
