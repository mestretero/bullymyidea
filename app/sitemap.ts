import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bullymyidea.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const admin = createAdminClient()
  const { data: ideas } = await admin
    .from('ideas')
    .select('id, created_at, tags')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(5000)

  // Collect unique tags actually in use → tag pages.
  const tagCount = new Map<string, number>()
  for (const i of (ideas ?? []) as any[]) {
    for (const t of (i.tags ?? []) as string[]) {
      if (!t || !/^[a-z0-9-]{1,30}$/.test(t)) continue
      tagCount.set(t, (tagCount.get(t) ?? 0) + 1)
    }
  }

  const staticPaths: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE_URL}/categories`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/search`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  const ideaPaths: MetadataRoute.Sitemap = (ideas ?? []).map((i: any) => ({
    url: `${SITE_URL}/idea/${i.id}`,
    lastModified: new Date(i.created_at),
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  const tagPaths: MetadataRoute.Sitemap = Array.from(tagCount.entries())
    .filter(([, n]) => n >= 1)
    .map(([tag]) => ({
      url: `${SITE_URL}/tag/${encodeURIComponent(tag)}`,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }))

  return [...staticPaths, ...ideaPaths, ...tagPaths]
}
