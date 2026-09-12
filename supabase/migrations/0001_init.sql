-- Sona AI — initial schema
-- Run via `supabase db push` or paste into the Supabase SQL editor.

create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  username text unique,
  avatar_url text,
  referral_code text unique not null default upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 8)),
  referred_by uuid references profiles(id) on delete set null,
  default_mode text not null default 'general' check (default_mode in ('student','business','creator','reading','general')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_referral_code on profiles(referral_code);

-- ============================================================
-- SESSIONS (chat conversations)
-- ============================================================
create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  mode text not null default 'general' check (mode in ('student','business','creator','reading','general')),
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sessions_user_id on sessions(user_id, updated_at desc);

-- ============================================================
-- MESSAGES
-- ============================================================
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb, -- e.g. suggested actions, referenced document_id
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_session_id on messages(session_id, created_at asc);

-- ============================================================
-- DOCUMENTS
-- ============================================================
create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  session_id uuid references sessions(id) on delete cascade,
  filename text not null,
  file_type text not null,
  file_size bigint,
  file_url text, -- Supabase Storage path (private bucket, signed URL on read)
  extracted_text text,
  detected_type text, -- e.g. 'lecture', 'financial_report', 'script'
  sections jsonb, -- [{ "title": string, "content": string, "index": number }], populated at upload time
  status text not null default 'uploading' check (
    status in ('uploading','uploaded','extracting','analyzing','ready','failed')
  ),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_documents_user_id on documents(user_id, created_at desc);
create index if not exists idx_documents_session_id on documents(session_id);

-- ============================================================
-- AUDIO FILES
-- ============================================================
create table if not exists audio_files (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  session_id uuid references sessions(id) on delete cascade,
  document_id uuid references documents(id) on delete set null,
  title text not null,
  audio_url text, -- null until a TTS provider is configured and generation succeeds
  provider text, -- which TTS provider generated this
  duration_seconds numeric,
  section text, -- e.g. 'Section 2 — Cell Structure'
  status text not null default 'pending' check (
    status in ('pending','generating','ready','failed','not_configured')
  ),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audio_files_user_id on audio_files(user_id, created_at desc);
create index if not exists idx_audio_files_session_id on audio_files(session_id);

-- ============================================================
-- TRANSCRIPTS (speech-to-text results, via AssemblyAI)
-- ============================================================
create table if not exists transcripts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  session_id uuid references sessions(id) on delete cascade,
  source_audio_url text not null,
  provider text not null default 'assemblyai',
  transcript_text text,
  status text not null default 'queued' check (
    status in ('queued','processing','ready','failed')
  ),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_transcripts_user_id on transcripts(user_id, created_at desc);

-- ============================================================
-- REFERRALS
-- ============================================================
create table if not exists referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid not null references profiles(id) on delete cascade,
  referred_user_id uuid not null references profiles(id) on delete cascade,
  referral_code text not null,
  created_at timestamptz not null default now(),
  unique (referred_user_id) -- a user can only be referred once
);

create index if not exists idx_referrals_referrer_id on referrals(referrer_id);

-- ============================================================
-- USAGE (AI + TTS + STT metering)
-- ============================================================
create table if not exists usage (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  service text not null check (service in ('ai_groq','ai_anthropic','tts','stt_assemblyai')),
  characters integer default 0,
  tokens integer default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_usage_user_id on usage(user_id, created_at desc);

-- ============================================================
-- APP SETTINGS (singleton row, admin-controlled)
-- ============================================================
create table if not exists app_settings (
  id int primary key default 1,
  maintenance_mode boolean not null default false,
  maintenance_message text default 'Sona AI is currently under maintenance. We''re working on improvements and will be back shortly.',
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into app_settings (id, maintenance_mode) values (1, false)
  on conflict (id) do nothing;

-- ============================================================
-- updated_at triggers
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

drop trigger if exists trg_sessions_updated_at on sessions;
create trigger trg_sessions_updated_at before update on sessions
  for each row execute function set_updated_at();

-- ============================================================
-- Auto-create profile row on signup
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
declare
  raw_username text;
  final_username text;
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

  insert into public.profiles (id, email, name, username, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    final_username,
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do update set
    name = coalesce(excluded.name, profiles.name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table sessions enable row level security;
alter table messages enable row level security;
alter table documents enable row level security;
alter table audio_files enable row level security;
alter table transcripts enable row level security;
alter table referrals enable row level security;
alter table usage enable row level security;
alter table app_settings enable row level security;

-- Profiles: users read/update only their own row
drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- RLS is row-level, not column-level: the policy above lets a user update
-- their own row, but without this grant restriction they could set their
-- OWN is_admin, referral_code, or referred_by to anything they want from
-- the browser. Explicitly limit which columns the authenticated role may
-- write; everything else (is_admin, referral_code, referred_by, email,
-- id, created_at) is only ever changed via serviceClient() server-side.
revoke update on profiles from authenticated;
grant update (name, username, avatar_url, default_mode) on profiles to authenticated;

-- Sessions: full CRUD on own rows only
drop policy if exists "sessions_select_own" on sessions;
create policy "sessions_select_own" on sessions for select using (auth.uid() = user_id);
drop policy if exists "sessions_insert_own" on sessions;
create policy "sessions_insert_own" on sessions for insert with check (auth.uid() = user_id);
drop policy if exists "sessions_update_own" on sessions;
create policy "sessions_update_own" on sessions for update using (auth.uid() = user_id);
drop policy if exists "sessions_delete_own" on sessions;
create policy "sessions_delete_own" on sessions for delete using (auth.uid() = user_id);

-- Messages: full CRUD on own rows only
drop policy if exists "messages_select_own" on messages;
create policy "messages_select_own" on messages for select using (auth.uid() = user_id);
drop policy if exists "messages_insert_own" on messages;
create policy "messages_insert_own" on messages for insert with check (auth.uid() = user_id);
drop policy if exists "messages_delete_own" on messages;
create policy "messages_delete_own" on messages for delete using (auth.uid() = user_id);

-- Documents: full CRUD on own rows only
drop policy if exists "documents_select_own" on documents;
create policy "documents_select_own" on documents for select using (auth.uid() = user_id);
drop policy if exists "documents_insert_own" on documents;
create policy "documents_insert_own" on documents for insert with check (auth.uid() = user_id);
drop policy if exists "documents_update_own" on documents;
create policy "documents_update_own" on documents for update using (auth.uid() = user_id);
drop policy if exists "documents_delete_own" on documents;
create policy "documents_delete_own" on documents for delete using (auth.uid() = user_id);

-- Audio files: full CRUD on own rows only
drop policy if exists "audio_select_own" on audio_files;
create policy "audio_select_own" on audio_files for select using (auth.uid() = user_id);
drop policy if exists "audio_insert_own" on audio_files;
create policy "audio_insert_own" on audio_files for insert with check (auth.uid() = user_id);
drop policy if exists "audio_update_own" on audio_files;
create policy "audio_update_own" on audio_files for update using (auth.uid() = user_id);
drop policy if exists "audio_delete_own" on audio_files;
create policy "audio_delete_own" on audio_files for delete using (auth.uid() = user_id);

-- Transcripts: full CRUD on own rows only
drop policy if exists "transcripts_select_own" on transcripts;
create policy "transcripts_select_own" on transcripts for select using (auth.uid() = user_id);
drop policy if exists "transcripts_insert_own" on transcripts;
create policy "transcripts_insert_own" on transcripts for insert with check (auth.uid() = user_id);
drop policy if exists "transcripts_update_own" on transcripts;
create policy "transcripts_update_own" on transcripts for update using (auth.uid() = user_id);

-- Referrals: a user can see referrals they made; insert happens server-side (service role)
drop policy if exists "referrals_select_own" on referrals;
create policy "referrals_select_own" on referrals for select using (auth.uid() = referrer_id);

-- Usage: read-only for the owning user; inserts happen server-side (service role)
drop policy if exists "usage_select_own" on usage;
create policy "usage_select_own" on usage for select using (auth.uid() = user_id);

-- App settings: readable by any authenticated user, writes are service-role only (admin API route)
drop policy if exists "app_settings_select_all" on app_settings;
create policy "app_settings_select_all" on app_settings for select using (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('audio', 'audio', false)
on conflict (id) do nothing;

-- Storage policies: users can only access files under a path prefixed with their own user id
drop policy if exists "documents_storage_own" on storage.objects;
create policy "documents_storage_own"
  on storage.objects for all
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "audio_storage_own" on storage.objects;
create policy "audio_storage_own"
  on storage.objects for all
  using (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);
