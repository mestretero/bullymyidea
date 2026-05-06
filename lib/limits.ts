// Single source of truth for input limits.
// Mirror these in DB constraints (010_constraints.sql) and client maxLength props.

export const LIMITS = {
  ideaTitle: { min: 3, max: 100 },
  ideaDescription: { min: 10, max: 3000 },
  ideaTagLength: 20,
  ideaTagCount: 5,
  feedbackField: 1000, // each of strengths/weaknesses/suggestions
  displayName: 40,
  username: { min: 2, max: 30 },
  bio: 200,
  imageMaxBytes: 3 * 1024 * 1024,
  pdfMaxBytes: 5 * 1024 * 1024,
  avatarMaxBytes: 1 * 1024 * 1024,
} as const

// Anti-spam: minimum seconds between form load and submit
export const MIN_FORM_DWELL_SECONDS = 3
