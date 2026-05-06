import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/lib/supabase/admin'
import { estimateBullyScore, formatScore } from '@/lib/bully-score'

export const runtime = 'nodejs'
export const alt = 'BullyMyIdea — idea preview'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage({ params }: { params: { id: string } }) {
  const admin = createAdminClient()
  const { data: idea } = await admin
    .from('ideas')
    .select('title, description, category, status, user_id')
    .eq('id', params.id)
    .single()

  if (!idea || idea.status !== 'active') {
    return new ImageResponse(
      (
        <div style={fallbackStyle}>
          <span style={{ color: '#cafd00', fontSize: 96, fontStyle: 'italic', fontWeight: 900 }}>BullyMyIdea</span>
        </div>
      ),
      { ...size }
    )
  }

  // Stats
  const { count: feedbackCount } = await admin
    .from('feedbacks')
    .select('id', { count: 'exact', head: true })
    .eq('idea_id', params.id)

  const score = formatScore(estimateBullyScore(feedbackCount ?? 0))

  // Author
  let authorName: string | null = null
  if (idea.user_id) {
    const { data: prof } = await admin.from('profiles').select('username').eq('id', idea.user_id).single()
    if (prof?.username) authorName = `@${prof.username}`
  }

  const title = idea.title.length > 80 ? idea.title.slice(0, 78) + '…' : idea.title
  const desc = (idea.description ?? '').slice(0, 140) + ((idea.description ?? '').length > 140 ? '…' : '')
  const category = (idea.category as string).toUpperCase()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0e0e0e',
          display: 'flex',
          flexDirection: 'column',
          padding: '60px 70px',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 50 }}>
          <span
            style={{
              color: '#cafd00',
              fontSize: 38,
              fontStyle: 'italic',
              fontWeight: 900,
              letterSpacing: '-0.02em',
            }}
          >
            BullyMyIdea
          </span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span
              style={{
                fontSize: 16,
                color: '#adaaaa',
                background: '#262626',
                padding: '8px 14px',
                letterSpacing: '0.18em',
                fontWeight: 700,
              }}
            >
              {category}
            </span>
            <span
              style={{
                fontSize: 16,
                color: '#cafd00',
                border: '2px solid #cafd00',
                padding: '8px 14px',
                letterSpacing: '0.18em',
                fontWeight: 700,
              }}
            >
              UNDER FIRE
            </span>
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
          }}
        >
          <span
            style={{
              color: '#ffffff',
              fontSize: title.length > 50 ? 76 : 100,
              fontStyle: 'italic',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.0,
              display: 'block',
            }}
          >
            {title}
          </span>
        </div>

        {/* Description (only if title is shortish to leave room) */}
        {desc && title.length < 60 && (
          <div style={{ marginTop: 24, display: 'flex' }}>
            <span style={{ color: '#adaaaa', fontSize: 28, lineHeight: 1.35, maxWidth: 900 }}>
              {desc}
            </span>
          </div>
        )}

        {/* Bottom row */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 32,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            borderTop: '2px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* Author */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#666', fontSize: 16, letterSpacing: '0.25em', fontWeight: 700 }}>FOUNDER</span>
            <span style={{ color: '#ffffff', fontSize: 36, fontStyle: 'italic', fontWeight: 900, marginTop: 6 }}>
              {authorName ?? 'anonymous'}
            </span>
          </div>

          {/* Score + critiques */}
          <div style={{ display: 'flex', gap: 50, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ color: '#666', fontSize: 16, letterSpacing: '0.25em', fontWeight: 700 }}>CRITIQUES</span>
              <span style={{ color: '#ffffff', fontSize: 64, fontStyle: 'italic', fontWeight: 900, marginTop: 4, lineHeight: 1 }}>
                {feedbackCount ?? 0}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ color: '#666', fontSize: 16, letterSpacing: '0.25em', fontWeight: 700 }}>BULLY SCORE</span>
              <span style={{ color: '#cafd00', fontSize: 96, fontStyle: 'italic', fontWeight: 900, marginTop: 4, lineHeight: 1 }}>
                {score}
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}

const fallbackStyle = {
  width: '100%',
  height: '100%',
  background: '#0e0e0e',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
} as const
