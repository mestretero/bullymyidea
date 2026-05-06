import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AnonSessionInit from '@/components/AnonSessionInit'
import CookieConsent from '@/components/CookieConsent'
import './globals.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bullymyidea.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'BullyMyIdea — Get Your Idea Shredded',
    template: '%s · BullyMyIdea',
  },
  description: 'Founders submit ideas. The community delivers brutal, opinionated critique. Ideas are fragile — bullying makes them bulletproof.',
  applicationName: 'BullyMyIdea',
  keywords: ['startup feedback', 'idea critique', 'founder community', 'product feedback', 'brutal honesty'],
  openGraph: {
    type: 'website',
    siteName: 'BullyMyIdea',
    title: 'BullyMyIdea — Get Your Idea Shredded',
    description: 'Founders submit ideas. The community delivers brutal, opinionated critique.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BullyMyIdea',
    description: 'Get your idea shredded. Brutally.',
  },
  robots: { index: true, follow: true },
  verification: {
    google: '2s_YH2yg9sMknz7W9bkkkqrVXh6yGO8uVKyyKnXwA_8',
  },
  icons: {
    icon: [
      { url: '/bully-my-idea-icon.webp', type: 'image/webp' },
    ],
    apple: [
      { url: '/bully-my-idea-icon.webp', type: 'image/webp' },
    ],
  },
  manifest: '/manifest.webmanifest',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body style={{ background: '#0e0e0e', color: '#ffffff', minHeight: '100vh', overflowX: 'hidden' }}>
        <AnonSessionInit />
        <Navbar />
        <main>
          {children}
        </main>
        <Footer />
        <CookieConsent />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--surface-container-high, #201f1f)',
              color: 'var(--on-surface, #fff)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '13px',
              letterSpacing: '0.05em',
            },
            className: 'font-body',
          }}
        />
      </body>
    </html>
  )
}
