"use client";

import { useRef, type ReactNode } from "react";
import { IntroCrossfadeView } from "@/components/intro/intro-crossfade-view";
import { useIntroSequence } from "./use-intro-sequence";

export function IntroClient({ home }: { home: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const backdropRef = useRef<HTMLVideoElement>(null);
  const { phase, fast, skip } = useIntroSequence(videoRef, backdropRef);

  return (
    <IntroCrossfadeView
      phase={phase}
      fast={fast}
      onSkip={skip}
      videoRef={videoRef}
      backdropRef={backdropRef}
      home={home}
    />
  );
}
