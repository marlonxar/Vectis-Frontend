-- ============================================================================
-- Discovery Assistant Widget — Supabase schema + RLS
-- Run this in Supabase: SQL Editor → New query → paste → Run.
-- Safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE where possible).
-- ============================================================================

-- Needed for gen_random_uuid()
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

create table if not exists public.flows (
  id                 uuid primary key default gen_random_uuid(),
  public_key         text unique not null,            -- e.g. da_k29x83mzp4 (used by the widget)
  name               text not null,
  language           text not null default 'es' check (language in ('en','es')),
  status             text not null default 'DRAFT' check (status in ('ACTIVE','INACTIVE','DRAFT')),
  logo_url           text,
  background_url     text,                             -- image OR video URL
  avatar_url         text,                             -- assistant avatar (optional; defaults to the built-in mascot)
  accent_color       text default '#E7AB2E',           -- widget accent
  intro_title        text,                             -- e.g. "Entendamos tu proyecto en 5 minutos"
  intro_subtitle     text,
  notification_email text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.flow_questions (
  id           uuid primary key default gen_random_uuid(),
  flow_id      uuid not null references public.flows(id) on delete cascade,
  type         text not null check (type in ('TEXT','TEXTAREA','EMAIL','PHONE','RADIO','CHECKBOX','SELECT')),
  key          text not null,                          -- machine name used in answers_json (e.g. businessName)
  label        text not null,
  help_text    text,
  placeholder  text,
  audio_url    text,
  options      jsonb default '[]'::jsonb,              -- ["E-commerce","Landing", ...] for RADIO/CHECKBOX/SELECT
  required     boolean not null default false,
  order_index  integer not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists flow_questions_flow_id_idx on public.flow_questions(flow_id, order_index);

-- if the flows table already existed, make sure the avatar column is present
alter table public.flows add column if not exists avatar_url text;

create table if not exists public.submissions (
  id           uuid primary key default gen_random_uuid(),
  flow_id      uuid not null references public.flows(id) on delete cascade,
  answers_json jsonb not null default '{}'::jsonb,
  status       text not null default 'NEW' check (status in ('NEW','CONTACTED','QUALIFIED','CLOSED','LOST')),
  created_at   timestamptz not null default now()
);
create index if not exists submissions_flow_id_idx on public.submissions(flow_id, created_at desc);

create table if not exists public.flow_views (
  id         uuid primary key default gen_random_uuid(),
  flow_id    uuid not null references public.flows(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists flow_views_flow_id_idx on public.flow_views(flow_id, created_at desc);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- The widget uses the PUBLIC anon key, so the rules below are the security layer.
-- Anonymous visitors can: read ACTIVE/INACTIVE flows + ACTIVE flows' questions,
-- and INSERT submissions + views. They can NEVER read submissions or DRAFT flows.
-- ----------------------------------------------------------------------------

alter table public.flows          enable row level security;
alter table public.flow_questions enable row level security;
alter table public.submissions    enable row level security;
alter table public.flow_views     enable row level security;

-- flows: anon can read only published flows (ACTIVE shows the flow, INACTIVE shows the
-- "currently unavailable" message). DRAFT stays hidden.
drop policy if exists "flows_public_read" on public.flows;
create policy "flows_public_read" on public.flows
  for select to anon
  using (status in ('ACTIVE','INACTIVE'));

-- flow_questions: anon can read questions only for ACTIVE flows.
drop policy if exists "questions_public_read" on public.flow_questions;
create policy "questions_public_read" on public.flow_questions
  for select to anon
  using (exists (select 1 from public.flows f
                 where f.id = flow_questions.flow_id and f.status = 'ACTIVE'));

-- submissions: anon can INSERT only for ACTIVE flows; cannot read/update/delete.
drop policy if exists "submissions_public_insert" on public.submissions;
create policy "submissions_public_insert" on public.submissions
  for insert to anon
  with check (exists (select 1 from public.flows f
                      where f.id = submissions.flow_id and f.status = 'ACTIVE'));

-- flow_views: anon can INSERT only for ACTIVE flows; cannot read.
drop policy if exists "views_public_insert" on public.flow_views;
create policy "views_public_insert" on public.flow_views
  for insert to anon
  with check (exists (select 1 from public.flows f
                      where f.id = flow_views.flow_id and f.status = 'ACTIVE'));

-- keep updated_at fresh on flows
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists flows_touch_updated_at on public.flows;
create trigger flows_touch_updated_at before update on public.flows
  for each row execute function public.touch_updated_at();
