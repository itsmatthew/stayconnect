# components/me

The Me tab as pure views (spec: `docs/specs/me.md`): `me-screen.tsx` (posts / year / gifts pills from the Me reference, then the grid), `gift-shelf.tsx` (the gifts view, `docs/specs/gifts.md`: gifts stand in its cubbies, two rows showing and more scrolling, GIFT-21; `landing` drops one in, GIFT-23), `shelf-gift-view.tsx` (one, big), `year-select.tsx`, `sixty-five-grid.tsx` (3 columns, edge to edge; year 3×2, months 2×2 with the reference's gold frame, weeks 1×1, dense flow). Above them, `profile-header.tsx` (you now and then with your name between, the line about you and five questions, edited in place with `InlineText`, ME-5 to ME-7) and `memories-row.tsx` (three memories that made you, and `MemorySheet` to change one, ME-8). The memories have no design: they reuse the header's ornaments and thread.

Filled tiles are buttons that open `tile-viewer.tsx` (photo and caption, read-only, ME-4).
