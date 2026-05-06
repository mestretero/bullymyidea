# BullyMyIdea

Founders submit ideas. The community delivers brutal, opinionated critique.
Brutalist editorial Next.js 14 + Supabase platform.

## Stack

- **Next.js 14** App Router, server components, Edge middleware
- **Supabase** — Postgres + Auth + Storage (RLS fully locked, service-role only via server)
- **Tailwind CSS** — brutalist editorial design tokens
- **sharp** — server-side image pipeline (resize, EXIF strip, WebP encode)
- **sonner** — toasts
- **date-fns** — relative time

## Local development

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env.local
# Fill in Supabase credentials + RATE_LIMIT_SALT + NEXT_PUBLIC_SITE_URL

# 3. Run migrations
# Open Supabase SQL editor and run files under supabase/migrations/ in order.
# Latest migration: 022_fix_profiles_trigger_rls.sql

# 4. Dev server
npm run dev
```

## Production deploy (Vercel)

1. Push to GitHub.
2. Import the repo in Vercel — framework auto-detects as Next.js.
3. Add environment variables in **Project Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` *(server-only — NOT prefixed with NEXT_PUBLIC_)*
   - `NEXT_PUBLIC_SITE_URL` *(your custom domain, e.g. https://bullymyidea.com)*
   - `RATE_LIMIT_SALT` *(any 32+ char random string)*
4. Bind your custom domain.
5. In Supabase dashboard:
   - **Authentication → Settings**: enable *Confirm email*, set *Site URL* and *Redirect URLs* to your production domain.
   - **Authentication → SMTP**: configure Resend (or other SMTP) for email delivery.
   - **Authentication → Email Templates**: customise *Confirm signup* and *Reset password*.
   - Run all migrations under `supabase/migrations/` in order.

## Smoke test before public launch

- Sign up with a real email → confirmation arrives → click link
- Sign in, post an idea (with image + PDF), critique with another account
- Search filters (tag, category, sort)
- Bookmark an idea, view `/bookmarks`
- Visit `/admin` (admin account) → audit log records actions
- Two-factor auth enroll + login challenge
- Forgot password flow
- OG preview via Twitter Card Validator
- Account deletion (test account)

## Resetting data

`supabase/WIPE_DATA.sql` truncates all user data and keeps a single admin
account. Run from Supabase SQL editor when you want a clean slate.

## Security model

- RLS enabled with no permissive policies on app tables — only the
  service role (used server-side from `lib/supabase/admin.ts`) bypasses.
- All storage uploads go through `/api/upload` (magic-byte sniff + sharp
  re-encode). Direct Storage REST inserts from clients are blocked.
- Per-request CSP nonce via `middleware.ts`. No `unsafe-inline` in prod.
- Rate-limit table with HMAC-SHA256 hash of identifiers. Salt required
  in production.
- Admin destructive actions logged in `admin_audit_log` (migration 021).
- 2FA (TOTP) supported via Supabase MFA.

## License

Private — all rights reserved.
