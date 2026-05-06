import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Terms of Service — BullyMyIdea' }

const CONTACT_EMAIL = 'abbasboranaktas@gmail.com'
const LAST_UPDATED = 'April 30, 2026'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface pt-32 pb-24 px-6 md:px-20">
      <div className="max-w-3xl mx-auto">
        <span className="font-label text-primary uppercase text-xs tracking-[0.3em] block mb-3">Legal</span>
        <h1
          className="font-headline italic font-bold tracking-tighter text-on-surface leading-none mb-4"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
        >
          Terms of Service.
        </h1>
        <p className="font-label text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-12">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="space-y-10 font-body text-on-surface-variant leading-relaxed">

          <section>
            <p>
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of BullyMyIdea (the &quot;Platform&quot;).
              By creating an account, posting content, or otherwise using the Platform, you agree to these
              Terms. If you do not agree, do not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="font-headline italic text-2xl text-on-surface mb-4">1. The Platform</h2>
            <p>
              BullyMyIdea is a public forum where founders and creators submit ideas to receive harsh, opinionated
              critique from other users. Critiques are personal opinions, not professional, financial, legal, or
              investment advice. Nothing you read here constitutes endorsement, validation, or recommendation by
              the Platform operator.
            </p>
          </section>

          <section>
            <h2 className="font-headline italic text-2xl text-on-surface mb-4">2. Eligibility & accounts</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You must be at least 13 years old to use the Platform.</li>
              <li>You are responsible for any activity under your account, including keeping credentials secure.</li>
              <li>You agree to provide accurate information and not impersonate others.</li>
              <li>One person, one account. Automated, bulk, or fake accounts are prohibited and will be removed.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline italic text-2xl text-on-surface mb-4">3. Acceptable use</h2>
            <p className="mb-3">You agree NOT to use the Platform to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Harass, threaten, dox, or incite violence against any person or group.</li>
              <li>Post hate speech, discriminatory content, or sexually explicit material.</li>
              <li>Infringe on copyrights, trademarks, trade secrets, or other intellectual property.</li>
              <li>Distribute malware, run scrapers, brute-force endpoints, or otherwise abuse the service.</li>
              <li>Submit content that is illegal in your jurisdiction or that promotes illegal activity.</li>
              <li>Attempt to bypass rate limits, authentication, RLS policies, or any other security control.</li>
              <li>Use the Platform to send spam or unsolicited promotions.</li>
              <li>Submit personal data of other people without their explicit consent.</li>
            </ul>
            <p className="mt-4">
              <strong className="text-on-surface">Critique vs. abuse.</strong> Sharp, brutal, or sarcastic critique
              of an <em>idea</em> is welcome and is the entire point of the Platform. Critique of a <em>person</em>
              {' '}is not. We draw the line where opinion ends and personal attack begins.
            </p>
          </section>

          <section>
            <h2 className="font-headline italic text-2xl text-on-surface mb-4">4. Your content</h2>
            <p>
              You retain ownership of the ideas, critiques, images, and other materials you submit (&quot;Your
              Content&quot;). By submitting Your Content you grant the Platform a worldwide, non-exclusive,
              royalty-free license to host, display, distribute, and reproduce it on the Platform for the
              purpose of operating the service. This license ends when you delete Your Content, except that
              backups may retain copies for a limited rolling window and any portion already shared by other
              users (e.g. quoted in a critique) may persist.
            </p>
            <p className="mt-3">
              You represent that you have the rights to submit Your Content and that doing so does not violate
              any law or third-party right.
            </p>
          </section>

          <section>
            <h2 className="font-headline italic text-2xl text-on-surface mb-4">5. Moderation & removal</h2>
            <p>
              We may, at our sole discretion and without notice, remove content, suspend accounts, archive ideas,
              limit functionality, or block IP addresses that we believe violate these Terms or harm the Platform
              or its users. We are not obligated to host any content and we are not a publisher of user content.
            </p>
          </section>

          <section>
            <h2 className="font-headline italic text-2xl text-on-surface mb-4">6. Intellectual property complaints</h2>
            <p>
              If you believe content on the Platform infringes your intellectual property, email{' '}
              <a className="text-primary no-underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{' '}
              with: (a) identification of the work, (b) the URL of the offending content, (c) your contact
              details, and (d) a good-faith statement that the use is unauthorized. We will review and act on
              valid claims promptly.
            </p>
          </section>

          <section>
            <h2 className="font-headline italic text-2xl text-on-surface mb-4">7. No warranty</h2>
            <p>
              THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;, WITHOUT WARRANTIES OF ANY KIND, EXPRESS
              OR IMPLIED, INCLUDING WITHOUT LIMITATION WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
              PURPOSE, NON-INFRINGEMENT, ACCURACY, OR UNINTERRUPTED OPERATION. WE DO NOT WARRANT THAT THE
              PLATFORM WILL BE ERROR-FREE OR THAT DATA WILL NEVER BE LOST.
            </p>
          </section>

          <section>
            <h2 className="font-headline italic text-2xl text-on-surface mb-4">8. Limitation of liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL THE PLATFORM, ITS OPERATOR, OR ITS
              CONTRIBUTORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES
              (INCLUDING LOSS OF PROFITS, REVENUE, DATA, GOODWILL, BUSINESS OPPORTUNITY, OR REPUTATION) ARISING
              FROM OR RELATED TO YOUR USE OF THE PLATFORM, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              OUR TOTAL CUMULATIVE LIABILITY FOR ANY CLAIM RELATED TO THE PLATFORM SHALL NOT EXCEED USD 50.
            </p>
            <p className="mt-3">
              You acknowledge that critiques on the Platform are public opinions and may be harsh, mistaken, or
              biased. You will not hold the operator responsible for the content posted by other users.
            </p>
          </section>

          <section>
            <h2 className="font-headline italic text-2xl text-on-surface mb-4">9. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless the Platform and its operator from any claim,
              damage, liability, or expense (including reasonable legal fees) arising from (a) Your Content,
              (b) your use of the Platform, or (c) your violation of these Terms or any law.
            </p>
          </section>

          <section>
            <h2 className="font-headline italic text-2xl text-on-surface mb-4">10. Termination</h2>
            <p>
              You may stop using the Platform at any time and request deletion of your account by emailing the
              address below. We may terminate or suspend access at any time for any reason, including violation
              of these Terms. Sections that by their nature should survive termination (license you granted us
              for already-shared content, limitations of liability, indemnification, governing law) will survive.
            </p>
          </section>

          <section>
            <h2 className="font-headline italic text-2xl text-on-surface mb-4">11. Changes to these Terms</h2>
            <p>
              We may revise these Terms from time to time. The &quot;last updated&quot; date above reflects the most
              recent revision. Continued use after a revision is deemed acceptance.
            </p>
          </section>

          <section>
            <h2 className="font-headline italic text-2xl text-on-surface mb-4">12. Governing law & disputes</h2>
            <p>
              These Terms are governed by the laws of the operator&apos;s country of residence, without regard to
              conflict-of-law principles. Any dispute will be resolved in the competent courts of that
              jurisdiction. If any provision is held unenforceable, the remainder remains in effect.
            </p>
          </section>

          <section>
            <h2 className="font-headline italic text-2xl text-on-surface mb-4">13. Contact</h2>
            <p>
              Questions, complaints, deletion requests, IP claims, or anything else:{' '}
              <a className="text-primary no-underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
