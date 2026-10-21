# app/intro/circle

Your circle's rules (spec: `docs/specs/circle.md`; tests: `tests/circle/`).

- `rings.ts`: placements (friend id → ring, key order is ring order) and dismissed suggestions, as a pure reducer. Nothing moves anyone but an explicit `place`, and no ring is ever full: soft guides only feed the card's note.
- `suggestions.ts`: 1:1 chat activity in the last 30 days (sealed memories count, group chats don't), lit/dim, and the one inward suggestion. Thresholds are constants there.
- `use-circle.ts` keeps state in localStorage like `messages/use-chat.ts` (TODO until there's a database). `AppClient` owns it; `home-client.tsx` maps it to `CircleScreen` props.
