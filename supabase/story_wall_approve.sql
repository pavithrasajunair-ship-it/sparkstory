-- Show the stories that are waiting. Run in Supabase > SQL Editor.
-- 1) Look first (optional): select id, tier, title, author, left(body, 80) from wall_stories where approved = false;
-- 2) Approve everything that is waiting:
update public.wall_stories set approved = true where approved = false;
-- To approve only one: update public.wall_stories set approved = true where id = 'PASTE-THE-ID-HERE';
-- To remove one:       delete from public.wall_stories where id = 'PASTE-THE-ID-HERE';
