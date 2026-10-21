# components/daily5

Daily 5 as pure views (spec: `docs/specs/daily5.md`): `daily5-screen.tsx` → `polaroid.tsx`, `photo-pools.tsx`, `send-sheet.tsx`, `sent-flight.tsx`.

- Colours, tilts, sizes and the film filter are copied from the designer's Daily 5 / send references. Don't "tidy" the numbers.
- Exception: the polaroid frame is deliberately neutral (cream, navy outline), not the reference's cycling colours, because colour means a group everywhere else. The only colour a polaroid takes is the recipient circle's, during the send (`sd-tint`).
- Send animations live in `daily5.css` (`sd-` prefix, opt in with class `sd-anim`, reduced-motion aware). `SENT_FLIGHT_MS` is the whole send moment; the tests pin it.
- The screen holds only UI state (which card is being sent, the flight). Photos, pools and sending come in through props.
- Put `display` in classes, not inline styles, on anything using `md:hidden`: an inline style beats the class.
