import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy Policy — BullyMyIdea' }

const CONTACT_EMAIL = 'abbasboranaktas@gmail.com'
const LAST_UPDATED = 'April 30, 2026'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface pt-32 pb-24 px-6 md:px-20">
      <div className="max-w-3xl mx-auto">
        <span className="font-label text-primary uppercase text-xs tracking-[0.3em] block mb-3">Legal</span>
        <h1
          className="font-headline italic font-bold tracking-tighter text-on-surface leading-none mb-4"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
        >
          Privacy Policy.
        </h1>
        <p className="font-label text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-12">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="space-y-10 font-body text-on-surface-variant leading-relaxed">

          <section>
            <p>
              BullyMyIdea (&quot;we&quot;, &quot;us&quot;, &quot;the platform&quot;) is operated as a personal project. This Privacy
              Policy explains what information we collect, how we use it, and the choices you have. By using the
              platform you agree to the practices described below.
            </p>
          </section>

          <section>
            <h2 className="font-headline italic text-2xl text-on-surface mb-4">1. Information we collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-on-surface">Account data.</strong> When you register we store your email
                address (for authentication and password recovery) and a self-chosen username. Optional profile
                fields you provide (bio, avatar) are stored as you submit them.
              </li>
              <li>
                <strong className="text-on-surface">Content you publish.</strong> Ideas, critiques, votes, reports,
                uploaded images, optional whitepaper PDFs, and YouTube links you attach are stored in our database
                and object storage. Content marked &quot;active&quot; is publicly visible.
              </li>
              <li>
                <strong className="text-on-surface">Anonymous sessions.</strong> Visitors who critique without
                registering may supply only a display name. We do not store an email for anonymous critiques.
              </li>
              <li>
                <strong className="text-on-surface">Technical data.</strong> Your IP address is hashed (one-way) and
                stored for rate-limiting and spam mitigation. We do not retain raw IP addresses.
              </li>
              <li>
                <strong className="text-on-surface">Cookies.</strong> A small number of cookies are set by Supabase
                Auth to keep you signed in. We do not use third-party advertising or analytics cookies.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline italic text-2xl text-on-surface mb-4">2. How we use information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To operate the core features: posting ideas, critiques, votes, and reports.</li>
              <li>To authenticate you and keep your session active.</li>
              <li>To detect abuse, spam, and rate-limit excessive activity.</li>
              <li>To respond to your support requests sent to <a className="text-primary no-underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</li>
            </ul>
            <p className="mt-4">
              We do not sell your data, do not share it with advertisers, and do not use it to train AI models.
            </p>
          </section>

          <section>
            <h2 className="font-headline italic text-2xl text-on-surface mb-4">3. Service providers</h2>
            <p>
              The platform runs on Supabase (database, authentication, file storage) and a hosting provider for the
              web application. These providers process data strictly to deliver the service to you and are bound by
              their own privacy commitments. No other third parties receive your data.
            </p>
          </section>

          <section>
            <h2 className="font-headline italic text-2xl text-on-surface mb-4">4. Public content notice</h2>
            <p>
              Anything you publish — idea, critique, comment, uploaded image, attached PDF, profile bio, avatar —
              is intentionally public. Do not post information you are not willing to share with the world. Once
              public, content may be cached, indexed by search engines, or copied by third parties beyond our
              control.
            </p>
          </section>

          <section>
            <h2 className="font-headline italic text-2xl text-on-surface mb-4">5. Retention</h2>
            <p>
              Account data is retained while your account is active. Public content remains until you delete it or
              the platform is shut down. Hashed IP rate-limit records are kept on a rolling 24-hour window.
              Deleted ideas, critiques, and accounts are removed promptly; backups may retain copies for a short
              period before being overwritten.
            </p>
          </section>

          <section>
            <h2 className="font-headline italic text-2xl text-on-surface mb-4">6. Your rights</h2>
            <p>
              Depending on your jurisdiction (e.g. GDPR / KVKK / CCPA), you may have the right to access, correct,
              port, or delete your personal data, and to withdraw consent. To exercise any right, email{' '}
              <a className="text-primary no-underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{' '}
              from the address associated with your account. We respond within 30 days where required by law.
            </p>
          </section>

          <section>
            <h2 className="font-headline italic text-2xl text-on-surface mb-4">7. Security</h2>
            <p>
              We use industry-standard measures: TLS in transit, hashed credentials, row-level security on the
              database, and signed access to file storage. No system is perfectly secure. If you suspect a
              vulnerability, please report it privately to{' '}
              <a className="text-primary no-underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </section>

          <section>
            <h2 className="font-headline italic text-2xl text-on-surface mb-4">8. Children</h2>
            <p>
              The platform is not directed at children under 13. If you are under 13, do not register or post.
              If we learn an account belongs to a child under 13, we will delete it.
            </p>
          </section>

          <section>
            <h2 className="font-headline italic text-2xl text-on-surface mb-4">9. International transfers</h2>
            <p>
              Our service providers may process data on servers located outside your country. By using the
              platform you consent to such transfers, which we keep limited to providers offering adequate
              protections.
            </p>
          </section>

          <section>
            <h2 className="font-headline italic text-2xl text-on-surface mb-4">10. Changes to this policy</h2>
            <p>
              We may update this policy as the platform evolves. Material changes will be reflected in the
              &quot;last updated&quot; date above. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="font-headline italic text-2xl text-on-surface mb-4">11. Contact</h2>
            <p>
              For privacy questions, data requests, or anything else legal-adjacent:{' '}
              <a className="text-primary no-underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
