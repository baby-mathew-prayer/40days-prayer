-- Run only if the previous anonymous-signup schema was already installed.
-- Existing entries remain visible but have no owner and must be managed by the organizer.
alter table public.prayer_signups
  add column owner_id uuid references auth.users(id) on delete cascade;
alter table public.prayer_signups alter column owner_id set default auth.uid();

revoke insert (prayer_date, display_name, additional_name) on public.prayer_signups from anon, authenticated;
revoke insert on public.prayer_signups from anon, authenticated;
grant insert (prayer_date, display_name, additional_name) on public.prayer_signups to authenticated;
grant delete on public.prayer_signups to authenticated;

drop policy "Anyone can join a prayer day" on public.prayer_signups;
create policy "Signed-in users can join a prayer day"
  on public.prayer_signups for insert to authenticated with check (owner_id = auth.uid());
create policy "Users can remove their own signups"
  on public.prayer_signups for delete to authenticated using (owner_id = auth.uid());
