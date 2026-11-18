# Group colors

Every group has one shared color. Each person's screen keeps their groups apart with shades of that color, and anyone can recolor a group on their own screen only.
The logic is plain TypeScript in `src/app/intro/colors/`, so the mobile app can import it unchanged.
Tests: `tests/group-colors/`.

| ID | Behaviour |
|----|-----------|
| COLOR-1 | **Palette.** 12 distinct colors, each with a base shade and two darker shades for clashes. A shade is a full palette (`canopy`, `shade`, `highlight`, `rim`), so views draw it without knowing about shades. |
| COLOR-2 | **Shades and cream.** Text and logos on a group's color are always cream. Base shades keep the designer's exact values, even where they fall below 4.5:1 against cream (orange, amber, green and blue do). The rule covers only the extra shades used for clashes: none may have worse contrast against cream than its own base, on `canopy` or `shade`, against either cream in use (`#FFF8EC`, `#FFF6DA`). A lighter shade always loses contrast against cream, so extra shades only go darker. |
| COLOR-3 | **Suggesting a color.** `suggestGroupColor(colorsUsedByMembers)` returns a color none of the group's members use in their other groups. If none is free, it returns the least-used one. Ties go to palette order, so the same input gives the same color. Unknown ids are ignored. TODO(re-evaluate when group creation exists): nothing calls it yet, because the app can't create a group. |
| COLOR-4 | **Member colors.** Colors already used by a group's members come through `MemberColorSource`. TODO(re-evaluate when member colors come from the server): the only source is a fake, fed from the placeholder data through `app-data.ts`, and empty with the demo switch off. |
| COLOR-5 | **Shades for the viewer.** `resolveColorsForViewer(myGroups, overrides)` gives every group its shared color. If two of the viewer's groups share a color, the earlier-joined one keeps the base shade and later ones step to the two darker shades in turn. A shift never changes the color. Ties on join date break by group id. |
| COLOR-6 | **Stable.** The result depends only on the groups and overrides, never on list order or the day. Joining a group never shifts a group already on the screen. Leaving a group can move a later group in that color to an earlier shade. With four or more groups in one color the shades repeat, because the color can't change. |
| COLOR-7 | **Personal override.** A viewer can recolor a group on their own screen. It changes nothing for other members. An overridden group gets the base shade of the color picked, and groups that weren't overridden shift around it. If two overridden groups pick one color, the earlier-joined keeps the base. Overrides for unknown colors or groups the viewer isn't in are ignored. |
| COLOR-8 | **Override storage.** Overrides sit behind `ColorOverrideStore`, whose `load` and `save` are async so mobile storage can replace it. On the web they live in localStorage under `nowandthen.groupColors.v1` plus the demo suffix (`docs/specs/demo.md`, DEMO-3). Missing, corrupt or blocked storage means no overrides, and never an error. |
| COLOR-9 | **Everywhere the same.** `AppClient` applies the resolved color once, so trees, group cards, logos, the group profile, the Daily 5 send and Archive outlines all show it. |
| COLOR-10 | **Color sheet.** On a group's profile, a "Color on my screen" button opens a dialog titled "‹Group› color" with one swatch per color, the current one pressed, and the line "Only you see this." Tapping a swatch applies it and closes the dialog. With an override set, "Use group color" clears it. Tap targets are at least 44px. |
| COLOR-11 | **Portable.** Files in `src/app/intro/colors/` use no React or browser APIs, apart from the localStorage adapter and the thin React hook. |

Whether a shade looks right on a real screen is visual: jsdom can't show it. The tests pin the contrast, the separation and which shade each group gets, and the look is checked by hand in a browser.
