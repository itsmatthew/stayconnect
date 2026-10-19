import { useEffect } from "react";
import { FRAUNCES, NAVY, PAPER, s } from "../home/units";
import { FILM } from "./polaroid";

/** How long the whole send moment lasts: the fly-off (0.9s), then "Sent ✓" pops and fades. */
export const SENT_FLIGHT_MS = 2400;

/** Step 3 of the reference: the photo flies off, then a brief "Sent ✓". */
export function SentFlight({ src, onDone }: { src: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, SENT_FLIGHT_MS);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div data-sent-flight="" style={{ position: "fixed", inset: 0, zIndex: 20, pointerEvents: "none" }}>
      <div
        className="sd-anim"
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, background: "rgba(27,31,52,.55)", animation: "sd-fade .3s ease both, sd-out .5s ease 1.9s forwards" }}
      />
      <div
        data-fly=""
        className="sd-anim"
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: "18%",
          marginLeft: s(-181),
          width: s(362),
          boxSizing: "border-box",
          padding: s(14),
          paddingBottom: s(76),
          borderRadius: s(4),
          background: "#FDFBF5",
          boxShadow: `0 ${s(10)} ${s(20)} rgba(0,0,0,.4)`,
          animation: "sd-fly .9s cubic-bezier(.5,0,.7,.4) both",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- local blob: URL */}
        <img src={src} alt="" style={{ display: "block", width: "100%", height: s(334), objectFit: "cover", filter: FILM }} />
      </div>
      <div
        role="status"
        className="sd-anim"
        style={{
          position: "absolute",
          left: "50%",
          top: "40%",
          translate: "-50% 0",
          padding: `${s(12)} ${s(26)}`,
          borderRadius: s(26),
          background: PAPER,
          border: `${s(2)} solid ${NAVY}`,
          color: NAVY,
          fontFamily: FRAUNCES,
          fontWeight: 800,
          fontSize: s(22),
          letterSpacing: s(-0.3),
          animation: "sd-pop .5s cubic-bezier(.2,1.3,.4,1) .75s both, sd-out .5s ease 1.9s forwards",
        }}
      >
        Sent ✓
      </div>
    </div>
  );
}
