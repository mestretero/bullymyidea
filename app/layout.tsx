import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navbar from '@/components/Navbar'
import AnonSessionInit from '@/components/AnonSessionInit'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bully My Idea',
  description: 'Fikrini paylaş. Parçalayalım.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={inter.className} style={{ background: '#0a0a0a', color: '#e0e0e0', minHeight: '100vh' }}>
        <AnonSessionInit />
        <Navbar />
        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
