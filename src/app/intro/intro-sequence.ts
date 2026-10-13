// Pure state machine for the intro (docs/specs/intro.md). No React, no DOM.

/** Start the crossfade this many seconds before the video ends, so it never sits on a frozen last frame. */
export const NEAR_END_S = 0.6;
/** If the video hasn't loaded by now, go straight to home. */
export const LOAD_TIMEOUT_MS = 4000;
/** HTMLMediaElement.HAVE_CURRENT_DATA */
const HAVE_CURRENT_DATA = 2;

export type IntroState = { phase: "playing" | "done"; fast: boolean };

export type IntroEvent =
  | { type: "progress"; currentTime: number; duration: number }
  | { type: "ended" }
  | { type: "skip" }
  | { type: "error" }
  | { type: "playRejected" }
  | { type: "loadTimeout"; readyState: number };

export const initialIntro: IntroState = { phase: "playing", fast: false };

const finish = (fast: boolean): IntroState => ({ phase: "done", fast });

export function introReducer(state: IntroState, event: IntroEvent): IntroState {
  if (state.phase === "done") return state;
  switch (event.type) {
    case "progress":
      return event.duration - event.currentTime < NEAR_END_S ? finish(false) : state;
    case "ended":
      return finish(false);
    case "skip":
    case "error":
    case "playRejected":
      return finish(true);
    case "loadTimeout":
      return event.readyState < HAVE_CURRENT_DATA ? finish(true) : state;
  }
}
