-- OPTIONAL. Run only if you want new stories to appear on the wall straight away.
-- Stories for little ones, kids and teens are published at once unless they contain a word from the list below.
-- Grown-ups 18+ stories and anything that trips the list stay "waiting" for you to approve.
-- Extend the list as you see fit. Safe to run again. To turn it off: drop trigger if exists wall_autopublish_trg on public.wall_stories;
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
