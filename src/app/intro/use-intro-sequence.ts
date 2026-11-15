"use client";

import { useCallback, useEffect, useReducer, type RefObject } from "react";
import { initialIntro, introReducer, LOAD_TIMEOUT_MS } from "./intro-sequence";

/** Wires the intro video's media events into the pure introReducer. */
export function useIntroSequence(
  videoRef: RefObject<HTMLVideoElement | null>,
  backdropRef?: RefObject<HTMLVideoElement | null>,
) {
  const [state, dispatch] = useReducer(introReducer, initialIntro);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () =>
      dispatch({ type: "progress", currentTime: video.currentTime, duration: video.duration });
    const onEnded = () => dispatch({ type: "ended" });
    const onError = () => dispatch({ type: "error" });
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);

    // Autoplay can be blocked; then show home rather than a still frame.
    video.play()?.catch(() => dispatch({ type: "playRejected" }));
    // Never strand the viewer on a black screen.
    const timer = setTimeout(() => dispatch({ type: "loadTimeout", readyState: video.readyState }), LOAD_TIMEOUT_MS);

    return () => {
      clearTimeout(timer);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
    };
  }, [videoRef]);

  useEffect(() => {
    if (state.phase !== "done") return;
    videoRef.current?.pause();
    backdropRef?.current?.pause();
  }, [state.phase, videoRef, backdropRef]);

  const skip = useCallback(() => dispatch({ type: "skip" }), []);
  return { ...state, skip };
}
