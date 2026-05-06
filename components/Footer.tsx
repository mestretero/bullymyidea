'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { label: 'Feed', href: '/' },
  { label: 'Categories', href: '/categories' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Contact', href: '/contact' },
]

// Routes that have a left sidebar (~256px) — footer should clear it on lg+.
const SIDEBAR_ROUTES = ['/categories', '/admin']

export default function Footer() {
  const pathname = usePathname() ?? ''
  const hasSidebar = SIDEBAR_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))

  return (
    <footer
      className={`w-full flex flex-col md:flex-row justify-between items-center px-10 md:px-12 py-14 gap-8 bg-surface-container-lowest ${
        hasSidebar ? 'lg:pl-72' : ''
      }`}
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="flex flex-col items-center md:items-start">
        <div className="font-headline italic font-black text-xl text-primary mb-1">BullyMyIdea</div>
        <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant opacity-50">
          © {new Date().getFullYear()} BullyMyIdea — Built to break ideas.
        </p>
      </div>

      <nav className="flex flex-wrap justify-center gap-8">
        {NAV.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant hover:text-on-surface no-underline transition-all duration-300"
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant opacity-40">
        Be brutal. Be useful.
      </div>
    </footer>
  )
}
