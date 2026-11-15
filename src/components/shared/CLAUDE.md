# components/shared

Pure views used by more than one feature: `sheet.tsx` (bottom sheet frame, photo picker, changed line, Cancel/Save) and `photo-cropper.tsx` (round react-easy-crop with a Zoom slider, `docs/specs/group-logo.md`, LOGO-7). Used by the ornament sheet (`../home/`) and the logo sheet (`../messages/`).

- The cropper only reports an area once it has measured the photo, which jsdom never does unless a test stubs the sizes (`tests/group-logo/photo-cropper.test.tsx`). Callers must accept a missing area: the app then keeps the centered square.
