import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="max-w-2xl text-center pt-20 relative overflow-hidden">
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          aria-hidden
        >
          <span
            className="font-headline italic font-black select-none text-stroke whitespace-nowrap"
            style={{ fontSize: 'clamp(10rem, 32vw, 22rem)', opacity: 0.06 }}
          >
            404
          </span>
        </div>

        <div className="relative z-10">
          <span className="font-label text-primary uppercase text-xs tracking-[0.3em] block mb-3">
            Lost in the void
          </span>
          <h1
            className="font-headline italic font-extrabold tracking-tighter text-on-surface leading-none mb-6"
            style={{ fontSize: 'clamp(3rem, 9vw, 6rem)' }}
          >
            Page<br />
            <span className="text-primary">not found.</span>
          </h1>
          <p className="font-body text-lg text-on-surface-variant mb-12 max-w-md mx-auto">
            This idea was either bullied into oblivion, archived by its founder, or never existed.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <Link
              href="/"
              className="bg-primary text-black font-label font-black uppercase tracking-[0.2em] text-sm px-10 py-5 no-underline hover:brightness-110 transition-all inline-block"
            >
              Back to feed
            </Link>
            <Link
              href="/categories"
              className="font-label font-black uppercase tracking-[0.2em] text-sm px-10 py-5 no-underline inline-block transition-all text-primary hover:bg-primary hover:text-black"
              style={{ border: '1px solid var(--primary)' }}
            >
              Browse categories
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
