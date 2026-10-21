# Demo data switch

One app-wide switch decides whether placeholder data exists at all. Tests: `tests/app/demo-switch.test.tsx`.

| ID | Behaviour |
|----|-----------|
| DEMO-1 | **One switch.** `NEXT_PUBLIC_DEMO_DATA=on` or `off` decides; unset, it's on only when `NODE_ENV` is `development`. It controls *all* placeholder data: groups, friends, ring placements, seed conversations, simulated replies and Archive posts. Only `src/app/intro/app-data.ts` imports `placeholder-data.ts`; screens get their data from `AppClient`'s `data`. |
| DEMO-2 | **Designed empty states** with the switch off. **Home:** a single young sapling, "Your circles grow when someone sends you a memory — or send one first", and a "Go to Daily 5" button that opens Daily 5. **Your circle:** the empty tree and "Your circle fills as you connect with people" (`docs/specs/circle.md`, CIRCLE-11). **Messages:** "No messages yet. Send a memory to start one." **Archive:** the locked state (ARC-9) with nobody posted. **Me:** the year's empty slots. **Daily 5 send sheet:** "No circles yet" in place of the empty sections. |
| DEMO-3 | Demo and real data never mix: with the switch on, the chat (localStorage) and Archive (IndexedDB) storage names get a `.demo` suffix. |
| DEMO-4 | With the switch off, no placeholder name, group name, message text or reply appears anywhere: on any tab, or in what's saved to localStorage. |
