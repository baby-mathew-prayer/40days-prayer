-- Apply after schema.sql on a new database, or to an existing signup table.
-- Previous entries remain visible but have no device key; the organizer can remove them.
begin;

alter table public.prayer_signups add column if not exists removal_key_hash bytea;
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'prayer_signups' and column_name = 'owner_id') then
    alter table public.prayer_signups alter column owner_id drop not null;
    alter table public.prayer_signups alter column owner_id drop default;
  end if;
end
$$;

alter table public.prayer_signups enable row level security;
revoke all on public.prayer_signups from anon, authenticated;
revoke select (id, prayer_date, display_name, additional_name, created_at, removal_key_hash) on public.prayer_signups from anon, authenticated;
revoke insert (prayer_date, display_name, additional_name) on public.prayer_signups from anon, authenticated;
grant select (id, prayer_date, display_name, additional_name, created_at) on public.prayer_signups to anon, authenticated;

drop policy if exists "Anyone can see prayer signups" on public.prayer_signups;
drop policy if exists "Anyone can join a prayer day" on public.prayer_signups;
drop policy if exists "Signed-in users can join a prayer day" on public.prayer_signups;
drop policy if exists "Users can remove their own signups" on public.prayer_signups;
create policy "Anyone can see prayer signups"
  on public.prayer_signups for select to anon, authenticated using (true);

create or replace function public.create_prayer_signup(
  p_id uuid, p_token text, p_date date, p_display_name text, p_additional_name text
) returns uuid
language plpgsql security definer set search_path = pg_catalog, public
as $$
begin
  if p_id is null or p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid signup key' using errcode = '22023';
  end if;
  insert into public.prayer_signups (id, prayer_date, display_name, additional_name, removal_key_hash)
  values (p_id, p_date, p_display_name, p_additional_name, sha256(convert_to(p_token, 'UTF8')));
  return p_id;
end
$$;

create or replace function public.remove_prayer_signup(p_id uuid, p_token text)
returns boolean
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  removed_count integer;
begin
  if p_id is null or p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid signup key' using errcode = '22023';
  end if;
  delete from public.prayer_signups
    where id = p_id and removal_key_hash = sha256(convert_to(p_token, 'UTF8'));
  get diagnostics removed_count = row_count;
  return removed_count = 1;
end
$$;

revoke all on function public.create_prayer_signup(uuid, text, date, text, text) from public;
revoke all on function public.remove_prayer_signup(uuid, text) from public;
grant execute on function public.create_prayer_signup(uuid, text, date, text, text) to anon, authenticated;
grant execute on function public.remove_prayer_signup(uuid, text) to anon, authenticated;
commit;
