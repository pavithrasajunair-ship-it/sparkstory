/* Story wall spam guard. Run once in Supabase -> SQL Editor. Safe to run again.
   Rules (checked on the server, so they cannot be skipped from the browser):
   - at most 60 stories waiting for approval at any time
   - at most 120 new stories in any 24 hours, across everyone
   - the same title, or the same opening text, cannot be posted twice */
create or replace function wall_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from wall_stories where approved = false) >= 60 then
    raise exception 'wall_busy';
  end if;
  if (select count(*) from wall_stories where created_at > now() - interval '1 day') >= 120 then
    raise exception 'wall_busy';
  end if;
  if exists (select 1 from wall_stories where lower(title) = lower(new.title) or left(body, 200) = left(new.body, 200)) then
    raise exception 'wall_duplicate';
  end if;
  return new;
end $$;
revoke all on function wall_guard() from public;
drop trigger if exists wall_guard_trg on wall_stories;
create trigger wall_guard_trg before insert on wall_stories for each row execute function wall_guard();
