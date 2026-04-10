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
