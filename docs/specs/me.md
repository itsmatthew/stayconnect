# Me

Your own 65 Archive posts for a year, built from the designer's Me reference (phone, 390×844).
Profile ornaments, name and bio from the reference come later (TODO). Tests: `tests/me/`.

| ID | Behaviour |
|----|-----------|
| ME-1 | **Pill row.** "posts" (current page), a year dropdown labelled "Year, 2026" (`aria-haspopup="listbox"`) listing the current year and every year you've posted in, newest first, and "gifts", shown disabled until it's designed (TODO). |
| ME-2 | **The 65 grid** for the selected year, three columns, edge to edge, no gaps. The yearly tile comes first and is the largest (3 columns × 2 rows). Then January to December: each month's tile (2×2, gold frame) followed by its weekly tiles (1×1). A week belongs to the month its Thursday falls in (`docs/specs/archive.md`, ARC-2). In a 53-week year a bonus tile, with its own look, comes last. Tiles carry their size (`data-size`: `year`, `month`, `week`, `bonus`) and a label: "2026", "October", "Week 43", "Bonus week". |
| ME-3 | **Empty slots** wait to be filled: dashed, labelled ("Week 43, waiting to be filled"). A filled slot shows your photo (or placeholder art). |
| ME-4 | **Opening a tile.** A filled tile is a button; it opens a dialog named after the slot ("Week 42") with your photo and its caption, if any (`docs/specs/archive.md`, ARC-13), read-only, and a "Close" button. Empty tiles don't open. |
