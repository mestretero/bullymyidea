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
