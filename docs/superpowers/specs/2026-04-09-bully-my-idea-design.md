# Bully My Idea — Design Spec

**Date:** 2026-04-09  
**Status:** Approved

---

## Overview

A web platform where anyone can share ideas and receive structured, honest feedback ("bully") from the community. Tone is sharp and direct — "let's tear your idea apart."

---

## Target Audience

Everyone — anonymous users and registered members alike. No gatekeeping, no invite system.

---

## Tech Stack

- **Frontend + Backend:** Next.js 14 (App Router)
- **Database + Auth + Realtime:** Supabase (PostgreSQL, Row-Level Security, anonymous sessions)
- **Hosting:** Vercel (frontend), Supabase cloud (db)
- **Monetization:** Freemium — basic free, premium features later (TBD)

---

## Pages

| Route | Access | Description |
|---|---|---|
| `/` | Public | Feed of recent ideas, category filter |
| `/idea/[id]` | Public | Idea detail + structured feedback list + bully form |
| `/submit` | Public | Submit new idea (anonymous or logged in) |
| `/categories` | Public | Browse by category / tag |
| `/profile/[id]` | Public | User profile, their ideas |
| `/my-ideas` | Registered | Own ideas dashboard |
| `/auth` | Public | Sign in / Sign up |

---

## Core Features

### Idea Submission
- Title, description (required)
- Category (select from predefined list)
- Tags (freeform, comma-separated)
- Anonymous or logged-in submission

### Feedback System
Structured form with three fields:
1. **Güçlü yanlar** (Strengths) — what works
2. **Zayıf yanlar** (Weaknesses) — what fails
3. **Öneri** (Suggestion) — how to improve

Anonymous users can submit feedback. Spam protection: max 3 feedbacks/day per IP. Rate-limit counters stored in Supabase (`rate_limits` table: ip, action, count, window_start) — enforced in Next.js API route, not middleware, to allow DB persistence across serverless instances.

**Votes:** One vote per (user_id OR ip_hash) per feedback. Enforced via UNIQUE constraint on `votes(feedback_id, user_id)` for registered users, and Supabase `rate_limits` check for anonymous. No rate-limit cap on votes beyond deduplication.

### Identity & Auth
- Supabase anonymous sessions by default (Supabase `signInAnonymously()`)
- Optional sign-up to claim profile
- **Anonymous → registered linking:** Supabase's built-in `linkIdentity()` flow. The anonymous session's UUID is preserved on registration — all ideas and feedbacks tied to that `user_id` automatically belong to the new profile. No IP matching; single-device session-based only.
- Registered users get public profile page

### Idea Feed
- Newest-first default sort
- Filter by category
- Each card shows: title, short description, category badge, tags, feedback count, timestamp

---

## Data Model

### `ideas`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| title | text | required |
| description | text | required |
| category | text | CHECK constraint from enum list |
| tags | text[] | freeform |
| user_id | uuid | nullable (anon) |
| created_at | timestamptz | |
| status | text | active / archived |

### `feedbacks`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| idea_id | uuid | FK → ideas |
| strengths | text | |
| weaknesses | text | |
| suggestions | text | |
| user_id | uuid | nullable (anon) |
| created_at | timestamptz | |

### `votes`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| feedback_id | uuid | FK → feedbacks |
| vote_type | text | up / down |
| user_id | uuid | nullable |
| created_at | timestamptz | |

---

## Categories

`teknoloji`, `sanat`, `iş`, `sosyal`, `eğitim`, `sağlık`, `eğlence`, `diğer`

---

## Design & UX

- **Style:** Dark, minimal, modern. Sharp typography, rounded corners, color-coded category badges.
- **Tone:** Playful and direct. CTA is "Bully Et" not "Submit Feedback."
- **Responsive:** Mobile and desktop equally supported.
- **Feedback form:** Inline on idea detail page, not a modal or separate page.
- **Anonymous-first UX:** No sign-up wall. "Continue as anonymous →" always visible.

---

## Out of Scope (v1)

- Notifications / email alerts
- DM / direct messaging
- Idea versioning / revision history
- Rich text editor
- Image uploads
- Premium/freemium features (designed later)
- Full dashboard with analytics

---

## Non-Functional Requirements

- Page load < 2s (Next.js SSR + Supabase edge)
- Supabase free tier sufficient for v1 (500MB DB, 50k MAU)
- Rate limiting on anonymous submissions (Next.js middleware, IP-based)

---

## Moderation (v1 Baseline)

- Each idea and feedback card shows a "Şikayet Et" (Report) button — UI only, no automated action
- Reports stored in a `reports` table (idea_id or feedback_id, reporter ip_hash, reason text, created_at)
- Admin review is manual: a Supabase dashboard query. No admin UI in v1.
- Ideas/feedbacks can be soft-deleted by setting `status = 'archived'` — removed from feed but data preserved.

---

## Idea Status Transitions

- `active` — visible in feed and detail page
- `archived` — hidden from feed, detail page shows "Bu fikir kaldırıldı." Feedback on archived ideas is hidden.
- Transitions: active → archived (user delete or admin action). No reverse.

---

## Feedback Sorting & Pagination

- Default sort: newest first
- 10 feedbacks per page, "Daha fazla yükle" button (cursor-based pagination)
- No hiding based on downvotes in v1

---

## i18n

- v1 is Turkish-only. No i18n framework. Text is hardcoded in Turkish.

---

## Open Questions

- Premium features: what goes behind the paywall? (deferred)
- Account deletion / GDPR: user data purge flow (deferred, pre-launch)
