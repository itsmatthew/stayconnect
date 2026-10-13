import type { ReactNode, Ref } from "react";

const VIDEO_SRC = "/intro-sunrise.mp4";

type IntroCrossfadeViewProps = {
  phase: "playing" | "done";
  /** Skip/failure: cut quickly instead of the natural crossfade. */
  fast: boolean;
  onSkip: () => void;
  videoRef: Ref<HTMLVideoElement>;
  backdropRef?: Ref<HTMLVideoElement>;
  /** Shown underneath the video, faded in when the intro is done. */
  home: ReactNode;
};

export function IntroCrossfadeView({ phase, fast, onSkip, videoRef, backdropRef, home }: IntroCrossfadeViewProps) {
  const done = phase === "done";
  const fade = `transition-opacity ${fast ? "duration-250" : "duration-900"} ease-in-out motion-reduce:duration-200`;

  return (
    <div
      data-intro={phase}
      data-fast={String(fast)}
      className="relative isolate h-dvh w-full overflow-hidden bg-black"
    >
      <div className={`absolute inset-0 ${fade} ${done ? "opacity-100" : "opacity-0"}`}>{home}</div>

      {/* Wide screens: a blurred, darkened, enlarged copy fills the sides of the portrait column. */}
      <video
        ref={backdropRef}
        src={VIDEO_SRC}
        aria-hidden="true"
        tabIndex={-1}
        muted
        playsInline
        autoPlay
        preload="auto"
        className={`absolute inset-0 hidden h-full w-full scale-125 object-cover blur-2xl brightness-50 md:block ${fade} ${done ? "opacity-0" : "opacity-100"}`}
      />

      <video
        ref={videoRef}
        src={VIDEO_SRC}
        muted
        playsInline
        autoPlay
        preload="auto"
        className={`absolute inset-0 h-full w-full object-cover md:left-1/2 md:right-auto md:aspect-[1170/2532] md:w-auto md:-translate-x-1/2 ${fade} ${done ? "opacity-0" : "opacity-100"}`}
      />

      {!done && (
        <>
          {/* During the intro, the whole screen is the skip button. */}
          <button
            type="button"
            aria-label="Skip intro"
            onClick={onSkip}
            className="absolute inset-0 z-10 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-amber-300"
          />
          <span className="pointer-events-none absolute bottom-[calc(22px+env(safe-area-inset-bottom,0px))] left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/50 bg-[#141a2e]/40 px-4 py-1.5 text-[13px] font-semibold text-white">
            tap to skip
          </span>
        </>
      )}
    </div>
  );
}
