import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Contact — BullyMyIdea' }

const EMAIL = 'abbasboranaktas@gmail.com'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-surface">

      {/* ── HERO ───────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 md:px-20 overflow-hidden border-b border-white/5">
        {/* Ghost letterform */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <span
            className="font-headline font-black uppercase select-none italic text-stroke"
            style={{ fontSize: 'clamp(10rem, 32vw, 26rem)', opacity: 0.06, whiteSpace: 'nowrap' }}
          >
            INBOX
          </span>
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <span className="bg-[#262626] text-[#adaaaa] text-[10px] uppercase tracking-[0.2em] px-3 py-1 font-label">
              Contact
            </span>
            <span className="w-12 h-[1px] bg-[#494847]/30" />
            <span className="text-primary text-[10px] uppercase tracking-[0.2em] font-label">Direct Line</span>
          </div>

          <h1
            className="font-headline italic font-extrabold tracking-tighter text-on-surface leading-none mb-8"
            style={{ fontSize: 'clamp(3rem, 9vw, 7rem)' }}
          >
            Got something<br />
            <span className="text-primary">to say?</span>
          </h1>

          <p className="font-body text-xl md:text-2xl text-on-surface-variant max-w-2xl leading-relaxed mb-12">
            No support tickets. No chatbots. No forms that pretend to care.<br />
            Just an inbox and a human who reads it.
          </p>

          <a
            href={`mailto:${EMAIL}`}
            className="inline-flex flex-wrap items-center gap-4 max-w-full bg-primary text-black font-label font-black uppercase tracking-[0.2em] text-sm md:text-base px-6 md:px-12 py-5 md:py-6 no-underline hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>send</span>
            <span className="break-all">{EMAIL}</span>
          </a>
        </div>
      </section>

      {/* ── META GRID ─────────────────────────────────── */}
      <section className="py-20 px-6 md:px-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-label text-[11px] uppercase tracking-[0.3em] text-on-surface-variant mb-10">
            What you should know
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-white/10 divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="p-8 md:p-10">
              <span className="block font-label text-[10px] uppercase tracking-[0.25em] text-primary mb-3">Response time</span>
              <p className="font-headline italic font-black text-3xl text-on-surface leading-none mb-3">1–2 days</p>
              <p className="font-body text-sm text-on-surface-variant">
                Usually faster. Sometimes slower. Built by one person, not a help desk.
              </p>
            </div>

            <div className="p-8 md:p-10">
              <span className="block font-label text-[10px] uppercase tracking-[0.25em] text-primary mb-3">Based in</span>
              <p className="font-headline italic font-black text-3xl text-on-surface leading-none mb-3">The Void</p>
              <p className="font-body text-sm text-on-surface-variant">
                A.k.a. the internet. Time zones do not exist here. Mostly.
              </p>
            </div>

            <div className="p-8 md:p-10">
              <span className="block font-label text-[10px] uppercase tracking-[0.25em] text-primary mb-3">Talk to us about</span>
              <p className="font-headline italic font-black text-3xl text-on-surface leading-none mb-3">Anything</p>
              <p className="font-body text-sm text-on-surface-variant">
                Bugs, ideas, feedback, takedowns, partnerships, weird existential thoughts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BANNER ────────────────────────────────────── */}
      <section className="relative py-32 px-6 md:px-20 overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <span
            className="font-headline font-black uppercase select-none text-stroke"
            style={{ fontSize: 'clamp(8rem, 28vw, 22rem)', opacity: 0.05, whiteSpace: 'nowrap' }}
          >
            BULLY
          </span>
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <p className="font-headline italic text-3xl md:text-4xl text-on-surface leading-tight mb-8">
            &ldquo;Be brutal.<br />
            <span className="text-primary">Be useful.</span><br />
            Don&apos;t be a coward.&rdquo;
          </p>
          <p className="font-label text-[10px] uppercase tracking-[0.3em] text-neutral-500">
            — House rule no.1
          </p>
        </div>
      </section>

      {/* ── DIRECT MAIL CTA ───────────────────────────── */}
      <section className="py-20 px-6 md:px-20 bg-surface-container-lowest">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <span className="block font-label text-[10px] uppercase tracking-[0.25em] text-on-surface-variant mb-2">Prefer copy-paste?</span>
            <span className="font-headline italic text-2xl md:text-3xl text-on-surface break-all">{EMAIL}</span>
          </div>
          <a
            href={`mailto:${EMAIL}`}
            className="font-label font-black uppercase tracking-[0.25em] text-xs px-10 py-5 text-on-surface hover:bg-on-surface hover:text-surface transition-all duration-300 no-underline whitespace-nowrap"
            style={{ border: '1px solid var(--outline-variant)' }}
          >
            Open mail client →
          </a>
        </div>
      </section>
    </div>
  )
}
