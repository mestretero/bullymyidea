// Reserved usernames + display names.
// Block impersonation of staff/system entities. Lowercase comparison.

const RESERVED = new Set<string>([
  // Staff / authority
  'admin', 'admins', 'administrator', 'mod', 'mods', 'moderator', 'moderators',
  'staff', 'support', 'helpdesk', 'help', 'team', 'official', 'security',
  'abuse', 'legal', 'press', 'pr', 'sales', 'billing', 'noreply',
  // System / technical
  'system', 'root', 'null', 'undefined', 'anonymous', 'anon', 'guest', 'me', 'self',
  'api', 'www', 'mail', 'postmaster', 'webmaster', 'hostmaster',
  // Brand
  'bullymyidea', 'bully', 'bully-my-idea', 'bmi',
  // Common abuse
  'founder', 'owner', 'ceo',
])

export function isReservedUsername(name: string): boolean {
  return RESERVED.has(name.trim().toLowerCase())
}

// For display_name (shown on profile/feedback). Block @-prefix to avoid faking
// a username, plus the same reserved set.
export function isImpersonationAttempt(displayName: string): boolean {
  const trimmed = displayName.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('@')) return true
  return isReservedUsername(trimmed)
}
