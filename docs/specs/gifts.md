# Gifts

A paid way to send one framed photo and a handwritten postcard to one person. Built from the designer's gift reference (phone, 390 wide).
The rules are plain TypeScript in `src/app/intro/gifts/`, so the mobile app can import them unchanged.
TODO(server): gifts are saved in this browser. Nothing reaches another person yet.
Tests: `tests/gifts/`.

Phase 1 is the gift maker. Checkout, unwrapping, the shelf and the mailbox come next.

| ID | Behaviour |
|----|-----------|
| GIFT-1 | **Way in.** The Me tab's "gifts" pill opens the gifts view: an empty shelf and a "send a gift" button, which opens the gift maker full screen. |
| GIFT-2 | **Five steps.** To, Photo, Frame, Note, Wrap, shown as chips. The current chip is filled, finished ones are ticked. "Next" moves on only when the step is complete; Back keeps everything. A chip opens any step up to the first unfinished one. Tap targets are at least 44px. |
| GIFT-3 | **Live card.** The gift shows above each step as it's made: the postcard on To and Note, the framed photo on Photo and Frame, the wrapped gift on Wrap. "turn it over" and "see the photo" flip between photo and postcard. Under reduced motion the flip is instant. |
| GIFT-4 | **To.** "Who's it for?" lists "your nest", then "branches", from Your circle, then an "everyone" button for the rest. Search covers everyone. With nobody to pick, it says so. Picking someone sets the title to "A gift for ‹name›". |
| GIFT-5 | **Photo.** The newest photos from Daily 5's pools, 30 at a time with "Show more". With no photos, it says so and offers Daily 5. |
| GIFT-6 | **Frame.** Classic, Instant, Album, Film, Wood or November, and a "Date stamp" toggle. The stamp uses the photo's capture date. A photo dated only by its file can't have one (`docs/specs/daily5.md`, D5-4), so the toggle is off and disabled, with a line saying why. Instant also has the date written under the photo. |
| GIFT-7 | **Note.** "Write on the back": up to 140 characters, with a counter, cut off at the limit, and an emoji counts as one. It writes onto the postcard as you type, in a choice of handwriting and ink, with a choice of stamp. The note may be empty. The postcard is signed with the sender's name. |
| GIFT-8 | **Wrap.** A pattern, a ribbon color, and "right away" or "on a day". A chosen day must be after today. The wrapped gift's tag reads "to ‹name›", plus "open ‹date›" for a chosen day. The button is "Review gift". TODO(re-evaluate when checkout is built): it's off until then. |
| GIFT-9 | **Never lost.** From the moment a person is picked, the gift is saved after every change, under `nowandthen.gifts.v1` plus the demo suffix (`docs/specs/demo.md`, DEMO-3). Closing the maker keeps it, and "send a gift" picks it up on the same step. Saving goes through `GiftStore`, whose methods are async. |
| GIFT-10 | **Catalog.** A gift stores ids for its frame, handwriting, ink, stamp, wrap and ribbon, never their looks. Every catalog item says whether it's free or paid. All are free for now. |
| GIFT-11 | **Analysis.** Gifts made and abandoned are recorded through `GiftEvents`, under `nowandthen.giftEvents.v1` plus the demo suffix. A gift is made when a person is first picked, and abandoned when the maker closes with it unsent. Our own data only, nothing third-party. Never shown to anyone in the app. |
| GIFT-12 | **Portable.** The logic files in `src/app/intro/gifts/` use no React or browser APIs. Only the localStorage adapters, the hook and the client may. |

Frames, wraps and stamps are drawn with SVG and plain styles, with no CSS filters or repeating gradients, so they port to React Native. The look is checked by hand against the reference; the tests pin structure.
