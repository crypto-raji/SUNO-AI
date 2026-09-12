-- Sona AI — Admin Enhancements Migration
-- Run via `supabase db push` or paste into the Supabase SQL editor.

-- ============================================================
-- ADMIN AUDIT LOGS
-- ============================================================
create table if not exists admin_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid not null references profiles(id) on delete cascade,
  action text not null, -- e.g. 'toggle_maintenance', 'update_user_role', 'delete_user', 'retry_job'
  target_id text,       -- ID of the affected user, document, or resource (if applicable)
  details jsonb not null default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_admin_id on admin_audit_logs(admin_id, created_at desc);
create index if not exists idx_audit_logs_action on admin_audit_logs(action, created_at desc);
create index if not exists idx_audit_logs_created_at on admin_audit_logs(created_at desc);

-- ============================================================
-- ADDITIONAL PERFORMANCE INDEXES FOR ADMIN ANALYTICS
-- ============================================================
create index if not exists idx_usage_service_created_at on usage(service, created_at desc);
create index if not exists idx_sessions_mode_created_at on sessions(mode, created_at desc);
create index if not exists idx_documents_status_created_at on documents(status, created_at desc);
create index if not exists idx_audio_files_status_created_at on audio_files(status, created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY FOR AUDIT LOGS
-- ============================================================
alter table admin_audit_logs enable row level security;

-- Only admins can select from admin_audit_logs
drop policy if exists "admin_audit_logs_select_admins" on admin_audit_logs;
create policy "admin_audit_logs_select_admins" on admin_audit_logs
  for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- Only service role inserts directly, or admin users via policy
drop policy if exists "admin_audit_logs_insert_admins" on admin_audit_logs;
create policy "admin_audit_logs_insert_admins" on admin_audit_logs
  for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- ============================================================
-- AUTO-GENERATE PERMANENT AVATAR ON NEW USER CREATION
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
declare
  raw_username text;
  final_username text;
  final_avatar text;
begin
  raw_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );

  -- Ensure username uniqueness for OAuth signups
  if exists (select 1 from public.profiles where username = raw_username and id <> new.id) then
    final_username := raw_username || '_' || substr(replace(new.id::text, '-', ''), 1, 4);
  else
    final_username := raw_username;
  end if;

  final_avatar := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',
    'https://api.dicebear.com/7.x/identicon/svg?seed=' || encode(digest(new.id::text, 'sha256'), 'hex')
  );

  insert into public.profiles (id, email, name, username, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    final_username,
    final_avatar
  )
  on conflict (id) do update set
    name = coalesce(excluded.name, profiles.name),
    avatar_url = coalesce(profiles.avatar_url, excluded.avatar_url),
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;
