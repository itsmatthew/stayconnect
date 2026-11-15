-- Display name and avatar for each user (docs/specs/profiles-backend.md). Idempotent: safe to re-run.
-- Both are optional. The checks repeat the rules in src/server/profiles.ts so a bad value can't get in any other way.

alter table users add column if not exists display_name text;
alter table users add column if not exists avatar_url text;

alter table users drop constraint if exists users_display_name_check;
alter table users add constraint users_display_name_check
  check (display_name is null or (length(display_name) between 1 and 50 and display_name ~ '\S'));

alter table users drop constraint if exists users_avatar_url_check;
alter table users add constraint users_avatar_url_check
  check (avatar_url is null or (avatar_url like 'https://%' and length(avatar_url) <= 2048));
