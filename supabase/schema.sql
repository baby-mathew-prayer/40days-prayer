create table public.prayer_signups (
  id uuid primary key default gen_random_uuid(),
  prayer_date date not null check (prayer_date between date '2026-11-08' and date '2026-12-17'),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 100),
  additional_name text check (additional_name is null or char_length(btrim(additional_name)) between 1 and 100),
  created_at timestamptz not null default now()
);

alter table public.prayer_signups enable row level security;
revoke all on public.prayer_signups from anon, authenticated;
