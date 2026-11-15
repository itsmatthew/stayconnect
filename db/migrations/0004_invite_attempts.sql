-- Failed invite lookups, for rate limiting (docs/specs/group-invites-backend.md INV-11). Idempotent: safe to re-run.

create table if not exists invite_attempts (
  user_id text not null references users (id) on delete cascade,
  at timestamptz not null default now()
);

create index if not exists invite_attempts_user_at_idx on invite_attempts (user_id, at);
