-- Group invites (docs/specs/group-invites-backend.md). Idempotent: safe to re-run.
-- Only the SHA-256 of a token is stored (INV-2); the plaintext is shown once at creation.

create table if not exists group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups (id) on delete cascade,
  token_hash text not null unique,
  created_by text not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  max_uses int not null check (max_uses between 1 and 50),
  use_count int not null default 0 check (use_count >= 0 and use_count <= max_uses),
  revoked_at timestamptz
);

create index if not exists group_invites_group_idx on group_invites (group_id);
