-- ============================================================
-- Migration 002: generation_requests table for selfie → funny image flow
-- ============================================================

create table if not exists public.generation_requests (
  id            uuid primary key default gen_random_uuid(),
  session_id    text not null,
  selfie_url    text not null,           -- Cloudinary URL of original selfie
  selfie_public_id text,
  result_url    text,                    -- Cloudinary URL of generated funny image
  style         text,                    -- which funny style was used
  status        text not null default 'pending',
                                         -- pending | processing | ready | failed | approved | rejected
  admin_note    text,
  unlocked      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger generation_requests_updated_at
  before update on public.generation_requests
  for each row execute procedure public.set_updated_at();

alter table public.generation_requests enable row level security;

-- Anonymous users can create and read their own requests
create policy "anon_own_generation_requests" on public.generation_requests
  for all using (
    session_id = current_setting('request.jwt.claims', true)::jsonb->>'session_id'
  );

create index if not exists idx_gen_requests_session on public.generation_requests(session_id);
create index if not exists idx_gen_requests_status  on public.generation_requests(status);
create index if not exists idx_gen_requests_created on public.generation_requests(created_at desc);
