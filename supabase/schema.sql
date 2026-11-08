create table public.prayer_signups (
  id uuid primary key default gen_random_uuid(),
  prayer_date date not null check (prayer_date between date '2026-11-08' and date '2026-12-17'),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 100),
  additional_name text check (additional_name is null or char_length(btrim(additional_name)) between 1 and 100),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.prayer_signups enable row level security;

revoke all on public.prayer_signups from anon, authenticated;
grant select on public.prayer_signups to anon, authenticated;
grant insert (prayer_date, display_name, additional_name) on public.prayer_signups to authenticated;
grant delete on public.prayer_signups to authenticated;

create policy "Anyone can see prayer signups"
  on public.prayer_signups for select to anon, authenticated using (true);

create policy "Signed-in users can join a prayer day"
  on public.prayer_signups for insert to authenticated with check (owner_id = auth.uid());

create policy "Users can remove their own signups"
  on public.prayer_signups for delete to authenticated using (owner_id = auth.uid());
