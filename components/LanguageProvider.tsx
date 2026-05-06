// English-only stub. Kept as a hook so existing call sites don't have to change.
// No React context, no provider — just direct dictionary access.
import type { TranslationKey } from '@/lib/i18n'
import { t as translate } from '@/lib/i18n'

export function useLocale() {
  return { locale: 'en' as const, t: (key: TranslationKey) => translate(key) }
}

// No-op provider — keeps any leftover <LanguageProvider> import working.
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
