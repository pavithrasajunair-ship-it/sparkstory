-- StorySpark Story wall. Run once in Supabase > SQL Editor (paste the CONTENTS of this file).
-- Stories go in as "pending". Only stories you approve (approved = true) appear on the wall.
create table if not exists public.wall_stories (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 80),
  author text not null default 'A StorySpark reader' check (char_length(author) between 1 and 40),
  tier text not null check (tier in ('tiny','kids','teens','adult')),
  body text not null check (char_length(body) between 200 and 8000),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.wall_stories enable row level security;
drop policy if exists "wall read approved" on public.wall_stories;
drop policy if exists "wall submit pending" on public.wall_stories;
create policy "wall read approved" on public.wall_stories for select to anon using (approved = true);
create policy "wall submit pending" on public.wall_stories for insert to anon with check (approved = false);
revoke all on public.wall_stories from anon;
grant select (id, title, author, tier, body, created_at) on public.wall_stories to anon;
grant insert (title, author, tier, body) on public.wall_stories to anon;
-- To approve a story: Table Editor > wall_stories > tick the "approved" box on its row.
-- To remove one: delete the row (or untick approved).
