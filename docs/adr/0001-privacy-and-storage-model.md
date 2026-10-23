# 0001. Privacy and storage model

Status: Proposed

## Context

Now & Then promises full privacy, no ads, and no popularity mechanics (`PRODUCT.md`). Today all state lives in the
browser (IndexedDB and localStorage), so memories cannot reach other people. Sending memories between friends,
invites, and shared group goals needs a backend, which means photos and messages will leave the device for the
first time. The stack already includes Clerk (auth) and Neon (Postgres). The database holds only a placeholder table.

These decisions are hard to reverse once real users' photos are stored, so they are recorded before any backend
code is written.

## Decision

1. **Device-first photos.** The camera roll, Daily 5 picks, face detection, and the 65 Archive stay on the device.
   Only a photo the user explicitly sends is uploaded.
2. **Strip metadata and resize before upload.** EXIF (GPS, device, timestamps) is removed in the browser, and the
   photo is resized (about 1600 px longest edge, JPEG/WebP, ~300 KB). The capture date, if the product needs it, is
   stored as our own field. Resizing is also the main storage-cost lever.
3. **Identity:** Clerk, used for sign-in only. Groups and memberships are our own tables (`groups`,
   `group_members`), not Clerk Organizations, which are limited to 100 members on the base tier and cost
   $100/month beyond that. **Data:** Neon Postgres via SQL migrations in `db/migrations`.
4. **Photos:** private object storage (Vercel Blob, private access), served only through short-lived signed URLs.
   No public image URLs.
5. **All access goes through server code.** The browser never queries the database or storage directly. The user ID
   comes only from the verified Clerk session, never from the request.
6. **Authorization:** deny by default. Group roles are `owner` and `member`. A memory is visible only to its
   recipients (one row per recipient). Every handler calls one shared check (e.g. `requireMember`), and objects are
   looked up by id AND membership. "Sealed until reply" is enforced on the server, not just in the UI.
   Postgres row-level security may be added later as a second layer.
7. **Retention:** sent memories are deleted after 60 days, or sooner when the sender deletes them. Deleting an
   account removes all of that user's rows and stored photos.
8. **Invites:** random tokens of at least 128 bits, stored hashed, with expiry, revoke, a use cap, and rate limiting.
   The join screen shows the group name and inviter before joining.
9. **No end-to-end encryption in v1.** TLS in transit and the providers' encryption at rest. The privacy policy
   states plainly that the service can technically access stored photos and that access controls and policy prevent
   it.
10. **No staff access to photos** for moderation at launch. Moderation is via a report-and-block flow, with a named
    person responsible for handling reports.
11. **No third-party tracking** on photo or message screens. Whether Vercel Analytics stays is decided separately.

## Alternatives

- **End-to-end encryption.** Strongest privacy claim ("we can't see your photos"). Rejected for v1: it complicates
  invites, membership changes, multiple devices, and recovery, and is easy to implement incorrectly.
- **Public bucket with unguessable URLs.** Simpler, but a leaked or shared link exposes a photo permanently.
- **Cloudflare R2 / S3 instead of Vercel Blob.** Cheaper egress at scale. Deferred: Vercel Blob is simpler for a
  beta, and the storage layer will sit behind a small interface so it can be swapped.
- **Keep everything local.** Preserves privacy but cannot support sending memories, which is the core product loop.
- **Permanent retention.** Accumulates risk and cost, and conflicts with the low-pressure, no-archive-hoarding feel.

## Consequences

- "Photos never leave the browser" (in `src/app/intro/daily5/CLAUDE.md` on Jackson's branch) is no longer true for
  sent photos. That doc must be updated to say only sent photos upload, via the server.
- The sender, not the service, is responsible for what they send. A report-and-block flow, terms, a privacy policy,
  and a minimum age are required before inviting friends.
- Expiring memories means the product needs a scheduled cleanup job, plus storage cleanup on account deletion.
- Server-side authorization is the main security surface and needs tests for cross-user and cross-group access
  (IDOR) before any rollout.
- Cost, checked against vendor pricing pages on 2026-10-23 (re-check before provisioning; prices change):
  - Clerk: free up to 50,000 monthly retained users. Phone/SMS sign-in is not on the free plan.
  - Neon: free tier (1 GB, 100 CU-hours, scale-to-zero) is enough for text data.
  - Vercel Blob: Hobby includes 1 GB storage and 10 GB transfer, and **stops working for 30 days when exceeded**
    (no overage billing). Pro bills about $0.023/GB-month storage and about $0.05/GB transfer.
  - Vercel hosting: Hobby is personal and non-commercial only. Pro is $20/month.
  - Estimate (assumptions, not measured): 50 users x 3 photos/day x 60 days x ~300 KB is about 2.7 GB steady-state,
    so about $20-25/month on Pro, mostly the Pro seat. A group of about 15-20 users can stay on Hobby at $0.
  - Private Blob delivery is streamed through a server function, so transfer is billed twice. This is the cost to
    watch as usage grows.
  - Nothing is provisioned. Moving to Vercel Pro needs explicit approval first.
- The localStorage/IndexedDB stand-ins (`use-chat`, `use-circle`, `use-goals`, `ornament-store`) are replaced one at
  a time behind their existing hooks.
