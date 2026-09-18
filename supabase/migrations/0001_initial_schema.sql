-- ============================================================
-- TikTok Creator PWA — Milestone 1 Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------
-- video_projects
-- ----------------------------------------------------------------
create table if not exists public.video_projects (
  id            uuid primary key default gen_random_uuid(),
  prompt_key    text not null,                    -- e.g. "daily_life", "farming_tip"
  locale        text not null default 'am',       -- 'am' | 'en'
  source_url    text,                             -- nullable in MVP
  source_rights_confirmed boolean not null default false,
  status        text not null default 'draft',    -- draft | uploading | queued | processing | ready | failed
  user_id       uuid,                             -- null for anonymous
  session_id    text,                             -- anonymous session cookie value
  free_video_used boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- video_assets
-- ----------------------------------------------------------------
create table if not exists public.video_assets (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.video_projects(id) on delete cascade,
  asset_type    text not null,                    -- 'selfie' | 'preview' | 'final'
  cloudinary_url text not null,
  public_id     text,
  duration_s    numeric,
  width         int,
  height        int,
  size_bytes    bigint,
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- video_renders
-- ----------------------------------------------------------------
create table if not exists public.video_renders (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.video_projects(id) on delete cascade,
  status        text not null default 'queued',   -- queued | processing | ready | failed
  instructions  jsonb not null default '{}',      -- template params
  output_url    text,
  preview_url   text,
  error_message text,
  inngest_event_id text,
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- publish_attempts (phase 2 scaffold)
-- ----------------------------------------------------------------
create table if not exists public.publish_attempts (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.video_projects(id) on delete cascade,
  render_id     uuid references public.video_renders(id),
  platform      text not null default 'tiktok',
  status        text not null default 'pending',  -- pending | success | failed
  tiktok_video_id text,
  error_message text,
  attempted_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- posting_requests (phase 2 scaffold — admin-assisted posting)
-- ----------------------------------------------------------------
create table if not exists public.posting_requests (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.video_projects(id) on delete cascade,
  tiktok_username text,
  privacy_level   text default 'PUBLIC_TO_EVERYONE',
  allow_comments  boolean default true,
  allow_duet      boolean default false,
  allow_stitch    boolean default false,
  brand_content   boolean default false,
  agreed_to_terms boolean not null default false,
  status          text not null default 'pending', -- pending | approved | posted | rejected
  admin_notes     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- updated_at trigger helper
-- ----------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger video_projects_updated_at
  before update on public.video_projects
  for each row execute procedure public.set_updated_at();

create trigger video_renders_updated_at
  before update on public.video_renders
  for each row execute procedure public.set_updated_at();

create trigger posting_requests_updated_at
  before update on public.posting_requests
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------
alter table public.video_projects enable row level security;
alter table public.video_assets enable row level security;
alter table public.video_renders enable row level security;
alter table public.publish_attempts enable row level security;
alter table public.posting_requests enable row level security;

-- Anonymous users can create + read their own projects by session_id
create policy "anon_own_projects" on public.video_projects
  for all using (session_id = current_setting('request.jwt.claims', true)::jsonb->>'session_id'
              or auth.uid() = user_id);

-- Assets follow project access
create policy "anon_own_assets" on public.video_assets
  for all using (
    exists (
      select 1 from public.video_projects p
      where p.id = project_id
        and (p.session_id = current_setting('request.jwt.claims', true)::jsonb->>'session_id'
          or p.user_id = auth.uid())
    )
  );

-- Renders follow project access
create policy "anon_own_renders" on public.video_renders
  for all using (
    exists (
      select 1 from public.video_projects p
      where p.id = project_id
        and (p.session_id = current_setting('request.jwt.claims', true)::jsonb->>'session_id'
          or p.user_id = auth.uid())
    )
  );

-- Indexes
create index if not exists idx_video_projects_session on public.video_projects(session_id);
create index if not exists idx_video_projects_user on public.video_projects(user_id);
create index if not exists idx_video_assets_project on public.video_assets(project_id);
create index if not exists idx_video_renders_project on public.video_renders(project_id);
create index if not exists idx_video_renders_status on public.video_renders(status);
