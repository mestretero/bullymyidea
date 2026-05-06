import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/admin'
import Link from 'next/link'

export const metadata = { title: 'Admin', robots: { index: false, follow: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser()
  if (!user) redirect('/')

  return (
    <div className="min-h-screen bg-surface pt-32 pb-24 px-6 md:px-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12 pb-6 border-b border-white/10">
          <div>
            <span className="font-label text-error uppercase text-xs tracking-[0.3em] block mb-2">Restricted</span>
            <h1 className="font-headline italic font-bold text-3xl text-on-surface">Admin</h1>
          </div>
          <nav className="flex gap-6">
            <Link href="/admin" className="font-label text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary no-underline">
              Dashboard
            </Link>
            <Link href="/admin/users" className="font-label text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary no-underline">
              Users
            </Link>
            <Link href="/admin/reports" className="font-label text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary no-underline">
              Reports
            </Link>
            <Link href="/admin/audit" className="font-label text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary no-underline">
              Audit
            </Link>
          </nav>
        </div>
        {children}
      </div>
    </div>
  )
}
