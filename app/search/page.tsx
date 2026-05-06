import type { Metadata } from 'next'
import SearchView from '@/components/SearchView'

export const metadata: Metadata = { title: 'Search' }

interface Props {
  searchParams: { q?: string; category?: string; tag?: string; sort?: string }
}

export default function SearchPage({ searchParams }: Props) {
  const sort = searchParams.sort === 'bullied' ? 'bullied' : 'recent'
  return (
    <SearchView
      initialQuery={searchParams.q ?? ''}
      initialCategory={searchParams.category ?? ''}
      initialTag={searchParams.tag ?? ''}
      initialSort={sort}
    />
  )
}
