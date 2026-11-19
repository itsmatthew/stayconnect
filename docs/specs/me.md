# Me

Your own 65 Archive posts for a year, built from the designer's Me reference (phone, 390×844).
Tests: `tests/me/`.

Your profile sits above the posts: the designer's "now and then" header, one line about you and five questions (Me.dc.html), then three self-defining memories (Jackson's plan; no design yet, built from the header's ornaments). Its text is saved in this browser (`nowandthen.profile.v1`, with the demo suffix, DEMO-3) and its photos with the ornaments (`nowandthen-ornaments`). TODO(server): `GET`/`PUT /api/me/profile`.

| ID | Behaviour |
|----|-----------|
| ME-1 | **Pill row.** "posts" (current page), a year dropdown labelled "Year, 2026" (`aria-haspopup="listbox"`) listing the current year and every year you've posted in, newest first, and "gifts", which opens the gifts view (`docs/specs/gifts.md`, GIFT-1). |
| ME-2 | **The 65 grid** for the selected year, three columns, edge to edge, no gaps. The yearly tile comes first and is the largest (3 columns × 2 rows). Then January to December: each month's tile (2×2, gold frame) followed by its weekly tiles (1×1). A week belongs to the month its Thursday falls in (`docs/specs/archive.md`, ARC-2). In a 53-week year a bonus tile, with its own look, comes last. Tiles carry their size (`data-size`: `year`, `month`, `week`, `bonus`) and a label: "2026", "October", "Week 43", "Bonus week". |
| ME-3 | **Empty slots** wait to be filled: dashed, labelled ("Week 43, waiting to be filled"). A filled slot shows your photo (or placeholder art). |
| ME-4 | **Opening a tile.** A filled tile is a button; it opens a dialog named after the slot ("Week 42") with your photo and its caption, if any (`docs/specs/archive.md`, ARC-13), read-only, and a "Close" button. Empty tiles don't open. |
| ME-5 | **Now and then.** Two ornaments, 80 across, strung on one dotted thread with your name between them (TODO(server): your profile's name; "you" until then). Left is you **now**, ringed red; right is you **then**, as a kid, ringed blue. An empty one is a dashed ring with "+ now" / "+ then". Tapping one picks a photo ("Add a photo of you now" / "Add a photo of you as a kid"; "Change…" once there is one), saved at once, downscaled. |
| ME-6 | **A line about you.** Under them, one line you write, at most 60 characters, or "Write a line about you". Tapping it edits it in place; Enter or leaving the field saves it, Escape keeps what was there. Spaces are tidied and an empty line clears it. |
| ME-7 | **Five questions.** Under the line, five questions with their answers, wrapping: first this week's question, with a navy badge showing the week number ("This week’s question", ISO weeks as in ARC-2), then four that always stay: "Smells like childhood?" (red), "Wish I could feel again?" (orange), "My spot growing up?" (green) and "Hill I’d die on?" (blue). A question without an answer reads "tap to answer". Answers are at most 40 characters and edit like the line (ME-6). This week's answer belongs to its week: next week's question starts unanswered. TODO(design): the weekly bank is a stand-in until the designer's list. |
| ME-8 | **Memories that made me.** Under the questions, three ornaments, 64 across, on a thread, each with its caption under it. An empty one is a dashed "+" ("Add a memory that made you who you are"). Tapping one opens "A memory that made you who you are": the photo (pick one, then crop it square), a caption (at most 40), and who sees it, "Everyone in my circles" (the default) or "Only my nest". Save keeps it; Cancel changes nothing. A nest-only memory says "nest" under it. |
| ME-9 | **Gifts count.** The gifts pill shows how many gifts are on your shelf. |

