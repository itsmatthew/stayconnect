-- Memories backend core (docs/specs/memories-backend.md). Idempotent: safe to re-run.
-- Users are keyed by their Clerk user id. Groups are our own tables, not Clerk Organizations (ADR 0001).

create table if not exists users (
  id text primary key,
  created_at timestamptz not null default now()
);

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 80),
  created_by text not null references users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists group_members (
  group_id uuid not null references groups (id) on delete cascade,
  user_id text not null references users (id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists group_members_user_idx on group_members (user_id);

create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups (id) on delete cascade,
  sender_id text not null references users (id) on delete cascade,
  caption text not null default '' check (length(caption) <= 500),
  photo_key text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  deleted_at timestamptz
);

create index if not exists memories_sender_idx on memories (sender_id);

create table if not exists memory_recipients (
  memory_id uuid not null references memories (id) on delete cascade,
  user_id text not null references users (id) on delete cascade,
  primary key (memory_id, user_id)
);

create index if not exists memory_recipients_user_idx on memory_recipients (user_id);

create table if not exists memory_replies (
  memory_id uuid not null,
  user_id text not null,
  created_at timestamptz not null default now(),
  primary key (memory_id, user_id),
  foreign key (memory_id, user_id) references memory_recipients (memory_id, user_id) on delete cascade
);
