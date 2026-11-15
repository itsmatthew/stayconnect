# src/app/api

Route wiring only. Each `route.ts` binds a method to a handler in `src/server/http` and passes `deps()` (`deps.ts`: Clerk session and Neon, the only HTTP-side place that imports them).

- No logic, validation, or SQL here. Put it in `src/server/http` so it can be tested without Next.
- Use relative imports: vitest has no `@/` alias, and the wiring test imports these files.
- The database opens on first query, so a signed-out request never touches it.
- Next 16: read `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` first. Dynamic `[id]` routes must `await ctx.params`.
