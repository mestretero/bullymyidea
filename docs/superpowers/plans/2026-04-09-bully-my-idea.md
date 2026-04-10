# Bully My Idea — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dark, minimal web platform where anyone can share ideas and receive structured honest feedback ("bully") anonymously or as a registered user.

**Architecture:** Next.js 14 App Router with server components for SSR, API routes for mutations, and Supabase for PostgreSQL + anonymous auth + realtime. Anonymous sessions are created automatically on first visit via `signInAnonymously()` and upgraded to full accounts via `linkIdentity()` on registration — preserving all prior content.

**Tech Stack:** Next.js 14 (App Router), Supabase JS v2, TypeScript, Tailwind CSS, Vitest + React Testing Library

---

## File Structure

```
bully-my-idea/
├── app/
│   ├── layout.tsx                    # Root layout: fonts, Navbar, anonymous session init
│   ├── page.tsx                      # Home: SSR idea feed + category filter
│   ├── submit/
│   │   └── page.tsx                  # Submit idea form
│   ├── idea/
│   │   └── [id]/
│   │       └── page.tsx              # Idea detail + feedback list + FeedbackForm
│   ├── categories/
│   │   └── page.tsx                  # Category index page
│   ├── profile/
│   │   └── [id]/
│   │       └── page.tsx              # Public user profile + their ideas
│   ├── my-ideas/
│   │   └── page.tsx                  # Registered user's idea list (auth-gated)
│   ├── auth/
│   │   └── page.tsx                  # Sign in / Sign up page
│   └── api/
│       ├── ideas/
│       │   └── route.ts              # POST: create idea
│       ├── feedbacks/
│       │   └── route.ts              # POST: create feedback (rate-limited)
│       ├── votes/
│       │   └── route.ts              # POST: toggle vote on feedback
│       └── reports/
│           └── route.ts              # POST: submit report
├── components/
│   ├── Navbar.tsx                    # Top nav: logo, auth state, "+ Paylaş" CTA
│   ├── IdeaCard.tsx                  # Single idea card for feed
│   ├── CategoryFilter.tsx            # Horizontal chip filter bar
│   ├── FeedbackCard.tsx              # Single feedback: strengths/weaknesses/suggestions
│   ├── FeedbackList.tsx              # Paginated feedback list with "Daha fazla yükle"
│   ├── FeedbackForm.tsx              # "Bully Et" inline form (3 textareas)
│   ├── VoteButtons.tsx               # Up/down vote buttons for a feedback
│   └── ReportButton.tsx              # "Şikayet Et" button
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser Supabase client (singleton)
│   │   └── server.ts                 # Server Supabase client (per-request cookies)
│   ├── rate-limit.ts                 # checkRateLimit(ip, action) → boolean
│   └── categories.ts                 # CATEGORIES array + CategoryMeta type
├── supabase/
│   └── migrations/
│       ├── 001_schema.sql            # All tables + constraints + indexes
│       └── 002_rls.sql               # Row-Level Security policies
├── types/
│   └── index.ts                      # Idea, Feedback, Vote, Report TypeScript types
├── middleware.ts                      # Refresh Supabase auth session on every request
├── vitest.config.ts
├── vitest.setup.ts
└── .env.local.example
```

---

## Chunk 1: Project Bootstrap + DB Schema

### Task 1: Initialize Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`
- Create: `.env.local.example`
- Create: `vitest.config.ts`, `vitest.setup.ts`

- [ ] **Step 1: Scaffold project**

```bash
cd e:/PROJELER/bully-my-idea
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

Expected: Next.js 14 project created with TypeScript + Tailwind + App Router.

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

Create `vitest.setup.ts`:

```ts
import '@testing-library/jest-dom'
```

Add to `package.json` scripts:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 4: Create env example**

Create `.env.local.example`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

- [ ] **Step 5: Run tests (should pass with 0 tests)**

```bash
npm run test:run
```

Expected: `Test Files 0 passed`, no errors.

- [ ] **Step 6: Commit**

```bash
git init
git add .
git commit -m "feat: initialize Next.js 14 project with Supabase and Vitest"
```

---

### Task 2: Define TypeScript types

**Files:**
- Create: `types/index.ts`
- Create: `lib/categories.ts`

- [ ] **Step 1: Write type tests**

Create `types/index.test.ts`:

```ts
import { describe, it, expectTypeOf } from 'vitest'
import type { Idea, Feedback, Vote, Report } from './index'

describe('types', () => {
  it('Idea has required fields', () => {
    expectTypeOf<Idea>().toHaveProperty('id')
    expectTypeOf<Idea>().toHaveProperty('title')
    expectTypeOf<Idea>().toHaveProperty('category')
    expectTypeOf<Idea>().toHaveProperty('status')
  })

  it('Feedback has three content fields', () => {
    expectTypeOf<Feedback>().toHaveProperty('strengths')
    expectTypeOf<Feedback>().toHaveProperty('weaknesses')
    expectTypeOf<Feedback>().toHaveProperty('suggestions')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- types/index.test.ts
```

Expected: FAIL — `types/index` not found.

- [ ] **Step 3: Create types**

Create `types/index.ts`:

```ts
export type IdeaStatus = 'active' | 'archived'
export type VoteType = 'up' | 'down'
export type Category =
  | 'teknoloji' | 'sanat' | 'iş' | 'sosyal'
  | 'eğitim' | 'sağlık' | 'eğlence' | 'diğer'

export interface Idea {
  id: string
  title: string
  description: string
  category: Category
  tags: string[]
  user_id: string | null
  created_at: string
  status: IdeaStatus
  feedback_count?: number
}

export interface Feedback {
  id: string
  idea_id: string
  strengths: string
  weaknesses: string
  suggestions: string
  user_id: string | null
  created_at: string
  vote_counts?: { up: number; down: number }
  user_vote?: VoteType | null
}

export interface Vote {
  id: string
  feedback_id: string
  vote_type: VoteType
  user_id: string | null
  created_at: string
}

export interface Report {
  id: string
  idea_id: string | null
  feedback_id: string | null
  reporter_ip_hash: string
  reason: string
  created_at: string
}
```

- [ ] **Step 4: Create categories constant**

Create `lib/categories.ts`:

```ts
import type { Category } from '@/types'

export interface CategoryMeta {
  value: Category
  label: string
  color: string
  bg: string
}

export const CATEGORIES: CategoryMeta[] = [
  { value: 'teknoloji', label: 'Teknoloji', color: '#63b3ed', bg: 'rgba(99,179,237,.1)' },
  { value: 'sanat',     label: 'Sanat',     color: '#b794f4', bg: 'rgba(183,148,244,.1)' },
  { value: 'iş',        label: 'İş',        color: '#f6ad55', bg: 'rgba(246,173,85,.1)' },
  { value: 'sosyal',    label: 'Sosyal',    color: '#68d391', bg: 'rgba(104,211,145,.1)' },
  { value: 'eğitim',   label: 'Eğitim',   color: '#76e4f7', bg: 'rgba(118,228,247,.1)' },
  { value: 'sağlık',   label: 'Sağlık',   color: '#fc8181', bg: 'rgba(252,129,129,.1)' },
  { value: 'eğlence',  label: 'Eğlence',  color: '#f687b3', bg: 'rgba(246,135,179,.1)' },
  { value: 'diğer',    label: 'Diğer',    color: '#a0aec0', bg: 'rgba(160,174,192,.1)' },
]

export const CATEGORY_VALUES = CATEGORIES.map(c => c.value)

export function getCategoryMeta(value: Category): CategoryMeta {
  return CATEGORIES.find(c => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1]
}
```

- [ ] **Step 5: Run tests**

```bash
npm run test:run -- types/index.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add types/ lib/categories.ts
git commit -m "feat: add TypeScript types and category constants"
```

---

### Task 3: Supabase DB schema migration

**Files:**
- Create: `supabase/migrations/001_schema.sql`
- Create: `supabase/migrations/002_rls.sql`

- [ ] **Step 1: Create Supabase project**

Go to https://supabase.com → New project. Copy `Project URL` and `anon key` into `.env.local` (copy from `.env.local.example`).

- [ ] **Step 2: Write schema migration**

Create `supabase/migrations/001_schema.sql`:

```sql
-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ideas table
create table ideas (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null,
  category    text not null check (category in (
    'teknoloji','sanat','iş','sosyal','eğitim','sağlık','eğlence','diğer'
  )),
  tags        text[] not null default '{}',
  user_id     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  status      text not null default 'active' check (status in ('active','archived'))
);

create index ideas_created_at_idx on ideas(created_at desc);
create index ideas_category_idx on ideas(category);
create index ideas_status_idx on ideas(status);

-- feedbacks table
create table feedbacks (
  id          uuid primary key default gen_random_uuid(),
  idea_id     uuid not null references ideas(id) on delete cascade,
  strengths   text not null default '',
  weaknesses  text not null default '',
  suggestions text not null default '',
  user_id     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index feedbacks_idea_id_idx on feedbacks(idea_id);
create index feedbacks_created_at_idx on feedbacks(created_at desc);

-- votes table
create table votes (
  id          uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references feedbacks(id) on delete cascade,
  vote_type   text not null check (vote_type in ('up','down')),
  user_id     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (feedback_id, user_id)
);

-- reports table
create table reports (
  id               uuid primary key default gen_random_uuid(),
  idea_id          uuid references ideas(id) on delete set null,
  feedback_id      uuid references feedbacks(id) on delete set null,
  reporter_ip_hash text not null,
  reason           text not null default '',
  created_at       timestamptz not null default now(),
  constraint reports_target_check check (
    (idea_id is not null)::int + (feedback_id is not null)::int = 1
  )
);

-- rate_limits table (for anonymous spam protection)
create table rate_limits (
  id           uuid primary key default gen_random_uuid(),
  ip_hash      text not null,
  action       text not null,
  count        int not null default 1,
  window_start timestamptz not null default now(),
  unique (ip_hash, action, window_start)
);

create index rate_limits_lookup_idx on rate_limits(ip_hash, action, window_start);

-- profiles table (extended user info for registered users)
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique,
  created_at timestamptz not null default now()
);
```

- [ ] **Step 3: Write RLS policies**

Create `supabase/migrations/002_rls.sql`:

```sql
-- Enable RLS on all tables
alter table ideas enable row level security;
alter table feedbacks enable row level security;
alter table votes enable row level security;
alter table reports enable row level security;
alter table rate_limits enable row level security;
alter table profiles enable row level security;

-- IDEAS: anyone can read active ideas
create policy "ideas_select" on ideas
  for select using (status = 'active');

-- IDEAS: any authenticated user (incl. anon) can insert
create policy "ideas_insert" on ideas
  for insert with check (auth.uid() is not null);

-- IDEAS: owner can archive their own idea
create policy "ideas_update_own" on ideas
  for update using (auth.uid() = user_id)
  with check (status = 'archived');

-- FEEDBACKS: anyone can read feedbacks on active ideas
create policy "feedbacks_select" on feedbacks
  for select using (
    exists (select 1 from ideas where id = feedbacks.idea_id and status = 'active')
  );

-- FEEDBACKS: any authenticated user can insert
create policy "feedbacks_insert" on feedbacks
  for insert with check (auth.uid() is not null);

-- VOTES: anyone can read votes
create policy "votes_select" on votes for select using (true);

-- VOTES: any authenticated user can insert/delete their own vote
create policy "votes_insert" on votes
  for insert with check (auth.uid() is not null);

create policy "votes_delete_own" on votes
  for delete using (auth.uid() = user_id);

-- REPORTS: insert only
create policy "reports_insert" on reports
  for insert with check (true);

-- RATE_LIMITS: service role only (bypassed by API routes using service key)
-- No public policies — all access via server-side API routes

-- PROFILES: public read, own write
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);
```

- [ ] **Step 4: Apply migrations in Supabase dashboard**

Go to Supabase → SQL Editor → paste and run `001_schema.sql`, then `002_rls.sql`.

- [ ] **Step 5: Commit**

```bash
git add supabase/
git commit -m "feat: add database schema and RLS policies"
```

---

### Task 4: Supabase client setup + rate-limit helper

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/rate-limit.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Write rate-limit tests**

Create `lib/rate-limit.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

import { checkRateLimit } from './rate-limit'
import { createServerClient } from '@/lib/supabase/server'

describe('checkRateLimit', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns true (allowed) when under limit', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ data: [{ count: 2 }], error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const result = await checkRateLimit('1.2.3.4', 'feedback', 3)
    expect(result).toBe(true)
  })

  it('returns false (blocked) when at or over limit', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ data: [{ count: 3 }], error: null }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const result = await checkRateLimit('1.2.3.4', 'feedback', 3)
    expect(result).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- lib/rate-limit.test.ts
```

Expected: FAIL — `rate-limit` not found.

- [ ] **Step 3: Create Supabase clients**

Create `lib/supabase/client.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Create `lib/supabase/server.ts`:

```ts
import { createServerClient as createSSRClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerClient() {
  const cookieStore = cookies()
  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

- [ ] **Step 4: Create rate-limit helper**

Create `lib/rate-limit.ts`:

```ts
import { createServerClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

export function hashIP(ip: string): string {
  return createHash('sha256').update(ip + process.env.RATE_LIMIT_SALT ?? 'bully').digest('hex').slice(0, 16)
}

/**
 * Returns true if the request is within rate limit, false if blocked.
 * Window: 24 hours from first action.
 */
export async function checkRateLimit(
  ip: string,
  action: string,
  maxPerDay: number
): Promise<boolean> {
  const supabase = createServerClient()
  const ipHash = hashIP(ip)
  const windowStart = new Date()
  windowStart.setHours(0, 0, 0, 0) // start of today UTC

  const { data, error } = await supabase
    .from('rate_limits')
    .select('count')
    .eq('ip_hash', ipHash)
    .eq('action', action)
    .gte('window_start', windowStart.toISOString())

  if (error) return true // fail open

  const total = data?.reduce((sum, row) => sum + (row.count ?? 0), 0) ?? 0
  if (total >= maxPerDay) return false

  // Increment counter
  await supabase.from('rate_limits').upsert(
    { ip_hash: ipHash, action, count: total + 1, window_start: windowStart.toISOString() },
    { onConflict: 'ip_hash,action,window_start', ignoreDuplicates: false }
  )

  return true
}
```

- [ ] **Step 5: Create middleware**

Create `middleware.ts`:

```ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  await supabase.auth.getUser()
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 6: Run tests**

```bash
npm run test:run -- lib/rate-limit.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/ middleware.ts
git commit -m "feat: add Supabase clients, middleware, and rate-limit helper"
```

---

## Chunk 2: Auth System

### Task 5: Anonymous session initialization

**Files:**
- Create: `app/layout.tsx` (replace default)
- Create: `components/Navbar.tsx`

- [ ] **Step 1: Write Navbar test**

Create `components/Navbar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) }
  }))
}))

import Navbar from './Navbar'

describe('Navbar', () => {
  it('renders logo', () => {
    render(<Navbar />)
    expect(screen.getByText(/bully/i)).toBeInTheDocument()
  })

  it('shows Giriş and Paylaş buttons when not logged in', () => {
    render(<Navbar />)
    expect(screen.getByText('Giriş')).toBeInTheDocument()
    expect(screen.getByText('+ Paylaş')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- components/Navbar.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Create Navbar component**

Create `components/Navbar.tsx`:

```tsx
'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Session } from '@supabase/supabase-js'

export default function Navbar() {
  const [session, setSession] = useState<Session | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  return (
    <nav style={{
      padding: '20px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #1a1a1a',
    }}>
      <Link href="/" style={{ fontWeight: 700, fontSize: 15, color: '#fff', textDecoration: 'none', letterSpacing: '-.02em' }}>
        bully <span style={{ color: '#ff3b5c' }}>my idea</span>
      </Link>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {session?.user?.is_anonymous === false ? (
          <>
            <Link href="/my-ideas" style={{ fontSize: 12, color: '#666', textDecoration: 'none' }}>Fikirlerim</Link>
            <Link href="/profile/me" style={{ fontSize: 12, color: '#666', textDecoration: 'none' }}>Profil</Link>
          </>
        ) : (
          <Link href="/auth" style={{ fontSize: 12, color: '#666', textDecoration: 'none' }}>Giriş</Link>
        )}
        <Link href="/submit" style={{
          fontSize: 12, background: '#ff3b5c', color: '#fff',
          borderRadius: 8, padding: '6px 14px', fontWeight: 600, textDecoration: 'none'
        }}>
          + Paylaş
        </Link>
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Create root layout with anonymous session init**

Replace `app/layout.tsx`:

```tsx
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
```

Create `components/AnonSessionInit.tsx`:

```tsx
'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// Silently creates an anonymous Supabase session on first visit if none exists.
export default function AnonSessionInit() {
  const supabase = createClient()
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        supabase.auth.signInAnonymously()
      }
    })
  }, [])
  return null
}
```

- [ ] **Step 5: Run tests**

```bash
npm run test:run -- components/Navbar.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/layout.tsx components/
git commit -m "feat: add root layout with anonymous session init and Navbar"
```

---

### Task 6: Auth page (sign in / sign up + identity linking)

**Files:**
- Create: `app/auth/page.tsx`
- Create: `app/api/auth/callback/route.ts`

- [ ] **Step 1: Create auth callback route**

Create `app/api/auth/callback/route.ts`:

```ts
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createServerClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/`)
}
```

- [ ] **Step 2: Create auth page**

Create `app/auth/page.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === 'signup') {
      // Check if we have an anonymous session to upgrade
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.is_anonymous) {
        // Link email identity to anonymous account — preserves all content
        const { error: linkError } = await supabase.auth.updateUser({ email, password })
        if (linkError) { setError(linkError.message); setLoading(false); return }
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) { setError(signUpError.message); setLoading(false); return }
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) { setError(signInError.message); setLoading(false); return }
    }

    setLoading(false)
    router.push('/')
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, letterSpacing: '-.02em' }}>
        {mode === 'signin' ? 'Giriş Yap' : 'Kayıt Ol'}
      </h1>
      <p style={{ fontSize: 13, color: '#555', marginBottom: 32 }}>
        {mode === 'signup' ? 'Anonim yorumların profiline bağlanacak.' : ''}
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email" placeholder="E-posta" value={email} onChange={e => setEmail(e.target.value)}
          required style={inputStyle}
        />
        <input
          type="password" placeholder="Şifre" value={password} onChange={e => setPassword(e.target.value)}
          required style={inputStyle}
        />
        {error && <p style={{ fontSize: 12, color: '#ff3b5c' }}>{error}</p>}
        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? '...' : mode === 'signin' ? 'Giriş Yap' : 'Kayıt Ol'}
        </button>
      </form>

      <button
        onClick={() => setMode(m => m === 'signin' ? 'signup' : 'signin')}
        style={{ marginTop: 16, fontSize: 12, color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        {mode === 'signin' ? 'Hesabın yok mu? Kayıt ol →' : 'Zaten hesabın var mı? Giriş yap →'}
      </button>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: '#141414', border: '1px solid #1e1e1e', borderRadius: 8,
  padding: '10px 14px', fontSize: 13, color: '#e0e0e0', outline: 'none',
}
const btnStyle: React.CSSProperties = {
  background: '#ff3b5c', color: '#fff', border: 'none', borderRadius: 8,
  padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
}
```

- [ ] **Step 3: Verify app compiles**

```bash
npm run build
```

Expected: Build succeeds (or only type warnings, no errors).

- [ ] **Step 4: Commit**

```bash
git add app/auth/ app/api/auth/
git commit -m "feat: add auth page with anonymous-to-registered identity linking"
```

---

## Chunk 3: Idea Feed (Home Page)

### Task 7: IdeaCard + CategoryFilter components

**Files:**
- Create: `components/IdeaCard.tsx`
- Create: `components/CategoryFilter.tsx`

- [ ] **Step 1: Write IdeaCard test**

Create `components/IdeaCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import IdeaCard from './IdeaCard'
import type { Idea } from '@/types'

const mockIdea: Idea = {
  id: 'abc-123',
  title: 'Test fikri',
  description: 'Açıklama burada.',
  category: 'teknoloji',
  tags: ['ai', 'test'],
  user_id: null,
  created_at: new Date().toISOString(),
  status: 'active',
  feedback_count: 5,
}

describe('IdeaCard', () => {
  it('renders title', () => {
    render(<IdeaCard idea={mockIdea} />)
    expect(screen.getByText('Test fikri')).toBeInTheDocument()
  })

  it('renders feedback count', () => {
    render(<IdeaCard idea={mockIdea} />)
    expect(screen.getByText(/5 bully/i)).toBeInTheDocument()
  })

  it('renders category badge', () => {
    render(<IdeaCard idea={mockIdea} />)
    expect(screen.getByText(/teknoloji/i)).toBeInTheDocument()
  })

  it('renders tags', () => {
    render(<IdeaCard idea={mockIdea} />)
    expect(screen.getByText(/#ai/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- components/IdeaCard.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Create IdeaCard**

Create `components/IdeaCard.tsx`:

```tsx
import Link from 'next/link'
import type { Idea } from '@/types'
import { getCategoryMeta } from '@/lib/categories'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Props { idea: Idea }

export default function IdeaCard({ idea }: Props) {
  const cat = getCategoryMeta(idea.category)
  const timeAgo = formatDistanceToNow(new Date(idea.created_at), { addSuffix: true, locale: tr })

  return (
    <Link href={`/idea/${idea.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#141414', border: '1px solid #1e1e1e', borderRadius: 12,
        padding: 16, cursor: 'pointer', transition: 'border-color .15s',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 100,
            background: cat.bg, color: cat.color, fontWeight: 500,
          }}>
            {cat.label}
          </span>
          <span style={{ fontSize: 11, color: '#2a2a2a' }}>{timeAgo}</span>
        </div>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e8e8e8', margin: '0 0 6px', lineHeight: 1.4 }}>
          {idea.title}
        </h3>
        <p style={{ fontSize: 12, color: '#555', margin: '0 0 10px', lineHeight: 1.5,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {idea.description}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: '#ff3b5c', fontWeight: 500 }}>
            {idea.feedback_count ?? 0} bully
          </span>
          <span style={{ fontSize: 11, color: '#333' }}>
            {idea.tags.slice(0, 3).map(t => `#${t}`).join(' ')}
          </span>
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: Install date-fns**

```bash
npm install date-fns
```

- [ ] **Step 5: Create CategoryFilter**

Create `components/CategoryFilter.tsx`:

```tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { CATEGORIES } from '@/lib/categories'

export default function CategoryFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get('category') ?? 'all'

  function setCategory(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') params.delete('category')
    else params.set('category', value)
    router.push(`/?${params.toString()}`)
  }

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '0 0 20px' }}>
      {[{ value: 'all', label: 'Tümü' }, ...CATEGORIES].map(cat => (
        <button
          key={cat.value}
          onClick={() => setCategory(cat.value)}
          style={{
            fontSize: 12, padding: '4px 12px', borderRadius: 100, border: '1px solid',
            cursor: 'pointer', background: 'none',
            borderColor: active === cat.value ? '#ff3b5c' : '#1e1e1e',
            color: active === cat.value ? '#ff3b5c' : '#666',
          }}
        >
          {cat.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 6: Run IdeaCard tests**

```bash
npm run test:run -- components/IdeaCard.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/IdeaCard.tsx components/CategoryFilter.tsx components/IdeaCard.test.tsx
git commit -m "feat: add IdeaCard and CategoryFilter components"
```

---

### Task 8: Home page (SSR idea feed)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Write home page data-fetch test**

Create `app/page.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'

// Test the data-fetching logic, not the SSR component itself
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

import { buildIdeasQuery } from './page'
import { createServerClient } from '@/lib/supabase/server'

describe('buildIdeasQuery', () => {
  it('filters by category when provided', () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    }
    const mockSupabase = { from: vi.fn().mockReturnValue(mockQuery) }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    buildIdeasQuery('teknoloji')
    expect(mockQuery.eq).toHaveBeenCalledWith('category', 'teknoloji')
  })

  it('does not filter when category is undefined', () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    }
    const mockSupabase = { from: vi.fn().mockReturnValue(mockQuery) }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    buildIdeasQuery(undefined)
    expect(mockQuery.eq).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- app/page.test.tsx
```

Expected: FAIL — `buildIdeasQuery` not exported.

- [ ] **Step 3: Create home page**

Replace `app/page.tsx`:

```tsx
import { createServerClient } from '@/lib/supabase/server'
import IdeaCard from '@/components/IdeaCard'
import CategoryFilter from '@/components/CategoryFilter'
import type { Idea } from '@/types'
import type { Category } from '@/types'
import { Suspense } from 'react'

// Exported for testing
export function buildIdeasQuery(category: string | undefined) {
  const supabase = createServerClient()
  let query = supabase
    .from('ideas')
    .select('*, feedback_count:feedbacks(count)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20)

  if (category) {
    query = query.eq('category', category as Category)
  }

  return query
}

async function IdeaFeed({ category }: { category: string | undefined }) {
  const { data: ideas, error } = await buildIdeasQuery(category)

  if (error) return <p style={{ color: '#555', padding: '40px 0' }}>Fikirler yüklenemedi.</p>
  if (!ideas?.length) return <p style={{ color: '#555', padding: '40px 0' }}>Henüz fikir yok.</p>

  // Flatten feedback count from joined aggregate
  const normalized: Idea[] = ideas.map((idea: any) => ({
    ...idea,
    feedback_count: idea.feedback_count?.[0]?.count ?? 0,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {normalized.map(idea => <IdeaCard key={idea.id} idea={idea} />)}
    </div>
  )
}

interface Props {
  searchParams: { category?: string }
}

export default function HomePage({ searchParams }: Props) {
  return (
    <div style={{ paddingTop: 32 }}>
      <Suspense>
        <CategoryFilter />
      </Suspense>
      <Suspense fallback={<p style={{ color: '#555' }}>Yükleniyor...</p>}>
        <IdeaFeed category={searchParams.category} />
      </Suspense>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run -- app/page.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/page.test.tsx
git commit -m "feat: add SSR home page with idea feed and category filter"
```

---

## Chunk 4: Idea Submission + Detail Page

### Task 9: POST /api/ideas route

**Files:**
- Create: `app/api/ideas/route.ts`

- [ ] **Step 1: Write API route test**

Create `app/api/ideas/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

import { createServerClient } from '@/lib/supabase/server'

function makeRequest(body: object) {
  return new Request('http://localhost/api/ideas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/ideas', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 400 when title is missing', async () => {
    const req = makeRequest({ description: 'test', category: 'teknoloji' })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 201 on valid input', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'uid-1' } } }) },
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'idea-1', title: 'Test' }, error: null }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const req = makeRequest({ title: 'Test', description: 'Desc', category: 'teknoloji', tags: [] })
    const res = await POST(req as any)
    expect(res.status).toBe(201)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- app/api/ideas/route.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Create API route**

Create `app/api/ideas/route.ts`:

```ts
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { CATEGORY_VALUES } from '@/lib/categories'

export async function POST(request: Request) {
  const body = await request.json()
  const { title, description, category, tags = [] } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Başlık gerekli' }, { status: 400 })
  if (!description?.trim()) return NextResponse.json({ error: 'Açıklama gerekli' }, { status: 400 })
  if (!CATEGORY_VALUES.includes(category)) return NextResponse.json({ error: 'Geçersiz kategori' }, { status: 400 })

  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Oturum açılmamış' }, { status: 401 })

  const normalizedTags = (tags as string[])
    .map(t => t.trim().toLowerCase().replace(/[^a-z0-9ğüşıöçğüşıöç]/gi, ''))
    .filter(Boolean)
    .slice(0, 5)

  const { data, error } = await supabase
    .from('ideas')
    .insert({ title: title.trim(), description: description.trim(), category, tags: normalizedTags, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run -- app/api/ideas/route.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/ideas/
git commit -m "feat: add POST /api/ideas route with validation"
```

---

### Task 10: Submit idea page

**Files:**
- Create: `app/submit/page.tsx`
- Test: `app/submit/page.test.tsx`

- [ ] **Step 1: Write submit page test**

Create `app/submit/page.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

global.fetch = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

import SubmitPage from './page'

describe('SubmitPage', () => {
  it('renders title and description fields', () => {
    render(<SubmitPage />)
    expect(screen.getByPlaceholderText(/fikrin kısa adı/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/fikrin ne/i)).toBeInTheDocument()
  })

  it('renders category select', () => {
    render(<SubmitPage />)
    expect(screen.getByText('Teknoloji')).toBeInTheDocument()
  })

  it('calls POST /api/ideas on submit', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'idea-1' }) } as any)
    render(<SubmitPage />)

    fireEvent.change(screen.getByPlaceholderText(/fikrin kısa adı/i), { target: { value: 'Test Fikri' } })
    fireEvent.change(screen.getByPlaceholderText(/fikrin ne/i), { target: { value: 'Açıklama buraya' } })
    fireEvent.click(screen.getByText(/paylaş/i))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/ideas', expect.objectContaining({ method: 'POST' }))
    })
  })

  it('shows error message on failed submit', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Başlık gerekli' }) } as any)
    render(<SubmitPage />)
    fireEvent.click(screen.getByText(/paylaş/i))
    await waitFor(() => expect(screen.getByText('Başlık gerekli')).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- app/submit/page.test.tsx
```

Expected: FAIL — `SubmitPage` not found.

- [ ] **Step 3: Create submit page**

Create `app/submit/page.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES } from '@/lib/categories'

export default function SubmitPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('teknoloji')
  const [tags, setTags] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)

    const res = await fetch('/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, category, tags: tagList }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Bir hata oluştu')
      setLoading(false)
      return
    }

    router.push(`/idea/${data.id}`)
  }

  return (
    <div style={{ maxWidth: 600, margin: '48px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, letterSpacing: '-.02em' }}>
        Fikrini Paylaş
      </h1>
      <p style={{ fontSize: 13, color: '#555', marginBottom: 32 }}>
        Topluluk seni parçalasın. İyi şanslar.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Başlık</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required
            placeholder="Fikrin kısa adı..." style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Açıklama</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} required
            placeholder="Fikrin ne? Problem ne? Nasıl çalışıyor?"
            style={{ ...inputStyle, height: 120, resize: 'vertical' }} />
        </div>
        <div>
          <label style={labelStyle}>Kategori</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Etiketler (virgülle ayır)</label>
          <input value={tags} onChange={e => setTags(e.target.value)}
            placeholder="ai, saas, b2b" style={inputStyle} />
        </div>
        {error && <p style={{ fontSize: 12, color: '#ff3b5c' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{
          background: '#ff3b5c', color: '#fff', border: 'none', borderRadius: 8,
          padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          {loading ? '...' : 'Paylaş ve Bully'e Aç'}
        </button>
      </form>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  letterSpacing: '.06em', textTransform: 'uppercase', color: '#666', marginBottom: 6,
}
const inputStyle: React.CSSProperties = {
  width: '100%', background: '#141414', border: '1px solid #1e1e1e',
  borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#e0e0e0',
  outline: 'none', fontFamily: 'inherit',
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run -- app/submit/page.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/submit/
git commit -m "feat: add submit idea page"
```

---

### Task 11: Idea detail page + FeedbackCard + FeedbackList

**Files:**
- Create: `components/FeedbackCard.tsx`
- Create: `components/FeedbackList.tsx`
- Create: `app/idea/[id]/page.tsx`

- [ ] **Step 1: Write FeedbackCard test**

Create `components/FeedbackCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import FeedbackCard from './FeedbackCard'
import type { Feedback } from '@/types'

const mockFeedback: Feedback = {
  id: 'fb-1', idea_id: 'idea-1',
  strengths: 'Pazar büyük', weaknesses: 'API kısıtlı', suggestions: 'Manuel upload ekle',
  user_id: null, created_at: new Date().toISOString(),
}

describe('FeedbackCard', () => {
  it('renders strengths', () => {
    render(<FeedbackCard feedback={mockFeedback} />)
    expect(screen.getByText('Pazar büyük')).toBeInTheDocument()
  })

  it('renders weaknesses', () => {
    render(<FeedbackCard feedback={mockFeedback} />)
    expect(screen.getByText('API kısıtlı')).toBeInTheDocument()
  })

  it('renders suggestions', () => {
    render(<FeedbackCard feedback={mockFeedback} />)
    expect(screen.getByText('Manuel upload ekle')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- components/FeedbackCard.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Create FeedbackCard**

Create `components/FeedbackCard.tsx`:

```tsx
import type { Feedback } from '@/types'
import VoteButtons from './VoteButtons'
import ReportButton from './ReportButton'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Props { feedback: Feedback }

export default function FeedbackCard({ feedback }: Props) {
  const timeAgo = formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true, locale: tr })

  return (
    <div style={{
      background: '#141414', border: '1px solid #1e1e1e',
      borderRadius: 12, padding: 16, marginBottom: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#444' }}>
          {feedback.user_id ? `@kullanıcı` : 'anonim'} · {timeAgo}
        </span>
        <ReportButton feedbackId={feedback.id} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: '#68d391', marginBottom: 5 }}>
            Güçlü
          </div>
          <p style={{ fontSize: 12, color: '#999', lineHeight: 1.6 }}>{feedback.strengths || '—'}</p>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: '#ff3b5c', marginBottom: 5 }}>
            Zayıf
          </div>
          <p style={{ fontSize: 12, color: '#999', lineHeight: 1.6 }}>{feedback.weaknesses || '—'}</p>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: '#f6ad55', marginBottom: 5 }}>
            Öneri
          </div>
          <p style={{ fontSize: 12, color: '#999', lineHeight: 1.6 }}>{feedback.suggestions || '—'}</p>
        </div>
      </div>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
        <VoteButtons feedbackId={feedback.id} voteCounts={feedback.vote_counts} userVote={feedback.user_vote} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create VoteButtons stub**

Create `components/VoteButtons.tsx`:

```tsx
'use client'
import type { VoteType } from '@/types'

interface Props {
  feedbackId: string
  voteCounts?: { up: number; down: number }
  userVote?: VoteType | null
}

export default function VoteButtons({ feedbackId, voteCounts, userVote }: Props) {
  async function vote(type: VoteType) {
    await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback_id: feedbackId, vote_type: type }),
    })
    window.location.reload()
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={() => vote('up')} style={{
        background: userVote === 'up' ? 'rgba(104,211,145,.15)' : 'none',
        border: '1px solid', borderColor: userVote === 'up' ? '#68d391' : '#2a2a2a',
        borderRadius: 6, padding: '3px 10px', fontSize: 11,
        color: userVote === 'up' ? '#68d391' : '#555', cursor: 'pointer',
      }}>
        ↑ {voteCounts?.up ?? 0}
      </button>
      <button onClick={() => vote('down')} style={{
        background: userVote === 'down' ? 'rgba(255,59,92,.1)' : 'none',
        border: '1px solid', borderColor: userVote === 'down' ? '#ff3b5c' : '#2a2a2a',
        borderRadius: 6, padding: '3px 10px', fontSize: 11,
        color: userVote === 'down' ? '#ff3b5c' : '#555', cursor: 'pointer',
      }}>
        ↓ {voteCounts?.down ?? 0}
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Create ReportButton stub**

Create `components/ReportButton.tsx`:

```tsx
'use client'

interface Props {
  ideaId?: string
  feedbackId?: string
}

export default function ReportButton({ ideaId, feedbackId }: Props) {
  async function report() {
    const reason = prompt('Şikayet sebebi:')
    if (!reason) return
    await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea_id: ideaId, feedback_id: feedbackId, reason }),
    })
    alert('Şikayetin alındı.')
  }

  return (
    <button onClick={report} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      fontSize: 10, color: '#2a2a2a',
    }}>
      Şikayet Et
    </button>
  )
}
```

- [ ] **Step 6: Create FeedbackList**

Create `components/FeedbackList.tsx`:

```tsx
'use client'
import { useState } from 'react'
import type { Feedback } from '@/types'
import FeedbackCard from './FeedbackCard'

interface Props {
  feedbacks: Feedback[]
  ideaId: string
  hasMore: boolean
}

export default function FeedbackList({ feedbacks: initial, ideaId, hasMore: initialHasMore }: Props) {
  const [feedbacks, setFeedbacks] = useState(initial)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)

  async function loadMore() {
    setLoading(true)
    const cursor = feedbacks[feedbacks.length - 1]?.created_at
    const res = await fetch(`/api/feedbacks?idea_id=${ideaId}&cursor=${cursor}`)
    const data = await res.json()
    setFeedbacks(prev => [...prev, ...data.feedbacks])
    setHasMore(data.has_more)
    setLoading(false)
  }

  if (!feedbacks.length) {
    return <p style={{ color: '#444', fontSize: 13, padding: '24px 0' }}>Henüz bully yok. İlk sen ol.</p>
  }

  return (
    <div>
      {feedbacks.map(fb => <FeedbackCard key={fb.id} feedback={fb} />)}
      {hasMore && (
        <button onClick={loadMore} disabled={loading} style={{
          background: 'none', border: '1px solid #1e1e1e', borderRadius: 8,
          padding: '10px 20px', color: '#555', fontSize: 12, cursor: 'pointer', width: '100%', marginTop: 8,
        }}>
          {loading ? '...' : 'Daha fazla yükle'}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Run FeedbackCard tests**

```bash
npm run test:run -- components/FeedbackCard.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add components/FeedbackCard.tsx components/FeedbackList.tsx components/VoteButtons.tsx components/ReportButton.tsx components/FeedbackCard.test.tsx
git commit -m "feat: add FeedbackCard, FeedbackList, VoteButtons, ReportButton components"
```

---

### Task 12: Idea detail page

**Files:**
- Create: `app/idea/[id]/page.tsx`

- [ ] **Step 1: Create idea detail page**

Create `app/idea/[id]/page.tsx`:

```tsx
import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getCategoryMeta } from '@/lib/categories'
import FeedbackList from '@/components/FeedbackList'
import FeedbackForm from '@/components/FeedbackForm'
import ReportButton from '@/components/ReportButton'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import type { Feedback } from '@/types'

const PAGE_SIZE = 10

interface Props { params: { id: string } }

export default async function IdeaDetailPage({ params }: Props) {
  const supabase = createServerClient()

  const { data: idea, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !idea) return notFound()
  if (idea.status === 'archived') {
    return (
      <div style={{ maxWidth: 700, margin: '80px auto', padding: '0 16px', textAlign: 'center', color: '#444' }}>
        Bu fikir kaldırıldı.
      </div>
    )
  }

  // Fetch feedbacks with vote counts aggregated
  const { data: feedbacksRaw } = await supabase
    .from('feedbacks')
    .select('*, votes(vote_type)')
    .eq('idea_id', params.id)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE + 1)

  // Compute vote counts from joined rows, then strip raw votes array
  const feedbacks: Feedback[] = (feedbacksRaw ?? []).map((fb: any) => {
    const votes: { vote_type: string }[] = fb.votes ?? []
    return {
      ...fb,
      votes: undefined,
      vote_counts: {
        up: votes.filter(v => v.vote_type === 'up').length,
        down: votes.filter(v => v.vote_type === 'down').length,
      },
    }
  })
  const hasMore = feedbacks.length > PAGE_SIZE
  const page = hasMore ? feedbacks.slice(0, PAGE_SIZE) : feedbacks

  const cat = getCategoryMeta(idea.category)
  const timeAgo = formatDistanceToNow(new Date(idea.created_at), { addSuffix: true, locale: tr })

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 16px' }}>
      {/* Idea header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 100,
            background: cat.bg, color: cat.color, fontWeight: 500,
          }}>{cat.label}</span>
          {idea.tags.map((t: string) => (
            <span key={t} style={{ fontSize: 11, color: '#333' }}>#{t}</span>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 12px', letterSpacing: '-.02em', lineHeight: 1.3 }}>
          {idea.title}
        </h1>
        <p style={{ fontSize: 14, color: '#777', lineHeight: 1.7, margin: '0 0 12px' }}>
          {idea.description}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#333' }}>
            {idea.user_id ? 'kayıtlı kullanıcı' : 'anonim'} · {timeAgo}
          </span>
          <ReportButton ideaId={idea.id} />
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: '#161616', margin: '24px 0' }} />

      {/* Feedback section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#ccc', margin: 0 }}>
            {feedbacks.length > PAGE_SIZE ? `${feedbacks.length - 1}+` : feedbacks.length} Geri Bildirim
          </h2>
        </div>

        <FeedbackForm ideaId={params.id} />

        <div style={{ marginTop: 20 }}>
          <FeedbackList feedbacks={page} ideaId={params.id} hasMore={hasMore} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/idea/
git commit -m "feat: add idea detail page with feedback list"
```

---

## Chunk 5: Feedback Form + API Routes

### Task 13: FeedbackForm component

**Files:**
- Create: `components/FeedbackForm.tsx`

- [ ] **Step 1: Write FeedbackForm test**

Create `components/FeedbackForm.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

global.fetch = vi.fn()

import FeedbackForm from './FeedbackForm'

describe('FeedbackForm', () => {
  it('renders three textareas', () => {
    render(<FeedbackForm ideaId="idea-1" />)
    expect(screen.getByPlaceholderText(/ne işe yarıyor/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/nerede çöküyor/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/nasıl kurtarırsın/i)).toBeInTheDocument()
  })

  it('renders Bully Et button', () => {
    render(<FeedbackForm ideaId="idea-1" />)
    expect(screen.getByText('Bully Et')).toBeInTheDocument()
  })

  it('calls POST /api/feedbacks on submit', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => ({}) } as any)
    render(<FeedbackForm ideaId="idea-1" />)

    fireEvent.change(screen.getByPlaceholderText(/ne işe yarıyor/i), { target: { value: 'Güçlü' } })
    fireEvent.click(screen.getByText('Bully Et'))

    expect(fetch).toHaveBeenCalledWith('/api/feedbacks', expect.objectContaining({ method: 'POST' }))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- components/FeedbackForm.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Create FeedbackForm**

Create `components/FeedbackForm.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props { ideaId: string }

export default function FeedbackForm({ ideaId }: Props) {
  const [strengths, setStrengths] = useState('')
  const [weaknesses, setWeaknesses] = useState('')
  const [suggestions, setSuggestions] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/feedbacks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea_id: ideaId, strengths, weaknesses, suggestions }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Gönderilemedi')
      return
    }

    setStrengths(''); setWeaknesses(''); setSuggestions('')
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        width: '100%', background: '#ff3b5c', color: '#fff', border: 'none',
        borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600,
        cursor: 'pointer', letterSpacing: '-.01em',
      }}>
        Bully Et
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: '#141414', border: '1px solid #1e1e1e',
      borderRadius: 12, overflow: 'hidden',
    }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#555' }}>Geri bildirim yaz</span>
        <button type="button" onClick={() => setOpen(false)}
          style={{ background: 'none', border: 'none', color: '#ff3b5c', fontSize: 12, cursor: 'pointer' }}>
          anonim olarak devam et →
        </button>
      </div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={labelStyle('güçlü')}>Güçlü Yanlar</label>
          <textarea value={strengths} onChange={e => setStrengths(e.target.value)}
            placeholder="Ne işe yarıyor?" style={taStyle} />
        </div>
        <div>
          <label style={labelStyle('zayıf')}>Zayıf Yanlar</label>
          <textarea value={weaknesses} onChange={e => setWeaknesses(e.target.value)}
            placeholder="Nerede çöküyor?" style={taStyle} />
        </div>
        <div>
          <label style={labelStyle('öneri')}>Öneri</label>
          <textarea value={suggestions} onChange={e => setSuggestions(e.target.value)}
            placeholder="Nasıl kurtarırsın?" style={taStyle} />
        </div>
        {error && <p style={{ fontSize: 12, color: '#ff3b5c', margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading} style={{
          background: '#ff3b5c', color: '#fff', border: 'none', borderRadius: 8,
          padding: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          {loading ? '...' : 'Gönder'}
        </button>
      </div>
    </form>
  )
}

function labelStyle(type: 'güçlü' | 'zayıf' | 'öneri'): React.CSSProperties {
  const colors = { güçlü: '#68d391', zayıf: '#ff3b5c', öneri: '#f6ad55' }
  return {
    display: 'block', fontSize: 10, fontWeight: 600,
    letterSpacing: '.06em', textTransform: 'uppercase',
    color: colors[type], marginBottom: 5,
  }
}

const taStyle: React.CSSProperties = {
  width: '100%', background: '#0f0f0f', border: '1px solid #1e1e1e',
  borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#aaa',
  resize: 'none', height: 52, fontFamily: 'inherit', outline: 'none',
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run -- components/FeedbackForm.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/FeedbackForm.tsx components/FeedbackForm.test.tsx
git commit -m "feat: add FeedbackForm component"
```

---

### Task 14: POST /api/feedbacks + GET for pagination

**Files:**
- Create: `app/api/feedbacks/route.ts`

- [ ] **Step 1: Write API test**

Create `app/api/feedbacks/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

vi.mock('@/lib/supabase/server', () => ({ createServerClient: vi.fn() }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: vi.fn().mockResolvedValue(true) }))

import { createServerClient } from '@/lib/supabase/server'

function makeRequest(body: object, ip = '1.2.3.4') {
  return new Request('http://localhost/api/feedbacks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  })
}

describe('POST /api/feedbacks', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 400 when idea_id missing', async () => {
    const req = makeRequest({ strengths: 'test' })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 201 on valid input', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'fb-1' }, error: null }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const req = makeRequest({ idea_id: 'idea-1', strengths: 'Good', weaknesses: 'Bad', suggestions: 'Fix' })
    const res = await POST(req as any)
    expect(res.status).toBe(201)
  })

  it('returns 429 when rate limited', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    vi.mocked(checkRateLimit).mockResolvedValueOnce(false)
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const req = makeRequest({ idea_id: 'idea-1', strengths: 'x', weaknesses: 'x', suggestions: 'x' })
    const res = await POST(req as any)
    expect(res.status).toBe(429)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- app/api/feedbacks/route.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Create feedbacks API route**

Create `app/api/feedbacks/route.ts`:

```ts
import { createServerClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { idea_id, strengths = '', weaknesses = '', suggestions = '' } = body

  if (!idea_id) return NextResponse.json({ error: 'idea_id gerekli' }, { status: 400 })
  if (!strengths.trim() && !weaknesses.trim() && !suggestions.trim()) {
    return NextResponse.json({ error: 'En az bir alan doldur' }, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
  const allowed = await checkRateLimit(ip, 'feedback', 3)
  if (!allowed) return NextResponse.json({ error: 'Günlük limit aşıldı (3/gün)' }, { status: 429 })

  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Oturum yok' }, { status: 401 })

  const { data, error } = await supabase
    .from('feedbacks')
    .insert({ idea_id, strengths, weaknesses, suggestions, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const idea_id = searchParams.get('idea_id')
  const cursor = searchParams.get('cursor')
  const PAGE_SIZE = 10

  if (!idea_id) return NextResponse.json({ error: 'idea_id gerekli' }, { status: 400 })

  const supabase = createServerClient()
  let query = supabase
    .from('feedbacks')
    .select('*')
    .eq('idea_id', idea_id)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE + 1)

  if (cursor) query = query.lt('created_at', cursor)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const hasMore = (data?.length ?? 0) > PAGE_SIZE
  return NextResponse.json({
    feedbacks: hasMore ? data!.slice(0, PAGE_SIZE) : data ?? [],
    has_more: hasMore,
  })
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run -- app/api/feedbacks/route.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/feedbacks/
git commit -m "feat: add POST+GET /api/feedbacks with rate limiting and cursor pagination"
```

---

## Chunk 6: Votes + Reports

### Task 15: POST /api/votes

**Files:**
- Create: `app/api/votes/route.ts`

- [ ] **Step 1: Write vote API test**

Create `app/api/votes/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

vi.mock('@/lib/supabase/server', () => ({ createServerClient: vi.fn() }))
import { createServerClient } from '@/lib/supabase/server'

function makeRequest(body: object) {
  return new Request('http://localhost/api/votes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/votes', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 400 when feedback_id missing', async () => {
    const req = makeRequest({ vote_type: 'up' })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid vote_type', async () => {
    const req = makeRequest({ feedback_id: 'fb-1', vote_type: 'sideways' })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 200 on valid vote', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const req = makeRequest({ feedback_id: 'fb-1', vote_type: 'up' })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- app/api/votes/route.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Create votes API route**

Create `app/api/votes/route.ts`:

```ts
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { feedback_id, vote_type } = body

  if (!feedback_id) return NextResponse.json({ error: 'feedback_id gerekli' }, { status: 400 })
  if (!['up', 'down'].includes(vote_type)) return NextResponse.json({ error: 'Geçersiz oy tipi' }, { status: 400 })

  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Oturum yok' }, { status: 401 })

  // Upsert: if same user votes same type again → delete (toggle), else insert/update
  const { data: existing } = await supabase
    .from('votes')
    .select('id, vote_type')
    .eq('feedback_id', feedback_id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    if (existing.vote_type === vote_type) {
      // Toggle off
      await supabase.from('votes').delete().eq('id', existing.id)
      return NextResponse.json({ action: 'removed' })
    } else {
      // Change vote
      const { error } = await supabase.from('votes').update({ vote_type }).eq('id', existing.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ action: 'changed' })
    }
  }

  const { error } = await supabase
    .from('votes')
    .insert({ feedback_id, vote_type, user_id: user.id })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ action: 'added' })
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run -- app/api/votes/route.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/votes/
git commit -m "feat: add POST /api/votes with toggle behavior"
```

---

### Task 16: POST /api/reports

**Files:**
- Create: `app/api/reports/route.ts`
- Test: `app/api/reports/route.test.ts`

- [ ] **Step 1: Write reports API test**

Create `app/api/reports/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

vi.mock('@/lib/supabase/server', () => ({ createServerClient: vi.fn() }))
import { createServerClient } from '@/lib/supabase/server'

function makeRequest(body: object) {
  return new Request('http://localhost/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/reports', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 400 when neither idea_id nor feedback_id provided', async () => {
    const req = makeRequest({ reason: 'spam' })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 400 when both idea_id and feedback_id provided', async () => {
    const req = makeRequest({ idea_id: 'i1', feedback_id: 'f1', reason: 'spam' })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 200 on valid idea report', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const req = makeRequest({ idea_id: 'idea-1', reason: 'uygunsuz içerik' })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- app/api/reports/route.test.ts
```

Expected: FAIL — `reports/route` not found.

- [ ] **Step 3: Create reports API route**

Create `app/api/reports/route.ts`:

```ts
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

export async function POST(request: Request) {
  const body = await request.json()
  const { idea_id, feedback_id, reason = '' } = body

  if (!idea_id && !feedback_id) {
    return NextResponse.json({ error: 'idea_id veya feedback_id gerekli' }, { status: 400 })
  }
  if (idea_id && feedback_id) {
    return NextResponse.json({ error: 'Sadece biri belirtilmeli' }, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const reporter_ip_hash = createHash('sha256').update(ip).digest('hex').slice(0, 16)

  const supabase = createServerClient()
  const { error } = await supabase
    .from('reports')
    .insert({ idea_id: idea_id ?? null, feedback_id: feedback_id ?? null, reporter_ip_hash, reason })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run -- app/api/reports/route.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/reports/
git commit -m "feat: add POST /api/reports"
```

---

## Chunk 7: Profiles + My Ideas + Categories Page

### Task 17: Profile page

**Files:**
- Create: `app/profile/[id]/page.tsx`
- Test: `app/profile/[id]/page.test.tsx`

- [ ] **Step 1: Write profile page data-fetch test**

Create `app/profile/[id]/page.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createServerClient: vi.fn() }))
import { createServerClient } from '@/lib/supabase/server'
import { buildProfileQuery } from './page'

describe('buildProfileQuery', () => {
  it('queries profiles by id', () => {
    const mockChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn() }
    const mockSupabase = { from: vi.fn().mockReturnValue(mockChain) }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    buildProfileQuery('user-123')
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'user-123')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- "app/profile/[id]/page.test.tsx"
```

Expected: FAIL — `buildProfileQuery` not exported.

- [ ] **Step 3: Create profile page**

Create `app/profile/[id]/page.tsx`:

```tsx
import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import IdeaCard from '@/components/IdeaCard'
import type { Idea } from '@/types'

interface Props { params: { id: string } }

// Exported for testing
export function buildProfileQuery(userId: string) {
  const supabase = createServerClient()
  return supabase.from('profiles').select('*').eq('id', userId).single()
}

export default async function ProfilePage({ params }: Props) {
  const supabase = createServerClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!profile) return notFound()

  const { data: ideas } = await supabase
    .from('ideas')
    .select('*, feedback_count:feedbacks(count)')
    .eq('user_id', params.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const normalized: Idea[] = (ideas ?? []).map((idea: any) => ({
    ...idea,
    feedback_count: idea.feedback_count?.[0]?.count ?? 0,
  }))

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 16px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-.02em' }}>
          {profile.username ?? 'Kullanıcı'}
        </h1>
        <p style={{ fontSize: 12, color: '#444', marginTop: 4 }}>
          {normalized.length} fikir
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {normalized.map(idea => <IdeaCard key={idea.id} idea={idea} />)}
      </div>
      {!normalized.length && (
        <p style={{ color: '#444', fontSize: 13 }}>Henüz fikir yok.</p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run -- "app/profile/[id]/page.test.tsx"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/profile/
git commit -m "feat: add public profile page"
```

---

### Task 18: My Ideas page (auth-gated)

**Files:**
- Create: `app/my-ideas/page.tsx`
- Test: `app/my-ideas/page.test.tsx`

- [ ] **Step 1: Write my-ideas auth-gate test**

Create `app/my-ideas/page.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'

const mockRedirect = vi.fn()
vi.mock('next/navigation', () => ({ redirect: mockRedirect }))
vi.mock('@/lib/supabase/server', () => ({ createServerClient: vi.fn() }))

import { createServerClient } from '@/lib/supabase/server'
import { checkAuth } from './page'

describe('checkAuth', () => {
  it('redirects to /auth when user is anonymous', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', is_anonymous: true } } }) },
    }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    await checkAuth()
    expect(mockRedirect).toHaveBeenCalledWith('/auth')
  })

  it('redirects to /auth when user is null', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    await checkAuth()
    expect(mockRedirect).toHaveBeenCalledWith('/auth')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- app/my-ideas/page.test.tsx
```

Expected: FAIL — `checkAuth` not exported.

- [ ] **Step 3: Create my-ideas page**

Create `app/my-ideas/page.tsx`:

```tsx
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import IdeaCard from '@/components/IdeaCard'
import type { Idea } from '@/types'

// Exported for testing
export async function checkAuth() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) redirect('/auth')
  return user
}

export default async function MyIdeasPage() {
  const user = await checkAuth()

  const supabase = createServerClient()
  const { data: ideas } = await supabase
    .from('ideas')
    .select('*, feedback_count:feedbacks(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const normalized: Idea[] = (ideas ?? []).map((idea: any) => ({
    ...idea,
    feedback_count: idea.feedback_count?.[0]?.count ?? 0,
  }))

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-.02em', marginBottom: 8 }}>
        Fikirlerim
      </h1>
      <p style={{ fontSize: 12, color: '#444', marginBottom: 28 }}>{normalized.length} fikir</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {normalized.map(idea => <IdeaCard key={idea.id} idea={idea} />)}
      </div>
      {!normalized.length && (
        <p style={{ color: '#444', fontSize: 13 }}>Henüz bir fikir paylaşmadın.</p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run -- app/my-ideas/page.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/my-ideas/
git commit -m "feat: add auth-gated my-ideas page"
```

---

### Task 19: Categories page

**Files:**
- Create: `app/categories/page.tsx`
- Test: `app/categories/page.test.tsx`

- [ ] **Step 1: Write categories count test**

Create `app/categories/page.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { buildCategoryCountMap } from './page'

describe('buildCategoryCountMap', () => {
  it('counts ideas per category', () => {
    const rows = [{ category: 'teknoloji' }, { category: 'teknoloji' }, { category: 'sanat' }]
    const result = buildCategoryCountMap(rows)
    expect(result['teknoloji']).toBe(2)
    expect(result['sanat']).toBe(1)
    expect(result['iş']).toBeUndefined()
  })

  it('returns empty object for empty input', () => {
    expect(buildCategoryCountMap([])).toEqual({})
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- app/categories/page.test.tsx
```

Expected: FAIL — `buildCategoryCountMap` not exported.

- [ ] **Step 3: Create categories page**

Create `app/categories/page.tsx`:

```tsx
import Link from 'next/link'
import { CATEGORIES } from '@/lib/categories'
import { createServerClient } from '@/lib/supabase/server'

// Exported for testing
export function buildCategoryCountMap(rows: { category: string }[]): Record<string, number> {
  const countMap: Record<string, number> = {}
  for (const row of rows) {
    countMap[row.category] = (countMap[row.category] ?? 0) + 1
  }
  return countMap
}

export default async function CategoriesPage() {
  const supabase = createServerClient()

  // Count active ideas per category
  const { data: counts } = await supabase
    .from('ideas')
    .select('category')
    .eq('status', 'active')

  const countMap = buildCategoryCountMap(counts ?? [])

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-.02em', marginBottom: 32 }}>
        Kategoriler
      </h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {CATEGORIES.map(cat => (
          <Link key={cat.value} href={`/?category=${cat.value}`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#141414', border: '1px solid #1e1e1e',
              borderRadius: 12, padding: '16px 20px', cursor: 'pointer',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: cat.color, marginBottom: 4 }}>
                {cat.label}
              </div>
              <div style={{ fontSize: 12, color: '#444' }}>
                {countMap[cat.value] ?? 0} fikir
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run -- app/categories/page.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/categories/
git commit -m "feat: add categories browse page"
```

---

### Task 20: Run all tests + final build check

- [ ] **Step 1: Run all tests**

```bash
npm run test:run
```

Expected: All tests PASS.

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "chore: final build verification — all tests pass"
```

---

## Summary

| Chunk | Tasks | What's built |
|---|---|---|
| 1 | 1–4 | Project setup, types, DB schema, Supabase clients, rate-limit |
| 2 | 5–6 | Anonymous sessions, Navbar, auth page with identity linking |
| 3 | 7–8 | IdeaCard, CategoryFilter, SSR home feed |
| 4 | 9–12 | Idea submission (form + API), idea detail page, FeedbackCard, FeedbackList |
| 5 | 13–14 | FeedbackForm, feedbacks API (POST + paginated GET) |
| 6 | 15–16 | Vote toggle API, reports API |
| 7 | 17–20 | Profile page, my-ideas page, categories page, final verification |
