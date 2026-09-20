-- ============================================================
-- Migration 003: banned_devices for session/device bans
-- ============================================================

create table if not exists public.banned_devices (
  session_id  text primary key,
  reason      text,
  banned_at   timestamptz not null default now()
);

alter table public.banned_devices enable row level security;

create index if not exists idx_banned_devices_banned_at
  on public.banned_devices(banned_at desc);
