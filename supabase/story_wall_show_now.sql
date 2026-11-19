-- Run this ONE file in Supabase > SQL Editor to make the Story wall show stories.
-- Stories are saved as "waiting" until approved, so an untouched wall looks empty.
-- Part 1: publish the family stories (little ones, kids, teens) that are waiting right now. Grown-ups 18+ stories stay waiting for your review.
update public.wall_stories set approved = true where approved = false and tier in ('tiny','kids','teens');

-- Part 2: from now on, family stories (little ones, kids, teens) appear straight away unless they contain a flagged word.
-- Grown-ups 18+ stories stay waiting until you approve them (story_wall_approve.sql).
create or replace function wall_autopublish() returns trigger
language plpgsql security definer set search_path = public as $$
declare bad text[] := array['fuck','shit','bitch','cunt','porn','nude','naked','sex','rape','suicide','kill yourself','nazi','whatsapp','instagram','telegram'];
        w text; flagged boolean := false;
begin
  foreach w in array bad loop
    if lower(new.title || ' ' || new.body) like '%' || w || '%' then flagged := true; end if;
  end loop;
  if new.tier in ('tiny','kids','teens') and not flagged then
    update wall_stories set approved = true where id = new.id;
  end if;
  return null;
end $$;
revoke all on function wall_autopublish() from public;
drop trigger if exists wall_autopublish_trg on public.wall_stories;
create trigger wall_autopublish_trg after insert on public.wall_stories for each row execute function wall_autopublish();

-- Check: this shows what the wall can see.
select tier, count(*) from public.wall_stories where approved = true group by tier;
