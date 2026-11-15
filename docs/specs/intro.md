# Intro crossfade (`/intro`)

The app's opening moment: a short sunrise video that crossfades into the home screen.
Tests: `tests/intro/`.

| ID | Behaviour |
|----|-----------|
| INTRO-1 | `/intro` plays `/intro-sunrise.mp4` muted, inline and autoplaying. |
| INTRO-2 | When under 0.6s of video remain (or on `ended`), home fades in over 0.9s while the video fades out. The video is paused once done. |
| INTRO-3 | Tapping/clicking anywhere during the intro skips to home with a 0.25s cut. The whole screen is one button labelled "Skip intro"; a "tap to skip" hint shows. |
| INTRO-4 | If the video errors, `play()` is rejected (autoplay blocked), or it has not loaded (`readyState < HAVE_CURRENT_DATA`) 4s after mount, go to home with a 0.25s cut. |
| INTRO-5 | The transition to home happens once; later events are ignored. |
| INTRO-6 | Under `prefers-reduced-motion`, all fades are 0.2s. |
| INTRO-7 | Home is the Home — Your Circles screen (`docs/specs/home.md`). It is `inert` until the intro is done, so it can't be focused under the video. |
| INTRO-8 | At 768px and up the video plays in a centered full-height 1170:2532 column, and a blurred, darkened, enlarged, `aria-hidden` copy of the video fills the sides. Below 768px the video fills the screen with no backdrop. |

INTRO-6 and the visual parts of INTRO-8 are CSS media behaviour that jsdom can't evaluate. The tests assert the classes are present, and the real behaviour is checked by hand in a browser.
