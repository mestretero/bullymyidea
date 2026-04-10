import Link from 'next/link'
import type { Idea } from '@/types'
import { getCategoryMeta } from '@/lib/categories'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Props { idea: Idea }

export default function IdeaCard({ idea }: Props) {
  const cat = getCategoryMeta(idea.category)
  const timeAgo = formatDistanceToNow(new Date(idea.created_at), { addSuffix: true, locale: tr })

  return (
    <Link href={`/idea/${idea.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#141414', border: '1px solid #1e1e1e', borderRadius: 12,
        padding: 16, cursor: 'pointer', transition: 'border-color .15s',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 100,
            background: cat.bg, color: cat.color, fontWeight: 500,
          }}>
            {cat.label}
          </span>
          <span style={{ fontSize: 11, color: '#2a2a2a' }}>{timeAgo}</span>
        </div>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e8e8e8', margin: '0 0 6px', lineHeight: 1.4 }}>
          {idea.title}
        </h3>
        <p style={{ fontSize: 12, color: '#555', margin: '0 0 10px', lineHeight: 1.5,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {idea.description}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: '#ff3b5c', fontWeight: 500 }}>
            {idea.feedback_count ?? 0} bully
          </span>
          <span style={{ fontSize: 11, color: '#333' }}>
            {idea.tags.slice(0, 3).map(t => `#${t}`).join(' ')}
          </span>
        </div>
      </div>
    </Link>
  )
}
